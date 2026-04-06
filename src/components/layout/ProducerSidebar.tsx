'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Truck,
  FileText,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Home,
  Leaf,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const producerNavItems = [
  { label: 'Tableau de bord', href: '/producteur', icon: LayoutDashboard },
  { label: 'Commandes', href: '/producteur/commandes', icon: ClipboardList },
  { label: 'Mes livraisons', href: '/producteur/livraisons', icon: Truck },
  { label: 'Mes contrats', href: '/producteur/contrats', icon: FileText },
];

interface ProducerSidebarProps {
  producerName?: string;
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function ProducerSidebar({
  producerName = 'Producteur',
  isCollapsed = false,
  onCollapsedChange,
}: ProducerSidebarProps) {
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
            <span className="font-bold text-sm">Producteur</span>
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

      {/* Producer Name */}
      {!collapsed && (
        <div className="px-4 py-4 border-b border-slate-700">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Producteur</p>
          <p className="font-medium text-white truncate mt-1">{producerName}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {producerNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/producteur' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-colors',
                isActive
                  ? 'bg-green-600 text-white'
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
          href="/app"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          title={collapsed ? 'Retour espace adhérent' : undefined}
        >
          <Home className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Retour espace adhérent</span>}
        </Link>
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
