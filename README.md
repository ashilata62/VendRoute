# 🚚 VendRoute - Vending Machine Route Management & Tracking System

VendRoute is a complete full-stack web application designed for managing vending machine locations, route dispatching, fleet monitoring, inventory refilling, and real-time GPS driver tracking.

---

## 📁 Repository Structure

```text
VendRoute/
├── frontend/             # 🎨 React + TypeScript + Vite + Tailwind CSS Frontend
│   ├── src/              # Pages, Components, Zustand Stores, Types
│   ├── public/           # Static assets
│   ├── package.json      # Frontend dependencies
│   └── vite.config.ts    # Vite configuration
│
└── backend/              # ⚙️ Node.js + Express + Prisma + MySQL + Socket.io Backend
    ├── src/              # Controllers, Services, Routes, Middlewares, Validators
    ├── prisma/           # Database schema & migrations
    ├── .env              # MySQL Connection (Port 3307) & Secrets
    └── package.json      # Backend dependencies
```

---

## 🚀 How to Run the Project

### 1. Start Backend Server:
```bash
cd backend
npm run dev
```
- API Base URL: `http://localhost:5000/api/v1`
- Health Check: `http://localhost:5000/health`

### 2. Start Frontend App:
```bash
cd frontend
npm run dev
```
- Frontend App URL: `http://localhost:5173`
