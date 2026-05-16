const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMemberByEmail,
  removeMember
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getProjects)
  .post(protect, authorize('QL'), createProject);

router.route('/:id')
  .get(protect, getProjectById)
  .put(protect, authorize('QL'), updateProject)
  .delete(protect, authorize('QL'), deleteProject);

// Member management by email
router.post('/:id/members', protect, authorize('QL'), addMemberByEmail);
router.delete('/:id/members/:userId', protect, authorize('QL'), removeMember);

module.exports = router;
