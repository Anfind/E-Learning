const express = require('express');
const router = express.Router();
const { auth, requireTeacher, requireTeacherOrAdmin } = require('../middleware/auth');
const teacherController = require('../controllers/teacherController');

/**
 * Teacher Routes
 * Tất cả routes đều yêu cầu role TEACHER
 */

// @route   GET /api/teacher/dashboard
// @desc    Lấy tổng quan dashboard cho teacher
// @access  Private/Teacher
router.get('/dashboard', auth, requireTeacherOrAdmin, teacherController.getDashboard);

// @route   GET /api/teacher/subjects
// @desc    Lấy danh sách môn học mà teacher phụ trách
// @access  Private/Teacher
router.get('/subjects', auth, requireTeacherOrAdmin, teacherController.getMySubjects);

// @route   GET /api/teacher/lessons
// @desc    Lấy tất cả bài học của các môn mà teacher phụ trách
// @access  Private/Teacher
router.get('/lessons', auth, requireTeacherOrAdmin, teacherController.getMyLessons);

// @route   GET /api/teacher/exams
// @desc    Lấy tất cả bài thi của các môn mà teacher phụ trách
// @access  Private/Teacher
router.get('/exams', auth, requireTeacherOrAdmin, teacherController.getMyExams);

// @route   GET /api/teacher/subjects/:subjectId/students
// @desc    Lấy danh sách sinh viên đã enroll vào môn học
// @access  Private/Teacher
router.get('/subjects/:subjectId/students', auth, requireTeacherOrAdmin, teacherController.getSubjectStudents);

// @route   GET /api/teacher/subjects/:subjectId/students/:studentId
// @desc    Lấy chi tiết tiến độ học của một sinh viên
// @access  Private/Teacher
router.get('/subjects/:subjectId/students/:studentId', auth, requireTeacherOrAdmin, teacherController.getStudentDetail);

// @route   GET /api/teacher/subjects/:subjectId/exam-results
// @desc    Lấy tất cả kết quả thi của môn học
// @access  Private/Teacher
router.get('/subjects/:subjectId/exam-results', auth, requireTeacherOrAdmin, teacherController.getSubjectExamResults);

module.exports = router;
