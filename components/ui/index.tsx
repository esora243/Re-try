'use client';

import { type PropsWithChildren, type ReactNode, useRef } from 'react';
import { cn } from '@/lib/utils';

export const Card = ({ className, children, onClick }: PropsWithChildren<{ className?: string; onClick?: () => void }>) => (
  <div
    onClick={onClick}
    className={cn(
      'rounded-3xl border border-slate-200 bg-white p-4 shadow-soft transition-all duration-300 ease-out',
      onClick ? 'cursor-pointer active:scale-[0.98] hover:shadow-md' : '',
      className
    )}
  >
    {children}
  </div>
);

export const SectionCard = ({
  title,
  subtitle,
  action,
  children
}: PropsWithChildren<{ title: string; subtitle?: string; action?: ReactNode }>) => (
  <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft transition-shadow duration-300 hover:shadow-md sm:p-5">
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

type TapButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'line' | 'success';
};

export const TapButton = ({ variant = 'primary', className, children, onClick, ...props }: TapButtonProps) => {
  const ref = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = ref.current;
    if (btn) {
      const ripple = document.createElement('span');
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      ripple.className = 'pointer-events-none absolute rounded-full bg-white/30 animate-ripple';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    }
    onClick?.(e);
  };

  const styles: Record<string, string> = {
    primary: 'bg-navy text-white shadow-soft hover:shadow-md',
    secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
    ghost: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    line: 'bg-[#06C755] text-white shadow-soft hover:shadow-md',
    success: 'bg-emerald-500 text-white shadow-soft hover:shadow-md'
  };
  return (
    <button
      ref={ref}
      {...props}
      onClick={handleClick}
      className={cn(
        'relative inline-flex min-h-[44px] items-center justify-center gap-2 overflow-hidden rounded-full px-5 text-sm font-semibold transition-all duration-200 ease-out active:scale-[0.97] disabled:opacity-60 disabled:active:scale-100',
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
        <div
          className="h-full rounded-full bg-gradient-to-r from-navy to-[#3253c8] transition-all duration-700 ease-out"
          style={{ width: `${safe}%` }}
        />
      </div>
    </div>
  );
};

export const Badge = ({ tone = 'slate', children }: PropsWithChildren<{ tone?: 'slate' | 'emerald' | 'gold' | 'amber' | 'rose' | 'navy' }>) => {
  const palette: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600',
    emerald: 'bg-emerald-50 text-emerald-700',
    gold: 'bg-gold-50 text-gold-900',
    amber: 'bg-amber-100 text-amber-800',
    rose: 'bg-rose-50 text-rose-700',
    navy: 'bg-navy/10 text-navy-900'
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
      <div key={index} className="relative h-28 overflow-hidden rounded-3xl bg-slate-100">
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      </div>
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
      'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors duration-200 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/15',
      props.className
    )}
  />
);

export const SelectField = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className={cn(
      'w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition-colors duration-200 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/15',
      props.className
    )}
  />
);

export const TextareaField = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={cn(
      'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors duration-200 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/15',
      props.className
    )}
  />
);

export const FadeIn = ({ children, delay = 0 }: PropsWithChildren<{ delay?: number }>) => (
  <div className="animate-fade-in-up" style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}>
    {children}
  </div>
);
