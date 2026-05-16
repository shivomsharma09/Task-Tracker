import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetMyTasksQuery, useSubmitTaskMutation, useUpdateTaskMutation } from '../store/slices/taskApiSlice';
import { Loader2, CheckCircle, Clock, AlertTriangle, Send, Image, FileText, ChevronDown, ChevronUp, X, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['Todo', 'In Progress', 'Review', 'Completed'];

const TaskerDashboard = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const { data: tasks, isLoading } = useGetMyTasksQuery();
  const [submitTask, { isLoading: isSubmitting }] = useSubmitTaskMutation();
  const [updateTask] = useUpdateTaskMutation();

  const [selectedTask, setSelectedTask] = useState(null);
  const [submission, setSubmission] = useState({ prompt: '', justification: '', imageUrls: [] });
  const [newImageUrl, setNewImageUrl] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [expandedTask, setExpandedTask] = useState(null);

  const allTasks = tasks || [];
  const completedCount = allTasks.filter(t => t.status === 'Completed').length;
  const reviewCount = allTasks.filter(t => t.status === 'Review').length;
  const overdueCount = allTasks.filter(t =>
    t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed'
  ).length;

  const filtered = filterStatus === 'All'
    ? allTasks
    : allTasks.filter(t => t.status === filterStatus);

  const openSubmitModal = (task) => {
    setSelectedTask(task);
    setSubmission({
      prompt: task.submission?.prompt || '',
      justification: task.submission?.justification || '',
      imageUrls: task.submission?.imageUrls || []
    });
    setNewImageUrl('');
  };

  const addImageUrl = () => {
    if (!newImageUrl.trim()) return;
    setSubmission(prev => ({ ...prev, imageUrls: [...prev.imageUrls, newImageUrl.trim()] }));
    setNewImageUrl('');
  };

  const removeImageUrl = (index) => {
    setSubmission(prev => ({ ...prev, imageUrls: prev.imageUrls.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async () => {
    if (!submission.prompt.trim()) {
      toast.error('Prompt is required');
      return;
    }
    try {
      await submitTask({
        id: selectedTask._id,
        projectId: selectedTask.project?._id,
        data: submission
      }).unwrap();
      toast.success('Work submitted for review! 🎉');
      setSelectedTask(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Submission failed');
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await updateTask({ id: task._id, projectId: task.project?._id, data: { status: newStatus } }).unwrap();
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update');
    }
  };

  if (isLoading) return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <span className="text-emerald-500 font-bold">T</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">My Workspace</h1>
            <p className="text-muted-foreground text-sm">Welcome back, {userInfo?.name} · Tasker</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Assigned', value: allTasks.length, color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Clock },
          { label: 'In Review', value: reviewCount, color: 'text-amber-500', bg: 'bg-amber-500/10', icon: FileText },
          { label: 'Completed', value: completedCount, color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle },
          { label: 'Overdue', value: overdueCount, color: 'text-rose-500', bg: 'bg-rose-500/10', icon: AlertTriangle },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5">
        {['All', ...STATUS_OPTIONS].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterStatus === s
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Task Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-xl text-muted-foreground">
          {allTasks.length === 0 ? 'No tasks assigned yet — check back soon!' : `No tasks with status "${filterStatus}"`}
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map(task => {
              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Completed';
              const isExpanded = expandedTask === task._id;
              const hasSubmission = task.submission?.isSubmitted;

              return (
                <motion.div
                  key={task._id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-card border rounded-xl overflow-hidden ${
                    isOverdue ? 'border-rose-500/40' : 'border-border'
                  }`}
                >
                  {/* Task row */}
                  <div className="p-5 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-semibold truncate">{task.title}</h4>
                        {isOverdue && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 font-medium shrink-0">Overdue</span>
                        )}
                        {hasSubmission && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-medium shrink-0">Submitted</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <Link to={`/projects/${task.project?._id}`} className="hover:text-primary transition-colors">
                          📁 {task.project?.title}
                        </Link>
                        {task.dueDate && (
                          <span className={isOverdue ? 'text-rose-500' : ''}>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                        )}
                        <span className={`px-1.5 py-0.5 rounded-full font-medium ${
                          task.priority === 'Critical' || task.priority === 'High' ? 'bg-rose-500/10 text-rose-500' :
                          task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-blue-500/10 text-blue-500'
                        }`}>{task.priority}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Status selector */}
                      <select
                        value={task.status}
                        onChange={e => handleStatusChange(task, e.target.value)}
                        className="text-xs px-2 py-1.5 rounded-lg border border-border bg-muted focus:outline-none"
                      >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>

                      {/* Submit Work button */}
                      {task.status !== 'Completed' && (
                        <button
                          onClick={() => openSubmitModal(task)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg text-xs font-medium transition-colors"
                        >
                          <Send size={12} /> {hasSubmission ? 'Edit' : 'Submit'}
                        </button>
                      )}

                      {/* Expand/collapse */}
                      <button
                        onClick={() => setExpandedTask(isExpanded ? null : task._id)}
                        className="p-1.5 text-muted-foreground hover:text-foreground"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded: submission preview */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border overflow-hidden"
                      >
                        <div className="p-5 bg-muted/20">
                          {task.description && (
                            <p className="text-sm text-muted-foreground mb-4">{task.description}</p>
                          )}
                          {hasSubmission ? (
                            <div className="space-y-3">
                              <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your Submission</h5>
                              <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                                <div>
                                  <span className="text-xs text-muted-foreground font-medium">Prompt</span>
                                  <p className="text-sm mt-1">{task.submission.prompt}</p>
                                </div>
                                {task.submission.justification && (
                                  <div>
                                    <span className="text-xs text-muted-foreground font-medium">Justification</span>
                                    <p className="text-sm mt-1">{task.submission.justification}</p>
                                  </div>
                                )}
                                {task.submission.imageUrls?.length > 0 && (
                                  <div>
                                    <span className="text-xs text-muted-foreground font-medium">Images ({task.submission.imageUrls.length})</span>
                                    <div className="flex gap-2 flex-wrap mt-2">
                                      {task.submission.imageUrls.map((url, i) => (
                                        <img key={i} src={url} alt={`Submission ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border border-border" onError={e => e.target.style.display = 'none'} />
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  Submitted {new Date(task.submission.submittedAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">No submission yet. Click "Submit" to add your work.</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Submit Work Modal */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm flex justify-center items-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-border flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold">Submit Work</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{selectedTask.title}</p>
                </div>
                <button onClick={() => setSelectedTask(null)} className="text-muted-foreground hover:text-foreground p-1">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Prompt */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5">
                    Prompt <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-xs text-muted-foreground mb-2">Describe the main prompt or output you worked on</p>
                  <textarea
                    value={submission.prompt}
                    onChange={e => setSubmission(prev => ({ ...prev, prompt: e.target.value }))}
                    className="w-full p-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary/50 h-28 resize-none"
                    placeholder="E.g., Generated a detailed marketing email for product X with personalized sections..."
                  />
                </div>

                {/* Justification */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Justification / Description</label>
                  <p className="text-xs text-muted-foreground mb-2">Explain your approach, decisions, or methodology</p>
                  <textarea
                    value={submission.justification}
                    onChange={e => setSubmission(prev => ({ ...prev, justification: e.target.value }))}
                    className="w-full p-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary/50 h-24 resize-none"
                    placeholder="E.g., I chose a formal tone because the target audience is enterprise clients..."
                  />
                </div>

                {/* Image URLs */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5">
                    <Image size={14} className="inline mr-1" />
                    Image URLs
                  </label>
                  <p className="text-xs text-muted-foreground mb-2">Attach URLs to screenshots, outputs, or relevant images</p>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={e => setNewImageUrl(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
                      className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary/50"
                      placeholder="https://example.com/image.png"
                    />
                    <button
                      type="button"
                      onClick={addImageUrl}
                      className="h-9 px-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {submission.imageUrls.length > 0 && (
                    <div className="space-y-2">
                      {submission.imageUrls.map((url, i) => (
                        <div key={i} className="flex items-center gap-2 bg-muted/30 px-3 py-2 rounded-lg">
                          <Image size={12} className="text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground flex-1 truncate">{url}</span>
                          <button onClick={() => removeImageUrl(i)} className="text-muted-foreground hover:text-destructive shrink-0">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-border flex justify-end gap-3">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !submission.prompt.trim()}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  <Send size={14} />
                  {isSubmitting ? 'Submitting...' : 'Submit Work'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskerDashboard;
