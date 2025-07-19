# Multi-stage build for optimization
# Stage 1: Development dependencies and build
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Run any build steps (linting, testing in CI)
RUN npm run lint --if-present

# Stage 2: Development image (for development environment)
FROM node:18-alpine AS development

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for debugging)
RUN npm install && npm cache clean --force

# Copy source code
COPY . .

# Change ownership to node user
RUN chown -R node:node /app
USER node

# Expose port
EXPOSE 3001

# Start in development mode with nodemon
CMD ["npm", "run", "dev"]

# Stage 3: Production image
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S flowbit -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code from builder stage
COPY --from=builder --chown=flowbit:nodejs /app/src ./src
COPY --from=builder --chown=flowbit:nodejs /app/config ./config
COPY --from=builder --chown=flowbit:nodejs /app/middleware ./middleware
COPY --from=builder --chown=flowbit:nodejs /app/models ./models
COPY --from=builder --chown=flowbit:nodejs /app/routes ./routes
COPY --from=builder --chown=flowbit:nodejs /app/services ./services
COPY --from=builder --chown=flowbit:nodejs /app/utils ./utils
COPY --from=builder --chown=flowbit:nodejs /app/tests ./tests
COPY --from=builder --chown=flowbit:nodejs /app/*.js ./

# Change ownership of app directory
RUN chown -R flowbit:nodejs /app

# Switch to non-root user
USER flowbit

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node healthcheck.js

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["npm", "start"]
