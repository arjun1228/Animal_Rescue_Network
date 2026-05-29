# 🐾 Animal Rescue Network

The **Animal Rescue Network** is a full-stack MERN application designed to streamline the reporting, rescuing, and rehabilitation of stray animals in distress. By connecting everyday citizens, dedicated volunteers, generous donors, and platform administrators, it creates a centralized hub to coordinate rescue missions, raise funds for medical treatments, and track activities transparently.

---

## 🚀 Key Features

*   **Role-Based Access Control (RBAC):** Tailored dashboards and interfaces for Citizens, Volunteers, Donors, and Admins.
*   **Geospatial Rescue Mapping:** Allows citizens to pinpoint rescue locations using an interactive map, and volunteers to find nearby incidents via 2D sphere coordinates.
*   **Real-time Operations & Status Tracking:** Real-time updates as rescue requests transition from `Pending Review` → `Approved` → `Claimed` → `In Progress` → `Completed`.
*   **Crowdfunding & Campaigns:** Automated donation management with goal progress trackers, payment entries, and expiry dates.
*   **Automated Background Jobs (Cron):**
    *   **Auto-Release Failsafe:** Resets claimed rescues back to `Pending` if left unresolved for 48 hours.
    *   **Campaign Expiry:** Closes inactive or timed-out donation campaigns.
*   **System Audit Logging:** Comprehensive auditing of admin operations (role updates, campaign closure, rescue approval/rejection) for transparency.
*   **Secure Authentication:** JWT-based session state stored inside secure `HttpOnly` cookies, preventing XSS and CSRF.

---

## 👥 Roles & Permissions Matrix

The platform implements strict access controls:

| Page / Feature | Citizen | Volunteer | Donor | Admin |
| :--- | :---: | :---: | :---: | :---: |
| **Home (`/`)** | ✅ | ✅ | ✅ | ✅ |
| **Dashboard (`/dashboard`)** | ✅ (My Reports) | ✅ (My Reports & Claims) | ✅ | ✅ |
| **Report a Rescue (`/report`)** | ✅ | ✅ | ✅ | ✅ |
| **View Rescue Board (`/rescues`)** | ✅ (Own Only) | ✅ (All Approved / Claimed) | ✅ | ❌ (Redirects to Admin) |
| **Rescue Details (`/rescues/:id`)** | ✅ | ✅ | ✅ | ❌ (Redirects to Admin) |
| **Claim a Rescue** | ❌ | ✅ | ❌ | ❌ |
| **Update Rescue Status** | ❌ | ✅ (Assigned Only) | ❌ | ✅ |
| **Donation Portal (`/donate`)** | ✅ | ✅ | ✅ | ❌ (Redirects to Admin) |
| **Make a Donation (`/donate/:id`)** | ✅ | ✅ | ✅ | ❌ (Redirects to Admin) |
| **Admin Panel (`/admin`)** | ❌ | ❌ | ❌ | ✅ |

---

## 📂 Project Structure

```text
Animal_Rescue/
├── backend/
│   ├── config/             # DB connection, Cloudinary, and constants
│   ├── controllers/        # Business logic controllers
│   ├── jobs/               # cron background tasks (autoRelease, campaignExpiry)
│   ├── middleware/         # Auth verify, RBAC guards, multer image upload
│   ├── models/             # Mongoose database schemas
│   ├── routes/             # Express API routing endpoints
│   ├── seed/               # Initial admin account seed and migration scripts
│   ├── services/           # Nodemailer emails & notification dispatchers
│   └── server.js           # Express app setup and job bootstrapper
│
└── frontend/
    ├── public/             # Static public assets
    └── src/
        ├── components/     # Reusable UI components (Navbar, Footer, Maps, Analytics, Cards)
        ├── context/        # Global auth context (AuthContext)
        ├── pages/          # Page views (Dashboard, Admin, Detail pages, Login, Register)
        ├── App.jsx         # Routes setup & Route Guards (ProtectedRoute, AdminRestrictedRoute)
        ├── index.css       # Tailwind configuration imports
        └── main.jsx        # App bootstrap, Axios default settings withCredentials
```

---

## 🗄️ Database Models (backend/models/)

