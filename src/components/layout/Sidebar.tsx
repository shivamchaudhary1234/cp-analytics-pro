import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, User, Swords, GitCompare, Trophy,
  Target, LogOut, ChevronLeft, ChevronRight, Code2, Bell
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../../lib/utils';

interface NavItemDef {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}

const navItems: NavItemDef[] = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/profile', icon: <User size={18} />, label: 'Profile' },
  { to: '/battle', icon: <Swords size={18} />, label: 'Battle Arena', badge: 'LIVE' },
  { to: '/compare', icon: <GitCompare size={18} />, label: 'Compare' },
  { to: '/leaderboard', icon: <Trophy size={18} />, label: 'Leaderboard' },
  { to: '/goals', icon: <Target size={18} />, label: 'Goals & Streaks' },
];

interface SidebarProps {
  onSignOut: () => void;
  userName?: string;
  userEmail?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ onSignOut, userName, userEmail }) => {
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const navigate = useNavigate();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 ease-in-out',
        'border-r border-border-default',
        sidebarOpen ? 'w-64' : 'w-16',
      )}
      style={{ background: 'rgba(13, 17, 23, 0.97)', backdropFilter: 'blur(12px)' }}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-border-default', !sidebarOpen && 'justify-center px-0')}>
        <div className="w-9 h-9 rounded-xl bg-gradient-cyan-purple flex items-center justify-center flex-shrink-0 shadow-glow-cyan">
          <Code2 size={18} className="text-white" />
        </div>
        {sidebarOpen && (
          <div className="animate-fade-in">
            <h1 className="text-sm font-bold gradient-text leading-tight">CP Analytics</h1>
            <p className="text-xs text-text-muted">Pro</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto no-scrollbar">
        {navItems.map(({ to, icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn('nav-item', isActive && 'active', !sidebarOpen && 'justify-center px-0 py-3')
            }
            title={!sidebarOpen ? label : undefined}
          >
            <span className="flex-shrink-0">{icon}</span>
            {sidebarOpen && (
              <span className="flex-1 animate-fade-in">{label}</span>
            )}
            {sidebarOpen && badge && (
              <span className="badge-red text-[10px] px-1.5 py-0.5 animate-fade-in">{badge}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + collapse */}
      <div className="border-t border-border-default p-2 space-y-1">
        {sidebarOpen && userName && (
          <button
            onClick={() => navigate('/profile')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-bg-hover transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-cyan-purple flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="text-left overflow-hidden animate-fade-in">
              <div className="text-sm font-medium text-text-primary truncate">{userName}</div>
              <div className="text-xs text-text-muted truncate">{userEmail}</div>
            </div>
          </button>
        )}
        <button
          onClick={onSignOut}
          className={cn('nav-item w-full text-accent-red hover:bg-accent-red/10', !sidebarOpen && 'justify-center')}
          title="Sign out"
        >
          <LogOut size={16} />
          {sidebarOpen && <span className="animate-fade-in">Sign Out</span>}
        </button>
        <button
          onClick={toggleSidebar}
          className={cn('nav-item w-full', !sidebarOpen && 'justify-center')}
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          {sidebarOpen && <span className="animate-fade-in text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  );
};

interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const Topbar: React.FC<TopbarProps> = ({ title, subtitle, actions }) => {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border-default sticky top-0 z-30"
      style={{ background: 'rgba(13, 17, 23, 0.9)', backdropFilter: 'blur(12px)' }}>
      <div>
        <h2 className="text-lg font-bold text-text-primary">{title}</h2>
        {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <button className="btn-ghost p-2 rounded-lg relative" aria-label="Notifications" id="notifications-btn">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
        </button>
      </div>
    </header>
  );
};
