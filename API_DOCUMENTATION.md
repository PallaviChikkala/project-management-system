# Project Management System (PMS) — API Documentation

This RESTful API serves both the Web application (React + Vite) and the Mobile application (React Native + Expo).

---

## 1. Overview & Base URL

- **Local Base URL**: `http://localhost:5000/api`
- **Android Emulator**: `http://10.0.2.2:5000/api`
- **Default Port**: `5000`
- **Content-Type**: `application/json`

---

## 2. Authentication & Security

- **JWT Authentication**: Pass the Bearer token in the `Authorization` header for all protected endpoints:
  ```http
  Authorization: Bearer <your_jwt_token>
  ```
- **Passwords**: Hashed with `bcrypt` (10 rounds). Plaintext passwords are never stored.
- **Data Isolation**: All queries enforce tenant isolation (`where: { userId: req.user.id }`), preventing cross-user data access.
- **Input Validation**: Handled strictly via **Zod** middleware on all incoming payloads.
- **Rate Limiting**: Protects `/api/auth/register` and `/api/auth/login` against brute force (50 requests / 15 minutes per IP).

---

## 3. Standard Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Detailed error message",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Common HTTP Status Codes
| Status | Meaning | Description |
|---|---|---|
| `200 OK` | Success | Request succeeded with data |
| `201 Created` | Resource Created | New record successfully inserted |
| `400 Bad Request` | Validation Error | Payload missing fields or invalid format |
| `401 Unauthorized` | Auth Required / Expired | Token missing, invalid, or expired |
| `404 Not Found` | Not Found | Resource does not exist or belongs to another user |
| `409 Conflict` | Unique Violation | Email address is already registered |
| `429 Too Many Requests` | Rate Limited | Exceeded rate limit on auth endpoints |
| `500 Internal Error` | Server Failure | Unexpected server error |

---

## 4. Endpoints Reference

### Health Check

#### `GET /api/health`
Verify server status and availability.
- **Auth**: None
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Project Management System API is healthy and operational",
  "timestamp": "2026-10-07T04:20:00.000Z"
}
```

---

### Authentication

#### `POST /api/auth/register`
Register a new user account. Works identically for both web and mobile.
- **Auth**: None (Rate limited)
- **Request Body**:
```json
{
  "fullName": "Alex Rivera",
  "email": "alex@example.com",
  "password": "password123"
}
```
- **Response**: `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully.",
  "user": {
    "id": 1,
    "fullName": "Alex Rivera",
    "email": "alex@example.com",
    "createdAt": "2026-10-07T04:20:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### `POST /api/auth/login`
Authenticate existing user and obtain JWT token.
- **Auth**: None (Rate limited)
- **Request Body**:
```json
{
  "email": "alex@example.com",
  "password": "password123"
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Logged in successfully.",
  "user": {
    "id": 1,
    "fullName": "Alex Rivera",
    "email": "alex@example.com",
    "createdAt": "2026-10-07T04:20:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### `POST /api/auth/logout`
Sign out user.
- **Auth**: Optional
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

#### `GET /api/auth/me`
Retrieve currently authenticated user profile.
- **Auth**: Required (`Bearer <token>`)
- **Response**: `200 OK`
```json
{
  "success": true,
  "user": {
    "id": 1,
    "fullName": "Alex Rivera",
    "email": "alex@example.com",
    "createdAt": "2026-10-07T04:20:00.000Z"
  }
}
```

---

### Dashboard

#### `GET /api/dashboard`
Returns aggregated analytics and metrics scoped strictly to the authenticated user.
- **Auth**: Required
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "totalProjects": 3,
    "totalTasks": 12,
    "completedTasks": 8,
    "pendingTasks": 4,
    "projectsInProgress": 2,
    "projectsNotStarted": 0,
    "projectsCompleted": 1,
    "tasksInProgress": 3,
    "taskCompletionRate": 67,
    "projectCompletionRate": 33,
    "priorityBreakdown": {
      "low": 2,
      "medium": 6,
      "high": 4
    },
    "recentProjects": [ ... ],
    "upcomingTasks": [ ... ]
  }
}
```

---

### Projects

#### `GET /api/projects`
List all projects owned by the user with task progress statistics.
- **Auth**: Required
- **Query Parameters**:
  - `search` (string, optional): Case-insensitive match on project name.
  - `status` (string, optional): Filter by `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`.
  - `sortBy` (string, optional): Field to sort by (`createdAt`, `name`, `startDate`, `endDate`). Default: `createdAt`.
  - `order` (string, optional): `asc` or `desc`. Default: `desc`.
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 1,
      "name": "Website Redesign",
      "description": "Modernize landing page and navigation",
      "status": "IN_PROGRESS",
      "startDate": "2026-10-07T00:00:00.000Z",
      "endDate": "2026-10-21T00:00:00.000Z",
      "createdAt": "2026-10-07T04:20:00.000Z",
      "updatedAt": "2026-10-07T04:20:00.000Z",
      "tasksCount": 2,
      "completedTasksCount": 1,
      "progressPercentage": 50
    }
  ]
}
```

#### `GET /api/projects/:id`
Get single project details and all tasks under it.
- **Auth**: Required
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 1,
    "name": "Website Redesign",
    "description": "Modernize landing page and navigation",
    "status": "IN_PROGRESS",
    "startDate": "2026-10-07T00:00:00.000Z",
    "endDate": "2026-10-21T00:00:00.000Z",
    "tasks": [
      {
        "id": 1,
        "projectId": 1,
        "userId": 1,
        "name": "Wireframe Homepage",
        "priority": "HIGH",
        "status": "COMPLETED",
        "dueDate": "2026-10-10T00:00:00.000Z"
      }
    ],
    "tasksCount": 1,
    "completedTasksCount": 1,
    "progressPercentage": 100
  }
}
```