### 1. User (`User.js`)
Stores account credentials, profile details, and role assignments.
*   `name` (String, required): Full name.
*   `email` (String, required, unique, lowercase): Email address.
*   `phone` (String, required): Mobile number.
*   `password` (String, required, minlength: 6): Hashed password.
*   `role` (String, enum: `['citizen', 'volunteer', 'admin']`, default: `'citizen'`): Defines access level.
*   `isAvailable` (Boolean, default: `true`): Volunteer availability toggle.
*   `rating` (Number, default: `0`): Aggregated volunteer rescue rating (0–5).
*   `ratingCount` (Number, default: `0`): Total ratings received.
*   `resetPasswordToken` (String) / `resetPasswordExpiry` (Date): Fields for password reset lifecycle.
*   *Hooks:* Pre-save bcrypt hashing for password modifications.

### 2. RescueRequest (`RescueRequest.js`)
Tracks the status of animals reported for rescue.
*   `reporter` (ObjectId, ref: `User`, required): The user who submitted the request.
*   `animalType` (String, required): E.g., Dog, Cat, Bird, etc.
*   `description` (String, required): Injury/details.
*   `location` (Object): Address (String), lat (Number), lng (Number).
*   `photos` (Array of Strings): URLs of uploaded proof images (max 3, Cloudinary).
*   `status` (String, enum: `['Pending Review', 'Approved', 'Rejected', 'Claimed', 'In Progress', 'Completed']`, default: `'Pending Review'`): Single source of truth.
*   `rejectionReason` (String): Stored if rejected by Admin.
*   `volunteer` (ObjectId, ref: `User`, default: null): Assigned rescuer.
*   `completionPhoto` (String): Proof uploaded by volunteer upon completion.
*   `geoLocation` (Object): GeoJSON Point containing `type` ('Point') and `coordinates` `[lng, lat]` for geospatial search.
*   `ratedByReporter` (Boolean, default: `false`): Ensures reporters can rate the volunteer only once.
*   *Indexes:* `2dsphere` sparse index on `geoLocation` for distance calculation.

### 3. Donation (`Donation.js`)
Manages crowdsourcing campaigns for medical and treatment support.
*   `title` (String, required): Campaign title.
*   `description` (String, required): Campaign reason/explanation.
*   `animal` (String, required): Animal type or name.
*   `rescueRequest` (ObjectId, ref: `RescueRequest`): Associated rescue request if applicable.
*   `targetAmount` (Number, required): Goal amount.
*   `collectedAmount` (Number, default: `0`): Total funds accumulated.
*   `createdBy` (ObjectId, ref: `User`, required): Admin who created the campaign.
*   `isActive` (Boolean, default: `true`): Active status indicator.
*   `deadline` (Date, required): Expiry date.
*   `closedReason` (String, enum: `['completed', 'deadline_reached', 'admin_closed', null]`, default: `null`).

### 4. DonationEntry (`DonationEntry.js`)
Records individual transactions/donations towards a campaign.
*   `campaignId` (ObjectId, ref: `Donation`, required): Targeted campaign.
*   `donorName` (String, required): Name of the donor.
*   `email` (String) / `phone` (String): Contact details.
*   `amount` (Number, required, min: 1): Amount contributed.
*   `message` (String): Message of support.
*   `isAnonymous` (Boolean, default: `false`): Hides donor info publicly.
*   `donatedAt` (Date, default: `Date.now`).

### 5. Notification (`Notification.js`)
Stores user-specific notifications generated by the system.
*   `userId` (ObjectId, ref: `User`, required): Target recipient.
*   `type` (String, required): Notification trigger type (e.g. `'RESCUE_CLAIMED'`, `'RESCUE_COMPLETED'`).
*   `message` (String, required): Alert message.
*   `isRead` (Boolean, default: `false`): Read/unread status.

