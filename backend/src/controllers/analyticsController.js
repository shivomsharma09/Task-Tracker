const Project = require('../models/Project');
const Task = require('../models/Task');

// @desc    Get dashboard analytics
// @route   GET /api/analytics
// @access  Private
const getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Projects stats
    const projects = await Project.find({
      $or: [{ admin: userId }, { members: userId }]
    });

    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'Active').length;
    const completedProjects = projects.filter(p => p.status === 'Completed').length;

    // Tasks stats
    const projectIds = projects.map(p => p._id);
    const tasks = await Task.find({ project: { $in: projectIds } });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'Todo' || t.status === 'In Progress').length;
    const overdueTasks = tasks.filter(t => t.status === 'Overdue' || (t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed')).length;

    // Recent activity (Last 5 projects created or updated)
    const recentProjects = await Project.find({
      $or: [{ admin: userId }, { members: userId }]
    }).sort({ updatedAt: -1 }).limit(5);

    res.json({
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      recentProjects
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalytics
};
