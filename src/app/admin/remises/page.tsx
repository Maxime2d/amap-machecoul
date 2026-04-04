'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  DollarSign,
  Plus,
  X,
  Eye,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { StatsCard } from '@/components/admin/StatsCard';
import { DataTable } from '@/components/admin/DataTable';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Profile } from '@/types/database';

interface Producer {
  id: string;
  name: string;
}

interface Payment {
  id: string;
  amount: number;
  check_number: string | null;
  bank_name: string | null;
  method: string;
  status: string;
}

interface PaymentWithMember extends Payment {
  profiles?: Profile;
}

interface RemittancePayment {
  id: string;
  payment_id: string;
  payment?: PaymentWithMember;
}

interface Remittance {
  id: string;
  producer_id: string;
  created_by: string;
  remittance_date: string;
  total_amount: number;
  status: 'draft' | 'submitted' | 'completed';
  notes: string | null;
  created_at: string;
  producers?: Producer;
  producer_remittance_payments?: RemittancePayment[];
}

interface FormData {
  producer_id: string;
  selectedPayments: string[];
  notes: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft: {
    label: 'Brouillon',
    color: 'bg-gray-100 text-gray-800',
    icon: Clock,
  },
  submitted: {
    label: 'Soumis',
    color: 'bg-blue-100 text-blue-800',
    icon: AlertCircle,
  },
  completed: {
    label: 'Terminé',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
  },
};

