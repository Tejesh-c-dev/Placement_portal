# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads/resumes uploads/logos uploads/avatars

# Expose port
EXPOSE 5000

# Start application
CMD ["node", "src/server.js"]
