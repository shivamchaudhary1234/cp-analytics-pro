import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar, Topbar } from './Sidebar';
import { useAppStore } from '../../store/useAppStore';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../ui';
import { cn } from '../../lib/utils';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Your competitive programming overview' },
  '/profile': { title: 'Profile', subtitle: 'Manage your account and handles' },
  '/battle': { title: 'Battle Arena', subtitle: 'Challenge other coders in real-time' },
  '/compare': { title: 'Compare', subtitle: 'Head-to-head stats comparison' },
  '/leaderboard': { title: 'Leaderboard', subtitle: 'Global rankings' },
  '/goals': { title: 'Goals & Streaks', subtitle: 'Track your progress and consistency' },
};

export const AppLayout: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const { sidebarOpen, profile } = useAppStore();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-cyan-purple flex items-center justify-center shadow-glow-cyan">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <LoadingSpinner />
          <p className="text-text-secondary text-sm">Loading CP Analytics Pro...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth/login" replace />;

  const pageInfo = PAGE_TITLES[location.pathname] ?? { title: 'CP Analytics Pro', subtitle: '' };

  return (
    <div className="flex min-h-screen bg-bg-primary">
      <Sidebar
        onSignOut={signOut}
        userName={profile?.name ?? user.email}
        userEmail={user.email}
      />
      <main className={cn('flex-1 flex flex-col min-h-screen transition-all duration-300', sidebarOpen ? 'ml-64' : 'ml-16')}>
        <Topbar title={pageInfo.title} subtitle={pageInfo.subtitle} />
        <div className="flex-1 p-6 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
