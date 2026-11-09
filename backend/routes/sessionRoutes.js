const express = require('express');
const router = express.Router();
const {
  startSession,
  getSessions,
  getSessionById,
  updateActivity,
  saveAnswer,
  getSessionAnswers,
  submitSession
} = require('../controllers/sessionController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.post('/start', authorize('student'), startSession);
router.get('/', authorize('admin', 'coordinator', 'invigilator'), getSessions);
router.get('/:id', getSessionById);
router.put('/:id/activity', updateActivity);
router.post('/:id/save-answer', authorize('student'), saveAnswer);
router.get('/:id/answers', getSessionAnswers);
router.post('/:id/submit', submitSession);

module.exports = router;
