const landingPageService = require('../services/landingPageService');

exports.getMain = (req, res) => {
  try {
    res.locals.activeMenu = 'activity';
    const landingPages = landingPageService.getAllLandingPages();
    const stats = landingPageService.getLandingPageStats();
    
    res.render('pages/activity/main', {
      title: 'Journal d\'activité',
      landingPages,
      stats,
      activeMenu: 'activity'
    });
  } catch (error) {
    console.error('Error in getMain:', error);
    res.status(500).send('Erreur serveur');
  }
};

exports.getCollection = (req, res) => {
  try {
    res.locals.activeMenu = 'activity';
    const landingPages = landingPageService.getAllLandingPages();
    
    res.render('pages/activity/collection', {
      title: 'Collection',
      landingPages,
      activeMenu: 'activity'
    });
  } catch (error) {
    console.error('Error in getCollection:', error);
    res.status(500).send('Erreur serveur');
  }
};
