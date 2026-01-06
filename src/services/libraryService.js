const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, '../../public/templates');

class LibraryService {
  // Lire les métadonnées d'une librairie depuis .meta.json
  _readMeta(libraryId) {
    const metaPath = path.join(TEMPLATES_DIR, libraryId.toString(), '.meta.json');
    
    if (!fs.existsSync(metaPath)) {
      return null;
    }
    
    try {
      const metaContent = fs.readFileSync(metaPath, 'utf-8');
      return JSON.parse(metaContent);
    } catch (error) {
      console.error(`Error reading meta for library ${libraryId}:`, error);
      return null;
    }
  }

  // Écrire les métadonnées
  _writeMeta(libraryId, metaData) {
    const libraryPath = path.join(TEMPLATES_DIR, libraryId.toString());
    const metaPath = path.join(libraryPath, '.meta.json');
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(libraryPath)) {
      fs.mkdirSync(libraryPath, { recursive: true });
    }
    
    fs.writeFileSync(metaPath, JSON.stringify(metaData, null, 2));
  }

  // Générer un nouvel ID basé sur le timestamp
  _generateId() {
    return Date.now();
  }

  // Lister tous les dossiers de templates
  getAllLibraries() {
    if (!fs.existsSync(TEMPLATES_DIR)) {
      fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
      return [];
    }

    const libraries = [];
    const dirs = fs.readdirSync(TEMPLATES_DIR);
    
    dirs.forEach(dir => {
      const dirPath = path.join(TEMPLATES_DIR, dir);
      const stats = fs.statSync(dirPath);
      
      if (stats.isDirectory()) {
        const meta = this._readMeta(dir);
        if (meta) {
          libraries.push(meta);
        }
      }
    });
    
    return libraries;
  }

  getLibraryById(id) {
    return this._readMeta(id);
  }

  getUserLibraries(userId) {
    return this.getAllLibraries().filter(lib => lib.userId === parseInt(userId));
  }

  createLibrary(libraryData) {
    // Validation
    if (!libraryData.name) {
      throw new Error('Le nom est requis');
    }

    const id = this._generateId();
    const metaData = {
      id: id,
      name: libraryData.name,
      description: libraryData.description || '',
      userId: libraryData.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Créer le dossier et le fichier .meta.json
    this._writeMeta(id, metaData);
    
    console.log(`✓ Librairie créée: ${metaData.name} (ID: ${id})`);
    
    return metaData;
  }

  updateLibrary(id, libraryData) {
    const library = this._readMeta(id);
    if (!library) {
      throw new Error('Librairie non trouvée');
    }

    const updatedMeta = {
      ...library,
      ...libraryData,
      id: library.id, // Garder l'ID original
      userId: library.userId, // Garder le userId original
      createdAt: library.createdAt, // Garder la date de création
      updatedAt: new Date().toISOString()
    };

    this._writeMeta(id, updatedMeta);
    return updatedMeta;
  }

  deleteLibrary(id) {
    const library = this._readMeta(id);
    if (!library) {
      throw new Error('Librairie non trouvée');
    }

    // Supprimer le dossier entier
    const libraryPath = path.join(TEMPLATES_DIR, id.toString());
    if (fs.existsSync(libraryPath)) {
      fs.rmSync(libraryPath, { recursive: true, force: true });
      console.log(`✓ Répertoire supprimé: templates/${id}`);
    }

    return true;
  }

  // Lire la structure des fichiers/dossiers depuis le disque
  getLibraryStructure(libraryId, relativePath = '/') {
    const libraryPath = path.join(TEMPLATES_DIR, libraryId.toString());
    const fullPath = path.join(libraryPath, relativePath);
    
    const result = { folders: [], files: [] };
    
    if (!fs.existsSync(fullPath)) {
      return result;
    }

    // Forcer l'encodage UTF-8 pour les noms de fichiers avec accents
    const items = fs.readdirSync(fullPath, { encoding: 'utf8' });
    
    items.forEach(item => {
      // Ignorer les fichiers cachés et .meta.json
      if (item.startsWith('.')) {
        return;
      }

      const itemPath = path.join(fullPath, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        const subItems = fs.readdirSync(itemPath, { encoding: 'utf8' });
        result.folders.push({
          name: item,
          path: relativePath,
          fileCount: subItems.filter(f => !f.startsWith('.')).length
        });
      } else {
        const ext = path.extname(item).substring(1).toLowerCase();
        result.files.push({
          name: item,
          type: ext,
          size: (stats.size / 1024).toFixed(2) + ' KB',
          path: relativePath,
          uploadedAt: stats.mtime.toISOString()
        });
      }
    });
    
    return result;
  }

  // Compter tous les fichiers récursivement
  _countFiles(dirPath) {
    let count = 0;
    
    if (!fs.existsSync(dirPath)) {
      return 0;
    }

    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      if (item.startsWith('.')) return; // Ignorer les fichiers cachés
      
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        count += this._countFiles(itemPath);
      } else {
        count++;
      }
    });
    
    return count;
  }

  getLibraryStats() {
    const libraries = this.getAllLibraries();
    
    let totalFiles = 0;
    libraries.forEach(lib => {
      const libraryPath = path.join(TEMPLATES_DIR, lib.id.toString());
      totalFiles += this._countFiles(libraryPath);
    });
    
    return {
      total: libraries.length,
      totalFiles: totalFiles
    };
  }

  // Obtenir les statistiques détaillées d'une librairie
  getLibraryDetailedStats(libraryId) {
    const libraryPath = path.join(TEMPLATES_DIR, libraryId.toString());
    
    const stats = {
      totalFiles: 0,
      htmlCount: 0,
      cssjsCount: 0,
      imgCount: 0
    };

    if (!fs.existsSync(libraryPath)) {
      return stats;
    }

    const countFilesRecursive = (dirPath) => {
      const items = fs.readdirSync(dirPath);
      
      items.forEach(item => {
        if (item.startsWith('.')) return; // Ignorer les fichiers cachés
        
        const itemPath = path.join(dirPath, item);
        const itemStats = fs.statSync(itemPath);
        
        if (itemStats.isDirectory()) {
          countFilesRecursive(itemPath);
        } else {
          stats.totalFiles++;
          
          const ext = path.extname(item).substring(1).toLowerCase();
          
          if (ext === 'html' || ext === 'htm') {
            stats.htmlCount++;
          } else if (ext === 'css' || ext === 'js') {
            stats.cssjsCount++;
          } else if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp', 'tiff'].includes(ext)) {
            stats.imgCount++;
          }
        }
      });
    };

    countFilesRecursive(libraryPath);
    
    return stats;
  }
}

module.exports = new LibraryService();
