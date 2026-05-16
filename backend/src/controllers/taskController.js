const Task = require('../models/Task');
const Project = require('../models/Project');

// @desc    Get all tasks for a project
// @route   GET /api/projects/:projectId/tasks
// @access  Private
const getTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignedUsers', 'name avatar')
      .populate('comments.user', 'name avatar');
    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a task
// @route   POST /api/projects/:projectId/tasks
// @access  Private
const createTask = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    // Only Taskers create tasks (via work submission)
    // QL manages projects/members — not tasks directly
    if (req.user.role !== 'Tasker') {
      res.status(403);
      throw new Error('Only Taskers can submit tasks. QL manages projects, not tasks.');
    }

    const isMember = project.members.some(m => m.toString() === req.user._id.toString());
    if (!isMember) {
      res.status(403);
      throw new Error('You must be a member of this project to submit work');
    }

    const { prompt, justification, imageUrl1, imageUrl2 } = req.body;
    if (!prompt || !prompt.trim()) {
      res.status(400);
      throw new Error('Prompt is required');
    }

    const imageUrls = [imageUrl1, imageUrl2].filter(u => u && u.trim());

    const task = new Task({
      title: `Submission by ${req.user.name}`,
      description: prompt,
      project: req.params.projectId,
      priority: 'Medium',
      status: 'Review',
      assignedUsers: [req.user._id],
      submission: {
        prompt: prompt.trim(),
        justification: justification ? justification.trim() : '',
        imageUrls,
        isSubmitted: true,
        submittedAt: new Date()
      }
    });

    const saved = await task.save();
    const populated = await Task.findById(saved._id)
      .populate('assignedUsers', 'name avatar email role reviewer');

    // Real-time: notify entire project room (QL + QR see it instantly)
    if (req.io) {
      req.io.to(req.params.projectId).emit('task created', populated);
    }

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    const isAdmin = req.user.role === 'QL' || req.user.role === 'QR';
    const isAssigned = task.assignedUsers.some(
      (uid) => uid.toString() === req.user._id.toString()
    );

    // Members can only update their own tasks, and only the status field
    if (!isAdmin && !isAssigned) {
      res.status(403);
      throw new Error('Not authorized to update this task');
    }

    const { title, description, priority, status, dueDate, assignedUsers } = req.body;

    if (isAdmin) {
      task.title = title || task.title;
      task.description = description !== undefined ? description : task.description;
      task.priority = priority || task.priority;
      task.dueDate = dueDate || task.dueDate;
      task.assignedUsers = assignedUsers || task.assignedUsers;
    }
    // All users (including members) can update status
    task.status = status || task.status;

    const updatedTask = await task.save();

    if (req.io) {
      req.io.to(task.project.toString()).emit('task updated', updatedTask);
    }

    res.json(updatedTask);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    const projectId = task.project;
    await task.deleteOne();

    if (req.io) {
      req.io.to(projectId.toString()).emit('task deleted', req.params.id);
    }

    res.json({ message: 'Task removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Tasker submits work on a task
// @route   PUT /api/tasks/task/:id/submit
// @access  Private (Tasker assigned to task)
const submitTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    const isAssigned = task.assignedUsers.some(
      (uid) => uid.toString() === req.user._id.toString()
    );

    if (!isAssigned && req.user.role !== 'QL') {
      res.status(403);
      throw new Error('Not authorized to submit this task');
    }

    const { prompt, justification, imageUrls } = req.body;

    task.submission = {
      prompt: prompt || '',
      justification: justification || '',
      imageUrls: imageUrls || [],
      submittedAt: new Date(),
      isSubmitted: true
    };
    task.status = 'Review'; // auto-move to review on submission

    const updatedTask = await task.save();

    if (req.io) {
      req.io.to(task.project.toString()).emit('task updated', updatedTask);
    }

    res.json(updatedTask);
  } catch (error) {
    next(error);
  }
};

// @desc    Get tasks assigned to current user (Tasker view)
// @route   GET /api/tasks/my-tasks
// @access  Private
const getMyTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ assignedUsers: req.user._id })
      .populate('project', 'title status')
      .populate('assignedUsers', 'name avatar role')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  submitTask,
  getMyTasks
};
