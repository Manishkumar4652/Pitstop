import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Badge } from './Badge';

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  badge?: string;
  backHref?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  badge,
  backHref,
  action,
  className = '',
  ...props
}) => {
  return (
    <div className={`border-b border-pitstop-border bg-white py-6 sm:py-8 ${className}`} {...props}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {backHref && (
          <Link
            href={backHref}
            className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-pitstop-muted hover:text-pitstop-charcoal transition-colors focus:outline-none focus:ring-2 focus:ring-pitstop-yellow rounded px-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
        )}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-pitstop-charcoal sm:text-3xl">
                {title}
              </h1>
              {badge && <Badge variant="yellow">{badge}</Badge>}
            </div>
            {description && (
              <p className="mt-2 text-sm text-pitstop-muted max-w-3xl">
                {description}
              </p>
            )}
          </div>

          {action && <div className="shrink-0">{action}</div>}
        </div>
      </div>
    </div>
  );
};
