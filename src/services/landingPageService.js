const landingPageRepository = require('../repositories/landingPageRepository');
const leadRepository = require('../repositories/leadRepository');

class LandingPageService {
  getAllLandingPages() {
    return landingPageRepository.findAll();
  }

  getLandingPageById(id) {
    return landingPageRepository.findById(id);
  }

  getPublishedLandingPages() {
    return landingPageRepository.findBy({ status: 'published' });
  }

  getLandingPagesByStatus(status) {
    return landingPageRepository.findBy({ status });
  }

  createLandingPage(landingPageData) {
    // Validation basique
    if (!landingPageData.name || !landingPageData.description) {
      throw new Error('Le nom et la description sont requis');
    }

    return landingPageRepository.create(landingPageData);
  }

  updateLandingPage(id, landingPageData) {
    const landingPage = landingPageRepository.findById(id);
    if (!landingPage) {
      throw new Error('Landing page non trouvée');
    }

    return landingPageRepository.update(id, landingPageData);
  }

  deleteLandingPage(id) {
    const landingPage = landingPageRepository.findById(id);
    if (!landingPage) {
      throw new Error('Landing page non trouvée');
    }

    return landingPageRepository.delete(id);
  }

  // Calculs et statistiques
  getLandingPageStats() {
    const landingPages = this.getAllLandingPages();
    
    if (landingPages.length === 0) {
      return {
        total: 0,
        published: 0,
        draft: 0,
        avgConversionRate: 0,
        totalVisitors: 0
      };
    }

    return {
      total: landingPages.length,
      published: landingPages.filter(lp => lp.status === 'published').length,
      draft: landingPages.filter(lp => lp.status === 'draft').length,
      avgConversionRate: landingPages.reduce((sum, lp) => sum + (lp.conversionRate || 0), 0) / landingPages.length,
      totalVisitors: landingPages.reduce((sum, lp) => sum + (lp.visitors || 0), 0)
    };
  }

  incrementVisitorCount(landingPageId) {
    return landingPageRepository.incrementVisitors(landingPageId);
  }

  /**
   * Obtenir les visiteurs pour une période donnée
   * @param {number} landingPageId 
   * @param {number} days - Nombre de jours à regarder en arrière (défaut: 7)
   * @returns {number} - Total des visiteurs sur la période
   */
  getVisitorsForPeriod(landingPageId, days = 7) {
    const landingPage = landingPageRepository.findById(landingPageId);
    if (!landingPage || !landingPage.dailyStats) return 0;

    const today = new Date();
    let total = 0;

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      if (landingPage.dailyStats[dateKey]) {
        total += landingPage.dailyStats[dateKey].visitors || 0;
      }
    }

