#!/bin/bash

# Script de build et déploiement vers Docker Hub
# Utilisation: ./deploy.sh [tag]

set -e  # Arrêter le script en cas d'erreur

# Configuration
DOCKER_HUB_USERNAME="kleekr"
IMAGE_NAME="wm-saas-landing"
TAG=${1:-"latest"}

# Fonction d'affichage coloré
print_status() {
    echo -e "\033[1;32m✓ $1\033[0m"
}

print_error() {
    echo -e "\033[1;31m✗ $1\033[0m"
}

print_info() {
    echo -e "\033[1;34mℹ $1\033[0m"
}

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    print_error "Docker n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier si l'utilisateur est connecté à Docker Hub
if ! docker info &> /dev/null; then
    print_error "Vous n'êtes pas connecté à Docker. Exécutez 'docker login' d'abord."
    exit 1
fi

print_info "🚀 Démarrage du déploiement de $DOCKER_HUB_USERNAME/$IMAGE_NAME:$TAG"

# Étape 1: Builder l'image
print_info "🔨 Construction de l'image Docker..."
docker build -t $IMAGE_NAME:$TAG .

if [ $? -eq 0 ]; then
    print_status "Image construite avec succès"
else
    print_error "Échec de la construction de l'image"
    exit 1
fi

# Étape 2: Tagger l'image pour Docker Hub
print_info "🏷️  Taggage de l'image..."
docker tag $IMAGE_NAME:$TAG $DOCKER_HUB_USERNAME/$IMAGE_NAME:$TAG

if [ $? -eq 0 ]; then
    print_status "Image taggée avec succès"
else
    print_error "Échec du taggage"
    exit 1
fi

# Étape 3: Pousser vers Docker Hub
print_info "📤 Upload vers Docker Hub..."
docker push $DOCKER_HUB_USERNAME/$IMAGE_NAME:$TAG

if [ $? -eq 0 ]; then
    print_status "Image poussée vers Docker Hub avec succès"
else
    print_error "Échec de l'upload vers Docker Hub"
    exit 1
fi

# Étape 4: Nettoyer les images locales (optionnel)
print_info "🧹 Nettoyage des images locales..."
docker rmi $IMAGE_NAME:$TAG $DOCKER_HUB_USERNAME/$IMAGE_NAME:$TAG 2>/dev/null || true

print_status "🎉 Déploiement terminé avec succès!"
print_info "Votre image est disponible sur: https://hub.docker.com/r/$DOCKER_HUB_USERNAME/$IMAGE_NAME/tags"

# Afficher les commandes pour utiliser l'image
echo ""
print_info "📋 Commandes pour utiliser votre image:"
echo "  # Démarrer avec docker-compose:"
echo "  docker-compose up -d"
echo ""
echo "  # Ou directement avec Docker:"
echo "  docker run -p 3000:3000 $DOCKER_HUB_USERNAME/$IMAGE_NAME:$TAG"
echo ""
echo "  # Pour une version spécifique:"
echo "  docker run -p 3000:3000 $DOCKER_HUB_USERNAME/$IMAGE_NAME:v1.2.0"