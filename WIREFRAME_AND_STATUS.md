# VendRoute: Vending Route & Field Operations Management Platform
## 📘 Comprehensive Developer Guide, Wireframe Blueprint & Project Roadmap

Welcome to **VendRoute**! This document serves as the master guide for developers, product managers, or any new person joining the project. It outlines the codebase layout, core role flows, page-by-page features, layout wireframes, and implementation status—**point-by-point**.

---

## 🚀 1. Quick Start & Execution

This project is a React-based SPA built with **Vite, React Router DOM, TailwindCSS, Recharts (Charts), Leaflet (Maps), and Zustand (State Management)**.

* **Install Dependencies**: `npm install`
* **Run in Development Mode**: `npm run dev` (Runs on `http://localhost:5173/`)
* **Production Build Check**: `npm run build`
* **TypeScript Validation**: `npx tsc --noEmit` (Currently compiling with **0 errors**)

---

## 📁 2. Codebase Directory Structure

```
d:/kiaan/VendRoute
├── src/
│   ├── components/
│   │   ├── layout/       <-- Global Layouts (Header, Sidebar, DriverMobileLayout)
│   │   └── shared/       <-- Reusable UI elements (Status badges, Page headers)
│   ├── data/
│   │   └── mockData.ts   <-- Initial simulation data for stops, locations, routes
│   ├── lib/
│   │   └── utils.ts      <-- Currency/date formatters and Tailwind helper classes
│   ├── pages/            <-- Web Admin dashboards and driver screens
│   ├── store/            <-- Zustand state management stores (Auth, Tracking, Routes)
│   ├── types/            <-- Type definitions and schemas for system objects
│   ├── App.tsx           <-- Router pathways and routing configurations
│   └── main.tsx          <-- React entry point
```

---

## 🔑 3. Role-Based System Flows (Access Matrix)

The application supports three distinct user roles, each offering a tailored interface:

### 👑 Super Admin (Full System Access)
* **Goal**: Full operations configuration, route creation, fleet management, and billing reports.
* **Credentials (Demo)**: `admin@vendroute.in` (Password: `password`).
* **Sidebar Layout**: Full 12 navigation items + Profile + Logout.

### 👨‍💼 Supervisor (Field operations manager)
* **Goal**: Monitor assigned routes, review driver metrics, and check alerts feed.
* **Credentials (Demo)**: `manager@vendroute.in` (Password: `password`).
* **Sidebar Layout**: Hides **Settings**, **Users & Roles**, and **Customers** to focus on active field runs.
* **Dashboard Layout**: Automatically hides today's revenue overview card.

### 🚚 Driver (Field Staff Mobile Interface)
* **Goal**: Interactive sequence checklist, GPS arrival check-in, refill listings, and cash capture.
* **Credentials (Demo)**: `driver@vendroute.in` (Password: `password`).
* **App Layout**: Web layout is bypassed. Launches a **locked mobile web app UI** with a bottom navigation tab bar.

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
  1. **Top Metric Cards**: Summary of Today's Routes, Online Drivers, Completed/Missed stops progress, and Machine Alerts. (Revenue is hidden for supervisors).
  2. **Live Map**: Real-time Leaflet tracker with moving vehicles (refreshes every 5 seconds).
  3. **Alerts Feed**: Lists warning flags (emergency alerts, offline machines) with a "Mark all read" option.
  4. **Donut Chart**: Visual Recharts mapping machine health statuses (Operational, Needs Service, Offline).
  5. **Quick Actions**: Add locations, assign drivers, or generate reports instantly.

### 🗺️ Routes Page (`src/pages/RoutesPage.tsx`)
* **Visual Wireframe Layout**:
  ```
  ┌────────────────────────────────────────────────────────┐
  │ [ Active Routes ] [ Scheduled ] [ Completed ] [Calendar]│
  │ ────────────────────────────────────────────────────── │
  │ Search: [___________]  Driver: [All ▾]  Status: [All ▾]│
  │ ┌────────────────────────────────────────────────────┐ │
  │ │ Route ID | Driver Name | Stops count | Status | Replay│ │
  │ └────────────────────────────────────────────────────┘ │
  └────────────────────────────────────────────────────────┘
  ```
* **Key Features**:
  1. **Tab Filters**: View active route logs, scheduled queues, completed runs, or the calendar grid.
  2. **Optimized Route Builder**: Add stops, pick drivers, specify dates, and toggle AI sequence optimization.
  3. **Calendar Grid**: Shows schedules on a day-by-day basis.
  4. **Route Replay Animation**: Leaflet map that traces and replays a driver's stops sequentially with animation.

### 📍 Live Tracking (`src/pages/TrackingPage.tsx`)
* **Key Features**:
  1. **Map Sidebar**: List of drivers showing online/offline status, vehicle name, and active route.
  2. **Real-time Map**: Plots active paths, speed metrics (e.g. 35 km/h), and stop indicators.
  3. **Timeline Log**: Step-by-step progress tracking with Estimated Time of Arrival (ETA).

