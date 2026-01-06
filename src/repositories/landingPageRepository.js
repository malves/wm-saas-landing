const db = require('../data/jsonDatabaseService');

class LandingPageRepository {
  // Helper pour nettoyer les données avant sauvegarde
  _sanitizeForSave(data) {
    const sanitized = { ...data };
    
    // Supprimer htmlContent du mainHtmlFile si présent
    if (sanitized.mainHtmlFile && sanitized.mainHtmlFile.htmlContent) {
      const { htmlContent, ...mainHtmlFileWithoutContent } = sanitized.mainHtmlFile;
      sanitized.mainHtmlFile = mainHtmlFileWithoutContent;
    }
    
    return sanitized;
  }

  findAll() {
    return db.getCollection('landingpages');
  }

  findById(id) {
    const landingPages = this.findAll();
    return landingPages.find(lp => lp.id === parseInt(id));
  }

  findBy(criteria) {
    const landingPages = this.findAll();
    return landingPages.filter(landingPage => {
      return Object.keys(criteria).every(key => 
        landingPage[key] === criteria[key]
      );
    });
  }

  create(landingPageData) {
    const landingPages = db.getCollection('landingpages');
    const newLandingPage = {
      id: db.generateId('landingpages'),
      ...landingPageData,
      visitors: 0,
      dailyStats: {}, // Stats par jour: { "2026-01-06": { visitors: 10 }, ... }
      conversionRate: 0,
      status: landingPageData.status || 'draft',
      attachedTemplates: [], // Templates attachés depuis les librairies
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    landingPages.push(newLandingPage);
    db.save();
    return newLandingPage;
  }

  update(id, landingPageData) {
    const landingPages = db.getCollection('landingpages');
    const index = landingPages.findIndex(lp => lp.id === parseInt(id));
    if (index === -1) return null;
    
    // Nettoyer les données avant sauvegarde
    const sanitizedData = this._sanitizeForSave(landingPageData);
    
    landingPages[index] = {
      ...landingPages[index],
      ...sanitizedData,
      id: landingPages[index].id,
      createdAt: landingPages[index].createdAt,
      updatedAt: new Date().toISOString()
    };
    db.save();
    return landingPages[index];
  }

  delete(id) {
    const landingPages = db.getCollection('landingpages');
    const index = landingPages.findIndex(lp => lp.id === parseInt(id));
    if (index === -1) return false;
    
    landingPages.splice(index, 1);
    db.save();
    return true;
  }

  incrementVisitors(id) {
    const landingPage = this.findById(id);
    if (!landingPage) return null;
    
    // Date du jour au format YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    
    // Initialiser dailyStats si nécessaire (pour les anciennes landing pages)
    const dailyStats = landingPage.dailyStats || {};
    
    // Initialiser ou incrémenter le compteur du jour
    if (!dailyStats[today]) {
      dailyStats[today] = { visitors: 0 };
    }
    dailyStats[today].visitors += 1;
    
    // Incrémenter le total des visiteurs (comme avant)
    const visitors = (landingPage.visitors || 0) + 1;
    
    return this.update(id, { visitors, dailyStats });
  }

  updateStats(id, stats) {
    return this.update(id, stats);
  }

  attachTemplate(landingPageId, libraryId, fileName) {
    const landingPage = this.findById(landingPageId);
    if (!landingPage) return null;

    const attachedTemplates = landingPage.attachedTemplates || [];
    
    // Vérifier si le template n'est pas déjà attaché
    const exists = attachedTemplates.some(
      t => t.libraryId === parseInt(libraryId) && t.fileName === fileName
    );
    
    if (!exists) {
      attachedTemplates.push({
        libraryId: parseInt(libraryId),
        fileName,
        attachedAt: new Date().toISOString()
      });
    }

    return this.update(landingPageId, { attachedTemplates });
  }

  detachTemplate(landingPageId, libraryId, fileName) {
    const landingPage = this.findById(landingPageId);
    if (!landingPage) return null;

    const attachedTemplates = (landingPage.attachedTemplates || []).filter(
      t => !(t.libraryId === parseInt(libraryId) && t.fileName === fileName)
    );

    // Si le fichier détaché était le fichier principal, réinitialiser
    let mainHtmlFile = landingPage.mainHtmlFile;
    if (mainHtmlFile && 
        mainHtmlFile.libraryId === parseInt(libraryId) && 
        mainHtmlFile.fileName === fileName) {
      mainHtmlFile = null;
    }

    return this.update(landingPageId, { attachedTemplates, mainHtmlFile });
  }

  setMainHtmlFile(landingPageId, libraryId, fileName, filePath = '/') {
    const landingPage = this.findById(landingPageId);
    if (!landingPage) return null;

    const mainHtmlFile = {
      libraryId: parseInt(libraryId),
      fileName,
      filePath,
      setAt: new Date().toISOString()
    };

    return this.update(landingPageId, { mainHtmlFile });
  }

  clearMainHtmlFile(landingPageId) {
    const landingPage = this.findById(landingPageId);
    if (!landingPage) return null;

    return this.update(landingPageId, { mainHtmlFile: null });
  }

  findBySlug(slug) {
    const landingPages = this.findAll();
    return landingPages.find(lp => lp.slug === slug);
  }
}

module.exports = new LandingPageRepository();