export default function RemittancesPage() {
  const [remittances, setRemittances] = useState<Remittance[]>([]);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedRemittance, setExpandedRemittance] = useState<string | null>(
    null
  );
  const [eligiblePayments, setEligiblePayments] = useState<PaymentWithMember[]>(
    []
  );
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    producer_id: '',
    selectedPayments: [],
    notes: '',
  });

  const supabase = createClient();

  // Fetch remittances
  useEffect(() => {
    async function fetchRemittances() {
      try {
        const { data } = await supabase
          .from('producer_remittances')
          .select(`
            *,
            producers(id, name),
            producer_remittance_payments(
              id,
              payment_id,
              payments(
                id,
                amount,
                check_number,
                bank_name,
                method,
                status,
                profiles:user_id(id, first_name, last_name, email)
              )
            )
          `)
          .order('created_at', { ascending: false });

        // Flatten the payment data properly
        const processedData = (data || []).map((remittance: any) => ({
          ...remittance,
          producer_remittance_payments:
            remittance.producer_remittance_payments?.map((prp: any) => ({
              id: prp.id,
              payment_id: prp.payment_id,
              payment: prp.payments,
            })) || [],
        }));

        setRemittances(processedData);
      } catch (error) {
        console.error('Error fetching remittances:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRemittances();
  }, [supabase]);

  // Fetch producers
  useEffect(() => {
    async function fetchProducers() {
      try {
        const { data } = await supabase
          .from('producers')
          .select('id, name')
          .eq('status', 'active')
          .order('name', { ascending: true });
        setProducers(data || []);
      } catch (error) {
        console.error('Error fetching producers:', error);
      }
    }

    fetchProducers();
  }, [supabase]);

  // Fetch eligible payments when producer is selected
  useEffect(() => {
    async function fetchEligiblePayments() {
      if (!formData.producer_id) {
        setEligiblePayments([]);
        return;
      }

      setLoadingPayments(true);
      try {
        // Step 1: Get all contract models for the producer
        const { data: contractModels } = await supabase
          .from('contract_models')
          .select('id')
          .eq('producer_id', formData.producer_id);

        if (!contractModels || contractModels.length === 0) {
          setEligiblePayments([]);
          setLoadingPayments(false);
          return;
        }

        const modelIds = contractModels.map((m) => m.id);

        // Step 2: Get all contracts for those models
        const { data: contracts } = await supabase
          .from('contracts')
          .select('id')
          .in('model_id', modelIds);

        if (!contracts || contracts.length === 0) {
          setEligiblePayments([]);
          setLoadingPayments(false);
          return;
        }

        const contractIds = contracts.map((c) => c.id);

        // Step 3: Get payments that are received, method=check, not already in a remittance
        const { data: alreadyRemitted } = await supabase
          .from('producer_remittance_payments')
          .select('payment_id');

        const remittedPaymentIds = alreadyRemitted?.map((p) => p.payment_id) || [];

        const { data: payments } = await supabase
          .from('payments')
          .select(
            `
            id,
            amount,
            check_number,
            bank_name,
            method,
            status,
            profiles:user_id(id, first_name, last_name, email)
          `
          )
          .in('contract_id', contractIds)
          .eq('status', 'received')
          .eq('method', 'check');

        // Filter out payments that are already in a remittance
        const filteredPayments = (payments || []).filter(
          (p) => !remittedPaymentIds.includes(p.id)
        ) as PaymentWithMember[];

        setEligiblePayments(filteredPayments);
      } catch (error) {
        console.error('Error fetching eligible payments:', error);
        setEligiblePayments([]);
      } finally {
        setLoadingPayments(false);
      }
    }

    fetchEligiblePayments();
  }, [formData.producer_id, supabase]);

  // Calculate stats
  const stats = {
    totalRemittances: remittances.length,
    draftRemittances: remittances.filter((r) => r.status === 'draft').length,
    submittedRemittances: remittances.filter(
      (r) => r.status === 'submitted'
    ).length,
    totalAmountRemitted: remittances.reduce(
      (sum, r) => sum + r.total_amount,
      0
    ),
  };

  // Calculate total for selected payments
  const selectedTotal = eligiblePayments
    .filter((p) => formData.selectedPayments.includes(p.id))
    .reduce((sum, p) => sum + p.amount, 0);

  // Handle create remittance
  const handleCreateRemittance = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.producer_id || formData.selectedPayments.length === 0) {
      alert('Veuillez sélectionner un producteur et au moins un chèque');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create remittance
      const { data: remittanceData, error: remittanceError } = await supabase
        .from('producer_remittances')
        .insert([
          {
            producer_id: formData.producer_id,
            remittance_date: new Date().toISOString().split('T')[0],
            total_amount: selectedTotal,
            status: 'draft',
            notes: formData.notes || null,
            created_by: (await supabase.auth.getUser()).data.user?.id,
          },
        ])
        .select();

      if (remittanceError) throw remittanceError;

      const remittanceId = remittanceData?.[0]?.id;
      if (!remittanceId) throw new Error('Failed to create remittance');

      // Create payment associations
      const paymentAssociations = formData.selectedPayments.map((paymentId) => ({
        remittance_id: remittanceId,
        payment_id: paymentId,
      }));

      const { error: associationError } = await supabase
        .from('producer_remittance_payments')
        .insert(paymentAssociations);

      if (associationError) throw associationError;

      // Fetch updated remittances
      const { data: updatedRemittances } = await supabase
        .from('producer_remittances')
        .select(`
          *,
          producers(id, name),
          producer_remittance_payments(
            id,
            payment_id,
            payments(
              id,
              amount,
              check_number,
              bank_name,
              method,
              status,
              profiles:user_id(id, first_name, last_name, email)
            )
          )
        `)
        .order('created_at', { ascending: false });

      const processedData = (updatedRemittances || []).map((remittance: any) => ({
        ...remittance,
        producer_remittance_payments:
          remittance.producer_remittance_payments?.map((prp: any) => ({
            id: prp.id,
            payment_id: prp.payment_id,
            payment: prp.payments,
          })) || [],
      }));

      setRemittances(processedData);

      // Reset form and close modal
      setFormData({
        producer_id: '',
        selectedPayments: [],
        notes: '',
      });
      setShowModal(false);
    } catch (error) {
      console.error('Error creating remittance:', error);
      alert('Erreur lors de la création de la remise');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (
    remittanceId: string,
    newStatus: 'draft' | 'submitted' | 'completed'
  ) => {
    try {
      const { error } = await supabase
        .from('producer_remittances')
        .update({ status: newStatus })
        .eq('id', remittanceId);

      if (error) throw error;

      setRemittances((prev) =>
        prev.map((r) =>
          r.id === remittanceId ? { ...r, status: newStatus } : r
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  // Handle delete remittance (only draft)
  const handleDeleteRemittance = async (remittanceId: string) => {
    if (
      !confirm(
        'Êtes-vous sûr de vouloir supprimer cette remise ? Cette action est irréversible.'
      )
    ) {
      return;
    }

    try {
      // Delete associated payments first
      const { error: associationError } = await supabase
        .from('producer_remittance_payments')
        .delete()
        .eq('remittance_id', remittanceId);

      if (associationError) throw associationError;

      // Delete remittance
      const { error: remittanceError } = await supabase
        .from('producer_remittances')
        .delete()
        .eq('id', remittanceId);

      if (remittanceError) throw remittanceError;

      setRemittances((prev) => prev.filter((r) => r.id !== remittanceId));
    } catch (error) {
      console.error('Error deleting remittance:', error);
      alert('Erreur lors de la suppression de la remise');
    }
  };

  // Build table rows
  const rows = remittances.map((remittance) => {
    const paymentCount = remittance.producer_remittance_payments?.length || 0;
    const StatusIcon = statusConfig[remittance.status]?.icon;

    return [
      formatDate(remittance.remittance_date),
      remittance.producers?.name || '-',
      paymentCount.toString(),
      formatCurrency(remittance.total_amount),
      <span
        key={`status-${remittance.id}`}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
          statusConfig[remittance.status]?.color ||
          'bg-gray-100 text-gray-800'
        }`}
      >
        {StatusIcon && <StatusIcon className="w-3 h-3" />}
        {statusConfig[remittance.status]?.label || remittance.status}
      </span>,
      <div key={`actions-${remittance.id}`} className="flex gap-2">
        <button
          onClick={() =>
            setExpandedRemittance(
              expandedRemittance === remittance.id ? null : remittance.id
            )
          }
          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center gap-1"
          title="Voir les détails"
        >
          <Eye className="w-3 h-3" />
          Détails
        </button>

        {remittance.status === 'draft' && (
          <button
            onClick={() => handleStatusChange(remittance.id, 'submitted')}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            title="Soumettre"
          >
            Soumettre
          </button>
        )}

        {remittance.status === 'submitted' && (
          <button
            onClick={() => handleStatusChange(remittance.id, 'completed')}
            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            title="Marquer comme complétée"
          >
            Complétée
          </button>
        )}

        {remittance.status === 'draft' && (
          <button
            onClick={() => handleDeleteRemittance(remittance.id)}
            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors flex items-center gap-1"
            title="Supprimer"
          >
            <Trash2 className="w-3 h-3" />
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Remise producteur
            </h1>
            <p className="text-sm text-slate-600">
              Gestion des bordereaux de remise de chèques
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setFormData({
              producer_id: '',
              selectedPayments: [],
              notes: '',
            });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Créer une remise
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total des remises"
          value={stats.totalRemittances}
          icon={<DollarSign className="w-6 h-6" />}
        />
        <StatsCard
          title="Remises en brouillon"
          value={stats.draftRemittances}
          icon={<Clock className="w-6 h-6" />}
        />
        <StatsCard
          title="Remises soumises"
          value={stats.submittedRemittances}
          icon={<AlertCircle className="w-6 h-6" />}
        />
        <StatsCard
          title="Montant total remis"
          value={formatCurrency(stats.totalAmountRemitted)}
          icon={<CheckCircle className="w-6 h-6" />}
        />
      </div>

      {/* Remittances Table */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Remises</h2>
        <DataTable
          headers={['Date', 'Producteur', 'Nombre de chèques', 'Montant', 'Statut', 'Actions']}
          rows={rows}
        />
      </div>

      {/* Expanded Details */}
      {expandedRemittance && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Détails des chèques
          </h2>
          <div className="space-y-2">
            {remittances
              .find((r) => r.id === expandedRemittance)
              ?.producer_remittance_payments?.map((prp) => {
                const payment = prp.payment;
                const memberName = payment?.profiles
                  ? `${payment.profiles.first_name} ${payment.profiles.last_name}`
                  : '-';

                return (
                  <div
                    key={prp.id}
                    className="flex items-center justify-between p-3 border border-slate-200 rounded bg-slate-50"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{memberName}</p>
                      <p className="text-xs text-slate-600">
                        Chèque: {payment?.check_number || '-'} | Banque:{' '}
                        {payment?.bank_name || '-'}
                      </p>
                    </div>
                    <p className="font-semibold text-slate-900">
                      {formatCurrency(payment?.amount || 0)}
                    </p>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Create/Edit Remittance Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-slate-900">
                Créer une remise producteur
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateRemittance} className="p-6 space-y-4">
              {/* Producer Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Producteur <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.producer_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      producer_id: e.target.value,
                      selectedPayments: [],
                    })
                  }
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Sélectionnez un producteur</option>
                  {producers.map((producer) => (
                    <option key={producer.id} value={producer.id}>
                      {producer.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Eligible Payments */}
              {formData.producer_id && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Chèques disponibles{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  {loadingPayments ? (
                    <p className="text-sm text-slate-600 py-4">Chargement des chèques...</p>
                  ) : eligiblePayments.length === 0 ? (
                    <p className="text-sm text-slate-600 py-4">
                      Aucun chèque reçu disponible pour ce producteur
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto border border-slate-200 rounded p-3 bg-slate-50">
                      {eligiblePayments.map((payment) => {
                        const memberName = payment.profiles
                          ? `${payment.profiles.first_name} ${payment.profiles.last_name}`
                          : 'Adhérent inconnu';

                        return (
                          <label
                            key={payment.id}
                            className="flex items-center gap-3 p-2 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.selectedPayments.includes(
                                payment.id
                              )}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    selectedPayments: [
                                      ...prev.selectedPayments,
                                      payment.id,
                                    ],
                                  }));
                                } else {
                                  setFormData((prev) => ({
                                    ...prev,
                                    selectedPayments:
                                      prev.selectedPayments.filter(
                                        (id) => id !== payment.id
                                      ),
                                  }));
                                }
                              }}
                              className="rounded"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900">
                                {memberName}
                              </p>
                              <p className="text-xs text-slate-600">
                                Chèque: {payment.check_number || '-'} | Banque:{' '}
                                {payment.bank_name || '-'}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-slate-900">
                              {formatCurrency(payment.amount)}
                            </p>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Total Amount */}
              {formData.selectedPayments.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-sm font-medium text-green-900">
                    Total: <span className="text-lg">{formatCurrency(selectedTotal)}</span>
                  </p>
                  <p className="text-xs text-green-800 mt-1">
                    {formData.selectedPayments.length} chèque(s) sélectionné(s)
                  </p>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Notes supplémentaires sur cette remise..."
                  rows={3}
                />
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !formData.producer_id ||
                    formData.selectedPayments.length === 0
                  }
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Création...' : 'Créer la remise'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
