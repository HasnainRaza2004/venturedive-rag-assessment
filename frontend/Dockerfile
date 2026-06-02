# Skeleton — replace with Vite build + nginx in Phase 9
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# TODO: add nginx.conf for SPA fallback + /api proxy if needed
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
