# 🚀 Team Task Manager (Full-Stack MERN App)

## 📌 Project Overview

A full-stack Team Task Management application that enables teams to efficiently manage projects, assign tasks, and track progress with role-based access control.

Built using the MERN stack with real-world features like authentication, notifications, and email alerts, this application simulates a production-ready system.

---

## 🛠️ Tech Stack

**Frontend:**

* React (Vite)
* Tailwind CSS

**Backend:**

* Node.js
* Express.js

**Database:**

* MongoDB Atlas

**Authentication:**

* JWT (JSON Web Token)
* bcrypt (Password Hashing)

**Notifications:**

* In-app notification system
* Email alerts using Nodemailer (Gmail SMTP)

---

## ✨ Key Features

### 🔐 Authentication & Security

* User Registration & Login
* JWT-based authentication
* Secure password hashing using bcrypt

### 🧑‍🤝‍🧑 Role-Based Access Control (RBAC)

* **Admin:**

  * Manage projects & tasks
  * Assign tasks
  * View all data
* **Member:**

  * View assigned tasks
  * Update task status

---

### 📁 Project Management

* Create, update, delete projects
* Add/remove team members
* View all projects

---

### ✅ Task Management

* Create and assign tasks
* Track status: Pending / In Progress / Completed
* Set deadlines

---

### 🔔 Smart Notification System

* One-time notifications (no spam)
* Triggered when:

  * Task assigned
  * Added to project
  * Deadline < 24 hours
* Notification bell with unread count

---

### 📧 Email Alerts

* Automated emails for:

  * Task assignment
  * Project addition
  * Deadline reminders
* Implemented using Nodemailer
* Uses secure environment variables

---

### ⏰ Deadline Tracking

* Detects tasks due within 24 hours
* Sends both in-app + email alerts (only once)

---

## 🧠 System Design Highlights

* RESTful API architecture
* Role-based middleware authorization
* Scalable MongoDB schema design
* Efficient notification system with read/unread logic
* Email deduplication using flags

---

## 🔗 API Endpoints

> All protected routes require:
> Authorization: Bearer `<token>`

### 🔐 Auth

* POST `/api/auth/register`
* POST `/api/auth/login`
* GET `/api/auth/me`

### 📁 Projects

* GET `/api/projects`
* POST `/api/projects` (Admin)
* PUT `/api/projects/:id` (Admin)
* DELETE `/api/projects/:id` (Admin)

### ✅ Tasks

* GET `/api/tasks`
* POST `/api/tasks` (Admin)
* PUT `/api/tasks/:id`
* DELETE `/api/tasks/:id` (Admin)

### 🔔 Notifications

* GET `/api/notifications`
* PUT `/api/notifications/:id`
* POST `/api/notifications/check-deadlines`

---

## ⚙️ Installation & Setup

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/team-task-manager.git
cd team-task-manager
```

### 2️⃣ Install Dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

---

### 3️⃣ Environment Variables (.env)

Create `.env` inside backend:

```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret
EMAIL_USER=your_email
EMAIL_PASS=your_app_password
```

---

### 4️⃣ Run Application

**Backend:**

```bash
cd backend
npm run dev
```

**Frontend:**

```bash
cd frontend
npm run dev
```

---

## 🚀 Deployment

* Backend deployed on Railway
* Frontend deployed on Vercel

---

## 🎯 Why This Project Stands Out

* Real-world system design
* Notification system with no spam logic
* Email integration with secure configuration
* Role-based architecture
* Clean UI + scalable backend

---

## 📽️ Demo & Links

* 🔗 Live App: (Add your Railway/Vercel link)
* 🔗 GitHub Repo: (Add link)
* 🎥 Demo Video: (Add drive link)

---
