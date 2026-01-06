const express = require('express');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
require('dotenv').config();

const config = require('./config/config');
const sessionConfig = require('./config/session');
const db = require('./data/jsonDatabaseService');
const { setUserLocals } = require('./middlewares/auth');
const activeMenuMiddleware = require('./middlewares/activeMenu');
const routes = require('./routes');

const app = express();

// Trust proxy (nécessaire derrière Traefik/Nginx pour HTTPS et cookies secure)
app.set('trust proxy', 1);

// Configuration EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configuration des layouts
app.use(expressLayouts);
app.set('layout', 'layouts/main'); // Layout par défaut
// Désactivé car cause des problèmes avec les scripts inline
// app.set('layout extractScripts', true);
// app.set('layout extractStyles', true);

// Middlewares de base
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Sessions (IMPORTANT : avant les routes)
app.use(session(sessionConfig));

// Middlewares custom
app.use(setUserLocals); // Rend req.session.user disponible partout
app.use(activeMenuMiddleware);

// Initialiser la base de données
try {
  db.initialize();
} catch (error) {
  console.error('❌ Erreur critique lors de l\'initialisation de la base de données:', error);
  process.exit(1);
}

// Routes
app.use('/', routes);

// Gestion 404
app.use((req, res) => {
  res.status(404).render('pages/404', {
    title: 'Page non trouvée',
    activeMenu: null,
    layout: 'layouts/main'
  });
});

// Gestion erreurs
app.use((err, req, res, next) => {
  console.error('❌ Erreur:', err.stack);
  res.status(500).render('pages/error', {
    title: 'Erreur',
    activeMenu: null,
    error: config.env === 'development' ? err : { message: 'Une erreur est survenue' },
    layout: 'layouts/main'
  });
});

// Démarrage serveur
const server = app.listen(config.port, () => {
  console.log('');
  console.log('✓ Landing Hub démarré avec succès!');
  console.log('✓ Server: http://localhost:' + config.port);
  console.log('✓ Environment:', config.env);
  console.log('✓ Sessions activées');
  console.log('');
  console.log('📝 Compte de test:');
  console.log('   Email: admin@landinghub.com');
  console.log('   Mot de passe: admin123');
  console.log('');
});

// Gestion graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal reçu: fermeture du serveur');
  server.close(() => {
    console.log('Serveur fermé');
  });
});

module.exports = app;

