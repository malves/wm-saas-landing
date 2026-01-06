const express = require('express');
const router = express.Router();

const homeRoutes = require('./homeRoutes');
const landingPageRoutes = require('./landingPageRoutes');
const leadRoutes = require('./leadRoutes');
const libraryRoutes = require('./libraryRoutes');
const authRoutes = require('./authRoutes');
const activityRoutes = require('./activityRoutes');
const profileRoutes = require('./profileRoutes');
const billingRoutes = require('./billingRoutes');
const settingsRoutes = require('./settingsRoutes');
const publicRoutes = require('./publicRoutes');
const apiRoutes = require('./apiRoutes');

router.use('/', homeRoutes);
router.use('/landingpages', landingPageRoutes);
router.use('/leads', leadRoutes);
router.use('/libraries', libraryRoutes);
router.use('/auth', authRoutes);
router.use('/activity', activityRoutes);
router.use('/profile', profileRoutes);
router.use('/billing', billingRoutes);
router.use('/settings', settingsRoutes);

// Routes publiques pour les landing pages (sans authentification)
router.use('/p', publicRoutes);

// Routes API (sans authentification pour certaines)
router.use('/api', apiRoutes);

module.exports = router;

