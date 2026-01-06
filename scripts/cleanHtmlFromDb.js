#!/usr/bin/env node

/**
 * Script de nettoyage pour supprimer htmlContent de la base de données
 * Ce script supprime le contenu HTML stocké dans mainHtmlFile.htmlContent
 * car il devrait être chargé dynamiquement depuis les fichiers, pas stocké en DB.
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Nettoyage de la base de données...\n');

const dbPath = path.join(__dirname, '../src/data/db.json');

// Vérifier que le fichier existe
if (!fs.existsSync(dbPath)) {
  console.error('❌ Fichier db.json introuvable:', dbPath);
  process.exit(1);
}

try {
  // Lire la base de données
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  
  let cleanedCount = 0;
  let totalSize = 0;
  
  // Nettoyer le HTML de toutes les landing pages
  if (db.landingpages && Array.isArray(db.landingpages)) {
    db.landingpages.forEach(lp => {
      if (lp.mainHtmlFile && lp.mainHtmlFile.htmlContent) {
        const htmlSize = lp.mainHtmlFile.htmlContent.length;
        totalSize += htmlSize;
        delete lp.mainHtmlFile.htmlContent;
        cleanedCount++;
        console.log(`✓ Nettoyé landing page #${lp.id} - ${lp.name} (${(htmlSize / 1024).toFixed(2)} KB)`);
      }
    });
  }
  
  if (cleanedCount === 0) {
    console.log('✓ Aucun HTML à nettoyer - la base est déjà propre!');
  } else {
    // Sauvegarder
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
    console.log(`\n✅ Base de données nettoyée avec succès!`);
    console.log(`   - ${cleanedCount} landing page(s) nettoyée(s)`);
    console.log(`   - ${(totalSize / 1024).toFixed(2)} KB d'HTML supprimés`);
  }
  
} catch (error) {
  console.error('❌ Erreur lors du nettoyage:', error.message);
  process.exit(1);
}
