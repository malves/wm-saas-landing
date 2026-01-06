# NewsletterPro CRM

Application Node.js de gestion de newsletters et CRM, construite avec Express et EJS.

## Architecture

- **Backend**: Node.js + Express
- **Templates**: EJS (Embedded JavaScript)
- **CSS**: Tailwind CSS (via CDN)
- **Base de données**: JSON (fichier local avec écriture atomique)
- **Authentification**: Sessions + bcrypt

## Structure

```
src/
├── config/          # Configuration (port, sessions)
├── data/            # Base de données JSON
├── repositories/    # Couche d'accès aux données (pattern Repository)
├── services/        # Logique métier
├── controllers/     # Controllers Express
├── routes/          # Routes Express
├── middlewares/     # Middlewares (auth, validation, etc.)
├── views/           # Templates EJS
│   ├── layouts/     # Layouts principaux
│   ├── partials/    # Composants réutilisables
│   └── pages/       # Pages de l'application
└── app.js           # Point d'entrée
```

## Installation

```bash
# Installer les dépendances
npm install

# Créer le premier utilisateur admin (optionnel si db.json existe déjà)
node scripts/createAdmin.js
```

## Utilisation

```bash
# Développement (avec auto-reload)
npm run dev

# Production
npm start
```

L'application sera accessible sur **http://localhost:3000**

## Compte par défaut

- **Email**: admin@newsletterpro.com
- **Mot de passe**: admin123

⚠️ **Changez ce mot de passe après la première connexion!**

## Fonctionnalités

### Authentification
- ✅ Inscription avec validation
- ✅ Connexion avec bcrypt
- ✅ Déconnexion
- ✅ Protection des routes
- 🚧 Récupération de mot de passe (structure prête)

### Newsletters (CRUD complet)
- ✅ Créer une newsletter
- ✅ Lister toutes les newsletters
- ✅ Voir les détails d'une newsletter
- ✅ Modifier une newsletter
- ✅ Supprimer une newsletter

### Abonnés (CRUD complet)
- ✅ Ajouter un abonné
- ✅ Lister tous les abonnés
- ✅ Supprimer un abonné
- ✅ Gérer les abonnements aux newsletters

### Landing Pages & Leads
- ✅ Création et gestion de campagnes (landing pages)
- ✅ Bibliothèques de templates HTML (avec drag & drop)
- ✅ Capture automatique de leads depuis les formulaires HTML
- ✅ Gestion des champs personnalisés (customFields)
- ✅ Association leads ↔ campagnes sources

### Activité
- ✅ Journal d'activité
- ✅ Vue collection
- ✅ Statistiques en temps réel

## Routes principales

| Route | Méthode | Protection | Description |
|-------|---------|------------|-------------|
| `/` | GET | Auth requise | Dashboard |
| `/newsletters` | GET | Auth requise | Liste des newsletters |
| `/newsletters/create` | GET/POST | Auth requise | Créer une newsletter |
| `/newsletters/:id` | GET | Auth requise | Détails d'une newsletter |
| `/newsletters/:id/edit` | GET/POST | Auth requise | Modifier une newsletter |
| `/newsletters/:id/delete` | POST | Auth requise | Supprimer une newsletter |
| `/subscribers` | GET | Auth requise | Liste des abonnés |
| `/subscribers/create` | GET/POST | Auth requise | Ajouter un abonné |
| `/activity` | GET | Auth requise | Journal d'activité |
| `/auth/login` | GET/POST | Guest uniquement | Connexion |
| `/auth/register` | GET/POST | Guest uniquement | Inscription |
| `/auth/logout` | GET | - | Déconnexion |

## Architecture des données

Le fichier `src/data/db.json` contient plusieurs collections:

- **users**: Utilisateurs avec mots de passe hashés
- **newsletters**: Newsletters avec stats
- **subscribers**: Abonnés et leurs abonnements
- **activities**: Journal des activités
- **landingpages**: Campagnes et templates attachés
- **leads**: Leads capturés depuis les landing pages
- **libraries**: Bibliothèques de templates HTML

---

## 📋 Gestion des Leads

### Champs standards

La plateforme capture automatiquement les champs standards à partir des formulaires HTML de vos landing pages. Voici la liste des champs reconnus et leurs variantes :

| Champ DB | Label UI | Nom HTML principal | Variantes acceptées | Obligatoire |
|----------|----------|-------------------|-------------------|-------------|
| `firstName` | Prénom | `firstName` | `firstname`, `prenom`, `prénom`, `first_name`, `fname` | Non |
| `lastName` | Nom | `lastName` | `lastname`, `nom`, `last_name`, `lname` | Non |
| `email` | Email | `email` | `mail`, `e-mail`, `courriel` | **OUI** ✅ |
| `phone` | Téléphone | `phone` | `telephone`, `tel`, `mobile`, `portable` | Non |
| `address` | Adresse | `address` | `adresse`, `rue`, `street` | Non |
| `postalCode` | Code postal | `postalCode` | `postalcode`, `postal_code`, `codepostal`, `code_postal`, `zipcode`, `zip` | Non |
| `city` | Ville | `city` | `ville`, `town` | Non |

