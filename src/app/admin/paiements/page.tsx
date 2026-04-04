'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DollarSign, Plus, X, Check, Archive } from 'lucide-react';
import { StatsCard } from '@/components/admin/StatsCard';
import { DataTable } from '@/components/admin/DataTable';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Payment, Profile, Contract, ContractModel } from '@/types/database';

const paymentStatusLabels: Record<string, { label: string; color: string }> = {
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
  const [formData, setFormData] = useState<FormData>({
    user_id: '',
    contract_id: '',
    amount: '',
    method: 'check',
    reference: '',
    notes: '',
  });

  const supabase = createClient();

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
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  // Handle form submission for new payment
  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.user_id || !formData.contract_id || !formData.amount) {
      alert('Veuillez remplir tous les champs requis');
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
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Erreur lors de la création du paiement');
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
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('Erreur lors de la mise à jour du paiement');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build table rows
  const rows = filteredPayments.map((payment) => {
    const contractModel = (payment.contracts as any)?.contract_models;
    const memberName = payment.profiles
      ? `${payment.profiles.first_name} ${payment.profiles.last_name}`
      : '-';

    return [
      memberName,
      contractModel?.name || '-',
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
      payment.method ? paymentMethodLabels[payment.method] : '-',
      payment.check_number || '-',
      <div key={`actions-${payment.id}`} className="flex gap-2">
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
          }}
          className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
          title="Modifier"
        >
          Modifier
        </button>
        {payment.status === 'pending' && (
          <button
            onClick={() => handleStatusChange(payment.id, 'received')}
            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors flex items-center gap-1"
            title="Marquer comme reçu"
          >
            <Check className="w-3 h-3" />
            Reçu
          </button>
        )}
        {payment.status === 'received' && (
          <button
            onClick={() => handleStatusChange(payment.id, 'deposited')}
            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center gap-1"
            title="Marquer comme déposé"
          >
            <Archive className="w-3 h-3" />
            Déposé
          </button>
        )}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
            <DollarSign className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Réception des chèques</h1>
            <p className="text-sm text-slate-600">Enregistrement des paiements reçus</p>
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
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Saisir un paiement
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total attendu"
          value={formatCurrency(stats.totalExpected)}
          icon={<DollarSign className="w-6 h-6" />}
        />
        <StatsCard
          title="Total reçu"
          value={formatCurrency(stats.totalReceived)}
          icon={<DollarSign className="w-6 h-6" />}
          trend={stats.totalReceived > 0 ? 'up' : 'neutral'}
        />
        <StatsCard
          title="En attente"
          value={formatCurrency(stats.pending)}
          icon={<DollarSign className="w-6 h-6" />}
        />
        <StatsCard
          title="En retard"
          value={formatCurrency(stats.late)}
          icon={<DollarSign className="w-6 h-6" />}
          trend={stats.late > 0 ? 'down' : 'neutral'}
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
                ? 'bg-amber-600 text-white'
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
          headers={['Adhérent', 'Contrat', 'Montant', 'Échéance', 'Statut', 'Méthode', 'N° chèque', 'Actions']}
          rows={rows}
          searchPlaceholder="Rechercher par adhérent ou contrat..."
          onSearch={(query) => setSearchQuery(query)}
        />
      </div>

      {/* Collection Rate Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-900">
          <strong>Taux de recouvrement:</strong>{' '}
          {stats.totalExpected > 0
            ? `${((stats.totalReceived / stats.totalExpected) * 100).toFixed(1)}%`
            : '0%'}{' '}
          - {payments.filter((p) => p.status === 'received' || p.status === 'deposited').length} paiements reçus sur {payments.length}
        </p>
      </div>

      {/* Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-slate-900">
                {editingPayment ? 'Modifier le paiement' : 'Saisir un paiement'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingPayment(null);
                }}
                className="text-slate-400 hover:text-slate-600"
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Adhérent <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.user_id}
                      onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Contrat <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.contract_id}
                      onChange={(e) => setFormData({ ...formData, contract_id: e.target.value })}
                      required
                      disabled={!formData.user_id}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-slate-50 disabled:text-slate-500"
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
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Montant <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="0.00"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Méthode de paiement
                </label>
                <select
                  value={formData.method}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      N° de chèque
                    </label>
                    <input
                      type="text"
                      value={formData.check_number || ''}
                      onChange={(e) => setFormData({ ...formData, check_number: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Ex: 123456"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Banque
                    </label>
                    <input
                      type="text"
                      value={formData.bank_name || ''}
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Ex: BNP Paribas"
                    />
                  </div>
                </>
              )}

              {/* Reference */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Référence
                </label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Référence du paiement"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
