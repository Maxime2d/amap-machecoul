'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Heart, Plus, X, Check, AlertCircle } from 'lucide-react';
import { StatsCard } from '@/components/admin/StatsCard';
import { DataTable } from '@/components/admin/DataTable';
import { formatCurrency, formatDate } from '@/lib/utils';

const feeStatusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  received: { label: 'Reçu', color: 'bg-green-100 text-green-800' },
  deposited: { label: 'Déposé', color: 'bg-blue-100 text-blue-800' },
  late: { label: 'En retard', color: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Annulé', color: 'bg-gray-100 text-gray-800' },
};

const paymentMethodLabels: Record<string, string> = {
  check: 'Chèque',
  transfer: 'Virement',
  cash: 'Espèces',
  card: 'Carte',
};

interface MembershipPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  suggested_amount: number;
  min_amount: number;
  is_active: boolean;
}

interface MembershipFee {
  id: string;
  user_id: string;
  period_id: string;
  amount: number;
  status: 'pending' | 'received' | 'deposited' | 'late' | 'cancelled';
  method: 'check' | 'transfer' | 'cash' | 'card';
  paid_at: string | null;
  created_at: string;
  profiles?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  membership_periods?: MembershipPeriod;
}

interface FormData {
  name: string;
  start_date: string;
  end_date: string;
  suggested_amount: string;
  min_amount: string;
}

interface FeeFormData {
  user_id: string;
  period_id: string;
  amount: string;
  method: 'check' | 'transfer' | 'cash' | 'card';
  status: 'pending' | 'received' | 'deposited' | 'late' | 'cancelled';
}

