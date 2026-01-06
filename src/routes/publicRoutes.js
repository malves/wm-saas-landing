const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Route principale pour afficher la landing page
router.get('/:slug', publicController.serveLandingPage);

// Route pour servir les assets (CSS, JS, images) du template
router.get('/:slug/*', publicController.serveAsset);

module.exports = router;
