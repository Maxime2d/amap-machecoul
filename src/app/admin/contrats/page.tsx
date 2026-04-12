'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, Check, Loader2, Plus, X, FileText, Users } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { ContractModel, Producer } from '@/types/database';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

const statusConfig = {
  draft: { label: 'Brouillon', dot: 'bg-stone-400', bg: 'bg-stone-100 text-stone-600 border-stone-200' },
  open: { label: 'Ouvert', dot: 'bg-blue-500', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  active: { label: 'Actif', dot: 'bg-green-500', bg: 'bg-green-50 text-green-700 border-green-200' },
  closed: { label: 'Fermé', dot: 'bg-red-500', bg: 'bg-red-50 text-red-700 border-red-200' },
  archived: { label: 'Archivé', dot: 'bg-stone-400', bg: 'bg-stone-100 text-stone-600 border-stone-200' },
};

interface ContractWithProducer extends ContractModel {
  producer?: { name: string };
}

interface SubscriberCount {
  [modelId: string]: number;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<ContractWithProducer[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<ContractWithProducer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [producers, setProducers] = useState<Producer[]>([]);
  const [subscriberCounts, setSubscriberCounts] = useState<SubscriberCount>({});
  const [totalSubscribers, setTotalSubscribers] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    producer_id: '',
    nature: 'subscription' as 'subscription' | 'flexible',
    start_date: '',
    end_date: '',
    enroll_start: '',
    enroll_end: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  // Fetch contract models with producer info
  useEffect(() => {
    async function fetchContracts() {
      try {
        const { data } = await supabase
          .from('contract_models')
          .select('*, producer:producers(name)')
          .order('created_at', { ascending: false });
        setContracts(data || []);
        setFilteredContracts(data || []);
      } finally {
        setLoading(false);
      }
    }

    fetchContracts();
  }, [supabase]);

  // Fetch producers for the form
  useEffect(() => {
    async function fetchProducers() {
      try {
        const { data } = await supabase
          .from('producers')
          .select('id, name')
          .order('name', { ascending: true });
        setProducers(data || []);
      } catch (error) {
        console.error('Error fetching producers:', error);
      }
    }

    fetchProducers();
  }, [supabase]);  // Fetch subscriber counts
  useEffect(() => {
    async function fetchSubscriberCounts() {
      try {
        const { data } = await supabase
          .from('contracts')
          .select('model_id');

        const counts: SubscriberCount = {};
        let total = 0;

        if (data) {
          data.forEach((contract: any) => {
            counts[contract.model_id] = (counts[contract.model_id] || 0) + 1;
            total++;
          });
        }

        setSubscriberCounts(counts);
        setTotalSubscribers(total);
      } catch (error) {
        console.error('Error fetching subscriber counts:', error);
      }
    }

    fetchSubscriberCounts();
  }, [supabase]);

  // Filter and search contracts
  useEffect(() => {
    let filtered = contracts;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((contract) => contract.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (contract) =>
          contract.name.toLowerCase().includes(query) ||
          (contract.producer as any)?.name?.toLowerCase().includes(query)
      );
    }

    setFilteredContracts(filtered);
  }, [statusFilter, contracts, searchQuery]);

  // Show toast notification
  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  };

  // Handle status change
  const handleStatusChange = async (modelId: string, newStatus: string) => {
    setUpdatingId(modelId);
    try {
      const { error } = await supabase
        .from('contract_models')
        .update({ status: newStatus })
        .eq('id', modelId);

      if (error) throw error;

      // Update local state
      setContracts(contracts.map(c =>
        c.id === modelId ? { ...c, status: newStatus } : c
      ));
      addToast('Statut mis à jour', 'success');
    } catch (error) {
      console.error('Error updating status:', error);
      addToast('Erreur lors de la mise à jour du statut', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle form submission
  const handleCreateModel = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('contract_models')
        .insert([{
          name: formData.name,
          producer_id: formData.producer_id,
          nature: formData.nature,
          start_date: formData.start_date,
          end_date: formData.end_date,
          enroll_start: formData.enroll_start,
          enroll_end: formData.enroll_end,
          status: 'draft',
        }])
        .select('*, producer:producers(name)');

      if (error) throw error;

      // Update local state
      if (data) {
        setContracts([data[0], ...contracts]);
        setFilteredContracts([data[0], ...filteredContracts]);
      }

      // Reset form and close modal
      setFormData({
        name: '',
        producer_id: '',
        nature: 'subscription',
        start_date: '',
        end_date: '',
        enroll_start: '',
        enroll_end: '',
      });
      setShowModal(false);
      addToast('Modèle de contrat créé', 'success');
    } catch (error) {
      console.error('Error creating contract model:', error);
      addToast('Erreur lors de la création du modèle de contrat', 'error');
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

  // Calculate stats
  const activeModels = contracts.filter(c => c.status === 'open' || c.status === 'active').length;
  const statusCounts = {
    all: contracts.length,
    draft: contracts.filter(c => c.status === 'draft').length,
    open: contracts.filter(c => c.status === 'open').length,
    active: contracts.filter(c => c.status === 'active').length,
    closed: contracts.filter(c => c.status === 'closed').length,
    archived: contracts.filter(c => c.status === 'archived').length,
  };

  const statuses = ['all', 'draft', 'open', 'active', 'closed', 'archived'];

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Toast Notifications */}
      <div className="fixed top-6 right-6 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-in fade-in slide-in-from-right-4 ${
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

      <div className="space-y-6 p-8">
        {/* Header */}
        <AdminPageHeader
          title="Gestion des contrats"
          subtitle="Organisez et gerez vos modeles de contrats"
          imageUrl="https://images.unsplash.com/photo-1566385101042-1a0aa4c1c900?w=900&q=75"
        />
        <div className="flex items-center justify-end -mt-4 mb-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold text-sm"
          >
            <Plus className="w-5 h-5" />
            Créer un modèle
          </button>
        </div>

        {/* Inline Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-stone-100 rounded-lg px-4 py-3 border border-stone-200">
            <p className="text-stone-600 text-xs font-semibold uppercase tracking-wide">Total modèles</p>
            <p className="text-2xl font-extrabold text-stone-900 mt-1">{contracts.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg px-4 py-3 border border-green-200">
            <p className="text-green-700 text-xs font-semibold uppercase tracking-wide">Actifs/Ouverts</p>
            <p className="text-2xl font-extrabold text-green-700 mt-1">{activeModels}</p>
          </div>
          <div className="bg-blue-50 rounded-lg px-4 py-3 border border-blue-200">
            <p className="text-blue-700 text-xs font-semibold uppercase tracking-wide">Total abonnés</p>
            <p className="text-2xl font-extrabold text-blue-700 mt-1">{totalSubscribers}</p>
          </div>
        </div>

        {/* Search and Tabs */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-stone-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou producteur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-stone-900"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-green-700 text-white'
                    : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                {status === 'all'
                  ? `Tous (${statusCounts.all})`
                  : `${statusConfig[status as keyof typeof statusConfig]?.label || status} (${statusCounts[status as keyof typeof statusCounts] || 0})`}
              </button>
            ))}
          </div>

          <p className="text-sm text-stone-600">
            {filteredContracts.length} résultat{filteredContracts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Contracts List */}
        <div className="space-y-3">
          {filteredContracts.length === 0 ? (
            <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
              <FileText className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-600 font-medium">Aucun modèle de contrat trouvé</p>
              <p className="text-stone-500 text-sm mt-1">
                {searchQuery ? 'Essayez une autre recherche' : 'Créez votre premier modèle'}
              </p>
            </div>
          ) : (
            filteredContracts.map((contract) => (
              <div
                key={contract.id}
                className="bg-white rounded-xl border border-stone-200 p-4 hover:border-stone-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Contract Name and Producer */}
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-stone-400 flex-shrink-0" />
                      <h3 className="text-base font-extrabold text-stone-900 truncate">
                        {contract.name}
                      </h3>
                    </div>

                    {/* Producer and Nature */}
                    <div className="flex items-center gap-4 mb-3 text-sm text-stone-600">
                      <span className="font-medium">
                        {(contract.producer as any)?.name || '-'}
                      </span>
                      <span className="inline-block px-2 py-1 bg-stone-100 text-stone-700 rounded-md text-xs font-semibold">
                        {contract.nature === 'subscription' ? 'Abonnement' : 'Flexible'}
                      </span>
                    </div>

                    {/* Period and Subscribers */}
                    <div className="flex items-center gap-4 text-xs text-stone-600">
                      <span>
                        {formatDate(contract.start_date)} — {formatDate(contract.end_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {subscriberCounts[contract.id] || 0} abonnés
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Status Badge */}
                    <div
                      className={`px-3 py-1 rounded-md text-xs font-semibold border flex items-center gap-1.5 ${
                        statusConfig[contract.status as keyof typeof statusConfig]?.bg ||
                        'bg-stone-100 text-stone-600 border-stone-200'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          statusConfig[contract.status as keyof typeof statusConfig]?.dot ||
                          'bg-stone-400'
                        }`}
                      />
                      {statusConfig[contract.status as keyof typeof statusConfig]?.label ||
                        contract.status}
                    </div>

                    {/* Status Dropdown */}
                    <div className="relative">
                      <select
                        value={contract.status}
                        onChange={(e) => handleStatusChange(contract.id, e.target.value)}
                        disabled={updatingId === contract.id}
                        className="appearance-none px-3 py-2 rounded-lg text-sm bg-stone-50 border border-stone-200 text-stone-700 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 8px center',
                          paddingRight: '28px',
                        }}
                      >
                        <option value="draft">Brouillon</option>
                        <option value="open">Ouvert</option>
                        <option value="active">Actif</option>
                        <option value="closed">Fermé</option>
                        <option value="archived">Archivé</option>
                      </select>
                      {updatingId === contract.id && (
                        <Loader2 className="absolute right-8 top-2.5 w-4 h-4 text-stone-500 animate-spin" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Model Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-stone-200 sticky top-0 bg-white">
              <h2 className="text-xl font-extrabold text-stone-900">Créer un modèle de contrat</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateModel} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-2">
                  Nom du modèle
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-stone-900"
                  placeholder="Ex: Panier Bio Saisonnier"
                />
              </div>

              {/* Producer */}
              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-2">
                  Producteur
                </label>
                <select
                  value={formData.producer_id}
                  onChange={(e) => setFormData({ ...formData, producer_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-stone-900"
                >
                  <option value="">Sélectionnez un producteur</option>
                  {producers.map((producer) => (
                    <option key={producer.id} value={producer.id}>
                      {producer.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nature */}
              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-2">
                  Nature
                </label>
                <select
                  value={formData.nature}
                  onChange={(e) => setFormData({ ...formData, nature: e.target.value as 'subscription' | 'flexible' })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-stone-900"
                >
                  <option value="subscription">Abonnement</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-2">
                  Date de début
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-stone-900"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-2">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-stone-900"
                />
              </div>

              {/* Enroll Start */}
              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-2">
                  Début des inscriptions
                </label>
                <input
                  type="date"
                  value={formData.enroll_start}
                  onChange={(e) => setFormData({ ...formData, enroll_start: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-stone-900"
                />
              </div>

              {/* Enroll End */}
              <div>
                <label className="block text-sm font-semibold text-stone-900 mb-2">
                  Fin des inscriptions
                </label>
                <input
                  type="date"
                  value={formData.enroll_end}
                  onChange={(e) => setFormData({ ...formData, enroll_end: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-stone-900"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-stone-200 text-stone-700 rounded-xl hover:bg-stone-50 transition-colors font-semibold text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    'Créer'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}