export default function CotisationsPage() {
  const [periods, setPeriods] = useState<MembershipPeriod[]>([]);
  const [fees, setFees] = useState<MembershipFee[]>([]);
  const [filteredFees, setFilteredFees] = useState<MembershipFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [periodFormData, setPeriodFormData] = useState<FormData>({
    name: '',
    start_date: '',
    end_date: '',
    suggested_amount: '',
    min_amount: '',
  });
  const [feeFormData, setFeeFormData] = useState<FeeFormData>({
    user_id: '',
    period_id: '',
    amount: '',
    method: 'check',
    status: 'pending',
  });

  const supabase = createClient();

  // Fetch membership periods
  useEffect(() => {
    async function fetchPeriods() {
      try {
        const { data } = await supabase
          .from('membership_periods')
          .select('*')
          .order('start_date', { ascending: false });

        setPeriods(data || []);

        // Auto-select first active period or first period
        const activePeriod = (data || []).find((p) => p.is_active);
        if (activePeriod) {
          setSelectedPeriod(activePeriod.id);
        } else if (data && data.length > 0) {
          setSelectedPeriod(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching periods:', error);
      }
    }

    fetchPeriods();
  }, [supabase]);

  // Fetch membership fees with member details
  useEffect(() => {
    async function fetchFees() {
      try {
        const { data } = await supabase
          .from('membership_fees')
          .select(
            `
            *,
            profiles:user_id(id, first_name, last_name, email),
            membership_periods(id, name, start_date, end_date, suggested_amount, min_amount, is_active)
          `
          )
          .order('created_at', { ascending: false });

        setFees(data as MembershipFee[] || []);
      } catch (error) {
        console.error('Error fetching fees:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchFees();
  }, [supabase]);

  // Fetch members (profiles)
  useEffect(() => {
    async function fetchMembers() {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .eq('role', 'member')
          .order('last_name', { ascending: true });
        setMembers(data || []);
      } catch (error) {
        console.error('Error fetching members:', error);
      }
    }

    fetchMembers();
  }, [supabase]);

  // Filter fees by selected period, status, and search query
  useEffect(() => {
    let result = fees;

    if (selectedPeriod) {
      result = result.filter((fee) => fee.period_id === selectedPeriod);
    }

    if (statusFilter !== 'all') {
      result = result.filter((fee) => fee.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((fee) => {
        const memberName = fee.profiles
          ? `${fee.profiles.first_name} ${fee.profiles.last_name}`.toLowerCase()
          : '';
        return memberName.includes(query) || fee.profiles?.email.toLowerCase().includes(query);
      });
    }

    setFilteredFees(result);
  }, [selectedPeriod, statusFilter, searchQuery, fees]);

  // Calculate stats for selected period
  const stats = {
    members: selectedPeriod
      ? fees
          .filter((f) => f.period_id === selectedPeriod && f.status !== 'cancelled')
          .map((f) => f.user_id)
          .filter((val, idx, arr) => arr.indexOf(val) === idx).length
      : 0,
    received: selectedPeriod
      ? fees
          .filter(
            (f) =>
              f.period_id === selectedPeriod &&
              (f.status === 'received' || f.status === 'deposited')
          )
          .reduce((sum, f) => sum + f.amount, 0)
      : 0,
    total: selectedPeriod
      ? fees
          .filter((f) => f.period_id === selectedPeriod)
          .reduce((sum, f) => sum + f.amount, 0)
      : 0,
  };

  const collectionRate =
    stats.total > 0
      ? (
          (stats.received / stats.total) *
          100
        ).toFixed(1)
      : '0';

  // Handle period creation
  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !periodFormData.name ||
      !periodFormData.start_date ||
      !periodFormData.end_date ||
      !periodFormData.suggested_amount ||
      !periodFormData.min_amount
    ) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('membership_periods')
        .insert([
          {
            name: periodFormData.name,
            start_date: periodFormData.start_date,
            end_date: periodFormData.end_date,
            suggested_amount: parseFloat(periodFormData.suggested_amount),
            min_amount: parseFloat(periodFormData.min_amount),
            is_active: false,
          },
        ])
        .select();

      if (error) throw error;

      if (data) {
        setPeriods([data[0], ...periods]);
        if (!selectedPeriod) {
          setSelectedPeriod(data[0].id);
        }
      }

      setPeriodFormData({
        name: '',
        start_date: '',
        end_date: '',
        suggested_amount: '',
        min_amount: '',
      });
      setShowPeriodModal(false);
    } catch (error) {
      console.error('Error creating period:', error);
      alert('Erreur lors de la création de la période');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle period active/inactive toggle
  const handleTogglePeriodActive = async (periodId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('membership_periods')
        .update({ is_active: !isActive })
        .eq('id', periodId);

      if (error) throw error;

      setPeriods(
        periods.map((p) =>
          p.id === periodId ? { ...p, is_active: !isActive } : p
        )
      );
    } catch (error) {
      console.error('Error toggling period:', error);
      alert('Erreur lors de la mise à jour de la période');
    }
  };

  // Handle fee creation
  const handleCreateFee = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!feeFormData.user_id || !feeFormData.period_id || !feeFormData.amount) {
      alert('Veuillez remplir tous les champs requis');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('membership_fees')
        .insert([
          {
            user_id: feeFormData.user_id,
            period_id: feeFormData.period_id,
            amount: parseFloat(feeFormData.amount),
            method: feeFormData.method,
            status: feeFormData.status,
            paid_at:
              feeFormData.status === 'received' || feeFormData.status === 'deposited'
                ? new Date().toISOString()
                : null,
          },
        ])
        .select(
          `
          *,
          profiles:user_id(id, first_name, last_name, email),
          membership_periods(id, name, start_date, end_date, suggested_amount, min_amount, is_active)
        `
        );

      if (error) throw error;

      if (data) {
        setFees([data[0] as MembershipFee, ...fees]);
      }

      setFeeFormData({
        user_id: '',
        period_id: selectedPeriod || '',
        amount: '',
        method: 'check',
        status: 'pending',
      });
      setShowFeeModal(false);
    } catch (error) {
      console.error('Error creating fee:', error);
      alert('Erreur lors de la création de la cotisation');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle fee status change
  const handleStatusChange = async (feeId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };

      if (newStatus === 'received' || newStatus === 'deposited') {
        updateData.paid_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('membership_fees')
        .update(updateData)
        .eq('id', feeId);

      if (error) throw error;

      const updatedFees = fees.map((f) =>
        f.id === feeId
          ? { ...f, status: newStatus as any, paid_at: updateData.paid_at || f.paid_at }
          : f
      );
      setFees(updatedFees);
    } catch (error) {
      console.error('Error updating fee status:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  // Handle "Relancer" - mark unpaid fees as late
  const handleMarkLate = async () => {
    if (!selectedPeriod) return;

    const unpaidFees = filteredFees.filter((f) => f.status === 'pending');
    if (unpaidFees.length === 0) {
      alert('Aucune cotisation en attente à relancer');
      return;
    }

    if (!window.confirm(`Marquer ${unpaidFees.length} cotisation(s) comme en retard ?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('membership_fees')
        .update({ status: 'late' })
        .eq('period_id', selectedPeriod)
        .eq('status', 'pending');

      if (error) throw error;

      const updatedFees = fees.map((f) =>
        f.period_id === selectedPeriod && f.status === 'pending'
          ? { ...f, status: 'late' as const }
          : f
      );
      setFees(updatedFees);
    } catch (error) {
      console.error('Error marking fees as late:', error);
      alert('Erreur lors de la mise à jour des statuts');
    }
  };

  // Build table rows
  const rows = filteredFees.map((fee) => {
    const memberName = fee.profiles
      ? `${fee.profiles.first_name} ${fee.profiles.last_name}`
      : '-';

    return [
      memberName,
      fee.profiles?.email || '-',
      formatCurrency(fee.amount),
      <span
        key={`status-${fee.id}`}
        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
          feeStatusLabels[fee.status]?.color || 'bg-gray-100 text-gray-800'
        }`}
      >
        {feeStatusLabels[fee.status]?.label || fee.status}
      </span>,
      fee.method ? paymentMethodLabels[fee.method] : '-',
      fee.paid_at ? formatDate(fee.paid_at) : '-',
      <div key={`actions-${fee.id}`} className="flex gap-2">
        {fee.status === 'pending' && (
          <button
            onClick={() => handleStatusChange(fee.id, 'received')}
            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors flex items-center gap-1"
            title="Marquer comme reçu"
          >
            <Check className="w-3 h-3" />
            Reçu
          </button>
        )}
        {fee.status === 'received' && (
          <button
            onClick={() => handleStatusChange(fee.id, 'deposited')}
            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center gap-1"
            title="Marquer comme déposé"
          >
            <Check className="w-3 h-3" />
            Déposé
          </button>
        )}
        <select
          value={fee.status}
          onChange={(e) => handleStatusChange(fee.id, e.target.value)}
          className="px-2 py-1 text-xs border border-slate-200 rounded hover:bg-slate-50 transition-colors"
          title="Changer le statut"
        >
          {Object.entries(feeStatusLabels).map(([key, val]) => (
            <option key={key} value={key}>
              {val.label}
            </option>
          ))}
        </select>
      </div>,
    ];
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Chargement...</div>
      </div>
    );
  }

  const statuses = ['all', 'pending', 'received', 'deposited', 'late', 'cancelled'];
  const activePeriods = periods.filter((p) => p.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
          <Heart className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestion des cotisations</h1>
          <p className="text-sm text-slate-600">Suivi des adhésions annuelles à l'AMAP</p>
        </div>
      </div>

      {/* Period Management Section */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Périodes d'adhésion</h2>
          <button
            onClick={() => setShowPeriodModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Créer une période
          </button>
        </div>

        {periods.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            Aucune période d'adhésion créée
          </div>
        ) : (
          <div className="space-y-3">
            {periods.map((period) => (
              <div
                key={period.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  period.is_active
                    ? 'bg-green-50 border-green-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{period.name}</p>
                  <p className="text-sm text-slate-600">
                    {formatDate(period.start_date)} au {formatDate(period.end_date)}
                  </p>
                  <p className="text-sm text-slate-600">
                    Montant suggéré: {formatCurrency(period.suggested_amount)} (min: {formatCurrency(period.min_amount)})
                  </p>
                </div>
                <button
                  onClick={() => handleTogglePeriodActive(period.id, period.is_active)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    period.is_active
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {period.is_active ? 'Active' : 'Inactive'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Period Selection */}
      {periods.length > 0 && (
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-slate-700">
            Période sélectionnée:
          </label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {periods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.name} {period.is_active ? '(Active)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Summary Cards */}
      {selectedPeriod && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Adhérents"
            value={stats.members}
            icon={<Heart className="w-6 h-6" />}
          />
          <StatsCard
            title="Cotisations reçues"
            value={formatCurrency(stats.received)}
            icon={<Heart className="w-6 h-6" />}
            trend={stats.received > 0 ? 'up' : 'neutral'}
          />
          <StatsCard
            title="Montant total"
            value={formatCurrency(stats.total)}
            icon={<Heart className="w-6 h-6" />}
          />
          <StatsCard
            title="Taux de recouvrement"
            value={`${collectionRate}%`}
            icon={<Heart className="w-6 h-6" />}
          />
        </div>
      )}

      {/* Status Filter Tabs and Actions */}
      {selectedPeriod && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-green-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {status === 'all'
                  ? 'Tous'
                  : feeStatusLabels[status]?.label || status}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setFeeFormData({
                  user_id: '',
                  period_id: selectedPeriod,
                  amount: '',
                  method: 'check',
                  status: 'pending',
                });
                setShowFeeModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Enregistrer une cotisation
            </button>
            <button
              onClick={handleMarkLate}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium text-sm"
            >
              <AlertCircle className="w-4 h-4" />
              Relancer
            </button>
          </div>
        </>
      )}

      {/* Fees Table */}
      {selectedPeriod && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Cotisations
          </h2>
          <DataTable
            headers={['Adhérent', 'Email', 'Montant', 'Statut', 'Méthode', 'Payé le', 'Actions']}
            rows={rows}
            searchPlaceholder="Rechercher un adhérent..."
            onSearch={(query) => setSearchQuery(query)}
          />
        </div>
      )}

      {/* Collection Rate Info */}
      {selectedPeriod && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-900">
            <strong>Taux de recouvrement:</strong> {collectionRate}% -{' '}
            {fees.filter(
              (f) => f.period_id === selectedPeriod && (f.status === 'received' || f.status === 'deposited')
            ).length}{' '}
            cotisations reçues sur{' '}
            {fees.filter((f) => f.period_id === selectedPeriod && f.status !== 'cancelled').length}
          </p>
        </div>
      )}

      {/* Period Creation Modal */}
      {showPeriodModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-slate-900">
                Créer une période d'adhésion
              </h2>
              <button
                onClick={() => setShowPeriodModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreatePeriod} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={periodFormData.name}
                  onChange={(e) =>
                    setPeriodFormData({ ...periodFormData, name: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: Saison 2025-2026"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Date de début <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={periodFormData.start_date}
                  onChange={(e) =>
                    setPeriodFormData({ ...periodFormData, start_date: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Date de fin <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={periodFormData.end_date}
                  onChange={(e) =>
                    setPeriodFormData({ ...periodFormData, end_date: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Suggested Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Montant suggéré <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={periodFormData.suggested_amount}
                  onChange={(e) =>
                    setPeriodFormData({
                      ...periodFormData,
                      suggested_amount: e.target.value,
                    })
                  }
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                />
              </div>

              {/* Minimum Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Montant minimum <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={periodFormData.min_amount}
                  onChange={(e) =>
                    setPeriodFormData({
                      ...periodFormData,
                      min_amount: e.target.value,
                    })
                  }
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPeriodModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fee Creation Modal */}
      {showFeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-slate-900">
                Enregistrer une cotisation
              </h2>
              <button
                onClick={() => setShowFeeModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateFee} className="p-6 space-y-4">
              {/* Member Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Adhérent <span className="text-red-500">*</span>
                </label>
                <select
                  value={feeFormData.user_id}
                  onChange={(e) =>
                    setFeeFormData({ ...feeFormData, user_id: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Sélectionnez un adhérent</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.first_name} {member.last_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Period Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Période <span className="text-red-500">*</span>
                </label>
                <select
                  value={feeFormData.period_id}
                  onChange={(e) =>
                    setFeeFormData({ ...feeFormData, period_id: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Sélectionnez une période</option>
                  {periods.map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.name} ({formatCurrency(period.suggested_amount)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Montant <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={feeFormData.amount}
                  onChange={(e) =>
                    setFeeFormData({ ...feeFormData, amount: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Méthode de paiement
                </label>
                <select
                  value={feeFormData.method}
                  onChange={(e) =>
                    setFeeFormData({
                      ...feeFormData,
                      method: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="check">Chèque</option>
                  <option value="transfer">Virement</option>
                  <option value="cash">Espèces</option>
                  <option value="card">Carte</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Statut
                </label>
                <select
                  value={feeFormData.status}
                  onChange={(e) =>
                    setFeeFormData({ ...feeFormData, status: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {Object.entries(feeStatusLabels).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowFeeModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