### 6. AuditLog (`AuditLog.js`)
Tracks administrative changes for operational monitoring.
*   `adminId` (ObjectId, ref: `User`, required): Admin executing the change.
*   `action` (String, required): Action type (e.g. `ROLE_CHANGED`, `RESCUE_APPROVED`, `RESCUE_REJECTED`, `CAMPAIGN_CREATED`).
*   `targetId` (ObjectId, refPath: `targetModel`): Reference to target document.
*   `targetModel` (String, enum: `['User', 'RescueRequest', 'Donation']`): Target model name.
*   `targetLabel` (String): Readable summary of target (e.g., target's name or title).
*   `oldValue` (String) / `newValue` (String): Before and after state values.
*   `ip` (String): Admin client IP address.

---

## 🔌 API Routes & Controllers (backend/)

All api paths are prefixed with `/api`.

### 1. Authentication (`/api/auth` ➡️ `authController.js`)
*   `POST /register` – Register a new citizen or volunteer account. (Rate limited)
*   `POST /login` – Log in and receive a secure HTTP-Only cookie. (Rate limited)
*   `POST /logout` – Clear HTTP-Only cookie.
*   `GET /me` – Restores user session if cookie is present. *(Protected)*
*   `POST /forgot-password` – Sends a password reset token via Nodemailer email.
*   `POST /reset-password/:token` – Validates reset token and sets new password.

### 2. Rescue Operations (`/api/rescue` ➡️ `rescueController.js`)
*   `GET /` – Fetch all approved rescue requests. *(Protected)*
*   `GET /my` – Fetch requests reported by the logged-in user. *(Protected)*
*   `GET /claimed` – Fetch requests claimed by the active volunteer. *(Protected, Volunteer/Admin)*
*   `GET /nearby` – Fetch nearby rescues based on radius (latitude, longitude). *(Protected)*
*   `GET /:id` – Get single rescue details. *(Protected)*
*   `POST /` – Report a rescue (uploads up to 3 photos to Cloudinary). *(Protected)*
*   `PUT /:id/claim` – Claim a pending rescue request. *(Protected, Volunteer/Admin)*
*   `PUT /:id/status` – Update progress status, optional upload of 1 resolution proof photo. *(Protected)*
*   `POST /:id/rate` – Submits volunteer rating post-rescue (Reporter only, one-time). *(Protected)*

### 3. Donation Campaigns (`/api/donation` ➡️ `donationController.js`)
*   `GET /` – Browse active donation campaigns. *(Public)*
*   `GET /:id` – Fetch campaign details and transaction history. *(Public)*
*   `POST /:id/donate` – Add a new donation entry. *(Public, Rate limited)*
*   `POST /` – Create a new campaign. *(Protected, Admin)*
*   `DELETE /entry/:id` – Delete individual donation entry. *(Protected, Admin)*

### 4. Admin Management (`/api/admin` ➡️ `adminController.js` & `analyticsController.js`)
*   `GET /users` – List all system users. *(Protected, Admin)*
*   `PUT /users/:id/role` – Update user role. *(Protected, Admin, Audited)*
*   `GET /rescue` – List all rescues (pending review, approved, claimed, resolved). *(Protected, Admin)*
*   `PUT /rescue/:id/approve` – Approve a pending rescue. *(Protected, Admin, Audited)*
*   `PATCH /rescue/:id/reject` – Reject a pending rescue. *(Protected, Admin, Audited)*
*   `DELETE /rescue/:id` – Remove/delete a rescue request. *(Protected, Admin, Audited)*
*   `GET /rescues/export` – Export rescue request metrics to CSV format. *(Protected, Admin)*
*   `GET /donations` – Fetch all campaigns. *(Protected, Admin)*
*   `PATCH /campaigns/:id/close` – Close campaign manually. *(Protected, Admin, Audited)*
*   `GET /donations/export` – Export transactions to CSV. *(Protected, Admin)*
*   `GET /analytics/overview` – General system metrics overview. *(Protected, Admin)*
*   `GET /analytics/rescues-by-month` – Data format for Monthly Rescue charts. *(Protected, Admin)*
*   `GET /analytics/donations-by-campaign` – Data format for Donation progress charts. *(Protected, Admin)*
*   `GET /audit-logs` – Retrieve administrative action logs. *(Protected, Admin)*

### 5. Notifications (`/api/notifications` ➡️ `notificationController.js`)
*   `GET /` – Fetch all notifications for the active user. *(Protected)*
*   `PATCH /read-all` – Mark all user notifications as read. *(Protected)*
*   `PATCH /:id/read` – Mark a single notification as read. *(Protected)*

### 6. Volunteer Profiles (`/api/volunteer` ➡️ `volunteerController.js`)
*   `GET /stats` – Fetch statistics (completed, claimed rescues, rating) for the active volunteer. *(Protected, Volunteer/Admin)*
*   `PATCH /availability` – Toggle current active status (Available/Unavailable). *(Protected, Volunteer/Admin)*

---

## 🎨 Frontend Architecture (frontend/)

### Contexts
*   **AuthContext (`AuthContext.jsx`):** Provides global authentication state (`user`, `loading`), standard authentication actions (`login`, `logout`), and handles auto-restoration of user sessions via cookies.

### Page Views (Pages)
*   **Home (`Home.jsx`):** Landing page featuring statistics, ongoing campaigns, user reviews, and platform details.
*   **Login & Register (`Login.jsx`, `Register.jsx`):** User authentication pages.
*   **Forgot & Reset Password (`ForgotPasswordPage.jsx`, `ResetPasswordPage.jsx`):** Email-token based password reset flow.
*   **Dashboard (`Dashboard.jsx`):** Main tracking board. Citizens view "My Reports"; Volunteers view "My Reports" + "My Claimed Rescues" with toggleable availability controls.
*   **ReportRescue (`ReportRescue.jsx`):** Submission form for reporting animals. Integrates Leaflet map for clicking and resolving location coordinates.
*   **RescueRequests (`RescueRequests.jsx`):** Grid/list view of active rescues. Filterable by status and includes a map view using **RescueMapView**.
*   **RescueDetail (`RescueDetail.jsx`):** Comprehensive rescue page showing status updates, photos, reporter information, and giving users the ability to rate volunteers.
*   **DonationPortal & Detail (`DonationPortal.jsx`, `DonationDetail.jsx`):** Campaigns directory showing fundraising progress, donation logs, and target thresholds.
*   **AdminPanel (`AdminPanel.jsx`):** Restricted admin dashboard. Contains sub-tabs for User Management, Rescue Requests approval/denial, Donation Campaigns setup, Recharts-based Visual Analytics, and System Audit Logs.

### Key UI Components
*   **Navbar (`Navbar.jsx`):** Dynamic top navigation that adapts to user roles and supports notification integrations.
*   **Footer (`Footer.jsx`):** Bottom footer detailing navigation, social channels, and contacts.
*   **LocationPicker (`LocationPicker.jsx`):** Map interface allowing reporters to click, search, and pin location coordinates.
*   **RescueMapView (`RescueMapView.jsx`):** Leaflet container rendering markers for active and pending rescue cases.
*   **NotificationBell (`NotificationBell.jsx`):** Notification list showing system notifications and dynamic read updates.
*   **AnalyticsDashboard (`AnalyticsDashboard.jsx`):** Charts dashboard rendered with Recharts displaying total figures, monthly rescues, and campaign targets.

---

## ⚙️ Setup & Installation

### 1. Prerequisites
*   Node.js (v18 or higher)
*   npm or yarn
*   MongoDB Atlas cluster (or local MongoDB database instance)
*   Cloudinary Account (for hosting uploaded photos)

### 2. Backend Configuration
1. Navigate into the backend folder:
   ```bash
   cd backend
   ```
2. Create a `.env` file based on the following variables:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/animal_rescue
   JWT_SECRET=your_jwt_signing_key_here
   FRONTEND_URL=http://localhost:5173
   
   # Cloudinary Keys
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   
   # Email Configurations (Nodemailer SMTP)
   EMAIL_HOST=smtp.mailtrap.io
   EMAIL_PORT=2525
   EMAIL_USER=your_smtp_username
   EMAIL_PASS=your_smtp_password
   EMAIL_FROM=noreply@animalrescue.com
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Seed the database with the default administrator account:
   ```bash
   node seed/createAdmin.js
   ```
   *Note: This generates the admin user with the credentials:*
   *   **Email:** `admin@animalrescue.com`
   *   **Password:** `Admin@1234`

### 3. Frontend Configuration
1. Navigate into the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

---

## 🏃 Running the Application

### Start Backend (Development Server)
```bash
cd backend
npm run dev
```
The server will run on `http://localhost:5000`.

### Start Frontend (Vite)
```bash
cd frontend
npm run dev
```
The client app will launch on `http://localhost:5173`.
