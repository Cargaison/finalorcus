# backend/Dockerfile

FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

COPY . .

# Exposer le port du backend (par exemple, 5000)
EXPOSE 5000

# Démarrer l'application
CMD ["node", "server.js"]
