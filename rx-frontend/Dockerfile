# ---------- Build ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ---------- Production ----------
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY ./public/env-config.js /usr/share/nginx/html/env-config.js
COPY default.conf /etc/nginx/conf.d/default.conf

# Install envsubst for runtime env injection if needed
RUN apk add --no-cache gettext

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
