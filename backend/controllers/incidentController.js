const Incident = require('../models/Incident');
const Exam = require('../models/Exam');
const User = require('../models/User');
const { logAudit } = require('../utils/logger');
const { emitToInvigilators } = require('../services/socketService');

// @desc    Create an incident
// @route   POST /api/incidents
// @access  Private (Invigilator, Admin, Coordinator)
exports.createIncident = async (req, res, next) => {
  try {
    const {
      examId,
      studentId,
      incidentType,
      severity,
      description,
      status
    } = req.body;

    if (!examId || !studentId || !incidentType || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide examId, studentId, incidentType, and description.'
      });
    }

    const count = await Incident.countDocuments();
    const incidentId = `INC-${1000 + count + 1}`;

    const incident = await Incident.create({
      incidentId,
      examId,
      studentId,
      invigilatorId: req.user._id,
      incidentType,
      severity: severity || 'medium',
      description,
      status: status || 'open',
      reportedBy: req.user.name || 'Invigilator',
      timestamp: new Date()
    });

    const populatedIncident = await Incident.findById(incident._id)
      .populate('studentId', 'name email studentId department')
      .populate('examId', 'title')
      .populate('invigilatorId', 'name email');

    // Real-time broadcast
    emitToInvigilators(examId.toString(), 'incident_recorded', populatedIncident);

    await logAudit(
      req.user._id,
      'LOG_INCIDENT',
      `Recorded incident ${incidentId} for student ${studentId} (${incidentType})`,
      req.ip
    );

    res.status(201).json({
      success: true,
      incident: populatedIncident
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all incidents with filtering & search
// @route   GET /api/incidents
// @access  Private
exports.getIncidents = async (req, res, next) => {
  try {
    const { examId, severity, status, search, studentId } = req.query;
    const query = {};

    if (examId && examId !== 'all') query.examId = examId;
    if (severity && severity !== 'all') query.severity = severity;
    if (status && status !== 'all') query.status = status;
    if (studentId) query.studentId = studentId;

    let incidents = await Incident.find(query)
      .populate('studentId', 'name email studentId department')
      .populate('examId', 'title duration')
      .populate('invigilatorId', 'name email')
      .populate('comments.author', 'name role')
      .sort({ timestamp: -1 });

    if (search) {
      const s = search.toLowerCase();
      incidents = incidents.filter(inc => {
        const studentName = inc.studentId?.name?.toLowerCase() || '';
        const studentCode = inc.studentId?.studentId?.toLowerCase() || '';
        const incId = inc.incidentId?.toLowerCase() || '';
        const desc = inc.description?.toLowerCase() || '';
        return studentName.includes(s) || studentCode.includes(s) || incId.includes(s) || desc.includes(s);
      });
    }

    res.status(200).json({
      success: true,
      count: incidents.length,
      incidents
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single incident
// @route   GET /api/incidents/:id
// @access  Private
exports.getIncidentById = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('studentId', 'name email studentId department')
      .populate('examId', 'title duration')
      .populate('invigilatorId', 'name email')
      .populate('comments.author', 'name role');

    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    res.status(200).json({ success: true, incident });
  } catch (err) {
    next(err);
  }
};

// @desc    Update incident status / add comment
// @route   PUT /api/incidents/:id
// @access  Private (Invigilator, Admin, Coordinator)
exports.updateIncident = async (req, res, next) => {
  try {
    const { status, severity, comment } = req.body;
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    if (status) incident.status = status;
    if (severity) incident.severity = severity;

    if (comment && comment.trim()) {
      incident.comments.push({
        author: req.user._id,
        comment: comment.trim(),
        createdAt: new Date()
      });
    }

    await incident.save();

    const updated = await Incident.findById(incident._id)
      .populate('studentId', 'name email studentId department')
      .populate('examId', 'title')
      .populate('invigilatorId', 'name email')
      .populate('comments.author', 'name role');

    await logAudit(
      req.user._id,
      'UPDATE_INCIDENT',
      `Updated incident ${incident.incidentId} status to ${incident.status}`,
      req.ip
    );

    res.status(200).json({ success: true, incident: updated });
  } catch (err) {
    next(err);
  }
};
