FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Override VITE_API_BASE_URL to empty so the frontend makes relative /api/* requests,
# which nginx proxies to the backend container. VITE_MAPTILER_API_KEY is read
# automatically by Vite from the copied frontend/.env.
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
