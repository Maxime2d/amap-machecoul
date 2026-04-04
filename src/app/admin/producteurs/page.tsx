'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Tractor, Plus, Edit2, Trash2, X } from 'lucide-react';
import { DataTable } from '@/components/admin/DataTable';
import { StatsCard } from '@/components/admin/StatsCard';
import type { Producer } from '@/types/database';

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: 'Actif', color: 'bg-green-100 text-green-800' },
  inactive: { label: 'Inactif', color: 'bg-red-100 text-red-800' },
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
};

interface FormData {
  name: string;
  slug: string;
  description: string;
  short_bio: string;
  contact_email: string;
  phone: string;
  address: string;
  city: string;
  website: string;
  status: 'active' | 'inactive' | 'pending';
}

const initialFormData: FormData = {
  name: '',
  slug: '',
  description: '',
  short_bio: '',
  contact_email: '',
  phone: '',
  address: '',
  city: '',
  website: '',
  status: 'pending',
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

interface ProducerModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  producer: Producer | null;
  onClose: () => void;
  onSave: (data: FormData) => Promise<void>;
  isSaving: boolean;
}

function ProducerModal({
  isOpen,
  mode,
  producer,
  onClose,
  onSave,
  isSaving,
}: ProducerModalProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (mode === 'edit' && producer) {
      setFormData({
        name: producer.name || '',
        slug: producer.slug || '',
        description: producer.description || '',
        short_bio: producer.short_bio || '',
        contact_email: producer.contact_email || '',
        phone: producer.phone || '',
        address: producer.address || '',
        city: producer.city || '',
        website: producer.website || '',
        status: producer.status as 'active' | 'inactive' | 'pending',
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [isOpen, mode, producer]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: mode === 'create' ? generateSlug(name) : prev.slug,
    }));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = e.target.value.toLowerCase().replace(/\s+/g, '-');
    setFormData((prev) => ({ ...prev, slug }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }
    if (!formData.slug.trim()) {
      newErrors.slug = 'Le slug est requis';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    await onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-slate-900">
            {mode === 'create' ? 'Ajouter un producteur' : 'Modifier le producteur'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 transition-colors"
            disabled={isSaving}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nom *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.name
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-slate-200'
              }`}
              placeholder="Nom du producteur"
              disabled={isSaving}
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Slug *
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={handleSlugChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.slug
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-slate-200'
              }`}
              placeholder="slug-du-producteur"
              disabled={isSaving}
            />
            {errors.slug && (
              <p className="text-sm text-red-600 mt-1">{errors.slug}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              placeholder="Description complète"
              rows={3}
              disabled={isSaving}
            />
          </div>

          {/* Short Bio */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Bio courte
            </label>
            <textarea
              value={formData.short_bio}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, short_bio: e.target.value }))
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              placeholder="Bio courte"
              rows={2}
              disabled={isSaving}
            />
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.contact_email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, contact_email: e.target.value }))
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="contact@example.com"
              disabled={isSaving}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Téléphone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, phone: e.target.value }))
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="+33 6 12 34 56 78"
              disabled={isSaving}
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Adresse
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, address: e.target.value }))
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="123 Rue de la Ferme"
              disabled={isSaving}
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Ville
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, city: e.target.value }))
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Paris"
              disabled={isSaving}
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Site web
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, website: e.target.value }))
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="https://example.com"
              disabled={isSaving}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Statut
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  status: e.target.value as 'active' | 'inactive' | 'pending',
                }))
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isSaving}
            >
              <option value="pending">En attente</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors disabled:opacity-50"
              disabled={isSaving}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DeleteConfirmModalProps {
  isOpen: boolean;
  producerName: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isDeleting: boolean;
}

