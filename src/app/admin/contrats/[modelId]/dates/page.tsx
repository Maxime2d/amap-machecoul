'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Plus, Trash2, RotateCcw, ChevronLeft, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { ContractModel, Producer } from '@/types/database';

interface ModelDate {
  id: string;
  model_id: string;
  delivery_date: string;
  is_cancelled: boolean;
  cancel_reason: string | null;
}

interface ContractModelWithProducer extends ContractModel {
  producer?: { name: string };
}

interface DatesByMonth {
  [monthKey: string]: ModelDate[];
}

export default function ContractDatesPage() {
  const params = useParams();
  const modelId = params.modelId as string;

  const [model, setModel] = useState<ContractModelWithProducer | null>(null);
  const [dates, setDates] = useState<ModelDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<ModelDate | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [newDeliveryDate, setNewDeliveryDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();

  // Fetch contract model
  useEffect(() => {
    async function fetchModel() {
      try {
        const { data } = await supabase
          .from('contract_models')
          .select('*, producer:producers(name)')
          .eq('id', modelId)
          .single();
        setModel(data as ContractModelWithProducer);
      } catch (error) {
        console.error('Error fetching contract model:', error);
      }
    }

    fetchModel();
  }, [modelId, supabase]);

  // Fetch delivery dates
  useEffect(() => {
    async function fetchDates() {
      try {
        const { data } = await supabase
          .from('model_dates')
          .select('*')
          .eq('model_id', modelId)
          .order('delivery_date', { ascending: true });
        setDates(data || []);
      } catch (error) {
        console.error('Error fetching dates:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDates();
  }, [modelId, supabase]);

  // Group dates by month
  const datesByMonth: DatesByMonth = {};
  dates.forEach((date) => {
    const dateObj = new Date(date.delivery_date);
    const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    if (!datesByMonth[monthKey]) {
      datesByMonth[monthKey] = [];
    }
    datesByMonth[monthKey].push(date);
  });

  const sortedMonths = Object.keys(datesByMonth).sort();

  // Calculate statistics
  const totalDates = dates.length;
  const activeDates = dates.filter((d) => !d.is_cancelled).length;
  const cancelledDates = dates.filter((d) => d.is_cancelled).length;

  // Handle add new date
  const handleAddDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeliveryDate) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('model_dates')
        .insert([
          {
            model_id: modelId,
            delivery_date: newDeliveryDate,
            is_cancelled: false,
            cancel_reason: null,
          },
        ])
        .select();

      if (error) throw error;

      if (data) {
        setDates([...dates, data[0]]);
        setNewDeliveryDate('');
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error adding date:', error);
      alert('Erreur lors de l\'ajout de la date');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel date
  const handleCancelDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('model_dates')
        .update({
          is_cancelled: true,
          cancel_reason: cancelReason || null,
        })
        .eq('id', selectedDate.id);

      if (error) throw error;

      setDates(
        dates.map((d) =>
          d.id === selectedDate.id
            ? { ...d, is_cancelled: true, cancel_reason: cancelReason || null }
            : d
        )
      );
      setShowCancelModal(false);
      setSelectedDate(null);
      setCancelReason('');
    } catch (error) {
      console.error('Error cancelling date:', error);
      alert('Erreur lors de l\'annulation de la date');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reactivate date
  const handleReactivateDate = async (dateId: string) => {
    try {
      const { error } = await supabase
        .from('model_dates')
        .update({
          is_cancelled: false,
          cancel_reason: null,
        })
        .eq('id', dateId);

      if (error) throw error;

      setDates(
        dates.map((d) =>
          d.id === dateId
            ? { ...d, is_cancelled: false, cancel_reason: null }
            : d
        )
      );
    } catch (error) {
      console.error('Error reactivating date:', error);
      alert('Erreur lors de la réactivation de la date');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Chargement...</div>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Modèle de contrat non trouvé</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back link */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/admin/contrats"
            className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium text-sm mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Retour aux contrats
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{model.name}</h1>
              <p className="text-sm text-slate-600">
                {(model.producer as any)?.name || 'Producteur inconnu'}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Ajouter une date
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Total des dates</p>
          <p className="text-3xl font-bold text-slate-900">{totalDates}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Dates actives</p>
          <p className="text-3xl font-bold text-green-600">{activeDates}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Dates annulées</p>
          <p className="text-3xl font-bold text-red-600">{cancelledDates}</p>
        </div>
      </div>

      {/* Calendar View */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        {sortedMonths.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">Aucune date de livraison</p>
            <p className="text-sm text-slate-500 mt-1">Ajoutez votre première date</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {sortedMonths.map((monthKey) => {
              const monthDates = datesByMonth[monthKey];
              const [year, month] = monthKey.split('-');
              const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('fr-FR', {
                month: 'long',
                year: 'numeric',
              });

              return (
                <div key={monthKey} className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 capitalize">
                    {monthName}
                  </h3>
                  <div className="space-y-3">
                    {monthDates.map((date) => (
                      <div
                        key={date.id}
                        className={`p-4 rounded-lg border-2 ${
                          date.is_cancelled
                            ? 'border-red-200 bg-red-50'
                            : 'border-green-200 bg-green-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className={`inline-block w-3 h-3 rounded-full ${
                                  date.is_cancelled
                                    ? 'bg-red-600'
                                    : 'bg-green-600'
                                }`}
                              />
                              <span className="font-medium text-slate-900">
                                {new Date(date.delivery_date).toLocaleDateString('fr-FR', {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </span>
                              {date.is_cancelled && (
                                <span className="text-xs font-semibold text-red-700 bg-red-200 px-2 py-1 rounded">
                                  Annulée
                                </span>
                              )}
                            </div>
                            {date.is_cancelled && date.cancel_reason && (
                              <div className="flex items-start gap-2 mt-2 ml-5">
                                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700">{date.cancel_reason}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            {date.is_cancelled ? (
                              <button
                                onClick={() => handleReactivateDate(date.id)}
                                className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors font-medium"
                              >
                                <RotateCcw className="w-4 h-4" />
                                Réactiver
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedDate(date);
                                  setShowCancelModal(true);
                                }}
                                className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors font-medium"
                              >
                                <Trash2 className="w-4 h-4" />
                                Annuler
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Date Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Ajouter une date de livraison</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <form onSubmit={handleAddDate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date de livraison
                </label>
                <input
                  type="date"
                  value={newDeliveryDate}
                  onChange={(e) => setNewDeliveryDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newDeliveryDate}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Date Modal */}
      {showCancelModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Annuler une date</h2>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedDate(null);
                  setCancelReason('');
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <form onSubmit={handleCancelDate} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-700 font-medium mb-2">
                  Date:{' '}
                  <span className="font-bold text-slate-900">
                    {new Date(selectedDate.delivery_date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Raison de l'annulation (facultatif)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ex: Problème météorologique, producteur indisponible..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows={4}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedDate(null);
                    setCancelReason('');
                  }}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Annulation...' : 'Confirmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}