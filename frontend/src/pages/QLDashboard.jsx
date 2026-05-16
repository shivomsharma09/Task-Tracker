import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetAdminAnalyticsQuery, useGetAdminUsersQuery, useGetAdminProjectsQuery, useGetAdminTasksQuery, useGetOverdueTasksQuery, useUpdateUserRoleMutation, useDeleteAdminUserMutation } from '../store/slices/adminApiSlice';
import { useGetUsersQuery } from '../store/slices/authApiSlice';
import { useCreateProjectMutation, useDeleteProjectMutation, useAddMemberByEmailMutation, useRemoveMemberMutation } from '../store/slices/projectApiSlice';
import { useGetProjectsQuery } from '../store/slices/projectApiSlice';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Loader2, Plus, Trash2, Users, FolderKanban, AlertTriangle, TrendingUp, UserPlus, X, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const QLDashboard = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('Overview');
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [managingProject, setManagingProject] = useState(null);
  const [addEmailInput, setAddEmailInput] = useState('');
  const [newProject, setNewProject] = useState({ title: '', description: '', memberEmails: [] });
  const [newMemberEmailInput, setNewMemberEmailInput] = useState('');

  const { data: analytics } = useGetAdminAnalyticsQuery();
  const { data: users } = useGetAdminUsersQuery();
  const { data: projects, isLoading: projectsLoading } = useGetProjectsQuery();
  const { data: overdueTasks } = useGetOverdueTasksQuery();
  const { data: tasks } = useGetAdminTasksQuery();

  const [updateRole] = useUpdateUserRoleMutation();
  const [deleteUser] = useDeleteAdminUserMutation();
  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
  const [deleteProject] = useDeleteProjectMutation();
  const [addMemberByEmail, { isLoading: isAddingMember }] = useAddMemberByEmailMutation();
  const [removeMember] = useRemoveMemberMutation();

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await createProject(newProject).unwrap();
      toast.success('Project created!');
      setIsProjectModalOpen(false);
      setNewProject({ title: '', description: '', memberEmails: [] });
      setNewMemberEmailInput('');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create project');
    }
  };

  const addEmailToNewProject = () => {
    const email = newMemberEmailInput.trim().toLowerCase();
    if (!email) return;
    if (newProject.memberEmails.includes(email)) { toast.error('Already added'); return; }
    setNewProject(p => ({ ...p, memberEmails: [...p.memberEmails, email] }));
    setNewMemberEmailInput('');
  };

  const handleAddMemberToExisting = async () => {
    const email = addEmailInput.trim();
    if (!email || !managingProject) return;
    try {
      const updated = await addMemberByEmail({ projectId: managingProject._id, email }).unwrap();
      setManagingProject(updated);
      setAddEmailInput('');
      toast.success('Member added!');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed');
    }
  };

  const handleRemoveMember = async (userId, userName) => {
    if (!managingProject) return;
    try {
      const updated = await removeMember({ projectId: managingProject._id, userId }).unwrap();
      setManagingProject(updated);
      toast.success(`${userName} removed`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed');
    }
  };

  const handleRoleChange = async (userId, role) => {
    try { await updateRole({ id: userId, role }).unwrap(); toast.success('Role updated'); }
    catch (err) { toast.error(err?.data?.message || 'Failed'); }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    try { await deleteUser(id).unwrap(); toast.success('User removed'); }
    catch (err) { toast.error('Failed'); }
  };

  const handleDeleteProject = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try { await deleteProject({ id }).unwrap(); toast.success('Deleted'); }
    catch (err) { toast.error('Failed'); }
  };

  const statusData = analytics?.tasksByStatus?.map(s => ({ name: s._id, value: s.count })) || [];
  const priorityData = analytics?.tasksByPriority?.map(p => ({ name: p._id, value: p.count })) || [];
  const activityData = analytics?.recentActivity?.map(a => ({ date: a._id?.substring(5), tasks: a.count })) || [];
  const submittedTasks = (tasks || []).filter(t => t.submission?.isSubmitted);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <span className="text-violet-500 font-bold text-sm">QL</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Quality Lead Console</h1>
            <p className="text-muted-foreground text-sm">Welcome, {userInfo?.name}</p>
          </div>
        </div>
        <button onClick={() => setIsProjectModalOpen(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium text-sm hover:bg-primary/90">
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        {['Overview', 'Projects', 'Team', 'Overdue'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${activeTab === tab ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-muted-foreground hover:bg-muted/50'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'Overview' && (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Users', value: analytics?.totalUsers, color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Users },
              { label: 'Active Projects', value: analytics?.activeProjects, color: 'text-violet-500', bg: 'bg-violet-500/10', icon: FolderKanban },
              { label: 'In Review', value: submittedTasks.length, color: 'text-amber-500', bg: 'bg-amber-500/10', icon: TrendingUp },
              { label: 'Overdue', value: analytics?.overdueTasks, color: 'text-rose-500', bg: 'bg-rose-500/10', icon: AlertTriangle },
            ].map(({ label, value, color, bg, icon: Icon }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}><Icon size={22} className={color} /></div>
                <div><p className="text-xs text-muted-foreground">{label}</p><p className={`text-3xl font-bold ${color}`}>{value ?? '—'}</p></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold mb-4">Tasks by Status</h3>
              <div className="h-48"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">{statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} /></PieChart></ResponsiveContainer></div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold mb-4">Tasks by Priority</h3>
              <div className="h-48"><ResponsiveContainer width="100%" height="100%"><BarChart data={priorityData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} /><XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} /><YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} /><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} /><Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold mb-4">Activity (7 days)</h3>
              <div className="h-48"><ResponsiveContainer width="100%" height="100%"><LineChart data={activityData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} /><XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} /><YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} /><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} /><Line type="monotone" dataKey="tasks" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} /></LineChart></ResponsiveContainer></div>
            </div>
          </div>
        </div>
      )}

      {/* PROJECTS */}
      {activeTab === 'Projects' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setIsProjectModalOpen(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90"><Plus size={14} /> New Project</button>
          </div>
          {projectsLoading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {(projects || []).map(project => (
                <div key={project._id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-colors flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <Link to={`/projects/${project._id}`} className="font-semibold hover:text-primary transition-colors">{project.title}</Link>
                    <div className="flex gap-1 ml-2 shrink-0">
                      <button onClick={() => { setManagingProject(project); setAddEmailInput(''); }} className="p-1.5 text-muted-foreground hover:text-primary transition-colors" title="Manage members"><UserPlus size={14} /></button>
                      <button onClick={() => handleDeleteProject(project._id, project.title)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
                  {/* Member avatars */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {project.members?.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic">No members yet</span>
                    ) : project.members?.map(m => (
                      <div key={m._id} title={`${m.name} (${m.role})`}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-background ${m.role === 'QR' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {m.name?.charAt(0)}
                      </div>
                    ))}
                    <button onClick={() => { setManagingProject(project); setAddEmailInput(''); }}
                      className="w-7 h-7 rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TEAM */}
      {activeTab === 'Team' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>{['Member', 'Email', 'Role', 'Reviewer / Manager', 'Actions'].map(h => <th key={h} className="text-left p-4 font-medium text-muted-foreground">{h}</th>)}</tr>
            </thead>
            <tbody>
              {(users || []).map(user => (
                <tr key={user._id} className="border-t border-border hover:bg-muted/20">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${user.role === 'QL' ? 'bg-violet-500/20 text-violet-500' : user.role === 'QR' ? 'bg-blue-500/20 text-blue-500' : 'bg-emerald-500/20 text-emerald-500'}`}>{user.name.charAt(0)}</div>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground text-xs">{user.email}</td>
                  <td className="p-4">
                    {user._id !== userInfo?._id ? (
                      <select value={user.role} onChange={e => handleRoleChange(user._id, e.target.value)} className="bg-muted border border-border rounded-md px-2 py-1 text-xs focus:outline-none">
                        <option value="Tasker">Tasker</option>
                        <option value="QR">QR</option>
                        <option value="QL">QL</option>
                      </select>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-violet-500/10 text-violet-500 font-medium">{user.role}</span>
                    )}
                  </td>
                  <td className="p-4 text-xs text-muted-foreground">
                    {user.reviewer ? (
                      <span className="flex items-center gap-1"><Mail size={11} />{user.reviewer.name || user.reviewer.email}</span>
                    ) : <span className="text-muted-foreground/40">—</span>}
                  </td>
                  <td className="p-4">
                    {user._id !== userInfo?._id && (
                      <button onClick={() => handleDeleteUser(user._id, user.name)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={13} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* OVERDUE */}
      {activeTab === 'Overdue' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-500" />
            <h3 className="font-semibold text-rose-500">Overdue Tasks ({overdueTasks?.length || 0})</h3>
          </div>
          {!overdueTasks?.length ? (
            <div className="p-10 text-center text-muted-foreground">🎉 No overdue tasks!</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>{['Task', 'Project', 'Assigned To', 'Priority', 'Due Date', 'Days Over'].map(h => <th key={h} className="text-left p-4 font-medium text-muted-foreground">{h}</th>)}</tr>
              </thead>
              <tbody>
                {overdueTasks.map(task => {
                  const days = Math.ceil((Date.now() - new Date(task.dueDate)) / 86400000);
                  return (
                    <tr key={task._id} className="border-t border-border hover:bg-muted/20">
                      <td className="p-4 font-medium">{task.title}</td>
                      <td className="p-4 text-xs"><Link to={`/projects/${task.project?._id}`} className="text-primary hover:underline">{task.project?.title}</Link></td>
                      <td className="p-4 text-xs">{task.assignedUsers?.map(u => <span key={u._id} className="bg-muted px-1.5 py-0.5 rounded-full mr-1">{u.name}</span>)}</td>
                      <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full ${task.priority === 'High' || task.priority === 'Critical' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>{task.priority}</span></td>
                      <td className="p-4 text-xs text-muted-foreground">{new Date(task.dueDate).toLocaleDateString()}</td>
                      <td className="p-4"><span className="text-rose-500 font-bold">{days}d</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-lg font-bold">Create New Project</h2>
              <button onClick={() => setIsProjectModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input required type="text" value={newProject.title} onChange={e => setNewProject(p => ({ ...p, title: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary/50" placeholder="E.g., Q2 Content Review" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <textarea required value={newProject.description} onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))}
                  className="w-full p-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary/50 h-20 resize-none" placeholder="Project goals..." />
              </div>

              {/* Add Taskers by email */}
              <div>
                <label className="block text-sm font-medium mb-1">Assign Team Members by Email</label>
                <div className="flex gap-2">
                  <input type="email" value={newMemberEmailInput} onChange={e => setNewMemberEmailInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addEmailToNewProject())}
                    className="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary/50" placeholder="tasker@company.com" />
                  <button type="button" onClick={addEmailToNewProject}
                    className="h-10 px-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">Add</button>
                </div>
                {newProject.memberEmails.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {newProject.memberEmails.map(em => (
                      <div key={em} className="flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-full text-xs">
                        <Mail size={11} />{em}
                        <button type="button" onClick={() => setNewProject(p => ({ ...p, memberEmails: p.memberEmails.filter(e => e !== em) }))}
                          className="text-muted-foreground hover:text-destructive ml-1"><X size={11} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsProjectModalOpen(false)} className="px-4 py-2 text-sm hover:bg-muted rounded-lg">Cancel</button>
                <button type="submit" disabled={isCreating} className="px-5 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50">
                  {isCreating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE MEMBERS MODAL */}
      {managingProject && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <div>
                <h2 className="font-bold">Manage Members</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{managingProject.title}</p>
              </div>
              <button onClick={() => setManagingProject(null)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Add by email */}
              <div>
                <label className="block text-sm font-medium mb-1">Add Member by Email</label>
                <div className="flex gap-2">
                  <input type="email" value={addEmailInput} onChange={e => setAddEmailInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddMemberToExisting())}
                    className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary/50" placeholder="user@company.com" />
                  <button onClick={handleAddMemberToExisting} disabled={isAddingMember}
                    className="h-9 px-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                    {isAddingMember ? '...' : 'Add'}
                  </button>
                </div>
              </div>
              {/* Current members */}
              <div>
                <p className="text-sm font-medium mb-2">Current Members ({managingProject.members?.length || 0})</p>
                {managingProject.members?.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No members yet</p>
                ) : (
                  <div className="space-y-2">
                    {managingProject.members?.map(m => (
                      <div key={m._id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${m.role === 'QR' ? 'bg-blue-500/20 text-blue-500' : 'bg-emerald-500/20 text-emerald-500'}`}>{m.name?.charAt(0)}</div>
                          <div>
                            <p className="text-sm font-medium">{m.name}</p>
                            <p className="text-xs text-muted-foreground">{m.email} · {m.role}</p>
                          </div>
                        </div>
                        <button onClick={() => handleRemoveMember(m._id, m.name)} className="text-muted-foreground hover:text-destructive transition-colors p-1"><X size={13} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QLDashboard;
