FROM node:20-alpine
WORKDIR /app

# Install dependencies (all workspaces needed for tsx + shared types)
COPY package.json package-lock.json* tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/

RUN npm install --workspace=packages/shared --workspace=packages/backend --ignore-scripts

# Copy source
COPY packages/shared ./packages/shared
COPY packages/backend ./packages/backend

WORKDIR /app/packages/backend

EXPOSE 4847
CMD ["npx", "tsx", "src/index.ts"]
