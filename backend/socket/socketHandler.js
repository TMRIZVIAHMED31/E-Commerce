const jwt = require('jsonwebtoken');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Real-time chat between a user (buyer) and a seller.
// Each conversation is a "room" identified by its Mongo _id.
function initSocket(io) {
  // Auth every socket connection using the same JWT used for REST calls
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token provided'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: user ${socket.userId}`);

    // Client joins a conversation room after opening a chat thread
    socket.on('joinConversation', async (conversationId) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;
        const allowed =
          socket.userRole === 'admin' ||
          conversation.participants.some((p) => p.toString() === socket.userId);
        if (!allowed) return;
        socket.join(conversationId);
      } catch (err) {
        console.error('joinConversation error:', err.message);
      }
    });

    // Send a message: persist to DB then broadcast to everyone in the room
    socket.on('sendMessage', async ({ conversationId, text }) => {
      try {
        if (!text || !text.trim()) return;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;
        const allowed =
          socket.userRole === 'admin' ||
          conversation.participants.some((p) => p.toString() === socket.userId);
        if (!allowed) return;

        const message = await Message.create({
          conversation: conversationId,
          sender: socket.userId,
          text: text.trim(),
          readBy: [socket.userId],
        });
        await message.populate('sender', 'name role');

        conversation.lastMessage = text.trim();
        conversation.lastMessageAt = new Date();
        await conversation.save();

        io.to(conversationId).emit('newMessage', message);
      } catch (err) {
        console.error('sendMessage error:', err.message);
      }
    });

    // Basic typing indicator
    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(conversationId).emit('typing', { userId: socket.userId, isTyping });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: user ${socket.userId}`);
    });
  });
}

module.exports = initSocket;
