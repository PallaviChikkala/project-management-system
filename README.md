# Project Management System (PMS) — Full Stack (Web + Mobile + Backend)

A complete, production-ready Full Stack Project Management System featuring a **Web Application (React + Vite)**, **Mobile Application (React Native + Expo)**, and a unified **REST API Backend (Node.js + Express + Prisma ORM + MySQL)**.

Both web and mobile clients share the exact same backend and database, allowing users to register, log in, create projects, manage tasks, track progress, and view real-time metrics with seamless cross-platform synchronization.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
|---|---|
| **Backend** | Node.js, Express 5, Prisma ORM 6.19.3, JWT (`jsonwebtoken`), `bcrypt`, `zod`, `morgan`, `express-rate-limit`, `cors` |
| **Database** | MySQL (Database: `project_management_system`) |
| **Frontend (Web)** | React 19, Vite 8, Lucide React icons, Responsive CSS Design System |
| **Mobile App** | React Native 0.86, Expo SDK 57, `expo-secure-store`, `@expo/vector-icons` |
| **Testing** | Custom Integration Test Suite covering Auth, Projects, Tasks, Authorization, and Cleanup |

```mermaid
flowchart TD
    subgraph Clients["Clients Layer"]
        WEB["React + Vite Web App\n(Port: 3000)"]
        MOB["React Native Expo Mobile App\n(Android / iOS / Expo Go)"]
    end

    subgraph BackendLayer["Unified Backend API Layer"]
        API["Node.js + Express REST API\n(Port: 5000)"]
        AUTH_MW["JWT Auth Middleware & Rate Limiter"]
        VAL["Zod Request Validation"]
        PRISMA["Prisma ORM 6.19.3"]
    end

    subgraph DataLayer["Persistence Layer"]
        MYSQL[("MySQL Database\nproject_management_system")]
    end

    WEB -->|"HTTP / REST (Bearer JWT)"| API
    MOB -->|"HTTP / REST (Secure Keystore JWT)"| API
    API --> AUTH_MW --> VAL --> PRISMA --> MYSQL
```

---

## 🗄️ Database Schema & ER Diagram

The database utilizes normalized relational tables with foreign keys and cascade deletions.

```mermaid
erDiagram
    USER ||--o{ PROJECT : "owns"
    USER ||--o{ TASK : "owns"
    PROJECT ||--o{ TASK : "contains"

    USER {
        int id PK "Auto Increment"
        string fullName "User's full name"
        string email UK "Unique email address"
        string passwordHash "Bcrypt hashed password"
        datetime createdAt "Timestamp"
        datetime updatedAt "Timestamp"
    }

    PROJECT {
        int id PK "Auto Increment"
        int userId FK "References User.id (CASCADE)"
        string name "Project Title"
        text description "Nullable project details"
        enum status "NOT_STARTED | IN_PROGRESS | COMPLETED"
        datetime startDate "Start date"
        datetime endDate "End date"
        datetime createdAt "Timestamp"
        datetime updatedAt "Timestamp"
    }

    TASK {
        int id PK "Auto Increment"
        int projectId FK "References Project.id (CASCADE)"
        int userId FK "References User.id (CASCADE)"
        string name "Task Title"
        text description "Nullable task details"
        enum priority "LOW | MEDIUM | HIGH"
        enum status "PENDING | IN_PROGRESS | COMPLETED"
        datetime dueDate "Due date"
        datetime createdAt "Timestamp"
        datetime updatedAt "Timestamp"
    }
```

---

## ✨ Features Implemented

### 1. User Authentication
- ✅ User Registration (`Full Name`, `Email`, `Password`).
- ✅ User Login with credentials verification.
- ✅ User Logout with local session revocation.
- ✅ Unique email constraints with user-friendly conflict messages (`409 Conflict`).
- ✅ Secure password hashing with `bcrypt` (10 salt rounds). Plaintext passwords are never saved.
- ✅ Persistent authentication across page reloads and app restarts.
- ✅ Cross-platform single account: register on Web, log in on Mobile (and vice-versa).
- ✅ Rate limiting on auth routes via `express-rate-limit` to prevent brute force.

### 2. Project Management
- ✅ Create new projects with name, description, status, start date, and end date.
- ✅ View project details including task completion metrics and progress bars.
- ✅ Edit existing projects with date validation (end date >= start date).
- ✅ Delete projects with cascade cleanup of associated tasks.
- ✅ Strict authorization: users can only view, modify, and delete their own projects.

### 3. Task Management
- ✅ Create tasks associated with projects owned by the user.
- ✅ Fields: Task Name, Description, Priority (`Low`, `Medium`, `High`), Status (`Pending`, `In Progress`, `Completed`), Due Date.
- ✅ Edit and delete tasks.
- ✅ One-tap status toggle ("Mark as Completed" / "Mark as Pending").
- ✅ Due date badges with automatic overdue indicators.

### 4. Interactive Dashboard
- ✅ Real-time user metrics:
  - **Total Projects**
  - **Total Tasks**
  - **Completed Tasks**
  - **Pending Tasks**
  - **Projects In Progress**
