import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'purple' | 'green' | 'orange' | 'red' | 'gray' | 'yellow';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'cyan', className }) => {
  const variantClass = {
    cyan: 'badge-cyan',
    purple: 'badge-purple',
    green: 'badge-green',
    orange: 'badge-orange',
    red: 'badge-red',
    gray: 'badge bg-text-muted/10 text-text-secondary border border-text-muted/20',
    yellow: 'badge bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/20',
  }[variant];

  return <span className={cn(variantClass, className)}>{children}</span>;
};

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn('animate-spin rounded-full border-2 border-accent-cyan/20 border-t-accent-cyan', sizes[size])} />
    </div>
  );
};

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showPercent?: boolean;
  color?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, label, showPercent = true, color, className }) => (
  <div className={cn('flex flex-col gap-1.5', className)}>
    {(label || showPercent) && (
      <div className="flex justify-between text-xs">
        {label && <span className="text-text-secondary">{label}</span>}
        {showPercent && <span className="text-text-primary font-medium">{Math.round(value)}%</span>}
      </div>
    )}
    <div className="progress-bar">
      <div
        className="progress-fill"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, ...(color ? { background: color } : {}) }}
      />
    </div>
  </div>
);

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, lines = 1 }) => (
  <div className="flex flex-col gap-2">
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className={cn('skeleton h-4 rounded', className)} />
    ))}
  </div>
);

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon = '📭', title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
    <div className="text-5xl">{icon}</div>
    <div>
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      {description && <p className="text-sm text-text-secondary mt-1 max-w-xs">{description}</p>}
    </div>
    {action}
  </div>
);

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, className }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative glass-card w-full max-w-md p-6 animate-slide-up', className)}>
        {title && (
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
            <button onClick={onClose} className="btn-ghost p-1 rounded-lg" aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => (
  <div className="relative group inline-flex">
    {children}
    <div className="tooltip -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none absolute">
      {content}
    </div>
  </div>
);
