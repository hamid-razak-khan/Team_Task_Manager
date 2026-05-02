const express = require('express');
const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Chat = require('../models/Chat');
const ChatMessage = require('../models/ChatMessage');
const { sendEmail, taskAssignedEmail } = require('../utils/email');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    let filter = { organizationId: req.user.organizationId };
    if (req.user.role !== 'Admin') {
      filter.assignedTo = req.user._id;
    }
    const tasks = await Task.find(filter).populate('project', 'name').populate('assignedTo', 'name email');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', [auth, roleCheck(['Admin'])], async (req, res) => {
  try {
    const { title, description, project, assignedTo, status, deadline, attachments } = req.body;
    const task = new Task({ title, description, organizationId: req.user.organizationId, project, assignedTo, status, deadline, attachments, assignedAt: new Date() });
    await task.save();

    // Populate project name for email
    await task.populate('project', 'name');

    if (assignedTo && assignedTo.length > 0) {
      // Fetch user details for all assigned members
      const assignedUsers = await User.find({ _id: { $in: assignedTo } }, 'name email');

      await Promise.all(assignedUsers.map(async (member) => {
        // 1. Create in-app notification
        const notif = await Notification.create({
          userId: member._id,
          message: `📋 You have been assigned a new task: "${title}"`,
          type: 'task_assigned',
          relatedId: task._id,
          read: false,
          emailSent: false
        }).catch(() => null);

        // 2. Send email (only if notification was freshly created)
        if (notif) {
          const { subject, html } = taskAssignedEmail({
            userName: member.name,
            taskTitle: title,
            projectName: task.project?.name,
            deadline
          });
          const sent = await sendEmail(member.email, subject, html);
          if (sent) await Notification.findByIdAndUpdate(notif._id, { emailSent: true });
        }
      }));
    }

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    // Fetch old task to detect status change
    const oldTask = await Task.findById(req.params.id);
    if (!oldTask) return res.status(404).json({ error: 'Task not found' });

    let updates = req.body;
    if (req.user.role !== 'Admin') {
       updates = { status: req.body.status, attachments: req.body.attachments }; 
    }

    // ── Notify admins when a member marks task as Completed ──────────────────
    const newStatus = updates.status;
    const statusChanged = newStatus === 'Completed' && oldTask.status !== 'Completed';

    if (statusChanged) {
      updates.completedAt = new Date();
    } else if (newStatus && newStatus !== 'Completed' && oldTask.status === 'Completed') {
      updates.completedAt = null;
    }

    const task = await Task.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('project', 'name')
      .populate('assignedTo', 'name email');

    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (statusChanged) {
      const admins = await User.find({ role: 'Admin' }, '_id');
      const memberName = req.user.name;
      const taskTitle = task.title;

      await Promise.all(admins.map(admin =>
        Notification.create({
          userId:    admin._id,
          message:   `✅ ${memberName} completed the task: "${taskTitle}"`,
          type:      'task_completed',
          relatedId: task._id,
          read:      false,
        }).catch(() => null) // ignore duplicates
      ));

      // ── Notify in project group chat ─────────────────────────────────────────
      if (task.project) {
        try {
          const groupChat = await Chat.findOne({ projectId: task.project._id, isGroup: true });
          if (groupChat) {
            const { io } = require('../index'); // Require here to avoid circular dep
            
            const msg = await ChatMessage.create({
              chatId: groupChat._id,
              senderId: req.user._id,
              text: `✅ ${req.user.name} completed the task: "${taskTitle}"`,
              isSystem: true
            });
            await msg.populate('senderId', 'name');
            
            await Chat.findByIdAndUpdate(groupChat._id, { updatedAt: new Date() });
            
            if (io) {
              groupChat.members.forEach(memberId => {
                io.to(`user:${memberId.toString()}`).emit('receive_message', msg);
              });
            }
          }
        } catch (chatErr) {
          console.error('Error notifying group chat:', chatErr.message);
        }
      }
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', [auth, roleCheck(['Admin'])], async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