- ✅ Overall completion percentage progress bars.
- ✅ Recent projects feed & upcoming tasks with quick actions.

### 5. Search and Filtering
- ✅ Real-time project search by name.
- ✅ Filter projects by status (`Not Started`, `In Progress`, `Completed`).
- ✅ Real-time task search by name.
- ✅ Filter tasks by status (`Pending`, `In Progress`, `Completed`).
- ✅ Filter tasks by priority (`Low`, `Medium`, `High`).
- ✅ Filter tasks by specific project.

### 6. Mobile Application (React Native + Expo)
- ✅ Native UI optimized for mobile phone screens.
- ✅ Talks to the exact same REST API and MySQL database.
- ✅ **Hardware-backed Secure Token Storage**: Uses `expo-secure-store` (Android Keystore / iOS Keychain) instead of insecure plain local storage.
- ✅ **Pull-to-Refresh**: Native `RefreshControl` across Dashboard, Projects, and Tasks lists.
- ✅ **Offline & No Network Handling**: Detects unreachable server / no connection and displays a retry banner instead of crashing or showing a blank screen.
- ✅ **Session Expiration Handling**: Automatically detects 401 token expiration, clears secure credentials, and redirects to the login screen with an alert banner.
- ✅ **In-App Server URL Configuration**: Easily switch between local emulator (`10.0.2.2`), local Wi-Fi IP (`192.168.x.x`), or deployed server with built-in connection tester.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18 or higher recommended; developed on Node v24)
- **npm** (v9 or higher)
- **MySQL Server** (running locally on port 3306 or remote instance)

---

### Step 1: Backend Setup

1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Review or create the `.env` file (see `.env.example`):
   ```env
   DATABASE_URL="mysql://root:password@localhost:3306/project_management_system"
   PORT=5000
   JWT_SECRET=supersecret_project_management_jwt_key_2026_dev_pms
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=*
   ```

3. Ensure the MySQL database exists:
   ```sql
   CREATE DATABASE IF NOT EXISTS project_management_system;
   ```

4. Apply Prisma migrations and generate client:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. Run the integration test suite to verify everything:
   ```bash
   npm test
   ```

6. Start the backend development server:
   ```bash
   npm run dev
   # Server runs at http://localhost:5000
   ```

---

### Step 2: Web App Setup

1. Open a new terminal and navigate to the `web` folder:
   ```bash
   cd web
   ```

2. Review `.env` (configured to point to the backend):
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the Vite development server:
   ```bash
   npm run dev
   # Web app runs at http://localhost:3000
   ```

5. (Optional) Test production build:
   ```bash
   npm run build
   ```

---

### Step 3: Mobile App Setup (Expo)

1. Open a new terminal and navigate to the `mobile` folder:
   ```bash
   cd mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Expo development server:
   ```bash
   npx expo start
   ```

4. Running on device or emulator:
   - **Android Emulator**: Press `a` in the terminal to launch the app on your running Android Virtual Device (AVD).
   - **Physical Device**: Install the **Expo Go** app from the Google Play Store, then scan the QR code displayed in the terminal.
   - **Web Preview**: Press `w` to preview the mobile layout in your browser.

---

## 📱 How to Run Mobile Against Local or Deployed Backend

### 1. Android Emulator (Standard AVD)
Android emulators access your computer's `localhost` via the special IP **`10.0.2.2`**.
- Set the API URL to: `http://10.0.2.2:5000/api`
*(This is already set as the default on Android)*.

### 2. Physical Android Phone (Over Wi-Fi)
When testing on a physical phone using Expo Go:
1. Ensure both your computer and phone are connected to the same Wi-Fi network.
2. Find your computer's local IP address (e.g. `ipconfig` on Windows gives something like `192.168.1.15`).
3. Open the PMS Mobile App -> Tap **"Settings"** tab (or the Backend URL link on the login screen).
4. Enter: `http://192.168.1.15:5000/api`.
5. Tap **"Test & Save"** — the app will verify the connection and confirm healthy status!

### 3. Deployed Backend
If the backend is deployed (e.g. on Render, Railway, AWS, or Heroku):
1. Set the URL to your deployed endpoint: `https://your-api-domain.com/api`.
2. Save and proceed to log in with your credentials.

---

## 🔒 Security Highlights

1. **Password Hashing**: `bcrypt` with 10 salt rounds hashes all passwords before storage. Plaintext passwords never touch the database.
2. **Encrypted Token Storage on Mobile**: Stored using `expo-secure-store` which integrates directly with the **Android Keystore** and **iOS Keychain**.
3. **Data Isolation (Authorization)**: All queries to projects and tasks filter by `userId: req.user.id`. Users can never access or modify another user's records.
4. **Input Sanitization & Validation**: `zod` parses and validates every payload. Prevents invalid types, missing fields, empty strings, and out-of-order dates.
5. **SQL Injection Protection**: Prisma ORM executes parameterized queries under the hood, neutralizing SQL injection vectors.
6. **Rate Limiting**: `express-rate-limit` prevents brute-force credential stuffing on `/api/auth/register` and `/api/auth/login`.

