import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import type { Profile } from '@/types/database';

export const metadata: Metadata = {
  title: 'Administration | AMAP de Machecoul',
  description: 'Tableau de bord d\'administration de l\'AMAP de Machecoul',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/connexion');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Check if user has admin, superadmin, or treasurer role
  if (
    !profile ||
    !['admin', 'superadmin', 'treasurer'].includes((profile as any)?.role)
  ) {
    redirect('/');
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center justify-between h-16 px-6">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                Administration
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                Admin
              </span>
            </div>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
