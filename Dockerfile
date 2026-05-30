# ── Stage 1: build the React client ──────────────────────────────────────────
FROM node:20-alpine AS client-builder
WORKDIR /app
COPY client/package*.json ./
RUN npm install
COPY client/ .
RUN npm run build

# ── Stage 2: nginx serves the static client + proxies /socket.io ─────────────
FROM nginx:1.27-alpine
COPY --from=client-builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
