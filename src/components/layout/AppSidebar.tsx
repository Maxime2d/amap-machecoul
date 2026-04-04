'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  CreditCard,
  User,
  LogOut,
  Menu,
  X,
  Package,
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface AppSidebarProps {
  userName?: string;
}

export function AppSidebar({ userName }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/connexion');
  }

  const navItems = [
    {
      href: '/app',
      label: 'Tableau de bord',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: '/app/contrats',
      label: 'Mes contrats',
      icon: FileText,
    },
    {
      href: '/app/livraisons',
      label: 'Mes livraisons',
      icon: Package,
    },
    {
      href: '/app/permanences',
      label: 'Permanences',
      icon: Calendar,
    },
    {
      href: '/app/cotisation',
      label: 'Cotisation',
      icon: CreditCard,
    },
    {
      href: '/app/profil',
      label: 'Mon profil',
      icon: User,
    },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };  const sidebarContent = (
    <>
      <div className="p-6 border-b border-green-100">
        <h1 className="text-xl font-bold text-green-700">AMAP</h1>
        <p className="text-sm text-gray-600">Machecoul</p>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <ul className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => isMobile && setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    active
                      ? 'bg-green-100 text-green-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-green-100 space-y-4">
        {userName && (
          <div className="px-4 py-3 bg-green-50 rounded-lg border border-green-100">
            <p className="text-xs text-gray-600 uppercase tracking-wide">Connecté</p>
            <p className="font-medium text-gray-900 truncate">{userName}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors font-medium"
        >
          <LogOut className="w-5 h-5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </>
  );  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-4 left-4 z-40 p-2 bg-green-600 text-white rounded-lg md:hidden"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {isOpen && (
          <div
            className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}

        <aside
          className={`fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-green-100 flex flex-col z-40 transform transition-transform md:hidden ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarContent}
        </aside>

        <div className="md:hidden h-12" />
      </>
    );
  }

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-green-100 h-screen sticky top-0">
      {sidebarContent}
    </aside>
  );
}
