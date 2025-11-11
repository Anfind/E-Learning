const express = require('express');
const router = express.Router();
const { auth, requireAdmin } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');
const adminStatsController = require('../controllers/adminStatsController');
const adminReportController = require('../controllers/adminReportController');

// User dashboard routes (not admin-only, user can access their own dashboard)
router.get('/dashboard/overview', auth, dashboardController.getDashboardOverview);
router.get('/dashboard/progress/:majorId', auth, dashboardController.getMajorProgress);

// Admin statistics routes
router.get('/stats/overview', auth, requireAdmin, adminStatsController.getOverviewStats);
router.get('/stats/users', auth, requireAdmin, adminStatsController.getUserStats);
router.get('/stats/learning', auth, requireAdmin, adminStatsController.getLearningStats);
router.get('/stats/engagement', auth, requireAdmin, adminStatsController.getEngagementStats);
router.get('/stats/community', auth, requireAdmin, adminStatsController.getCommunityStats);

// Admin report routes (exportable)
router.get('/reports/users', auth, requireAdmin, adminReportController.getUserReport);
router.get('/reports/progress', auth, requireAdmin, adminReportController.getProgressReport);
router.get('/reports/engagement', auth, requireAdmin, adminReportController.getEngagementReport);

module.exports = router;
