const db = require('../data/jsonDatabaseService');

class InvoiceRepository {
  findAll() {
    return db.getCollection('invoices');
  }

  findById(id) {
    const invoices = this.findAll();
    return invoices.find(i => i.id === parseInt(id));
  }

  findByUserId(userId) {
    const invoices = this.findAll();
    return invoices.filter(i => i.userId === parseInt(userId));
  }

  findBy(criteria) {
    const invoices = this.findAll();
    return invoices.filter(invoice => {
      return Object.keys(criteria).every(key => 
        invoice[key] === criteria[key]
      );
    });
  }

  create(invoiceData) {
    const invoices = db.getCollection('invoices');
    const newInvoice = {
      id: db.generateId('invoices'),
      ...invoiceData,
      createdAt: new Date().toISOString(),
      paidAt: null
    };
    invoices.push(newInvoice);
    db.save();
    return newInvoice;
  }

  update(id, invoiceData) {
    const invoices = db.getCollection('invoices');
    const index = invoices.findIndex(i => i.id === parseInt(id));
    if (index === -1) return null;
    
    invoices[index] = {
      ...invoices[index],
      ...invoiceData,
      id: invoices[index].id,
      createdAt: invoices[index].createdAt
    };
    db.save();
    return invoices[index];
  }

  delete(id) {
    const invoices = db.getCollection('invoices');
    const index = invoices.findIndex(i => i.id === parseInt(id));
    if (index === -1) return false;
    
    invoices.splice(index, 1);
    db.save();
    return true;
  }

  markAsPaid(id) {
    return this.update(id, {
      status: 'paid',
      paidAt: new Date().toISOString()
    });
  }

  getStats(userId) {
    const invoices = this.findByUserId(userId);
    return {
      total: invoices.length,
      paid: invoices.filter(i => i.status === 'paid').length,
      pending: invoices.filter(i => i.status === 'pending').length,
      overdue: invoices.filter(i => i.status === 'overdue').length,
      upcoming: invoices.filter(i => i.status === 'upcoming').length,
      totalAmount: invoices.reduce((sum, i) => sum + i.total, 0),
      totalPaid: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0),
      totalPending: invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.total, 0)
    };
  }
}

module.exports = new InvoiceRepository();

