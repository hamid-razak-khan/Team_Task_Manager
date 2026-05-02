const express = require('express');
const Chat = require('../models/Chat');
const ChatMessage = require('../models/ChatMessage');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/chats/init-projects — ensure group chats exist for all user's projects
router.post('/init-projects', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    // All projects where user is admin or member
    const projects = await Project.find({
      $or: [{ admin: userId }, { members: userId }]
    });

    await Promise.all(projects.map(async (project) => {
      const existing = await Chat.findOne({ projectId: project._id, isGroup: true });
      if (!existing) {
        const allMembers = [
          project.admin.toString(),
          ...project.members.map(m => m.toString())
        ];
        await Chat.create({
          projectId: project._id,
          isGroup: true,
          name: project.name,
          members: [...new Set(allMembers)],
        });
      } else {
        // Sync name if project was renamed
        if (existing.name !== project.name) {
          await Chat.findByIdAndUpdate(existing._id, { name: project.name });
        }
      }
    }));

    res.json({ message: 'Project chats initialized', count: projects.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chats/users — users the current user can DM (shares a project with)
router.get('/users', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const projects = await Project.find({
      $or: [{ admin: userId }, { members: userId }]
    }).populate('admin members', 'name email role');

    const seen = new Set([userId.toString()]);
    const users = [];
    for (const p of projects) {
      const all = [p.admin, ...p.members];
      for (const u of all) {
        if (u && !seen.has(u._id.toString())) {
          seen.add(u._id.toString());
          users.push(u);
        }
      }
    }
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chats — get or create 1:1 chat between current user and another
router.post('/', auth, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const me = req.user._id;

    // Look for existing 1:1 chat
    let chat = await Chat.findOne({
      isGroup: false,
      members: { $all: [me, targetUserId], $size: 2 },
    });

    if (!chat) {
      chat = await Chat.create({ members: [me, targetUserId], isGroup: false });
    }

    await chat.populate('members', 'name email role');
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chats — list all chats for current user with last message
router.get('/', auth, async (req, res) => {
  try {
    const chats = await Chat.find({ members: req.user._id })
      .populate('members', 'name email role')
      .populate('projectId', 'name')
      .sort({ updatedAt: -1 });

    // Attach last message to each chat
    const enriched = await Promise.all(chats.map(async (chat) => {
      const lastMsg = await ChatMessage.findOne({ chatId: chat._id })
        .sort({ createdAt: -1 })
        .populate('senderId', 'name');
      return { ...chat.toObject(), lastMessage: lastMsg || null };
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chats/messages/:chatId — paginated messages (20 per page)
router.get('/messages/:chatId', auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 20;

    // Security: verify user is member
    const chat = await Chat.findOne({ _id: chatId, members: req.user._id });
    if (!chat) return res.status(403).json({ error: 'Access denied' });

    const messages = await ChatMessage.find({ chatId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('senderId', 'name');

    res.json(messages.reverse()); // return in chronological order
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chats/messages — REST fallback to send a message
router.post('/messages', auth, async (req, res) => {
  try {
    const { chatId, text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Message cannot be empty' });

    const chat = await Chat.findOne({ _id: chatId, members: req.user._id });
    if (!chat) return res.status(403).json({ error: 'Access denied' });

    const msg = await ChatMessage.create({
      chatId,
      senderId: req.user._id,
      text: text.trim(),
    });

    // Update chat timestamp
    await Chat.findByIdAndUpdate(chatId, { updatedAt: new Date() });
    await msg.populate('senderId', 'name');
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
