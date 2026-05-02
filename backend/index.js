require('dotenv').config();

// Force Google DNS to bypass system DNS refusing *.mongodb.net resolution
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const authRoutes         = require('./routes/auth');
const projectRoutes      = require('./routes/projects');
const taskRoutes         = require('./routes/tasks');
const notificationRoutes = require('./routes/notifications');
const messageRoutes      = require('./routes/messages');
const chatRoutes         = require('./routes/chats');
const uploadRoutes       = require('./routes/upload');
const analyticsRoutes    = require('./routes/analytics');
const inviteRoutes       = require('./routes/invite');

const Chat        = require('./models/Chat');
const ChatMessage = require('./models/ChatMessage');
const Notification = require('./models/Notification');

const app    = express();
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const cookieParser = require('cookie-parser');

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ── Socket.IO ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// JWT auth middleware for sockets
io.use((socket, next) => {
  const cookieHeader = socket.request.headers.cookie;
  let token = null;
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, curr) => {
      const [name, value] = curr.trim().split('=');
      acc[name] = value;
      return acc;
    }, {});
    token = cookies.token;
  }
  
  if (!token) return next(new Error('Authentication error'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey_123456');
    socket.user = decoded;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', async (socket) => {
  const userId = socket.user._id;

  // Join personal room
  socket.join(`user:${userId}`);

  // Join all chat rooms this user belongs to
  try {
    const chats = await Chat.find({ members: userId }, '_id');
    chats.forEach(c => socket.join(`chat:${c._id}`));
  } catch (e) {
    console.error('Socket join error:', e.message);
  }

  // ── send_message ────────────────────────────────────────────────────────────
  socket.on('send_message', async ({ chatId, text, fileUrl, fileName, fileType }) => {
    try {
      if (!text?.trim() && !fileUrl) return;

      // Security: user must belong to chat
      const chat = await Chat.findOne({ _id: chatId, members: userId });
      if (!chat) return;

      const msg = await ChatMessage.create({
        chatId,
        senderId: userId,
        text: text ? text.trim() : '',
        fileUrl,
        fileName,
        fileType
      });
      await msg.populate('senderId', 'name');

      // Update chat's updatedAt for ordering
      await Chat.findByIdAndUpdate(chatId, { updatedAt: new Date() });

      // Broadcast to all members individually (ensures delivery for newly created chats)
      chat.members.forEach(memberId => {
        io.to(`user:${memberId.toString()}`).emit('receive_message', msg);
      });

      // ── Group chat: notify offline members via in-app notification ────────
      if (chat.isGroup) {
        const otherMembers = chat.members
          .map(m => m.toString())
          .filter(m => m !== userId.toString());

        const previewText = text ? text.trim() : (fileUrl ? '📎 Sent a file' : '');
        const preview = previewText.length > 60
          ? previewText.slice(0, 60) + '…'
          : previewText;

        await Promise.all(otherMembers.map(memberId =>
          Notification.create({
            userId:    memberId,
            message:   `💬 ${socket.user.name} in "${chat.name}": ${preview}`,
            type:      'group_message',
            relatedId: chat._id,
            read:      false,
          }).catch(() => null) // ignore duplicates / errors
        ));
      }
    } catch (err) {
      console.error('send_message error:', err.message);
    }
  });

  // ── mark messages read ──────────────────────────────────────────────────────
  socket.on('mark_chat_read', async ({ chatId }) => {
    try {
      await ChatMessage.updateMany(
        { chatId, senderId: { $ne: userId } },
        { $addToSet: { readBy: userId } }
      );
      // Notify other users in the chat that messages were read
      const chat = await Chat.findById(chatId);
      if (chat) {
        chat.members.forEach(memberId => {
          io.to(`user:${memberId.toString()}`).emit('chat_read', { chatId, userId });
        });
      }
    } catch (err) {
      console.error('mark_chat_read error:', err.message);
    }
  });

  // ── typing indicators ───────────────────────────────────────────────────────
  socket.on('typing', ({ chatId }) => {
    socket.to(`chat:${chatId}`).emit('typing', {
      chatId,
      userId,
      name: socket.user.name,
    });
  });

  socket.on('stop_typing', ({ chatId }) => {
    socket.to(`chat:${chatId}`).emit('stop_typing', { chatId, userId });
  });

  socket.on('disconnect', () => {
    // rooms auto-cleaned by socket.io
  });
});

// ── DB ────────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/team-task-manager';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/projects',      projectRoutes);
app.use('/api/invite',        inviteRoutes);
app.use('/api/tasks',         taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages',      messageRoutes);
app.use('/api/chats',         chatRoutes);
app.use('/api/upload',        uploadRoutes);
app.use('/api/analytics',     analyticsRoutes);

app.get('/', (req, res) => res.send('Team Task Manager API is running'));

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Export io for use in routes (group chat creation)
module.exports = { io };
