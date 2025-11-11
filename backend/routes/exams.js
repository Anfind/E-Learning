const express = require('express');
const router = express.Router();
const { auth, requireAdmin, optionalAuth } = require('../middleware/auth');
const examController = require('../controllers/examController');
const examTakingController = require('../controllers/examTakingController');

// User exam taking routes (must come before admin routes to avoid conflicts)
router.post('/:id/start', auth, examTakingController.startExam);
router.post('/:id/submit', auth, examTakingController.submitExam);
router.get('/:id/attempts', auth, examTakingController.getExamAttempts);
router.get('/attempts/:attemptId/result', auth, examTakingController.getExamResult);

// Admin/Public exam management routes
router.get('/', optionalAuth, examController.listExams);
router.get('/:id', optionalAuth, examController.getExamDetail);
router.post('/', auth, requireAdmin, examController.createExam);
router.post('/:id/questions', auth, requireAdmin, examController.addQuestions);
router.patch('/:id/questions/reorder', auth, requireAdmin, examController.reorderQuestions);
router.patch('/:id/questions/:questionId', auth, requireAdmin, examController.updateQuestion);
router.delete('/:id/questions/:questionId', auth, requireAdmin, examController.deleteQuestion);
router.patch('/:id', auth, requireAdmin, examController.updateExam);
router.delete('/:id', auth, requireAdmin, examController.deleteExam);

module.exports = router;
