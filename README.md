# Online Examination Invigilation and Session Monitoring System

A comprehensive, full-stack MERN academic proctoring platform engineered with **React.js, Node.js, Express.js, MongoDB, Tailwind CSS, Socket.IO, Docker, and Kubernetes**.

The platform provides end-to-end examination lifecycle management, multi-role access control (**Admin, Exam Coordinator, Invigilator, Student**), distraction-free examination environments, real-time proctoring telemetry via WebSockets, security incident observation registers, and four mandatory institutional reports with CSV and PDF generation.

---

## Table of Contents
1. [Project Overview & Key Objectives](#1-project-overview--key-objectives)
2. [Technology Stack](#2-technology-stack)
3. [User Roles and Permissions Matrix](#3-user-roles-and-permissions-matrix)
4. [System Architecture Diagram](#4-system-architecture-diagram)
5. [Application Workflow Diagram](#5-application-workflow-diagram)
6. [Database Design & Data Models](#6-database-design--data-models)
7. [Implemented Functional Screens (16 Screens)](#7-implemented-functional-screens-16-screens)
8. [Mandatory Institutional Reports](#8-mandatory-institutional-reports)
9. [Real-Time Invigilation & Proctoring Telemetry](#9-real-time-invigilation--proctoring-telemetry)
10. [Backend RESTful API Reference](#10-backend-restful-api-reference)
11. [Installation & Local Setup Guide](#11-installation--local-setup-guide)
12. [Docker & Containerized Deployment](#12-docker--containerized-deployment)
13. [Kubernetes Orchestration & Ingress](#13-kubernetes-orchestration--ingress)
14. [Automated Test Suite & Verification Results](#14-automated-test-suite--verification-results)
15. [Default Academic Credentials](#15-default-academic-credentials)

---

## 1. Project Overview & Key Objectives

Traditional online examinations face major integrity challenges: uncontrolled tab switching, unauthorized peripheral devices, unrecorded disconnections, and delayed reporting. This system delivers a modern, transparent academic supervision solution:

- **Explicit Candidate Consent**: Camera permission status and proctoring rules are clearly communicated before any session begins; no covert recordings or intrusive facial recognition are run.
- **Real-Time Proctoring Telemetry**: WebSockets (`Socket.IO`) stream live heartbeat pings, tab switches, and fullscreen exits to invigilator consoles with zero page refreshes.
- **Observation-Based Security Registers**: Behavioral deviations are recorded as objective observations rather than automated misconduct accusations.
- **Accreditation-Ready Reporting**: Four formal reports exportable to CSV, styled PDFKit documents, or high-contrast print formats.

---

## 2. Technology Stack

### Frontend
- **Framework**: React.js 18 with Vite 6
- **Styling**: Tailwind CSS with custom academic navy palette
- **Routing**: React Router DOM v7
- **Network Client**: Axios with JWT Bearer request interceptors
- **Visualizations**: Recharts (Attendance and Turnout distribution bar & donut charts)
- **Icons**: Lucide React
- **Realtime Client**: Socket.IO Client

### Backend
- **Runtime**: Node.js v20+
- **Application Framework**: Express.js REST API
- **Authentication**: JSON Web Tokens (JWT) with HTTP-only headers and bcrypt password hashing
- **Realtime Gateway**: Socket.IO server with room isolation per examination
- **Database Layer**: MongoDB with Mongoose ODM (with automatic fallback to `mongodb-memory-server` for zero-configuration local runs)
- **Reporting Services**: PDFKit (custom academic document generator) & json2csv

### DevOps & Containerization
- **Containerization**: Docker (multi-stage Node + Nginx builds)
- **Local Composition**: Docker Compose
- **Orchestration**: Kubernetes manifests (Deployments, Services, ConfigMaps, Secrets, PVCs, Ingress)

---

## 3. User Roles and Permissions Matrix

| Feature / Resource | Administrator | Exam Coordinator | Invigilator | Student |
| :--- | :---: | :---: | :---: | :---: |
| **System Overview & Analytics** | Full Access | Department Scope | Session Scope | Personal View |
| **User Account CRUD & Roles** | Full Access | Read-Only | Denied | Denied |
| **Audit Activity Logs** | Full Access | Denied | Denied | Denied |
| **Create & Edit Examinations** | Allowed | Full Access | Denied | Denied |
| **Master Timetable Scheduling** | Allowed | Full Access | View Only | View Assigned |
| **Assign Students & Invigilators** | Allowed | Full Access | Denied | Denied |
| **Live Invigilation Console** | Full Access | Full Access | Full Access | Denied |
| **Log Proctoring Incidents** | Full Access | Full Access | Full Access | Denied |
| **Distraction-Free Exam Interface** | Denied | Denied | Denied | Full Access |
| **Session Summary Report** | Full Access (PDF/CSV) | Full Access (PDF/CSV) | Full Access (PDF/CSV) | Denied |
| **Attendance & Login Report** | Full Access (PDF/CSV) | Full Access (PDF/CSV) | Full Access (PDF/CSV) | Own Record |
| **Incident Register Report** | Full Access (PDF/CSV) | Full Access (PDF/CSV) | Full Access (PDF/CSV) | Denied |
| **Submission Status Report** | Full Access (PDF/CSV) | Full Access (PDF/CSV) | Full Access (PDF/CSV) | Confirmation |

---

## 4. System Architecture Diagram

```
                             +-----------------------------+
                             |    Candidate / Faculty      |
                             |   Web Browsers (React)      |
                             +--------------+--------------+
                                            |
                         HTTP REST API      |      WebSockets (Socket.IO)
                          Port 5000         |       Real-Time Events
                                            v
                             +-----------------------------+
                             |       Reverse Proxy         |
                             |    (Nginx / K8s Ingress)    |
                             +--------------+--------------+
                                            |
                                            v
                             +-----------------------------+
                             |     Express.js Backend      |
                             |  - Auth & RBAC Middleware   |
                             |  - Exam & Session Engine    |
                             |  - PDFKit & CSV Generators  |
                             |  - Socket.IO Gateway Rooms  |
                             +--------------+--------------+
                                            |
                                            v
                             +-----------------------------+
                             |        MongoDB 6.0          |
                             |  - Users    - Sessions      |
                             |  - Exams    - Attendance    |
                             |  - Answers  - AuditLogs     |
                             |  - Incidents                |
                             +-----------------------------+
```

---

## 5. Application Workflow Diagram

```
[Candidate Logs In]
        │
        ▼
[Student Dashboard: Review Assigned Exams]
        │
        ▼
[Opens Exam Interface] ──► [Explicit Proctoring Consent Modal]
                                  │
                                  ▼ (Agreed)
                   [Fullscreen Enforced & Webcam Status Logged]
                                  │
                                  ├──────────────────────────────┐
                                  ▼                              ▼
                     [MCQ Palette & Auto-Save]       [Live Invigilation Console]
                                  │                  - Heartbeat ping
                                  │                  - Tab switch alert
                                  │                  - Active candidate table
                                  ▼                              ▲
                     [Submit or Timer Expiration]                │
                                  │                              │
                                  ├──────────────────────────────┘
                                  ▼
                   [Automatic Evaluation & Score Hash]
                                  │
                                  ▼
                   [Official Exam Confirmation Voucher]
```

---

## 6. Database Design & Data Models

### 1. `Users`
- `name`: String, required
- `email`: String, required, unique
- `password`: String (bcrypt hashed)
- `role`: Enum (`'admin'`, `'coordinator'`, `'invigilator'`, `'student'`)
- `studentId`: String (unique institutional roll number)
- `department`: String
- `isActive`: Boolean

### 2. `Exams`
- `title`: String, required
- `description`: String
- `examDate`: Date
- `startTime`: String (e.g., `"09:00"`)
- `endTime`: String (e.g., `"11:00"`)
- `duration`: Number (minutes)
- `instructions`: Array of Strings
- `questions`: Array of MCQ objects (`questionText`, `options`, `correctOptionIndex`, `marks`)
- `assignedStudents`: Array of ObjectIds (`User`)
- `assignedInvigilators`: Array of ObjectIds (`User`)
- `status`: Enum (`'scheduled'`, `'ongoing'`, `'completed'`, `'cancelled'`)
- `totalMarks`: Number

### 3. `ExamSessions`
- `examId`: ObjectId (`Exam`)
- `studentId`: ObjectId (`User`)
- `loginTime`: Date
- `logoutTime`: Date
- `sessionStart`: Date
- `sessionEnd`: Date
- `status`: Enum (`'scheduled'`, `'in_progress'`, `'completed'`, `'disconnected'`, `'terminated'`)
- `lastActivity`: Date
- `webcamPermissionStatus`: Enum (`'granted'`, `'denied'`, `'prompt'`, `'not_required'`)
- `submittedAt`: Date
- `isAutoSubmitted`: Boolean
- `score`: Number
- `tabSwitchCount`: Number
- `fullscreenExitCount`: Number
- `networkStatus`: Enum (`'online'`, `'offline'`)

### 4. `Answers`
- `examId`: ObjectId (`Exam`)
- `studentId`: ObjectId (`User`)
- `questionId`: ObjectId
- `selectedAnswer`: Number / String
- `isMarkedForReview`: Boolean
- `savedAt`: Date

### 5. `Incidents`
- `incidentId`: String (e.g. `INC-1001`)
- `examId`: ObjectId (`Exam`)
- `studentId`: ObjectId (`User`)
- `invigilatorId`: ObjectId (`User`)
- `incidentType`: Enum (`'tab_switch'`, `'fullscreen_exit'`, `'multiple_disconnections'`, `'suspicious_activity'`, `'late_login'`, `'unauthorized_device'`, `'other'`)
- `severity`: Enum (`'low'`, `'medium'`, `'high'`)
- `description`: String
- `timestamp`: Date
- `status`: Enum (`'open'`, `'reviewed'`, `'resolved'`)
- `reportedBy`: String
- `comments`: Array of `{ author, comment, createdAt }`

### 6. `Attendance`
- `examId`: ObjectId (`Exam`)
- `studentId`: ObjectId (`User`)
- `loginTime`: Date
- `logoutTime`: Date
- `attendanceStatus`: Enum (`'present'`, `'absent'`, `'late'`)
- `durationMinutes`: Number

### 7. `AuditLogs`
- `userId`: ObjectId (`User`)
- `action`: String
- `description`: String
- `timestamp`: Date
- `ipAddress`: String

---

## 7. Implemented Functional Screens (16 Screens)

1. **Screen 1: Institutional Login Portal** (`/login`)
   - One-click demo role auto-fill buttons (Admin, Coordinator, Invigilator, Student).
   - Show/hide password, form validation, and password recovery modal.
2. **Screen 2: Central Admin Dashboard** (`/admin/dashboard`)
   - 8 System metrics, Recharts activity distribution and attendance pie charts, upcoming exams, recent incidents, and audit trails.
3. **Screen 3: User Management Directory** (`/admin/users`)
   - User table with role and status filtering, instant search, add account modal, edit modal, deactivate toggle, and pagination.
4. **Screen 4: Examination Curriculum & Papers** (`/coordinator/exams`)
   - Examination authoring tool with dynamic MCQ question builder, answer option markers, candidate rosters, and proctor assignments.
5. **Screen 5: Master Examination Timetable & Scheduling** (`/coordinator/scheduling`)
   - Calendar date picker, scheduled paper timeline, and automatic conflict detection for overlapping examination windows.
6. **Screen 6: Distraction-Free Student Examination Interface** (`/student/exam/:examId`)
   - Countdown timer, question palette with status indicators, MCQ selection with instant auto-save, mark for review, fullscreen enforcement, blur/tab-switch alert, and final submission confirmation.
7. **Screen 7: Live Invigilation & Proctoring Center** (`/invigilator/live`)
   - Real-time candidate table driven by Socket.IO, active counts (enrolled, present, absent, writing, submitted, disconnected), candidate telemetry modal, and quick incident reporting.
8. **Screen 8: Incident Management Register** (`/incidents`)
   - Filter by severity and case status, search bar, create incident modal, case detail drawer with invigilator comments thread.
9. **Screen 9: Attendance & Login Verification Report** (`/reports/attendance`)
   - Candidate login/logout timestamps, session durations, attendance percentages, CSV export, PDF download, and print view.
10. **Screen 10: Submission Status Verification Report** (`/reports/submissions`)
    - Submission timestamps, completion methods (automatic timer vs manual), time taken, evaluated scores, CSV and PDF exports.
11. **Screen 11: Examination Session Summary Report** (`/reports/exam-summary`)
    - Registered vs present vs completed turnout comparisons, Recharts comparison bars, CSV and PDF downloads.
12. **Screen 12: Official Incident Register Report** (`/reports/incidents`)
    - Structured incident observations, severity levels, candidate details, CSV export, PDF download, and print support.
13. **Screen 13: Student Candidate Dashboard** (`/student/dashboard`)
    - Enrolled examinations, active paper alerts with "Start Exam" buttons, completed history with scores, and attendance record.
14. **Screen 14: Invigilator Command Dashboard** (`/invigilator/dashboard`)
    - Assigned examination timetable, active candidate metrics, recent observation alerts, and direct shortcut to Live Proctoring.
15. **Screen 15: Coordinator Operations Dashboard** (`/coordinator/dashboard`)
    - Examination paper counts, timetable schedules, quick access to reports, and candidate enrollment statistics.
16. **Screen 16: Profile & Security Settings** (`/profile`)
    - Personal credential viewer, update name/department, change security password form, and account status indicators.

---

## 8. Mandatory Institutional Reports

All four required reports fetch real data directly from MongoDB and provide immediate **CSV Export**, **PDF Download**, and **Print Formatting**:

1. **Exam Session Summary Report**:
   - Examination details, total registered students, present students, absent students, completed submissions, pending submissions, total incidents, and start/end times.
2. **Attendance and Login Report**:
   - Candidate ID, name, institutional department, login time, logout time, attendance status (`PRESENT`, `ABSENT`, `LATE`), and duration in minutes.
3. **Official Incident Register**:
   - Incident ID, student details, examination title, incident category, severity rating (`LOW`, `MEDIUM`, `HIGH`), timestamp, observation description, and resolution status.
4. **Submission Status Verification Report**:
   - Candidate details, examination paper, submission status, completion timestamp, time taken, submission method (`Manual` vs `Automatic Timer Expiry`), and final score.

---

## 9. Real-Time Invigilation & Proctoring Telemetry

The system utilizes WebSockets through **Socket.IO** to ensure zero-latency synchronization:
- `join_exam`: Connects clients to isolated rooms (`exam_${examId}` and `invigilator_${examId}`).
- `session_started`: Invigilators immediately see candidate login events without page refreshes.
- `session_activity_update`: Streams tab switch occurrences, fullscreen exit events, and network status changes.
- `incident_recorded`: Automatically broadcasts logged observations to supervising faculty.
- `student_submitted`: Updates candidate status and score the moment a paper is submitted or time expires.

---

## 10. Backend RESTful API Reference

### Authentication
- `POST /api/auth/register` - Create academic account
- `POST /api/auth/login` - Authenticate with email/password and obtain JWT
- `GET /api/auth/me` - Retrieve current profile
- `POST /api/auth/logout` - Invalidate session & record audit log
- `PUT /api/auth/profile` - Update name and department
- `PUT /api/auth/change-password` - Update account password

### Users (Admin / Coordinator)
- `GET /api/users` - Paginated user directory with role & status filters
- `POST /api/users` - Administrator user creation
- `GET /api/users/:id` - User detail lookup
- `PUT /api/users/:id` - Edit user details & permissions
- `DELETE /api/users/:id` - Remove user account

### Examinations
- `GET /api/exams` - List assigned/available examinations (sanitizes answer keys for students)
- `POST /api/exams` - Author new examination paper
- `GET /api/exams/:id` - Retrieve examination details & question bank
- `PUT /api/exams/:id` - Update examination timings & question parameters
- `DELETE /api/exams/:id` - Delete examination and associated sessions
- `POST /api/exams/:id/assign-students` - Allocate candidates to exam
- `POST /api/exams/:id/assign-invigilators` - Assign faculty proctors

### Examination Sessions & Proctoring
- `POST /api/sessions/start` - Candidate commences exam; initializes session & attendance
- `GET /api/sessions` - Query live sessions (filtered by `examId` & `status`)
- `GET /api/sessions/:id` - Retrieve candidate telemetry details
- `PUT /api/sessions/:id/activity` - Report heartbeat, tab switch, or fullscreen exit
- `POST /api/sessions/:id/save-answer` - Auto-save / update question response
- `GET /api/sessions/:id/answers` - Load candidate's saved answers
- `POST /api/sessions/:id/submit` - Finalize exam paper & auto-compute score

### Incidents
- `POST /api/incidents` - Log proctoring observation
- `GET /api/incidents` - Filtered list of security incidents
- `GET /api/incidents/:id` - Retrieve incident details & comment history
- `PUT /api/incidents/:id` - Update status (`open`, `reviewed`, `resolved`) or append comment

### Reports Hub
- `GET /api/reports/exam-summary?format={json|csv|pdf}` - Exam session summary
- `GET /api/reports/attendance?format={json|csv|pdf}` - Attendance & login report
- `GET /api/reports/incidents?format={json|csv|pdf}` - Incident register
- `GET /api/reports/submissions?format={json|csv|pdf}` - Submission status report

### System
- `GET /api/health` - Service health check
- `GET /api/stats/overview` - Role-tailored dashboard telemetry
- `GET /api/audit-logs` - Administrative audit history

---

## 11. Installation & Local Setup Guide

### Prerequisites
- Node.js (v18 or v20+)
- npm (v9+)
- MongoDB (Optional; if local MongoDB is not running, the application automatically initializes an in-memory database instance!)

### Step 1: Clone or Navigate to Directory
```bash
cd "Desktop/Devops_project(1615)"
```

### Step 2: Backend Setup
```bash
cd backend
npm install
npm run seed     # Populates complete demo dataset with users, exams, and sessions
npm start        # Starts server on http://localhost:5000
```

### Step 3: Frontend Setup
Open a new terminal window:
```bash
cd "Desktop/Devops_project(1615)/frontend"
npm install
npm run dev      # Starts Vite dev server on http://localhost:5173
```

Navigate to `http://localhost:5173` in your browser.

---

## 12. Docker & Containerized Deployment

### Build & Run via Docker Compose
Ensure Docker Desktop is running:
```bash
# In the project root directory:
docker-compose up --build -d
```

### Container Endpoints:
- **Frontend Portal**: `http://localhost:3000`
- **Backend REST API**: `http://localhost:5000/api/health`
- **MongoDB**: `localhost:27017`

### Stop Containers
```bash
docker-compose down -v
```

---

## 13. Kubernetes Orchestration & Ingress

The application includes enterprise Kubernetes manifests in `/kubernetes`:

### Deploy to Kubernetes Cluster (Minikube / EKS / GKE)
```bash
# 1. Apply ConfigMaps and Secrets
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/secret.yaml

# 2. Deploy Persistent Storage & MongoDB
kubectl apply -f kubernetes/mongodb-pvc.yaml
kubectl apply -f kubernetes/mongodb-deployment.yaml
kubectl apply -f kubernetes/mongodb-service.yaml

# 3. Deploy Backend API
kubectl apply -f kubernetes/backend-deployment.yaml
kubectl apply -f kubernetes/backend-service.yaml

# 4. Deploy Frontend Application
kubectl apply -f kubernetes/frontend-deployment.yaml
kubectl apply -f kubernetes/frontend-service.yaml

# 5. Apply Ingress Controller Rules
kubectl apply -f kubernetes/ingress.yaml
```

### Verify Deployment Status
```bash
kubectl get pods
kubectl get services
kubectl get ingress
```

---

## 14. Automated Test Suite & Verification Results

The project features an automated backend integration test suite verifying authentication, RBAC authorization boundaries, exam integrity, answer hiding, browser monitoring, tab-switch incident generation, and all 4 report formats.

### Run Tests:
```bash
cd backend
npm test
```

### Verification Output:
```
======================================================
STARTING BACKEND API & INTEGRATION VERIFICATION TESTS
======================================================

[Database] In-memory MongoDB Connected successfully
[Seed] Database seeded successfully with full test dataset!

  [PASS] GET /api/health returns 200 OK
  [PASS] POST /api/auth/login (Admin) returns JWT token
  [PASS] POST /api/auth/login (Student) identifies role correctly
  [PASS] RBAC Security: Student blocked from Admin /api/users with 403 Forbidden
  [PASS] GET /api/users (Admin) retrieves user directory
  [PASS] GET /api/exams retrieves student assigned exams
  [PASS] Exam Integrity: Student questions payload correctly masks correctOptionIndex
  [PASS] POST /api/sessions/start initiates live exam session
  [PASS] POST /api/sessions/:id/save-answer saves answer response
  [PASS] Browser Monitoring: Tab switch detected and logged as security incident
  [PASS] POST /api/sessions/:id/submit finalizes exam session
  [PASS] GET /api/reports/exam-summary returns JSON metrics
  [PASS] GET /api/reports/exam-summary?format=csv exports valid CSV
  [PASS] GET /api/reports/attendance returns candidate attendance data
  [PASS] GET /api/reports/attendance?format=csv exports valid CSV
  [PASS] GET /api/reports/incidents returns incident register entries
  [PASS] GET /api/reports/incidents?format=csv exports valid CSV
  [PASS] GET /api/reports/submissions returns student submissions
  [PASS] GET /api/reports/submissions?format=csv exports valid CSV
  [PASS] GET /api/stats/overview compiles aggregated metrics

======================================================
TEST SUITE RESULTS: 20 PASSED, 0 FAILED
======================================================
```

---

## 15. Default Academic Credentials

| Role | Institutional Email | Password | Assigned ID | Description |
| :--- | :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@examportal.edu` | `Admin@123` | `ADM-001` | Full system control, user CRUD, audit logs |
| **Exam Coordinator** | `coordinator@examportal.edu` | `Coord@123` | `CRD-101` | Curriculum authoring, scheduling, reports |
| **Faculty Invigilator** | `invigilator@examportal.edu` | `Invig@123` | `INV-201` | Live proctoring console, incident registers |
| **Candidate Student** | `student@examportal.edu` | `Student@123` | `STU-1001` | Alex Mercer (Enrolled examinee) |
| **Candidate Student 2** | `priya.patel@examportal.edu` | `Student@123` | `STU-1002` | Priya Patel |
| **Candidate Student 3** | `rohit.sharma@examportal.edu` | `Student@123` | `STU-1003` | Rohit Sharma |

> **Evaluator Tip**: On the login page (`/login`), click any of the 4 quick demo buttons ("Admin", "Coordinator", "Invigilator", "Student") to auto-populate credentials instantly!
