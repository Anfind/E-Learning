const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const questionController = require('../controllers/questionController');

// Question routes
router.post('/', auth, questionController.createQuestion);
router.get('/', questionController.listQuestions);
router.get('/:id', questionController.getQuestionDetail);
router.patch('/:id', auth, questionController.updateQuestion);
router.delete('/:id', auth, questionController.deleteQuestion);

// Answer routes
router.post('/:id/answers', auth, questionController.createAnswer);
router.patch('/answers/:id', auth, questionController.updateAnswer);
router.delete('/answers/:id', auth, questionController.deleteAnswer);
router.post('/answers/:id/accept', auth, questionController.acceptAnswer);
router.delete('/answers/:id/accept', auth, questionController.unacceptAnswer);

// Tag routes
router.get('/tags/list', questionController.listTags);

module.exports = router;
