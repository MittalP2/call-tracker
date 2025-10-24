FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Create volume for database
VOLUME ["/app/data"]

# Set environment variable for database location
ENV DB_PATH=/app/data/call-tracker.db

# Start application
CMD ["node", "server.js"]

