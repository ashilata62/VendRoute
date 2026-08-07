# VendRoute: Vending Route & Field Operations Management Platform
## 📘 Comprehensive Developer Guide, Wireframe Blueprint & Project Roadmap

Welcome to **VendRoute**! This document serves as the master guide for developers, product managers, or any new person joining the project. It outlines the codebase layout, core role flows, page-by-page features, layout wireframes, and implementation status—**point-by-point**.

---

## 🚀 1. Quick Start & Execution

This project is a Full-Stack Monorepo consisting of a React-based Web Admin (Frontend), a Node.js/Express Server (Backend), and a React Native Expo App (Driver App).

### 🌐 Frontend (React + Vite + TailwindCSS)
* **Path**: `/frontend`
* **Install**: `npm install`
* **Run**: `npm run dev` (Runs on `http://localhost:5173/`)

### 🖥️ Backend (Node.js + Express + Prisma + MySQL)
* **Path**: `/backend`
* **Install**: `npm install`
* **Database Setup**: Ensure MySQL is running on port 3307 (or update `.env`) and run `npx prisma db push`.
* **Run**: `npm run dev` (Runs on `http://localhost:5000/`)

### 📱 Driver App (React Native + Expo)
* **Path**: `/driver-app`
* **Install**: `npm install`
* **Run**: `npx expo start` (Scan QR code in Expo Go app)

---

## 📁 2. Codebase Directory Structure

```
d:/kiaan/VendRoute
├── frontend/             <-- Web Admin Dashboard (React/Vite)
│   ├── src/pages/        <-- Web Admin pages (Dashboard, Routes, Drivers)
│   ├── src/services/     <-- API calls using fetch (`api.ts`)
│   └── src/store/        <-- Zustand state management
├── backend/              <-- API Server (Node.js/Express)
│   ├── src/controllers/  <-- Business logic (userController, routeController)
│   ├── src/routes/       <-- Express Router endpoints
│   ├── src/services/     <-- Internal services (AuthService, Socket.io)
│   └── prisma/           <-- Prisma Schema (`schema.prisma`)
└── driver-app/           <-- Field Staff Mobile App (Expo)
    └── src/              <-- Mobile screens, location services, sockets
```

---

## 🔑 3. Role-Based System Flows (Access Matrix)

The application supports three distinct user roles, each offering a tailored interface:

### 👑 Super Admin (Full System Access)
* **Goal**: Full operations configuration, route creation, fleet management, and billing reports.
* **Credentials (Demo)**: `admin@vendroute.com` (Password: `Admin@123`).
* **Dashboard Layout**: Full 12 navigation items + Profile + Logout.

### 👨‍💼 Supervisor (Field operations manager)
* **Goal**: Monitor assigned routes, review driver metrics, and check alerts feed.
* **Credentials (Demo)**: `manager@vendroute.in` (Password: `Admin@123`).
* **Sidebar Layout**: Hides **Settings**, **Users & Roles**, and **Customers** to focus on active field runs.

### 🚚 Driver (Field Staff Mobile Interface)
* **Goal**: Interactive sequence checklist, GPS arrival check-in, refill listings, and cash capture.
* **Credentials (Demo)**: `driver@vendroute.com` (Password: `Driver@123`).
* **App Layout**: Separate React Native Expo App with background GPS tracking and live sockets.

---

## 🖥️ 4. Web Admin Panel Pages: Point-by-Point Blueprint

### 🏠 Dashboard Page (`src/pages/DashboardPage.tsx`)
* **Visual Wireframe Layout**:
  ```
  ┌────────────────────────────────────────────────────────┐
  │ [ Routes Stat ] [ Drivers Stat ] [ Stops Progress Circ]│
  │ [ Missed Stat ] [ Today Revenue ] [ Alerts Stat Card ] │
  │ ────────────────────────────────────────────────────── │
  │   ┌───────────────────────────┐  ┌───────────────────┐ │
  │   │   Live Vehicles Leaf Map  │  │ Live Alerts Feed  │ │
  │   └───────────────────────────┘  └───────────────────┘ │
  │   ┌───────────────────────────┐  ┌───────────────────┐ │
  │   │ Machine Health Status Pie │  │ Quick Actions Grid│ │
  │   └───────────────────────────┘  └───────────────────┘ │
  └────────────────────────────────────────────────────────┘
  ```
