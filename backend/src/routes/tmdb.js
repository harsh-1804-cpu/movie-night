const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tmdbController');
const auth = require('../middleware/auth');

router.get('/search', auth, ctrl.search);
router.get('/movie/:id', auth, ctrl.details);

module.exports = router;
