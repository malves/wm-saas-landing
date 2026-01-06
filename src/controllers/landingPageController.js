const landingPageService = require('../services/landingPageService');
const libraryService = require('../services/libraryService');
const fs = require('fs');
const path = require('path');

exports.getList = (req, res) => {
  try {
    res.locals.activeMenu = 'landingpages';
    const landingPages = landingPageService.getAllLandingPages();
    res.render('pages/landingpages/list', {
      title: 'Campagnes',
      landingPages,
      activeMenu: 'landingpages'
    });
  } catch (error) {
    console.error('Error in getList:', error);
    res.status(500).send('Erreur serveur');
  }
};

exports.getDetails = (req, res) => {
  try {
    res.locals.activeMenu = 'landingpages';
    const landingPage = landingPageService.getLandingPageById(req.params.id);
    if (!landingPage) {
      return res.status(404).render('pages/404', {
        title: 'Landing page non trouvée',
        activeMenu: 'landingpages'
      });
    }

    // Récupérer les librairies pour l'attachement de templates
    const rawLibraries = libraryService.getAllLibraries();
    // Enrichir chaque librairie avec ses fichiers depuis le système de fichiers
    const libraries = rawLibraries.map(lib => {
      const structure = libraryService.getLibraryStructure(lib.id, '/');
      return {
        ...lib,
        files: structure.files || []
      };
    });
    const attachedTemplates = landingPageService.getAttachedTemplates(req.params.id);
    let mainHtmlFile = landingPageService.getMainHtmlFile(req.params.id);

    // Si un fichier HTML principal est défini, charger son contenu pour la vérification du formulaire
    if (mainHtmlFile) {
      try {
        const TEMPLATES_DIR = path.join(__dirname, '../../public/templates');
        const htmlFilePath = path.join(
          TEMPLATES_DIR,
          mainHtmlFile.libraryId.toString(),
          mainHtmlFile.filePath === '/' ? '' : mainHtmlFile.filePath,
          mainHtmlFile.fileName
        );
        
        if (fs.existsSync(htmlFilePath)) {
          mainHtmlFile.htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');
        }
      } catch (error) {
        console.error('Error loading main HTML file content:', error);
      }
    }

    // Récupérer tous les fichiers HTML disponibles dans les librairies attachées
    const availableHtmlFiles = [];
    attachedTemplates.forEach(template => {
      const structure = libraryService.getLibraryStructure(template.libraryId, '/');
      if (structure && structure.files) {
        structure.files
          .filter(f => f.type === 'html' || f.type === 'htm')
          .forEach(file => {
            availableHtmlFiles.push({
              libraryId: template.libraryId,
              libraryName: libraries.find(l => l.id === template.libraryId)?.name || 'Inconnu',
              fileName: file.name,
              filePath: file.path || '/',
              size: file.size
            });
          });
      }
    });

    // Récupérer les stats de visiteurs (avec les vraies données par jour)
    const visitorStats = landingPageService.getVisitorStats(req.params.id);
    
    // Récupérer les données pour le graphique (7 et 15 jours)
    const chartData7 = landingPageService.getDailyChartData(req.params.id, 7);
    const chartData15 = landingPageService.getDailyChartData(req.params.id, 15);

    res.render('pages/landingpages/details', {
      title: landingPage.name,
      landingPage,
      libraries,
      attachedTemplates,
      mainHtmlFile,
      availableHtmlFiles,
      visitorStats, // { total, thisWeek, lastWeek, growth }
      chartData7,   // Données du graphique 7 jours
      chartData15,  // Données du graphique 15 jours
      activeMenu: 'landingpages'
    });
  } catch (error) {
    console.error('Error in getDetails:', error);
    res.status(500).send('Erreur serveur');
  }
};

exports.getCreateForm = (req, res) => {
  res.locals.activeMenu = 'landingpages';
  res.render('pages/landingpages/create', {
    title: 'Créer une landing page',
    activeMenu: 'landingpages',
    errors: req.session.errors || [],
    formData: req.session.formData || {}
  });
  delete req.session.errors;
  delete req.session.formData;
};

exports.postCreate = (req, res) => {
  try {
    const landingPageData = {
      ...req.body,
      createdBy: req.session.user.id
    };
    const landingPage = landingPageService.createLandingPage(landingPageData);
    res.redirect(`/landingpages/${landingPage.id}`);
  } catch (error) {
    req.session.errors = [{ msg: error.message }];
    req.session.formData = req.body;
    res.redirect('/landingpages/create');
  }
};

exports.getEditForm = (req, res) => {
  try {
    res.locals.activeMenu = 'landingpages';
    const landingPage = landingPageService.getLandingPageById(req.params.id);
    if (!landingPage) {
      return res.status(404).render('pages/404', {
        title: 'Landing page non trouvée',
        activeMenu: 'landingpages'
      });
    }
    res.render('pages/landingpages/edit', {
      title: 'Modifier la landing page',
      landingPage,
      activeMenu: 'landingpages',
      errors: req.session.errors || []
    });
    delete req.session.errors;
  } catch (error) {
    console.error('Error in getEditForm:', error);
    res.status(500).send('Erreur serveur');
  }
};

