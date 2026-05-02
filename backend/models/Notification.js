const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['task_assigned', 'project_added', 'deadline_alert', 'task_completed', 'group_message'], 
    required: true 
  },
  relatedId: { type: mongoose.Schema.Types.ObjectId }, // task or project _id
  read: { type: Boolean, default: false },
  emailSent: { type: Boolean, default: false },
}, { timestamps: true });

// Compound index to prevent duplicate deadline notifications per task per user
notificationSchema.index({ userId: 1, relatedId: 1, type: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Notification', notificationSchema);
