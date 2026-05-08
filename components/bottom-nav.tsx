'use client';

import { cn } from '@/lib/utils';
import { BookOpen, CalendarDays, ChartColumnBig, Home, MessageSquare, University as UniversityIcon } from 'lucide-react';

export type BottomTabKey = 'home' | 'universities' | 'schedules' | 'problems' | 'dashboard' | 'community';

const items: Array<{ key: BottomTabKey; label: string; icon: typeof Home }> = [
  { key: 'home', label: 'ホーム', icon: Home },
  { key: 'problems', label: '過去問', icon: BookOpen },
  { key: 'schedules', label: '日程', icon: CalendarDays },
  { key: 'dashboard', label: '記録', icon: ChartColumnBig },
  { key: 'community', label: '掲示板', icon: MessageSquare }
];

export const BottomNav = ({ active, onChange }: { active: BottomTabKey; onChange: (key: BottomTabKey) => void }) => (
  <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
    <div className="mx-auto grid max-w-md grid-cols-5">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={cn(
              'flex min-h-[60px] flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-semibold',
              isActive ? 'text-navy-900' : 'text-slate-500'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className={cn('flex h-9 w-9 items-center justify-center rounded-full', isActive ? 'bg-navy text-white' : 'bg-transparent')}>
              <Icon className="h-5 w-5" />
            </span>
            {item.label}
          </button>
        );
      })}
    </div>
  </nav>
);

export const bottomNavTabs = items;
