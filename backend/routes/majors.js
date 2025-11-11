const express = require('express');
const router = express.Router();
const { auth, requireAdmin, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const majorController = require('../controllers/majorController');

// @route   GET /api/majors
// @desc    List all majors (Public, but optional auth for user-specific data)
// @access  Public
router.get('/', optionalAuth, majorController.listMajors);

// @route   GET /api/majors/:id
// @desc    Get major detail with subjects
// @access  Public
router.get('/:id', optionalAuth, majorController.getMajorDetail);

// @route   POST /api/majors
// @desc    Create new major (with optional image upload)
// @access  Private/Admin
router.post('/', auth, requireAdmin, upload.single('courseImage'), majorController.createMajor);

// @route   PATCH /api/majors/:id
// @desc    Update major (with optional image upload)
// @access  Private/Admin
router.patch('/:id', auth, requireAdmin, upload.single('courseImage'), majorController.updateMajor);

// @route   DELETE /api/majors/:id
// @desc    Delete major
// @access  Private/Admin
router.delete('/:id', auth, requireAdmin, majorController.deleteMajor);

module.exports = router;
