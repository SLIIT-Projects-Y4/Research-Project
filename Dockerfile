# Dockerfile
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

# install exactly what's in your lockfile
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# copy the rest (server.js, src/, etc.)
COPY . .

# Express uses this
ENV PORT=3000
EXPOSE 3000

# run with node (not nodemon) in the container
CMD ["node", "server.js"]