exports.postUpdate = (req, res) => {
  try {
    const landingPage = landingPageService.updateLandingPage(req.params.id, req.body);
    res.redirect(`/landingpages/${landingPage.id}`);
  } catch (error) {
    req.session.errors = [{ msg: error.message }];
    res.redirect(`/landingpages/${req.params.id}/edit`);
  }
};

exports.postDelete = (req, res) => {
  try {
    landingPageService.deleteLandingPage(req.params.id);
    res.redirect('/landingpages');
  } catch (error) {
    console.error('Error in postDelete:', error);
    res.status(500).send('Erreur lors de la suppression');
  }
};

// Attacher un template à une campagne
exports.postAttachTemplate = (req, res) => {
  try {
    const { landingPageId } = req.params;
    const { libraryId, fileName } = req.body;

    if (!libraryId || !fileName) {
      return res.status(400).json({ error: 'LibraryId et fileName requis' });
    }

    landingPageService.attachTemplateToLandingPage(landingPageId, libraryId, fileName);
    res.redirect(`/landingpages/${landingPageId}`);
  } catch (error) {
    console.error('Error in postAttachTemplate:', error);
    res.status(500).send('Erreur lors de l\'attachement');
  }
};

// Détacher un template d'une campagne
exports.postDetachTemplate = (req, res) => {
  try {
    const { landingPageId } = req.params;
    const { libraryId, fileName } = req.body;

    landingPageService.detachTemplateFromLandingPage(landingPageId, libraryId, fileName);
    res.redirect(`/landingpages/${landingPageId}`);
  } catch (error) {
    console.error('Error in postDetachTemplate:', error);
    res.status(500).send('Erreur lors du détachement');
  }
};

// Détacher une librairie complète d'une campagne
exports.postDetachLibrary = (req, res) => {
  try {
    const { landingPageId } = req.params;
    const { libraryId } = req.body;

    // Récupérer tous les templates attachés
    const attachedTemplates = landingPageService.getAttachedTemplates(landingPageId);
    
    // Filtrer ceux qui correspondent à la librairie
    const templatesFromLibrary = attachedTemplates.filter(t => t.libraryId === parseInt(libraryId));
    
    // Détacher chaque template de cette librairie
    templatesFromLibrary.forEach(template => {
      landingPageService.detachTemplateFromLandingPage(landingPageId, template.libraryId, template.fileName);
    });

    res.redirect(`/landingpages/${landingPageId}`);
  } catch (error) {
    console.error('Error in postDetachLibrary:', error);
    res.status(500).send('Erreur lors du détachement de la librairie');
  }
};

// Définir le fichier HTML principal
exports.postSetMainHtmlFile = (req, res) => {
  try {
    const { landingPageId } = req.params;
    const { libraryId, fileName, filePath } = req.body;

    console.log('📥 postSetMainHtmlFile - Headers:', req.headers.accept);
    console.log('📥 postSetMainHtmlFile - XHR:', req.xhr);

    if (!libraryId || !fileName) {
      return res.status(400).json({ error: 'LibraryId et fileName requis' });
    }

    landingPageService.setMainHtmlFile(landingPageId, libraryId, fileName, filePath || '/');
    
    // Si c'est une requête AJAX, renvoyer du JSON
    const acceptHeader = req.headers.accept || '';
    const isAjax = acceptHeader.includes('application/json') || req.get('X-Requested-With') === 'XMLHttpRequest';
    
    console.log('📥 Is AJAX?', isAjax, '- Accept:', acceptHeader);
    
    if (isAjax) {
      console.log('✅ Envoi de la réponse JSON');
      return res.json({ success: true, message: 'Page principale définie avec succès' });
    }
    
    console.log('🔄 Redirection vers:', `/landingpages/${landingPageId}`);
    res.redirect(`/landingpages/${landingPageId}`);
  } catch (error) {
    console.error('Error in postSetMainHtmlFile:', error);
    
    // Si c'est une requête AJAX, renvoyer une erreur JSON
    const acceptHeader = req.headers.accept || '';
    const isAjax = acceptHeader.includes('application/json') || req.get('X-Requested-With') === 'XMLHttpRequest';
    
    if (isAjax) {
      return res.status(500).json({ success: false, error: 'Erreur lors de la définition du fichier principal' });
    }
    
    res.status(500).send('Erreur lors de la définition du fichier principal');
  }
};

// Supprimer le fichier HTML principal
exports.postClearMainHtmlFile = (req, res) => {
  try {
    const { landingPageId } = req.params;

    landingPageService.clearMainHtmlFile(landingPageId);
    res.redirect(`/landingpages/${landingPageId}`);
  } catch (error) {
    console.error('Error in postClearMainHtmlFile:', error);
    res.status(500).send('Erreur lors de la suppression du fichier principal');
  }
};
