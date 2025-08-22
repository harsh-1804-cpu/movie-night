const Watchlist = require('../models/Watchlist');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

exports.createWatchlist = async (req, res) => {
  const { title, description, visibility } = req.body;
  try {
    const wl = new Watchlist({ title, description, visibility: visibility || 'private', owner: req.user.id, members: [req.user.id] });
    await wl.save();
    res.json(wl);
  } catch (err) { res.status(500).json({ msg: 'Server error' }); }
};

exports.getWatchlists = async (req, res) => {
  try {
    const userId = req.user?.id;
    const filter = {
      $or: [
        { visibility: 'public' },
        ...(userId ? [{ owner: userId }, { members: userId }] : [])
      ]
    };
    const lists = await Watchlist.find(filter).populate('owner', 'username avatarUrl').sort({ updatedAt: -1 });
    res.json(lists);
  } catch (err) { res.status(500).json({ msg: 'Server error' }); }
};

exports.getOne = async (req, res) => {
  try {
    const wl = await Watchlist.findById(req.params.id).populate('owner', 'username avatarUrl');
    if (!wl) return res.status(404).json({ msg: 'Not found' });
    if (wl.visibility === 'private' && !wl.members.map(String).includes(String(req.user.id)) && String(wl.owner._id) !== String(req.user.id)) return res.status(403).json({ msg: 'Forbidden' });
    res.json(wl);
  } catch (err) { res.status(500).json({ msg: 'Server error' }); }
};

exports.updateWatchlist = async (req, res) => {
  try {
    const wl = await Watchlist.findById(req.params.id);
    if (!wl) return res.status(404).json({ msg: 'Not found' });
    if (String(wl.owner) !== String(req.user.id)) return res.status(403).json({ msg: 'Only owner can edit' });
    const { title, description, visibility,partyTime } = req.body;
    if (title) wl.title = title;
    if (description) wl.description = description;
    if (visibility) wl.visibility = visibility;
    if (partyTime) wl.partyTime = new Date(partyTime);
    await wl.save();

    // Emit updated partyTime to all users
    const io = req.app.get('io');
    io.to(wl._id.toString()).emit('partyTimeUpdated', { partyTime: wl.partyTime });

    res.json(wl);
  } catch (err) { res.status(500).json({ msg: 'Server error' }); }
};

exports.deleteWatchlist = async (req, res) => {
  try {
    const wl = await Watchlist.findById(req.params.id);
    if (!wl) return res.status(404).json({ msg: 'Not found' });
    if (String(wl.owner) !== String(req.user.id)) return res.status(403).json({ msg: 'Only owner' });
    await wl.deleteOne();
    res.json({ msg: 'Deleted' });
  } catch (err) { res.status(500).json({ msg: 'Server error' }); }
};

exports.addMovie = async (req, res) => {
  try {
    const { id } = req.params;
    const { tmdbId, title, posterPath, releaseDate, overview } = req.body;
    // Fetch trailer from TMDB
    const trailerRes = await axios.get(
      `https://api.themoviedb.org/3/movie/${tmdbId}/videos`,
      { params: { api_key: process.env.TMDB_API_KEY } }
    );

    const trailer = trailerRes.data.results.find(
      v => v.site === "YouTube" && v.type === "Trailer"
    );
    const wl = await Watchlist.findById(req.params.id);
    if (!wl) return res.status(404).json({ msg: 'Not found' });
    if (String(wl.owner) !== String(req.user.id) && !wl.members.map(String).includes(String(req.user.id)))
      return res.status(403).json({ msg: 'Not allowed' });
    if (wl.movies.some(m => m.tmdbId === Number(tmdbId))) return res.status(400).json({ msg: 'Already added' });

    wl.movies.push({ tmdbId, title, posterPath, releaseDate, overview, trailerKey: trailer ? trailer.key : null, addedBy: req.user.id });
    await wl.save();

    // Emit new movie event via Socket.IO
    const io = req.app.get('io'); // server.js must set io in app
    io.to(wl._id.toString()).emit('newMovie', {
      tmdbId,
      title,
      posterPath,
      releaseDate,
      overview,
      trailerKey: trailer ? trailer.key : null,
      addedBy: req.user.id
    });

    res.json(wl);
  } catch (err) { res.status(500).json({ msg: 'Server error' }); }
};


exports.removeMovie = async (req, res) => {
  try {
    const { id, tmdbId } = req.params;

    const watchlist = await Watchlist.findById(id);
    if (!watchlist) return res.status(404).json({ msg: 'Watchlist not found' });

    // Authorization check
    if (watchlist.owner.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Only the owner can delete movies' });
    }


    // Remove the movie by tmdbId
    watchlist.movies = watchlist.movies.filter(
      (m) => m.tmdbId.toString() !== tmdbId.toString()
    );

    await watchlist.save();

    // emit socket event for realtime removal
    req.io?.to(id).emit('movieRemoved', { tmdbId });

    res.json({ msg: 'Movie removed', watchlist });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

//Generate Invite
// controllers/watchlistController.js
exports.generateInvite = async (req, res) => {
  try {
    const watchlist = await Watchlist.findById(req.params.id);
    if (!watchlist) return res.status(404).json({ msg: 'Watchlist not found' });

    // ✅ Only owner can generate invite
    if (String(watchlist.owner) !== req.user.id) {
      return res.status(403).json({ msg: 'Not allowed' });
    }

    // Generate invite code if not present
    if (!watchlist.inviteCode) {
      watchlist.inviteCode = Math.random().toString(36).substring(2, 10);
      await watchlist.save();
    }

    // ✅ Always return { code: ... }
    res.json({ code: watchlist.inviteCode });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};



// Join using invite code
exports.joinWithInvite = async (req, res) => {
  try {
    const { code } = req.params;
    const watchlist = await Watchlist.findOne({ inviteCode: code });
    if (!watchlist) return res.status(404).json({ msg: 'Invalid invite link' });

    if (!watchlist.members.includes(req.user.id)) {
      watchlist.members.push(req.user.id);
      await watchlist.save();
    }

    res.json({ msg: 'Joined watchlist', watchlist });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};