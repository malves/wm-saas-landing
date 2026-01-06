const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { requireAuth } = require('../middlewares/auth');

// Settings main page
router.get('/', requireAuth, settingsController.getSettings);

module.exports = router;

