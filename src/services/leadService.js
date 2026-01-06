const leadRepository = require('../repositories/leadRepository');

class LeadService {
  getAllLeads() {
    return leadRepository.findAll();
  }

  getLeadById(id) {
    return leadRepository.findById(id);
  }

  getLeadByEmail(email) {
    return leadRepository.findByEmail(email);
  }

  getNewLeads() {
    return leadRepository.findBy({ status: 'new' });
  }

  getQualifiedLeads() {
    return leadRepository.findBy({ status: 'qualified' });
  }

  createLead(leadData) {
    // Validation basique - seul l'email est requis
    if (!leadData.email) {
      throw new Error('L\'email est requis');
    }

    // Vérifier si l'email existe déjà
    if (leadRepository.findByEmail(leadData.email)) {
      throw new Error('Cet email est déjà enregistré');
    }

    return leadRepository.create(leadData);
  }

  updateLead(id, leadData) {
    const lead = leadRepository.findById(id);
    if (!lead) {
      throw new Error('Lead non trouvé');
    }

    return leadRepository.update(id, leadData);
  }

  deleteLead(id) {
    const lead = leadRepository.findById(id);
    if (!lead) {
      throw new Error('Lead non trouvé');
    }

    return leadRepository.delete(id);
  }

  linkToLandingPage(leadId, landingPageId) {
    return leadRepository.linkToLandingPage(leadId, landingPageId);
  }

  unlinkFromLandingPage(leadId, landingPageId) {
    return leadRepository.unlinkFromLandingPage(leadId, landingPageId);
  }

  getLeadsForLandingPage(landingPageId) {
    const allLeads = this.getAllLeads();
    return allLeads.filter(lead => 
      lead.sourceLandingPages && lead.sourceLandingPages.includes(landingPageId)
    );
  }

  getLeadStats() {
    const leads = this.getAllLeads();
    
    return {
      total: leads.length,
      new: leads.filter(l => l.status === 'new').length,
      qualified: leads.filter(l => l.status === 'qualified').length,
      converted: leads.filter(l => l.status === 'converted').length
    };
  }

  /**
   * Capturer un lead depuis une landing page publique
   * Si le lead existe déjà, on ajoute la landing page à ses sources
   */
  captureLead(captureData) {
    const { email, firstName, lastName, phone, address, postalCode, city, landingPageId, customFields } = captureData;

    // Validation basique
    if (!email) {
      throw new Error('L\'email est requis');
    }

    // Chercher si le lead existe déjà
    const existingLead = leadRepository.findByEmail(email);

    if (existingLead) {
      // Ajouter la landing page aux sources si elle n'y est pas déjà
      const sourceLandingPages = existingLead.sourceLandingPages || [];
      if (!sourceLandingPages.includes(parseInt(landingPageId))) {
        sourceLandingPages.push(parseInt(landingPageId));
        return leadRepository.update(existingLead.id, { 
          sourceLandingPages,
          // Mettre à jour les infos si elles sont vides
          firstName: existingLead.firstName || firstName,
          lastName: existingLead.lastName || lastName,
          phone: existingLead.phone || phone,
          address: existingLead.address || address,
          postalCode: existingLead.postalCode || postalCode,
          city: existingLead.city || city,
          customFields: { ...existingLead.customFields, ...customFields }
        });
      }
      return existingLead;
    }

    // Créer un nouveau lead
    const leadData = {
      firstName: firstName || '',
      lastName: lastName || '',
      email,
      phone: phone || '',
      address: address || '',
      postalCode: postalCode || '',
      city: city || '',
      status: 'new',
      sourceLandingPages: landingPageId ? [parseInt(landingPageId)] : [],
      customFields: customFields || {}
    };

    return leadRepository.create(leadData);
  }
}

module.exports = new LeadService();
