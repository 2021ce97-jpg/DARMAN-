# MediConnect Backend Dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY .env.example ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mediconnect -u 1001

# Set ownership
RUN chown -R mediconnect:nodejs /app

# Switch to non-root user
USER mediconnect

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start server
CMD ["node", "src/server.js"]
