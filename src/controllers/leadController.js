const leadService = require('../services/leadService');
const landingPageService = require('../services/landingPageService');

exports.getList = (req, res) => {
  try {
    res.locals.activeMenu = 'leads';
    const leads = leadService.getAllLeads();
    const stats = leadService.getLeadStats();
    
    // Enrichir les leads avec le nom de la campagne et le nom complet
    const enrichedLeads = leads.map(lead => {
      const campaign = lead.sourceLandingPages && lead.sourceLandingPages[0] 
        ? landingPageService.getLandingPageById(lead.sourceLandingPages[0])
        : null;
      
      // Gérer à la fois l'ancienne structure (name) et la nouvelle (firstName/lastName)
      let fullName;
      if (lead.name) {
        fullName = lead.name;
      } else {
        fullName = [lead.firstName, lead.lastName].filter(Boolean).join(' ') || lead.email;
      }
      
      return {
        ...lead,
        campaignName: campaign ? campaign.name : '—',
        fullName: fullName
      };
    });
    
    res.render('pages/leads/list', {
      title: 'Leads',
      leads: enrichedLeads,
      stats,
      activeMenu: 'leads'
    });
  } catch (error) {
    console.error('Error in getList:', error);
    res.status(500).send('Erreur serveur');
  }
};

exports.getCreateForm = (req, res) => {
  try {
    res.locals.activeMenu = 'leads';
    const landingPages = landingPageService.getAllLandingPages();
    res.render('pages/leads/create', {
      title: 'Ajouter un lead',
      landingPages,
      activeMenu: 'leads',
      errors: req.session.errors || [],
      formData: req.session.formData || {}
    });
    delete req.session.errors;
    delete req.session.formData;
  } catch (error) {
    console.error('Error in getCreateForm:', error);
    res.status(500).send('Erreur serveur');
  }
};

exports.getDetails = (req, res) => {
  try {
    res.locals.activeMenu = 'leads';
    const lead = leadService.getLeadById(req.params.id);
    
    if (!lead) {
      return res.status(404).send('Lead non trouvé');
    }

    // Enrichir avec les infos des landing pages
    const campaigns = (lead.sourceLandingPages || []).map(lpId => {
      const lp = landingPageService.getLandingPageById(lpId);
      return lp ? { id: lp.id, name: lp.name } : null;
    }).filter(Boolean);

    // Construire le nom complet
    let fullName;
    if (lead.name) {
      fullName = lead.name;
    } else {
      fullName = [lead.firstName, lead.lastName].filter(Boolean).join(' ') || lead.email;
    }

    res.render('pages/leads/details', {
      title: `Lead #${lead.id}`,
      lead: {
        ...lead,
        fullName,
        campaigns
      },
      activeMenu: 'leads'
    });
  } catch (error) {
    console.error('Error in getDetails:', error);
    res.status(500).send('Erreur serveur');
  }
};

exports.postCreate = (req, res) => {
  try {
    const leadData = {
      ...req.body,
      sourceLandingPages: req.body.landingPages ? 
        (Array.isArray(req.body.landingPages) ? req.body.landingPages.map(id => parseInt(id)) : [parseInt(req.body.landingPages)]) : 
        []
    };
    const lead = leadService.createLead(leadData);
    res.redirect('/leads');
  } catch (error) {
    req.session.errors = [{ msg: error.message }];
    req.session.formData = req.body;
    res.redirect('/leads/create');
  }
};

exports.postUpdate = (req, res) => {
  try {
    const leadId = req.params.id;
    const updateData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      postalCode: req.body.postalCode,
      city: req.body.city
    };
    
    leadService.updateLead(leadId, updateData);
    res.redirect(`/leads/${leadId}`);
  } catch (error) {
    console.error('Error in postUpdate:', error);
    res.status(500).send('Erreur lors de la mise à jour');
  }
};

exports.postDelete = (req, res) => {
  try {
    leadService.deleteLead(req.params.id);
    res.redirect('/leads');
  } catch (error) {
    console.error('Error in postDelete:', error);
    res.status(500).send('Erreur lors de la suppression');
  }
};

/**
 * API: Capturer un lead depuis une landing page publique
 * POST /api/leads/capture
 */
exports.apiCaptureLead = (req, res) => {
  try {
    const { email, firstName, lastName, phone, address, postalCode, city, landingPageId, customFields } = req.body;

    console.log('📥 Lead capture request:', { email, firstName, lastName, landingPageId });

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'L\'email est requis'
      });
    }

    // Capturer le lead
    const lead = leadService.captureLead({
      email,
      firstName,
      lastName,
      phone,
      address,
      postalCode,
      city,
      landingPageId,
      customFields
    });

    console.log('✓ Lead captured:', lead.id, lead.email);

    // Incrémenter le compteur de conversions de la landing page
    if (landingPageId) {
      try {
        const landingPage = landingPageService.getLandingPageById(landingPageId);
        if (landingPage) {
          // Calculer le nouveau taux de conversion
          const visitors = landingPage.visitors || 1;
          const leadsFromPage = leadService.getLeadsForLandingPage(parseInt(landingPageId));
          const conversionRate = ((leadsFromPage.length / visitors) * 100).toFixed(2);
          
          landingPageService.updateLandingPage(landingPageId, { conversionRate: parseFloat(conversionRate) });
        }
      } catch (err) {
        console.error('Error updating conversion rate:', err);
      }
    }

    res.json({
      success: true,
      message: 'Lead capturé avec succès',
      leadId: lead.id
    });

  } catch (error) {
    console.error('Error in apiCaptureLead:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la capture du lead'
    });
  }
};
