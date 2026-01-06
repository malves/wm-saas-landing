const leadService = require('../services/leadService');
const landingPageService = require('../services/landingPageService');
const libraryService = require('../services/libraryService');
const userRepository = require('../repositories/userRepository');

/**
 * API de recherche globale avec filtres
 * Recherche dans les leads, campagnes (landing pages) et utilisateurs
 */
exports.apiSearch = (req, res) => {
  try {
    const query = req.query.q || '';
    const filterType = req.query.type || 'all'; // all, leads, campaigns, templates, users
    
    // Validation : minimum 3 caractères
    if (query.length < 3) {
      return res.json({
        success: true,
        results: {
          leads: [],
          campaigns: [],
          templates: [],
          users: []
        }
      });
    }

    const searchTerm = query.toLowerCase().trim();
    let results = {
      leads: [],
      campaigns: [],
      templates: [],
      users: []
    };

    // 1. Rechercher dans les Leads (si pas de filtre ou filtre = leads)
    if (filterType === 'all' || filterType === 'leads') {
      const allLeads = leadService.getAllLeads();
      const matchingLeads = allLeads.filter(lead => {
        const firstName = (lead.firstName || '').toLowerCase();
        const lastName = (lead.lastName || '').toLowerCase();
        const email = (lead.email || '').toLowerCase();
        const name = (lead.name || '').toLowerCase(); // Ancien format
        
        return firstName.includes(searchTerm) || 
               lastName.includes(searchTerm) || 
               email.includes(searchTerm) ||
               name.includes(searchTerm);
      })
      .slice(0, 10) // Augmenté à 10 pour avoir plus de résultats
      .map(lead => {
        // Construire le nom complet
        let fullName;
        if (lead.name) {
          fullName = lead.name;
        } else {
          fullName = [lead.firstName, lead.lastName].filter(Boolean).join(' ') || lead.email;
        }
        
        return {
          id: lead.id,
          fullName,
          email: lead.email,
          phone: lead.phone || '',
          status: lead.status || 'new',
          createdAt: lead.createdAt || '',
          type: 'lead'
        };
      });
      results.leads = matchingLeads;
    }

    // 2. Rechercher dans les Landing Pages (si pas de filtre ou filtre = campaigns)
    if (filterType === 'all' || filterType === 'campaigns') {
      const allLandingPages = landingPageService.getAllLandingPages();
      const matchingCampaigns = allLandingPages.filter(lp => {
        const name = (lp.name || '').toLowerCase();
        return name.includes(searchTerm);
      })
      .slice(0, 10)
      .map(lp => ({
        id: lp.id,
        name: lp.name,
        status: lp.status || 'draft',
        slug: lp.slug || '',
        type: 'campaign'
      }));
      results.campaigns = matchingCampaigns;
    }

    // 3. Rechercher dans les Templates/Librairies (si pas de filtre ou filtre = templates)
    if (filterType === 'all' || filterType === 'templates') {
      const allLibraries = libraryService.getUserLibraries(req.session.user.id);
      const matchingTemplates = allLibraries.filter(lib => {
        const name = (lib.name || '').toLowerCase();
        const description = (lib.description || '').toLowerCase();
        return name.includes(searchTerm) || description.includes(searchTerm);
      })
      .slice(0, 10)
      .map(lib => ({
        id: lib.id,
        name: lib.name,
        description: lib.description,
        type: 'template'
      }));
      results.templates = matchingTemplates;
    }

    // 4. Rechercher dans les Users (si pas de filtre ou filtre = users)
    if (filterType === 'all' || filterType === 'users') {
      const allUsers = userRepository.findAll();
      const matchingUsers = allUsers.filter(user => {
        const name = (user.name || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        
        return name.includes(searchTerm) || email.includes(searchTerm);
      })
      .slice(0, 10)
      .map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        type: 'user'
      }));
      results.users = matchingUsers;
    }

    // Retourner les résultats
    res.json({
      success: true,
      results: results
    });

  } catch (error) {
    console.error('Error in apiSearch:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la recherche'
    });
  }
};

/**
 * Export des résultats de recherche en CSV
 */
