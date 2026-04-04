import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProducerSidebar } from '@/components/layout/ProducerSidebar';
import type { Profile } from '@/types/database';

export const metadata: Metadata = {
  title: 'Portail Producteur | AMAP de Machecoul',
  description: 'Portail de gestion pour les producteurs de l\'AMAP de Machecoul',
};

export default async function ProducerLayout({
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

  // Check if user is a producer referent
  const { data: referent } = await supabase
    .from('producer_referents')
    .select('producer_id')
    .eq('user_id', user.id)
    .single();

  if (!referent) {
    redirect('/app');
  }

  // Get producer details
  const { data: producer } = await supabase
    .from('producers')
    .select('id, name')
    .eq('id', referent.producer_id)
    .single();

  if (!producer) {
    redirect('/app');
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <ProducerSidebar producerName={(producer as any)?.name || 'Producteur'} />
      <div className="flex-1 overflow-auto">
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center justify-between h-16 px-6">
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                {(producer as any)?.name || 'Portail Producteur'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                Producteur
              </span>
            </div>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
