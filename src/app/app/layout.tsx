import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppSidebar } from '@/components/layout/AppSidebar';
import type { Profile } from '@/types/database';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/connexion');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, role')
    .eq('id', user.id)
    .single();

  const userName = (profile as Profile | null) ? `${(profile as any).first_name} ${(profile as any).last_name}` : user.email;
  const userRole = (profile as any)?.role || 'member';
  const isAdmin = ['admin', 'superadmin', 'treasurer'].includes(userRole);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#f8f7f4]">
      <AppSidebar userName={userName} isAdmin={isAdmin} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
