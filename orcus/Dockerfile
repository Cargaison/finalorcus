# frontend/Dockerfile

# Étape 1 : Construire l'application React
FROM node:18-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Étape 2 : Utiliser une image Nginx pour servir l'application
FROM nginx:stable-alpine

# Copier le build de React dans le dossier par défaut de Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copier la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposer le port 80
EXPOSE 80

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]
