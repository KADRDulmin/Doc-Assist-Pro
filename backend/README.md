<div align="center">

# ⚙️ Doc-Assist-Pro Backend

### Powerful API Engine for Healthcare Management

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)](https://jwt.io/)
[![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)


> RESTful API service powering the Doc-Assist-Pro healthcare platform

</div>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-docker-setup">Docker Setup</a> •
  <a href="#-local-development">Local Development</a> •
  <a href="#-api-documentation">API Documentation</a> •
  <a href="#-project-structure">Project Structure</a> •
  <a href="#-database">Database</a> •
  <a href="#-troubleshooting">Troubleshooting</a>
</p>

---

## ✨ Features

- **RESTful API**: Clean API design with Express.js
- **Authentication**: Secure JWT-based auth system
- **PostgreSQL Database**: Robust data storage with efficient querying
- **Docker Integration**: Containerized deployment for consistent environments
- **Error Handling**: Comprehensive error management
- **Health Checks**: API and database monitoring endpoints
- **In-Memory Fallback**: Graceful degradation when database is unavailable

---

# Backend Architecture

## 🏗️ System Overview

The backend system is built with Node.js and Express, providing a robust RESTful API for authentication and user management. The architecture follows a clean, modular design with separation of concerns and fallback mechanisms for high availability.

```
┌─────────────────────┐
│                     │
│    Express Server   │
│                     │
└───────────┬─────────┘
            │
            ▼
┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │
│  Middleware Layer   │◄────│   Routes & API      │
│                     │     │                     │
└───────────┬─────────┘     └─────────────────────┘
            │
            ▼
┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │
│    Controllers      │◄────│     Services        │
│                     │     │                     │
└───────────┬─────────┘     └────────┬────────────┘
            │                        │
            ▼                        ▼
┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │
│    Repositories     │◄────│      Models         │
│                     │     │                     │
└───────────┬─────────┘     └─────────────────────┘
            │
            ▼
┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │
│  PostgreSQL DB      │◄────│  Memory Fallback    │
│                     │     │                     │
└─────────────────────┘     └─────────────────────┘
```

## 🔧 Core Components

### API Server (`app.js`)
- Express server configuration with CORS support
- Centralized error handling
- Request logging
- Dynamic environment configuration

### Configuration Layer
- Environment-based settings via `.env`
- Intelligent PostgreSQL connection management
- Docker environment detection
- Connection pooling

### Authentication System
- JWT-based authentication
- Password hashing with bcrypt
- Token verification middleware
- User session management

### Database Access
- PostgreSQL with connection pooling
- In-memory fallback store for high availability
- Automatic table creation and initialization
- Health checking capabilities


## 🔐 Security Features

- **Password Security**: Bcrypt hashing with salt rounds
- **JWT Authentication**: Secure token-based sessions
- **Input Validation**: Server-side validation for all requests
- **Error Handling**: Sanitized error responses
- **CORS Protection**: Configurable origin restrictions
- **Database Security**: Parameterized queries to prevent SQL injection

## 🛡️ Error Handling

The system implements a comprehensive error handling strategy:

- **Global Error Middleware**: Catches and standardizes all errors
- **Specific Error Types**: Custom error handling for different scenarios
- **Graceful Degradation**: Fallback strategies when services are unavailable
- **Detailed Logging**: Errors are logged with contextual information


## 📦 Containerization

The backend is containerized using Docker with the following features:

- Alpine-based Node.js container
- Multi-stage build process
- Health check endpoint
- Container orchestration with docker-compose
- Auto-detection of container environment

## 🐳 Docker Setup

The easiest way to run the backend is using Docker, which sets up the entire environment with all dependencies.

### Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Launch with Docker

From the root project directory:

```bash
# Start all services (frontend, backend, database)
docker-compose up --build

# Start only the backend and database
docker-compose up --build backend db
```

The backend API will be available at [http://localhost:3000/api](http://localhost:3000/api).

### Environment Variables

Docker Compose sets these automatically, but you can customize them in `docker-compose.yml`:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port the server runs on | `3000` |
| `PGHOST` | PostgreSQL hostname | `db` |
| `PGUSER` | Database username | `postgres` |
| `PGPASSWORD` | Database password | `postgres` |
| `PGDATABASE` | Database name | `doc_assist` |
| `JWT_SECRET` | Secret for signing JWTs | *auto-generated* |

### Checking Health Status

```bash
# API health check
curl http://localhost:3000/api/health

# Database health check
curl http://localhost:3000/api/health/db
```

---

## 💻 Local Development

For development or running the backend independently.

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [PostgreSQL](https://www.postgresql.org/) (v12 or later)

### Setup & Installation

1. **Clone the repository** (if not already done)

   ```bash
   git clone https://github.com/yourusername/Doc-Assist-Pro.git
   cd Doc-Assist-Pro/backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Setup environment variables**

   Create a `.env` file in the backend directory:

   ```
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # Database Configuration
   PGHOST=localhost
   PGUSER=postgres
   PGPASSWORD=postgres
   PGDATABASE=doc_assist
   PGPORT=5432
   
   # JWT Configuration
   JWT_SECRET=your_secure_secret_key_here
   JWT_EXPIRY=1h
   ```

4. **Initialize the database**

   ```bash
   # Check PostgreSQL connection
   npm run db:check
   
   # Initialize database schema
   npm run db:init
   ```

### Running the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

### Test User Credentials

The database is initialized with a test user:
- **Email**: `test@example.com`
- **Password**: `test123`

---

## 📚 API Documentation

### Available Endpoints


### Authentication API

| Method | Endpoint           | Description                           | Auth Required |
|--------|-------------------|---------------------------------------|---------------|
| POST   | /api/auth/register | Register a new user                   | No            |
| POST   | /api/auth/login    | Authenticate and get token            | No            |
| GET    | /api/auth/me       | Get current user profile              | Yes           |

### System Endpoints

| Method | Endpoint           | Description                           | Auth Required |
|--------|-------------------|---------------------------------------|---------------|
| GET    | /api              | API information and available endpoints| No            |
| GET    | /api/health       | System health check                   | No            |
| GET    | /api/health/db    | Database connection status            | No            |
| GET    | /api/cors-test    | Test CORS configuration               | No            |


### Authentication

The API uses JWT (JSON Web Token) authentication:

```bash
# Include in request headers
Authorization: Bearer <your_jwt_token>
```

<details>
<summary>Example API Requests</summary>

#### Register a new user
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"securepassword"}'
```

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"securepassword"}'
```

#### Get Current User
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer your_jwt_token"
```
</details>

---

## 📁 Project Structure

The backend follows a modular architecture for better organization and maintainability.

### Architectural Design


```
backend/
├── app.js                  # Application entry point
├── config/                 # Configuration files
│   └── database.js         # Database connection
├── controllers/            # Request handlers
│   └── authController.js   # Authentication endpoints
├── database/               # Database management
│   └── init.js             # DB initialization script
├── middleware/             # Express middleware
│   ├── auth.js             # JWT authentication
│   └── errorHandler.js     # Global error handling
├── models/                 # Data models
│   └── user.js             # User entity
├── repositories/           # Data access layer
│   └── userRepository.js   # User storage operations
├── routes/                 # API routes
│   ├── index.js            # Main router
│   └── authRoutes.js       # Auth endpoints
├── scripts/                # Utility scripts
│   └── check-postgres.js   # DB connection checker
├── services/               # Business logic
│   ├── authService.js      # Auth operations
│   └── emailService.js     # Email notifications
└── utils/                  # Helper utilities
    └── memoryStore.js      # In-memory data fallback
```


The backend follows a layered architecture pattern:

| Layer | Responsibility |
|-------|----------------|
| **Routes** | Define API endpoints and request handling |
| **Controllers** | Handle HTTP requests/responses and validation |
| **Services** | Implement business logic and orchestration |
| **Repositories** | Access and manipulate data sources |
| **Models** | Define data structures and schemas |

This separation of concerns makes the code more maintainable, testable, and scalable.

---

## 🗄️ Database

The application uses PostgreSQL for reliable and robust data storage.

### Schema

The database includes these core tables:

| Table | Description |
|-------|-------------|
| `users` | User accounts and authentication information |
| `patients` | Patient demographic and contact information |
| `appointments` | Scheduling data for doctor appointments |
| `medical_records` | Patient health information and history |
| `prescriptions` | Medication and treatment orders |

### Setup PostgreSQL Locally

<details>
<summary>PostgreSQL Setup Instructions</summary>

#### Windows
1. Download and install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Set password for 'postgres' user during installation
3. Create database:
     ```sql
     CREATE DATABASE doc_assist;
     ```

#### macOS
1. Install with Homebrew: `brew install postgresql`
2. Start service: `brew services start postgresql`
3. Create database: `createdb doc_assist`

#### Linux (Ubuntu/Debian)
1. Install PostgreSQL: `sudo apt update && sudo apt install postgresql postgresql-contrib`
2. Start service: `sudo systemctl start postgresql`
3. Switch to postgres user: `sudo -i -u postgres`
4. Create database: `createdb doc_assist`
</details>

### Database Health Check

Run this script to verify your database connection:

```bash
npm run db:check
# or directly with node
node scripts/check-db-connection.js
```

---

## 🔧 Troubleshooting

<details>
<summary>Connection Refused to Database</summary>

If you get "connection refused" errors:

1. Check if PostgreSQL is running:
     ```bash
     # Windows
     net start postgresql
     
     # macOS
     brew services list
     
     # Linux
     sudo systemctl status postgresql
     ```

2. Verify your `.env` settings match your PostgreSQL configuration

3. Try explicit localhost connections:
     ```
     PGHOST=127.0.0.1
     ```

4. Check if the database exists:
     ```bash
     psql -U postgres -c "\l"
     ```
</details>

<details>
<summary>JWT Authentication Issues</summary>

1. Check that your `JWT_SECRET` is properly set in `.env`

2. Verify token format in Authorization header:
     ```
     Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```

3. Token might be expired - try logging in again

4. For development, you can decode tokens at [jwt.io](https://jwt.io/)
</details>

<details>
<summary>Docker Container Not Starting</summary>

1. Check logs:
     ```bash
     docker-compose logs backend
     ```

2. Verify all required environment variables are set

3. Check if ports are already in use:
     ```bash
     netstat -tuln | grep 3000
     ```

4. Try rebuilding:
     ```bash
     docker-compose down
     docker-compose up --build
     ```
</details>

---

## 🛠️ Development Tools

The project includes several helpful npm scripts:

| Script | Description |
|--------|-------------|
| `npm run dev` | Start server with hot-reload (nodemon) |
| `npm start` | Start server in production mode |
| `npm run lint` | Run ESLint for code quality |
| `npm run test` | Run test suite with Jest |
| `npm run db:init` | Initialize database schema |
| `npm run db:seed` | Populate database with sample data |
| `npm run db:reset` | Reset database (⚠️ deletes all data) |
<div align="center">

## 🔧 Backend Tech Stack

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)](https://jwt.io/)
[![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

<p align="center">
    <a href="https://github.com/KADRDulmin/Doc-Assist-Pro"><img src="https://img.shields.io/badge/View_Main_Project-4B0082?style=for-the-badge&logo=github&logoColor=white" alt="Main Project" /></a>
    <a href="https://github.com/KADRDulmin/Doc-Assist-Pro/tree/main/frontend"><img src="https://img.shields.io/badge/View_Frontend-9370DB?style=for-the-badge&logo=github&logoColor=white" alt="Frontend" /></a>
</p>

</div>
