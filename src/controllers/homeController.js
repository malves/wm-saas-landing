const landingPageService = require('../services/landingPageService');

exports.getHome = async (req, res) => {
  try {
    res.locals.activeMenu = 'dashboard';
    const landingPages = landingPageService.getAllLandingPages();
    const stats = landingPageService.getLandingPageStats();
    
    res.render('pages/home', {
      title: 'Dashboard',
      landingPages,
      stats,
      activeMenu: 'dashboard'
    });
  } catch (error) {
    console.error('Error in homeController:', error);
    res.status(500).send('Erreur serveur');
  }
};
