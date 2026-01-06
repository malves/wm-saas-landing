const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const { requireAuth } = require('../middlewares/auth');

router.get('/', requireAuth, homeController.getHome);

module.exports = router;

