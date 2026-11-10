const Exam = require('../models/Exam');
const ExamSession = require('../models/ExamSession');
const Attendance = require('../models/Attendance');
const Incident = require('../models/Incident');
const User = require('../models/User');
const { generateCSV } = require('../services/csvService');
const { generatePDFReport } = require('../services/pdfService');

// ==========================================
// 1. EXAM SESSION SUMMARY REPORT
// ==========================================
exports.getExamSummaryReport = async (req, res, next) => {
  try {
    const { examId, format } = req.query;
    const examQuery = {};
    if (examId && examId !== 'all') {
      examQuery._id = examId;
    }

    const exams = await Exam.find(examQuery)
      .populate('createdBy', 'name email')
      .sort({ examDate: -1 });

    const summaryData = await Promise.all(
      exams.map(async (exam) => {
        const totalRegistered = exam.assignedStudents.length;

        // Count present & absent from Attendance & Sessions
        const presentCount = await Attendance.countDocuments({
          examId: exam._id,
          attendanceStatus: { $in: ['present', 'late'] }
        });

        const completedCount = await ExamSession.countDocuments({
          examId: exam._id,
          status: 'completed'
        });

        const inProgressCount = await ExamSession.countDocuments({
          examId: exam._id,
          status: 'in_progress'
        });

        const incidentCount = await Incident.countDocuments({
          examId: exam._id
        });

        const absentCount = Math.max(0, totalRegistered - presentCount);
        const pendingSubmissions = Math.max(0, totalRegistered - completedCount);

        return {
          examId: exam._id,
          examTitle: exam.title,
          examDate: exam.examDate ? new Date(exam.examDate).toLocaleDateString() : 'N/A',
          startTime: exam.startTime,
          endTime: exam.endTime,
          duration: `${exam.duration} mins`,
          status: exam.status,
          totalRegistered,
          presentStudents: presentCount,
          absentStudents: absentCount,
          completedSubmissions: completedCount,
          inProgressSessions: inProgressCount,
          pendingSubmissions,
          totalIncidents: incidentCount
        };
      })
    );

    // Totals for overall metrics
    const overallStats = {
      totalExams: exams.length,
      totalRegistered: summaryData.reduce((acc, s) => acc + s.totalRegistered, 0),
      totalPresent: summaryData.reduce((acc, s) => acc + s.presentStudents, 0),
      totalSubmissions: summaryData.reduce((acc, s) => acc + s.completedSubmissions, 0),
      totalIncidents: summaryData.reduce((acc, s) => acc + s.totalIncidents, 0)
    };

    if (format === 'csv') {
      const fields = [
        { label: 'Examination Title', value: 'examTitle' },
        { label: 'Date', value: 'examDate' },
        { label: 'Start Time', value: 'startTime' },
        { label: 'End Time', value: 'endTime' },
        { label: 'Duration', value: 'duration' },
        { label: 'Status', value: 'status' },
        { label: 'Registered', value: 'totalRegistered' },
        { label: 'Present', value: 'presentStudents' },
        { label: 'Absent', value: 'absentStudents' },
        { label: 'Completed', value: 'completedSubmissions' },
        { label: 'Pending', value: 'pendingSubmissions' },
        { label: 'Incidents', value: 'totalIncidents' }
      ];
      const csv = generateCSV(summaryData, fields);
      res.header('Content-Type', 'text/csv');
      res.attachment(`exam_session_summary_${Date.now()}.csv`);
      return res.send(csv);
    }

    if (format === 'pdf') {
      const headers = ['Exam Title', 'Date', 'Registered', 'Present', 'Absent', 'Completed', 'Incidents', 'Status'];
      const rows = summaryData.map(s => [
        s.examTitle,
        s.examDate,
        s.totalRegistered,
        s.presentStudents,
        s.absentStudents,
        s.completedSubmissions,
        s.totalIncidents,
        s.status
      ]);

      const doc = generatePDFReport(
        'Examination Session Summary Report',
        `Comprehensive overview of examination attendances, completions, and incident frequencies.`,
        headers,
        rows,
        {
          'Total Exams': overallStats.totalExams,
          'Total Registered': overallStats.totalRegistered,
          'Total Present': overallStats.totalPresent,
          'Submissions': overallStats.totalSubmissions,
          'Incidents': overallStats.totalIncidents
        }
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=exam_summary_${Date.now()}.pdf`);
      doc.pipe(res);
      return doc.end();
    }

    res.status(200).json({
      success: true,
      stats: overallStats,
      summary: summaryData
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 2. ATTENDANCE AND LOGIN REPORT
// ==========================================
exports.getAttendanceReport = async (req, res, next) => {
  try {
    const { examId, status, date, format } = req.query;
    const query = {};

    if (examId && examId !== 'all') query.examId = examId;
    if (status && status !== 'all') query.attendanceStatus = status;

    const records = await Attendance.find(query)
      .populate('studentId', 'name email studentId department')
      .populate('examId', 'title examDate startTime endTime')
      .sort({ createdAt: -1 });

    const attendanceData = records.map(rec => ({
      attendanceId: rec._id,
      examName: rec.examId?.title || 'Unknown Exam',
      examDate: rec.examId?.examDate ? new Date(rec.examId.examDate).toLocaleDateString() : 'N/A',
      studentName: rec.studentId?.name || 'Unknown Student',
      studentId: rec.studentId?.studentId || 'N/A',
      department: rec.studentId?.department || 'N/A',
      loginTime: rec.loginTime ? new Date(rec.loginTime).toLocaleTimeString() : 'Not Logged In',
      logoutTime: rec.logoutTime ? new Date(rec.logoutTime).toLocaleTimeString() : 'Active/Pending',
      attendanceStatus: rec.attendanceStatus.toUpperCase(),
      durationMinutes: rec.durationMinutes ? `${rec.durationMinutes} min` : '-'
    }));

    const totalStudents = attendanceData.length;
    const presentStudents = attendanceData.filter(a => a.attendanceStatus === 'PRESENT').length;
    const absentStudents = attendanceData.filter(a => a.attendanceStatus === 'ABSENT').length;
    const lateStudents = attendanceData.filter(a => a.attendanceStatus === 'LATE').length;
    const attendancePercentage = totalStudents > 0
      ? `${Math.round(((presentStudents + lateStudents) / totalStudents) * 100)}%`
      : '0%';

    const stats = {
      total: totalStudents,
      present: presentStudents,
      absent: absentStudents,
      late: lateStudents,
      percentage: attendancePercentage
    };

    if (format === 'csv') {
      const fields = [
        { label: 'Examination', value: 'examName' },
        { label: 'Date', value: 'examDate' },
        { label: 'Student ID', value: 'studentId' },
        { label: 'Student Name', value: 'studentName' },
        { label: 'Department', value: 'department' },
        { label: 'Login Time', value: 'loginTime' },
        { label: 'Logout Time', value: 'logoutTime' },
        { label: 'Status', value: 'attendanceStatus' },
        { label: 'Duration', value: 'durationMinutes' }
      ];
      const csv = generateCSV(attendanceData, fields);
      res.header('Content-Type', 'text/csv');
      res.attachment(`attendance_report_${Date.now()}.csv`);
      return res.send(csv);
    }

    if (format === 'pdf') {
      const headers = ['Student ID', 'Student Name', 'Exam', 'Login Time', 'Logout Time', 'Status', 'Duration'];
      const rows = attendanceData.map(a => [
        a.studentId,
        a.studentName,
        a.examName,
        a.loginTime,
        a.logoutTime,
        a.attendanceStatus,
        a.durationMinutes
      ]);

      const doc = generatePDFReport(
        'Attendance and Login Report',
        `Official record of candidate logins, logouts, attendance statuses, and active durations.`,
        headers,
        rows,
        {
          'Total Candidates': stats.total,
          'Present': stats.present,
          'Absent': stats.absent,
          'Late Arrivals': stats.late,
          'Attendance Rate': stats.percentage
        }
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${Date.now()}.pdf`);
      doc.pipe(res);
      return doc.end();
    }

    res.status(200).json({
      success: true,
      stats,
      records: attendanceData
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 3. INCIDENT REGISTER REPORT
// ==========================================
exports.getIncidentRegisterReport = async (req, res, next) => {
  try {
    const { examId, severity, status, format } = req.query;
    const query = {};

    if (examId && examId !== 'all') query.examId = examId;
    if (severity && severity !== 'all') query.severity = severity;
    if (status && status !== 'all') query.status = status;

    const incidents = await Incident.find(query)
      .populate('studentId', 'name studentId department email')
      .populate('examId', 'title')
      .populate('invigilatorId', 'name')
      .sort({ timestamp: -1 });

    const incidentData = incidents.map(inc => ({
      incidentId: inc.incidentId,
      examName: inc.examId?.title || 'Unknown Exam',
      studentName: inc.studentId?.name || 'Unknown Student',
      studentId: inc.studentId?.studentId || 'N/A',
      category: inc.incidentType.replace('_', ' ').toUpperCase(),
      severity: inc.severity.toUpperCase(),
      timestamp: new Date(inc.timestamp).toLocaleString(),
      description: inc.description,
      reportedBy: inc.reportedBy,
      status: inc.status.toUpperCase()
    }));

    const stats = {
      total: incidentData.length,
      highSeverity: incidentData.filter(i => i.severity === 'HIGH').length,
      mediumSeverity: incidentData.filter(i => i.severity === 'MEDIUM').length,
      lowSeverity: incidentData.filter(i => i.severity === 'LOW').length,
      resolved: incidentData.filter(i => i.status === 'RESOLVED').length,
      open: incidentData.filter(i => i.status === 'OPEN').length
    };

    if (format === 'csv') {
      const fields = [
        { label: 'Incident ID', value: 'incidentId' },
        { label: 'Exam', value: 'examName' },
        { label: 'Student ID', value: 'studentId' },
        { label: 'Student Name', value: 'studentName' },
        { label: 'Category', value: 'category' },
        { label: 'Severity', value: 'severity' },
        { label: 'Timestamp', value: 'timestamp' },
        { label: 'Description', value: 'description' },
        { label: 'Reported By', value: 'reportedBy' },
        { label: 'Status', value: 'status' }
      ];
      const csv = generateCSV(incidentData, fields);
      res.header('Content-Type', 'text/csv');
      res.attachment(`incident_register_${Date.now()}.csv`);
      return res.send(csv);
    }

    if (format === 'pdf') {
      const headers = ['Incident ID', 'Student', 'Exam', 'Category', 'Severity', 'Time', 'Status'];
      const rows = incidentData.map(i => [
        i.incidentId,
        `${i.studentName} (${i.studentId})`,
        i.examName,
        i.category,
        i.severity,
        i.timestamp,
        i.status
      ]);

      const doc = generatePDFReport(
        'Official Examination Incident Register',
        `Logged observations, security exceptions, tab switches, and proctoring events during sessions.`,
        headers,
        rows,
        {
          'Total Incidents': stats.total,
          'High Severity': stats.highSeverity,
          'Medium Severity': stats.mediumSeverity,
          'Open Cases': stats.open,
          'Resolved': stats.resolved
        }
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=incident_register_${Date.now()}.pdf`);
      doc.pipe(res);
      return doc.end();
    }

    res.status(200).json({
      success: true,
      stats,
      incidents: incidentData
    });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 4. SUBMISSION STATUS REPORT
// ==========================================
exports.getSubmissionStatusReport = async (req, res, next) => {
  try {
    const { examId, status, format } = req.query;
    const query = {};

    if (examId && examId !== 'all') query.examId = examId;
    if (status && status !== 'all') query.status = status;

    const sessions = await ExamSession.find(query)
      .populate('studentId', 'name studentId department')
      .populate('examId', 'title duration totalMarks')
      .sort({ updatedAt: -1 });

    const submissionData = sessions.map(s => {
      const timeTakenMinutes = s.sessionStart && s.submittedAt
        ? Math.max(1, Math.round((new Date(s.submittedAt) - new Date(s.sessionStart)) / 60000))
        : '-';

      const method = s.status === 'completed'
        ? (s.isAutoSubmitted ? 'Automatic (Timer Expiry)' : 'Manual Submission')
        : 'Not Submitted';

      return {
        sessionId: s._id,
        studentName: s.studentId?.name || 'Unknown',
        studentId: s.studentId?.studentId || 'N/A',
        department: s.studentId?.department || 'N/A',
        examTitle: s.examId?.title || 'Unknown Exam',
        submissionStatus: s.status.toUpperCase(),
        submissionTime: s.submittedAt ? new Date(s.submittedAt).toLocaleTimeString() : '-',
        timeTaken: typeof timeTakenMinutes === 'number' ? `${timeTakenMinutes} mins` : '-',
        submissionMethod: method,
        score: s.status === 'completed' ? `${s.score || 0} / ${s.examId?.totalMarks || 0}` : '-'
      };
    });

    const stats = {
      total: submissionData.length,
      completed: submissionData.filter(s => s.submissionStatus === 'COMPLETED').length,
      inProgress: submissionData.filter(s => s.submissionStatus === 'IN_PROGRESS').length,
      autoSubmitted: submissionData.filter(s => s.submissionMethod.includes('Automatic')).length,
      manualSubmitted: submissionData.filter(s => s.submissionMethod.includes('Manual')).length
    };

    if (format === 'csv') {
      const fields = [
        { label: 'Student ID', value: 'studentId' },
        { label: 'Student Name', value: 'studentName' },
        { label: 'Department', value: 'department' },
        { label: 'Exam Title', value: 'examTitle' },
        { label: 'Status', value: 'submissionStatus' },
        { label: 'Submission Time', value: 'submissionTime' },
        { label: 'Time Taken', value: 'timeTaken' },
        { label: 'Method', value: 'submissionMethod' },
        { label: 'Score', value: 'score' }
      ];
      const csv = generateCSV(submissionData, fields);
      res.header('Content-Type', 'text/csv');
      res.attachment(`submission_status_${Date.now()}.csv`);
      return res.send(csv);
    }

    if (format === 'pdf') {
      const headers = ['Student ID', 'Student Name', 'Exam', 'Status', 'Time Submitted', 'Duration', 'Method', 'Score'];
      const rows = submissionData.map(s => [
        s.studentId,
        s.studentName,
        s.examTitle,
        s.submissionStatus,
        s.submissionTime,
        s.timeTaken,
        s.submissionMethod,
        s.score
      ]);

      const doc = generatePDFReport(
        'Examination Submission Status Report',
        `Verification of completed, in-progress, and automatically finalized exam papers.`,
        headers,
        rows,
        {
          'Total Records': stats.total,
          'Completed': stats.completed,
          'In-Progress': stats.inProgress,
          'Auto-Submitted': stats.autoSubmitted,
          'Manual': stats.manualSubmitted
        }
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=submission_status_${Date.now()}.pdf`);
      doc.pipe(res);
      return doc.end();
    }

    res.status(200).json({
      success: true,
      stats,
      submissions: submissionData
    });
  } catch (err) {
    next(err);
  }
};
