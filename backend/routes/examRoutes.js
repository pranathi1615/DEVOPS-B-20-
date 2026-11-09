const express = require('express');
const router = express.Router();
const {
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  assignStudents,
  assignInvigilators
} = require('../controllers/examController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .get(getExams)
  .post(authorize('admin', 'coordinator'), createExam);

router.route('/:id')
  .get(getExamById)
  .put(authorize('admin', 'coordinator'), updateExam)
  .delete(authorize('admin', 'coordinator'), deleteExam);

router.post('/:id/assign-students', authorize('admin', 'coordinator'), assignStudents);
router.post('/:id/assign-invigilators', authorize('admin', 'coordinator'), assignInvigilators);

module.exports = router;