### 🥤 Vending Locations (`src/pages/LocationsPage.tsx` & `LocationDetailPage.tsx`)
* **Key Features**:
  1. **Locations Directory**: List of machines displaying customer names, address coordinates, and active statuses.
  2. **Before/After Photo Comparison**: Interactive slider that splits "Before servicing" and "After servicing" photos with a slide handle.
  3. **Service History Timeline**: Chronological log of past refills, cash collections, and notes left by drivers.
  4. **Product Configuration**: Visual product tag tags editor to audit what drinks/snacks are assigned.

### 📋 Stops Management (`src/pages/StopsPage.tsx`)
* **Key Features**:
  1. **Servicing Log Table**: Lists check-in arrival times, departure times, and verified GPS statuses.
  2. **Refill Checklists**: Shows products restocked, cash boxes collected, and digital signatures.

### 👥 Drivers & Fleet (`src/pages/DriversPage.tsx` & `DriverProfilePage.tsx`)
* **Key Features**:
  1. **Driver Profiles Grid**: Details licensing, ratings (e.g. 4.9⭐), and assigned vehicle specifications.
  2. **Attendance Tracker**: Lists daily punch-in times.
  3. **Performance Scorecard**: Dynamic scorecard ratings comparing routes completed, time per stop, and revenue generated.

### 🚚 Vehicles (`src/pages/VehiclesPage.tsx`)
* **Key Features**:
  1. **Fleet Dashboard**: Shows fuel levels, odometer counters, and service countdowns.
  2. **Fuel Logs**: Recharts bar graph displaying monthly fuel consumption versus maintenance costs.
  3. **Maintenance Schedules**: Log of engine oil replacements, tire align checks, and brake pad servicing.

### 📊 Reports & Analytics (`src/pages/ReportsPage.tsx`)
* **Key Features**:
  1. **Analytics Dashboard**: Multi-tab panels for Revenue, Routes, Machine Health, and Driver Scores.
  2. **Recharts Charts**: Radar chart for driver scorecard metrics, line graphs for monthly revenue, and area graphs for completions.
  3. **Service Galleries**: Visual log of photos captured by drivers during stop check-ins.

### 👤 Users & Roles (`src/pages/UsersPage.tsx`)
* **Key Features**:
  1. **Users Directory**: Table of registered users showing roles (Super Admin, Supervisor, Driver, Viewer).
  2. **Role Permissions Card**: Live reference guide displaying what actions each role is allowed to perform.
  3. **New User Invitations**: Form to invite colleagues with role assignment dropdowns.

### ⚙️ Settings (`src/pages/SettingsPage.tsx`)
* **Key Features**:
  1. **Form Categories**: Profile metadata, notifications toggles, security passwords, and theme setups (Light, Dark, System).

---

## 📱 5. Driver Mobile App Flow

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

1. **Dashboard Start**: The driver sees their summary metrics and clicks **START ROUTE** to initiate GPS tracking.
2. **Sequential Checklist**: Displays stops in sequence. Tapping the current stop loads the Stop Details.
3. **Servicing stop form**:
   * Click **[ Check In ]** ➔ GPS verifies proximity and flags `GPS Verified ✓`.
   * Check refill inventory logs and type cash collected.
   * Draw signature, report issues, and click **[ Mark Stop Complete ]**.
4. **Interactive Specifications**: Tapping "Machine Details" tab displays snacks/beverages stock levels (e.g. Snack 20% critical level, Sodas 85% full) and navigation details.
5. **App Logs & Logout**: The Driver reviews history records of previous routes and logged out of the app.

---

## 📝 6. Project Features Checklist & Implementation Gaps

| Feature category | Status | Details |
| :--- | :--- | :--- |
| **User Roles** | ✅ Implemented | Configured for Super Admin, Supervisor, and Driver. |
| **Maps & Tracking** | ✅ Implemented | Live movement tracking with dynamic ETA updates. |
| **Map Replay Animation** | ✅ Implemented | Step-by-step route replay mapping on Leaflet. |
| **Before/After Photo Compare** | ✅ Implemented | Image sliders with split handles to compare visual conditions. |
| **Inventory & Cash Logging** | ✅ Implemented | Stop-by-stop restocking log forms. |
| **Digital Signatures** | ✅ Implemented | Simulated signature writing canvas. |
| **Role Permissions Mapping** | ✅ Implemented | Settings permissions directory grid. |
| **Add Customer Modal** | ✅ Implemented | Working form to insert new customer databases. |
| **Barcode/QR Code Scanner** | ✅ Implemented | Simulated scanner scan radar overlays and verification simulation. |
| **Offline Cache Storage** | ✅ Implemented | Browser status listeners, orange alert offline warnings, and LocalStorage queues. |
| **Maps Application Redirects** | ✅ Implemented | Waze and Google Maps deep link anchors inside next stop panels. |
| **Real-time Routing API** | ✅ Implemented | Live distance & time fetching calls to the public OSRM Routing services. |
| **Vending Machines Module** | ✅ Implemented | Main sidebar node with KPI row, 4 table actions, and 6 tabbed machine detail panels (Overview, Products, Map, Compare, Service history, Route log). |
