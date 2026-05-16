const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a task title']
  },
  description: {
    type: String,
    default: ''
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  assignedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Todo', 'In Progress', 'Review', 'Testing', 'Completed', 'Overdue'],
    default: 'Todo'
  },
  attachments: [{
    url: String,
    name: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  dueDate: {
    type: Date
  },
  activityLogs: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    action: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  submission: {
    prompt: { type: String, default: '' },
    justification: { type: String, default: '' },
    imageUrls: { type: [String], default: [] },
    submittedAt: { type: Date },
    isSubmitted: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Task', TaskSchema);
