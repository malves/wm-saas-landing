const { body, validationResult } = require('express-validator');

// Règles de validation pour registration
exports.validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Le nom est requis')
    .isLength({ min: 2 }).withMessage('Le nom doit contenir au moins 2 caractères'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('L\'email est requis')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Le mot de passe est requis')
    .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Les mots de passe ne correspondent pas');
      }
      return true;
    })
];

// Règles de validation pour login
exports.validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('L\'email est requis')
    .isEmail().withMessage('Email invalide'),
  
  body('password')
    .notEmpty().withMessage('Le mot de passe est requis')
];

// Règles de validation pour landing page
exports.validateLandingPage = [
  body('name')
    .trim()
    .notEmpty().withMessage('Le nom est requis')
    .isLength({ min: 3 }).withMessage('Le nom doit contenir au moins 3 caractères'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('La description est requise')
];

// Règles de validation pour lead
exports.validateLead = [
  body('email')
    .trim()
    .notEmpty().withMessage('L\'email est requis')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),
  
  body('firstName')
    .optional({ checkFalsy: true })
    .trim(),
  
  body('lastName')
    .optional({ checkFalsy: true })
    .trim(),
  
  body('phone')
    .optional({ checkFalsy: true })
    .trim(),
  
  body('address')
    .optional({ checkFalsy: true })
    .trim(),
  
  body('postalCode')
    .optional({ checkFalsy: true })
    .trim(),
  
  body('city')
    .optional({ checkFalsy: true })
    .trim()
];

// Règles de validation pour le profil utilisateur
exports.validateProfile = [
  body('name')
    .trim()
    .notEmpty().withMessage('Le nom est requis')
    .isLength({ min: 2 }).withMessage('Le nom doit contenir au moins 2 caractères'),

  body('email')
    .trim()
    .notEmpty().withMessage('L\'email est requis')
    .isEmail().withMessage('Email invalide')
    .normalizeEmail(),

  body('phone')
    .optional({ checkFalsy: true })
    .isLength({ max: 30 }).withMessage('Téléphone trop long'),

  body('city')
    .optional({ checkFalsy: true })
    .isLength({ max: 60 }).withMessage('Ville trop longue'),

  body('state')
    .optional({ checkFalsy: true })
    .isLength({ max: 60 }).withMessage('État trop long'),
];

// Middleware pour vérifier les erreurs
exports.checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.session.errors = errors.array();
    req.session.formData = req.body;
    return res.redirect('back');
  }
  next();
};

