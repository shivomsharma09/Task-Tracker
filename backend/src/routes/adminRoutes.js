const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllProjects,
  getAllTasks,
  getOverdueTasks,
  getAdminAnalytics
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All admin routes require auth + QL or QR role
router.use(protect);
router.use(authorize('QL', 'QR'));

// User management (QL only)
router.get('/users', getAllUsers);
router.put('/users/:id/role', authorize('QL'), updateUserRole);
router.delete('/users/:id', authorize('QL'), deleteUser);

// Project & Task management (QL + QR can view)
router.get('/projects', getAllProjects);
router.get('/tasks', getAllTasks);
router.get('/tasks/overdue', getOverdueTasks);

// Analytics
router.get('/analytics', getAdminAnalytics);

module.exports = router;

