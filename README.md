<div align="center">

# 🐾 Animal Rescue Network

### A Centralized Stray Animal Rescue & Crowdfunding Hub

[![React Vite](https://img.shields.io/badge/React_Vite-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)](https://react.dev/)
[![Node.js Express](https://img.shields.io/badge/Node.js_Express-%23339933.svg?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB_Atlas-%2347A248.svg?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Cron Jobs](https://img.shields.io/badge/Cron_Jobs-%23000000.svg?style=flat&logo=clockify&logoColor=white)](#-automated-background-jobs-cron)
[![Media Cloudinary](https://img.shields.io/badge/Media_Cloudinary-%233448C5.svg?style=flat&logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-%2338B2AC.svg?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vercel Frontend](https://img.shields.io/badge/Frontend-Vercel-%23000000.svg?style=flat&logo=vercel&logoColor=white)](https://animal-rescue-network-tau.vercel.app)
[![Render Backend](https://img.shields.io/badge/Backend-Render-%2346E3B7.svg?style=flat&logo=render&logoColor=white)](https://animal-rescue-network.onrender.com)

A modern, high-performance full-stack MERN platform. Connects everyday citizens, dedicated volunteers, generous donors, and platform administrators to streamline stray animal reporting, coordinate rescue operations, and raise funds for veterinary treatments.

[Live Deployments](#live-deployments) · [Features](#features) · [Roles & Permissions](#roles-permissions) · [Project Structure](#project-structure) · [Database Models](#database-models) · [API Endpoints](#api-endpoints)

</div>

---

<span id="live-deployments"></span>
## 🌐 Live Deployments

*   **Live Web Application (Frontend):** [https://animal-rescue-network-tau.vercel.app](https://animal-rescue-network-tau.vercel.app)
*   **Production API Server (Backend):** [https://animal-rescue-network.onrender.com](https://animal-rescue-network.onrender.com)

---

<span id="features"></span>
## ✨ Key Features

### 👥 Role-Based Access Control
Tailored dashboards and dashboards for **Citizens**, **Volunteers**, **Donors**, and **Admins** using Role-Based Access Control (RBAC).

### 🗺️ Geospatial Rescue Mapping
Reporters pin exact locations via an interactive Leaflet map. Volunteers can locate nearby distress incidents through 2D sphere geospatial queries.

### 🔄 Unified Rescue Request Lifecycle
Ensures smooth operations as rescue requests transition from `Pending Review` ➡️ `Approved` ➡️ `Claimed` ➡️ `In Progress` ➡️ `Completed` with proof uploads.

### 💰 Crowdfunding Campaigns
Automated donation management with goal progress trackers, individual payment entries, and expiry schedules.

### 🕒 Automated Background Jobs (Cron)
*   **Auto-Release Failsafe:** Reverts claimed rescues back to `Pending` if unresolved for 48 hours.
*   **Campaign Expiry:** Automatically closes campaigns when deadlines are met.

### 📜 Action Audit Logging
Detailed tracking of administrative operations (user role updates, campaign closures, rescue approvals/rejections) to ensure transparency.

### 🔐 Secure Authentication
JWT-based sessions stored in secure `HttpOnly` cookies, shielding the platform from XSS and CSRF.

---

<span id="roles-permissions"></span>
## 👥 Roles & Permissions Matrix

| Page / Feature | Citizen | Volunteer | Donor | Admin |
| :--- | :---: | :---: | :---: | :---: |
| **Home (`/`)** | ✅ | ✅ | ✅ | ✅ |
| **Dashboard (`/dashboard`)** | ✅ (My Reports) | ✅ (My Reports & Claims) | ✅ | ✅ |
| **Report a Rescue (`/report`)** | ✅ | ✅ | ✅ | ✅ |
| **View Rescue Board (`/rescues`)** | ✅ (Own Only) | ✅ (All Approved/Claimed) | ✅ | ❌ (Redirects to Admin) |
| **Rescue Details (`/rescues/:id`)** | ✅ | ✅ | ✅ | ❌ (Redirects to Admin) |
| **Claim a Rescue** | ❌ | ✅ | ❌ | ❌ |
| **Update Rescue Status** | ❌ | ✅ (Assigned Only) | ❌ | ✅ |
| **Donation Portal (`/donate`)** | ✅ | ✅ | ✅ | ❌ (Redirects to Admin) |
| **Make a Donation (`/donate/:id`)** | ✅ | ✅ | ✅ | ❌ (Redirects to Admin) |
| **Admin Panel (`/admin`)** | ❌ | ❌ | ❌ | ✅ |

---

<span id="project-structure"></span>
## 📂 Project Structure

```text
Animal_Rescue/
├── backend/
│   ├── config/             # DB connection, Cloudinary setup, and constants
│   ├── controllers/        # Business logic handlers
│   ├── jobs/               # Background cron tasks (autoRelease, campaignExpiry)
│   ├── middleware/         # Auth verify, role guards, and multer file uploads
│   ├── models/             # Mongoose schemas
│   ├── routes/             # Express API routers
│   ├── seed/               # Admin seed and migration scripts
│   ├── services/           # Nodemailer email & notification builders
│   └── server.js           # Server runner and job manager
│
└── frontend/
    ├── public/             # Static public assets
    └── src/
        ├── components/     # UI elements (Navbar, Footer, Maps, Recharts Analytics, Cards)
        ├── context/        # Global React contexts (AuthContext)
        ├── pages/          # Page layouts (Dashboard, AdminPanel, Detail pages, Login, Register)
        ├── App.jsx         # App router & Route guards (ProtectedRoute, AdminRestrictedRoute)
        ├── index.css       # Core styling & Tailwind imports
        └── main.jsx        # React bootstrapper & Axios default configs
```

---

<span id="database-models"></span>
## 🗄️ Database Models (backend/models/)

### 👤 User (`User.js`)
*   `name` (String, required): Full name.
*   `email` (String, required, unique, lowercase): Account email.
*   `phone` (String, required): Active phone number.
*   `password` (String, required, minlength: 6): Hashed credential.
*   `role` (String, enum: `['citizen', 'volunteer', 'admin']`, default: `'citizen'`).
*   `isAvailable` (Boolean, default: `true`): Volunteer availability flag.
*   `rating` (Number, default: `0`): Overall volunteer rescue rating (0 to 5).
*   `ratingCount` (Number, default: `0`): Count of ratings received.
*   `resetPasswordToken` (String) & `resetPasswordExpiry` (Date).

### 🐕 RescueRequest (`RescueRequest.js`)
*   `reporter` (ObjectId, ref: `User`, required): Submitting user.
*   `animalType` (String, required): E.g., Dog, Cat, Bird.
*   `description` (String, required): Health condition and comments.
*   `location` (Object): Address (String), lat (Number), lng (Number).
*   `photos` (Array of Strings): Uploaded incident proof image URLs.
*   `status` (String, enum: `['Pending Review', 'Approved', 'Rejected', 'Claimed', 'In Progress', 'Completed']`, default: `'Pending Review'`).
*   `rejectionReason` (String): Stored if rejected by Admin.
*   `volunteer` (ObjectId, ref: `User`, default: null): Assigned rescuer.
*   `completionPhoto` (String): Proof image uploaded on rescue resolution.
*   `geoLocation` (Object): Geospatial coordinates `[lng, lat]` for distance-based queries.
*   `ratedByReporter` (Boolean, default: `false`).

### 💰 Donation (`Donation.js`)
*   `title` (String, required): Campaign title.
*   `description` (String, required): Goal description.
*   `animal` (String, required): Subject animal type.
*   `rescueRequest` (ObjectId, ref: `RescueRequest`): Optional linked rescue.
*   `targetAmount` (Number, required): Goal target amount.
*   `collectedAmount` (Number, default: `0`): Sum of contributions.
*   `createdBy` (ObjectId, ref: `User`, required): Admin creator ID.
*   `isActive` (Boolean, default: `true`).
*   `deadline` (Date, required): Campaign deadline.
*   `closedReason` (String, enum: `['completed', 'deadline_reached', 'admin_closed', null]`, default: `null`).

### 💳 DonationEntry (`DonationEntry.js`)
*   `campaignId` (ObjectId, ref: `Donation`, required).
*   `donorName` (String, required): Contributor's display name.
*   `email` (String) & `phone` (String).
*   `amount` (Number, required, min: 1): Contribution sum.
*   `message` (String): Message of support.
*   `isAnonymous` (Boolean, default: `false`).
*   `donatedAt` (Date, default: `Date.now`).

### 🔔 Notification (`Notification.js`)
*   `userId` (ObjectId, ref: `User`, required): Target recipient.
*   `type` (String, required): System trigger classification.
*   `message` (String, required): Context content.
*   `isRead` (Boolean, default: `false`).

### 📜 AuditLog (`AuditLog.js`)
*   `adminId` (ObjectId, ref: `User`, required): Initiating Admin ID.
*   `action` (String, required): Target modification action.
*   `targetId` (ObjectId, refPath: `targetModel`): Target document.
*   `targetModel` (String, enum: `['User', 'RescueRequest', 'Donation']`).
*   `targetLabel` (String): Human-friendly name of target object.
*   `oldValue` (String) & `newValue` (String): Change details.
*   `ip` (String): Creator's IP address.

---

<span id="api-endpoints"></span>
## 🔌 API Routes & Controllers (backend/)

All route paths prefix with `/api`.

### 🌐 Public API Routes (No Auth Required)
These endpoints are accessible to anonymous site visitors (e.g. registration, logins, browsing campaigns).

| Endpoint | Method | Controller ➡️ Method | Description |
| :--- | :---: | :--- | :--- |
| `/api/auth/register` | `POST` | `authController.js` ➡️ `registerUser` | Register a new user |
| `/api/auth/login` | `POST` | `authController.js` ➡️ `loginUser` | Log in and receive secure session cookie |
| `/api/auth/logout` | `POST` | `authController.js` ➡️ `logoutUser` | Clear active cookie session |
| `/api/auth/forgot-password` | `POST` | `authController.js` ➡️ `forgotPassword` | Request password reset token email |
| `/api/auth/reset-password/:token`| `POST` | `authController.js` ➡️ `resetPassword` | Complete password reset via token |
| `/api/donation` | `GET` | `donationController.js` ➡️ `getDonations` | Browse active donation campaigns |
| `/api/donation/:id` | `GET` | `donationController.js` ➡️ `getDonationById`| Fetch detailed campaign page and donors list |
| `/api/donation/:id/donate` | `POST` | `donationController.js` ➡️ `makeDonation` | Donate to a campaign (Rate limited) |

### 👤 Citizen / Authenticated User Routes (Requires Login)
Accessible by any logged-in user (Citizen, Volunteer, or Admin).

| Endpoint | Method | Controller ➡️ Method | Description |
| :--- | :---: | :--- | :--- |
| `/api/auth/me` | `GET` | `authController.js` ➡️ `getMe` | Retrieve logged-in user profile details |
| `/api/rescue` | `GET` | `rescueController.js` ➡️ `getRescueRequests` | Fetch approved rescue requests |
| `/api/rescue/my` | `GET` | `rescueController.js` ➡️ `getMyRescues` | Fetch rescue requests reported by this user |
| `/api/rescue/nearby` | `GET` | `rescueController.js` ➡️ `getNearbyRescues` | Find nearby rescues within radius |
| `/api/rescue/:id` | `GET` | `rescueController.js` ➡️ `getRescueById` | Get details of a single rescue case |
| `/api/rescue` | `POST` | `rescueController.js` ➡️ `createRescueRequest`| Submit a new rescue request (up to 3 photos) |
| `/api/rescue/:id/status` | `PUT` | `rescueController.js` ➡️ `updateRescueStatus`| Update rescue request status progress |
| `/api/rescue/:id/rate` | `POST` | `rescueController.js` ➡️ `rateVolunteer` | Rate volunteer (reporter only, single entry) |
| `/api/notifications` | `GET` | `notificationController.js` ➡️ `getMyNotifications` | Get list of user notifications |
| `/api/notifications/read-all`| `PATCH`| `notificationController.js` ➡️ `markAllRead` | Mark all notifications read |
| `/api/notifications/:id/read`| `PATCH`| `notificationController.js` ➡️ `markOneRead` | Mark single notification as read |

### 🏃‍♂️ Volunteer Routes (Requires Volunteer/Admin Role)
Only accessible to users with `'volunteer'` or `'admin'` roles.

| Endpoint | Method | Controller ➡️ Method | Description |
| :--- | :---: | :--- | :--- |
| `/api/rescue/claimed` | `GET` | `rescueController.js` ➡️ `getClaimedRescues`| Fetch rescue requests claimed by volunteer |
| `/api/rescue/:id/claim` | `PUT` | `rescueController.js` ➡️ `claimRescue` | Claim a pending approved rescue request |
| `/api/volunteer/stats` | `GET` | `volunteerController.js` ➡️ `getVolunteerStats`| Fetch rescue stats and ratings |
| `/api/volunteer/availability` | `PATCH`| `volunteerController.js` ➡️ `toggleAvailability`| Toggle active availability status |

### 👑 Admin Routes (Requires Admin Privileges)
Restricted exclusively to users with `'admin'` role.

| Endpoint | Method | Controller ➡️ Method | Description |
| :--- | :---: | :--- | :--- |
| `/api/admin/users` | `GET` | `adminController.js` ➡️ `getAllUsers` | Fetch list of all registered users |
| `/api/admin/users/:id/role`| `PUT` | `adminController.js` ➡️ `updateUserRole` | Update user roles (Citizen/Volunteer/Admin) (Audited) |
| `/api/admin/rescue` | `GET` | `adminController.js` ➡️ `getAllRescues` | View all rescues globally |
| `/api/admin/rescue/:id/approve`| `PUT`| `adminController.js` ➡️ `approveRescue` | Approve a submitted rescue request (Audited) |
| `/api/admin/rescue/:id/reject`| `PATCH`| `adminController.js` ➡️ `rejectRescue` | Reject a submitted rescue request (Audited) |
| `/api/admin/rescue/:id` | `DELETE`| `adminController.js` ➡️ `deleteRescue` | Delete a rescue request permanently (Audited) |
| `/api/admin/rescues/export`| `GET` | `analyticsController.js` ➡️ `exportRescuesCSV`| Export rescues to CSV format |
| `/api/admin/donations` | `GET` | `adminController.js` ➡️ `getAllDonations` | Retrieve all donation campaigns |
| `/api/admin/campaigns/:id/close`| `PATCH`| `adminController.js` ➡️ `closeCampaign` | Terminate campaign manually (Audited) |
| `/api/admin/donations/export`| `GET` | `analyticsController.js` ➡️ `exportDonationsCSV`| Export donation transactions to CSV format |
| `/api/admin/analytics/overview`| `GET`| `analyticsController.js` ➡️ `getOverview` | Get general system stats and totals |
| `/api/admin/analytics/rescues-by-month`| `GET`| `analyticsController.js` ➡️ `getRescuesByMonth`| Monthly rescue request distribution metrics |
| `/api/admin/analytics/donations-by-campaign`| `GET`| `analyticsController.js` ➡️ `getDonationsByCampaign`| Campaign target progress values |
| `/api/admin/audit-logs` | `GET` | `adminController.js` ➡️ `getAuditLogs` | Retrieve platform operations audit history |
| `/api/donation` | `POST` | `donationController.js` ➡️ `createDonation`| Create a new donation campaign |
| `/api/donation/entry/:id` | `DELETE`| `donationController.js` ➡️ `deleteDonationEntry`| Delete specific donation transaction record |

---

## 🎨 Frontend Architecture (frontend/)

### State Management Contexts
*   **AuthContext (`AuthContext.jsx`):** Manages user session state (`user`), boot validations (`loading`), credentials submissions, and HTTP-only cookie clearing actions.

### Pages & Views
*   **Home (`Home.jsx`):** Public landing page showcasing summary counts, urgent donation campaigns, testimonials, and about sections.
*   **Auth Gates:** `Login.jsx`, `Register.jsx`, `ForgotPasswordPage.jsx`, and `ResetPasswordPage.jsx` coordinate password validation and reset sequences.
*   **Dashboard (`Dashboard.jsx`):** Personalized user screen. Citizens view reported cases; volunteers toggle availability and check assigned/completed claims.
*   **ReportRescue (`ReportRescue.jsx`):** Form for reporting rescues. Features Leaflet map controls for coordinate picking.
*   **Rescue Board & Details:** `RescueRequests.jsx` lists cases (with list/grid toggle and map layout). `RescueDetail.jsx` manages actions like claims, status adjustments, and volunteer rating.
*   **Donations Portal & Details:** `DonationPortal.jsx` lists fundraising campaigns. `DonationDetail.jsx` accepts contributions and shows payment records.
*   **AdminPanel (`AdminPanel.jsx`):** Admin control room. Integrates submenus for users, reviews, donation launches, Recharts analytics boards, and Audit log tracking.

### Reusable UI Components
*   **Navbar (`Navbar.jsx`):** Scroll-responsive layout with role-based links and notification indicators.
*   **Footer (`Footer.jsx`):** Context footer.
*   **LocationPicker (`LocationPicker.jsx`):** Interactive map pin dropper.
*   **RescueMapView (`RescueMapView.jsx`):** Renders all rescue status indicators across Leaflet maps.
*   **NotificationBell (`NotificationBell.jsx`):** Access portal to system notifications.
*   **AnalyticsDashboard (`AnalyticsDashboard.jsx`):** Chart dashboards using Recharts components.

---

## ⚙️ Setup & Installation

### 1. Prerequisites
*   Node.js (v18+)
*   MongoDB Atlas Cluster (or local instance)
*   Cloudinary Account

### 2. Backend Config
1. Move to backend directory:
   ```bash
   cd backend
   ```
2. Create a `.env` file with:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/animal_rescue
   JWT_SECRET=your_jwt_signing_key_here
   FRONTEND_URL=http://localhost:5173
   
   # Cloudinary Setup
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   
   # SMTP Email
   EMAIL_HOST=smtp.mailtrap.io
   EMAIL_PORT=2525
   EMAIL_USER=your_smtp_username
   EMAIL_PASS=your_smtp_password
   EMAIL_FROM=noreply@animalrescue.com
   ```
3. Install modules:
   ```bash
   npm install
   ```
4. Seed default Admin account:
   ```bash
   node seed/createAdmin.js
   ```
   *Admin Credentials:*
   *   **Email:** `admin@animalrescue.com`
   *   **Password:** `Admin@1234`

### 3. Frontend Config
1. Move to frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```

---

## 🏃 Running the Application

### Start Backend Development Server
```bash
cd backend
npm run dev
```
Accessible at `http://localhost:5000`.

### Start Frontend Client
```bash
cd frontend
npm run dev
```
Accessible at `http://localhost:5173`.

---

## 🌐 Deployment Details

The production environments are deployed and configured as follows:

### ⚡ Frontend (Vercel)
*   **Deployment URL:** [https://animal-rescue-network-tau.vercel.app](https://animal-rescue-network-tau.vercel.app)
*   **Platform:** [Vercel](https://vercel.com)
*   **Notes:** Automatically builds from the `main` branch. Utilizes the `VITE_API_URL` environment variable pointing to the Render backend service.

### ⚙️ Backend (Render)
*   **Deployment URL:** [https://animal-rescue-network.onrender.com](https://animal-rescue-network.onrender.com)
*   **Platform:** [Render](https://render.com)
*   **Database:** Configured to connect to a production MongoDB Atlas cluster.
*   **Notes:** Environment variables (`MONGO_URI`, `JWT_SECRET`, `CLOUDINARY_*`, `EMAIL_*`) are securely managed within the Render dashboard settings.

