# AI Project Handover: VendRoute

This document summarizes the current status, implemented features, important design decisions, and pending tasks for the **VendRoute** vending machine management, route optimization, and live GPS tracking system.

---

## 🚀 Accomplished Tasks (Implemented Features)

### 1. Vending Location Coordinates & Address Geocoding
* **Auto-Geocoding & Auto-Sync**: Enabled automatic coordinates calculation using Nominatim OpenStreetMap API on page load if default coordinates are detected.
* **Interactive Map Pinning**: Enabled direct map clicks or marker dragging to automatically recalculate and fill out coordinates, city, and street address.
* **Backend Database Synchronization**: Linked the interactive map coordinates directly to the `POST /api/locations` and `PUT /api/locations/:id` backend endpoints.

### 2. Vehicle Fleet & Live GPS Tracking
* **Real Telemetry Connection**: Removed dummy Mumbai coordinates and presets from the Vehicles page. 
* **Dynamic Route Polyline**: Integrated route stops to dynamically draw the real assigned route path on the admin fleet map.
* **Numbered Stop Markers**: Rendered numbered pins with custom tooltips indicating location names, addresses, and replenishment statuses (Completed/Pending).
* **Socket.io Synchronization**: Aligned the driver app event (`driver:location_update`) with the backend socket listener to instantly broadcast live location coordinates and speed (`km/h`) to the dashboard.

### 3. Vending Machine Configuration
* **Data Mapping Alignment**: Resolved database schema mismatch where the location relation array key was singular `machine` in MySQL instead of plural `machines`.
* **Details Form**: Integrated a direct "Add Machine" / "Update Machine" modal on the Location Detail Page to allow admins to easily configure machine codes, models, and current fill levels.

### 4. Products & Inventory Parsing
* **Robust Parser**: Implemented a parser to handle database `products` field inputs whether stored as stringified JSON arrays `["Pepsi", "Coke"]` or comma-separated lists `Pepsi, Coke`.

### 5. Media Gallery & Photo Uploads
* **Real Visit Photo Compilation**: Connected the Gallery tab to pull real photos uploaded by drivers during previous service visits (`routestop` history).
* **Direct File Uploads**: Connected the "Upload Photo" button to convert selected image files to base64 and save them directly as the location's primary cover image.

### 6. Configuration & Login Issue Debugging
* **Env Cleanup**: Cleaned up redundant `.env` files across the project.
* **API Connection Fix**: Resolved login API errors by ensuring correct backend URL binding (`127.0.0.1` instead of `localhost`) in `.env` to prevent proxy network issues.

### 7. Location Detail Page API Integration
* **Removed Dummy Data**: Completely connected `LocationDetailPage.tsx` to the backend. Replaced hardcoded values with real data.
* **Field Notes & Inventory**: Refills and driver field notes now pull directly from the DB's `locationStops`.
* **Dynamic Operational Metrics**: Total Service Visits, Average Service Duration, Next Service Date, and Last Cash Collected are now dynamically computed from real `routestop` and `route` data.
* **Troubleshooting 0 Values**: Identified and clarified that locations with 0 values (e.g., Hitech City) correctly reflect the backend database state where stops are still `PENDING`, whereas fully checked-in stops (e.g., dewas route) accurately calculate cash and visit count.

### 8. Settings Page Backend Connectivity Check
* **Settings API Review**: Verified that the `/settings` backend API, Prisma `settings` model, and frontend `SettingsPage.tsx` are fully integrated and actively saving/fetching data.
* **Loading State UX**: Added a proper loading spinner (`Loading Configuration from Server...`) in `SettingsPage.tsx` using the existing `settingsLoading` state. This prevents the brief flash of hardcoded dummy defaults on mount, ensuring users visually confirm that settings are actively pulled from the live database.

### 9. Live Tracking Page Backend Connectivity Fixes
* **Removed Final Dashboard Dummy Texts**: Removed "Total 25 machines" and "Simulated updates every 5s" strings.
* **Made Machine Status Dynamic**: The Machine Status donut chart now pulls from the actual machine records nested inside the locations data from the backend, correctly calculating ACTIVE, NEEDS_MAINTENANCE, and INACTIVE/OUT_OF_STOCK.
* **Fixed Machine Alerts Count**: The "Machine Alerts" summary card now accurately counts machines needing maintenance or out of stock, replacing the old dummy location-status logic.
* **Fixed Overall Route Progress Calculation**: The Route Completion Progress now calculates across all active routes for the selected date instead of just the sliced top 4 routes.
* **UX Fix for Location Updates**: Replaced raw Prisma database error traces on the frontend with user-friendly error messages (e.g., advising smaller image uploads if the payload is too large and the database closes the connection).
* **Dynamic Route Polylines & Markers**: Connected the map rendering to actual `routestop` locations for the assigned routes, replacing the hardcoded slice of the first 4 generic locations.
* **Live Route Timeline Panel**: Swapped out the mocked "RCF Colony Complex", "Nesco IT Park" timeline entries for real database stops and their actual backend check-in statuses (COMPLETED, REACHED, PENDING).

