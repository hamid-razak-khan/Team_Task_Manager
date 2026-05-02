const express = require('express');
const crypto = require('crypto');
const Invite = require('../models/Invite');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// POST /api/invite
// Admins can invite
router.post('/', [auth, roleCheck(['Admin'])], async (req, res) => {
  try {
    const { email } = req.body;
    const role = 'Member';

    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const invite = new Invite({
      email,
      organizationId: req.user.organizationId,
      role,
      token,
      expiresAt
    });

    await invite.save();

    const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const joinLink = `${baseUrl}/join?token=${token}`;

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
        <h2>You're invited to join TaskMaster!</h2>
        <p>You have been invited as a <strong>${role}</strong>.</p>
        <p>Click the link below to accept your invitation and create your account:</p>
        <a href="${joinLink}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">Join Now</a>
        <p>This link expires in 24 hours.</p>
      </div>
    `;

    // Send email asynchronously in the background so the UI doesn't hang
    sendEmail(email, "You're invited to join TaskMaster", html)
      .catch(err => console.error('Background invite email failed:', err));

    res.json({ message: 'Invite sent successfully', invite });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/invite/:token
// Validate invite token
router.get('/:token', async (req, res) => {
  try {
    const invite = await Invite.findOne({ token: req.params.token, used: false, expiresAt: { $gt: new Date() } }).populate('organizationId', 'name');
    if (!invite) return res.status(400).json({ error: 'Invalid or expired invite token.' });

    res.json({ email: invite.email, role: invite.role, organizationName: invite.organizationId.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
