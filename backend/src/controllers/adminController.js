const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');

// @desc    Admin: Get all users with stats
// @route   GET /api/admin/users
// @access  Admin+
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    
    // Attach task count per user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const taskCount = await Task.countDocuments({ assignedUsers: user._id });
      const completedCount = await Task.countDocuments({ assignedUsers: user._id, status: 'Completed' });
      return {
        ...user.toObject(),
        taskCount,
        completedCount
      };
    }));
    
    res.json(usersWithStats);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Super Admin only
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (!['QL', 'QR', 'Tasker'].includes(role)) {
      res.status(400);
      throw new Error('Invalid role. Use QL, QR, or Tasker');
    }

    user.role = role;
    await user.save();

    res.json({ message: `User role updated to ${role}`, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Super Admin only
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      res.status(400);
      throw new Error('Cannot delete yourself');
    }
    await user.deleteOne();
    res.json({ message: 'User removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get all projects
// @route   GET /api/admin/projects
// @access  Admin+
const getAllProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({})
      .populate('admin', 'name avatar role')
      .populate('members', 'name avatar role')
      .sort({ createdAt: -1 });
    
    const projectsWithStats = await Promise.all(projects.map(async (project) => {
      const taskCount = await Task.countDocuments({ project: project._id });
      const completedCount = await Task.countDocuments({ project: project._id, status: 'Completed' });
      const overdueCount = await Task.countDocuments({
        project: project._id,
        dueDate: { $lt: new Date() },
        status: { $ne: 'Completed' }
      });
      return {
        ...project.toObject(),
        taskCount,
        completedCount,
        overdueCount
      };
    }));
    
    res.json(projectsWithStats);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get all tasks with full population
// @route   GET /api/admin/tasks
// @access  Admin+
const getAllTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({})
      .populate('project', 'title')
      .populate('assignedUsers', 'name avatar role')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get overdue tasks
// @route   GET /api/admin/tasks/overdue
// @access  Admin+
const getOverdueTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({
      dueDate: { $lt: new Date() },
      status: { $nin: ['Completed'] }
    })
      .populate('project', 'title')
      .populate('assignedUsers', 'name avatar')
      .sort({ dueDate: 1 });
    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get platform analytics
// @route   GET /api/admin/analytics
// @access  Admin+
const getAdminAnalytics = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProjects = await Project.countDocuments();
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'Completed' });
    const overdueTasks = await Task.countDocuments({
      dueDate: { $lt: new Date() },
      status: { $nin: ['Completed'] }
    });
    const activeProjects = await Project.countDocuments({ status: 'Active' });
    
    // Task breakdown by status
    const tasksByStatus = await Task.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Tasks by priority
    const tasksByPriority = await Task.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // Recent activity: tasks created last 7 days per day
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await Task.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalUsers,
      totalProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      activeProjects,
      tasksByStatus,
      tasksByPriority,
      recentActivity
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllProjects,
  getAllTasks,
  getOverdueTasks,
  getAdminAnalytics
};
