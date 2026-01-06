const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireGuest } = require('../middlewares/auth');
const { validateLogin, validateRegister, checkValidation } = require('../middlewares/validation');

// Routes accessibles uniquement si NON connecté
router.get('/login', requireGuest, authController.getLogin);
router.post('/login', requireGuest, validateLogin, checkValidation, authController.postLogin);

router.get('/register', requireGuest, authController.getRegister);
router.post('/register', requireGuest, validateRegister, checkValidation, authController.postRegister);

router.get('/forgot', requireGuest, authController.getForgot);
router.get('/reset', requireGuest, authController.getReset);

// Logout accessible si connecté
router.post('/logout', authController.logout);
router.get('/logout', authController.logout);

module.exports = router;

