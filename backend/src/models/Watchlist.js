const mongoose = require('mongoose');

const MovieSubSchema = new mongoose.Schema({
  tmdbId: { type: Number, required: true },
  title: String,
  posterPath: String,
  releaseDate: String,
  overview: String,
  trailerKey: String, 
  addedAt: { type: Date, default: Date.now },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { _id: false });

const WatchlistSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  description: String,
  visibility: { type: String, enum: ['public', 'private'], default: 'private', index: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  movies: [MovieSubSchema],
  inviteCode: { type: String, unique: true, sparse: true },
  partyTime: { type: Date, default: null }

}, { timestamps: true });

WatchlistSchema.index({ owner: 1, visibility: 1 });

module.exports = mongoose.model('Watchlist', WatchlistSchema);
