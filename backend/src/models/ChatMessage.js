const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  watchlistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Watchlist', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: String,
  text: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
