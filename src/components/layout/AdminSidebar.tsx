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
  ExternalLink,
  ArrowLeftRight,
  Globe,
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

export function AdminSidebar({ firstName }: { firstName?: string }) {
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
        <div className="flex items-center gap-3 bg-gradient-to-r from-green-800 to-green-700 rounded-xl px-4 py-3 shadow-md">
          <div className="w-9 h-9 bg-white/15 backdrop-blur rounded-lg flex items-center justify-center flex-shrink-0">
            <Leaf className="w-5 h-5 text-green-300" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight tracking-wide">AMAP Machecoul</h1>
            <p className="text-[11px] text-green-300/80 leading-tight">Administration</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        <p className="px-4 mb-2 text-[11px] font-bold text-stone-400 uppercase tracking-wider">Gestion</p>
        <ul className="space-y-0.5">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <li key={item.href} className="relative">
                {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-500 rounded-r-full" />}
                <Link
                  href={item.href}
                  className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-green-50 text-green-800 shadow-sm border border-green-200/60'
                      : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                  }`}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                    active
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'bg-stone-100 text-stone-500 group-hover:bg-orange-100 group-hover:text-orange-600'
                  }`}>
                    <Icon className="w-[18px] h-[18px]" />
                  </div>
                  <span className="flex-1 font-semibold">{item.label}</span>
                  {active && <ChevronRight className="w-4 h-4 text-orange-500" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer — navigation links */}
      <div className="px-3 pb-4 pt-3 space-y-1 border-t border-stone-100">
        {firstName && (
          <div className="mx-1 px-4 py-2.5 mb-1">
            <p className="text-[11px] text-stone-400 font-medium">Connecté en tant que</p>
            <p className="text-sm font-bold text-stone-800">{firstName}</p>
          </div>
        )}
        <Link
          href="/app"
          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-orange-50 hover:text-orange-700 rounded-xl transition-all duration-200"
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Espace adhérent</span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-orange-50 hover:text-orange-700 rounded-xl transition-all duration-200"
        >
          <Globe className="w-4 h-4" />
          <span>Site public</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-40 p-2.5 bg-white text-stone-700 rounded-xl shadow-lg border border-stone-200 md:hidden hover:bg-stone-50 transition-colors"
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
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
          aria-label="Fermer le menu"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Mobile spacer */}
      <div className="md:hidden h-14" />

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-[272px] bg-white border-r border-stone-200/60 h-screen sticky top-0">
        {sidebarContent}
      </aside>
    </>
  );
}
