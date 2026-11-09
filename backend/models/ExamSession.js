const mongoose = require('mongoose');

const examSessionSchema = new mongoose.Schema({
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
  loginTime: {
    type: Date,
    default: null
  },
  logoutTime: {
    type: Date,
    default: null
  },
  sessionStart: {
    type: Date,
    default: null
  },
  sessionEnd: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'disconnected', 'terminated'],
    default: 'scheduled',
    index: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  webcamPermissionStatus: {
    type: String,
    enum: ['granted', 'denied', 'prompt', 'not_required'],
    default: 'prompt'
  },
  submittedAt: {
    type: Date,
    default: null
  },
  isAutoSubmitted: {
    type: Boolean,
    default: false
  },
  score: {
    type: Number,
    default: 0
  },
  tabSwitchCount: {
    type: Number,
    default: 0
  },
  fullscreenExitCount: {
    type: Number,
    default: 0
  },
  disconnectionCount: {
    type: Number,
    default: 0
  },
  networkStatus: {
    type: String,
    enum: ['online', 'offline'],
    default: 'online'
  },
  ipAddress: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

examSessionSchema.index({ examId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('ExamSession', examSessionSchema);
