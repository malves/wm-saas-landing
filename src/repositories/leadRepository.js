const db = require('../data/jsonDatabaseService');

class LeadRepository {
  findAll() {
    return db.getCollection('leads');
  }

  findById(id) {
    const leads = this.findAll();
    return leads.find(l => l.id === parseInt(id));
  }

  findByEmail(email) {
    const leads = this.findAll();
    return leads.find(l => l.email.toLowerCase() === email.toLowerCase());
  }

  findBy(criteria) {
    const leads = this.findAll();
    return leads.filter(lead => {
      return Object.keys(criteria).every(key => 
        lead[key] === criteria[key]
      );
    });
  }

  create(leadData) {
    const leads = db.getCollection('leads');
    const newLead = {
      id: db.generateId('leads'),
      ...leadData,
      sourceLandingPages: leadData.sourceLandingPages || [],
      status: leadData.status || 'new',
      createdAt: new Date().toISOString()
    };
    leads.push(newLead);
    db.save();
    return newLead;
  }

  update(id, leadData) {
    const leads = db.getCollection('leads');
    const index = leads.findIndex(l => l.id === parseInt(id));
    if (index === -1) return null;
    
    leads[index] = {
      ...leads[index],
      ...leadData,
      id: leads[index].id,
      createdAt: leads[index].createdAt,
      updatedAt: new Date().toISOString()
    };
    db.save();
    return leads[index];
  }

  delete(id) {
    const leads = db.getCollection('leads');
    const index = leads.findIndex(l => l.id === parseInt(id));
    if (index === -1) return false;
    
    leads.splice(index, 1);
    db.save();
    return true;
  }

  linkToLandingPage(leadId, landingPageId) {
    const lead = this.findById(leadId);
    if (!lead) return null;
    
    const landingPages = lead.sourceLandingPages || [];
    if (!landingPages.includes(landingPageId)) {
      landingPages.push(landingPageId);
      return this.update(leadId, { sourceLandingPages: landingPages });
    }
    return lead;
  }

  unlinkFromLandingPage(leadId, landingPageId) {
    const lead = this.findById(leadId);
    if (!lead) return null;
    
    const landingPages = (lead.sourceLandingPages || []).filter(id => id !== landingPageId);
    return this.update(leadId, { sourceLandingPages: landingPages });
  }
}

module.exports = new LeadRepository();
