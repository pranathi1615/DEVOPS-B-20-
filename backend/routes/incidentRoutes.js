const express = require('express');
const router = express.Router();
const {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncident
} = require('../controllers/incidentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.route('/')
  .post(createIncident)
  .get(getIncidents);

router.route('/:id')
  .get(getIncidentById)
  .put(authorize('admin', 'coordinator', 'invigilator'), updateIncident);

module.exports = router;
