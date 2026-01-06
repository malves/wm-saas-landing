const fs = require('fs');
const path = require('path');
const db = require('../src/data/jsonDatabaseService');

console.log('🔧 Synchronisation des fichiers des librairies avec le disque...\n');

// Charger la base de données
db.initialize();

// Récupérer toutes les librairies
const libraries = db.getCollection('libraries');

console.log(`📚 ${libraries.length} librairie(s) à synchroniser\n`);

// Fonction pour lire récursivement tous les fichiers
function getAllFiles(dirPath, basePath = '/') {
  const result = [];
  
  if (!fs.existsSync(dirPath)) {
    return result;
  }

  const items = fs.readdirSync(dirPath);
  
  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) {
      // Lire récursivement les sous-dossiers
      const subPath = basePath + (basePath === '/' ? '' : '/') + item;
      result.push(...getAllFiles(fullPath, subPath));
    } else {
      // C'est un fichier
      const ext = path.extname(item).substring(1).toLowerCase();
      result.push({
        id: Date.now() + Math.random(), // ID unique
        name: item,
        type: ext,
        size: (stats.size / 1024).toFixed(2) + ' KB',
        path: basePath,
        uploadedAt: stats.mtime.toISOString()
      });
    }
  });
  
  return result;
}

// Synchroniser chaque librairie
libraries.forEach(library => {
  const libraryPath = path.join(__dirname, '../public/templates', library.id.toString());
  
  console.log(`📂 Librairie: ${library.name} (ID: ${library.id})`);
  console.log(`   Avant: ${library.files ? library.files.length : 0} fichier(s) en BDD`);
  
  // Lire tous les fichiers depuis le disque
  const diskFiles = getAllFiles(libraryPath, '/');
  
  console.log(`   Après: ${diskFiles.length} fichier(s) sur le disque`);
  
  // Mettre à jour la base de données
  library.files = diskFiles;
  console.log(`   ✅ Synchronisé\n`);
});

// Sauvegarder
db.save();

console.log('✅ Synchronisation terminée !');
