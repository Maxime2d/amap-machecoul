'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, Check, Loader2, Plus, X, Archive, Banknote } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Payment, Profile, Contract, ContractModel } from '@/types/database';

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

interface PaymentWithDetails extends Payment {
  profiles?: Profile;
  contracts?: Contract & {
    contract_models?: ContractModel;
  };
}

interface FormData {
  user_id: string;
  contract_id: string;
  amount: string;
  method: 'check' | 'transfer' | 'cash' | 'card';
  check_number?: string;
  bank_name?: string;
  reference: string;
  notes: string;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentWithDetails | null>(null);
  const [members, setMembers] = useState<Profile[]>([]);
  const [contracts, setContracts] = useState<(Contract & { contract_models?: ContractModel })[]>([]);
  const [selectedMemberContracts, setSelectedMemberContracts] = useState<(Contract & { contract_models?: ContractModel })[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [formData, setFormData] = useState<FormData>({
    user_id: '',
    contract_id: '',
    amount: '',
    method: 'check',
    reference: '',
    notes: '',
  });

  const supabase = createClient();

  // Toast helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2500);
  };

  // Fetch payments with member and contract details
  useEffect(() => {
    async function fetchPayments() {
      try {
        const { data } = await supabase
          .from('payments')
          .select(`
            *,
            profiles:user_id(id, first_name, last_name, email),
            contracts(id, user_id, model_id, status, total_amount, contract_models(id, name, producers(name)))
          `)
          .order('due_date', { ascending: false });

        setPayments(data as PaymentWithDetails[] || []);
        setFilteredPayments(data as PaymentWithDetails[] || []);
      } catch (error) {
        console.error('Error fetching payments:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPayments();
  }, [supabase]);

  // Fetch members (profiles with role='member')
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

  // Fetch all contracts with contract models
  useEffect(() => {
    async function fetchContracts() {
      try {
        const { data } = await supabase
          .from('contracts')
          .select('id, user_id, model_id, status, total_amount, contract_models(id, name, producers(name))')
          .eq('status', 'active');
        setContracts(data as any || []);
      } catch (error) {
        console.error('Error fetching contracts:', error);
      }
    }

    fetchContracts();
  }, [supabase]);

  // Update selected member's contracts when they change
  useEffect(() => {
    if (formData.user_id) {
      const memberContracts = contracts.filter(c => c.user_id === formData.user_id);
      setSelectedMemberContracts(memberContracts);
      setFormData(prev => ({ ...prev, contract_id: '' }));
    } else {
      setSelectedMemberContracts([]);
    }
  }, [formData.user_id, contracts]);

  // Filter payments by status and search query
  useEffect(() => {
    let result = payments;

    if (statusFilter !== 'all') {
      result = result.filter((payment) => payment.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((payment) => {
        const memberName = payment.profiles
          ? `${payment.profiles.first_name} ${payment.profiles.last_name}`.toLowerCase()
          : '';
        const contractName = (payment.contracts as any)?.contract_models?.name || '';
        return memberName.includes(query) || contractName.toLowerCase().includes(query);
      });
    }

    setFilteredPayments(result);
  }, [statusFilter, searchQuery, payments]);

  // Calculate stats
  const stats = {
    totalExpected: payments.reduce((sum, p) => sum + p.amount, 0),
    totalReceived: payments
      .filter((p) => p.status === 'received' || p.status === 'deposited')
      .reduce((sum, p) => sum + p.amount, 0),
    pending: payments
      .filter((p) => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0),
    late: payments
      .filter((p) => p.status === 'late')
      .reduce((sum, p) => sum + p.amount, 0),
  };

  // Handle status change inline
  const handleStatusChange = async (paymentId: string, newStatus: string) => {
    try {
      setUpdatingPaymentId(paymentId);
      const updateData: any = { status: newStatus };

      // If receiving payment, set received_at
      if (newStatus === 'received' && !payments.find(p => p.id === paymentId)?.received_at) {
        updateData.received_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', paymentId);

      if (error) throw error;

      // Update local state
      const updatedPayments = payments.map(p =>
        p.id === paymentId ? { ...p, status: newStatus as any, received_at: updateData.received_at || p.received_at } : p
      );
      setPayments(updatedPayments);
      setFilteredPayments(updatedPayments.filter(p => {
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;
        if (searchQuery) {
          const memberName = p.profiles ? `${p.profiles.first_name} ${p.profiles.last_name}`.toLowerCase() : '';
          const contractName = (p.contracts as any)?.contract_models?.name || '';
          if (!memberName.includes(searchQuery.toLowerCase()) && !contractName.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
          }
        }
        return true;
      }));
      showToast(`Statut mis à jour à "${statusConfig[newStatus as keyof typeof statusConfig]?.label || newStatus}"`);
    } catch (error) {
      console.error('Error updating payment status:', error);
      showToast('Erreur lors de la mise à jour du statut', 'error');
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  // Handle form submission for new payment
  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.user_id || !formData.contract_id || !formData.amount) {
      showToast('Veuillez remplir tous les champs requis', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedContract = contracts.find(c => c.id === formData.contract_id);
      if (!selectedContract) throw new Error('Contrat non trouvé');

      const paymentData: any = {
        user_id: formData.user_id,
        contract_id: formData.contract_id,
        amount: parseFloat(formData.amount),
        method: formData.method,
        reference: formData.reference || null,
        notes: formData.notes || null,
        status: 'pending',
        due_date: new Date().toISOString().split('T')[0],
      };

      if (formData.method === 'check') {
        paymentData.check_number = formData.check_number || null;
        paymentData.bank_name = formData.bank_name || null;
      }

      const { data, error } = await supabase
        .from('payments')
        .insert([paymentData])
        .select(`
          *,
          profiles:user_id(id, first_name, last_name, email),
          contracts(id, user_id, model_id, status, total_amount, contract_models(id, name, producers(name)))
        `);

      if (error) throw error;

      if (data) {
        const newPayments = [data[0], ...payments] as PaymentWithDetails[];
        setPayments(newPayments);
        setFilteredPayments(newPayments);
      }

      // Reset form and close modal
      setFormData({
        user_id: '',
        contract_id: '',
        amount: '',
        method: 'check',
        reference: '',
        notes: '',
      });
      setShowModal(false);
      showToast('Paiement enregistré avec succès');
    } catch (error) {
      console.error('Error creating payment:', error);
      showToast('Erreur lors de la création du paiement', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit payment submission
  const handleEditPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;

    setIsSubmitting(true);

    try {
      const updateData: any = {
        amount: parseFloat(formData.amount),
        method: formData.method,
        reference: formData.reference || null,
        notes: formData.notes || null,
      };

      if (formData.method === 'check') {
        updateData.check_number = formData.check_number || null;
        updateData.bank_name = formData.bank_name || null;
      } else {
        updateData.check_number = null;
        updateData.bank_name = null;
      }

      const { error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', editingPayment.id);

      if (error) throw error;

      // Update local state
      const updatedPayments = payments.map(p =>
        p.id === editingPayment.id ? { ...p, ...updateData } : p
      );
      setPayments(updatedPayments);
      setFilteredPayments(updatedPayments.filter(p => {
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;
        if (searchQuery) {
          const memberName = p.profiles ? `${p.profiles.first_name} ${p.profiles.last_name}`.toLowerCase() : '';
          const contractName = (p.contracts as any)?.contract_models?.name || '';
          if (!memberName.includes(searchQuery.toLowerCase()) && !contractName.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
          }
        }
        return true;
      }));

      setEditingPayment(null);
      setShowModal(false);
      showToast('Paiement modifié avec succès');
    } catch (error) {
      console.error('Error updating payment:', error);
      showToast('Erreur lors de la mise à jour du paiement', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-stone-500">Chargement...</div>
      </div>
    );
  }

  const statuses = ['all', 'pending', 'received', 'deposited', 'late', 'cancelled'];

  // Count statuses
  const statusCounts = {
    all: payments.length,
    pending: payments.filter(p => p.status === 'pending').length,
    received: payments.filter(p => p.status === 'received').length,
    deposited: payments.filter(p => p.status === 'deposited').length,
    late: payments.filter(p => p.status === 'late').length,
    cancelled: payments.filter(p => p.status === 'cancelled').length,
  };

  const collectionRate = stats.totalExpected > 0 ? (stats.totalReceived / stats.totalExpected) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#f8f7f4] space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
            <Banknote className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-stone-900">Paiements</h1>
            <p className="text-sm text-stone-600">Gestion et suivi des recouvrement</p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingPayment(null);
            setFormData({
              user_id: '',
              contract_id: '',
              amount: '',
              method: 'check',
              reference: '',
              notes: '',
            });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
        >
          <Plus className="w-4 h-4" />
          Ajouter un paiement
        </button>
      </div>

      {/* Inline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-stone-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-stone-600 uppercase">Reçu</p>
              <p className="text-2xl font-extrabold text-green-600 mt-1">{formatCurrency(stats.totalReceived)}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-stone-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-stone-600 uppercase">En attente</p>
              <p className="text-2xl font-extrabold text-amber-600 mt-1">{formatCurrency(stats.pending)}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-amber-500"></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-stone-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-stone-600 uppercase">En retard</p>
              <p className="text-2xl font-extrabold text-red-600 mt-1">{formatCurrency(stats.late)}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-stone-200">
          <div>
            <p className="text-xs font-semibold text-stone-600 uppercase">Taux de recouvrement</p>
            <p className="text-2xl font-extrabold text-blue-600 mt-1">{collectionRate.toFixed(1)}%</p>
            <div className="mt-2 h-2 bg-stone-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${Math.min(collectionRate, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors whitespace-nowrap ${
              statusFilter === status
                ? 'bg-stone-900 text-white'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            {status === 'all'
              ? `Tous (${statusCounts.all})`
              : `${statusConfig[status as keyof typeof statusConfig]?.label || status} (${statusCounts[status as keyof typeof statusCounts]})`}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-stone-200">
        <Search className="w-4 h-4 text-stone-400" />
        <input
          type="text"
          placeholder="Rechercher par adhérent, contrat ou n° chèque..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent text-sm text-stone-900 placeholder-stone-500 focus:outline-none"
        />
        {filteredPayments.length > 0 && (
          <span className="text-xs text-stone-500 font-medium">{filteredPayments.length}</span>
        )}
      </div>

      {/* Payments List */}
      <div className="space-y-2">
        {filteredPayments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-stone-200">
            <Banknote className="w-12 h-12 text-stone-300 mx-auto mb-2" />
            <p className="text-stone-500 font-medium">Aucun paiement trouvé</p>
          </div>
        ) : (
          filteredPayments.map((payment) => {
            const contractModel = (payment.contracts as any)?.contract_models;
            const memberName = payment.profiles
              ? `${payment.profiles.first_name} ${payment.profiles.last_name}`
              : '-';
            const statusConf = statusConfig[payment.status as keyof typeof statusConfig];
            const isUpdating = updatingPaymentId === payment.id;

            return (
              <div key={payment.id} className="bg-white rounded-lg border border-stone-200 p-4 hover:shadow-sm transition-shadow">
                {/* First row: Avatar, Name, Status */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0 font-semibold text-stone-700">
                      {memberName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-stone-900">{memberName}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 flex-shrink-0 ${statusConf?.bg}`}>
                    <span className={`w-2 h-2 rounded-full ${statusConf?.dot}`}></span>
                    {statusConf?.label || payment.status}
                  </div>
                </div>

                {/* Second row: Contract and Method */}
                <div className="mb-2 text-sm text-stone-600">
                  <p>{contractModel?.name || '-'} · {paymentMethodLabels[payment.method] || '-'}</p>
                </div>

                {/* Third row: Amount, Date, Actions */}
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <p className="text-stone-600">
                      {formatDate(payment.due_date)} · <span className="font-semibold text-stone-900">{formatCurrency(payment.amount)}</span>
                    </p>
                    {payment.check_number && <p className="text-xs text-stone-500 mt-1">N° chèque: {payment.check_number}</p>}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 items-center flex-shrink-0">
                    <select
                      value={payment.status}
                      onChange={(e) => handleStatusChange(payment.id, e.target.value)}
                      disabled={isUpdating}
                      className={`text-xs px-2 py-1.5 rounded-lg border font-medium transition-colors ${
                        statusConf?.bg
                      } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                      ))}
                    </select>
                    {isUpdating && <Loader2 className="w-4 h-4 text-stone-400 animate-spin" />}
                    {!isUpdating && payment.status === 'pending' && (
                      <button
                        onClick={() => handleStatusChange(payment.id, 'received')}
                        className="px-2 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-semibold flex items-center gap-1"
                        title="Marquer comme reçu"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    )}
                    {!isUpdating && payment.status === 'received' && (
                      <button
                        onClick={() => handleStatusChange(payment.id, 'deposited')}
                        className="px-2 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-semibold flex items-center gap-1"
                        title="Marquer comme déposé"
                      >
                        <Archive className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingPayment(payment);
                        setFormData({
                          user_id: payment.user_id,
                          contract_id: payment.contract_id,
                          amount: payment.amount.toString(),
                          method: (payment.method || 'check') as 'check' | 'transfer' | 'cash' | 'card',
                          check_number: payment.check_number || '',
                          bank_name: payment.bank_name || '',
                          reference: payment.reference || '',
                          notes: payment.notes || '',
                        });
                        setShowModal(true);
                      }}
                      className="px-2 py-1.5 text-xs bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors font-semibold"
                      title="Modifier"
                    >
                      Modifier
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Toast Notifications */}
      <div className="fixed top-6 right-6 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-semibold transition-all ${
              toast.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {toast.type === 'success' && <Check className="w-4 h-4" />}
            {toast.message}
          </div>
        ))}
      </div>

      {/* Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-stone-200 sticky top-0 bg-white">
              <h2 className="text-xl font-extrabold text-stone-900">
                {editingPayment ? 'Modifier le paiement' : 'Ajouter un paiement'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingPayment(null);
                }}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={editingPayment ? handleEditPayment : handleCreatePayment} className="p-6 space-y-4">
              {!editingPayment && (
                <>
                  {/* Member Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                      Adhérent <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.user_id}
                      onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Sélectionnez un adhérent</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.first_name} {member.last_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Contract Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                      Contrat <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.contract_id}
                      onChange={(e) => setFormData({ ...formData, contract_id: e.target.value })}
                      required
                      disabled={!formData.user_id}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-stone-50 disabled:text-stone-500"
                    >
                      <option value="">Sélectionnez un contrat</option>
                      {selectedMemberContracts.map((contract) => (
                        <option key={contract.id} value={contract.id}>
                          {(contract.contract_models as any)?.name || 'Contrat'} ({formatCurrency(contract.total_amount || 0)})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Montant <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Méthode de paiement
                </label>
                <select
                  value={formData.method}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value as any })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="check">Chèque</option>
                  <option value="transfer">Virement</option>
                  <option value="cash">Espèces</option>
                  <option value="card">Carte</option>
                </select>
              </div>

              {/* Check-specific fields */}
              {formData.method === 'check' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                      N° de chèque
                    </label>
                    <input
                      type="text"
                      value={formData.check_number || ''}
                      onChange={(e) => setFormData({ ...formData, check_number: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Ex: 123456"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                      Banque
                    </label>
                    <input
                      type="text"
                      value={formData.bank_name || ''}
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Ex: BNP Paribas"
                    />
                  </div>
                </>
              )}

              {/* Reference */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Référence
                </label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Référence du paiement"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Notes supplémentaires"
                  rows={3}
                />
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPayment(null);
                  }}
                  className="flex-1 px-4 py-2 border border-stone-200 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors font-semibold text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (editingPayment ? 'Modification...' : 'Enregistrement...') : (editingPayment ? 'Modifier' : 'Enregistrer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
