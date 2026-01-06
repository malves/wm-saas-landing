// Vérifier que l'utilisateur est connecté
exports.requireAuth = (req, res, next) => {
  if (!req.session.user) {
    req.session.returnTo = req.originalUrl;
    return res.redirect('/auth/login');
  }
  next();
};

// Vérifier que l'utilisateur n'est PAS connecté (pour login/register)
exports.requireGuest = (req, res, next) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  next();
};

// Vérifier le rôle admin
exports.requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).render('pages/error', {
      title: 'Accès refusé',
      activeMenu: null,
      error: { message: 'Vous n\'avez pas les droits pour accéder à cette page' }
    });
  }
  next();
};

// Middleware pour rendre l'utilisateur disponible dans toutes les vues
exports.setUserLocals = (req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.isAuthenticated = !!req.session.user;
  next();
};

