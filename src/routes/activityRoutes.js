const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { requireAuth } = require('../middlewares/auth');

router.get('/', requireAuth, activityController.getMain);
router.get('/collection', requireAuth, activityController.getCollection);

module.exports = router;

