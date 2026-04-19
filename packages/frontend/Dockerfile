FROM node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293 AS builder
WORKDIR /app

# Copy manifests and lockfile — npm ci requires all workspace package.json files
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json   ./packages/shared/
COPY packages/backend/package.json  ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/

# npm ci installs from the lockfile — no version resolution, fewer network requests
RUN npm ci --ignore-scripts

# Copy source after install (better layer caching)
COPY packages/shared   ./packages/shared
COPY packages/frontend ./packages/frontend

# Build args for Vite
ARG VITE_API_URL=http://localhost:4847/api/v1
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build --workspace=packages/frontend

# Serve with nginx
FROM nginx:alpine@sha256:5616878291a2eed594aee8db4dade5878cf7edcb475e59193904b198d9b830de AS runner
COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3847
CMD ["nginx", "-g", "daemon off;"]
