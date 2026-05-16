import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetAdminTasksQuery, useGetAdminProjectsQuery, useGetAdminUsersQuery } from '../store/slices/adminApiSlice';
import { Loader2, CheckCircle, Eye, Image, FileText, ChevronDown, ChevronUp, Users, FolderKanban } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const QRDashboard = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const { data: tasks, isLoading: tasksLoading } = useGetAdminTasksQuery();
  const { data: projects, isLoading: projectsLoading } = useGetAdminProjectsQuery();
  const { data: users } = useGetAdminUsersQuery();

  const [activeTab, setActiveTab] = useState('Submissions');
  const [expandedTask, setExpandedTask] = useState(null);
  const [filterProject, setFilterProject] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const allTasks = tasks || [];
  const submittedTasks = allTasks.filter(t => t.submission?.isSubmitted);

  // Taskers who registered with this QR's email as their reviewer
  const myTeam = (users || []).filter(u =>
    u.role === 'Tasker' && (
      u.reviewer?._id === userInfo?._id ||
      u.reviewer === userInfo?._id ||
      (typeof u.reviewer === 'object' && u.reviewer?._id?.toString() === userInfo?._id?.toString())
    )
  );

  const filteredTasks = allTasks
    .filter(t => filterProject === 'All' || t.project?._id === filterProject)
    .filter(t => filterStatus === 'All' || t.status === filterStatus);


  if (tasksLoading || projectsLoading) return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <span className="text-blue-500 font-bold">QR</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Review Dashboard</h1>
            <p className="text-muted-foreground text-sm">Welcome back, {userInfo?.name} · Quality Reviewer</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Tasks', value: allTasks.length, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Submitted for Review', value: submittedTasks.length, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Completed', value: allTasks.filter(t => t.status === 'Completed').length, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'My Team (Taskers)', value: myTeam.length, color: 'text-violet-500', bg: 'bg-violet-500/10' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center font-bold ${color} text-lg`}>
              {value}
            </div>
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        {['Submissions', 'All Tasks', 'Taskers', 'Projects'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab
                ? 'bg-primary/10 text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── SUBMISSIONS TAB ── */}
      {activeTab === 'Submissions' && (
        <div>
          {submittedTasks.length === 0 ? (
            <div className="text-center py-20 bg-card border border-border rounded-xl text-muted-foreground">
              No task submissions yet. Taskers haven't submitted work.
            </div>
          ) : (
            <div className="space-y-3">
              {submittedTasks.map(task => {
                const isExpanded = expandedTask === task._id;
                return (
                  <motion.div
                    key={task._id}
                    layout
                    className="bg-card border border-border rounded-xl overflow-hidden"
                  >
                    {/* Header row */}
                    <div className="p-5 flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-semibold">{task.title}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            task.status === 'Review' ? 'bg-amber-500/10 text-amber-500' :
                            task.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' :
                            'bg-muted text-muted-foreground'
                          }`}>{task.status}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            task.priority === 'Critical' || task.priority === 'High' ? 'bg-rose-500/10 text-rose-500' :
                            task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-blue-500/10 text-blue-500'
                          }`}>{task.priority}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <Link to={`/projects/${task.project?._id}`} className="hover:text-primary">
                            📁 {task.project?.title}
                          </Link>
                          <span>
                            Assigned to: {task.assignedUsers?.map(u => u.name).join(', ') || 'Unassigned'}
                          </span>
                          <span>Submitted {new Date(task.submission?.submittedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setExpandedTask(isExpanded ? null : task._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Eye size={12} /> {isExpanded ? 'Collapse' : 'Review'}
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    </div>

                    {/* Expanded submission review */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-border overflow-hidden"
                        >
                          <div className="p-6 bg-muted/10 space-y-5">
                            {/* Prompt */}
                            <div className="bg-card border border-border rounded-xl p-5">
                              <div className="flex items-center gap-2 mb-3">
                                <FileText size={14} className="text-primary" />
                                <span className="text-sm font-semibold">Submitted Prompt</span>
                              </div>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{task.submission.prompt}</p>
                            </div>

                            {/* Justification */}
                            {task.submission.justification && (
                              <div className="bg-card border border-border rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-3">
                                  <FileText size={14} className="text-violet-500" />
                                  <span className="text-sm font-semibold">Justification / Description</span>
                                </div>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{task.submission.justification}</p>
                              </div>
                            )}

                            {/* Images */}
                            {task.submission.imageUrls?.length > 0 && (
                              <div className="bg-card border border-border rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-3">
                                  <Image size={14} className="text-emerald-500" />
                                  <span className="text-sm font-semibold">Submitted Images ({task.submission.imageUrls.length})</span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {task.submission.imageUrls.map((url, i) => (
                                    <div key={i} className="group relative">
                                      <img
                                        src={url}
                                        alt={`Image ${i + 1}`}
                                        className="w-full h-28 object-cover rounded-lg border border-border"
                                        onError={e => {
                                          e.target.style.display = 'none';
                                          e.target.nextSibling.style.display = 'flex';
                                        }}
                                      />
                                      <div className="hidden w-full h-28 rounded-lg border border-border bg-muted items-center justify-center text-xs text-muted-foreground flex-col gap-1">
                                        <Image size={16} />
                                        <span className="text-center px-2 truncate w-full">{url.split('/').pop()}</span>
                                      </div>
                                      <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center text-white text-xs font-medium transition-opacity"
                                      >
                                        Open ↗
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Task details */}
                            {task.description && (
                              <div className="text-xs text-muted-foreground">
                                <span className="font-medium">Task Brief: </span>{task.description}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── ALL TASKS TAB ── */}
      {activeTab === 'All Tasks' && (
        <div>
          <div className="flex gap-3 mb-4 flex-wrap">
            <select
              value={filterProject}
              onChange={e => setFilterProject(e.target.value)}
              className="h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none"
            >
              <option value="All">All Projects</option>
              {projects?.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none"
            >
              <option value="All">All Statuses</option>
              {['Todo', 'In Progress', 'Review', 'Completed'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {['Task', 'Project', 'Assigned To', 'Status', 'Priority', 'Submitted', 'Due'].map(h => (
                    <th key={h} className="text-left p-4 font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map(task => (
                  <tr key={task._id} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-medium max-w-[200px] truncate">{task.title}</td>
                    <td className="p-4 text-muted-foreground text-xs">{task.project?.title}</td>
                    <td className="p-4 text-xs">
                      {task.assignedUsers?.map(u => (
                        <span key={u._id} className="bg-muted px-1.5 py-0.5 rounded-full mr-1">{u.name}</span>
                      ))}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        task.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' :
                        task.status === 'Review' ? 'bg-amber-500/10 text-amber-500' :
                        task.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-muted text-muted-foreground'
                      }`}>{task.status}</span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        task.priority === 'Critical' || task.priority === 'High' ? 'bg-rose-500/10 text-rose-500' :
                        task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>{task.priority}</span>
                    </td>
                    <td className="p-4 text-xs">
                      {task.submission?.isSubmitted ? (
                        <span className="text-emerald-500 font-medium">✓ Yes</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TASKERS TAB ── */}
      {activeTab === 'Taskers' && (
        <div>
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-400">
            👥 Showing Taskers who linked your email during sign-up. To add more, have them register with your email as their QR Reviewer.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {myTeam.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-card border border-border rounded-xl">
                <div className="text-4xl mb-3">👥</div>
                <p className="font-semibold mb-1">No Taskers linked yet</p>
                <p className="text-sm text-muted-foreground">When Taskers sign up and enter your email as their QR Reviewer, they'll appear here.</p>
                <p className="text-xs text-muted-foreground mt-2">Your email: <span className="font-mono text-primary">{userInfo?.email}</span></p>
              </div>
            ) : myTeam.map(tasker => {
              const taskerTasks = allTasks.filter(t => t.assignedUsers?.some(u => u._id === tasker._id || u._id?.toString() === tasker._id?.toString()));
              const submitted = taskerTasks.filter(t => t.submission?.isSubmitted).length;
              const completed = taskerTasks.filter(t => t.status === 'Completed').length;
              const pct = taskerTasks.length > 0 ? Math.round((completed / taskerTasks.length) * 100) : 0;
              return (
                <div key={tasker._id} className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">{tasker.name.charAt(0)}</div>
                    <div>
                      <p className="font-medium">{tasker.name}</p>
                      <p className="text-xs text-muted-foreground">{tasker.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div className="bg-muted/30 rounded-lg p-2"><p className="text-lg font-bold text-blue-500">{taskerTasks.length}</p><p className="text-[10px] text-muted-foreground">Assigned</p></div>
                    <div className="bg-muted/30 rounded-lg p-2"><p className="text-lg font-bold text-amber-500">{submitted}</p><p className="text-[10px] text-muted-foreground">Submitted</p></div>
                    <div className="bg-muted/30 rounded-lg p-2"><p className="text-lg font-bold text-emerald-500">{completed}</p><p className="text-[10px] text-muted-foreground">Done</p></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Completion</span><span>{pct}%</span></div>
                    <div className="w-full bg-border rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} /></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PROJECTS TAB ── */}
      {activeTab === 'Projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(projects || []).map(project => (
            <Link key={project._id} to={`/projects/${project._id}`}>
              <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 hover:shadow-md transition-all h-full">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold">{project.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    project.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' :
                    project.status === 'Completed' ? 'bg-blue-500/10 text-blue-500' :
                    'bg-muted text-muted-foreground'
                  }`}>{project.status}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{project.description}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <span>{project.taskCount} tasks</span>
                  <span>{project.members?.length} members</span>
                  {project.overdueCount > 0 && (
                    <span className="text-rose-500">{project.overdueCount} overdue</span>
                  )}
                </div>
                <div className="w-full bg-border rounded-full h-1.5">
                  <div className="bg-primary h-1.5 rounded-full" style={{ width: `${project.progress}%` }} />
                </div>
                <p className="text-right text-xs text-muted-foreground mt-1">{project.progress}%</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default QRDashboard;
