# Skeleton — replace with multi-stage build in Phase 9
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 4000
CMD ["node", "src/index.js"]
