# Multi-stage build for React TypeScript application with nginx

# Build stage
FROM node:20-alpine AS builder

# Build arguments for environment variables
ARG VITE_NAVER_MAP_CLIENT_ID
ARG VITE_API_BASE_URL
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_OAUTH_REDIRECT_URI

# Set environment variables for build
ENV VITE_NAVER_MAP_CLIENT_ID=$VITE_NAVER_MAP_CLIENT_ID
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_OAUTH_REDIRECT_URI=$VITE_OAUTH_REDIRECT_URI

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile --production=false

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Production stage with nginx
FROM nginx:alpine AS production

# Install curl for health checks
RUN apk --no-cache add curl

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create nginx log directory
RUN mkdir -p /var/log/nginx

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chmod -R 755 /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Use non-root user (nginx user)
USER nginx

# Start nginx
CMD ["nginx", "-g", "daemon off;"]