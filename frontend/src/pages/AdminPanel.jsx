import React, { useState } from 'react';
import {
  useGetAdminAnalyticsQuery,
  useGetAdminUsersQuery,
  useGetAdminProjectsQuery,
  useGetOverdueTasksQuery,
  useUpdateUserRoleMutation,
  useDeleteAdminUserMutation,
} from '../store/slices/adminApiSlice';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Loader2, Users, FolderKanban, AlertTriangle, CheckCircle, Trash2, Shield, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const TABS = ['Overview', 'Users', 'Projects', 'Overdue Tasks'];

const AdminPanel = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('Overview');

  const { data: analytics, isLoading: analyticsLoading } = useGetAdminAnalyticsQuery();
  const { data: users, isLoading: usersLoading } = useGetAdminUsersQuery();
  const { data: projects, isLoading: projectsLoading } = useGetAdminProjectsQuery();
  const { data: overdueTasks, isLoading: overdueLoading } = useGetOverdueTasksQuery();

  const [updateRole, { isLoading: isUpdatingRole }] = useUpdateUserRoleMutation();
  const [deleteUser, { isLoading: isDeletingUser }] = useDeleteAdminUserMutation();

  const isQL = userInfo?.role === 'QL';

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateRole({ id: userId, role: newRole }).unwrap();
      toast.success('Role updated');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update role');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Delete user "${userName}"? This cannot be undone.`)) return;
    try {
      await deleteUser(userId).unwrap();
      toast.success('User deleted');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete user');
    }
  };

  if (analyticsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statusChartData = analytics?.tasksByStatus?.map(s => ({
    name: s._id,
    value: s.count
  })) || [];

  const priorityChartData = analytics?.tasksByPriority?.map(p => ({
    name: p._id,
    value: p.count
  })) || [];

  const activityData = analytics?.recentActivity?.map(a => ({
    date: a._id.substring(5),
    tasks: a.count
  })) || [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">Admin Panel</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage users, projects, and tasks across the platform
          </p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium">
          <Shield size={14} />
          {userInfo?.role}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 mb-8 border-b border-border">
        {TABS.map(tab => (
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

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'Overview' && (
        <div>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Users', value: analytics?.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { label: 'Total Projects', value: analytics?.totalProjects, icon: FolderKanban, color: 'text-violet-500', bg: 'bg-violet-500/10' },
              { label: 'Total Tasks', value: analytics?.totalTasks, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Overdue Tasks', value: analytics?.overdueTasks, icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                  <Icon size={22} className={color} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className={`text-3xl font-bold mt-0.5 ${color}`}>{value ?? '—'}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Tasks by Status */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Tasks by Status</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {statusChartData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1 text-xs">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    {entry.name} ({entry.value})
                  </div>
                ))}
              </div>
            </div>

            {/* Tasks by Priority */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Tasks by Priority</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Activity Last 7 Days */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-4">Task Activity (7d)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activityData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                    <Line type="monotone" dataKey="tasks" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── USERS TAB ── */}
      {activeTab === 'Users' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">Team Members ({users?.length || 0})</h3>
            {!isQL && (
              <p className="text-xs text-muted-foreground">Role editing requires Super Admin</p>
            )}
          </div>
          {usersLoading ? (
            <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Role</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Tasks</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Completed</th>
                    {isQL && <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {users?.map((user) => (
                    <tr key={user._id} className="border-t border-border hover:bg-muted/20 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                            {user.name.charAt(0)}
                          </div>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{user.email}</td>
                      <td className="p-4">
                        {isQL && user._id !== userInfo?._id ? (
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                            disabled={isUpdatingRole}
                            className="bg-muted border border-border rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                          >
                            <option value="Tasker">Tasker</option>
                            <option value="QR">QR</option>
                            <option value="QL">QL</option>
                          </select>
                        ) : (
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            user.role === 'QL' ? 'bg-violet-500/10 text-violet-500' :
                            user.role === 'QR' ? 'bg-blue-500/10 text-blue-500' :
                            'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {user.role}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-muted-foreground">{user.taskCount}</td>
                      <td className="p-4">
                        <span className="text-emerald-500 font-medium">{user.completedCount}</span>
                      </td>
                      {isQL && (
                        <td className="p-4">
                          {user._id !== userInfo?._id && (
                            <button
                              onClick={() => handleDeleteUser(user._id, user.name)}
                              disabled={isDeletingUser}
                              className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-destructive/10"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── PROJECTS TAB ── */}
      {activeTab === 'Projects' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">All Projects ({projects?.length || 0})</h3>
          </div>
          {projectsLoading ? (
            <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium text-muted-foreground">Project</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Admin</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Members</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Tasks</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Overdue</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {projects?.map((project) => (
                    <tr key={project._id} className="border-t border-border hover:bg-muted/20 transition-colors">
                      <td className="p-4">
                        <Link to={`/projects/${project._id}`} className="font-medium hover:text-primary transition-colors">
                          {project.title}
                        </Link>
                      </td>
                      <td className="p-4 text-muted-foreground">{project.admin?.name}</td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          project.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' :
                          project.status === 'Completed' ? 'bg-blue-500/10 text-blue-500' :
                          'bg-slate-500/10 text-slate-400'
                        }`}>{project.status}</span>
                      </td>
                      <td className="p-4 text-muted-foreground">{project.members?.length}</td>
                      <td className="p-4 text-muted-foreground">{project.taskCount}</td>
                      <td className="p-4">
                        {project.overdueCount > 0 ? (
                          <span className="text-rose-500 font-medium">{project.overdueCount}</span>
                        ) : (
                          <span className="text-emerald-500">0</span>
                        )}
                      </td>
                      <td className="p-4 w-40">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-border rounded-full h-1.5">
                            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${project.progress}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-8">{project.progress}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── OVERDUE TASKS TAB ── */}
      {activeTab === 'Overdue Tasks' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-500" />
            <h3 className="font-semibold text-rose-500">Overdue Tasks ({overdueTasks?.length || 0})</h3>
          </div>
          {overdueLoading ? (
            <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
          ) : overdueTasks?.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">🎉 No overdue tasks!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium text-muted-foreground">Task</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Project</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Assigned To</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Priority</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Due Date</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Days Overdue</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueTasks?.map((task) => {
                    const daysOverdue = Math.ceil((Date.now() - new Date(task.dueDate)) / (1000 * 60 * 60 * 24));
                    return (
                      <tr key={task._id} className="border-t border-border hover:bg-muted/20 transition-colors">
                        <td className="p-4 font-medium">{task.title}</td>
                        <td className="p-4">
                          <Link to={`/projects/${task.project?._id}`} className="text-primary hover:underline text-xs">
                            {task.project?.title}
                          </Link>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            {task.assignedUsers?.length === 0 ? (
                              <span className="text-muted-foreground text-xs">Unassigned</span>
                            ) : (
                              task.assignedUsers?.map(u => (
                                <span key={u._id} className="text-xs bg-muted px-2 py-0.5 rounded-full">{u.name}</span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            task.priority === 'Critical' || task.priority === 'High' ? 'bg-rose-500/10 text-rose-500' :
                            task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-blue-500/10 text-blue-500'
                          }`}>{task.priority}</span>
                        </td>
                        <td className="p-4 text-muted-foreground text-xs">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <span className="text-rose-500 font-bold">{daysOverdue}d</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
