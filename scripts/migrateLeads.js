const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../src/data/db.json');

function migrateLeads() {
  console.log('📝 Migration des données de leads...');
  
  // Lire la base de données
  const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  
  let migratedCount = 0;
  
  // Migrer chaque lead
  data.leads = data.leads.map(lead => {
    const migratedLead = { ...lead };
    
    // Si le lead a un champ "name" mais pas firstName/lastName
    if (lead.name && !lead.firstName && !lead.lastName) {
      const nameParts = lead.name.trim().split(' ');
      
      migratedLead.firstName = nameParts[0] || '';
      migratedLead.lastName = nameParts.slice(1).join(' ') || '';
      
      // Supprimer l'ancien champ name
      delete migratedLead.name;
      
      migratedCount++;
      console.log(`✓ Migré: ${lead.name} → firstName: "${migratedLead.firstName}", lastName: "${migratedLead.lastName}"`);
    }
    
    // Supprimer le champ company s'il existe
    if ('company' in migratedLead) {
      delete migratedLead.company;
      console.log(`  - Supprimé champ "company" pour lead #${lead.id}`);
    }
    
    return migratedLead;
  });
  
  // Sauvegarder
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  
  console.log(`\n✅ Migration terminée !`);
  console.log(`   - ${data.leads.length} leads traités`);
  console.log(`   - ${migratedCount} leads migrés`);
  console.log(`   - Champ "company" supprimé de tous les leads`);
}

migrateLeads();
