const express = require('express');
const router = express.Router();
const { auth, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const userController = require('../controllers/userController');

// @route   GET /api/users
// @desc    List all users with filters
// @access  Private/Admin
router.get('/', auth, requireAdmin, userController.listUsers);

// @route   GET /api/users/registered-faces
// @desc    Get users with registered faces (for face testing)
// @access  Private (Any authenticated user)
router.get('/registered-faces', auth, userController.getUsersWithFaces);

// @route   GET /api/users/pending
// @desc    Get users pending approval
// @access  Private/Admin
router.get('/pending', auth, requireAdmin, userController.getPendingUsers);

// @route   GET /api/users/suggestions
// @desc    Get friend suggestions (users in same majors)
// @access  Private
router.get('/suggestions', auth, userController.getUserSuggestions);

// @route   GET /api/users/:id
// @desc    Get user detail
// @access  Private (Own profile or Admin)
router.get('/:id', auth, userController.getUserDetail);

// @route   PATCH /api/users/:id/approve
// @desc    Approve pending user
// @access  Private/Admin
router.patch('/:id/approve', auth, requireAdmin, userController.approveUser);

// @route   PATCH /api/users/:id/status
// @desc    Update user status (ACTIVE/DEACTIVE)
// @access  Private/Admin
router.patch('/:id/status', auth, requireAdmin, userController.updateUserStatus);

// @route   PATCH /api/users/:id
// @desc    Update user profile (with optional avatar upload)
// @access  Private (Own profile or Admin)
router.patch('/:id', auth, upload.single('avatar'), userController.updateProfile);

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete('/:id', auth, requireAdmin, userController.deleteUser);

module.exports = router;
