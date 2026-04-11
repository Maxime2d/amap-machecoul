import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminSidebar } from '@/components/layout/AdminSidebar';

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/connexion');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, first_name')
    .eq('id', user.id)
    .single();

  if (
    !profile ||
    !['admin', 'superadmin', 'treasurer'].includes((profile as any)?.role)
  ) {
    redirect('/');
  }

  return (
    <div className="flex h-screen bg-[#f8f7f4]">
      <AdminSidebar firstName={(profile as any)?.first_name} />
      <div className="flex-1 overflow-auto">
        <main className="p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
