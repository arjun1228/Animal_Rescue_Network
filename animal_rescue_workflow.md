# 🐾 Animal Rescue Network — Full Project Workflow

## Overview

The Animal Rescue Network is a full-stack MERN application that connects **citizens** who spot stray/injured animals, **volunteers** who rescue them, **donors** who fund campaigns, and **admins** who manage everything.

---

## 👥 Roles Summary

| Role | Self-Register | Assigned By |
|---|---|---|
| **Citizen** | ✅ Yes (default) | Self |
| **Volunteer** | ✅ Yes (on register) | Self or Admin |
| **Donor** | ✅ Yes (on register) | Self or Admin |
| **Admin** | ❌ No | Seed script / Admin only |

> Admin can change any user's role from the Admin Panel.

---

## 🔐 Role Permissions — Page Access

| Page / Feature | Citizen | Volunteer | Donor | Admin |
|---|:---:|:---:|:---:|:---:|
| Home (`/`) | ✅ | ✅ | ✅ | ✅ |
| Login / Register | ✅ | ✅ | ✅ | ✅ |
| Dashboard (`/dashboard`) | ✅ | ✅ | ✅ | ✅ |
| Report a Rescue (`/report`) | ✅ | ✅ | ✅ | ✅ |
| View Rescue Requests (`/rescues`) | ✅ own only | ✅ all pending | ✅ | ❌ → redirected to `/admin` |
| Rescue Detail (`/rescues/:id`) | ✅ | ✅ | ✅ | ❌ → redirected to `/admin` |
| Claim a Rescue | ❌ | ✅ | ❌ | ❌ |
| Update Rescue Status | ❌ | ✅ (assigned only) | ❌ | ✅ |
| Donation Portal (`/donate`) | ✅ | ✅ | ✅ | ❌ → redirected to `/admin` |
| Make a Donation (`/donate/:id`) | ✅ | ✅ | ✅ | ❌ → redirected to `/admin` |
| Admin Panel (`/admin`) | ❌ | ❌ | ❌ | ✅ |

---

## 🔄 Core Workflows

### 1. 🚨 Rescue Request Lifecycle

```
Citizen/Volunteer/Donor
    │
    ▼
[Report an Animal] (/report)
    → Submits: animal type, description, address, photos
    → Status: Pending | isApproved: false
    │
    ▼
[Admin Reviews] (/admin → Rescues tab)
    → Sees ALL rescue requests (including unapproved)
    → Clicks "Approve" → isApproved: true
    → OR clicks "Delete" to remove it
    │
    ▼
[Volunteer Sees It] (/rescues)
    → Volunteers see all Pending + their own claimed rescues
    → Clicks "Claim" → status: Claimed, volunteer assigned
    │
    ▼
[Volunteer Updates Status] (/rescues/:id)
    → Can change: Pending → Claimed → In Progress → Completed
    → Only the assigned volunteer (or admin) can update status
    │
    ▼
[Citizen Tracks It] (/dashboard → My Reports)
    → Citizen sees only their own submitted rescues
    → Can track status changes in real-time
```

---

### 2. 💰 Donation Lifecycle

```
Admin
    │
    ▼
[Creates Donation Campaign] (/admin → Create Campaign tab)
    → Submits: title, description, animal, target amount
    → Campaign is now active and visible to all non-admin users
    │
    ▼
[Donors/Citizens/Volunteers View Campaigns] (/donate)
    → Browse all active donation campaigns
    → Click a campaign card → Donation Detail page
    │
    ▼
[Make a Donation] (/donate/:id)
    → Must be logged in to donate
    → Enter amount + optional message
    → Transaction saved with donor name, amount, message
    → Campaign's collectedAmount updates instantly
    │
    ▼
[Admin Monitors] (/admin → Donations tab)
    → Sees all campaigns with collected amounts & transaction history
```

---

### 3. 👤 User Management (Admin Only)

```
Admin Panel → Users tab
    │
    ├── View all registered users
    ├── See each user's name, email, phone, role
    └── Change any user's role (citizen / volunteer / donor / admin)
```

---

## 📋 Role Deep-Dives

### 🧑 Citizen
- **Primary purpose**: Report stray/injured animals
- **Dashboard shows**: "My Reports" tab only — their own submitted rescue requests
- **Rescue list filter**: Only sees their own reports (`reporter = user._id`)
- **Cannot** claim rescues or update status

### 🙋 Volunteer
- **Primary purpose**: Respond to and rescue animals
- **Dashboard shows**: "My Reports" + **"My Claimed Rescues"** tabs
- **Rescue list filter**: Sees all `Pending` rescues + rescues they've claimed
- **Can claim** any Pending rescue (assigns themselves)
- **Can update status** only on rescues they are assigned to
- **Can also** report animals and make donations

### 💝 Donor
- **Primary purpose**: Fund donation campaigns
- **Same access as Citizen** for rescues
- **Extra**: Can browse and donate to campaigns on the Donation Portal
- **Any logged-in user can donate** — `donor` is mainly a label/identity

### 🛡️ Admin
- **Primary purpose**: Oversee and manage the entire platform
- **Exclusive actions**:
  - Approve or delete rescue requests
  - Create donation campaigns
  - View all donations & transactions
  - View and manage all users
  - Change any user's role
- **Blocked from**: Donation Portal, Rescue list — redirected to `/admin`
- **Dashboard**: Can see claimed rescues (via `/api/rescue/claimed`)

---

## 🗂️ Rescue Request Status Flow

```
[Pending] ──► [Claimed] ──► [In Progress] ──► [Completed]
   ▲               │
   │    (Admin can also approve/delete at any point)
   └── isApproved: false (not visible to volunteers until admin approves)
```

---

## 🔑 Admin Credentials (from seed)

| Field | Value |
|---|---|
| Email | `admin@animalrescue.com` |
| Password | `Admin@1234` |
