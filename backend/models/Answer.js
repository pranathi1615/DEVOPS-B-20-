const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
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
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  selectedAnswer: {
    type: mongoose.Schema.Types.Mixed, // number (index) or string
    default: null
  },
  isMarkedForReview: {
    type: Boolean,
    default: false
  },
  savedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

answerSchema.index({ examId: 1, studentId: 1, questionId: 1 }, { unique: true });

module.exports = mongoose.model('Answer', answerSchema);
