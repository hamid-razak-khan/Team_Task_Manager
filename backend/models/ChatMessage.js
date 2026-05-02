const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  chatId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:     { type: String },
  fileUrl:  { type: String },
  fileName: { type: String },
  fileType: { type: String },
  readBy:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  taskRef: {
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    taskTitle: String
  },
  isSystem: { type: Boolean, default: false }
}, { timestamps: true });

// Fast reads: messages by chat sorted by time
chatMessageSchema.index({ chatId: 1, createdAt: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
