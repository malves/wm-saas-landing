exports.getSettings = (req, res) => {
  res.locals.activeMenu = 'settings';
  
  res.render('pages/settings/index', {
    title: 'Paramètres',
    activeMenu: 'settings',
    errors: req.session.errors || [],
    flash: req.session.flash
  });

  delete req.session.errors;
  delete req.session.flash;
};

