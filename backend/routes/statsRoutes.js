const express = require('express');
const router = express.Router();
const { getOverviewStats } = require('../controllers/statsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/overview', getOverviewStats);

module.exports = router;
