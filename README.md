<h1 align="center">Schedulix — Smart College Timetable Management System</h1>

<p align="center">
  Schedulix is a full-stack, AI-assisted college timetable generator and management portal. It utilizes a powerful MERN stack architecture integrated with Python-driven constraint solving (OR-Tools) to automatically generate optimal academic schedules that prevent teacher overlaps, adhere to spatial constraints, and instantly broadcast updates to hundreds of concurrent users.
</p>

# 🚀 Comprehensive Feature List

### 🧠 AI-Powered Constraint Engine
* **Algorithm Integration**: Directly integrates the powerful **Google OR-Tools** (CP-SAT optimization solver) in Python via Node.js `child_process`.
* **Zero-Conflict Guarantee**: Mathematically guarantees no overlapping rooms or teachers across concurrent academic departments.
* **Intelligent Break Handling**: Automatically reserves system-wide break slots and spreads workloads evenly without stressing available facility resources.

### 👑 Admin Dashboard (The Nerve Center)
* **Role-Based Access Control (RBAC)**: Secure routing locked behind `JWT` authentication. Only verified administrators can access the workspace.
* **Master Entity Management**: Full CRUD (Create, Read, Update, Delete) dashboards for managing Teachers, Subjects, Rooms, and System Users.
* **One-Click Generation**: AI triggers generate the schedule quietly in the background, gracefully handling user errors like insufficient datasets with detailed toasts.
* **Interactive Drag-&-Drop**: Native HTML5 Drag and Drop architecture enables Admins to physically pick up and seamlessly swap or move class blocks straight from the grid UI.
* **Timetable Lookup & Deletion**: Instantly search for generated timetables and wipe them from the database globally if revisions are needed.

### ⚡ Live Auto-Sync WebSockets
* **Bi-Directional Core**: The entire system is connected through a live `Socket.io` feed.
* **Zero-Refresh UI Updates**: Whenever an Admin creates, updates, or deletes a timetable, the Node server emits targeted WebSocket events. Student and Faculty browsers instantly invalidate their `React Query` caches, visually refreshing their grids in real-time without ever clicking reload.

### 🎓 Public Student Portal
* **Barrier-Free Access**: An open, beautifully designed public portal where students can search by Department, Semester, and Section.
* **State Persistence**: Form inputs utilize standard HTTP concepts combined with `sessionStorage` so students never lose their active search queries upon accidentally refreshing the page.

### 👨‍🏫 Private Faculty Dashboard
* **Dynamic Personalization**: Teachers can seamlessly log securely into their own isolated portal.
* **Cross-Department Parsing**: The system instantly aggregates and filters their personalized class schedule across *every* department and semester they teach for, outputting a unified grid automatically.

### 🖥️ High-Performance Frontend Architecture
* **React Query v5 Engine**: Aggressive query caching, background data refetching, and graceful loading states ensure an application that feels native and instantaneous.
* **Client-Side PDF Exports**: Built-in `jsPDF` and `html2canvas` engines allow users to download high-resolution offline PDF copies of their schedule without pinging or stressing the server costs.
* **Glassmorphism UI System**: A stunning, modern, dark-mode focused interface built with TailwindCSS, featuring floating interactive toast notifications and fully fluid mobile-responsiveness.

### 🗄️ Database Integrity & Resilience
* **Mongoose Relational Schemas**: Efficient, normalized document references reliably connect active Timetables to discrete Subjects, Rooms, and Teachers.
* **"Ghost Validation" Logic**: Complex cascading architectures rigorously prevent orphaned Timetables from crashing the frontend UI if a referenced Teacher or Room is suddenly deleted by an Admin.

---

## 💻 Tech Stack
* **Frontend**: React.js, TailwindCSS, React Query v5, Socket.io-client, React Router Dom
* **Backend**: Node.js, Express.js, MongoDB + Mongoose, Socket.io
* **Algorithm Engine**: Python 3, Google OR-Tools (`cp_model`)

## 🛠 Local Installation

1. Clone this repository.
2. Provide a `.env` in the `backend/` folder:
```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
PYTHON_PATH=python
```
3. Provide a `.env` in the `frontend/` folder:
```env
VITE_API_URL=http://localhost:5001
```
4. Install dependencies:
```bash
cd backend && npm install
pip install -r requirements.txt
cd ../frontend && npm install
```
5. **(Optional)** Seed the database with dummy initial data: `cd backend && node seed.js`
6. Run both development servers independently: `cd backend && npm run dev` / `cd frontend && npm run dev`.

## 🌍 Production Full-Stack Build
Schedulix supports a native, unified local deployment where Node seamlessly serves the minified React Single-Page Application:
1. Ensure `.env` specifies `SERVE_STATIC=true` in `/backend`.
2. Build the Vite Frontend: `cd frontend && npm run build`
3. Launch via Node: `cd backend && npm run dev`
4. Access the full application on `http://localhost:5001`.