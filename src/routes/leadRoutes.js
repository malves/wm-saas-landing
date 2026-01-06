const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { requireAuth } = require('../middlewares/auth');
const { validateLead, checkValidation } = require('../middlewares/validation');

// Routes GET
router.get('/', requireAuth, leadController.getList);
router.get('/create', requireAuth, leadController.getCreateForm);
router.get('/:id', requireAuth, leadController.getDetails);

// Routes POST (CRUD)
router.post('/', requireAuth, validateLead, checkValidation, leadController.postCreate);
router.post('/:id/update', requireAuth, leadController.postUpdate);
router.post('/:id/delete', requireAuth, leadController.postDelete);

module.exports = router;
