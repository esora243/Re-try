'use client';

import { type PropsWithChildren, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const Card = ({ className, children }: PropsWithChildren<{ className?: string }>) => (
  <div className={cn('rounded-3xl border border-slate-200 bg-white p-4 shadow-soft', className)}>{children}</div>
);

export const SectionCard = ({
  title,
  subtitle,
  action,
  children
}: PropsWithChildren<{ title: string; subtitle?: string; action?: ReactNode }>) => (
  <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
    <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
      <div>
        <h2 className="text-base font-semibold text-navy-900 sm:text-lg">{title}</h2>
        {subtitle ? <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">{subtitle}</p> : null}
      </div>
      {action}
    </div>
    {children}
  </section>
);

export const TapButton = ({
  variant = 'primary',
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'line' | 'success' }) => {
  const styles: Record<string, string> = {
    primary: 'bg-navy text-white',
    secondary: 'border border-slate-300 bg-white text-slate-700',
    ghost: 'bg-slate-100 text-slate-700',
    line: 'bg-[#06C755] text-white',
    success: 'bg-emerald-500 text-white'
  };
  return (
    <button
      {...props}
      className={cn(
        'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold disabled:opacity-60',
        styles[variant],
        className
      )}
    >
      {children}
    </button>
  );
};

export const ProgressBar = ({ value, label }: { value: number; label?: string }) => {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div>
      {label ? (
        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
          <span>{label}</span>
          <span className="font-semibold text-navy-900">{safe}%</span>
        </div>
      ) : null}
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-navy" style={{ width: `${safe}%` }} />
      </div>
    </div>
  );
};

export const Badge = ({ tone = 'slate', children }: PropsWithChildren<{ tone?: 'slate' | 'emerald' | 'gold' | 'amber' | 'rose' }>) => {
  const palette: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600',
    emerald: 'bg-emerald-50 text-emerald-700',
    gold: 'bg-gold-50 text-gold-900',
    amber: 'bg-amber-100 text-amber-800',
    rose: 'bg-rose-50 text-rose-700'
  };
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold', palette[tone])}>{children}</span>;
};

export const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
    <div className="font-semibold text-slate-700">{title}</div>
    <p className="mt-1 leading-6">{description}</p>
  </div>
);

export const SkeletonGrid = ({ count = 4 }: { count?: number }) => (
  <div className="grid gap-3">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="h-28 animate-pulse rounded-3xl bg-slate-100" />
    ))}
  </div>
);

export const FieldLabel = ({ children }: PropsWithChildren) => (
  <label className="text-xs font-semibold text-slate-600">{children}</label>
);

export const TextField = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={cn(
      'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy focus:outline-none',
      props.className
    )}
  />
);

export const SelectField = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className={cn(
      'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-navy focus:outline-none',
      props.className
    )}
  />
);

export const TextareaField = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={cn(
      'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy focus:outline-none',
      props.className
    )}
  />
);
