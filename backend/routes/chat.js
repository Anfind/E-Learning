const express = require('express');
const router = express.Router();
const { auth, requireAdmin } = require('../middleware/auth');
const chatController = require('../controllers/chatController');

// Generate Stream token
router.post('/token', auth, chatController.generateToken);

// Channel management
router.post('/channels', auth, chatController.createChannel);
router.get('/channels', auth, chatController.getUserChannels);
router.delete('/channels/:type/:id', auth, requireAdmin, chatController.deleteChannel);

// Direct messaging
router.post('/dm', auth, chatController.createDirectMessage);

// Subject/Lesson channels
router.post('/channels/subject/:subjectId', auth, chatController.createSubjectChannel);

// Member management
router.post('/channels/:type/:id/members', auth, chatController.addMembers);
router.delete('/channels/:type/:id/members', auth, chatController.removeMembers);

module.exports = router;
