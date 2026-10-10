import React from 'react';
import { SearchX } from 'lucide-react';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-pitstop-border bg-white p-8 sm:p-12 text-center ${className}`}
      {...props}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-pitstop-bg text-pitstop-muted mb-4">
        {icon || <SearchX className="h-7 w-7" />}
      </div>
      <h3 className="text-lg font-bold text-pitstop-charcoal">{title}</h3>
      {description && <p className="mt-2 text-sm text-pitstop-muted max-w-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};
