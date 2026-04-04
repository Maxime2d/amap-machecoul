import {
  Users,
  FileText,
  Tractor,
  Wallet,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { StatsCard } from '@/components/admin/StatsCard';
import { DataTable } from '@/components/admin/DataTable';
import { formatDate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import type { Payment, Profile, Contract, ContractModel } from '@/types/database';

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Fetch statistics
  const [
    { count: activeMembersCount },
    { count: activeContractsCount },
    { count: activeProducersCount },
    { data: paymentsData },
    { data: recentMembersData },
    { data: openEnrollmentsData },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('producers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('payments')
      .select('amount')
      .eq('status', 'received')
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, first_name, last_name, email, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('contract_models')
      .select('id, name, status')
      .eq('status', 'open')
      .limit(5),
  ]);

  const totalCollected = (paymentsData as Payment[] | null)?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  // Format recent members for table
  const recentMembersRows = (recentMembersData as Profile[] | null)?.map((member) => [
    `${member.first_name} ${member.last_name}`,
    member.email,
    formatDate(member.created_at),
  ]) || [];

  // Format open enrollments for table
  const openEnrollmentsRows = (openEnrollmentsData as ContractModel[] | null)?.map((contract) => [
    contract.name,
    'Ouvert',
  ]) || [];

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Membres actifs"
          value={activeMembersCount || 0}
          icon={<Users className="w-6 h-6" />}
          trend="up"
        />
        <StatsCard
          title="Contrats en cours"
          value={activeContractsCount || 0}
          icon={<FileText className="w-6 h-6" />}
          trend="neutral"
        />
        <StatsCard
          title="Producteurs actifs"
          value={activeProducersCount || 0}
          icon={<Tractor className="w-6 h-6" />}
          trend="up"
        />
        <StatsCard
          title="Cotisations collectées"
          value={formatCurrency(totalCollected)}
          icon={<Wallet className="w-6 h-6" />}
          trend="up"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Inscriptions */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Inscriptions récentes
            </h2>
            <Link
              href="/admin/membres"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Voir tous
            </Link>
          </div>
          <DataTable
            headers={['Nom', 'Email', 'Date d\'inscription']}
            rows={recentMembersRows}
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Actions rapides
          </h2>
          <div className="space-y-2">
            <Link
              href="/admin/contrats"
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors font-medium text-sm"
            >
              <FileText className="w-4 h-4" />
              Créer un contrat
            </Link>
            <Link
              href="/admin/producteurs"
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors font-medium text-sm"
            >
              <Tractor className="w-4 h-4" />
              Ajouter producteur
            </Link>
            <Link
              href="/admin/permanences"
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors font-medium text-sm"
            >
              <Clock className="w-4 h-4" />
              Gérer permanences
            </Link>
            <Link
              href="/admin/finances"
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors font-medium text-sm"
            >
              <Wallet className="w-4 h-4" />
              Finances
            </Link>
          </div>
        </div>
      </div>

      {/* Contracts Needing Attention */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              Contrats à surveiller
            </h2>
          </div>
          <Link
            href="/admin/contrats"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Voir tous
          </Link>
        </div>
        <DataTable
          headers={['Contrat', 'Statut']}
          rows={openEnrollmentsRows}
        />
      </div>
    </div>
  );
}
