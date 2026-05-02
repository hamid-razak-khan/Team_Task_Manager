const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName:  { type: String, required: true },
  taskId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  taskTitle:   { type: String, default: '' },
  content:     { type: String, required: true },
  read:        { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
