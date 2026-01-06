const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { requireAuth } = require('../middlewares/auth');

// Routes GET
router.get('/', requireAuth, invoiceController.getList);
router.get('/:id', requireAuth, invoiceController.getDetails);
router.get('/:id/download', requireAuth, invoiceController.downloadPdf);

// Routes POST
router.post('/:id/mark-as-paid', requireAuth, invoiceController.postMarkAsPaid);

module.exports = router;

