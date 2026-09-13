const mongoose = require('mongoose');

// One conversation = one buyer <-> one seller, optionally tied to a product
const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Conversation', conversationSchema);
