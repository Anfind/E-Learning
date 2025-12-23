const express = require('express');
const router = express.Router();
const { auth, requireAdmin, optionalAuth, requireTeacherOrAdmin, requireSubjectTeacher } = require('../middleware/auth');
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

// Teacher hoặc Admin có thể tạo/sửa/xóa bài thi (kiểm tra quyền trong controller)
router.post('/', auth, requireTeacherOrAdmin, examController.createExam);
router.post('/:id/questions', auth, requireTeacherOrAdmin, examController.addQuestions);
router.patch('/:id/questions/reorder', auth, requireTeacherOrAdmin, examController.reorderQuestions);
router.patch('/:id/questions/:questionId', auth, requireTeacherOrAdmin, examController.updateQuestion);
router.delete('/:id/questions/:questionId', auth, requireTeacherOrAdmin, examController.deleteQuestion);
router.patch('/:id', auth, requireTeacherOrAdmin, examController.updateExam);
router.delete('/:id', auth, requireTeacherOrAdmin, examController.deleteExam);

module.exports = router;
