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
} from 'lucide-react';
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
    { label: 'Membres actifs', value: activeMembersCount || 0, icon: Users, color: 'green', bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-700' },
    { label: 'Contrats en cours', value: activeContractsCount || 0, icon: FileText, color: 'blue', bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-700' },
    { label: 'Producteurs', value: activeProducersCount || 0, icon: Tractor, color: 'amber', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-700' },
    { label: 'Collecté', value: formatCurrency(totalCollected), icon: Wallet, color: 'violet', bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-700' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Greeting */}
      <div className="mb-8">
        <p className="text-sm text-stone-500 mb-1">Administration</p>
        <h1 className="text-2xl md:text-3xl font-extrabold text-stone-900 tracking-tight">
          Bonjour {firstName}
        </h1>
      </div>

      {/* Alert if pending payments */}
      {(pendingPaymentsCount || 0) > 0 && (
        <Link href="/admin/paiements" className="flex items-center gap-4 mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl hover:border-amber-300 transition-colors group">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-amber-900">{pendingPaymentsCount} paiement{(pendingPaymentsCount || 0) > 1 ? 's' : ''} en attente de validation</p>
            <p className="text-sm text-amber-700 mt-0.5">Cliquez pour consulter</p>
          </div>
          <ArrowRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`${stat.bg} rounded-2xl border ${stat.border} p-5`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg}`}>
                  <Icon className={`w-5 h-5 ${stat.text}`} />
                </div>
              </div>
              <p className="text-2xl font-black text-stone-900">{stat.value}</p>
              <p className="text-xs font-semibold text-stone-500 mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent members */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
            <h2 className="font-bold text-stone-900">Derniers inscrits</h2>
            <Link href="/admin/membres" className="text-sm font-semibold text-green-700 hover:text-green-800 flex items-center gap-1">
              Tous <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {(recentMembersData as Profile[] | null)?.length ? (
            <div className="divide-y divide-stone-100">
              {(recentMembersData as Profile[]).map((member) => (
                <div key={member.id} className="flex items-center gap-4 px-6 py-3.5">
                  <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">
                    {member.first_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-900 truncate">{member.first_name} {member.last_name}</p>
                    <p className="text-xs text-stone-500 truncate">{member.email}</p>
                  </div>
                  <span className="text-xs text-stone-400 flex-shrink-0">{formatDate(member.created_at)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-stone-500">Aucun membre récent</div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Next deliveries */}
          {(nextDeliveries as any[])?.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-stone-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-green-600" />
                <h3 className="font-bold text-stone-900 text-sm">Prochaines distributions</h3>
              </div>
              <div className="p-4 space-y-2">
                {(nextDeliveries as any[]).map((d: any, i: number) => {
                  const date = new Date(d.date + 'T00:00:00');
                  return (
                    <div key={d.date} className={`flex items-center gap-3 p-3 rounded-xl ${i === 0 ? 'bg-green-50 border border-green-200' : 'bg-stone-50'}`}>
                      <div className={`w-11 h-12 rounded-lg flex flex-col items-center justify-center flex-shrink-0 ${i === 0 ? 'bg-green-600 text-white' : 'bg-stone-200 text-stone-600'}`}>
                        <span className="text-[9px] font-bold uppercase leading-none">{date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}</span>
                        <span className="text-lg font-black leading-none">{date.getDate()}</span>
                      </div>
                      <div>
                        <p className={`text-sm font-semibold capitalize ${i === 0 ? 'text-green-800' : 'text-stone-700'}`}>
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
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-sm">Actions rapides</h3>
            </div>
            <div className="p-3 space-y-1">
              {[
                { href: '/admin/contrats', label: 'Gérer les contrats', icon: FileText, accent: 'bg-blue-100 text-blue-700' },
                { href: '/admin/producteurs', label: 'Producteurs', icon: Tractor, accent: 'bg-green-100 text-green-700' },
                { href: '/admin/permanences', label: 'Permanences', icon: Clock, accent: 'bg-amber-100 text-amber-700' },
                { href: '/admin/remises', label: 'Remises producteur', icon: Truck, accent: 'bg-violet-100 text-violet-700' },
                { href: '/admin/finances', label: 'Finances', icon: Wallet, accent: 'bg-rose-100 text-rose-700' },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-stone-50 transition-colors group"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${action.accent} flex-shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-stone-700 group-hover:text-stone-900 flex-1">{action.label}</span>
                    <ChevronRight className="w-4 h-4 text-stone-300" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Open enrollments */}
      {(openEnrollmentsData as ContractModel[] | null)?.length ? (
        <div className="mt-6 bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-stone-900">Contrats ouverts aux inscriptions</h2>
            </div>
            <Link href="/admin/contrats" className="text-sm font-semibold text-green-700 hover:text-green-800 flex items-center gap-1">
              Voir tous <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-4 flex flex-wrap gap-2">
            {(openEnrollmentsData as ContractModel[]).map((contract) => (
              <span key={contract.id} className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl text-sm font-semibold text-green-800">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                {contract.name}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
