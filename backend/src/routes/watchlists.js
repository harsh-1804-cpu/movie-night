const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/watchlistController');


router.post('/', auth, ctrl.createWatchlist);
router.get('/', ctrl.getWatchlists);
router.get('/:id', ctrl.getOne);
router.put('/:id', auth, ctrl.updateWatchlist);
router.delete('/:id', auth, ctrl.deleteWatchlist);
router.post('/:id/movies', auth, ctrl.addMovie);
router.delete('/:id/movies/:tmdbId', auth, ctrl.removeMovie);
router.post('/:id/invite', auth, ctrl.generateInvite);  // Generate invite link
router.post('/join/:code', auth, ctrl.joinWithInvite);  // Join with invite code

// Update watch party time (only owner)
router.put('/:id/party', auth, async (req, res) => {
  const { partyTime } = req.body;
  try {
    const watchlist = await Watchlist.findById(req.params.id);
    if (!watchlist) return res.status(404).json({ msg: 'Watchlist not found' });
    if (String(watchlist.owner) !== req.user.id) return res.status(403).json({ msg: 'Only owner can update party time' });

    watchlist.partyTime = partyTime ? new Date(partyTime) : null;
    await watchlist.save();

    // Emit Socket.IO event to all users in the room
    const io = req.app.get('io');
    io.to(req.params.id).emit('partyTimeUpdated', { partyTime: watchlist.partyTime });

    res.json(watchlist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ✅ Toggle visibility
router.patch("/:id/visibility", auth, async (req, res) => {
  try {
    const watchlist = await Watchlist.findById(req.params.id);
    if (!watchlist) return res.status(404).json({ msg: "Watchlist not found" });

    // Only owner can toggle
    if (watchlist.owner.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized" });
    }

    watchlist.isPublic = req.body.isPublic;
    await watchlist.save();

    res.json(watchlist);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});
module.exports = router;
