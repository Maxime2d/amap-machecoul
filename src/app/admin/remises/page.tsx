'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Check,
  Loader2,
  Plus,
  X,
  Trash2,
  ChevronDown,
  Banknote,
} from 'lucide-react';
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

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

const statusConfig = {
  draft: {
    label: 'Brouillon',
    dot: 'bg-stone-400',
    bg: 'bg-stone-100 text-stone-600 border-stone-200',
  },
  submitted: {
    label: 'Soumis',
    dot: 'bg-blue-500',
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  completed: {
    label: 'Terminé',
    dot: 'bg-green-500',
    bg: 'bg-green-50 text-green-700 border-green-200',
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
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [formData, setFormData] = useState<FormData>({
    producer_id: '',
    selectedPayments: [],
    notes: '',
  });

  const supabase = createClient();

  // Toast notification system
  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    const toast = { id, type, message };
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  };

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
        addToast('error', 'Erreur lors du chargement des remises');
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
      addToast('error', 'Veuillez sélectionner un producteur et au moins un chèque');
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
      addToast('success', 'Remise créée avec succès');
    } catch (error) {
      console.error('Error creating remittance:', error);
      addToast('error', 'Erreur lors de la création de la remise');
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

      const statusLabel = statusConfig[newStatus]?.label || newStatus;
      addToast('success', `Statut changé en ${statusLabel}`);
    } catch (error) {
      console.error('Error updating status:', error);
      addToast('error', 'Erreur lors de la mise à jour du statut');
    }
  };

  // Handle delete remittance (only draft)
  const handleDeleteRemittance = async (remittanceId: string) => {
    if (
      !window.confirm(
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
      addToast('success', 'Remise supprimée avec succès');
    } catch (error) {
      console.error('Error deleting remittance:', error);
      addToast('error', 'Erreur lors de la suppression de la remise');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-stone-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-[#f8f7f4] min-h-screen p-6">
      {/* Toast Notifications */}
      <div className="fixed top-right z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-xl px-4 py-3 text-sm font-medium animate-in fade-in slide-in-from-right-4 ${
              toast.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
              <Banknote className="w-6 h-6 text-amber-600" />
            </div>
            Remise producteur
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Gestion des bordereaux de remise de chèques
          </p>
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
          className="flex items-center gap-2 px-5 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors font-extrabold text-sm"
        >
          <Plus className="w-4 h-4" />
          Créer une remise
        </button>
      </div>

      {/* Compact inline stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Stone: Total remises */}
        <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-sm">
          <p className="text-xs font-medium text-stone-600 uppercase tracking-wide">
            Total remises
          </p>
          <p className="text-2xl font-extrabold text-stone-900 mt-2">
            {stats.totalRemittances}
          </p>
        </div>

        {/* Amber: Brouillons */}
        <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm">
          <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">
            Brouillons
          </p>
          <p className="text-2xl font-extrabold text-amber-900 mt-2">
            {stats.draftRemittances}
          </p>
        </div>

        {/* Blue: Soumises */}
        <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
            Soumises
          </p>
          <p className="text-2xl font-extrabold text-blue-900 mt-2">
            {stats.submittedRemittances}
          </p>
        </div>

        {/* Green: Montant total remis */}
        <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm">
          <p className="text-xs font-medium text-green-600 uppercase tracking-wide">
            Montant total remis
          </p>
          <p className="text-2xl font-extrabold text-green-900 mt-2">
            {formatCurrency(stats.totalAmountRemitted)}
          </p>
        </div>
      </div>

      {/* Remittances List */}
      <div className="space-y-3">
        {remittances.length === 0 ? (
          <div className="bg-white rounded-xl p-8 border border-stone-200 text-center">
            <p className="text-stone-600">Aucune remise créée pour le moment</p>
          </div>
        ) : (
          remittances.map((remittance) => {
            const paymentCount = remittance.producer_remittance_payments?.length || 0;
            const isExpanded = expandedRemittance === remittance.id;
            const config = statusConfig[remittance.status];

            return (
              <div key={remittance.id}>
                {/* Main row */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-4 flex items-center justify-between gap-4">
                    {/* Left: Date & Producer */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-extrabold text-slate-900">
                        {formatDate(remittance.remittance_date)}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {remittance.producers?.name || '-'} · {paymentCount}{' '}
                        {paymentCount === 1 ? 'chèque' : 'chèques'} ·{' '}
                        {formatCurrency(remittance.total_amount)}
                      </p>
                    </div>

                    {/* Middle: Status badge */}
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${config.dot}`}
                      />
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border ${config.bg}`}
                      >
                        {config.label}
                      </span>
                    </div>

                    {/* Right: Action buttons */}
                    <div className="flex items-center gap-2">
                      {remittance.status === 'draft' && (
                        <button
                          onClick={() => handleStatusChange(remittance.id, 'submitted')}
                          className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                        >
                          Soumettre
                        </button>
                      )}

                      {remittance.status === 'submitted' && (
                        <button
                          onClick={() =>
                            handleStatusChange(remittance.id, 'completed')
                          }
                          className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                        >
                          Complétée
                        </button>
                      )}

                      {remittance.status === 'draft' && (
                        <button
                          onClick={() => handleDeleteRemittance(remittance.id)}
                          className="px-2 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() =>
                          setExpandedRemittance(
                            isExpanded ? null : remittance.id
                          )
                        }
                        className={`px-2 py-1.5 text-slate-600 hover:bg-stone-100 rounded-lg transition-colors ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      >
                        <ChevronDown className="w-4 h-4 transition-transform" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded: Checks list */}
                  {isExpanded && (
                    <div className="border-t border-stone-200 bg-stone-50 p-4 space-y-2">
                      {remittance.producer_remittance_payments?.length === 0 ? (
                        <p className="text-xs text-stone-600">Aucun chèque</p>
                      ) : (
                        remittance.producer_remittance_payments?.map((prp) => {
                          const payment = prp.payment;
                          const memberName = payment?.profiles
                            ? `${payment.profiles.first_name} ${payment.profiles.last_name}`
                            : 'Adhérent inconnu';

                          return (
                            <div
                              key={prp.id}
                              className="flex items-center justify-between p-2 bg-white rounded-lg border border-stone-100"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-900">
                                  {memberName}
                                </p>
                                <p className="text-xs text-slate-600">
                                  Chèque: {payment?.check_number || '-'} |{' '}
                                  {payment?.bank_name || '-'}
                                </p>
                              </div>
                              <p className="text-xs font-semibold text-slate-900 ml-2 whitespace-nowrap">
                                {formatCurrency(payment?.amount || 0)}
                              </p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create/Edit Remittance Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-stone-200 sticky top-0 bg-white">
              <h2 className="text-lg font-extrabold text-slate-900">
                Créer une remise producteur
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateRemittance} className="p-6 space-y-4">
              {/* Producer Selection */}
              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-2">
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
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
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
                  <label className="block text-sm font-extrabold text-slate-700 mb-2">
                    Chèques disponibles{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  {loadingPayments ? (
                    <div className="flex items-center gap-2 text-sm text-stone-600 py-4">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Chargement des chèques...
                    </div>
                  ) : eligiblePayments.length === 0 ? (
                    <p className="text-sm text-stone-600 py-4">
                      Aucun chèque reçu disponible pour ce producteur
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto border border-stone-200 rounded-xl p-3 bg-stone-50">
                      {eligiblePayments.map((payment) => {
                        const memberName = payment.profiles
                          ? `${payment.profiles.first_name} ${payment.profiles.last_name}`
                          : 'Adhérent inconnu';

                        return (
                          <label
                            key={payment.id}
                            className="flex items-center gap-3 p-2 hover:bg-stone-100 rounded-lg cursor-pointer transition-colors"
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
                              <p className="text-xs text-stone-600">
                                Chèque: {payment.check_number || '-'} | Banque:{' '}
                                {payment.bank_name || '-'}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-slate-900 whitespace-nowrap">
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
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-green-900">
                    Total:{' '}
                    <span className="text-lg font-extrabold">
                      {formatCurrency(selectedTotal)}
                    </span>
                  </p>
                  <p className="text-xs text-green-800 mt-1">
                    {formData.selectedPayments.length} chèque(s) sélectionné(s)
                  </p>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  placeholder="Notes supplémentaires sur cette remise..."
                  rows={3}
                />
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-stone-200 text-slate-700 rounded-xl hover:bg-stone-50 transition-colors font-medium text-sm"
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
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