### Custom Fields (champs personnalisés)

Tout champ qui **n'est pas mappé** à un champ standard sera automatiquement stocké dans l'objet `customFields` du lead.

**Exemple** :  
Si votre formulaire contient un champ `<input name="budget">`, il sera stocké comme :

```json
{
  "id": 42,
  "email": "contact@example.com",
  "firstName": "Jean",
  "customFields": {
    "budget": "10000-50000"
  }
}
```

### Exemple de formulaire HTML

Voici un exemple complet de formulaire HTML à intégrer dans vos templates de landing page :

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ma Landing Page</title>
</head>
<body>
  <h1>Demandez votre devis gratuit</h1>
  
  <form id="contactForm">
    <!-- Champs standards -->
    <input type="email" name="email" placeholder="Email *" required>
    <input type="text" name="firstName" placeholder="Prénom">
    <input type="text" name="lastName" placeholder="Nom">
    <input type="tel" name="phone" placeholder="Téléphone">
    <input type="text" name="address" placeholder="Adresse">
    <input type="text" name="postalCode" placeholder="Code postal">
    <input type="text" name="city" placeholder="Ville">
    
    <!-- Champs personnalisés (customFields) -->
    <select name="budget">
      <option value="">Budget estimé</option>
      <option value="0-5000">0 - 5 000 €</option>
      <option value="5000-10000">5 000 - 10 000 €</option>
      <option value="10000+">Plus de 10 000 €</option>
    </select>
    
    <textarea name="message" placeholder="Votre message"></textarea>
    
    <button type="submit">Envoyer</button>
  </form>

  <!-- Script de capture injecté automatiquement par la plateforme -->
</body>
</html>
```

### Structure des données en base

```json
{
  "id": 1,
  "firstName": "Jean",
  "lastName": "Dupont",
  "email": "jean.dupont@example.com",
  "phone": "0612345678",
  "address": "10 rue de la Paix",
  "postalCode": "75001",
  "city": "Paris",
  "status": "new",
  "sourceLandingPages": [1],
  "customFields": {
    "budget": "10000+",
    "message": "Je souhaite un devis pour..."
  },
  "createdAt": "2026-01-05T12:00:00.000Z"
}
```

### Statuts des leads

| Valeur | Label UI | Description |
|--------|----------|-------------|
| `new` | Nouveau | Lead fraîchement capturé |
| `qualified` | Qualifié | Lead validé et qualifié |
| `converted` | Converti | Lead devenu client |
| `lost` | Perdu | Lead non abouti |

### Routes API publiques

#### Capture de lead (POST)

```
POST /api/leads/capture
Content-Type: application/json

{
  "email": "contact@example.com",
  "firstName": "Jean",
  "lastName": "Dupont",
  "phone": "0612345678",
  "address": "10 rue de la Paix",
  "postalCode": "75001",
  "city": "Paris",
  "landingPageId": 1,
  "customFields": {
    "budget": "10000+",
    "message": "Je souhaite un devis"
  }
}
```

**Réponse (succès)** :
```json
{
  "success": true,
  "message": "Lead capturé avec succès",
  "leadId": 42
}
```

### Injection automatique du script

Lorsque vous affichez une landing page via `/p/:slug`, la plateforme injecte automatiquement un script JavaScript qui :

1. Intercepte les soumissions de tous les formulaires
2. Extrait les données de chaque champ
3. Mappe automatiquement les champs standards
4. Place les champs non reconnus dans `customFields`
5. Envoie les données à `/api/leads/capture`
6. Affiche un message de confirmation

**Aucune configuration nécessaire** : le script est injecté avant la balise `</body>` de votre HTML.

## Avantages de cette architecture

1. **Séparation des responsabilités**: Pattern MVC avec couche Repository
2. **Maintenabilité**: Pas de duplication, composants réutilisables
3. **Évolutivité**: Remplacer JSON par SQL/MongoDB sans toucher aux controllers
4. **Sécurité**: Mots de passe hashés, sessions sécurisées, validation des entrées
5. **Simplicité**: Stack minimale, pas de build process

## Migration future vers base de données

Pour migrer vers MySQL/PostgreSQL/MongoDB:

1. Installer le driver (pg, mysql2, mongoose)
2. Créer un nouveau service (ex: `sqlDatabaseService.js`)
3. Remplacer `require('../data/jsonDatabaseService')` dans les repositories
4. **Aucun changement** dans controllers, services ou routes!

## Variables d'environnement

Créez un fichier `.env`:

```
PORT=3000
NODE_ENV=development
SESSION_SECRET=votre-secret-super-securise-ici
```

## Développement

Pour ajouter une nouvelle fonctionnalité:

1. **Repository**: Ajouter méthodes d'accès aux données
2. **Service**: Ajouter logique métier
3. **Controller**: Ajouter actions
4. **Routes**: Définir les routes
5. **Views**: Créer les templates EJS

## Support

Pour toute question, consultez la documentation Express et EJS.
