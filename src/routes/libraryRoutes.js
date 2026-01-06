const express = require('express');
const router = express.Router();
const multer = require('multer');
const libraryController = require('../controllers/libraryController');
const { requireAuth } = require('../middlewares/auth');

// Configuration multer pour l'upload de fichiers
const fs = require('fs');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const libraryId = req.params.id;
    const folderPath = req.query.folderPath || '/';
    const uploadPath = path.join(__dirname, '../../public/templates', libraryId, folderPath);
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Décoder le nom du fichier de latin1 vers UTF-8
    // (les navigateurs envoient en UTF-8 mais multer décode en latin1 par défaut)
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, originalName);
  }
});

const upload = multer({ storage: storage });

// Routes GET
router.get('/', requireAuth, libraryController.getList);
router.get('/create', requireAuth, libraryController.getCreateForm);

// Routes API pour la gestion des fichiers/dossiers (AVANT /:id pour éviter les conflits)
router.get('/:id/structure', requireAuth, libraryController.getStructure);
router.get('/:id/stats', requireAuth, libraryController.getStats);
router.get('/:id/editor/*', requireAuth, libraryController.getEditor);
router.get('/:id/download/file', requireAuth, libraryController.downloadFile);
router.get('/:id/download/all', requireAuth, libraryController.downloadAll);
router.post('/:id/folders', requireAuth, libraryController.createFolder);
router.post('/:id/folders/delete', requireAuth, libraryController.deleteFolder);
router.post('/:id/files', requireAuth, upload.array('files'), libraryController.uploadFiles);
router.post('/:id/files/delete', requireAuth, libraryController.deleteFile);
router.post('/:id/move', requireAuth, libraryController.moveItem);

// Route détails (APRÈS les routes spécifiques)
router.get('/:id', requireAuth, libraryController.getDetails);

// Route détails avec chemin de dossier (pour les URLs propres comme /libraries/1/images/subfolder)
router.get('/:id/*', requireAuth, libraryController.getDetails);

// Routes POST (CRUD)
router.post('/', requireAuth, libraryController.postCreate);
router.post('/:id/delete', requireAuth, libraryController.postDelete);

module.exports = router;

