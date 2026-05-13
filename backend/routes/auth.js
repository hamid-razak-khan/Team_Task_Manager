const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Invite = require('../models/Invite');
const { sendEmail } = require('../utils/email');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const tokenParam = req.query.token;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: 'User already registered.' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let role = 'Admin';
    let organizationId = null;

    if (tokenParam) {
      // Invite flow
      const invite = await Invite.findOne({ token: tokenParam, used: false, expiresAt: { $gt: new Date() } });
      if (!invite) return res.status(400).json({ error: 'Invalid or expired invite token.' });
      if (invite.email !== email) return res.status(400).json({ error: 'Email does not match invite.' });

      role = invite.role;
      organizationId = invite.organizationId;
      invite.used = true;
      await invite.save();
    } else {
      // Normal flow (First user)
      const orgId = crypto.randomUUID();
      const org = new Organization({ name: `${name}'s Organization`, orgId });
      await org.save();
      organizationId = org._id;
    }

    user = new User({ name, email, password: hashedPassword, role, organizationId });
    await user.save();

    if (!tokenParam) {
      await Organization.findByIdAndUpdate(organizationId, { createdBy: user._id });
    }

    const token = jwt.sign(
      { _id: user._id, role: user.role, name: user.name, organizationId: user.organizationId }, 
      process.env.JWT_SECRET || 'supersecretjwtkey_123456', 
      { expiresIn: '7d' }
    );
    
    res.cookie('token', token, { 
      httpOnly: true, 
      secure: true, 
      sameSite: 'none', 
      maxAge: 7 * 24 * 60 * 60 * 1000 
    });
    
    res.json({ user: { _id: user._id, name: user.name, email: user.email, role: user.role, organizationId: user.organizationId } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid email or password.' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid email or password.' });

    const token = jwt.sign(
      { _id: user._id, role: user.role, name: user.name, organizationId: user.organizationId }, 
      process.env.JWT_SECRET || 'supersecretjwtkey_123456', 
      { expiresIn: '7d' }
    );
    
    res.cookie('token', token, { 
      httpOnly: true, 
      secure: true, 
      sameSite: 'none', 
      maxAge: 7 * 24 * 60 * 60 * 1000 
    });
    
    res.json({ user: { _id: user._id, name: user.name, email: user.email, role: user.role, organizationId: user.organizationId } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'none' });
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users', require('../middleware/auth'), async (req, res) => {
  try {
    const users = await User.find({ organizationId: req.user.organizationId }).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    // Do not reveal if user exists or not for security
    if (!user) {
      return res.json({ message: 'If email exists, reset link has been sent' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // Priority: FRONTEND_URL (env) > Deployment link > Localhost
    const baseUrl = (process.env.FRONTEND_URL || 'https://team-task-manager-chi-one.vercel.app').replace(/\/+$/, '');
    const resetLink = `${baseUrl}/reset-password/${resetToken}`;
    
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
        <h2>Password Reset Request</h2>
        <p>You requested to reset your TaskMaster password.</p>
        <p>Click the link below to set a new password:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #8b5cf6; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link expires in 60 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `;

    // Send asynchronously so UI doesn't hang
    sendEmail(user.email, "Password Reset Request", html)
      .catch(err => console.error('Forgot password email failed:', err));

    res.json({ message: 'If email exists, reset link has been sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    
    await user.save();

    res.json({ message: 'Password has been successfully reset. You can now log in.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
