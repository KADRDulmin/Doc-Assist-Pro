<div align="center">
  
# 🏥 Doc-Assist-Pro

### Your Modern Healthcare Assistant Solution

[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

<p align="center">
  <img src="https://via.placeholder.com/800x400?text=Doc-Assist-Pro" alt="Doc-Assist-Pro Banner" />
</p>

> Streamlining healthcare management with cutting-edge technology

</div>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-docker-setup">Docker Setup</a> •
  <a href="#-local-development">Local Development</a> •
  <a href="#-mobile-access">Mobile Access</a> •
  <a href="#-database-management">Database</a> •
  <a href="#-troubleshooting">Troubleshooting</a>
</p>

---

## ✨ Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/Doc-Assist-Pro.git

# Navigate to project directory
cd Doc-Assist-Pro

# Launch with Docker
docker-compose up -d
```

Then open [http://localhost:19006](http://localhost:19006) in your browser.

---

## 🐳 Docker Setup

The fastest way to get Doc-Assist-Pro up and running is using Docker, which sets up the entire application stack for you with minimal configuration.

### Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Launch the Full Stack

```bash
# Build and start all containers in background
docker-compose up --build -d

# View logs (optional)
docker-compose logs -f
```

### What Gets Deployed

| Component | Description | Access URL |
|-----------|-------------|------------|
| 🖥️ Frontend | React Native web interface | [http://localhost:19006](http://localhost:19006) |
| ⚙️ Backend API | Node.js Express server | [http://localhost:3000/api](http://localhost:3000/api) |
| 🗄️ PostgreSQL | Database server | Port 5432 |
| 🔍 pgAdmin | Database management tool | [http://localhost:5050](http://localhost:5050) |

### Verify Services

Check if all services are running properly:

```bash
docker-compose ps
```

You should see `Up` status for all services.

---

## 💻 Local Development

If you prefer to run components individually or need more granular control:

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start Expo development server
npm start
```

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up environment variables (copy from sample)
cp .env.example .env

# Initialize database (if needed)
npm run db:init

# Start development server
npm run dev
```

### Environment Configuration

For local development, update your `.env` file in the backend folder:

```
# Database Configuration
PGHOST=localhost
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=doc_assist
PGPORT=5432

# JWT Configuration
JWT_SECRET=your_secret_key_here
```

---

## 📱 Mobile Access

Access Doc-Assist-Pro on your mobile device with these simple steps:

### Using Expo Go App

<div align="center">
  <img src="https://via.placeholder.com/250x250?text=Expo+QR" alt="Expo QR Code" />
</div>

1. **Install Expo Go** on your [iOS](https://apps.apple.com/app/expo-go/id982107779) or [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) device

2. **Connect to the same WiFi network** as your development computer

3. **Find your computer's IP address**:
   ```bash
   # In the frontend directory
   npm run test-android
   ```

4. **Start the development server for devices**:
   ```bash
   # For direct device access
   npm run device
   ```

5. **Connect using one of these methods**:
   - Scan the QR code from terminal with your device camera
   - Open Expo Go and enter: `exp://<YOUR_IP_ADDRESS>:19000`

### Using Emulators/Simulators

```bash
# For Android Emulator
npm run android

# For iOS Simulator (macOS only)
npm run ios
```

For Android emulator connection issues:
```bash
adb reverse tcp:8081 tcp:8081
adb reverse tcp:19000 tcp:19000
```

---

## 🗄️ Database Management

Doc-Assist-Pro uses PostgreSQL for data storage with easy management tools.

### Database Structure

The database includes the following key tables:

- **users**: Authentication data and user profiles
- **patients**: Patient records and information
- **appointments**: Scheduling information
- **medical_records**: Patient medical history

Default test account: `test@example.com` / `test123`

### Accessing with pgAdmin

<div align="center">
  <img src="https://via.placeholder.com/600x300?text=pgAdmin+Interface" alt="pgAdmin Interface" />
</div>

1. **Access pgAdmin** at [http://localhost:5050](http://localhost:5050)

2. **Login credentials**:
   - Email: `admin@example.com`
   - Password: `admin`

3. **Register the server**:
   - Right-click "Servers" → "Create" → "Server..."
   - Name: `Doc-Assist-DB`
   - Connection tab:
     - Host: `db` (if using Docker) or `localhost` (for local setup)
     - Port: `5432`
     - Maintenance DB: `postgres`
     - Username: `postgres`
     - Password: `postgres`

4. **Browse the database**:
   - Navigate to: Servers → Doc-Assist-DB → Databases → doc_assist → Schemas → public → Tables

### Direct Database Access

```bash
# Via Docker
docker exec -it doc-assist-pro_db_1 psql -U postgres -d doc_assist

# Local PostgreSQL client
psql -U postgres -d doc_assist
```

#### Useful PostgreSQL Commands

| Command | Description |
|---------|-------------|
| `\dt` | List all tables |
| `\d table_name` | Describe table structure |
| `\du` | List users and roles |
| `\l` | List databases |
| `\q` | Quit psql |

---

## 🔧 Troubleshooting

### Docker Issues

<details>
<summary>Container fails to start</summary>

```bash
# Check for errors in logs
docker-compose logs

# Verify ports are available
netstat -ano | findstr :3000
netstat -ano | findstr :5432
netstat -ano | findstr :19006

# Try rebuilding the containers
docker-compose down
docker-compose up --build
```
</details>

<details>
<summary>Database connection errors</summary>

```bash
# Check database container status
docker-compose ps db

# Run database health check
docker exec doc-assist-pro_backend_1 npm run db:check

# Verify database initialization
docker exec doc-assist-pro_db_1 psql -U postgres -c "\l"
```
</details>

### Expo/Mobile Connection Issues

<details>
<summary>Cannot connect from mobile device</summary>

1. Ensure your phone and computer are on the same WiFi network

2. Update your environment variables:
   ```bash
   # In frontend/.env.device
   EXPO_PUBLIC_LOCAL_URL=http://<YOUR_ACTUAL_IP>:19000
   EXPO_PUBLIC_API_URL=http://<YOUR_ACTUAL_IP>:3000
   ```

3. Test connectivity:
   ```bash
   npm run test-cors
   ```
</details>

<details>
<summary>QR Code not working</summary>

1. Make sure you're using the correct app:
   - iOS: Use the Camera app
   - Android: Use the Expo Go app

2. Try manually entering the URL:
   ```
   exp://<YOUR_IP>:19000
   ```

3. Check if your firewall is blocking connections
</details>

---

## 📚 Additional Resources

- [Frontend Documentation](./frontend/README.md)
- [API Documentation](./backend/README.md)
- [Expo Documentation](https://docs.expo.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)

---

<div align="center">

### 🚀 Ready to Transform Healthcare Management?

[Report Bug](https://github.com/KADRDulmin/Doc-Assist-Pro/issues) · [Request Feature](https://github./KADRDulmin/Doc-Assist-Pro/discussions)

</div>