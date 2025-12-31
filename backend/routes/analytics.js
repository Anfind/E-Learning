/**
 * Analytics Routes
 * Routes for learning analytics and progress reports
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getOverview,
  getMonthlyReport,
  getExamAnalysis,
  getSubjectProgress,
  getAIAnalysis,
  getStudentProgressForTeacher
} = require('../controllers/analyticsController');

// All routes require authentication
router.use(auth);

// GET /api/analytics/overview - Dashboard overview (Student/Teacher)
router.get('/overview', getOverview);

// GET /api/analytics/monthly/:year/:month - Monthly report
router.get('/monthly/:year/:month', getMonthlyReport);

// GET /api/analytics/exam/:attemptId - Exam analysis
router.get('/exam/:attemptId', getExamAnalysis);

// GET /api/analytics/subject/:subjectId - Subject progress
router.get('/subject/:subjectId', getSubjectProgress);

// POST /api/analytics/ai-insights - Get AI insights
router.post('/ai-insights', getAIAnalysis);

// GET /api/analytics/students/:id - Teacher views student detail (Teacher only)
router.get('/students/:id', getStudentProgressForTeacher);

module.exports = router;
