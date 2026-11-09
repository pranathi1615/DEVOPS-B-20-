const mongoose = require('mongoose');

const incidentCommentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  comment: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const incidentSchema = new mongoose.Schema({
  incidentId: {
    type: String,
    required: true,
    unique: true
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  invigilatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  incidentType: {
    type: String,
    enum: [
      'tab_switch',
      'fullscreen_exit',
      'multiple_disconnections',
      'suspicious_activity',
      'late_login',
      'unauthorized_device',
      'other'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  status: {
    type: String,
    enum: ['open', 'reviewed', 'resolved'],
    default: 'open'
  },
  reportedBy: {
    type: String,
    default: 'system' // 'system' or invigilator's name
  },
  comments: [incidentCommentSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Incident', incidentSchema);
