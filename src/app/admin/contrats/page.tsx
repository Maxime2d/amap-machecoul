'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FileText, Plus, X, ChevronDown } from 'lucide-react';
import { DataTable } from '@/components/admin/DataTable';
import { StatsCard } from '@/components/admin/StatsCard';
import { formatDate } from '@/lib/utils';
import type { ContractModel, Producer } from '@/types/database';

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
  open: { label: 'Ouvert', color: 'bg-blue-100 text-blue-800' },
  active: { label: 'Actif', color: 'bg-green-100 text-green-800' },
  closed: { label: 'Fermé', color: 'bg-red-100 text-red-800' },
  archived: { label: 'Archivé', color: 'bg-slate-100 text-slate-800' },
};

interface ContractWithProducer extends ContractModel {
  producer?: { name: string };
}

interface SubscriberCount {
  [modelId: string]: number;
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<ContractWithProducer[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<ContractWithProducer[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [producers, setProducers] = useState<Producer[]>([]);  const [subscriberCounts, setSubscriberCounts] = useState<SubscriberCount>({});
  const [totalSubscribers, setTotalSubscribers] = useState(0);
  const [showModal, setShowModal] = useState(false);
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

  // Filter contracts by status
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredContracts(contracts);
    } else {
      setFilteredContracts(
        contracts.filter((contract) => contract.status === statusFilter)
      );
    }
  }, [statusFilter, contracts]);

  // Handle status change
  const handleStatusChange = async (modelId: string, newStatus: string) => {
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
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };  // Handle form submission
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
    } catch (error) {
      console.error('Error creating contract model:', error);
      alert('Erreur lors de la création du modèle de contrat');
    } finally {
      setIsSubmitting(false);
    }
  };

  const rows = filteredContracts.map((contract) => [
    contract.name,
    (contract.producer as any)?.name || '-',
    contract.nature === 'subscription' ? 'Abonnement' : 'Flexible',
    <span
      key={`status-${contract.id}`}
      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
        statusLabels[contract.status]?.color || 'bg-gray-100 text-gray-800'
      }`}
    >
      {statusLabels[contract.status]?.label || contract.status}
    </span>,
    `${formatDate(contract.start_date)} au ${formatDate(contract.end_date)}`,
    contract.enroll_start && contract.enroll_end ? 'Ouvert' : 'Fermé',
    subscriberCounts[contract.id] || 0,
    <div key={`actions-${contract.id}`} className="relative group">
      <select
        value={contract.status}
        onChange={(e) => handleStatusChange(contract.id, e.target.value)}
        className="px-3 py-1 rounded text-sm border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer appearance-none pr-8"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 8px center',
        }}
      >
        <option value="draft">Brouillon</option>
        <option value="open">Ouvert</option>
        <option value="active">Actif</option>
        <option value="closed">Fermé</option>
        <option value="archived">Archivé</option>
      </select>
    </div>,
  ]);  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Chargement...</div>
      </div>
    );
  }

  const statuses = ['all', 'draft', 'open', 'active', 'closed', 'archived'];
  const activeModels = contracts.filter(c => c.status === 'open' || c.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
            <FileText className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestion des contrats</h1>
            <p className="text-sm text-slate-600">{filteredContracts.length} contrat(s)</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Créer un modèle
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          label="Modèles de contrats"
          value={contracts.length}
          icon={FileText}
        />
        <StatsCard
          label="Modèles actifs/ouverts"
          value={activeModels}
          icon={FileText}
        />
        <StatsCard
          label="Total d'abonnés"
          value={totalSubscribers}
          icon={FileText}
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
                ? 'bg-green-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {status === 'all'
              ? 'Tous'
              : statusLabels[status]?.label || status}
          </button>
        ))}
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <DataTable
          headers={['Nom', 'Producteur', 'Nature', 'Statut', 'Période', 'Inscriptions', 'Abonnés', 'Action']}
          rows={rows}
        />
      </div>      {/* Create Model Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Créer un modèle de contrat</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateModel} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nom du modèle
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: Panier Bio Saisonnier"
                />
              </div>

              {/* Producer */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Producteur
                </label>
                <select
                  value={formData.producer_id}
                  onChange={(e) => setFormData({ ...formData, producer_id: e.target.value })}
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

              {/* Nature */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nature
                </label>
                <select
                  value={formData.nature}
                  onChange={(e) => setFormData({ ...formData, nature: e.target.value as 'subscription' | 'flexible' })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="subscription">Abonnement</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Enroll Start */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Début des inscriptions
                </label>
                <input
                  type="date"
                  value={formData.enroll_start}
                  onChange={(e) => setFormData({ ...formData, enroll_start: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Enroll End */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Fin des inscriptions
                </label>
                <input
                  type="date"
                  value={formData.enroll_end}
                  onChange={(e) => setFormData({ ...formData, enroll_end: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
    </div>
  );
}