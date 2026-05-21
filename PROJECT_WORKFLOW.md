# Animal Rescue Network – Full Project Workflow & Architecture

The **Animal Rescue Network** is a full-stack MERN application designed to streamline the process of reporting, rescuing, and rehabilitating stray animals in distress. It acts as a centralized hub connecting everyday citizens, dedicated volunteers, generous donors, and platform administrators.

---

## 1. System Roles & Responsibilities

The platform implements Role-Based Access Control (RBAC) with four distinct user types:

### 👤 Citizen
- **Purpose:** The frontline observers who spot animals in distress.
- **Responsibilities & Features:**
  - Create accounts and log in securely.
  - Submit "Rescue Requests" with details (location, urgency, photos).
  - Track the status of their reported rescues.
  - View ongoing donation campaigns and contribute funds.
  - **Cannot:** Claim rescues or access administrative panels.

### 🏃‍♂️ Volunteer
- **Purpose:** The operational workforce who physically respond to rescue requests.
- **Responsibilities & Features:**
  - View all active "Pending" rescue requests in their area.
  - **Claim** a rescue request to signal they are en route (preventing duplicate efforts).
  - Update the status of a claimed rescue to "Resolved" once the animal is safe.
  - Toggle their active availability status.
  - Are subject to a 48-hour timeout: if a claimed rescue isn't resolved within 48 hours, an automated system releases it back to the pool.

### 💖 Donor
- **Purpose:** Users specifically focused on funding medical treatments and rehabilitation.
- **Responsibilities & Features:**
  - Browse active urgent "Donation Campaigns".
  - Track funding progress (Amount Raised vs. Target).
  - Submit donations to specific campaigns.

### 👑 Admin
- **Purpose:** The overseers of the entire platform operations.
- **Responsibilities & Features:**
  - Full access to the Admin Dashboard.
  - Manage all users (promote/demote volunteers).
  - Create, edit, and manually close Donation Campaigns.
  - Monitor all rescue requests globally.
  - Delete fraudulent or spam reports.

---

## 2. Core Workflows

### 🔄 The Rescue Lifecycle
1. **Reporting:** A Citizen spots an injured dog and submits a Rescue Request (`/report`). They upload a photo (handled via Cloudinary) and provide the location.
2. **Broadcasting:** The request enters the system with a `Pending` status.
3. **Claiming:** A Volunteer checks the Rescue Board (`/rescues`), sees the urgent request, and clicks "Claim". The status changes to `Claimed`.
4. **Resolution:** The Volunteer secures the animal and takes it to a vet. They update the request to `Resolved`.
5. **Failsafe (Cron Job):** If the Volunteer forgets or fails to respond within 48 hours, the `autoRelease` background job automatically reverts the status back to `Pending` so someone else can help.

### 💰 The Donation Lifecycle
1. **Creation:** An Admin identifies a rescued animal that requires expensive surgery and creates a Donation Campaign.
2. **Display:** The campaign appears on the Home page and Donation Portal (`/donate`) with a progress bar and deadline.
3. **Funding:** Citizens/Donors contribute. The progress bar visually updates in real-time.
4. **Completion:** The campaign automatically closes when the funding target is hit, OR when the deadline passes (via the `campaignExpiry` cron job), OR if the Admin manually closes it.

### 🔐 Authentication Flow
- **Registration/Login:** Users authenticate via email/password. Passwords are encrypted using `bcryptjs`.
- **Session Management:** The backend issues a JWT (JSON Web Token) securely embedded inside an `httpOnly` cookie. This completely protects the app from Cross-Site Scripting (XSS) attacks.
- **Password Recovery:** Users can request a password reset. A secure, hashed token is generated and emailed to them via Nodemailer, valid for 10 minutes.

---

## 3. Codebase Structure & File Purposes

### 🖥️ Backend (Node.js + Express + MongoDB)

#### Core Configuration
- `server.js`: The entry point. Initializes Express, connects to MongoDB, sets up CORS/Cookie-Parser, configures rate limiters, mounts all routes, and starts the background cron jobs.
- `config/db.js`: Handles the Mongoose connection to the MongoDB Atlas cluster.
- `.env`: Stores secret keys (JWT_SECRET, MONGO_URI, Cloudinary keys, Email credentials).

#### Models (Database Schema)
- `models/User.js`: Schema for users. Includes pre-save hooks for password hashing and fields for password reset tokens.
- `models/Rescue.js`: Schema for rescue requests (animal type, location, status, reporter ID, volunteer ID).
- `models/Donation.js`: Schema for funding campaigns (target amount, collected amount, deadline, active status).

#### Controllers (Business Logic)
- `controllers/authController.js`: Handles login, registration, password resets, and logout (cookie management).
- `controllers/rescueController.js`: Logic for creating rescues, fetching lists, claiming, and resolving.
- `controllers/adminController.js`: Logic strictly restricted to admins (managing campaigns, users).

#### Routes (API Endpoints)
- `routes/auth.js`: `POST /api/auth/login`, `POST /api/auth/logout`, etc.
- `routes/rescue.js`: `GET /api/rescue`, `POST /api/rescue/claim/:id`.
- `routes/admin.js`: Protected routes wrapped in the `adminOnly` middleware.

#### Middleware & Services
- `middleware/auth.js`: The `protect` middleware that reads the `httpOnly` cookie, verifies the JWT, and attaches the user to the request. Also contains `adminOnly` and `volunteerOrAdmin` role guards.
- `services/emailService.js`: Nodemailer setup used to dispatch password reset emails.
- `jobs/autoRelease.js` & `jobs/campaignExpiry.js`: Background node-cron tasks running on schedules to maintain data integrity.

---

### 🎨 Frontend (React + Vite + Tailwind CSS)

#### Core Configuration
- `main.jsx`: Renders the React tree and globally configures Axios (`axios.defaults.withCredentials = true`) to allow cookies.
- `App.jsx`: The router. Maps URLs to specific Pages and wraps protected routes in authentication guards.

#### State Management
- `context/AuthContext.jsx`: Manages the global user state. On app load, it hits `/api/auth/me` to automatically restore the session via cookies. Provides `login` and `logout` functions to all components.

#### Pages (Views)
- `pages/Home.jsx`: The landing page with a hero banner, live statistics, active urgent campaigns, and testimonials.
- `pages/Dashboard.jsx`: The citizen/volunteer hub to view their specific reported or claimed rescues.
- `pages/AdminPanel.jsx`: A comprehensive dashboard for admins to oversee users, rescues, and campaigns.
- `pages/RescueRequests.jsx` & `RescueDetail.jsx`: The public board where users view all pending requests.
- `pages/DonationPortal.jsx` & `DonationDetail.jsx`: The interface for viewing and contributing to active medical funds.
- `pages/Login.jsx`, `Register.jsx`, `ForgotPasswordPage.jsx`: Authentication interfaces.

#### Components (Reusable UI)
- `components/Navbar.jsx`: The main navigation header. Features dynamic rendering (showing different links based on if the user is an admin, volunteer, or guest) and dynamic styling based on scroll position.
- `components/LocationPicker.jsx`: Interface for selecting locations for rescues.
- `components/NotificationBell.jsx`: UI for checking system alerts.
