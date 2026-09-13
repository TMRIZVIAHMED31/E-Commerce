const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// @route POST /api/chat/conversations   body: { sellerId, productId? }
// A 'user' (or admin) starts/reopens a conversation with a seller.
const startConversation = async (req, res) => {
  try {
    const { sellerId, productId } = req.body;
    if (!sellerId) return res.status(400).json({ message: 'sellerId is required' });

    const seller = await User.findById(sellerId);
    if (!seller || seller.role !== 'seller') {
      return res.status(404).json({ message: 'Seller not found' });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, sellerId] },
      ...(productId ? { product: productId } : {}),
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, sellerId],
        product: productId || undefined,
      });
    }

    res.status(201).json(conversation);
  } catch (err) {
    res.status(500).json({ message: 'Failed to start conversation', error: err.message });
  }
};

// @route GET /api/chat/conversations  (all conversations the logged-in user/seller/admin is part of)
const getMyConversations = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { participants: req.user._id };
    const conversations = await Conversation.find(filter)
      .populate('participants', 'name email role')
      .populate('product', 'name image price')
      .sort({ lastMessageAt: -1 });
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch conversations', error: err.message });
  }
};

// @route GET /api/chat/messages/:conversationId
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    const isParticipant = conversation.participants.some((p) => p.toString() === req.user._id.toString());
    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name role')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch messages', error: err.message });
  }
};

module.exports = { startConversation, getMyConversations, getMessages };
