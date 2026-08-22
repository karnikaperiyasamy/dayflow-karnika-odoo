# Dayflow — Human Resource Management System

> **Every workday, perfectly aligned.**

Dayflow is a full-stack **Human Resource Management System (HRMS)** developed for the **Odoo Hackathon 2026**. It provides a centralized platform for managing employees, attendance, leave, payroll, notifications, dashboards, and reports.

The project is designed as a functional end-to-end application with a **React frontend, TypeScript/Node.js backend, PostgreSQL database, and JWT-based authentication**.

---

## 🚀 Features

### 🔐 Authentication & Authorization

* User registration and login
* JWT-based authentication
* Protected backend routes
* Role-based access control
* Secure password handling with bcrypt

### 👨‍💼 Employee Management

* Employee profiles
* Employee information management
* Employee listing and details
* Role and department information

### ⏰ Attendance Management

* Attendance tracking
* Check-in and check-out
* Attendance records
* Attendance status management

### 🏖️ Leave Management

* Apply for leave
* View leave requests
* Leave approval/rejection
* Leave status tracking

### 💰 Payroll Management

* Employee payroll information
* Salary details
* Payroll records
* Payroll-related management

### 📊 Dashboard

* HRMS overview
* Employee statistics
* Attendance information
* Leave information
* Payroll overview

### 🔔 Notifications

* System notifications
* Employee-related notifications
* Notification status management

### 📈 Reports

* HR-related reports
* Attendance reports
* Employee reports
* Leave and payroll information

---

## 🛠️ Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

### Backend

* Node.js
* Express.js
* TypeScript
* JWT
* bcrypt

### Database

* PostgreSQL

### Development Tools

* Git
* GitHub
* VS Code
* npm

---

## 📁 Project Structure

```text
dayflow-karnika-odoo/
│
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── migrate.ts
│   │   │   ├── pool.ts
│   │   │   ├── schema.sql
│   │   │   └── seed.ts
│   │   │
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   │
│   │   ├── routes/
│   │   │   ├── attendance.ts
│   │   │   ├── auth.ts
│   │   │   ├── dashboard.ts
│   │   │   ├── employees.ts
│   │   │   ├── leave.ts
│   │   │   ├── notifications.ts
│   │   │   ├── payroll.ts
│   │   │   └── reports.ts
│   │   │
│   │   └── utils/
│   │       └── jwt.ts
│   │
│   ├── server.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
└── README.md
```

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/karnikaperiyasamy/dayflow-karnika-odoo.git
cd dayflow-karnika-odoo
```

---

## 🖥️ Frontend Setup

Open a terminal in the frontend directory:

```bash
cd frontend
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will be available at the local URL displayed by Vite.

---

## ⚙️ Backend Setup

Open another terminal:

```bash
cd backend
npm install
```

Create your environment file:

```bash
copy .env.example .env
```

For Linux/macOS:

```bash
cp .env.example .env
```

Configure the required environment variables in `.env`.

Example:

```env
PORT=5000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secure_jwt_secret
```

Start the backend:

```bash
npm run dev
```

---

## 🗄️ Database

Dayflow uses **PostgreSQL** as its database.

The backend contains database scripts for:

* Database connection
* Schema creation
* Migration
* Seed data

Database configuration should be provided through environment variables.

**Never commit real database passwords, JWT secrets, API keys, or other credentials to GitHub.**

---

## 🔒 Security

Dayflow follows basic backend security practices including:

* JWT authentication
* Protected API routes
* Password hashing using bcrypt
* Environment variables for secrets
* Server-side authentication checks
* Input validation
* PostgreSQL database persistence

---

## 🔄 Application Architecture

```text
             ┌─────────────────────┐
             │      React UI       │
             │   TypeScript/Vite   │
             └──────────┬──────────┘
                        │
                        │ HTTP / REST API
                        ▼
             ┌─────────────────────┐
             │   Node.js + Express │
             │      Backend        │
             └──────────┬──────────┘
                        │
              JWT Authentication
                        │
                        ▼
             ┌─────────────────────┐
             │     PostgreSQL      │
             │      Database       │
             └─────────────────────┘
```

---

## 🎯 Project Objective

The objective of Dayflow is to provide a centralized HRMS platform that simplifies everyday HR operations.

The system connects employees, HR administrators, and management through a single application for managing:

**Employees → Attendance → Leave → Payroll → Notifications → Reports**

The application focuses on real backend functionality and persistent database operations rather than a UI-only prototype.

---

## 🏆 Odoo Hackathon 2026

**Event:** Odoo Hackathon 2026

**Project:** Dayflow — Human Resource Management System

**Tagline:** *Every workday, perfectly aligned.*

The project is developed as a team for the Odoo Hackathon 2026.

---

## 👥 Team

* **Karnika Periyasamy** — Authentication / Initial Project
* **Manoreshika** — Backend Database, Middleware & Server
* **PangaiRavi** — Backend TypeScript Implementation & HRMS Routes

---

## 📌 Current Modules

| Module              | Status |
| ------------------- | ------ |
| Authentication      | ✅      |
| Employee Management | ✅      |
| Attendance          | ✅      |
| Leave Management    | ✅      |
| Payroll             | ✅      |
| Dashboard           | ✅      |
| Notifications       | ✅      |
| Reports             | ✅      |
| PostgreSQL Database | ✅      |
| JWT Authentication  | ✅      |
| React Frontend      | ✅      |

---

## 🔮 Future Improvements

* Advanced HR analytics
* Email notifications
* Attendance calendar
* Automated payroll calculations
* Role-specific dashboards
* Employee self-service features
* Exportable HR reports
* Improved mobile responsiveness

---

## 📄 License

This project was developed as part of the **Odoo Hackathon 2026**.
