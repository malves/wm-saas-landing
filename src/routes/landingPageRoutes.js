const express = require('express');
const router = express.Router();
const landingPageController = require('../controllers/landingPageController');
const { requireAuth } = require('../middlewares/auth');
const { validateLandingPage, checkValidation } = require('../middlewares/validation');

// Routes GET
router.get('/', requireAuth, landingPageController.getList);
router.get('/create', requireAuth, landingPageController.getCreateForm);
router.get('/:id', requireAuth, landingPageController.getDetails);
router.get('/:id/edit', requireAuth, landingPageController.getEditForm);

// Routes POST (CRUD)
router.post('/', requireAuth, validateLandingPage, checkValidation, landingPageController.postCreate);
router.post('/:id/edit', requireAuth, validateLandingPage, checkValidation, landingPageController.postUpdate);
router.post('/:id/delete', requireAuth, landingPageController.postDelete);

// Routes POST (Template Management)
router.post('/:landingPageId/attach-template', requireAuth, landingPageController.postAttachTemplate);
router.post('/:landingPageId/detach-template', requireAuth, landingPageController.postDetachTemplate);
router.post('/:landingPageId/detach-library', requireAuth, landingPageController.postDetachLibrary);

// Routes POST (Main HTML File)
router.post('/:landingPageId/set-main-html', requireAuth, landingPageController.postSetMainHtmlFile);
router.post('/:landingPageId/clear-main-html', requireAuth, landingPageController.postClearMainHtmlFile);

module.exports = router;
