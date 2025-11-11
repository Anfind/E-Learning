const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const faceController = require('../controllers/faceController');
const upload = require('../middleware/upload');
const { auth } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Đăng ký tài khoản (không upload ảnh, chỉ thông tin cơ bản)
// @access  Public
router.post('/register', authController.register);

// @route   POST /api/auth/login
// @desc    Đăng nhập
// @access  Public
router.post('/login', authController.login);

// @route   GET /api/auth/me
// @desc    Lấy thông tin user hiện tại
// @access  Private
router.get('/me', auth, authController.getMe);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', authController.refreshToken);

// @route   POST /api/auth/logout
// @desc    Đăng xuất
// @access  Private
router.post('/logout', auth, authController.logout);

// @route   POST /api/auth/register-face
// @desc    Đăng ký khuôn mặt (user tự đăng ký)
// @access  Private
router.post('/register-face', auth, upload.single('image'), faceController.registerFace);

module.exports = router;
