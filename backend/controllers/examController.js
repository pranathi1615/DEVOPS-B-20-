const Exam = require('../models/Exam');
const User = require('../models/User');
const ExamSession = require('../models/ExamSession');
const Attendance = require('../models/Attendance');
const { logAudit } = require('../utils/logger');

// @desc    Get examinations based on user role and filters
// @route   GET /api/exams
// @access  Private
exports.getExams = async (req, res, next) => {
  try {
    const { status, search, date } = req.query;
    const query = {};

    // Role-based visibility
    if (req.user.role === 'student') {
      query.assignedStudents = req.user._id;
    } else if (req.user.role === 'invigilator') {
      // invigilator sees assigned exams, or all if none assigned yet
      query.$or = [
        { assignedInvigilators: req.user._id },
        { status: { $in: ['scheduled', 'ongoing'] } }
      ];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    if (date) {
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.examDate = { $gte: targetDate, $lt: nextDay };
    }

    const exams = await Exam.find(query)
      .populate('createdBy', 'name email')
      .populate('assignedInvigilators', 'name email department')
      .populate('assignedStudents', 'name email studentId department')
      .sort({ examDate: 1, startTime: 1 });

    // If student, remove correctOptionIndex from questions
    const sanitizedExams = exams.map(exam => {
      const obj = exam.toObject();
      if (req.user.role === 'student') {
        if (obj.questions) {
          obj.questions = obj.questions.map(q => {
            const { correctOptionIndex, ...rest } = q;
            return rest;
          });
        }
      }
      return obj;
    });

    res.status(200).json({
      success: true,
      count: sanitizedExams.length,
      exams: sanitizedExams
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single exam details
// @route   GET /api/exams/:id
// @access  Private
exports.getExamById = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedInvigilators', 'name email department')
      .populate('assignedStudents', 'name email studentId department');

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Examination not found' });
    }

    // Check if student is assigned
    if (req.user.role === 'student') {
      const isAssigned = exam.assignedStudents.some(
        s => s._id.toString() === req.user._id.toString()
      );
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: 'You are not assigned or authorized to take this examination.'
        });
      }
    }

    const obj = exam.toObject();
    if (req.user.role === 'student') {
      if (obj.questions) {
        obj.questions = obj.questions.map(q => {
          const { correctOptionIndex, ...rest } = q;
          return rest;
        });
      }
    }

    res.status(200).json({ success: true, exam: obj });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new examination
// @route   POST /api/exams
// @access  Private (Admin, Coordinator)
exports.createExam = async (req, res, next) => {
  try {
    const {
      title,
      description,
      examDate,
      startTime,
      endTime,
      duration,
      instructions,
      questions,
      assignedStudents,
      assignedInvigilators,
      status
    } = req.body;

    if (!title || !examDate || !startTime || !endTime || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (title, examDate, startTime, endTime, duration).'
      });
    }

    const exam = await Exam.create({
      title,
      description: description || '',
      examDate: new Date(examDate),
      startTime,
      endTime,
      duration: parseInt(duration),
      instructions: instructions || [
        'Read all questions carefully before answering.',
        'Do not switch browser tabs or exit fullscreen mode.',
        'Ensure a stable internet connection throughout the session.',
        'Exam will automatically submit when the countdown reaches zero.'
      ],
      questions: questions || [],
      assignedStudents: assignedStudents || [],
      assignedInvigilators: assignedInvigilators || [],
      status: status || 'scheduled',
      createdBy: req.user._id
    });

    await logAudit(req.user._id, 'CREATE_EXAM', `Created examination "${exam.title}"`, req.ip);

    res.status(201).json({
      success: true,
      exam
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update examination
// @route   PUT /api/exams/:id
// @access  Private (Admin, Coordinator)
exports.updateExam = async (req, res, next) => {
  try {
    let exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Examination not found' });
    }

    const updateFields = { ...req.body };
    if (updateFields.examDate) {
      updateFields.examDate = new Date(updateFields.examDate);
    }

    exam = await Exam.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true
    }).populate('assignedInvigilators', 'name email')
      .populate('assignedStudents', 'name email studentId');

    await logAudit(req.user._id, 'UPDATE_EXAM', `Updated examination "${exam.title}"`);

    res.status(200).json({ success: true, exam });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete examination
// @route   DELETE /api/exams/:id
// @access  Private (Admin, Coordinator)
exports.deleteExam = async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Examination not found' });
    }

    await Exam.findByIdAndDelete(req.params.id);
    // Cleanup sessions, attendance, incidents
    await ExamSession.deleteMany({ examId: req.params.id });
    await Attendance.deleteMany({ examId: req.params.id });

    await logAudit(req.user._id, 'DELETE_EXAM', `Deleted examination "${exam.title}"`);

    res.status(200).json({ success: true, message: 'Examination and related records deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Assign students to exam
// @route   POST /api/exams/:id/assign-students
// @access  Private (Admin, Coordinator)
exports.assignStudents = async (req, res, next) => {
  try {
    const { studentIds } = req.body;
    if (!Array.isArray(studentIds)) {
      return res.status(400).json({ success: false, message: 'studentIds must be an array' });
    }

    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      { assignedStudents: studentIds },
      { new: true }
    ).populate('assignedStudents', 'name email studentId department');

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Examination not found' });
    }

    await logAudit(req.user._id, 'ASSIGN_STUDENTS', `Assigned ${studentIds.length} students to "${exam.title}"`);

    res.status(200).json({ success: true, exam });
  } catch (err) {
    next(err);
  }
};

// @desc    Assign invigilators to exam
// @route   POST /api/exams/:id/assign-invigilators
// @access  Private (Admin, Coordinator)
exports.assignInvigilators = async (req, res, next) => {
  try {
    const { invigilatorIds } = req.body;
    if (!Array.isArray(invigilatorIds)) {
      return res.status(400).json({ success: false, message: 'invigilatorIds must be an array' });
    }

    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      { assignedInvigilators: invigilatorIds },
      { new: true }
    ).populate('assignedInvigilators', 'name email department');

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Examination not found' });
    }

    await logAudit(req.user._id, 'ASSIGN_INVIGILATORS', `Assigned ${invigilatorIds.length} invigilators to "${exam.title}"`);

    res.status(200).json({ success: true, exam });
  } catch (err) {
    next(err);
  }
};
