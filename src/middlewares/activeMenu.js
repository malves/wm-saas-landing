module.exports = (req, res, next) => {
  // Déterminer automatiquement le menu actif à partir de l'URL si aucun contrôleur ne l'a renseigné
  if (!res.locals.activeMenu) {
    if (req.path === '/' || req.path === '/dashboard') {
      res.locals.activeMenu = 'dashboard';
    } else if (req.path.startsWith('/landingpages')) {
      res.locals.activeMenu = 'landingpages';
    } else if (req.path.startsWith('/leads')) {
      res.locals.activeMenu = 'leads';
    } else if (req.path.startsWith('/libraries')) {
      res.locals.activeMenu = 'libraries';
    } else if (req.path.startsWith('/activity')) {
      res.locals.activeMenu = 'activity';
    }
  }

  res.locals.isActive = (menuItem) => {
    return res.locals.activeMenu === menuItem ? 'active' : '';
  };

  next();
};