#### `POST /api/projects`
Create a new project.
- **Auth**: Required
- **Request Body**:
```json
{
  "name": "Mobile App V1",
  "description": "Build mobile client in React Native",
  "status": "NOT_STARTED",
  "startDate": "2026-10-07T00:00:00.000Z",
  "endDate": "2026-11-07T00:00:00.000Z"
}
```
- **Response**: `201 Created`

#### `PUT /api/projects/:id`
Update an existing project.
- **Auth**: Required
- **Request Body** (all fields optional):
```json
{
  "name": "Mobile App V1.1",
  "status": "IN_PROGRESS"
}
```
- **Response**: `200 OK`

#### `DELETE /api/projects/:id`
Delete a project and its associated tasks (cascade delete).
- **Auth**: Required
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Project deleted successfully."
}
```

---

### Tasks

#### `GET /api/tasks`
List tasks for the authenticated user with search and filtering.
- **Auth**: Required
- **Query Parameters**:
  - `projectId` (integer, optional): Filter by project ID.
  - `search` (string, optional): Case-insensitive match on task name.
  - `status` (string, optional): Filter by `PENDING`, `IN_PROGRESS`, `COMPLETED`.
  - `priority` (string, optional): Filter by `LOW`, `MEDIUM`, `HIGH`.
  - `sortBy` (string, optional): `dueDate`, `createdAt`, `priority`, `name`. Default: `dueDate`.
  - `order` (string, optional): `asc` or `desc`. Default: `asc`.
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "projectId": 1,
      "userId": 1,
      "name": "Design Mockups",
      "description": "Figma screens for mobile app",
      "priority": "HIGH",
      "status": "IN_PROGRESS",
      "dueDate": "2026-10-12T00:00:00.000Z",
      "createdAt": "2026-10-07T04:20:00.000Z",
      "project": {
        "id": 1,
        "name": "Mobile App V1",
        "status": "IN_PROGRESS"
      }
    }
  ]
}
```

#### `GET /api/tasks/:id`
Retrieve a single task.
- **Auth**: Required
- **Response**: `200 OK`

#### `POST /api/tasks`
Create a new task under a project owned by the user.
- **Auth**: Required
- **Request Body**:
```json
{
  "projectId": 1,
  "name": "Implement JWT Auth",
  "description": "Use bcrypt and jsonwebtoken",
  "priority": "HIGH",
  "status": "PENDING",
  "dueDate": "2026-10-14T00:00:00.000Z"
}
```
- **Response**: `201 Created`

#### `PUT /api/tasks/:id`
Update an existing task (e.g. toggle status or change priority).
- **Auth**: Required
- **Request Body** (all fields optional):
```json
{
  "status": "COMPLETED"
}
```
- **Response**: `200 OK`

#### `DELETE /api/tasks/:id`
Delete a task.
- **Auth**: Required
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Task deleted successfully."
}
```
