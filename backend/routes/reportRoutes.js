const express = require('express');
const router = express.Router();
const {
  getExamSummaryReport,
  getAttendanceReport,
  getIncidentRegisterReport,
  getSubmissionStatusReport
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('admin', 'coordinator', 'invigilator'));

router.get('/exam-summary', getExamSummaryReport);
router.get('/attendance', getAttendanceReport);
router.get('/incidents', getIncidentRegisterReport);
router.get('/submissions', getSubmissionStatusReport);

module.exports = router;
