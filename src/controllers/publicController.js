const fs = require('fs');
const path = require('path');
const landingPageService = require('../services/landingPageService');
const libraryService = require('../services/libraryService');

const TEMPLATES_DIR = path.join(__dirname, '../../public/templates');

/**
 * Génère le script de capture de leads à injecter dans le HTML
 */
function generateLeadCaptureScript(landingPageId, slug) {
  return `
<script>
(function() {
  const LANDING_PAGE_ID = ${landingPageId};
  const LANDING_PAGE_SLUG = '${slug}';
  
  // Intercepter tous les formulaires de la page
  document.addEventListener('DOMContentLoaded', function() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(function(form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Collecter les données du formulaire
        const formData = new FormData(form);
        const data = {
          landingPageId: LANDING_PAGE_ID,
          slug: LANDING_PAGE_SLUG
        };
        
        // Mapper les champs courants
        const fieldMappings = {
          'firstName': ['firstname', 'prenom', 'prénom', 'first_name', 'fname'],
          'lastName': ['lastname', 'nom', 'last_name', 'lname'],
          'email': ['email', 'mail', 'e-mail', 'courriel'],
          'phone': ['phone', 'telephone', 'tel', 'mobile', 'portable'],
          'address': ['address', 'adresse', 'rue', 'street'],
          'postalCode': ['postalcode', 'postal_code', 'codepostal', 'code_postal', 'zipcode', 'zip'],
          'city': ['city', 'ville', 'town']
        };
        
        formData.forEach(function(value, key) {
          const keyLower = key.toLowerCase();
          
          // Vérifier les mappings
          for (const [standardKey, aliases] of Object.entries(fieldMappings)) {
            if (aliases.some(alias => keyLower.includes(alias))) {
              data[standardKey] = value;
              return;
            }
          }
          
          // Si pas de mapping, ajouter comme champ personnalisé
          if (!data.customFields) data.customFields = {};
          data.customFields[key] = value;
        });
        
        // Envoyer au serveur
        fetch('/api/leads/capture', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        })
        .then(function(response) {
          return response.json();
        })
        .then(function(result) {
          if (result.success) {
            // Succès - afficher un message ou rediriger
            if (result.redirectUrl) {
              window.location.href = result.redirectUrl;
            } else {
              // Créer un message de succès
              const successMsg = document.createElement('div');
              successMsg.innerHTML = '<div style="position:fixed;top:20px;right:20px;background:#22c55e;color:white;padding:16px 24px;border-radius:8px;font-family:system-ui;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15);">✓ Merci ! Votre demande a été envoyée.</div>';
              document.body.appendChild(successMsg);
              setTimeout(function() { successMsg.remove(); }, 5000);
              form.reset();
            }
          } else {
            console.error('Erreur lors de l\\'envoi:', result.error);
            alert('Une erreur est survenue. Veuillez réessayer.');
          }
        })
        .catch(function(error) {
          console.error('Erreur:', error);
          alert('Une erreur est survenue. Veuillez réessayer.');
        });
      });
    });
  });
})();
</script>
`;
}

/**
 * Injecte le script de capture dans le HTML
 */
function injectScript(htmlContent, landingPageId, slug) {
  const script = generateLeadCaptureScript(landingPageId, slug);
  
  // Injecter avant </body> si présent, sinon à la fin
  if (htmlContent.includes('</body>')) {
    return htmlContent.replace('</body>', script + '</body>');
  } else if (htmlContent.includes('</html>')) {
    return htmlContent.replace('</html>', script + '</html>');
  } else {
    return htmlContent + script;
  }
}

/**
 * Servir une landing page publique
 */
exports.serveLandingPage = (req, res) => {
  try {
    const { slug } = req.params;
    
    // Récupérer la landing page par son slug
    const landingPage = landingPageService.getLandingPageBySlug(slug);
    
    if (!landingPage) {
      return res.status(404).render('pages/public/404', {
        title: 'Page non trouvée',
        layout: false
      });
    }
    
    // Vérifier que la page a un fichier HTML principal configuré
    const mainHtmlFile = landingPage.mainHtmlFile;
    
    if (!mainHtmlFile) {
      return res.status(404).render('pages/public/not-configured', {
        title: 'Page non configurée',
        layout: false
      });
    }
    
    // Construire le chemin vers le fichier HTML
    const htmlFilePath = path.join(
      TEMPLATES_DIR,
      mainHtmlFile.libraryId.toString(),
      mainHtmlFile.filePath === '/' ? '' : mainHtmlFile.filePath,
      mainHtmlFile.fileName
    );
    
    // Vérifier que le fichier existe
    if (!fs.existsSync(htmlFilePath)) {
      console.error(`Fichier HTML non trouvé: ${htmlFilePath}`);
      return res.status(404).render('pages/public/404', {
        title: 'Fichier non trouvé',
        layout: false
      });
    }
    
    // Incrémenter le compteur de visiteurs
    landingPageService.incrementVisitorCount(landingPage.id);
    
    // Lire le contenu HTML
    let htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');
    
    // Injecter la balise <base> au DÉBUT du <head> pour résoudre automatiquement tous les chemins relatifs
    // Important: <base> doit être avant tout élément qui utilise des chemins relatifs (style, link, script, etc.)
    const baseTag = `<base href="/p/${slug}/">`;
    if (htmlContent.includes('<head>')) {
      htmlContent = htmlContent.replace('<head>', '<head>\n    ' + baseTag);
    } else {
      // Si pas de <head>, l'ajouter au début
      htmlContent = '<head>\n    ' + baseTag + '\n</head>' + htmlContent;
    }
    
    // Injecter le script de capture de leads
    htmlContent = injectScript(htmlContent, landingPage.id, slug);
    
    // Définir le bon Content-Type et envoyer
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlContent);
    
  } catch (error) {
    console.error('Error in serveLandingPage:', error);
    res.status(500).send('Erreur serveur');
  }
};

/**
 * Servir les assets statiques d'un template
 */
exports.serveAsset = (req, res) => {
  try {
    const { slug } = req.params;
    const assetPath = req.params[0]; // Capture le reste du chemin
    
    // Récupérer la landing page par son slug
    const landingPage = landingPageService.getLandingPageBySlug(slug);
    
    if (!landingPage || !landingPage.mainHtmlFile) {
      return res.status(404).send('Not found');
    }
    
    const mainHtmlFile = landingPage.mainHtmlFile;
    
    // Construire le chemin vers l'asset en tenant compte du dossier du fichier HTML
    // Les assets sont relatifs au dossier contenant le fichier HTML principal
    const htmlDir = mainHtmlFile.filePath === '/' ? '' : mainHtmlFile.filePath;
    const fullAssetPath = path.join(
      TEMPLATES_DIR,
      mainHtmlFile.libraryId.toString(),
      htmlDir,
      assetPath
    );
    
    // Vérification de sécurité - s'assurer qu'on reste dans le dossier templates
    const normalizedPath = path.normalize(fullAssetPath);
    if (!normalizedPath.startsWith(TEMPLATES_DIR)) {
      return res.status(403).send('Forbidden');
    }
    
    // Vérifier que le fichier existe
    if (!fs.existsSync(fullAssetPath)) {
      return res.status(404).send('Not found');
    }
    
    // Envoyer le fichier
    res.sendFile(fullAssetPath);
    
  } catch (error) {
    console.error('Error in serveAsset:', error);
    res.status(500).send('Erreur serveur');
  }
};
