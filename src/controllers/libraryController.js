const libraryService = require('../services/libraryService');
const fs = require('fs');
const path = require('path');

exports.getList = (req, res) => {
  try {
    res.locals.activeMenu = 'libraries';
    const libraries = libraryService.getUserLibraries(req.session.user.id);
    const stats = libraryService.getLibraryStats();
    
    res.render('pages/libraries/list', {
      title: 'Librairies',
      libraries,
      stats,
      activeMenu: 'libraries'
    });
  } catch (error) {
    console.error('Error in getList:', error);
    res.status(500).send('Erreur serveur');
  }
};

exports.getDetails = (req, res) => {
  try {
    res.locals.activeMenu = 'libraries';
    const library = libraryService.getLibraryById(req.params.id);
    
    if (!library) {
      return res.status(404).render('pages/404', {
        title: 'Librairie non trouvée',
        activeMenu: 'libraries'
      });
    }

    // Vérifier que la librairie appartient à l'utilisateur
    if (library.userId !== req.session.user.id) {
      return res.status(403).send('Accès non autorisé');
    }
    
    // Récupérer le chemin depuis le wildcard (req.params[0]) ou mettre '/'
    const folderPath = req.params[0] ? '/' + req.params[0] : '/';
    
    res.render('pages/libraries/details', {
      title: library.name,
      library,
      initialPath: folderPath,
      activeMenu: 'libraries'
    });
  } catch (error) {
    console.error('Error in getDetails:', error);
    res.status(500).send('Erreur serveur');
  }
};

exports.getEditor = (req, res) => {
  try {
    res.locals.activeMenu = 'libraries';
    const libraryId = req.params.id;
    const filePath = '/' + (req.params[0] || '');
    
    const library = libraryService.getLibraryById(libraryId);
    if (!library) {
      return res.status(404).send('Librairie non trouvée');
    }

    // Vérifier que la librairie appartient à l'utilisateur
    if (library.userId !== req.session.user.id) {
      return res.status(403).send('Accès non autorisé');
    }

    // Vérifier que le fichier existe
    const fullPath = path.join(__dirname, '../../public/templates', libraryId.toString(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).send('Fichier non trouvé');
    }

    // URL pour accéder au fichier HTML via le serveur statique
    const previewUrl = `/templates/${libraryId}${filePath}`;

    res.render('pages/libraries/editor', {
      title: `Éditeur IA - ${path.basename(filePath)}`,
      library,
      filePath,
      fileName: path.basename(filePath),
      previewUrl,
      activeMenu: 'libraries'
    });
  } catch (error) {
    console.error('Error in getEditor:', error);
    res.status(500).send('Erreur serveur');
  }
};

exports.getCreateForm = (req, res) => {
  res.locals.activeMenu = 'libraries';
  res.render('pages/libraries/create', {
    title: 'Créer une librairie',
    activeMenu: 'libraries',
    errors: req.session.errors || [],
    formData: req.session.formData || {}
  });
  delete req.session.errors;
  delete req.session.formData;
};

exports.postCreate = (req, res) => {
  try {
    const libraryData = {
      ...req.body,
      userId: req.session.user.id
    };
    const library = libraryService.createLibrary(libraryData);
    res.redirect(`/libraries/${library.id}`);
  } catch (error) {
    req.session.errors = [{ msg: error.message }];
    req.session.formData = req.body;
    res.redirect('/libraries/create');
  }
};

exports.postDelete = (req, res) => {
  try {
    const library = libraryService.getLibraryById(req.params.id);
    
    // Vérifier que la librairie appartient à l'utilisateur
    if (!library || library.userId !== req.session.user.id) {
      return res.status(403).send('Accès non autorisé');
    }

    libraryService.deleteLibrary(req.params.id);
    res.redirect('/libraries');
  } catch (error) {
    console.error('Error in postDelete:', error);
    res.status(500).send('Erreur lors de la suppression');
  }
};

