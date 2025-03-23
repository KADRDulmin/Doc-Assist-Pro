FROM node:18-alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Set environment variables
ENV NODE_ENV=development
ENV CI=false
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0
# Explicitly allow connections from LAN
ENV EXPO_NO_DOCTOR=1

# Expose ports
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002
EXPOSE 19006
EXPOSE 8081

# Start the Expo server with proper host settings
CMD ["sh", "-c", "export REACT_NATIVE_PACKAGER_HOSTNAME=$(ip route | grep default | awk '{print $9}') && npm run docker-start-expo"]