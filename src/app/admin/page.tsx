import {
  Users,
  FileText,
  Tractor,
  Wallet,
  Clock,
  ChevronRight,
  ArrowRight,
  Package,
  CreditCard,
  Truck,
  Calendar,
  Leaf,
} from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { formatDate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import type { Payment, Profile, ContractModel } from '@/types/database';

export default async function AdminDashboard() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles').select('first_name').eq('id', user?.id || '').single();

  const [
    { count: activeMembersCount },
    { count: activeContractsCount },
    { count: activeProducersCount },
    { data: paymentsData },
    { data: recentMembersData },
    { data: openEnrollmentsData },
    { data: nextDeliveries },
    { count: pendingPaymentsCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('producers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('payments').select('amount').eq('status', 'received'),
    supabase.from('profiles').select('id, first_name, last_name, email, created_at').eq('status', 'active').order('created_at', { ascending: false }).limit(5),
    supabase.from('contract_models').select('id, name, status').eq('status', 'open').limit(5),
    supabase.from('delivery_dates').select('date').gte('date', new Date().toISOString().split('T')[0]).order('date').limit(3),
    supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  const totalCollected = (paymentsData as Payment[] | null)?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  const firstName = (profile as any)?.first_name || 'Admin';

  const stats = [
    { label: 'Membres actifs', value: activeMembersCount || 0, icon: Users, href: '/admin/membres' },
    { label: 'Contrats en cours', value: activeContractsCount || 0, icon: FileText, href: '/admin/contrats' },
    { label: 'Producteurs', value: activeProducersCount || 0, icon: Tractor, href: '/admin/producteurs' },
    { label: 'Collecte', value: formatCurrency(totalCollected), icon: Wallet, href: '/admin/finances' },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero header with photo */}
      <div className="relative rounded-2xl overflow-hidden mb-6 h-40 md:h-48">
        <Image
          src="https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=1200&q=75"
          alt="Champ bio"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/90 via-green-900/70 to-green-800/40" />
        <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center justify-center w-7 h-7 bg-green-500/25 backdrop-blur-sm rounded-full border border-green-400/30">
              <Leaf className="w-3.5 h-3.5 text-green-300" />
            </div>
            <p className="text-xs font-bold text-green-200/90 uppercase tracking-wider">Administration AMAP</p>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Bonjour {firstName}
          </h1>
        </div>
      </div>

      {/* Alert if pending payments */}
      {(pendingPaymentsCount || 0) > 0 && (
        <Link href="/admin/paiements" className="flex items-center gap-3 mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl hover:border-amber-300 transition-colors group">
          <div className="w-9 h-9 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-900">{pendingPaymentsCount} paiement{(pendingPaymentsCount || 0) > 1 ? 's' : ''} en attente</p>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}

      {/* Stats — green tones */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href} className="bg-white rounded-xl border border-stone-200 p-4 hover:border-green-300 hover:shadow-sm transition-all group">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-green-700" />
                </div>
              </div>
              <p className="text-xl font-bold text-stone-900 group-hover:text-green-700 transition-colors">{stat.value}</p>
              <p className="text-xs text-stone-500 mt-0.5">{stat.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Recent members */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-900">Derniers inscrits</h2>
            <Link href="/admin/membres" className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-0.5">
              Tous <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {(recentMembersData as Profile[] | null)?.length ? (
            <div className="divide-y divide-stone-100">
              {(recentMembersData as Profile[]).map((member) => (
                <div key={member.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-xs flex-shrink-0">
                    {member.first_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">{member.first_name} {member.last_name}</p>
                    <p className="text-xs text-stone-500 truncate">{member.email}</p>
                  </div>
                  <span className="text-xs text-stone-400 flex-shrink-0">{formatDate(member.created_at)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-stone-500">Aucun membre recent</div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Next deliveries */}
          {(nextDeliveries as any[])?.length > 0 && (
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-green-600" />
                <h3 className="text-sm font-bold text-stone-900">Prochaines distributions</h3>
              </div>
              <div className="p-3 space-y-2">
                {(nextDeliveries as any[]).map((d: any, i: number) => {
                  const date = new Date(d.date + 'T00:00:00');
                  return (
                    <div key={d.date} className={`flex items-center gap-3 p-2.5 rounded-lg ${i === 0 ? 'bg-green-50 border border-green-200' : 'bg-stone-50'}`}>
                      <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0 ${i === 0 ? 'bg-green-600 text-white' : 'bg-stone-200 text-stone-600'}`}>
                        <span className="text-[9px] font-bold uppercase leading-none">{date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}</span>
                        <span className="text-base font-bold leading-none">{date.getDate()}</span>
                      </div>
                      <div>
                        <p className={`text-sm font-medium capitalize ${i === 0 ? 'text-green-800' : 'text-stone-700'}`}>
                          {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                        </p>
                        <p className="text-xs text-stone-500">17h — 19h</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-100">
              <h3 className="text-sm font-bold text-stone-900">Actions rapides</h3>
            </div>
            <div className="p-2 space-y-0.5">
              {[
                { href: '/admin/contrats', label: 'Contrats', icon: FileText },
                { href: '/admin/producteurs', label: 'Producteurs', icon: Tractor },
                { href: '/admin/permanences', label: 'Permanences', icon: Clock },
                { href: '/admin/remises', label: 'Remises', icon: Truck },
                { href: '/admin/finances', label: 'Finances', icon: Wallet },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-md flex items-center justify-center bg-green-100 text-green-700 flex-shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-medium text-stone-700 group-hover:text-green-700 flex-1">{action.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Open enrollments */}
      {(openEnrollmentsData as ContractModel[] | null)?.length ? (
        <div className="mt-4 bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-green-600" />
              <h2 className="text-sm font-bold text-stone-900">Contrats ouverts</h2>
            </div>
            <Link href="/admin/contrats" className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-0.5">
              Tous <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="p-4 flex flex-wrap gap-2">
            {(openEnrollmentsData as ContractModel[]).map((contract) => (
              <span key={contract.id} className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-sm font-medium text-green-800">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                {contract.name}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
