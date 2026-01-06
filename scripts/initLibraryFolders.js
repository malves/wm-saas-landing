const fs = require('fs');
const path = require('path');
const db = require('../src/data/jsonDatabaseService');

console.log('🔧 Initialisation des répertoires des librairies...\n');

// Charger la base de données
db.initialize();

// Récupérer toutes les librairies
const libraries = db.getCollection('libraries');

console.log(`📚 ${libraries.length} librairie(s) trouvée(s)\n`);

// Créer un répertoire pour chaque librairie
libraries.forEach(library => {
  const libraryPath = path.join(__dirname, '../public/templates', library.id.toString());
  
  if (!fs.existsSync(libraryPath)) {
    fs.mkdirSync(libraryPath, { recursive: true });
    console.log(`✅ Répertoire créé: templates/${library.id} (${library.name})`);
  } else {
    console.log(`ℹ️  Répertoire existe déjà: templates/${library.id} (${library.name})`);
  }
});

console.log('\n✅ Initialisation terminée !');
