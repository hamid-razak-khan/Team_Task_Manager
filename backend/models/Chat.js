const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  members:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  isGroup:   { type: Boolean, default: false },
  name:      { type: String, default: '' }, // group chat name
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);
