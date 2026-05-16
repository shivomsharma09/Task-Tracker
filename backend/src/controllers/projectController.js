const Project = require('../models/Project');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'QL') {
      // QL sees everything
      query = {};
    } else if (req.user.role === 'QR') {
      // QR sees projects where they're admin or member
      query = { $or: [{ admin: req.user._id }, { members: req.user._id }] };
    } else {
      // Tasker sees only projects they're a member of
      query = { members: req.user._id };
    }

    const projects = await Project.find(query)
      .populate('admin', 'name avatar email')
      .populate('members', 'name avatar email role');

    res.json(projects);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('admin', 'name avatar email')
      .populate('members', 'name avatar email');

    if (project) {
      // Check if user is admin or member
      const isMember = project.members.some(m => m._id.toString() === req.user._id.toString());
      const isAdmin = project.admin._id.toString() === req.user._id.toString();
      
      if (!isMember && !isAdmin && req.user.role !== 'QL') {
        res.status(403);
        throw new Error('Not authorized to access this project');
      }

      res.json(project);
    } else {
      res.status(404);
      throw new Error('Project not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Create a project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res, next) => {
  try {
    const { title, description, deadline, priority, members, memberEmails } = req.body;
    const User = require('../models/User');

    // Resolve member IDs — accept either direct IDs or emails
    let memberIds = members ? [...members] : [];

    if (memberEmails && memberEmails.length > 0) {
      const emailUsers = await User.find({
        email: { $in: memberEmails.map(e => e.toLowerCase()) }
      }).select('_id email');

      const notFound = memberEmails.filter(
        em => !emailUsers.find(u => u.email === em.toLowerCase())
      );
      if (notFound.length > 0) {
        res.status(400);
        throw new Error(`Users not found for emails: ${notFound.join(', ')}`);
      }

      // Merge without duplicates
      emailUsers.forEach(u => {
        if (!memberIds.includes(u._id.toString())) {
          memberIds.push(u._id);
        }
      });
    }

    const project = new Project({
      title,
      description,
      deadline,
      priority,
      members: memberIds,
      admin: req.user._id
    });

    const created = await project.save();
    const populated = await Project.findById(created._id)
      .populate('admin', 'name avatar email')
      .populate('members', 'name avatar email role');

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }

};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (project) {
      if (project.admin.toString() !== req.user._id.toString() && req.user.role !== 'QL') {
        res.status(403);
        throw new Error('Not authorized to update this project');
      }

      const { title, description, status, priority, progress, deadline, members } = req.body;

      project.title = title || project.title;
      project.description = description || project.description;
      project.status = status || project.status;
      project.priority = priority || project.priority;
      project.progress = progress !== undefined ? progress : project.progress;
      project.deadline = deadline || project.deadline;
      project.members = members || project.members;

      const updatedProject = await project.save();
      res.json(updatedProject);
    } else {
      res.status(404);
      throw new Error('Project not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (project) {
      if (project.admin.toString() !== req.user._id.toString() && req.user.role !== 'QL') {
        res.status(403);
        throw new Error('Not authorized to delete this project');
      }

      await project.deleteOne();
      res.json({ message: 'Project removed' });
    } else {
      res.status(404);
      throw new Error('Project not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Add a member to a project by email (QL only)
// @route   POST /api/projects/:id/members
// @access  Private (QL)
const addMemberByEmail = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const { email } = req.body;

    if (!email) {
      res.status(400);
      throw new Error('Email is required');
    }

    const userToAdd = await User.findOne({ email: email.toLowerCase() });
    if (!userToAdd) {
      res.status(404);
      throw new Error(`No user found with email: ${email}`);
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    if (project.admin.toString() !== req.user._id.toString() && req.user.role !== 'QL') {
      res.status(403);
      throw new Error('Not authorized');
    }

    const alreadyMember = project.members.some(m => m.toString() === userToAdd._id.toString());
    if (alreadyMember) {
      res.status(400);
      throw new Error(`${userToAdd.name} is already a member of this project`);
    }

    project.members.push(userToAdd._id);
    await project.save();

    const updated = await Project.findById(project._id)
      .populate('admin', 'name avatar email')
      .populate('members', 'name avatar email role');

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a member from a project (QL only)
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private (QL)
const removeMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    if (project.admin.toString() !== req.user._id.toString() && req.user.role !== 'QL') {
      res.status(403);
      throw new Error('Not authorized');
    }

    project.members = project.members.filter(m => m.toString() !== req.params.userId);
    await project.save();

    const updated = await Project.findById(project._id)
      .populate('admin', 'name avatar email')
      .populate('members', 'name avatar email role');

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMemberByEmail,
  removeMember
};
