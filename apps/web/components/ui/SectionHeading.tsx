import React from 'react';

export interface SectionHeadingProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  badge?: string;
  align?: 'left' | 'center' | 'right';
  action?: React.ReactNode;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  title,
  subtitle,
  badge,
  align = 'left',
  action,
  className = '',
  ...props
}) => {
  const alignmentStyles = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  };

  return (
    <div className={`flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 ${className}`} {...props}>
      <div className={`flex flex-col ${alignmentStyles[align]}`}>
        {badge && (
          <span className="mb-2 inline-flex items-center rounded-full border border-pitstop-yellow/40 bg-pitstop-yellow-light px-3 py-1 text-xs font-semibold text-pitstop-charcoal">
            {badge}
          </span>
        )}
        <h2 className="text-2xl font-bold tracking-tight text-pitstop-charcoal sm:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-sm text-pitstop-muted sm:text-base max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
