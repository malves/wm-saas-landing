const fs = require('fs');
const path = require('path');
const db = require('../src/data/jsonDatabaseService');

console.log('🔄 Migration vers système basé sur le disque...\n');

// Charger la base de données
db.initialize();

// Récupérer toutes les librairies
const libraries = db.getCollection('libraries');

console.log(`📚 ${libraries.length} librairie(s) à migrer\n`);

// Migrer chaque librairie
libraries.forEach(library => {
  const libraryPath = path.join(__dirname, '../public/templates', library.id.toString());
  
  // Créer le dossier s'il n'existe pas
  if (!fs.existsSync(libraryPath)) {
    fs.mkdirSync(libraryPath, { recursive: true });
  }
  
  // Créer le fichier .meta.json avec les métadonnées
  const metaData = {
    id: library.id,
    name: library.name,
    description: library.description || '',
    userId: library.userId,
    createdAt: library.createdAt,
    updatedAt: library.updatedAt || library.createdAt
  };
  
  const metaPath = path.join(libraryPath, '.meta.json');
  fs.writeFileSync(metaPath, JSON.stringify(metaData, null, 2));
  
  console.log(`✅ ${library.name} (ID: ${library.id})`);
  console.log(`   → Métadonnées écrites dans: templates/${library.id}/.meta.json`);
});

console.log('\n✅ Migration terminée !');
console.log('\nℹ️  Structure:');
console.log('   public/templates/');
console.log('     ├── 1/');
console.log('     │   ├── .meta.json  ← Métadonnées de la librairie');
console.log('     │   ├── images/');
console.log('     │   └── index.html');
