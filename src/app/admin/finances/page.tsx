'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Wallet, TrendingUp } from 'lucide-react';
import { StatsCard } from '@/components/admin/StatsCard';
import { DataTable } from '@/components/admin/DataTable';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Payment } from '@/types/database';

const paymentStatusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  received: { label: 'Reçu', color: 'bg-green-100 text-green-800' },
  deposited: { label: 'Déposé', color: 'bg-blue-100 text-blue-800' },
  late: { label: 'En retard', color: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Annulé', color: 'bg-gray-100 text-gray-800' },
};

export default function FinancesPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const supabase = createClient();

  useEffect(() => {
    async function fetchPayments() {
      try {
        const { data } = await supabase
          .from('payments')
          .select('*')
          .order('due_date', { ascending: false });
        setPayments(data || []);
        setFilteredPayments(data || []);
      } finally {
        setLoading(false);
      }
    }

    fetchPayments();
  }, [supabase]);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredPayments(payments);
    } else {
      setFilteredPayments(
        payments.filter((payment) => payment.status === statusFilter)
      );
    }
  }, [statusFilter, payments]);

  const stats = {
    total: payments.reduce((sum, p) => sum + p.amount, 0),
    received: payments
      .filter((p) => p.status === 'received' || p.status === 'deposited')
      .reduce((sum, p) => sum + p.amount, 0),
    pending: payments
      .filter((p) => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0),
    late: payments
      .filter((p) => p.status === 'late')
      .reduce((sum, p) => sum + p.amount, 0),
  };

  const rows = filteredPayments.map((payment) => [
    formatCurrency(payment.amount),
    formatDate(payment.due_date),
    <span
      key={`status-${payment.id}`}
      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
        paymentStatusLabels[payment.status]?.color || 'bg-gray-100 text-gray-800'
      }`}
    >
      {paymentStatusLabels[payment.status]?.label || payment.status}
    </span>,
    payment.reference || '-',
    payment.received_at ? formatDate(payment.received_at) : '-',
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Chargement...</div>
      </div>
    );
  }

  const statuses = ['all', 'pending', 'received', 'late', 'cancelled'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Finances"
        subtitle="Suivi financier de l'association"
        imageUrl="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=900&q=75"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total attendu"
          value={formatCurrency(stats.total)}
          icon={<Wallet className="w-6 h-6" />}
        />
        <StatsCard
          title="Total reçu"
          value={formatCurrency(stats.received)}
          icon={<TrendingUp className="w-6 h-6" />}
          trend="up"
        />
        <StatsCard
          title="En attente"
          value={formatCurrency(stats.pending)}
          icon={<Wallet className="w-6 h-6" />}
        />
        <StatsCard
          title="En retard"
          value={formatCurrency(stats.late)}
          icon={<Wallet className="w-6 h-6" />}
          trend="down"
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
              statusFilter === status
                ? 'bg-green-700 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {status === 'all'
              ? 'Tous'
              : paymentStatusLabels[status]?.label || status}
          </button>
        ))}
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Paiements
        </h2>
        <DataTable
          headers={['Montant', 'Date limite', 'Statut', 'Référence', 'Reçu le']}
          rows={rows}
        />
      </div>

      {/* Info Box */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-900">
          <strong>Taux de recouvrement:</strong>{' '}
          {stats.total > 0
            ? `${((stats.received / stats.total) * 100).toFixed(1)}%`
            : '0%'}{' '}
          - {payments.filter((p) => p.status === 'received' || p.status === 'deposited').length} paiements reçus sur {payments.length}
        </p>
      </div>
    </div>
  );
}
