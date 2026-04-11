'use client';

import { useState, useEffect } from 'react';
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
  LogOut,
  Leaf,
  Package,
  CreditCard,
  Truck,
  FileDown,
  Heart,
  Mail,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

const adminNavItems = [
  { label: 'Vue d\'ensemble', href: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Contrats', href: '/admin/contrats', icon: FileText },
  { label: 'Membres', href: '/admin/membres', icon: Users },
  { label: 'Producteurs', href: '/admin/producteurs', icon: Tractor },
  { label: 'Produits', href: '/admin/produits', icon: Package },
  { label: 'Paiements', href: '/admin/paiements', icon: CreditCard },
  { label: 'Remises producteur', href: '/admin/remises', icon: Truck },
  { label: 'Distributions', href: '/admin/distributions', icon: FileDown },
  { label: 'Permanences', href: '/admin/permanences', icon: Calendar },
  { label: 'Finances', href: '/admin/finances', icon: Wallet },
  { label: 'Cotisations', href: '/admin/cotisations', icon: Heart },
  { label: 'Actualités', href: '/admin/actualites', icon: Newspaper },
  { label: 'Emails', href: '/admin/emails', icon: Mail },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => { setIsOpen(false); }, [pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-3 bg-gradient-to-r from-green-700 to-emerald-600 rounded-xl px-4 py-3">
          <div className="w-9 h-9 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center flex-shrink-0">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">AMAP Machecoul</h1>
            <p className="text-[11px] text-green-200 leading-tight">Administration</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        <p className="px-4 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Gestion</p>
        <ul className="space-y-0.5">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-green-50 text-green-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                    active
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-700'
                  }`}>
                    <Icon className="w-[18px] h-[18px]" />
                  </div>
                  <span className="flex-1">{item.label}</span>
                  {active && <ChevronRight className="w-4 h-4 text-green-400" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-2 space-y-2 border-t border-gray-100">
        <Link
          href="/app"
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 rounded-xl transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Retour au site</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-40 p-2.5 bg-white text-gray-700 rounded-xl shadow-lg border border-gray-200 md:hidden hover:bg-gray-50 transition-colors"
        aria-label="Ouvrir le menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Mobile sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-72 bg-white z-50 transform transition-transform duration-300 ease-out md:hidden shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Fermer le menu"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Mobile spacer */}
      <div className="md:hidden h-14" />

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-[272px] bg-white border-r border-gray-100 h-screen sticky top-0">
        {sidebarContent}
      </aside>
    </>
  );
}
