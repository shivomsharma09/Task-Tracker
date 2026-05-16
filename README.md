# TaskFlow Pro — QA Workflow Platform

A full-stack Quality Assurance platform built with the MERN stack. Three distinct roles — **QL**, **QR**, and **Tasker** — each with their own dashboard and permissions.

🔗 **Backend:** Railway · **Frontend:** Railway · **DB:** MongoDB Atlas

---

## Roles & Permissions

| | QL (Quality Lead) | QR (Quality Reviewer) | Tasker |
|--|--|--|--|
| Create/delete projects | ✅ | ❌ | ❌ |
| Assign members by email | ✅ | ❌ | ❌ |
| Submit work (prompt + images) | ❌ | ❌ | ✅ |
| Review submissions | ✅ | ✅ | ❌ |
| View all tasks | ✅ | ✅ | Own only |
| Manage team roles | ✅ | ❌ | ❌ |
| Analytics dashboard | ✅ | ❌ | ❌ |

---

## How It Works

1. **QL** creates a project and assigns Taskers/QRs by email
2. **Tasker** opens their assigned project → clicks **Add Task** → fills in:
   - Prompt (required)
   - Justification
   - Image Link 1 + Image Link 2
3. Submission instantly appears on the **Kanban board** for QL and QR (via Socket.io)
4. **QR** expands any task card to review the full submission with submitter name + timestamp

**Tasker ↔ QR linkage:** During sign-up, Taskers enter their QR's email — they appear in the QR's "My Team" tab automatically.

---

## Tech Stack

**Backend:** Node.js, Express, MongoDB, Mongoose, Socket.io, JWT  
**Frontend:** React 18, Vite, Redux Toolkit (RTK Query), Tailwind CSS v4, Framer Motion, Recharts

---

## Local Setup

```bash
# Clone
git clone https://github.com/shivomsharma09/Task-Tracker.git
cd Task-Tracker
```

**Backend**
```bash
cd backend
npm install
# Create backend/.env:
#   MONGO_URI=mongodb+srv://...
#   JWT_SECRET=your_secret
#   NODE_ENV=development
npm run dev        # runs on :5000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev        # runs on :5173
```

---

## Deployment

### Backend → Railway
- Connect GitHub repo, set **Root Directory** = `backend`
- Add variables: `MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`

### Frontend → Railway
- Add a second service, set **Root Directory** = `frontend`
- Add variable: `VITE_API_URL=https://your-backend.up.railway.app/api`

### MongoDB Atlas
- Create free M0 cluster → **Network Access** → allow `0.0.0.0/0`
- Copy connection string → URL-encode special chars in password (e.g. `@` → `%40`)

---

## API Reference

```
POST  /api/auth/register          # role: QL | QR | Tasker (+ reviewerEmail for Taskers)
POST  /api/auth/login

GET   /api/projects               # role-filtered
POST  /api/projects               # QL only
POST  /api/projects/:id/members   # add by email (QL only)
DELETE /api/projects/:id/members/:uid

POST  /api/projects/:id/tasks     # Tasker only — creates work submission
PUT   /api/tasks/task/:id         # update status
GET   /api/tasks/my-tasks         # Tasker's own tasks

GET   /api/admin/analytics        # QL/QR
GET   /api/admin/users
PUT   /api/admin/users/:id/role   # QL only
```

---

## License
MIT
