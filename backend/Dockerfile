FROM node:18-alpine

# Install curl for healthcheck
RUN apk --no-cache add curl

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Expose API port
EXPOSE 3000

# Define startup command
CMD ["node", "app.js"]