# 🐳 Docker pour WM SaaS Landing

Guide complet pour déployer l'application avec Docker.

## 📋 Prérequis

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- Compte [Docker Hub](https://hub.docker.com/) (pour le déploiement)

## 🚀 Démarrage rapide

### Avec Docker Compose (recommandé)

```bash
# Cloner le repository
git clone <votre-repo>
cd wm-saas-landing

# Démarrer l'application
docker-compose up -d

# Vérifier que l'application fonctionne
curl http://localhost:3000
```

### Avec Docker directement

```bash
# Builder l'image
docker build -t wm-saas-landing .

# Démarrer le conteneur
docker run -p 3000:3000 -d wm-saas-landing
```

## 🔧 Configuration

### Variables d'environnement

Créez un fichier `.env` dans la racine du projet :

```env
NODE_ENV=production
PORT=3000
SESSION_SECRET=votre-cle-secrete-super-securisee
DATABASE_URL=sqlite:///./data/app.db

# Si vous utilisez une base de données externe
# DATABASE_URL=postgresql://user:password@db:5432/landinghub

# Configuration SMTP (optionnel)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=votre-email@gmail.com
# SMTP_PASS=votre-mot-de-passe
```

### Volumes persistants

L'application utilise des volumes pour persister les données :

- `./public/templates` : Templates HTML des landing pages
- `./uploads` : Fichiers uploadés par les utilisateurs

## 📦 Déploiement vers Docker Hub

### Configuration initiale

1. **Se connecter à Docker Hub :**
```bash
docker login
# Entrez vos identifiants Docker Hub
```

2. **Rendre le script exécutable :**
```bash
chmod +x deploy.sh
```

### Déploiement

**Version latest :**
```bash
./deploy.sh
```

**Version spécifique :**
```bash
./deploy.sh v1.2.0
```

Le script va automatiquement :
- Builder l'image
- La tagger pour Docker Hub (`kleekr/wm-saas-landing`)
- La pousser vers Docker Hub
- Nettoyer les images locales

## 🏗️ Architecture Docker

### Multi-stage build

Le Dockerfile utilise une approche multi-stage pour optimiser la taille de l'image :

1. **Étape de build** : Installe toutes les dépendances et build l'application
2. **Étape de production** : Copie seulement les fichiers nécessaires pour une image légère

### Sécurité

- Utilisateur non-root (`nodejs`)
- `dumb-init` pour gérer correctement les signaux système
- Permissions restrictives sur les fichiers

### Healthcheck

L'application inclut un healthcheck automatique :
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
```

## 🔍 Debugging

### Logs

```bash
# Voir les logs de l'application
docker-compose logs -f app

# Logs détaillés
docker logs wm-saas-landing
```

### Accès au conteneur

```bash
# Shell dans le conteneur
docker exec -it wm-saas-landing sh

# Vérifier les processus
docker top wm-saas-landing
```

### Variables d'environnement

```bash
# Voir les variables dans le conteneur
docker exec wm-saas-landing env
```

## 📊 Monitoring

### Métriques de santé

- **Endpoint health** : `GET /health`
- **Status Docker** : `docker ps`
- **Utilisation ressources** : `docker stats`

### Logs structurés

L'application log automatiquement :
- Démarrage de l'application
- Erreurs serveur
- Requêtes importantes

## 🔄 Mises à jour

### Mise à jour automatique

```bash
# Arrêter l'ancienne version
docker-compose down

# Puller la nouvelle image
docker pull kleekr/wm-saas-landing:latest

# Redémarrer
docker-compose up -d
```

### Rollback

```bash
# Revenir à une version précédente
docker tag kleekr/wm-saas-landing:v1.1.0 kleekr/wm-saas-landing:latest
docker-compose up -d
```

## 🛠️ Développement

### Mode développement avec Docker

Pour le développement, utilisez plutôt `docker-compose.dev.yml` :

```yaml
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev  # Dockerfile pour le dev
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run dev
```

## 📚 Commandes utiles

```bash
# Gestion des conteneurs
docker-compose up -d          # Démarrer
docker-compose down           # Arrêter
docker-compose restart        # Redémarrer
docker-compose logs -f        # Logs en temps réel

# Nettoyage
docker system prune           # Nettoyer les ressources inutilisées
docker volume prune           # Nettoyer les volumes orphelins

# Debug avancé
docker inspect wm-saas-landing  # Inspecter le conteneur
docker history kleekr/wm-saas-landing  # Historique des layers
```

## 🚨 Dépannage

### Problèmes courants

**Port déjà utilisé :**
```bash
# Changer le port dans docker-compose.yml
ports:
  - "3001:3000"
```

**Permissions sur les volumes :**
```bash
# Corriger les permissions
sudo chown -R 1001:1001 ./public/templates ./uploads
```

**Mémoire pleine :**
```bash
# Nettoyer Docker
docker system prune -a --volumes
```

## 📞 Support

Pour des problèmes spécifiques :
1. Vérifiez les logs : `docker-compose logs`
2. Testez localement : `npm start`
3. Vérifiez la configuration Docker

---

🎉 **Votre application est maintenant containerisée et prête pour le déploiement !**