    return total;
  }

  /**
   * Obtenir le total des visiteurs
   * Le champ 'visitors' contient toujours le total à jour (incrémenté à chaque visite)
   * @param {number} landingPageId 
   * @returns {number}
   */
  getTotalVisitors(landingPageId) {
    const landingPage = landingPageRepository.findById(landingPageId);
    if (!landingPage) return 0;

    // Le champ visitors est toujours à jour (incrémenté à chaque visite)
    return landingPage.visitors || 0;
  }

  /**
   * Obtenir les stats détaillées des visiteurs
   * @param {number} landingPageId 
   * @returns {Object} - { total, thisWeek, lastWeek, growth }
   */
  getVisitorStats(landingPageId) {
    const landingPage = landingPageRepository.findById(landingPageId);
    if (!landingPage) {
      return { total: 0, thisWeek: 0, lastWeek: 0, growth: 0 };
    }

    const total = this.getTotalVisitors(landingPageId);
    const thisWeek = this.getVisitorsForPeriod(landingPageId, 7);
    const lastWeek = this.getVisitorsForPeriod(landingPageId, 14) - thisWeek;

    return {
      total,
      thisWeek,
      lastWeek,
      growth: thisWeek - lastWeek
    };
  }

  /**
   * Obtenir les stats quotidiennes pour le graphique (visites et leads par jour)
   * @param {number} landingPageId 
   * @param {number} days - Nombre de jours (7 ou 15)
   * @returns {Object} - { labels, visitors, leads, peakVisitors, peakVisitorsDay, peakLeads, peakLeadsDay, avgLeads }
   */
  getDailyChartData(landingPageId, days = 7) {
    const landingPage = landingPageRepository.findById(landingPageId);
    const dailyStats = landingPage?.dailyStats || {};
    
    // Récupérer tous les leads de cette landing page
    const allLeads = leadRepository.findAll();
    const landingPageLeads = allLeads.filter(lead => 
      lead.sourceLandingPages && lead.sourceLandingPages.includes(parseInt(landingPageId))
    );

    // Noms des jours en français
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    
    const labels = [];
    const visitors = [];
    const leads = [];
    
    const today = new Date();
    
    // Parcourir les X derniers jours (du plus ancien au plus récent)
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const dayName = dayNames[date.getDay()];
      
      labels.push(dayName);
      
      // Visites du jour
      const dayVisitors = dailyStats[dateKey]?.visitors || 0;
      visitors.push(dayVisitors);
      
      // Leads du jour (compter les leads créés ce jour-là)
      const dayLeads = landingPageLeads.filter(lead => {
        if (!lead.createdAt) return false;
        const leadDate = lead.createdAt.split('T')[0];
        return leadDate === dateKey;
      }).length;
      leads.push(dayLeads);
    }
    
    // Calculer les stats
    const peakVisitors = Math.max(...visitors, 0);
    const peakVisitorsIdx = visitors.indexOf(peakVisitors);
    const peakVisitorsDay = peakVisitorsIdx >= 0 ? labels[peakVisitorsIdx] : '-';
    
    const peakLeads = Math.max(...leads, 0);
    const peakLeadsIdx = leads.indexOf(peakLeads);
    const peakLeadsDay = peakLeadsIdx >= 0 ? labels[peakLeadsIdx] : '-';
    
    const totalLeads = leads.reduce((sum, l) => sum + l, 0);
    const avgLeads = days > 0 ? (totalLeads / days).toFixed(1) : '0';
    
    return {
      labels,
      visitors,
      leads,
      peakVisitors,
      peakVisitorsDay,
      peakLeads,
      peakLeadsDay,
      avgLeads,
      totalLeads
    };
  }

  // Gestion des templates attachés
  attachTemplateToLandingPage(landingPageId, libraryId, fileName) {
    const landingPage = landingPageRepository.findById(landingPageId);
    if (!landingPage) {
      throw new Error('Campagne non trouvée');
    }

    return landingPageRepository.attachTemplate(landingPageId, libraryId, fileName);
  }

  detachTemplateFromLandingPage(landingPageId, libraryId, fileName) {
    const landingPage = landingPageRepository.findById(landingPageId);
    if (!landingPage) {
      throw new Error('Campagne non trouvée');
    }

    return landingPageRepository.detachTemplate(landingPageId, libraryId, fileName);
  }

  getAttachedTemplates(landingPageId) {
    const landingPage = landingPageRepository.findById(landingPageId);
    if (!landingPage) {
      return [];
    }

    return landingPage.attachedTemplates || [];
  }

  // Définir le fichier HTML principal
  setMainHtmlFile(landingPageId, libraryId, fileName, filePath = '/') {
    const landingPage = landingPageRepository.findById(landingPageId);
    if (!landingPage) {
      throw new Error('Campagne non trouvée');
    }

    return landingPageRepository.setMainHtmlFile(landingPageId, libraryId, fileName, filePath);
  }

  clearMainHtmlFile(landingPageId) {
    const landingPage = landingPageRepository.findById(landingPageId);
    if (!landingPage) {
      throw new Error('Campagne non trouvée');
    }

    return landingPageRepository.clearMainHtmlFile(landingPageId);
  }

  getMainHtmlFile(landingPageId) {
    const landingPage = landingPageRepository.findById(landingPageId);
    if (!landingPage) {
      return null;
    }

    return landingPage.mainHtmlFile || null;
  }

  // Récupérer une landing page par son slug
  getLandingPageBySlug(slug) {
    return landingPageRepository.findBySlug(slug);
  }
}

module.exports = new LandingPageService();
