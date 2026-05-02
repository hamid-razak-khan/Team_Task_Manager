const express = require('express');
const Message = require('../models/Message');
const Task = require('../models/Task');
const Chat = require('../models/Chat');
const ChatMessage = require('../models/ChatMessage');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

// POST /api/messages — Member sends a message to Admin
router.post('/', auth, async (req, res) => {
  try {
    const { content, taskId, recipientId: explicitRecipientId } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content cannot be empty.' });
    }

    // 1. Find the task to verify and optionally get the project admin
    const task = await Task.findById(taskId).populate('project');
    if (!task) return res.status(404).json({ error: 'Task not found' });
    
    const recipientId = explicitRecipientId || task.project.admin;
    
    if (recipientId.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: "You cannot message yourself." });
    }

    // 2. Find or create DM chat between sender and recipient
    let chat = await Chat.findOne({
      isGroup: false,
      members: { $all: [req.user._id, recipientId] }
    });

    if (!chat) {
      chat = await Chat.create({
        isGroup: false,
        members: [req.user._id, recipientId]
      });
    }

    // 3. Send the ChatMessage with task reference
    const chatMsg = await ChatMessage.create({
      chatId: chat._id,
      senderId: req.user._id,
      text: content.trim(),
      taskRef: {
        taskId: task._id,
        taskTitle: task.title
      }
    });
    
    await chatMsg.populate('senderId', 'name');
    
    // Update chat for sorting
    await Chat.findByIdAndUpdate(chat._id, { updatedAt: new Date() });

    // 4. Emit to socket rooms
    const { io } = require('../index'); 
    if (io) {
      chat.members.forEach(mId => {
        io.to(`user:${mId.toString()}`).emit('receive_message', chatMsg);
      });
    }

    // Also create legacy message for backward compatibility if any list still uses it
    const legacyMessage = await Message.create({
      sender:     req.user._id,
      senderName: req.user.name,
      taskId:     taskId || null,
      taskTitle:  task.title || '',
      content:    content.trim(),
    });

    res.status(201).json(legacyMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/messages — Admin fetches all messages
router.get('/', [auth, roleCheck(['Admin'])], async (req, res) => {
  try {
    const messages = await Message.find()
      .sort({ createdAt: -1 })
      .populate('sender', 'name email')
      .populate('taskId', 'title');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/messages/unread-count — Admin gets unread count
router.get('/unread-count', [auth, roleCheck(['Admin'])], async (req, res) => {
  try {
    const count = await Message.countDocuments({ read: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/messages/:id/read — Admin marks a message as read
router.put('/:id/read', [auth, roleCheck(['Admin'])], async (req, res) => {
  try {
    const msg = await Message.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/messages/mark-all/read — Admin marks all messages as read
router.put('/mark-all/read', [auth, roleCheck(['Admin'])], async (req, res) => {
  try {
    await Message.updateMany({ read: false }, { read: true });
    res.json({ message: 'All messages marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
