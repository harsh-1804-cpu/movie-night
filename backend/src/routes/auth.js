const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const ctrl = require('../controllers/authController');

router.post('/signup', upload.single('avatar'), ctrl.signup);
router.post('/login', ctrl.login);

module.exports = router;
