FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/frontend/package.json ./packages/frontend/

RUN npm install --workspace=packages/shared --workspace=packages/frontend

# Copy source
COPY packages/shared ./packages/shared
COPY packages/frontend ./packages/frontend

# Build args for Vite
ARG VITE_API_URL=http://localhost:4847/api/v1
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build --workspace=packages/frontend

# Serve with nginx
FROM nginx:alpine AS runner
COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3847
CMD ["nginx", "-g", "daemon off;"]
