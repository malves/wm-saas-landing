const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { requireAuth } = require('../middlewares/auth');

// Route de recherche globale
router.get('/', requireAuth, searchController.apiSearch);

// Route d'export CSV
router.get('/export', requireAuth, searchController.exportSearchResults);

module.exports = router;
