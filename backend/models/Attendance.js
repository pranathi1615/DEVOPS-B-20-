const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
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
  attendanceStatus: {
    type: String,
    enum: ['present', 'absent', 'late'],
    default: 'absent'
  },
  durationMinutes: {
    type: Number,
    default: 0
  },
  ipAddress: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

attendanceSchema.index({ examId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
