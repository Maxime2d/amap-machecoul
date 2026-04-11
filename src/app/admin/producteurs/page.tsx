'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, Check, Loader2, Plus, X, Tractor, Pencil, Trash2 } from 'lucide-react';
import type { Producer } from '@/types/database';

const statusConfig = {
  active: {
    label: 'Actif',
    dot: 'bg-green-500',
    bg: 'bg-green-50 text-green-700 border-green-200',
  },
  inactive: {
    label: 'Inactif',
    dot: 'bg-stone-400',
    bg: 'bg-stone-100 text-stone-600 border-stone-200',
  },
  pending: {
    label: 'En attente',
    dot: 'bg-amber-500',
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
  },
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

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

function getInitialLetter(name: string): string {
  return (name?.charAt(0) || '?').toUpperCase();
}

function getAvatarColor(letter: string): string {
  const colors = [
    'bg-green-100 text-green-700',
    'bg-amber-100 text-amber-700',
    'bg-stone-200 text-stone-700',
    'bg-emerald-100 text-emerald-700',
    'bg-teal-100 text-teal-700',
  ];
  const index = letter.charCodeAt(0) % colors.length;
  return colors[index];
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#f8f7f4] rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto border border-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-200 sticky top-0 bg-[#f8f7f4]">
          <h2 className="text-lg font-extrabold text-stone-900">
            {mode === 'create' ? 'Ajouter un producteur' : 'Modifier le producteur'}
          </h2>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-stone-700 transition-colors"
            disabled={isSaving}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Nom *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.name
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-stone-300 bg-white'
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
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Slug *
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={handleSlugChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.slug
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-stone-300 bg-white'
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
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none bg-white"
              placeholder="Description complète"
              rows={3}
              disabled={isSaving}
            />
          </div>

          {/* Short Bio */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Bio courte
            </label>
            <textarea
              value={formData.short_bio}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, short_bio: e.target.value }))
              }
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none bg-white"
              placeholder="Bio courte"
              rows={2}
              disabled={isSaving}
            />
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.contact_email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, contact_email: e.target.value }))
              }
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              placeholder="contact@example.com"
              disabled={isSaving}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Téléphone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, phone: e.target.value }))
              }
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              placeholder="+33 6 12 34 56 78"
              disabled={isSaving}
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Adresse
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, address: e.target.value }))
              }
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              placeholder="123 Rue de la Ferme"
              disabled={isSaving}
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Ville
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, city: e.target.value }))
              }
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              placeholder="Paris"
              disabled={isSaving}
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Site web
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, website: e.target.value }))
              }
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              placeholder="https://example.com"
              disabled={isSaving}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
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
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              disabled={isSaving}
            >
              <option value="pending">En attente</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-stone-700 bg-stone-200 hover:bg-stone-300 rounded-lg font-medium transition-colors disabled:opacity-50"
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

