const User = require('../models/User');
const Exam = require('../models/Exam');
const ExamSession = require('../models/ExamSession');
const Incident = require('../models/Incident');
const Attendance = require('../models/Attendance');
const AuditLog = require('../models/AuditLog');

// @desc    Get dashboard metrics tailored to role
// @route   GET /api/stats/overview
// @access  Private
exports.getOverviewStats = async (req, res, next) => {
  try {
    const role = req.user.role;
    const userId = req.user._id;

    if (role === 'admin') {
      const [
        totalUsers,
        totalStudents,
        totalInvigilators,
        totalCoordinators,
        totalExams,
        activeExams,
        completedExams,
        ongoingSessions,
        totalIncidents,
        recentIncidents,
        recentActivities,
        upcomingExams,
        attendanceStats
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'student' }),
        User.countDocuments({ role: 'invigilator' }),
        User.countDocuments({ role: 'coordinator' }),
        Exam.countDocuments(),
        Exam.countDocuments({ status: 'ongoing' }),
        Exam.countDocuments({ status: 'completed' }),
        ExamSession.countDocuments({ status: 'in_progress' }),
        Incident.countDocuments(),
        Incident.find()
          .populate('studentId', 'name studentId')
          .populate('examId', 'title')
          .sort({ timestamp: -1 })
          .limit(5),
        AuditLog.find()
          .populate('userId', 'name role')
          .sort({ timestamp: -1 })
          .limit(6),
        Exam.find({ status: { $in: ['scheduled', 'ongoing'] } })
          .sort({ examDate: 1 })
          .limit(4),
        Attendance.aggregate([
          {
            $group: {
              _id: '$attendanceStatus',
              count: { $sum: 1 }
            }
          }
        ])
      ]);

      const attendanceMap = { present: 0, absent: 0, late: 0 };
      attendanceStats.forEach(item => {
        if (attendanceMap[item._id] !== undefined) {
          attendanceMap[item._id] = item.count;
        }
      });

      return res.status(200).json({
        success: true,
        stats: {
          totalUsers,
          totalStudents,
          totalInvigilators,
          totalCoordinators,
          totalExams,
          activeExams,
          completedExams,
          ongoingSessions,
          totalIncidents,
          attendanceMap
        },
        recentIncidents,
        recentActivities,
        upcomingExams
      });
    }

    if (role === 'coordinator') {
      const [
        totalExams,
        scheduledExams,
        completedExams,
        totalStudents,
        totalInvigilators,
        upcomingExams
      ] = await Promise.all([
        Exam.countDocuments(),
        Exam.countDocuments({ status: 'scheduled' }),
        Exam.countDocuments({ status: 'completed' }),
        User.countDocuments({ role: 'student' }),
        User.countDocuments({ role: 'invigilator' }),
        Exam.find({ status: { $in: ['scheduled', 'ongoing'] } })
          .populate('assignedInvigilators', 'name email')
          .sort({ examDate: 1 })
          .limit(6)
      ]);

      return res.status(200).json({
        success: true,
        stats: {
          totalExams,
          scheduledExams,
          completedExams,
          totalStudents,
          totalInvigilators
        },
        upcomingExams
      });
    }

    if (role === 'invigilator') {
      const assignedExams = await Exam.find({
        $or: [
          { assignedInvigilators: userId },
          { status: { $in: ['scheduled', 'ongoing'] } }
        ]
      }).sort({ examDate: 1 });

      const examIds = assignedExams.map(e => e._id);

      const [ongoingSessions, totalIncidents, recentIncidents] = await Promise.all([
        ExamSession.countDocuments({ examId: { $in: examIds }, status: 'in_progress' }),
        Incident.countDocuments({ examId: { $in: examIds } }),
        Incident.find({ examId: { $in: examIds } })
          .populate('studentId', 'name studentId')
          .populate('examId', 'title')
          .sort({ timestamp: -1 })
          .limit(5)
      ]);

      return res.status(200).json({
        success: true,
        stats: {
          assignedExamsCount: assignedExams.length,
          ongoingSessions,
          totalIncidents
        },
        assignedExams,
        recentIncidents
      });
    }

    if (role === 'student') {
      const [assignedExams, completedSessions, pendingAttendance] = await Promise.all([
        Exam.find({ assignedStudents: userId }).sort({ examDate: 1 }),
        ExamSession.find({ studentId: userId, status: 'completed' })
          .populate('examId', 'title totalMarks duration')
          .sort({ submittedAt: -1 }),
        Attendance.find({ studentId: userId })
          .populate('examId', 'title examDate')
      ]);

      return res.status(200).json({
        success: true,
        stats: {
          assignedCount: assignedExams.length,
          completedCount: completedSessions.length,
          upcomingCount: assignedExams.filter(e => e.status === 'scheduled').length
        },
        assignedExams,
        completedSessions,
        attendance: pendingAttendance
      });
    }

    res.status(200).json({ success: true, stats: {} });
  } catch (err) {
    next(err);
  }
};
