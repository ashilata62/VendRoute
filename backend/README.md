# 🚀 VendRoute Backend REST API & Real-time Server

Production-ready backend built with Node.js, Express, TypeScript, MySQL, Prisma ORM, Zod, JWT, Bcrypt, and Socket.io.

---

## 🏗️ Architecture Pattern
- **Controller-Service-Routes-Config Pattern**
- **Zod Schema Validation Middleware**
- **JWT Bearer Auth & Role Middleware**
- **Socket.io Real-time Driver GPS Tracking**

---

## 📁 Folder Structure

```text
vendroute-backend/
├── prisma/
│   └── schema.prisma         # MySQL Database Models
├── src/
│   ├── config/               # Prisma DB & Environment configs
│   ├── controllers/          # Request & Response logic handlers
│   ├── services/             # Business & Database logic (Prisma queries)
│   ├── routes/               # Express API endpoints
│   ├── middlewares/          # Auth JWT, Role, & Zod validators
│   ├── validators/           # Zod schema definitions
│   ├── utils/                # Bcrypt password & JWT helpers
│   ├── app.ts                # Express App setup
│   └── server.ts             # HTTP & Socket Server entry
├── .env.example
├── package.json
└── tsconfig.json
```

---

## ⚡ Quick Start

1. **Install Dependencies:**
   ```bash
   cd vendroute-backend
   npm install
   ```

2. **Configure Environment:**
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` and set your MySQL database URL (`DATABASE_URL`).*

3. **Run Prisma Database Migration:**
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Start Development Server:**
   ```bash
   npm run dev
   ```

5. **Test Health Endpoint:**
   Open `http://localhost:5000/health` in your browser.
