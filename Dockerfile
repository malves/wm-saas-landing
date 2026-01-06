# Étape de build
FROM node:18-alpine AS builder

# Installer les dépendances système nécessaires
RUN apk add --no-cache python3 make g++

# Créer le répertoire de l'application
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production && npm cache clean --force

# Étape de production
FROM node:18-alpine AS production

# Installer les dépendances système pour la production
RUN apk add --no-cache dumb-init curl

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Créer le répertoire de l'application
WORKDIR /app

# Copier les dépendances depuis l'étape de build
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copier le code source
COPY --chown=nodejs:nodejs . .

# Créer les répertoires nécessaires avec les bonnes permissions
RUN mkdir -p /app/public/templates && \
    mkdir -p /app/uploads && \
    chown -R nodejs:nodejs /app/public && \
    chown -R nodejs:nodejs /app/uploads

# Exposer le port
EXPOSE 3000

# Utiliser dumb-init pour gérer les signaux correctement
ENTRYPOINT ["dumb-init", "--"]

# Démarrer l'application
USER nodejs
CMD ["npm", "start"]