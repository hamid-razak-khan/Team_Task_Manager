const express = require('express');
const Notification = require('../models/Notification');
const Task = require('../models/Task');
const User = require('../models/User');
const { sendEmail, deadlineAlertEmail } = require('../utils/email');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications — fetch unread notifications for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      userId: req.user._id, 
      read: false 
    }).sort({ createdAt: -1 }).limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notifications/mark-all/read — must be BEFORE /:id to avoid route conflict
router.put('/mark-all/read', auth, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notifications/:id — mark a single notification as read
router.put('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notifications/check-deadlines
// Called every 45s from frontend per user; creates in-app + email alerts only once
router.post('/check-deadlines', auth, async (req, res) => {
  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find non-completed tasks for this user due within 24 hours
    const urgentTasks = await Task.find({
      assignedTo: req.user._id,
      status: { $ne: 'Completed' },
      deadline: { $gte: now, $lte: in24h }
    }).populate('project', 'name');

    const currentUser = await User.findById(req.user._id, 'name email');
    let created = 0;

    for (const task of urgentTasks) {
      try {
        // Create notification — will throw if duplicate (unique index)
        const notif = await Notification.create({
          userId: req.user._id,
          message: `⚠️ Task "${task.title}" is due in less than 24 hours!`,
          type: 'deadline_alert',
          relatedId: task._id,
          read: false,
          emailSent: false
        });
        created++;

        // Send deadline email only once
        if (currentUser && !notif.emailSent) {
          const { subject, html } = deadlineAlertEmail({
            userName: currentUser.name,
            taskTitle: task.title,
            projectName: task.project?.name,
            deadline: task.deadline
          });
          sendEmail(currentUser.email, subject, html)
            .then(sent => {
              if (sent) Notification.findByIdAndUpdate(notif._id, { emailSent: true }).exec();
            })
            .catch(err => console.error('Deadline email failed:', err));
        }
      } catch (dupErr) {
        // Duplicate — notification already exists, skip silently
      }
    }

    res.json({ checked: urgentTasks.length, created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