// API: Récupérer la structure des fichiers et dossiers depuis le disque
exports.getStructure = (req, res) => {
  console.log('📁 getStructure called for library:', req.params.id);
  try {
    const libraryId = req.params.id;
    const relativePath = req.query.path || '/';  // Récupérer le chemin depuis les query params
    console.log('📁 Requested path:', relativePath);
    
    const library = libraryService.getLibraryById(libraryId);

    // Vérifier les permissions
    if (!library) {
      return res.status(404).json({ success: false, message: 'Librairie non trouvée' });
    }
    
    if (library.userId !== req.session.user.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Lire la structure depuis le service pour le chemin demandé
    const structure = libraryService.getLibraryStructure(libraryId, relativePath);
    console.log('📁 Structure loaded for path:', relativePath, '- folders:', structure.folders.length, 'files:', structure.files.length);
    
    // Forcer l'encodage UTF-8 pour les caractères spéciaux
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.send(JSON.stringify({ success: true, structure }));
  } catch (error) {
    console.error('❌ Error getting structure:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// API: Récupérer les statistiques détaillées d'une librairie
exports.getStats = (req, res) => {
  console.log('📊 getStats called for library:', req.params.id);
  try {
    const libraryId = req.params.id;
    const library = libraryService.getLibraryById(libraryId);

    // Vérifier les permissions
    if (!library) {
      return res.status(404).json({ success: false, message: 'Librairie non trouvée' });
    }
    
    if (library.userId !== req.session.user.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Récupérer les statistiques depuis le service
    const stats = libraryService.getLibraryDetailedStats(libraryId);
    console.log('📊 Stats loaded:', stats);
    
    res.json({ success: true, stats });
  } catch (error) {
    console.error('❌ Error getting stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// API: Créer un dossier dans une librairie
exports.createFolder = (req, res) => {
  try {
    const libraryId = req.params.id;
    const { folderName, currentPath } = req.body;
    const library = libraryService.getLibraryById(libraryId);

    // Vérifier les permissions
    if (!library || library.userId !== req.session.user.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Créer le dossier sur le système de fichiers
    const fullPath = path.join(__dirname, '../../public/templates', libraryId.toString(), currentPath || '/', folderName);
    
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`✓ Dossier créé: ${fullPath}`);
    }
    
    res.json({ 
      success: true, 
      folder: {
        name: folderName,
        path: currentPath || '/',
        fileCount: 0
      }
    });
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// API: Uploader des fichiers
exports.uploadFiles = (req, res) => {
  try {
    const libraryId = req.params.id;
    const library = libraryService.getLibraryById(libraryId);

    // Vérifier les permissions
    if (!library || library.userId !== req.session.user.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    const folderPath = req.query.folderPath || '/';
    const uploadedFiles = [];

    console.log(`📤 Uploading ${req.files.length} file(s) to ${folderPath}`);

    // Traiter chaque fichier uploadé
    req.files.forEach(file => {
      const fileExt = path.extname(file.originalname).substring(1).toLowerCase();
      const fileData = {
        name: file.originalname,
        type: fileExt,
        size: (file.size / 1024).toFixed(2) + ' KB',
        path: folderPath,
        uploadedAt: new Date().toISOString()
      };
      
      uploadedFiles.push(fileData);
      console.log(`✓ File uploaded: ${file.originalname} to ${folderPath}`);
    });

    res.json({ success: true, files: uploadedFiles });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// API: Supprimer un dossier
exports.deleteFolder = (req, res) => {
  try {
    const libraryId = req.params.id;
    const { folderName, folderPath } = req.body;
    const library = libraryService.getLibraryById(libraryId);

    // Vérifier les permissions
    if (!library || library.userId !== req.session.user.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Supprimer le dossier physique
    const fullPath = path.join(__dirname, '../../public/templates', libraryId.toString(), folderPath || '/', folderName);
    
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`✓ Dossier supprimé: ${fullPath}`);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// API: Supprimer un fichier
exports.deleteFile = (req, res) => {
  try {
    const libraryId = req.params.id;
    const { fileName, filePath } = req.body;
    const library = libraryService.getLibraryById(libraryId);

    // Vérifier les permissions
    if (!library || library.userId !== req.session.user.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Supprimer le fichier physique
    const fullPath = path.join(__dirname, '../../public/templates', libraryId.toString(), filePath || '/', fileName);
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`✓ Fichier supprimé: ${fullPath}`);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// API: Déplacer un fichier ou dossier
exports.moveItem = (req, res) => {
  try {
    const libraryId = req.params.id;
    const { itemType, itemName, sourcePath, targetPath } = req.body;
    const library = libraryService.getLibraryById(libraryId);

    // Vérifier les permissions
    if (!library || library.userId !== req.session.user.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Construire les chemins complets
    const sourceFullPath = path.join(
      __dirname, 
      '../../public/templates', 
      libraryId.toString(), 
      sourcePath || '/',
      itemName
    );
    
    const targetFullPath = path.join(
      __dirname,
      '../../public/templates',
      libraryId.toString(),
      targetPath || '/',
      itemName
    );

    console.log('📦 Moving item:', { itemName, itemType, from: sourceFullPath, to: targetFullPath });

    // Vérifier que la source existe
    if (!fs.existsSync(sourceFullPath)) {
      return res.status(404).json({ success: false, message: 'Élément source introuvable' });
    }

    // Vérifier que la destination n'existe pas déjà
    if (fs.existsSync(targetFullPath)) {
      return res.status(409).json({ success: false, message: 'Un élément avec ce nom existe déjà à la destination' });
    }

    // Créer le dossier de destination s'il n'existe pas
    const targetDir = path.dirname(targetFullPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Déplacer l'élément
    fs.renameSync(sourceFullPath, targetFullPath);
    console.log(`✓ ${itemType} déplacé: ${itemName}`);

    res.json({ success: true, message: 'Élément déplacé avec succès' });
  } catch (error) {
    console.error('Error moving item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// API: Télécharger un fichier individuel
exports.downloadFile = (req, res) => {
  try {
    const libraryId = req.params.id;
    const { path: filePath, fileName } = req.query;
    const library = libraryService.getLibraryById(libraryId);

    // Vérifier les permissions
    if (!library || library.userId !== req.session.user.id) {
      return res.status(403).send('Accès non autorisé');
    }

    // Construire le chemin complet du fichier
    const fullPath = path.join(
      __dirname,
      '../../public/templates',
      libraryId.toString(),
      filePath || '/',
      fileName
    );

    // Vérifier que le fichier existe
    if (!fs.existsSync(fullPath)) {
      return res.status(404).send('Fichier non trouvé');
    }

    // Télécharger le fichier
    res.download(fullPath, fileName);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).send('Erreur lors du téléchargement');
  }
};

// API: Télécharger toute la bibliothèque en ZIP
exports.downloadAll = (req, res) => {
  try {
    const libraryId = req.params.id;
    const library = libraryService.getLibraryById(libraryId);

    // Vérifier les permissions
    if (!library || library.userId !== req.session.user.id) {
      return res.status(403).send('Accès non autorisé');
    }

    const archiver = require('archiver');
    const libraryPath = path.join(__dirname, '../../public/templates', libraryId.toString());

    // Vérifier que le dossier existe
    if (!fs.existsSync(libraryPath)) {
      return res.status(404).send('Bibliothèque non trouvée');
    }

    // Définir les headers pour le téléchargement
    const zipName = `${library.name.replace(/[^a-z0-9]/gi, '_')}_${libraryId}.zip`;
    res.attachment(zipName);
    res.setHeader('Content-Type', 'application/zip');

    // Créer l'archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Niveau de compression maximal
    });

    // Gérer les erreurs
    archive.on('error', function(err) {
      console.error('Error creating archive:', err);
      res.status(500).send('Erreur lors de la création de l\'archive');
    });

    // Pipe l'archive vers la réponse
    archive.pipe(res);

    // Ajouter tout le contenu du dossier en excluant .meta.json
    archive.glob('**/*', {
      cwd: libraryPath,
      ignore: ['.meta.json']
    });

    // Finaliser l'archive
    archive.finalize();

    console.log(`✓ Téléchargement de la bibliothèque ${libraryId} en cours...`);
  } catch (error) {
    console.error('Error downloading library:', error);
    res.status(500).send('Erreur lors du téléchargement');
  }
};
