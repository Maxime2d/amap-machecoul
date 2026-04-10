'use client';

import { useState, useEffect } from 'react';
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
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const producerNavItems = [
  { label: 'Tableau de bord', href: '/producteur', icon: LayoutDashboard, exact: true },
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
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleCollapse = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    onCollapsedChange?.(newState);
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const sidebarInner = (mobile?: boolean) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn('flex items-center h-16 border-b border-white/10', collapsed && !mobile ? 'justify-center px-2' : 'justify-between px-5')}>
        <div className={cn('flex items-center gap-3', collapsed && !mobile && 'justify-center')}>
          <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20 flex-shrink-0">
            <Leaf className="w-4.5 h-4.5 text-white" />
          </div>
          {(!collapsed || mobile) && (
            <div>
              <p className="text-sm font-bold text-white leading-tight">Espace producteur</p>
            </div>
          )}
        </div>
        {!mobile && (
          <button
            onClick={handleCollapse}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
            aria-label={collapsed ? 'Déplier' : 'Replier'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Producer name */}
      {(!collapsed || mobile) && (
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {producerName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{producerName}</p>
              <p className="text-xs text-emerald-400">Producteur</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        {(!collapsed || mobile) && (
          <p className="px-3 mb-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Navigation</p>
        )}
        <ul className="space-y-1">
          {producerNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200',
                    collapsed && !mobile ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
                    active
                      ? 'bg-green-500/15 text-green-400'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  )}
                  title={collapsed && !mobile ? item.label : undefined}
                >
                  <div className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-lg transition-colors flex-shrink-0',
                    active
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-white/5 text-gray-500 group-hover:bg-white/10 group-hover:text-gray-300'
                  )}>
                    <Icon className="w-[18px] h-[18px]" />
                  </div>
                  {(!collapsed || mobile) && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {active && <ChevronRight className="w-4 h-4 text-green-500/60" />}
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 px-3 py-3 space-y-1">
        <Link
          href="/app"
          className={cn(
            'flex items-center gap-3 rounded-xl text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-all duration-200',
            collapsed && !mobile ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
          )}
          title={collapsed && !mobile ? 'Espace adhérent' : undefined}
        >
          <Home className="w-[18px] h-[18px] flex-shrink-0" />
          {(!collapsed || mobile) && <span>Espace adhérent</span>}
        </Link>
        <Link
          href="/"
          className={cn(
            'flex items-center gap-3 rounded-xl text-sm text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200',
            collapsed && !mobile ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
          )}
          title={collapsed && !mobile ? 'Quitter' : undefined}
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          {(!collapsed || mobile) && <span>Quitter</span>}
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 p-2.5 bg-slate-800 text-white rounded-xl shadow-lg md:hidden hover:bg-slate-700 transition-colors"
        aria-label="Ouvrir le menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-72 bg-slate-900 z-50 transform transition-transform duration-300 ease-out md:hidden shadow-2xl ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors z-10"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarInner(true)}
      </aside>

      {/* Mobile spacer */}
      <div className="md:hidden h-14" />

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden md:flex md:flex-col bg-slate-900 text-white h-screen sticky top-0 transition-all duration-300',
          collapsed ? 'w-20' : 'w-[272px]'
        )}
      >
        {sidebarInner(false)}
      </aside>
    </>
  );
}
