import React, { useState } from 'react';
import { useGetProjectsQuery, useCreateProjectMutation } from '../store/slices/projectApiSlice';
import { useGetUsersQuery } from '../store/slices/authApiSlice';
import { Link } from 'react-router-dom';
import { Loader2, Plus, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';

const Projects = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const { data: projects, isLoading, isError } = useGetProjectsQuery();
  const { data: users, isLoading: isUsersLoading } = useGetUsersQuery();
  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '', members: [] });

  const isAdmin = userInfo?.role === 'QL';

  if (isLoading) return <div className="flex justify-center mt-20"><Loader2 className="animate-spin text-primary" /></div>;
  if (isError) return <div className="text-center mt-20 text-destructive">Error loading projects</div>;

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createProject(newProject).unwrap();
      toast.success('Project created');
      setIsModalOpen(false);
      setNewProject({ title: '', description: '', members: [] });
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create project');
    }
  };

  const handleMemberToggle = (userId) => {
    setNewProject(prev => {
      if (prev.members.includes(userId)) {
        return { ...prev, members: prev.members.filter(id => id !== userId) };
      }
      return { ...prev, members: [...prev.members, userId] };
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary">Projects</h1>
        {isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors font-medium"
          >
            <Plus size={18} /> New Project
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects?.map(project => (
          <Link key={project._id} to={`/projects/${project._id}`} className="block group">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md hover:border-primary/50 transition-all h-full flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{project.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  project.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' :
                  project.status === 'Completed' ? 'bg-blue-500/10 text-blue-500' :
                  'bg-slate-500/10 text-slate-500'
                }`}>
                  {project.status}
                </span>
              </div>
              
              <p className="text-muted-foreground text-sm line-clamp-2 mb-6 flex-1">
                {project.description}
              </p>

              <div className="mt-auto">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                  <Calendar size={14} />
                  <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                  <span className="ml-auto bg-muted px-2 py-1 rounded-md">{project.members.length} members</span>
                </div>
                
                <div className="w-full bg-border rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                <div className="text-right text-xs mt-1 text-muted-foreground">{project.progress}%</div>
              </div>
            </div>
          </Link>
        ))}
        {projects?.length === 0 && (
          <div className="col-span-full text-center py-20 text-muted-foreground">
            No projects found. {isAdmin ? 'Create one to get started!' : 'Wait for an admin to assign you to a project.'}
          </div>
        )}
      </div>

      {/* Modal for creating project */}
      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-card border border-border p-6 rounded-xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Project</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input 
                  type="text" 
                  required
                  value={newProject.title}
                  onChange={e => setNewProject({...newProject, title: e.target.value})}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-primary/50"
                  placeholder="E.g., Website Redesign"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  required
                  value={newProject.description}
                  onChange={e => setNewProject({...newProject, description: e.target.value})}
                  className="w-full p-3 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-primary/50 h-24 resize-none"
                  placeholder="Project details..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Assign Team Members</label>
                <div className="space-y-2 border border-border p-3 rounded-md max-h-40 overflow-y-auto bg-muted/20">
                  {isUsersLoading ? (
                    <div className="text-xs text-muted-foreground">Loading users...</div>
                  ) : users?.map(user => (
                    <label key={user._id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-muted rounded">
                      <input 
                        type="checkbox" 
                        checked={newProject.members.includes(user._id)}
                        onChange={() => handleMemberToggle(user._id)}
                        className="rounded border-input text-primary focus:ring-primary"
                      />
                      <span className="text-sm">{user.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{user.role}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isCreating}
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
