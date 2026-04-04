'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Users,
  Tractor,
  Calendar,
  Wallet,
  Newspaper,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Leaf,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const adminNavItems = [
  { label: 'Vue d\'ensemble', href: '/admin', icon: LayoutDashboard },
  { label: 'Contrats', href: '/admin/contrats', icon: FileText },
  { label: 'Membres', href: '/admin/membres', icon: Users },
  { label: 'Producteurs', href: '/admin/producteurs', icon: Tractor },
  { label: 'Permanences', href: '/admin/permanences', icon: Calendar },
  { label: 'Finances', href: '/admin/finances', icon: Wallet },
  { label: 'Actualités', href: '/admin/actualites', icon: Newspaper },
];

interface AdminSidebarProps {
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function AdminSidebar({
  isCollapsed = false,
  onCollapsedChange,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(isCollapsed);

  const handleCollapse = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    onCollapsedChange?.(newState);
  };

  return (
    <aside
      className={cn(
        'bg-slate-900 text-white transition-all duration-300 flex flex-col h-full',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-green-400" />
            <span className="font-bold text-sm">Admin AMAP</span>
          </div>
        )}
        <button
          onClick={handleCollapse}
          className="p-1 hover:bg-slate-800 rounded transition-colors"
          aria-label={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-colors',
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-700 p-4 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          title={collapsed ? 'Retour au site' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Retour au site</span>}
        </Link>
      </div>
    </aside>
  );
}
