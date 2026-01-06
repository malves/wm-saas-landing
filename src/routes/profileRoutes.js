const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { requireAuth } = require('../middlewares/auth');
const { validateProfile, checkValidation } = require('../middlewares/validation');

router.get('/', requireAuth, profileController.getProfile);
router.post('/', requireAuth, validateProfile, checkValidation, profileController.postProfile);

// User management routes (admin only)
router.get('/users', requireAuth, profileController.getUsers);
router.get('/users/create', requireAuth, profileController.getCreateUser);
router.post('/users', requireAuth, profileController.postCreateUser);
router.get('/users/:id/edit', requireAuth, profileController.getEditUser);
router.post('/users/:id', requireAuth, validateProfile, checkValidation, profileController.postEditUser);

module.exports = router;