* **Key Features**:
  1. **Top Metric Cards**: Summary of Today's Routes, Online Drivers, Completed/Missed stops progress.
  2. **Live Map**: Real-time Leaflet tracker with moving vehicles via Socket.io.
  3. **Alerts Feed**: Lists warning flags (emergency alerts, offline machines).

### 🗺️ Routes Page (`src/pages/RoutesPage.tsx`)
* **Key Features**:
  1. **Optimized Route Builder**: Add stops, pick drivers, specify dates, fetching live distances from OSRM.
  2. **Database Integration**: Saves complete Route and RouteStops to MySQL via backend API.
  3. **Route Replay Animation**: Leaflet map that traces and replays a driver's stops sequentially with animation.

### 📍 Live Tracking (`src/pages/TrackingPage.tsx`)
* **Key Features**:
  1. **Socket.io Connection**: Connects to the backend and listens for `driver_location_changed` events.
  2. **Real-time Map**: Plots active paths and updates marker position instantly when the Driver App pings.

### 📋 Stops Management (`src/pages/StopsPage.tsx`)
* **Key Features**:
  1. **Servicing Log Table**: Lists check-in arrival times and departure times synced from the Mobile App.
  2. **Refill Checklists**: Shows products restocked and cash boxes collected.

### 👥 Drivers & Fleet (`src/pages/DriversPage.tsx` & `DriverProfilePage.tsx`)
* **Key Features**:
  1. **Driver Profiles Grid**: Details licensing, ratings, and assigned vehicle specifications connected via Prisma relations (`user` & `vehicle`).
  2. **Status Badges**: Shows real-time Online/Offline driver status.

### 👤 Users & Roles (`src/pages/UsersPage.tsx`)
* **Key Features**:
  1. **Users Directory**: Database-backed table of registered users.
  2. **User Invite Modal**: API-driven form that creates a new user, hashes their password, and saves them to MySQL.

---

## 📱 5. Driver Mobile App Flow (Expo)

For route drivers, the interface acts as a focused mobile app.

```
🏠 Home           🗺️ My Route         📋 Stop Form        👤 Profile
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Route Status │   │ ✓ Stop 1     │   │ VM-102 Specs │   │ Arjun Sharma │
│ [ 8 / 15 ]   │   │  ↓           │   │ [ Check In ] │   │ Tata Ace V1  │
│              │   │ ➔ Stop 2     │   │ Refill Coke  │   │              │
│ Next Stop:   │   │  ↓           │   │ Enter Cash   │   │ Attendance   │
│ ABC Company  │   │ ○ Stop 3     │   │ Notes Box    │   │ [98.2%]      │
│ [START RUN]  │   │              │   │ [COMPLETE]   │   │ [LOG OUT]    │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
```

1. **Dashboard Start**: The driver clicks **START ROUTE**. The app connects to the Socket.io server and starts emitting GPS coordinates.
2. **Sequential Checklist**: Fetches routes dynamically via `GET /api/v1/routes`.
3. **Servicing stop form**: Driver completes tasks, API updates the route stop to 'COMPLETED', and admins see this live.

---

## 📝 6. Project Features Checklist & Implementation Gaps

| Feature category | Status | Details |
| :--- | :--- | :--- |
| **Node.js/Express Backend** | ✅ Implemented | Complete API architecture with auth, controllers, and Prisma. |
| **MySQL Database** | ✅ Implemented | 8+ structured tables (users, routes, vehicles, machines, etc). |
| **Socket.io Live Tracking** | ✅ Implemented | GPS coordinates streamed from Expo app to Backend to Web Dashboard. |
| **Authentication & Passwords** | ✅ Implemented | bcrypt password hashing and JWT token-based authentication. |
| **Route Generation API** | ✅ Implemented | Dynamic distance/duration calculations saving to MySQL. |
| **User Roles** | ✅ Implemented | Configured for Super Admin, Supervisor, and Driver. |
| **Map Replay Animation** | ✅ Implemented | Step-by-step route replay mapping on Leaflet. |
| **Driver Expo App** | ✅ Implemented | React Native app logic for live location publishing and route viewing. |
| **Offline Cache Storage** | ✅ Implemented | Browser status listeners, orange alert offline warnings. |
| **Before/After Photo Compare** | 🚧 Frontend Only | Image sliders with split handles (not fully linked to backend storage yet). |
| **Dashboard Analytics** | 🚧 Frontend Only | Some Recharts charts still use static/mock data metrics. |
