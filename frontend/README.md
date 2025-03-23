# 🏥 Doc-Assist-Pro Frontend

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

A modern healthcare assistant application built with React Native, Expo, and TypeScript.

<p align="center">
  <img src="https://via.placeholder.com/500x300?text=Doc-Assist-Pro+Screenshot" alt="Doc-Assist-Pro Screenshot" />
</p>

## 📑 Table of Contents

- [Features](#-features)
- [Setup and Installation](#-setup-and-installation)
  - [Docker Setup](#using-docker-recommended)
  - [Local Setup](#local-setup)
- [Running the Application](#-running-the-application)
  - [Using Docker](#using-docker)
  - [Running Locally](#running-locally)
  - [Opening in Expo Go Mobile App](#opening-in-expo-go-mobile-app)
- [Project Structure](#-project-structure)
- [Troubleshooting](#-troubleshooting)

## ✨ Features

- User authentication (login/register)
- Intuitive navigation using Expo Router
- Responsive design for both mobile and web
- Seamless integration with backend API
- Dark and light theme support

## 🚀 Setup and Installation

### Using Docker (Recommended)

The easiest way to get started is using Docker, which sets up the entire development environment for you.

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/Doc-Assist-Pro.git
   cd Doc-Assist-Pro
   ```

2. **Start the Docker containers**

   ```bash
   docker-compose up --build
   ```

   This will start:
   - Frontend (Expo/React Native) on port 19006
   - Backend (Node.js/Express) on port 3000
   - PostgreSQL database on port 5432
   - PgAdmin on port 5050

3. **Access the application**
   - Web version: http://localhost:19006
   - API: http://localhost:3000/api

### Local Setup

If you prefer to run components individually:

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/Doc-Assist-Pro.git
   cd Doc-Assist-Pro
   ```

2. **Setup environment variables**
   
   Copy the example environment file:

   ```bash
   cd frontend
   cp .env.example .env
   ```
   
   Edit the `.env` file to configure your environment.

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Setup the backend (optional if using Docker for backend only)**
   
   Follow instructions in the backend README if you want to run the backend locally.

## 🏃‍♂️ Running the Application

### Using Docker

Once your Docker containers are running:

- **Web access**: Open http://localhost:19006 in your browser
- **API access**: http://localhost:3000/api 
- **PgAdmin access**: http://localhost:5050 (email: admin@example.com, password: admin)

### Running Locally

To start the Expo development server:

```bash
npm start
```

For device-specific commands:

```bash
# Web version
npm run web

# Android
npm run android

# iOS
npm run ios
```

For direct device testing with proper IP configuration:

```bash
npm run device
```

### Opening in Expo Go Mobile App

1. **Install Expo Go** on your iOS or Android device from the app store

2. **Connect your mobile device to the same WiFi network as your computer**

3. **Get LAN access details**:
   ```bash
   npm run device
   ```
   This will display your local IP and setup instructions.

4. **Scan the QR code** displayed in the terminal or browser with:
   - **iOS**: Use the Camera app
   - **Android**: Use the Expo Go app

5. **Direct URL entry**: Alternatively, open Expo Go and enter:
   ```
   exp://<YOUR_LOCAL_IP>:19000
   ```

<p align="center">
  <img src="https://via.placeholder.com/300x300?text=Expo+QR+Code" alt="Expo QR Code" />
</p>

## 📁 Project Structure

```
frontend/
├── app/               # Application screens using Expo Router
├── assets/            # Static assets (images, fonts)
├── components/        # Reusable UI components
├── src/
│   ├── controllers/   # Business logic
│   ├── hooks/         # Custom React hooks
│   ├── models/        # TypeScript interfaces/types
│   ├── services/      # API services and utilities
├── scripts/           # Helper scripts
```

## ❓ Troubleshooting

### Connection Issues with Expo Go

If you're having trouble connecting with Expo Go:

1. **Check your IP address**:
   ```bash
   npm run test-android
   ```
   This will show your local IP addresses.

2. **Update your environment file**:
   Edit `.env` or `.env.device` and set:
   ```
   EXPO_PUBLIC_LOCAL_URL=http://<YOUR_LOCAL_IP>:19000
   ```

3. **For Android emulator** issues with connection:
   ```bash
   adb reverse tcp:8081 tcp:8081
   adb reverse tcp:19000 tcp:19000
   ```

4. **Test CORS configuration**:
   ```bash
   npm run test-cors
   ```

### Docker Issues

1. **Port conflicts**: Make sure ports 3000, 5432, 19000, 19006 are available

2. **PostgreSQL connection issues**: Check database credentials in `docker-compose.yml`

## 📚 Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)

## 👥 Join the Community

- [Expo on GitHub](https://github.com/expo/expo)
- [Expo Discord](https://chat.expo.dev)
