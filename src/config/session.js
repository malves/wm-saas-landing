const session = require('express-session');

module.exports = {
  secret: process.env.SESSION_SECRET || 'votre-secret-super-securise-changez-moi',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS en prod
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 jours
  }
};

