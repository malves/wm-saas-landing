const invoiceRepository = require('../repositories/invoiceRepository');

class InvoiceService {
  getAllInvoices() {
    return invoiceRepository.findAll();
  }

  getInvoiceById(id) {
    return invoiceRepository.findById(id);
  }

  getInvoicesByUserId(userId) {
    return invoiceRepository.findByUserId(userId);
  }

  getInvoicesByStatus(status) {
    return invoiceRepository.findBy({ status });
  }

  createInvoice(invoiceData) {
    // Validation basique
    if (!invoiceData.userId || !invoiceData.amount) {
      throw new Error('L\'utilisateur et le montant sont requis');
    }

    return invoiceRepository.create(invoiceData);
  }

  updateInvoice(id, invoiceData) {
    const invoice = invoiceRepository.findById(id);
    if (!invoice) {
      throw new Error('Facture non trouvée');
    }

    return invoiceRepository.update(id, invoiceData);
  }

  deleteInvoice(id) {
    const invoice = invoiceRepository.findById(id);
    if (!invoice) {
      throw new Error('Facture non trouvée');
    }

    return invoiceRepository.delete(id);
  }

  markInvoiceAsPaid(id) {
    const invoice = invoiceRepository.findById(id);
    if (!invoice) {
      throw new Error('Facture non trouvée');
    }

    return invoiceRepository.markAsPaid(id);
  }

  getUserInvoiceStats(userId) {
    return invoiceRepository.getStats(userId);
  }

  // Calculs et statistiques globales
  getGlobalStats() {
    const invoices = this.getAllInvoices();
    
    if (invoices.length === 0) {
      return {
        total: 0,
        paid: 0,
        pending: 0,
        overdue: 0,
        upcoming: 0,
        totalAmount: 0,
        totalPaid: 0,
        totalPending: 0
      };
    }

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

module.exports = new InvoiceService();

