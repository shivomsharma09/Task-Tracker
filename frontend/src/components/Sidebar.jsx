import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Shield, Users,
  AlertTriangle, Eye, LogOut, Send
} from 'lucide-react';

const NavItem = ({ to, icon: Icon, label, end = false }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-all ${
        isActive
          ? 'bg-primary/15 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`
    }
  >
    <Icon size={17} />
    {label}
  </NavLink>
);

const ROLE_CONFIG = {
  QL: {
    label: 'Quality Lead',
    abbr: 'QL',
    colorClass: 'bg-violet-500/20 text-violet-400',
    badgeClass: 'text-violet-500',
    nav: [
      { to: '/', icon: LayoutDashboard, label: 'QL Console', end: true },
      { to: '/projects', icon: FolderKanban, label: 'Projects' },
      { to: '/qr', icon: Eye, label: 'Review Board' },
    ]
  },
  QR: {
    label: 'Quality Reviewer',
    abbr: 'QR',
    colorClass: 'bg-blue-500/20 text-blue-400',
    badgeClass: 'text-blue-500',
    nav: [
      { to: '/', icon: LayoutDashboard, label: 'Review Dashboard', end: true },
      { to: '/projects', icon: FolderKanban, label: 'Projects' },
    ]
  },
  Tasker: {
    label: 'Tasker',
    abbr: 'T',
    colorClass: 'bg-emerald-500/20 text-emerald-400',
    badgeClass: 'text-emerald-500',
    nav: [
      { to: '/', icon: CheckSquare, label: 'My Tasks', end: true },
      { to: '/projects', icon: FolderKanban, label: 'Projects' },
    ]
  }
};

const Sidebar = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const role = userInfo?.role || 'Tasker';
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.Tasker;

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-border">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            TF
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground leading-none">TaskFlow <span className="text-primary">Pro</span></h1>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">{config.label}</p>
          </div>
        </Link>
      </div>

      {/* Role badge */}
      <div className="px-4 pt-4 pb-2">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config.colorClass} text-xs font-semibold`}>
          <span className="w-5 h-5 rounded-md bg-current/20 flex items-center justify-center text-[10px]">{config.abbr}</span>
          {config.label}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest px-3 mb-2">Navigation</p>

        {config.nav.map(({ to, icon, label, end }) => (
          <NavItem key={to} to={to} icon={icon} label={label} end={end} />
        ))}

        {/* QL-only shortcuts */}
        {role === 'QL' && (
          <>
            <div className="pt-3 pb-1">
              <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest px-3 mb-2">Management</p>
            </div>
            <NavItem to="/ql" icon={Shield} label="Full Console" />
            <NavItem to="/admin" icon={Users} label="Team Manager" />
          </>
        )}

        {/* QR-only shortcuts */}
        {role === 'QR' && (
          <>
            <div className="pt-3 pb-1">
              <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest px-3 mb-2">Review</p>
            </div>
            <NavItem to="/qr" icon={Eye} label="Submissions" />
          </>
        )}

        {/* Tasker-only */}
        {role === 'Tasker' && (
          <>
            <div className="pt-3 pb-1">
              <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest px-3 mb-2">My Work</p>
            </div>
            <NavItem to="/my-tasks" icon={Send} label="Submit Work" />
          </>
        )}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${config.colorClass}`}>
            {userInfo?.name?.charAt(0) || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{userInfo?.name}</p>
            <p className={`text-xs font-medium ${config.badgeClass}`}>{role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-destructive/10"
            title="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
