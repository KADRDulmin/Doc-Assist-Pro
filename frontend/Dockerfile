FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0
ENV CI=1

# Expose ports
EXPOSE 19000
EXPOSE 19001
EXPOSE 19006

# Start the Expo web server
CMD ["npx", "expo", "start", "--web", "--no-dev"]