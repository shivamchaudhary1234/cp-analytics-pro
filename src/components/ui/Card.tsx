import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, className, hover = false, glow = false, onClick, style }) => (
  <div
    onClick={onClick}
    style={style}
    className={cn(
      'glass-card',
      hover && 'glass-card-hover cursor-pointer',
      glow && 'animate-pulse-glow',
      onClick && 'cursor-pointer',
      className
    )}
  >
    {children}
  </div>
);

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, icon, action, className }) => (
  <div className={cn('flex items-center justify-between mb-4', className)}>
    <div className="flex items-center gap-3">
      {icon && (
        <div className="w-9 h-9 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center text-accent-cyan">
          {icon}
        </div>
      )}
      <div>
        <h3 className="font-semibold text-text-primary text-sm">{title}</h3>
        {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action && <div>{action}</div>}
  </div>
);

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  color?: 'cyan' | 'purple' | 'green' | 'orange' | 'red';
  trend?: 'up' | 'down' | 'stable';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, sub, icon, color = 'cyan', trend, className }) => {
  const colorMap = {
    cyan: { bg: 'bg-accent-cyan/10', border: 'border-accent-cyan/20', text: 'text-accent-cyan' },
    purple: { bg: 'bg-accent-purple/10', border: 'border-accent-purple/20', text: 'text-accent-purple' },
    green: { bg: 'bg-accent-green/10', border: 'border-accent-green/20', text: 'text-accent-green' },
    orange: { bg: 'bg-accent-orange/10', border: 'border-accent-orange/20', text: 'text-accent-orange' },
    red: { bg: 'bg-accent-red/10', border: 'border-accent-red/20', text: 'text-accent-red' },
  }[color];

  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const trendColor = trend === 'up' ? 'text-accent-green' : trend === 'down' ? 'text-accent-red' : 'text-text-secondary';

  return (
    <div className={cn('stat-card animate-fade-in', className)}>
      <div className="flex items-start justify-between">
        {icon && (
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border', colorMap.bg, colorMap.border, colorMap.text)}>
            {icon}
          </div>
        )}
        {trend && <span className={cn('text-sm font-medium', trendColor)}>{trendIcon}</span>}
      </div>
      <div className="mt-2">
        <div className="text-2xl font-bold text-text-primary">{value}</div>
        <div className="text-xs text-text-secondary mt-0.5">{label}</div>
        {sub && <div className="text-xs text-text-muted mt-1">{sub}</div>}
      </div>
    </div>
  );
};
