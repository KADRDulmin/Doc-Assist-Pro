FROM node:18-alpine
WORKDIR /frontend
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 19000
CMD ["npx", "expo", "start", "--dev", "--no-proxy"]