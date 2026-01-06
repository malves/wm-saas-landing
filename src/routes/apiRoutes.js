const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const searchRoutes = require('./searchRoutes');

// API pour la capture de leads depuis les landing pages publiques
// Cette route est accessible sans authentification
router.post('/leads/capture', leadController.apiCaptureLead);

// API de recherche globale (protégée par authentification)
router.use('/search', searchRoutes);

module.exports = router;
