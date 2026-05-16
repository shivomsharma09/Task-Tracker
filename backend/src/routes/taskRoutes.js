const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  submitTask,
  getMyTasks
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/authMiddleware');

// /api/projects/:projectId/tasks
router.route('/')
  .get(protect, getTasks)
  .post(protect, createTask); // QL assigns to anyone; Tasker auto-assigns to self

// /api/tasks/my-tasks — must be before /task/:id
router.get('/my-tasks', protect, getMyTasks);

// /api/tasks/task/:id
router.route('/task/:id')
  .put(protect, updateTask)
  .delete(protect, authorize('QL'), deleteTask);

// /api/tasks/task/:id/submit
router.put('/task/:id/submit', protect, submitTask);

module.exports = router;