---

## 🧪 Automated Testing

The backend includes an integration test suite located at `backend/tests/api.test.js`:

```bash
cd backend
npm test
```

### What is tested:
- `✓ Health endpoint returns 200 OK`
- `✓ User registration succeeds with JWT token`
- `✓ Duplicate registration rejected with 409 Conflict`
- `✓ User login succeeds with correct credentials`
- `✓ Invalid password rejected with 401 Unauthorized`
- `✓ GET /api/auth/me returns current user profile`
- `✓ Project creation succeeds`
- `✓ GET /api/projects/:id succeeds`
- `✓ Update project status succeeds`
- `✓ Task creation succeeds`
- `✓ Mark task as COMPLETED succeeds`
- `✓ Dashboard returns user-specific aggregated metrics`
- `✓ Cross-user project access forbidden (returns 404)`
- `✓ Cross-user task access forbidden (returns 404)`
- `✓ Task deletion succeeds`
- `✓ Project deletion succeeds`

---

## 📁 Repository Structure

```
project-management-system/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma         # MySQL Prisma database models (User, Project, Task)
│   │   └── migrations/           # Database migration history
│   ├── src/
│   │   ├── config/
│   │   │   └── prisma.js         # Prisma client instance
│   │   ├── controllers/
│   │   │   ├── auth.controller.js       # Register, login, logout, me
│   │   │   ├── project.controller.js    # Project CRUD with metrics
│   │   │   ├── task.controller.js       # Task CRUD with priority & status
│   │   │   └── dashboard.controller.js   # Dashboard aggregation stats
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js       # JWT bearer token verification
│   │   │   ├── validate.middleware.js   # Zod request validator
│   │   │   ├── rateLimiter.middleware.js# Auth rate limiter
│   │   │   └── error.middleware.js      # Global error and 404 handlers
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── project.routes.js
│   │   │   ├── task.routes.js
│   │   │   └── dashboard.routes.js
│   │   ├── validators/
│   │   │   ├── auth.validator.js
│   │   │   ├── project.validator.js
│   │   │   └── task.validator.js
│   │   └── app.js                # Express app setup and middleware
│   ├── tests/
│   │   └── api.test.js           # Integration test suite
│   ├── .env                      # Database & server configuration
│   ├── .env.example              # Template configuration
│   ├── package.json
│   └── server.js                 # HTTP server listener
│
├── web/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Responsive navigation header & drawer
│   │   │   ├── StatCard.jsx      # Metric cards with icons
│   │   │   ├── ProjectModal.jsx  # Create / edit project dialog
│   │   │   ├── TaskModal.jsx     # Create / edit task dialog
│   │   │   ├── ProjectDetailModal.jsx # Detail view with task checklist
│   │   │   ├── ConfirmDialog.jsx # Confirmation dialog
│   │   │   ├── AlertBanner.jsx   # Feedback alert banners
│   │   │   └── LoadingSpinner.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Web auth state & 401 listener
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx      # Login & register tabs
│   │   │   ├── DashboardPage.jsx # 5 metrics cards, progress, feeds
│   │   │   ├── ProjectsPage.jsx  # Search, filter, cards grid
│   │   │   └── TasksPage.jsx     # Search, priority/status filter, checklist
│   │   ├── services/
│   │   │   └── api.js            # Fetch wrapper with JWT headers
│   │   ├── App.jsx               # Tab router & global modal manager
│   │   └── index.css             # Design system
│   ├── vite.config.js            # Port 3000 & localhost:5000 proxy
│   ├── .env                      # Web API base URL
│   ├── .env.example
│   └── package.json
│
├── mobile/
│   ├── src/
│   │   ├── components/
│   │   │   ├── NetworkErrorBanner.js # Offline/unreachable banner with retry
│   │   │   ├── ProjectModal.js       # Native project modal
│   │   │   └── TaskModal.js          # Native task modal
│   │   ├── context/
│   │   │   └── AuthContext.js        # Mobile auth with SecureStore
│   │   ├── screens/
│   │   │   ├── AuthScreen.js         # Mobile login & register
│   │   │   ├── DashboardScreen.js    # Native dashboard with pull-to-refresh
│   │   │   ├── ProjectsScreen.js     # Native projects list & search
│   │   │   ├── ProjectDetailScreen.js# Project detail & tasks checklist
│   │   │   ├── TasksScreen.js        # Filterable tasks list
│   │   │   └── SettingsScreen.js     # Server URL config & test tool
│   │   └── services/
│   │       ├── api.js                # Mobile fetch wrapper with timeout & 401 handling
│   │       └── storage.js            # expo-secure-store hardware encryption
│   ├── App.js                        # Mobile bottom tab navigator
│   ├── app.json                      # Expo configuration & plugins
│   └── package.json
│
├── API_DOCUMENTATION.md              # Complete REST API reference
└── README.md                         # Main documentation
```