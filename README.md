# TaskFlow Pro — QA Workflow Platform

A production-ready, full-stack Quality Assurance workflow platform built on the MERN stack. Designed for teams with **Quality Leads (QL)**, **Quality Reviewers (QR)**, and **Taskers** — each with their own dashboard, permissions, and workflow.

---

## 🚀 Live Demo

> Deploy instructions below. Run locally with the steps in [Getting Started](#getting-started).

---

## ✨ Features

### 🔐 Role-Based Access Control
Three distinct roles — each with their own dashboard and capabilities:

| Role | Access Level | Capabilities |
|------|-------------|-------------|
| **QL** (Quality Lead) | Full platform control | Create projects, assign Taskers by email, view all tasks & analytics, manage team roles |
| **QR** (Quality Reviewer) | Review & oversight | Review Tasker submissions, monitor team progress, view all project tasks |
| **Tasker** | Execution | View assigned projects, submit work (prompt + justification + images) |

### 📋 Project Management (QL Only)
- Create and delete projects
- Assign team members by **email address**
- Add/remove members from existing projects via a member management modal
- QL sees all projects on the platform regardless of assignment

### ✅ Task Submission System (Tasker)
Taskers submit work directly inside their assigned project with:
- **Prompt** — the main AI prompt or task output (required)
- **Justification** — explanation of approach and methodology
- **Image Link 1** — screenshot or output image URL (with live preview)
- **Image Link 2** — second screenshot or supporting image (with live preview)

Every submission is auto-assigned to the Tasker and immediately goes to **"Review"** status. QL and QR are notified in real-time via Socket.io.

### 🔍 Submission Review (QR + QL)
- View all submitted tasks in the Kanban board grouped by status
- Expand any task card to see the full submission:
  - Submitter name and timestamp
  - Full prompt text
  - Justification
  - Image previews with links
- QR "Taskers" tab shows only their linked team members (those who registered with the QR's email)

### 📊 Analytics (QL Console)
- Tasks by status (doughnut chart)
- Tasks by priority (bar chart)
- Activity over the last 7 days (line chart)
- KPI cards: Users, Active Projects, In Review, Overdue

### 🔗 Tasker ↔ QR Linkage
During sign-up, Taskers can enter their **QR Reviewer's email** to link their account. The QR then sees all linked Taskers in their "My Team" tab with performance metrics.

### ⚡ Real-Time Updates
- Socket.io broadcasts all task events (`task created`, `task updated`, `task deleted`) to the project room
- RTK Query cache auto-invalidates so dashboards refresh without page reload

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js + Express | REST API server |
| MongoDB + Mongoose | Database & ODM |
| Socket.io | Real-time events |
| JWT | Authentication |
| bcryptjs | Password hashing |

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 + Vite | UI framework |
| Redux Toolkit + RTK Query | State management & API caching |
| Tailwind CSS v4 | Styling |
| Framer Motion | Animations |
| Recharts | Analytics charts |
| React Router v6 | Client-side routing |
| React Hook Form + Zod | Form validation |
| React Hot Toast | Notifications |

---

## 📁 Project Structure

```
task-tracking/
├── backend/
│   └── src/
│       ├── controllers/
│       │   ├── authController.js      # Register (with reviewer linkage), Login
│       │   ├── projectController.js   # CRUD + addMemberByEmail + removeMember
│       │   ├── taskController.js      # Tasker submission flow
│       │   ├── adminController.js     # QL/QR analytics & management
│       │   └── analyticsController.js
│       ├── middleware/
│       │   └── authMiddleware.js      # protect + authorize(roles)
│       ├── models/
│       │   ├── User.js                # roles: QL | QR | Tasker, reviewer field
│       │   ├── Task.js                # submission subdoc (prompt/justification/imageUrls)
│       │   └── Project.js
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── projectRoutes.js       # Member management by email
│       │   ├── taskRoutes.js          # Tasker-only creation, submission
│       │   └── adminRoutes.js
│       └── server.js                  # Express + Socket.io entry point
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Sidebar.jsx            # Role-aware nav with colored badges
│       │   └── Topbar.jsx
│       ├── layouts/
│       │   ├── MainLayout.jsx
│       │   └── AuthLayout.jsx
│       ├── pages/
│       │   ├── QLDashboard.jsx        # Analytics, Projects, Team, Overdue
│       │   ├── QRDashboard.jsx        # Submissions, All Tasks, My Team, Projects
│       │   ├── TaskerDashboard.jsx    # My tasks + personal submission history
│       │   ├── ProjectDetail.jsx      # Kanban board + Submit Work modal
│       │   ├── Projects.jsx           # Project listing
│       │   ├── Login.jsx
│       │   └── Register.jsx           # Role selector + QR email linkage
│       ├── store/
│       │   └── slices/
│       │       ├── taskApiSlice.js
│       │       ├── projectApiSlice.js # addMemberByEmail, removeMember
│       │       ├── adminApiSlice.js
│       │       └── authApiSlice.js
│       └── App.jsx                    # Role-based route guard & dashboard routing
```

---

## 🔑 Role Permissions Reference

### QL (Quality Lead)
- ✅ Create / delete projects
- ✅ Assign team members by email
- ✅ Remove members from projects
- ✅ Change any user's role
- ✅ View all tasks and submissions across all projects
- ✅ View platform analytics
- ✅ Delete users
- ❌ Create tasks (Taskers do that via submission)

### QR (Quality Reviewer)
- ✅ View all tasks in assigned projects
- ✅ Read full submission details (prompt, justification, images, submitter)
- ✅ See their linked Tasker team
- ✅ Monitor Tasker performance metrics
- ❌ Create/delete projects
- ❌ Create tasks

### Tasker
- ✅ View their assigned projects
- ✅ Submit work (prompt + justification + 2 image links)
- ✅ Update status of their own tasks
- ✅ Link to a QR Reviewer at sign-up
- ❌ See other Taskers' work
- ❌ Create/edit projects

---

## 🚦 API Endpoints

### Auth
```
POST   /api/auth/register      Register with role (+ optional reviewerEmail for Taskers)
POST   /api/auth/login
GET    /api/auth/profile
GET    /api/auth/users
```

### Projects (QL only for mutations)
```
GET    /api/projects                    Get projects (role-filtered)
POST   /api/projects                    Create project [QL]
GET    /api/projects/:id
PUT    /api/projects/:id                [QL]
DELETE /api/projects/:id                [QL]
POST   /api/projects/:id/members        Add member by email [QL]
DELETE /api/projects/:id/members/:uid   Remove member [QL]
```

### Tasks
```
GET    /api/projects/:id/tasks          Get project tasks
POST   /api/projects/:id/tasks          Submit work [Tasker only]
PUT    /api/tasks/task/:id              Update task status [QL, QR, Tasker-own]
DELETE /api/tasks/task/:id              Delete task [QL]
GET    /api/tasks/my-tasks              Get own tasks [Tasker]
```

### Admin (QL + QR)
```
GET    /api/admin/users
PUT    /api/admin/users/:id/role        [QL]
DELETE /api/admin/users/:id             [QL]
GET    /api/admin/projects
GET    /api/admin/tasks
GET    /api/admin/tasks/overdue
GET    /api/admin/analytics
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas)
- Git

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/task-tracking.git
cd task-tracking
```

### 2. Backend setup
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/taskflow
JWT_SECRET=your_super_secret_jwt_key_here
```

Start backend:
```bash
npm run dev
```

### 3. Frontend setup
```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**  
Backend runs on **http://localhost:5000**

---

## 👥 User Roles — Sign-Up Guide

1. **Register as QL** → get full platform access
2. **Register as QR** → note your email (share it with Taskers)
3. **Register as Tasker** → optionally enter your QR's email to link to their team

---

## 📸 Key Screens

| Screen | Description |
|--------|-------------|
| **QL Console** | Analytics charts, project management, team role editing, overdue tracker |
| **QR Review Dashboard** | Submission queue with expandable prompt/justification/image review |
| **Tasker Project View** | Kanban board + "Add Task" modal with prompt, justification, 2 image inputs |
| **Register** | Role selector cards (QL / QR / Tasker) with QR email linkage for Taskers |

---

## 🔒 Security

- JWT-based authentication with HTTP-only tokens
- Role-based middleware (`authorize(...roles)`) on all sensitive routes
- Backend enforces: only Taskers can create tasks, only QL can mutate projects
- UI hides features based on role (defence-in-depth)

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m 'Add your feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
