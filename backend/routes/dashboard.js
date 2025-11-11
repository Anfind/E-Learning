const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

// @route   GET /api/dashboard/overview
// @desc    Get user dashboard overview (stats + enrolled majors + recent activities)
// @access  Private
router.get('/overview', auth, dashboardController.getDashboardOverview);

// @route   GET /api/dashboard/progress/:majorId
// @desc    Get detailed progress for a specific major
// @access  Private
router.get('/progress/:majorId', auth, dashboardController.getMajorProgress);

module.exports = router;
