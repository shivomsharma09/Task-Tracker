import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useSelector } from 'react-redux';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import TaskerDashboard from './pages/TaskerDashboard';
import QRDashboard from './pages/QRDashboard';
import QLDashboard from './pages/QLDashboard';
import MyTasks from './pages/MyTasks';
import NotFound from './pages/NotFound';

/**
 * Route guard: redirect to login if unauthenticated.
 * QL/QR roles also get access to admin panel.
 */
function RoleRoute({ allowedRoles, children }) {
  const { userInfo } = useSelector((state) => state.auth);
  if (!userInfo) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(userInfo.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

/**
 * Redirect the root "/" to the correct dashboard per role.
 */
function RoleDashboard() {
  const { userInfo } = useSelector((state) => state.auth);
  if (!userInfo) return <Navigate to="/login" replace />;
  switch (userInfo.role) {
    case 'QL': return <QLDashboard />;
    case 'QR': return <QRDashboard />;
    case 'Tasker':
    default:   return <TaskerDashboard />;
  }
}

function App() {
  const { userInfo } = useSelector((state) => state.auth);

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Protected Routes — all share MainLayout */}
        <Route
          path="/"
          element={userInfo ? <MainLayout /> : <Navigate to="/login" />}
        >
          {/* Role-based home dashboard */}
          <Route index element={<RoleDashboard />} />

          {/* Projects (QL + QR can view all; Tasker sees assigned via project controller) */}
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />

          {/* My Tasks — Tasker personal view */}
          <Route path="my-tasks" element={<TaskerDashboard />} />

          {/* QL-only routes */}
          <Route
            path="ql"
            element={<RoleRoute allowedRoles={['QL']}><QLDashboard /></RoleRoute>}
          />

          {/* QR-only routes */}
          <Route
            path="qr"
            element={<RoleRoute allowedRoles={['QR', 'QL']}><QRDashboard /></RoleRoute>}
          />

          {/* Legacy admin panel (QL + QR) */}
          <Route
            path="admin"
            element={<RoleRoute allowedRoles={['QL', 'QR']}><QLDashboard /></RoleRoute>}
          />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
