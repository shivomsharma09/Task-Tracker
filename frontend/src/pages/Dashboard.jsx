import React from 'react';
import { useGetDashboardAnalyticsQuery } from '../store/slices/analyticsApiSlice';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { data, isLoading, isError } = useGetDashboardAnalyticsQuery();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !data) {
    return <div className="text-destructive text-center mt-10">Failed to load analytics</div>;
  }

  const taskData = [
    { name: 'Pending', value: data.pendingTasks, color: '#f59e0b' },
    { name: 'Completed', value: data.completedTasks, color: '#10b981' },
    { name: 'Overdue', value: data.overdueTasks, color: '#ef4444' },
  ];

  const projectData = [
    { name: 'Active', value: data.activeProjects },
    { name: 'Completed', value: data.completedProjects },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-primary">Dashboard Overview</h1>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Projects</h3>
          <div className="text-4xl font-bold text-blue-500">{data.totalProjects}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Active Tasks</h3>
          <div className="text-4xl font-bold text-amber-500">{data.pendingTasks}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Completed Tasks</h3>
          <div className="text-4xl font-bold text-emerald-500">{data.completedTasks}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Overdue Tasks</h3>
          <div className="text-4xl font-bold text-rose-500">{data.overdueTasks}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Distribution Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-6">Task Distribution</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{fill: 'hsl(var(--muted-foreground))'}} />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{fill: 'hsl(var(--muted-foreground))'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                  cursor={{fill: 'hsl(var(--muted))'}}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {taskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity / Projects */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Recent Projects</h3>
          <div className="space-y-4 overflow-y-auto max-h-80 pr-2">
            {data.recentProjects?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No recent projects.</p>
            ) : (
              data.recentProjects?.map((project) => (
                <Link 
                  key={project._id} 
                  to={`/projects/${project._id}`}
                  className="block p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm">{project.title}</h4>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                      project.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' :
                      project.status === 'Completed' ? 'bg-blue-500/10 text-blue-500' :
                      'bg-slate-500/10 text-slate-500'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="w-full bg-border rounded-full h-1.5 mt-2">
                    <div 
                      className="bg-primary h-1.5 rounded-full" 
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </Link>
              ))
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-border text-center">
            <Link to="/projects" className="text-sm text-primary hover:underline font-medium">
              View All Projects
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
