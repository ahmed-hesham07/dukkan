FROM node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293
WORKDIR /app

# Copy manifests and lockfile — npm ci requires all workspace package.json files
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json   ./packages/shared/
COPY packages/backend/package.json  ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/

# npm ci installs from the lockfile — no version resolution, fewer network requests
RUN npm ci --ignore-scripts

# Copy source after install (better layer caching)
COPY packages/shared  ./packages/shared
COPY packages/backend ./packages/backend

WORKDIR /app/packages/backend

EXPOSE 4847
CMD ["npx", "tsx", "src/index.ts"]
