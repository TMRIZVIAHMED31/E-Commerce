const express = require('express');
const { startConversation, getMyConversations, getMessages } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/conversations', protect, startConversation);
router.get('/conversations', protect, getMyConversations);
router.get('/messages/:conversationId', protect, getMessages);

module.exports = router;