### 10. Admin Dashboard Live Connectivity Fixes
* **Replaced Hardcoded UI KPIs**: The main Admin Dashboard (`DashboardPage.tsx`) was relying on several mocked constants (`missedStopsCount = 0`, `todayRevenue = 0`) giving the illusion that user inputs weren't saving.
* **Dynamic Route Analytics**: Fully mapped the "Route Completion Progress" and "Top KPIs" cards to real `routeStore` arrays. The dashboard now dynamically calculates `completedStopsCount`, `missedStopsCount`, and `todayRevenue` natively from live backend records.
* **Fixed Misunderstanding**: Clarified that data saving forms (`/routes/create`, `/locations`) were perfectly functioning; the discrepancy was purely an artifact of the dashboard being a static presentation UI prior to this fix.
* **Dashboard Date Filter**: Added an interactive calendar date picker to the Dashboard header, allowing users to view dynamic KPIs and route progress for any specific date instead of just today.

---

## 📋 Pending Tasks (To-do List)

1. **Driver Mobile App GPS Integration**: Verify background geolocation tracker task registers location updates correctly without power throttling.
2. **Offline Sync & Reconciliation**: Implement client-side SQLite/localStorage queue sync mechanisms for drivers replenishing in low-connectivity areas.
3. **Digital Signature Verification**: Verify driver-submitted signatures compile and render cleanly on reports.
4. **Performance Scorecards**: Build supervisor scorecards showing average service duration, SLA delays, and driver fuel efficiencies.

---

## ⚙️ Architecture & Tech Stack

* **Backend**: Node.js, Express, Socket.io, Prisma ORM, MySQL Database.
* **Frontend**: React (Vite), Tailwind CSS, React Leaflet, Zustand.
* **Driver Mobile App**: React Native (Expo).

---

## 📦 Deployment & Run Instructions

- **Backend (development)**:
	- Prereqs: Node.js >=16, npm, MySQL.
	- Install & run:
		- `cd backend`
		- `npm install`
		- copy `.env.example` to `.env` and set `DATABASE_URL`, `PORT`, `JWT_SECRET`, `SOCKET_URL`.
		- Run migrations & seed: `npx prisma migrate dev` then `npx prisma db seed` (if seed present).
		- Start dev server: `npm run dev` (uses `ts-node-dev` / nodemon).

- **Frontend (admin dashboard)**:
	- Prereqs: Node.js, npm.
	- Install & run:
		- `cd frontend`
		- `npm install`
		- `npm run dev`

- **Driver App (Expo)**:
	- `cd driver-app`
	- `npm install`
	- `expo start`
	- Confirm `app.json` / `expo` config points to the correct backend `SOCKET_URL` and API host for dev testing.

- **Database**:
	- MySQL is used in production; local development may use a local MySQL instance or a Docker container.
	- Prisma migrations live in `backend/prisma/migrations`.

## 🔍 Code Map (Key Files & Locations)

- **Backend**:
	- Entry: `backend/src/server.ts`
	- App config & middleware: `backend/src/app.ts`, `backend/src/config` and `backend/src/middlewares`
	- Controllers: `backend/src/controllers/*Controller.ts`
	- Services: `backend/src/services/*`
	- Database schema: `backend/prisma/schema.prisma`

- **Frontend (admin dashboard)**:
	- Entry: `frontend/src/main.tsx`
	- App shell: `frontend/src/App.tsx`
	- Pages: `frontend/src/pages` or `frontend/src/components` (map, dashboard, settings, locations)
	- API client: `frontend/src/services/api.ts` (or similar)
	- State: `frontend/src/store` (Zustand stores)

- **Driver App**:
	- Entry: `driver-app/App.tsx`
	- Screens: `driver-app/src/screens`
	- Location & background tracking: `driver-app/src/services` (look for `location`, `geolocation`, or `background` helpers)

## 👥 Contacts & Access

- **Repository ownership & primary contacts**: Please fill in the maintainers and Slack/Email contacts below before handover:
	- Maintainer: _Add name & email_
	- Mobile/Driver app owner: _Add name & email_
	- DevOps / DB Admin: _Add name & email_

- **Access checklist**:
	- Provide DB credentials, production `.env` or vault access.
	- Confirm Expo account access (if publishing driver app builds).
	- Share any third-party API keys (Mapbox, Nominatim usage notes, SMS gateways).

## ✅ Next Steps & Acceptance Criteria

1. Driver GPS Integration: background location updates registered and visible on the admin dashboard with <=10s delay for live mode.  
2. Offline Sync: queued replenishment actions persist locally and reconcile when online; tests for conflict resolution included.  
3. Digital Signatures: driver signatures stored as SVG/base64 and render in PDF reports without corruption.  
4. Performance Scorecards: supervisor view with filters for date range and driver, accuracy validated against historic route data.  

---

If you'd like, I can now (a) expand any of the Pending Tasks into step-by-step implementation notes, (b) create a deploy checklist, or (c) open PR scaffolding for these docs. Which should I do next?
