import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGetProjectByIdQuery } from '../store/slices/projectApiSlice';
import { useGetTasksQuery, useUpdateTaskMutation, useCreateTaskMutation, taskApiSlice } from '../store/slices/taskApiSlice';
import { Loader2, Plus, Send, Image, FileText, X, User } from 'lucide-react';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';

const ENDPOINT = import.meta.env.VITE_API_URL?.replace('/api', '') || "http://localhost:5000";
let socket;

const TASK_STATUSES = ['Todo', 'In Progress', 'Review', 'Completed'];

const ProjectDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);

  const isQL = userInfo?.role === 'QL';
  const isQR = userInfo?.role === 'QR';
  const isTasker = userInfo?.role === 'Tasker';
  const canViewAll = isQL || isQR; // QL + QR see all tasks + submission details

  const { data: project, isLoading: isProjectLoading } = useGetProjectByIdQuery(id);
  const { data: tasks, isLoading: isTasksLoading } = useGetTasksQuery(id);

  const [updateTask] = useUpdateTaskMutation();
  const [createTask, { isLoading: isSubmitting }] = useCreateTaskMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedTask, setExpandedTask] = useState(null);
  const [form, setForm] = useState({ prompt: '', justification: '', imageUrl1: '', imageUrl2: '' });

  useEffect(() => {
    socket = io(ENDPOINT);
    if (userInfo) socket.emit('setup', userInfo);
    socket.emit('join project', id);

    const invalidate = () => dispatch(taskApiSlice.util.invalidateTags([{ type: 'Task', id: `PROJECT_${id}` }]));
    socket.on('task updated', invalidate);
    socket.on('task created', invalidate);
    socket.on('task deleted', invalidate);
    return () => { socket.disconnect(); };
  }, [id, userInfo, dispatch]);

  if (isProjectLoading || isTasksLoading) return (
    <div className="flex justify-center mt-20"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>
  );
  if (!project) return <div className="text-center mt-20 text-muted-foreground">Project not found</div>;

  // Confirm this Tasker is a member
  const isMember = project.members?.some(m => (m._id || m).toString() === userInfo?._id?.toString());

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!form.prompt.trim()) { toast.error('Prompt is required'); return; }
    try {
      await createTask({ projectId: id, data: form }).unwrap();
      toast.success('Work submitted for review! 🎉');
      setIsModalOpen(false);
      setForm({ prompt: '', justification: '', imageUrl1: '', imageUrl2: '' });
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to submit');
    }
  };

  // Drag handlers — only QL can move cards freely; Tasker can drag their own
  const handleDragStart = (e, task) => {
    if (!isQL) {
      const mine = task.assignedUsers?.some(u => (u._id || u)?.toString() === userInfo?._id?.toString());
      if (!mine) { e.preventDefault(); return; }
    }
    e.dataTransfer.setData('taskId', task._id);
  };

  const handleDrop = async (e, newStatus) => {
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    const task = tasks?.find(t => t._id === taskId);
    if (task && task.status !== newStatus) {
      try {
        await updateTask({ id: taskId, projectId: id, data: { status: newStatus } }).unwrap();
        toast.success(`Moved to ${newStatus}`);
      } catch (err) {
        toast.error(err?.data?.message || 'Failed');
      }
    }
  };

  // Tasker: only their tasks. QL/QR: all tasks
  const getColumn = (status) => {
    const col = tasks?.filter(t => t.status === status) || [];
    if (canViewAll) return col;
    return col.filter(t => t.assignedUsers?.some(u => (u._id || u)?.toString() === userInfo?._id?.toString()));
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      {/* ── Header ── */}
      <div className="mb-5 flex justify-between items-start shrink-0 gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-primary truncate">{project.title}</h1>
          <p className="text-muted-foreground text-sm mt-0.5 line-clamp-1">{project.description}</p>

          {/* Member avatars */}
          <div className="flex items-center gap-1 mt-3 flex-wrap">
            <span className="text-xs text-muted-foreground mr-1">Team:</span>
            {project.members?.map(m => (
              <div key={m._id || m}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-background -ml-1 first:ml-0 ${
                  m.role === 'QR' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}
                title={`${m.name} (${m.role})`}>
                {m.name?.charAt(0)}
              </div>
            ))}
            {project.members?.length === 0 && <span className="text-xs text-muted-foreground italic">No members assigned</span>}
          </div>
        </div>

        {/* Tasker: "Submit Work" button — only if they're a project member */}
        {isTasker && isMember && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-emerald-700 transition-colors shrink-0"
          >
            <Send size={15} /> Add Task
          </button>
        )}

        {isTasker && !isMember && (
          <div className="text-xs text-muted-foreground bg-muted/40 border border-border rounded-lg px-3 py-2">
            You are not yet assigned to this project
          </div>
        )}
      </div>

      {/* ── Role hint ── */}
      {canViewAll && (
        <div className="mb-4 text-xs bg-blue-500/5 border border-blue-500/20 text-blue-400 rounded-lg px-3 py-2">
          {isQL ? '👑 QL view — all submitted tasks visible. Drag cards to move status.' : '🔍 QR view — reviewing all Tasker submissions.'}
        </div>
      )}
      {isTasker && isMember && (
        <div className="mb-4 text-xs bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 rounded-lg px-3 py-2">
          ✅ Click <strong>Add Task</strong> to submit your work. Fill in your prompt, justification, and image links.
        </div>
      )}

      {/* ── Kanban ── */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 h-full pb-4" style={{ width: 'max-content', minWidth: '100%' }}>
          {TASK_STATUSES.map(status => (
            <div key={status}
              className="w-80 flex flex-col bg-muted/20 rounded-xl border border-border"
              onDragOver={e => e.preventDefault()}
              onDrop={e => handleDrop(e, status)}
            >
              {/* Column header */}
              <div className="p-4 border-b border-border flex justify-between items-center bg-card rounded-t-xl shrink-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    status === 'Todo' ? 'bg-slate-400' :
                    status === 'In Progress' ? 'bg-blue-500' :
                    status === 'Review' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                  <h3 className="font-semibold text-sm">{status}</h3>
                </div>
                <span className="bg-muted px-2 py-0.5 rounded-full text-xs text-muted-foreground font-medium">
                  {getColumn(status).length}
                </span>
              </div>

              {/* Cards */}
              <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[120px]">
                <AnimatePresence>
                  {getColumn(status).map(task => {
                    const mine = task.assignedUsers?.some(u => (u._id || u)?.toString() === userInfo?._id?.toString());
                    const canDrag = isQL || mine;
                    const isExpanded = expandedTask === task._id;
                    const submitter = task.assignedUsers?.[0];

                    return (
                      <motion.div
                        key={task._id} layout
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        draggable={canDrag}
                        onDragStart={e => handleDragStart(e, task)}
                        className={`bg-card rounded-xl border shadow-sm transition-all ${
                          canDrag ? 'cursor-grab hover:border-primary/40' : 'cursor-default'
                        } ${task.submission?.isSubmitted ? 'border-amber-500/30' : 'border-border'}`}
                      >
                        {/* Card top */}
                        <div className="p-4">
                          {/* Submission badge */}
                          {task.submission?.isSubmitted && (
                            <div className="flex items-center gap-1.5 mb-2">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-medium">
                                Submitted for Review
                              </span>
                            </div>
                          )}

                          {/* Submitter info — shown to QL/QR */}
                          {canViewAll && submitter && (
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                                {submitter.name?.charAt(0)}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">{submitter.name}</span>
                                {task.submission?.submittedAt && (
                                  <span className="ml-1">· {new Date(task.submission.submittedAt).toLocaleDateString()}</span>
                                )}
                              </span>
                            </div>
                          )}

                          {/* Prompt preview */}
                          <p className="text-sm font-medium line-clamp-2 mb-1">
                            {task.submission?.prompt || task.title}
                          </p>

                          {task.submission?.justification && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {task.submission.justification}
                            </p>
                          )}

                          {/* Expand/collapse */}
                          {(task.submission?.isSubmitted && canViewAll) && (
                            <button
                              onClick={() => setExpandedTask(isExpanded ? null : task._id)}
                              className="mt-2 text-xs text-primary hover:underline"
                            >
                              {isExpanded ? '▲ Hide details' : '▼ Review submission'}
                            </button>
                          )}
                        </div>

                        {/* Expanded submission detail — QL/QR only */}
                        <AnimatePresence>
                          {isExpanded && canViewAll && task.submission?.isSubmitted && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden border-t border-border"
                            >
                              <div className="p-4 bg-muted/10 space-y-3">
                                {/* Full prompt */}
                                <div>
                                  <div className="flex items-center gap-1 mb-1">
                                    <FileText size={11} className="text-primary" />
                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Prompt</span>
                                  </div>
                                  <p className="text-xs leading-relaxed bg-card border border-border rounded-lg p-2.5 whitespace-pre-wrap">
                                    {task.submission.prompt}
                                  </p>
                                </div>

                                {/* Justification */}
                                {task.submission.justification && (
                                  <div>
                                    <div className="flex items-center gap-1 mb-1">
                                      <FileText size={11} className="text-violet-500" />
                                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Justification</span>
                                    </div>
                                    <p className="text-xs leading-relaxed bg-card border border-border rounded-lg p-2.5 whitespace-pre-wrap">
                                      {task.submission.justification}
                                    </p>
                                  </div>
                                )}

                                {/* Images */}
                                {task.submission.imageUrls?.length > 0 && (
                                  <div>
                                    <div className="flex items-center gap-1 mb-1">
                                      <Image size={11} className="text-emerald-500" />
                                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                                        Images ({task.submission.imageUrls.length})
                                      </span>
                                    </div>
                                    <div className="flex gap-2">
                                      {task.submission.imageUrls.map((url, i) => (
                                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="group relative">
                                          <img src={url} alt={`Image ${i + 1}`}
                                            className="w-24 h-20 object-cover rounded-lg border border-border group-hover:opacity-80 transition-opacity"
                                            onError={e => { e.target.style.display = 'none'; }}
                                          />
                                          <div className="absolute inset-0 hidden group-hover:flex items-center justify-center text-white text-[10px] bg-black/40 rounded-lg">Open ↗</div>
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Submitted by */}
                                <div className="flex items-center gap-2 pt-1 border-t border-border">
                                  <User size={11} className="text-muted-foreground" />
                                  <span className="text-[10px] text-muted-foreground">
                                    Submitted by <span className="font-semibold text-foreground">{submitter?.name}</span>
                                    {' '}on {new Date(task.submission.submittedAt).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {getColumn(status).length === 0 && (
                  <div className="text-center py-6 text-xs text-muted-foreground/50 border-2 border-dashed border-border/40 rounded-xl">
                    {status === 'Review' && isTasker ? 'Submit work to see it here' : 'No tasks'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Submit Work Modal (Tasker only) ── */}
      {isModalOpen && isTasker && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-border flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold">Add Task</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Submit your work for <span className="text-foreground font-medium">{project.title}</span>.
                  Your QL and QR will see this immediately.
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitWork} className="p-6 space-y-5">
              {/* Prompt */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Prompt <span className="text-rose-500">*</span>
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  The main prompt or instruction you worked on
                </p>
                <textarea
                  required
                  value={form.prompt}
                  onChange={e => setForm(f => ({ ...f, prompt: e.target.value }))}
                  className="w-full p-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary/50 h-28 resize-none"
                  placeholder="E.g., Write a marketing email for product X targeting enterprise clients..."
                />
              </div>

              {/* Justification */}
              <div>
                <label className="block text-sm font-semibold mb-1">Justification</label>
                <p className="text-xs text-muted-foreground mb-2">
                  Explain your approach, decisions, or methodology
                </p>
                <textarea
                  value={form.justification}
                  onChange={e => setForm(f => ({ ...f, justification: e.target.value }))}
                  className="w-full p-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary/50 h-20 resize-none"
                  placeholder="E.g., I used a formal tone because the audience is B2B enterprise..."
                />
              </div>

              {/* Image URL 1 */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  <Image size={13} className="inline mr-1 text-emerald-500" />
                  Image Link 1
                </label>
                <input
                  type="url"
                  value={form.imageUrl1}
                  onChange={e => setForm(f => ({ ...f, imageUrl1: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary/50"
                  placeholder="https://example.com/screenshot1.png"
                />
                {form.imageUrl1 && (
                  <img src={form.imageUrl1} alt="Preview 1" className="mt-2 w-full h-32 object-cover rounded-lg border border-border" onError={e => e.target.style.display = 'none'} />
                )}
              </div>

              {/* Image URL 2 */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  <Image size={13} className="inline mr-1 text-blue-500" />
                  Image Link 2
                </label>
                <input
                  type="url"
                  value={form.imageUrl2}
                  onChange={e => setForm(f => ({ ...f, imageUrl2: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary/50"
                  placeholder="https://example.com/screenshot2.png"
                />
                {form.imageUrl2 && (
                  <img src={form.imageUrl2} alt="Preview 2" className="mt-2 w-full h-32 object-cover rounded-lg border border-border" onError={e => e.target.style.display = 'none'} />
                )}
              </div>

              {/* Auto-assign info */}
              <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-sm font-bold shrink-0">
                  {userInfo?.name?.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium">{userInfo?.name}</p>
                  <p className="text-xs text-muted-foreground">This submission will be linked to your account</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm hover:bg-muted rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting || !form.prompt.trim()}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                  <Send size={14} />
                  {isSubmitting ? 'Submitting...' : 'Submit Work'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
