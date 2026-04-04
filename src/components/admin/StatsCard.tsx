import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export function StatsCard({
  title,
  value,
  icon,
  description,
  trend = 'neutral',
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            {trend !== 'neutral' && (
              <div
                className={cn(
                  'flex items-center gap-0.5 text-xs font-semibold',
                  trend === 'up' ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend === 'up' ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
              </div>
            )}
          </div>
          {description && (
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          )}
        </div>
        <div className="ml-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
          <div className="text-indigo-600">{icon}</div>
        </div>
      </div>
    </div>
  );
}