function Toast({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 2500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
        toast.type === 'success'
          ? 'bg-green-50 text-green-700 border-green-200'
          : 'bg-red-50 text-red-700 border-red-200'
      }`}
    >
      {toast.type === 'success' ? (
        <Check className="w-4 h-4 flex-shrink-0" />
      ) : (
        <span className="w-4 h-4 flex-shrink-0">!</span>
      )}
      <span className="text-sm font-medium">{toast.message}</span>
    </div>
  );
}

interface SkeletonRowProps {
  count: number;
}

function SkeletonRow({ count }: SkeletonRowProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`skeleton-${i}`}
          className="p-4 border-b border-stone-100 animate-pulse"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-stone-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-stone-200 rounded w-32" />
              <div className="h-3 bg-stone-100 rounded w-24" />
            </div>
            <div className="h-6 bg-stone-100 rounded w-20" />
          </div>
        </div>
      ))}
    </>
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
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<Toast[]>([]);

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

  // Toast management
  const addToast = (type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Stats
  const totalProducers = producers.length;
  const activeProducers = producers.filter((p) => p.status === 'active').length;
  const pendingProducers = producers.filter((p) => p.status === 'pending').length;

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
        addToast('success', 'Producteur créé avec succès');
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
        addToast('success', 'Producteur modifié avec succès');
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
      addToast('error', 'Erreur lors de l\'enregistrement. Veuillez réessayer.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle inline status change
  const handleStatusChange = async (
    producer: Producer,
    newStatus: 'active' | 'inactive' | 'pending'
  ) => {
    setUpdatingIds((prev) => new Set([...prev, producer.id]));
    try {
      const { error } = await supabase
        .from('producers')
        .update({ status: newStatus })
        .eq('id', producer.id);

      if (error) throw error;

      setProducers((prev) =>
        prev.map((p) => (p.id === producer.id ? { ...p, status: newStatus } : p))
      );
      addToast('success', `Statut mis à jour`);
    } catch (error) {
      console.error('Error updating status:', error);
      addToast('error', 'Erreur lors de la mise à jour du statut');
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(producer.id);
        return next;
      });
    }
  };

  // Handle delete
  const handleDeleteClick = async (producer: Producer) => {
    if (!window.confirm(`Supprimer "${producer.name}" ? Cette action ne peut pas être annulée.`)) {
      return;
    }

    setUpdatingIds((prev) => new Set([...prev, producer.id]));
    try {
      const { error } = await supabase
        .from('producers')
        .delete()
        .eq('id', producer.id);

      if (error) throw error;

      setProducers((prev) => prev.filter((p) => p.id !== producer.id));
      addToast('success', 'Producteur supprimé');
    } catch (error) {
      console.error('Error deleting producer:', error);
      addToast('error', 'Erreur lors de la suppression');
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(producer.id);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-200 animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-48 bg-stone-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-stone-100 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-10 w-40 bg-green-600 rounded-lg animate-pulse" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 bg-stone-100 rounded-xl animate-pulse border border-stone-200"
            />
          ))}
        </div>

        {/* List skeleton */}
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <SkeletonRow count={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toasts */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-40 space-y-2">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              toast={toast}
              onDismiss={() => removeToast(toast.id)}
            />
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100">
            <Tractor className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-stone-900">
              Producteurs
            </h1>
            <p className="text-sm text-stone-600">
              {filteredProducers.length} affichés{filteredProducers.length !== totalProducers ? ` sur ${totalProducers}` : ''}
            </p>
          </div>
        </div>
        <button
          onClick={handleCreateClick}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      {/* Compact Inline Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-stone-100 rounded-xl p-4 border border-stone-200">
          <div className="text-xs font-medium text-stone-600 mb-1">Total</div>
          <div className="text-2xl font-extrabold text-stone-900">{totalProducers}</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="text-xs font-medium text-green-700 mb-1">Actifs</div>
          <div className="text-2xl font-extrabold text-green-700">{activeProducers}</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <div className="text-xs font-medium text-amber-700 mb-1">En attente</div>
          <div className="text-2xl font-extrabold text-amber-700">{pendingProducers}</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher par nom, ville, email..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
        />
      </div>

      {/* Producers List */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        {filteredProducers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-stone-500">Aucun producteur trouvé</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredProducers.map((producer) => {
              const isUpdating = updatingIds.has(producer.id);
              const statusInfo = statusConfig[producer.status as keyof typeof statusConfig];

              return (
                <div
                  key={producer.id}
                  className="p-4 hover:bg-[#f8f7f4] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Avatar + Name + City */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getAvatarColor(
                          getInitialLetter(producer.name)
                        )}`}
                      >
                        {getInitialLetter(producer.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-stone-900 truncate">
                          {producer.name}
                        </h3>
                        <div className="text-xs text-stone-600 space-x-2">
                          {producer.city && <span>{producer.city}</span>}
                          {producer.contact_email && (
                            <span className="text-stone-500">·</span>
                          )}
                          {producer.contact_email && (
                            <span className="truncate">{producer.contact_email}</span>
                          )}
                        </div>
                        {producer.phone && (
                          <div className="text-xs text-stone-500 mt-1">
                            {producer.phone}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Status Select + Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Status Select */}
                      <div className="relative">
                        <select
                          value={producer.status}
                          onChange={(e) =>
                            handleStatusChange(
                              producer,
                              e.target.value as 'active' | 'inactive' | 'pending'
                            )
                          }
                          disabled={isUpdating}
                          className={`text-xs px-2 py-1.5 rounded-lg border ${statusInfo?.bg} appearance-none cursor-pointer transition-opacity disabled:opacity-50`}
                        >
                          <option value="active">{statusConfig.active.label}</option>
                          <option value="pending">{statusConfig.pending.label}</option>
                          <option value="inactive">{statusConfig.inactive.label}</option>
                        </select>
                        {isUpdating && (
                          <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 animate-spin text-stone-600" />
                        )}
                      </div>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleEditClick(producer)}
                        disabled={isUpdating}
                        className="p-1.5 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-50"
                        title="Modifier"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteClick(producer)}
                        disabled={isUpdating}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <ProducerModal
        isOpen={isModalOpen}
        mode={modalMode}
        producer={selectedProducer}
        onClose={handleModalClose}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}