exports.exportSearchResults = (req, res) => {
  try {
    const query = req.query.q || '';
    const filterType = req.query.type || 'all';

    if (query.length < 3) {
      return res.status(400).send('La requête doit contenir au moins 3 caractères');
    }

    const searchTerm = query.toLowerCase().trim();
    let csvContent = '';
    let filename = `recherche_${searchTerm}_${Date.now()}.csv`;

    // En-tête CSV avec BOM UTF-8 pour Excel
    csvContent = '\uFEFF';

    // Fonction helper pour échapper les virgules et guillemets
    const escapeCsv = (str) => {
      if (!str) return '';
      str = String(str);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Collecter tous les résultats
    let allResults = [];

    // Leads
    if (filterType === 'all' || filterType === 'leads') {
      const allLeads = leadService.getAllLeads();
      const matchingLeads = allLeads.filter(lead => {
        const firstName = (lead.firstName || '').toLowerCase();
        const lastName = (lead.lastName || '').toLowerCase();
        const email = (lead.email || '').toLowerCase();
        const name = (lead.name || '').toLowerCase();
        
        return firstName.includes(searchTerm) || 
               lastName.includes(searchTerm) || 
               email.includes(searchTerm) ||
               name.includes(searchTerm);
      });

      matchingLeads.forEach(lead => {
        const fullName = lead.name || [lead.firstName, lead.lastName].filter(Boolean).join(' ') || lead.email;
        allResults.push({
          Type: 'Lead',
          Nom: fullName,
          Email: lead.email || '',
          Téléphone: lead.phone || '',
          Statut: lead.status || 'new',
          Date: lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('fr-FR') : ''
        });
      });
    }

    // Campagnes
    if (filterType === 'all' || filterType === 'campaigns') {
      const allLandingPages = landingPageService.getAllLandingPages();
      const matchingCampaigns = allLandingPages.filter(lp => {
        const name = (lp.name || '').toLowerCase();
        return name.includes(searchTerm);
      });

      matchingCampaigns.forEach(lp => {
        allResults.push({
          Type: 'Campagne',
          Nom: lp.name || '',
          Email: '',
          Téléphone: '',
          Statut: lp.status || 'draft',
          Date: lp.createdAt ? new Date(lp.createdAt).toLocaleDateString('fr-FR') : ''
        });
      });
    }

    // Templates
    if (filterType === 'all' || filterType === 'templates') {
      const allLibraries = libraryService.getUserLibraries(req.session.user.id);
      const matchingTemplates = allLibraries.filter(lib => {
        const name = (lib.name || '').toLowerCase();
        const description = (lib.description || '').toLowerCase();
        return name.includes(searchTerm) || description.includes(searchTerm);
      });

      matchingTemplates.forEach(lib => {
        allResults.push({
          Type: 'Template',
          Nom: lib.name || '',
          Email: '',
          Téléphone: '',
          Statut: '',
          Date: lib.createdAt ? new Date(lib.createdAt).toLocaleDateString('fr-FR') : ''
        });
      });
    }

    // Utilisateurs
    if (filterType === 'all' || filterType === 'users') {
      const allUsers = userRepository.findAll();
      const matchingUsers = allUsers.filter(user => {
        const name = (user.name || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        return name.includes(searchTerm) || email.includes(searchTerm);
      });

      matchingUsers.forEach(user => {
        allResults.push({
          Type: 'Utilisateur',
          Nom: user.name || '',
          Email: user.email || '',
          Téléphone: '',
          Statut: user.role || '',
          Date: user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : ''
        });
      });
    }

    if (allResults.length === 0) {
      return res.status(404).send('Aucun résultat à exporter');
    }

    // Créer les en-têtes CSV
    const headers = Object.keys(allResults[0]);
    csvContent += headers.map(escapeCsv).join(',') + '\n';

    // Ajouter les lignes de données
    allResults.forEach(row => {
      csvContent += headers.map(header => escapeCsv(row[header])).join(',') + '\n';
    });

    // Envoyer le fichier CSV
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);

  } catch (error) {
    console.error('Error in exportSearchResults:', error);
    res.status(500).send('Erreur lors de l\'export');
  }
};