function DeleteConfirmModal({
  isOpen,
  producerName,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-sm w-full">
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Confirmer la suppression
          </h2>
          <p className="text-slate-600">
            Êtes-vous sûr de vouloir supprimer le producteur{' '}
            <strong>{producerName}</strong> ? Cette action ne peut pas être annulée.
          </p>
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors disabled:opacity-50"
              disabled={isDeleting}
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              disabled={isDeleting}
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProducersPage() {
  const [producers, setProducers] = useState<Producer[]>([]);
  const [filteredProducers, setFilteredProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedProducer, setSelectedProducer] = useState<Producer | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [producerToDelete, setProducerToDelete] = useState<Producer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const supabase = createClient();

  // Fetch producers
  useEffect(() => {
    async function fetchProducers() {
      try {
        const { data } = await supabase
          .from('producers')
          .select('*')
          .order('name', { ascending: true });
        setProducers(data || []);
        setFilteredProducers(data || []);
      } finally {
        setLoading(false);
      }
    }

    fetchProducers();
  }, [supabase]);

  // Filter producers based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducers(producers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = producers.filter(
        (producer) =>
          producer.name.toLowerCase().includes(query) ||
          producer.city?.toLowerCase().includes(query) ||
          producer.contact_email?.toLowerCase().includes(query) ||
          producer.phone?.toLowerCase().includes(query)
      );
      setFilteredProducers(filtered);
    }
  }, [searchQuery, producers]);

  // Stats
  const totalProducers = producers.length;
  const activeProducers = producers.filter((p) => p.status === 'active').length;
  const inactiveProducers = producers.filter((p) => p.status === 'inactive').length;

  // Handle modal open for create
  const handleCreateClick = () => {
    setModalMode('create');
    setSelectedProducer(null);
    setIsModalOpen(true);
  };

  // Handle modal open for edit
  const handleEditClick = (producer: Producer) => {
    setModalMode('edit');
    setSelectedProducer(producer);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedProducer(null);
  };

  // Handle save
  const handleSave = async (formData: FormData) => {
    setIsSaving(true);
    try {
      if (modalMode === 'create') {
        const { error } = await supabase.from('producers').insert([
          {
            name: formData.name,
            slug: formData.slug,
            description: formData.description || null,
            short_bio: formData.short_bio || null,
            contact_email: formData.contact_email || null,
            phone: formData.phone || null,
            address: formData.address || null,
            city: formData.city || null,
            website: formData.website || null,
            status: formData.status,
            stock_enabled: false,
          },
        ]);

        if (error) throw error;
      } else if (selectedProducer) {
        const { error } = await supabase
          .from('producers')
          .update({
            name: formData.name,
            slug: formData.slug,
            description: formData.description || null,
            short_bio: formData.short_bio || null,
            contact_email: formData.contact_email || null,
            phone: formData.phone || null,
            address: formData.address || null,
            city: formData.city || null,
            website: formData.website || null,
            status: formData.status,
          })
          .eq('id', selectedProducer.id);

        if (error) throw error;
      }

      // Refresh producers list
      const { data } = await supabase
        .from('producers')
        .select('*')
        .order('name', { ascending: true });
      setProducers(data || []);
      handleModalClose();
    } catch (error) {
      console.error('Error saving producer:', error);
      alert('Erreur lors de l\'enregistrement. Veuillez réessayer.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete click
  const handleDeleteClick = (producer: Producer) => {
    setProducerToDelete(producer);
    setIsDeleteModalOpen(true);
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (!producerToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('producers')
        .delete()
        .eq('id', producerToDelete.id);

      if (error) throw error;

      // Refresh producers list
      const { data } = await supabase
        .from('producers')
        .select('*')
        .order('name', { ascending: true });
      setProducers(data || []);
      setIsDeleteModalOpen(false);
      setProducerToDelete(null);
    } catch (error) {
      console.error('Error deleting producer:', error);
      alert('Erreur lors de la suppression. Veuillez réessayer.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Build table rows
  const rows = filteredProducers.map((producer) => [
    producer.name,
    producer.city || '-',
    producer.contact_email || '-',
    producer.phone || '-',
    <span
      key={`status-${producer.id}`}
      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
        statusLabels[producer.status]?.color || 'bg-gray-100 text-gray-800'
      }`}
    >
      {statusLabels[producer.status]?.label || producer.status}
    </span>,
    <div key={`actions-${producer.id}`} className="flex gap-2">
      <button
        onClick={() => handleEditClick(producer)}
        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
        title="Modifier"
      >
        <Edit2 className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleDeleteClick(producer)}
        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
        title="Supprimer"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>,
  ]);

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
            <Tractor className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Gestion des producteurs
            </h1>
            <p className="text-sm text-slate-600">
              {producers.length} producteur(s)
            </p>
          </div>
        </div>
        <button
          onClick={handleCreateClick}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Ajouter un producteur
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total des producteurs"
          value={totalProducers}
          icon={<Tractor className="w-6 h-6" />}
        />
        <StatsCard
          title="Producteurs actifs"
          value={activeProducers}
          icon={<Tractor className="w-6 h-6" />}
          trend="up"
        />
        <StatsCard
          title="Producteurs inactifs"
          value={inactiveProducers}
          icon={<Tractor className="w-6 h-6" />}
          trend="down"
        />
      </div>

      {/* Producers Table */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <DataTable
          headers={['Nom', 'Ville', 'Email', 'Téléphone', 'Statut', 'Actions']}
          rows={rows}
          searchPlaceholder="Rechercher par nom, ville, email ou téléphone..."
          onSearch={setSearchQuery}
        />
      </div>

      {/* Modals */}
      <ProducerModal
        isOpen={isModalOpen}
        mode={modalMode}
        producer={selectedProducer}
        onClose={handleModalClose}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        producerName={producerToDelete?.name || ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setProducerToDelete(null);
        }}
        isDeleting={isDeleting}
      />
    </div>
  );
}
