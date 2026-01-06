const invoiceService = require('../services/invoiceService');

exports.getList = (req, res) => {
  try {
    res.locals.activeMenu = 'billing';
    const userId = req.session.user.id;
    const invoices = invoiceService.getInvoicesByUserId(userId);
    const stats = invoiceService.getUserInvoiceStats(userId);
    
    res.render('pages/billing/list', {
      title: 'Facturation',
      invoices,
      stats,
      activeMenu: 'billing'
    });
  } catch (error) {
    console.error('Error in getList:', error);
    res.status(500).send('Erreur serveur');
  }
};

exports.getDetails = (req, res) => {
  try {
    res.locals.activeMenu = 'billing';
    const invoice = invoiceService.getInvoiceById(req.params.id);
    if (!invoice) {
      return res.status(404).render('pages/404', {
        title: 'Facture non trouvée',
        activeMenu: 'billing'
      });
    }
    
    // Vérifier que la facture appartient à l'utilisateur connecté
    if (invoice.userId !== req.session.user.id) {
      return res.status(403).send('Accès non autorisé');
    }
    
    res.render('pages/billing/details', {
      title: `Facture ${invoice.invoiceNumber}`,
      invoice,
      activeMenu: 'billing'
    });
  } catch (error) {
    console.error('Error in getDetails:', error);
    res.status(500).send('Erreur serveur');
  }
};

exports.postMarkAsPaid = (req, res) => {
  try {
    const invoice = invoiceService.getInvoiceById(req.params.id);
    if (!invoice) {
      return res.status(404).send('Facture non trouvée');
    }
    
    // Vérifier que la facture appartient à l'utilisateur connecté
    if (invoice.userId !== req.session.user.id) {
      return res.status(403).send('Accès non autorisé');
    }
    
    invoiceService.markInvoiceAsPaid(req.params.id);
    res.redirect('/billing');
  } catch (error) {
    console.error('Error in postMarkAsPaid:', error);
    res.status(500).send('Erreur lors de la mise à jour');
  }
};

exports.downloadPdf = (req, res) => {
  try {
    const invoice = invoiceService.getInvoiceById(req.params.id);
    if (!invoice) {
      return res.status(404).send('Facture non trouvée');
    }
    
    // Vérifier que la facture appartient à l'utilisateur connecté
    if (invoice.userId !== req.session.user.id) {
      return res.status(403).send('Accès non autorisé');
    }
    
    // TODO: Implémenter la génération de PDF
    res.send('Génération de PDF à implémenter');
  } catch (error) {
    console.error('Error in downloadPdf:', error);
    res.status(500).send('Erreur lors du téléchargement');
  }
};

