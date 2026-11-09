const ExamSession = require('../models/ExamSession');
const Exam = require('../models/Exam');
const Answer = require('../models/Answer');
const Attendance = require('../models/Attendance');
const Incident = require('../models/Incident');
const { logAudit } = require('../utils/logger');
const { emitToInvigilators } = require('../services/socketService');

// @desc    Start examination session (Student)
// @route   POST /api/sessions/start
// @access  Private (Student)
exports.startSession = async (req, res, next) => {
  try {
    const { examId, webcamPermissionStatus } = req.body;
    const studentId = req.user._id;

    if (!examId) {
      return res.status(400).json({ success: false, message: 'examId is required' });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    // Check if assigned
    const isAssigned = exam.assignedStudents.some(
      id => id.toString() === studentId.toString()
    );
    if (!isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this examination.'
      });
    }

    // Find or create session
    let session = await ExamSession.findOne({ examId, studentId });

    if (session && session.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted this examination.'
      });
    }

    const now = new Date();

    if (!session) {
      session = new ExamSession({
        examId,
        studentId,
        loginTime: now,
        sessionStart: now,
        status: 'in_progress',
        lastActivity: now,
        webcamPermissionStatus: webcamPermissionStatus || 'prompt',
        ipAddress: req.ip || ''
      });
    } else {
      session.status = 'in_progress';
      session.lastActivity = now;
      if (!session.sessionStart) session.sessionStart = now;
      if (webcamPermissionStatus) session.webcamPermissionStatus = webcamPermissionStatus;
    }

    await session.save();

    // Mark attendance
    await Attendance.findOneAndUpdate(
      { examId, studentId },
      {
        loginTime: now,
        attendanceStatus: 'present',
        ipAddress: req.ip || ''
      },
      { upsert: true, new: true }
    );

    // Populate for response and real-time notification
    const populatedSession = await ExamSession.findById(session._id)
      .populate('studentId', 'name email studentId department')
      .populate('examId', 'title duration');

    // Notify invigilators via Socket.IO
    emitToInvigilators(examId, 'session_started', populatedSession);

    await logAudit(studentId, 'START_EXAM_SESSION', `Started examination "${exam.title}"`, req.ip);

    res.status(200).json({
      success: true,
      session: populatedSession
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get sessions for monitoring
// @route   GET /api/sessions
// @access  Private (Admin, Coordinator, Invigilator)
exports.getSessions = async (req, res, next) => {
  try {
    const { examId, status, studentId } = req.query;
    const query = {};

    if (examId) query.examId = examId;
    if (status && status !== 'all') query.status = status;
    if (studentId) query.studentId = studentId;

    const sessions = await ExamSession.find(query)
      .populate('studentId', 'name email studentId department')
      .populate('examId', 'title duration totalMarks')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single session details
// @route   GET /api/sessions/:id
// @access  Private
exports.getSessionById = async (req, res, next) => {
  try {
    const session = await ExamSession.findById(req.params.id)
      .populate('studentId', 'name email studentId department')
      .populate('examId', 'title duration totalMarks');

    if (!session) {
      return res.status(404).json({ success: false, message: 'Exam session not found' });
    }

    // Check authorization: if student, can only view own session
    if (req.user.role === 'student' && session.studentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    res.status(200).json({ success: true, session });
  } catch (err) {
    next(err);
  }
};

// @desc    Update session activity / record browser event (tab switch, fullscreen exit)
// @route   PUT /api/sessions/:id/activity
// @access  Private
exports.updateActivity = async (req, res, next) => {
  try {
    const {
      isTabSwitch,
      isFullscreenExit,
      webcamPermissionStatus,
      isDisconnected,
      isReconnected
    } = req.body;

    const session = await ExamSession.findById(req.params.id)
      .populate('studentId', 'name email studentId')
      .populate('examId', 'title');

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    session.lastActivity = new Date();

    if (webcamPermissionStatus) {
      session.webcamPermissionStatus = webcamPermissionStatus;
    }

    let incidentCreated = null;

    if (isTabSwitch) {
      session.tabSwitchCount = (session.tabSwitchCount || 0) + 1;
      const incCount = await Incident.countDocuments();
      incidentCreated = await Incident.create({
        incidentId: `INC-${1000 + incCount + 1}`,
        examId: session.examId._id,
        studentId: session.studentId._id,
        incidentType: 'tab_switch',
        severity: session.tabSwitchCount > 2 ? 'high' : 'medium',
        description: `Student exited examination tab (Occurrences: ${session.tabSwitchCount})`,
        reportedBy: 'system',
        status: 'open'
      });
    }

    if (isFullscreenExit) {
      session.fullscreenExitCount = (session.fullscreenExitCount || 0) + 1;
      const incCount = await Incident.countDocuments();
      incidentCreated = await Incident.create({
        incidentId: `INC-${1000 + incCount + 1}`,
        examId: session.examId._id,
        studentId: session.studentId._id,
        incidentType: 'fullscreen_exit',
        severity: session.fullscreenExitCount > 2 ? 'high' : 'medium',
        description: `Student left fullscreen mode (Occurrences: ${session.fullscreenExitCount})`,
        reportedBy: 'system',
        status: 'open'
      });
    }

    if (isDisconnected) {
      session.disconnectionCount = (session.disconnectionCount || 0) + 1;
      session.networkStatus = 'offline';
    }

    if (isReconnected) {
      session.networkStatus = 'online';
    }

    await session.save();

    // Broadcast update to invigilators
    emitToInvigilators(session.examId._id.toString(), 'session_activity_update', {
      sessionId: session._id,
      studentId: session.studentId._id,
      studentName: session.studentId.name,
      lastActivity: session.lastActivity,
      tabSwitchCount: session.tabSwitchCount,
      fullscreenExitCount: session.fullscreenExitCount,
      networkStatus: session.networkStatus,
      webcamPermissionStatus: session.webcamPermissionStatus,
      incident: incidentCreated
    });

    if (incidentCreated) {
      emitToInvigilators(session.examId._id.toString(), 'incident_recorded', incidentCreated);
    }

    res.status(200).json({
      success: true,
      session,
      incident: incidentCreated
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Save an answer
// @route   POST /api/sessions/:id/save-answer
// @access  Private (Student)
exports.saveAnswer = async (req, res, next) => {
  try {
    const { questionId, selectedAnswer, isMarkedForReview } = req.body;
    const session = await ExamSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Examination already completed' });
    }

    const answer = await Answer.findOneAndUpdate(
      {
        examId: session.examId,
        studentId: session.studentId,
        questionId
      },
      {
        selectedAnswer,
        isMarkedForReview: !!isMarkedForReview,
        savedAt: new Date()
      },
      { upsert: true, new: true }
    );

    session.lastActivity = new Date();
    await session.save();

    res.status(200).json({
      success: true,
      answer
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all saved answers for a session
// @route   GET /api/sessions/:id/answers
// @access  Private
exports.getSessionAnswers = async (req, res, next) => {
  try {
    const session = await ExamSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const answers = await Answer.find({
      examId: session.examId,
      studentId: session.studentId
    });

    res.status(200).json({
      success: true,
      answers
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Submit examination
// @route   POST /api/sessions/:id/submit
// @access  Private
exports.submitSession = async (req, res, next) => {
  try {
    const { isAutoSubmitted } = req.body;
    const session = await ExamSession.findById(req.params.id)
      .populate('studentId', 'name email studentId')
      .populate('examId');

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.status === 'completed') {
      return res.status(200).json({
        success: true,
        message: 'Exam already submitted',
        session
      });
    }

    const now = new Date();
    session.status = 'completed';
    session.submittedAt = now;
    session.sessionEnd = now;
    session.logoutTime = now;
    session.isAutoSubmitted = !!isAutoSubmitted;

    // Calculate score
    const studentAnswers = await Answer.find({
      examId: session.examId._id,
      studentId: session.studentId._id
    });

    let score = 0;
    if (session.examId.questions && session.examId.questions.length > 0) {
      session.examId.questions.forEach(q => {
        const ans = studentAnswers.find(a => a.questionId.toString() === q._id.toString());
        if (ans && parseInt(ans.selectedAnswer) === parseInt(q.correctOptionIndex)) {
          score += (q.marks || 1);
        }
      });
    }

    session.score = score;
    await session.save();

    // Update Attendance record
    const durationMins = session.sessionStart
      ? Math.max(1, Math.round((now - new Date(session.sessionStart)) / 60000))
      : 0;

    await Attendance.findOneAndUpdate(
      { examId: session.examId._id, studentId: session.studentId._id },
      {
        logoutTime: now,
        attendanceStatus: 'present',
        durationMinutes: durationMins
      },
      { upsert: true }
    );

    // Notify invigilators via Socket.IO
    emitToInvigilators(session.examId._id.toString(), 'student_submitted', {
      sessionId: session._id,
      studentId: session.studentId._id,
      studentName: session.studentId.name,
      studentCode: session.studentId.studentId,
      submittedAt: now,
      isAutoSubmitted: session.isAutoSubmitted,
      score
    });

    await logAudit(
      session.studentId._id,
      'SUBMIT_EXAM',
      `Submitted examination "${session.examId.title}" (${isAutoSubmitted ? 'Automatic timer expiration' : 'Manual submission'})`,
      req.ip
    );

    res.status(200).json({
      success: true,
      message: 'Examination submitted successfully.',
      session
    });
  } catch (err) {
    next(err);
  }
};
