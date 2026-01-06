const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

async function createAdminUser() {
  console.log('🔐 Création d\'un utilisateur admin...\n');

  // Demander les informations (ou utiliser des valeurs par défaut)
  const adminData = {
    name: 'Admin',
    email: 'admin@newsletterpro.com',
    password: 'admin123', // Mot de passe par défaut (à changer!)
    role: 'admin'
  };

  console.log('Données de l\'admin:');
  console.log('  Email:', adminData.email);
  console.log('  Mot de passe:', adminData.password);
  console.log('  Rôle:', adminData.role);
  console.log('\n⚠️  IMPORTANT: Changez ce mot de passe après la première connexion!\n');

  // Hasher le mot de passe
  const hashedPassword = await bcrypt.hash(adminData.password, 10);

  // Charger db.json
  const dbPath = path.join(__dirname, '../src/data/db.json');
  let db = {};

  try {
    const content = fs.readFileSync(dbPath, 'utf-8');
    db = JSON.parse(content);
  } catch (error) {
    console.log('⚠️  db.json n\'existe pas, création...');
    db = { users: [], newsletters: [], subscribers: [], activities: [] };
  }

  // Vérifier si l'admin existe déjà
  const existingAdmin = db.users.find(u => u.email === adminData.email);
  if (existingAdmin) {
    console.log('✓ Un utilisateur avec cet email existe déjà (ID:', existingAdmin.id, ')');
    console.log('✓ Mot de passe hashé mis à jour\n');
    existingAdmin.password = hashedPassword;
  } else {
    // Créer le nouvel admin
    const newAdmin = {
      id: db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1,
      name: adminData.name,
      email: adminData.email,
      password: hashedPassword,
      role: adminData.role,
      createdAt: new Date().toISOString()
    };
    db.users.push(newAdmin);
    console.log('✓ Nouvel utilisateur admin créé (ID:', newAdmin.id, ')\n');
  }

  // Sauvegarder
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
  console.log('✓ Base de données sauvegardée avec succès!\n');
  console.log('🚀 Vous pouvez maintenant démarrer l\'application avec: npm start\n');
}

createAdminUser().catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});

