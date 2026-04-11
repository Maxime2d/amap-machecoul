'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Heart, Plus, X, Check, AlertCircle, Loader2, Search, Banknote } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

const statusConfig = {
  pending: { label: 'En attente', dot: 'bg-amber-500', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  received: { label: 'Reçu', dot: 'bg-green-500', bg: 'bg-green-50 text-green-700 border-green-200' },
  deposited: { label: 'Déposé', dot: 'bg-blue-500', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  late: { label: 'En retard', dot: 'bg-red-500', bg: 'bg-red-50 text-red-700 border-red-200' },
  cancelled: { label: 'Annulé', dot: 'bg-stone-400', bg: 'bg-stone-100 text-stone-600 border-stone-200' },
};

const paymentMethodLabels: Record<string, string> = {
  check: 'Chèque',
  transfer: 'Virement',
  cash: 'Espèces',
  card: 'Carte',
};

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

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
  const [toasts, setToasts] = useState<Toast[]>([]);
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

  // Toast notification system
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  };

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
      addToast('Veuillez remplir tous les champs', 'error');
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
        addToast('Période créée avec succès', 'success');
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
      addToast('Erreur lors de la création de la période', 'error');
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
      addToast('Période mise à jour', 'success');
    } catch (error) {
      console.error('Error toggling period:', error);
      addToast('Erreur lors de la mise à jour de la période', 'error');
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
        addToast('Cotisation enregistrée avec succès', 'success');
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
      addToast('Erreur lors de la création de la cotisation', 'error');
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
      addToast('Statut mis à jour', 'success');
    } catch (error) {
      console.error('Error updating fee status:', error);
      addToast('Erreur lors de la mise à jour du statut', 'error');
    }
  };

  // Handle "Relancer" - mark unpaid fees as late
  const handleMarkLate = async () => {
    if (!selectedPeriod) return;

    const unpaidFees = filteredFees.filter((f) => f.status === 'pending');
    if (unpaidFees.length === 0) {
      addToast('Aucune cotisation en attente à relancer', 'info');
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
      addToast(`${unpaidFees.length} cotisation(s) marquée(s) comme en retard`, 'success');
    } catch (error) {
      console.error('Error marking fees as late:', error);
      addToast('Erreur lors de la mise à jour des statuts', 'error');
    }
  };

  // Count statuses
  const statusCounts = {
    all: filteredFees.length,
    pending: filteredFees.filter((f) => f.status === 'pending').length,
    received: filteredFees.filter((f) => f.status === 'received').length,
    deposited: filteredFees.filter((f) => f.status === 'deposited').length,
    late: filteredFees.filter((f) => f.status === 'late').length,
    cancelled: filteredFees.filter((f) => f.status === 'cancelled').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
          <div className="text-stone-600">Chargement...</div>
        </div>
      </div>
    );
  }

  const statuses = ['all', 'pending', 'received', 'deposited', 'late', 'cancelled'];
  const activePeriods = periods.filter((p) => p.is_active);

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Toast Notifications */}
      <div className="fixed top-6 right-6 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-xl font-medium text-sm max-w-sm animate-in fade-in slide-in-from-right-2 ${
              toast.type === 'success'
                ? 'bg-green-500 text-white'
                : toast.type === 'error'
                  ? 'bg-red-500 text-white'
                  : 'bg-green-600 text-white'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
            <Heart className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-stone-900">Gestion des cotisations</h1>
            <p className="text-sm text-stone-600">Suivi des adhésions annuelles à l'AMAP</p>
          </div>
        </div>

        {/* Period Cards */}
        {periods.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-stone-900">Périodes d'adhésion</h2>
              <button
                onClick={() => setShowPeriodModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                Nouvelle période
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {periods.map((period) => (
                <div
                  key={period.id}
                  className="bg-white rounded-xl p-4 border border-stone-200 hover:border-stone-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-extrabold text-stone-900">{period.name}</p>
                      <p className="text-xs text-stone-500">
                        {formatDate(period.start_date)} - {formatDate(period.end_date)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleTogglePeriodActive(period.id, period.is_active)}
                      className={`px-3 py-1 rounded-lg font-medium text-xs transition-colors ${
                        period.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {period.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                  <p className="text-xs text-stone-600">
                    {formatCurrency(period.suggested_amount)} suggéré
                  </p>
                </div>
              ))}
            </div>

            {/* Period Selector Tabs */}
            <div className="mt-6 space-y-2">
              <label className="text-xs font-semibold text-stone-600 uppercase">Analyser une période</label>
              <div className="flex gap-2 flex-wrap">
                {periods.map((period) => (
                  <button
                    key={period.id}
                    onClick={() => setSelectedPeriod(period.id)}
                    className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
                      selectedPeriod === period.id
                        ? 'bg-green-600 text-white'
                        : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    {period.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {!selectedPeriod && periods.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-stone-200">
            <Heart className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-600 mb-4">Aucune période d'adhésion créée</p>
            <button
              onClick={() => setShowPeriodModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Créer la première période
            </button>
          </div>
        )}

        {/* Inline Stats */}
        {selectedPeriod && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Green: Cotisations reçues */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-green-700 uppercase mb-1">Cotisations reçues</p>
              <p className="text-2xl font-extrabold text-green-900">{formatCurrency(stats.received)}</p>
            </div>

            {/* Amber: En attente count */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 uppercase mb-1">En attente</p>
              <p className="text-2xl font-extrabold text-amber-900">
                {filteredFees.filter((f) => f.status === 'pending').length}
              </p>
            </div>

            {/* Blue: Taux de recouvrement */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-700 uppercase mb-1">Taux de recouvrement</p>
              <p className="text-2xl font-extrabold text-blue-900">{collectionRate}%</p>
            </div>

            {/* Stone: Total adhérents */}
            <div className="bg-stone-100 border border-stone-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-stone-600 uppercase mb-1">Total adhérents</p>
              <p className="text-2xl font-extrabold text-stone-900">{stats.members}</p>
            </div>
          </div>
        )}

        {/* Collection Rate Progress Bar */}
        {selectedPeriod && (
          <div className="bg-white rounded-xl p-6 border border-stone-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-extrabold text-stone-900">Progression du recouvrement</h3>
              <span className="text-sm font-semibold text-stone-600">{collectionRate}%</span>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-green-500 h-full transition-all duration-300"
                style={{ width: `${Math.min(parseFloat(collectionRate), 100)}%` }}
              />
            </div>
            <p className="text-xs text-stone-500 mt-3">
              {fees.filter((f) => f.period_id === selectedPeriod && (f.status === 'received' || f.status === 'deposited')).length} reçues sur{' '}
              {fees.filter((f) => f.period_id === selectedPeriod && f.status !== 'cancelled').length} attendues
            </p>
          </div>
        )}

        {/* Status Tabs with Counts */}
        {selectedPeriod && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-stone-900">Cotisations</h2>
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                Enregistrer
              </button>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors whitespace-nowrap ${
                    statusFilter === status
                      ? 'bg-green-600 text-white'
                      : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <span>{status === 'all' ? 'Tous' : statusConfig[status as keyof typeof statusConfig]?.label || status}</span>
                  <span className="ml-2 text-xs font-semibold opacity-70">({statusCounts[status as keyof typeof statusCounts]})</span>
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            {statusFilter === 'pending' && (
              <button
                onClick={handleMarkLate}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors font-medium text-sm"
              >
                <AlertCircle className="w-4 h-4" />
                Relancer {filteredFees.filter((f) => f.status === 'pending').length} en attente
              </button>
            )}
          </div>
        )}

        {/* Search Bar */}
        {selectedPeriod && (
          <div className="relative">
            <Search className="absolute left-4 top-3 w-5 h-5 text-stone-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-300 bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <p className="text-xs text-stone-500 mt-2">
              {filteredFees.length} résultat{filteredFees.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Fees List */}
        {selectedPeriod && filteredFees.length > 0 && (
          <div className="space-y-2">
            {filteredFees.map((fee) => {
              const memberName = fee.profiles
                ? `${fee.profiles.first_name} ${fee.profiles.last_name}`
                : '-';
              const memberInitial = memberName.charAt(0).toUpperCase();

              return (
                <div key={fee.id} className="bg-white rounded-xl p-4 border border-stone-200 hover:border-stone-300 transition-colors">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center font-extrabold text-stone-700">
                        {memberInitial}
                      </div>
                    </div>

                    {/* Member Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-stone-900 truncate">{memberName}</p>
                      <p className="text-xs text-stone-500 truncate">{fee.profiles?.email || '-'}</p>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                      <p className="font-extrabold text-stone-900">{formatCurrency(fee.amount)}</p>
                    </div>

                    {/* Status Badge */}
                    <div className="flex-shrink-0">
                      <div
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-medium text-xs ${
                          statusConfig[fee.status as keyof typeof statusConfig]?.bg || 'bg-stone-100 text-stone-600 border-stone-200'
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            statusConfig[fee.status as keyof typeof statusConfig]?.dot || 'bg-stone-400'
                          }`}
                        />
                        {statusConfig[fee.status as keyof typeof statusConfig]?.label || fee.status}
                      </div>
                    </div>

                    {/* Method */}
                    <div className="text-right flex-shrink-0 hidden md:block">
                      <p className="text-xs font-medium text-stone-600">{paymentMethodLabels[fee.method] || '-'}</p>
                    </div>

                    {/* Paid Date */}
                    <div className="text-right flex-shrink-0 hidden lg:block min-w-[80px]">
                      <p className="text-xs text-stone-500">{fee.paid_at ? formatDate(fee.paid_at) : '-'}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex gap-2">
                      {fee.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(fee.id, 'received')}
                          title="Marquer comme reçu"
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      {fee.status === 'received' && (
                        <button
                          onClick={() => handleStatusChange(fee.id, 'deposited')}
                          title="Marquer comme déposé"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <select
                        value={fee.status}
                        onChange={(e) => handleStatusChange(fee.id, e.target.value)}
                        className="px-2 py-1 text-xs border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
                        title="Changer le statut"
                      >
                        {Object.entries(statusConfig).map(([key, val]) => (
                          <option key={key} value={key}>
                            {val.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {selectedPeriod && filteredFees.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-stone-200 border-dashed">
            <Banknote className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-600 mb-4">
              {searchQuery ? 'Aucune cotisation ne correspond à votre recherche' : 'Aucune cotisation enregistrée'}
            </p>
            {!searchQuery && (
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                Enregistrer une cotisation
              </button>
            )}
          </div>
        )}

      </div>

      {/* Period Creation Modal */}
      {showPeriodModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-stone-200 sticky top-0 bg-white">
              <h2 className="text-xl font-extrabold text-stone-900">
                Créer une période d'adhésion
              </h2>
              <button
                onClick={() => setShowPeriodModal(false)}
                className="text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreatePeriod} className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-2">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={periodFormData.name}
                  onChange={(e) =>
                    setPeriodFormData({ ...periodFormData, name: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-300 bg-white"
                  placeholder="Ex: Saison 2025-2026"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-2">
                  Date de début <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={periodFormData.start_date}
                  onChange={(e) =>
                    setPeriodFormData({ ...periodFormData, start_date: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-300 bg-white"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-2">
                  Date de fin <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={periodFormData.end_date}
                  onChange={(e) =>
                    setPeriodFormData({ ...periodFormData, end_date: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-300 bg-white"
                />
              </div>

              {/* Suggested Amount */}
              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-2">
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
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-300 bg-white"
                  placeholder="0.00"
                />
              </div>

              {/* Minimum Amount */}
              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-2">
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
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-300 bg-white"
                  placeholder="0.00"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPeriodModal(false)}
                  className="flex-1 px-4 py-3 border border-stone-200 text-stone-700 rounded-xl hover:bg-stone-50 transition-colors font-medium text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fee Creation Modal */}
      {showFeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-stone-200 sticky top-0 bg-white">
              <h2 className="text-xl font-extrabold text-stone-900">
                Enregistrer une cotisation
              </h2>
              <button
                onClick={() => setShowFeeModal(false)}
                className="text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateFee} className="p-6 space-y-5">
              {/* Member Selection */}
              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-2">
                  Adhérent <span className="text-red-500">*</span>
                </label>
                <select
                  value={feeFormData.user_id}
                  onChange={(e) =>
                    setFeeFormData({ ...feeFormData, user_id: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-300 bg-white"
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
                <label className="block text-sm font-semibold text-stone-900 mb-2">
                  Période <span className="text-red-500">*</span>
                </label>
                <select
                  value={feeFormData.period_id}
                  onChange={(e) =>
                    setFeeFormData({ ...feeFormData, period_id: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-300 bg-white"
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
                <label className="block text-sm font-semibold text-stone-900 mb-2">
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
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-300 bg-white"
                  placeholder="0.00"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-2">
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
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-300 bg-white"
                >
                  <option value="check">Chèque</option>
                  <option value="transfer">Virement</option>
                  <option value="cash">Espèces</option>
                  <option value="card">Carte</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-2">
                  Statut
                </label>
                <select
                  value={feeFormData.status}
                  onChange={(e) =>
                    setFeeFormData({ ...feeFormData, status: e.target.value as any })
                  }
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-300 bg-white"
                >
                  {Object.entries(statusConfig).map(([key, val]) => (
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
                  className="flex-1 px-4 py-3 border border-stone-200 text-stone-700 rounded-xl hover:bg-stone-50 transition-colors font-medium text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
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
