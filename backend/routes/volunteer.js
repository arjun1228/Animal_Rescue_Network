const express = require('express');
const router = express.Router();
const { toggleAvailability, getVolunteerStats } = require('../controllers/volunteerController');
const { rateVolunteer } = require('../controllers/volunteerController');
const { protect, volunteerOrAdmin } = require('../middleware/auth');

// Volunteer-only stats & availability
router.get('/stats', protect, volunteerOrAdmin, getVolunteerStats);
router.patch('/availability', protect, volunteerOrAdmin, toggleAvailability);

module.exports = router;
