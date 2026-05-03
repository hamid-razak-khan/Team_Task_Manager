# 🚀 Team Task Manager (Full-Stack MERN App)

## 📌 Project Overview

A full-stack Team Task Management SaaS application that enables organizations to efficiently manage projects, assign tasks, and track progress with role-based access control.

Built using the MERN stack with advanced production-ready features like **real-time Socket.io messaging**, **live performance analytics**, **Cloudinary file attachments**, and **automated email alerts** using a decoupled background process architecture.

---

## 🛠️ Tech Stack

**Frontend:**
* React (Vite)
* Tailwind CSS
* Recharts (Analytics Data Visualization)
* Socket.io-client (Real-time WebSockets)

**Backend:**
* Node.js & Express.js
* Socket.io (WebSocket Server)
* Brevo (Sendinblue) Transactional Email API (Asynchronous Email Processing)

**Database & Cloud:**
* MongoDB Atlas (Mongoose & Aggregation Pipelines)
* Cloudinary (Secure File & Image Storage)
* JWT (JSON Web Token)
* bcrypt (Password Hashing)

---

## ✨ Key Features

### 🔐 Authentication, Security & Workspaces
* User Registration & Login via JWT
* Organization-based tenant isolation (users are grouped by organization)
* Token-based email invitations for onboarding new team members
* Secure, cross-origin cookie handling (SameSite=None, Secure=true)

### 💬 Real-Time Direct Messaging (Socket.io)
* Instant messaging between members of shared projects/tasks
* Live typing indicators and real-time read/unread badge counts
* Dedicated inbox for active conversations

### 📊 Performance Analytics & Leaderboard
* MongoDB Aggregation pipelines calculate live productivity scores
* Recharts-powered graphical dashboard tracking completed vs overdue tasks
* Gamified Productivity Leaderboard to track top team performers

### 📁 Advanced Task & Project Management
* Create, update, delete projects and manage team access
* Assign tasks, set strict deadlines, and track status (Pending / In Progress / Completed)
* **File Attachments:** Users can securely upload and attach files (images, PDFs) directly to tasks using Cloudinary.

### 🔔 Smart Notification System (Decoupled & Non-Blocking)
* In-app notification bell with unread message counts
* Instant automated emails for Task Assignments, Project Additions, and Deadline reminders
* Highly performant: Email dispatching runs entirely in the background thread, ensuring instant <50ms UI feedback
* Cron-job integration for detecting tasks due within 24 hours

---

## 🔗 API Endpoints Structure

> All protected routes require HttpOnly JWT Cookies

### 🔐 Auth & Organization
* `POST /api/auth/register`
* `POST /api/auth/login`
* `GET  /api/auth/me`
* `POST /api/auth/logout`
* `GET  /api/auth/users` (Fetch all users in the same organization)
* `POST /api/auth/forgot-password` (Send password reset link via email)
* `POST /api/auth/reset-password` (Reset password using token)
* `POST /api/invite` (Admin Only: Send email invites)

### 📁 Projects & Tasks
* `GET, POST, PUT, DELETE /api/projects`
* `GET, POST, PUT, DELETE /api/tasks`

### 💬 Chat & Messages
* `GET, POST /api/chats` (Fetch/Create conversation threads)
* `GET, POST /api/messages/:chatId` (Fetch/Send messages)

### 📊 Analytics & Uploads
* `GET  /api/analytics` (Fetch leaderboard & chart data)
* `POST /api/upload` (Upload task attachments via Cloudinary)

### 🔔 Notifications
* `GET, PUT /api/notifications`
* `POST /api/notifications/check-deadlines` (Triggered via cron)

---

## ⚙️ Installation & Setup

### 1️⃣ Clone Repository

```bash
git clone https://github.com/hamid-razak-khan/Team_Task_Manager.git
cd Team_Task_Manager
```

### 2️⃣ Install Dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 3️⃣ Environment Variables (.env)

Create `.env` inside `backend/`:

```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret
BREVO_API_KEY=your_brevo_api_key
EMAIL_USER=your_verified_sender_email
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=http://localhost:5173
```

### 4️⃣ Run Application Locally

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

* **Backend:** Ready for deployment on Railway (Uses `origin: true` CORS for dynamic routing)
* **Frontend:** Ready for deployment on Vercel (Includes `vercel.json` for React Router SPA support)

---

## 🎯 Why This Project Stands Out

* **Non-Blocking Architecture:** Heavy tasks like transactional emails (via Brevo API) are handled asynchronously to prevent UI freezing.
* **Complex Data Aggregation:** Uses native MongoDB aggregations for real-time analytics.
* **Full-Duplex Communication:** Integrates Socket.io efficiently alongside traditional REST endpoints.
* **Enterprise Features:** Role-based access, organizational isolation, and token-based email onboarding.

---

## 📽️ Links

* 🔗 **Live App:** https://team-task-manager-chi-one.vercel.app/
* 🔗 **GitHub Repo:** https://github.com/hamid-razak-khan/Team_Task_Manager
