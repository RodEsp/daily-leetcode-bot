# Use Node.js 24+ for native TypeScript support
FROM node:24-alpine

# Set working directory
WORKDIR /app

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code and type definitions
COPY src/ ./src/
COPY types/ ./types/
COPY data/ ./data/
COPY tsconfig.json ./

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Health check
# TODO: Make the bot expose an HTTP endpoint for this
# HEALTHCHECK --interval=60s --timeout=10s --start-period=30s --retries=3 \
#     ADD CMD FOR HEALTHCHECK HERE (e.g. curl -f http://localhost:3000/health || exit 1)

# Run the bot
CMD ["node", "src/bot.ts"]

