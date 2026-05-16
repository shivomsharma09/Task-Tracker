import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';

const Topbar = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 z-10 backdrop-blur-md bg-card/80">
      <div className="flex items-center gap-4">
        {/* Search placeholder */}
        <div className="relative hidden md:block">
          <input 
            type="text" 
            placeholder="Search tasks, projects..." 
            className="w-64 h-9 bg-muted/50 border-none rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
            {userInfo?.name?.charAt(0) || 'U'}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium leading-none">{userInfo?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground mt-1">{userInfo?.role || 'Team Member'}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="text-sm text-muted-foreground hover:text-destructive transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Topbar;
