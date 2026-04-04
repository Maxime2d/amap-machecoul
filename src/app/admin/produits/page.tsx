'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Package, Plus, Pencil, Trash2, X } from 'lucide-react';
import { DataTable } from '@/components/admin/DataTable';
import { StatsCard } from '@/components/admin/StatsCard';
import type { Product, Producer } from '@/types/database';

const unitTypeLabels: Record<string, string> = {
  unit: 'Unité',
  weight: 'Poids (kg)',
  volume: 'Volume (L)',
  bundle: 'Lot',
};

interface ProductWithProducer extends Product {
  producer?: { name: string };
}

interface FormData {
  id?: string;
  name: string;
  producer_id: string;
  description: string;
  unit_type: 'unit' | 'weight' | 'volume' | 'bundle';
  packaging: string;
  is_active: boolean;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductWithProducer[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithProducer[]>([]);
  const [loading, setLoading] = useState(true);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [producerFilter, setProducerFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    producer_id: '',
    description: '',
    unit_type: 'unit',
    packaging: '',
    is_active: true,
  });
  const supabase = createClient();

  // Fetch products with producer info
  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data } = await supabase
          .from('products')
          .select('*, producer:producers(name)')
          .order('created_at', { ascending: false });
        setProducts(data || []);
        setFilteredProducts(data || []);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
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
  }, [supabase]);

  // Filter products by search and producer
  useEffect(() => {
    let filtered = products;

    if (producerFilter !== 'all') {
      filtered = filtered.filter((product) => product.producer_id === producerFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [searchQuery, producerFilter, products]);

  // Handle form submission (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEditing && formData.id) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update({
            name: formData.name,
            producer_id: formData.producer_id,
            description: formData.description || null,
            unit_type: formData.unit_type,
            packaging: formData.packaging || null,
            is_active: formData.is_active,
          })
          .eq('id', formData.id);

        if (error) throw error;

        // Update local state
        setProducts(
          products.map((p) =>
            p.id === formData.id
              ? {
                  ...p,
                  name: formData.name,
                  producer_id: formData.producer_id,
                  description: formData.description,
                  unit_type: formData.unit_type,
                  packaging: formData.packaging,
                  is_active: formData.is_active,
                }
              : p
          )
        );
      } else {
        // Create new product
        const { data, error } = await supabase
          .from('products')
          .insert([
            {
              name: formData.name,
              producer_id: formData.producer_id,
              description: formData.description || null,
              unit_type: formData.unit_type,
              packaging: formData.packaging || null,
              is_active: formData.is_active,
            },
          ])
          .select('*, producer:producers(name)');

        if (error) throw error;

        if (data) {
          setProducts([data[0], ...products]);
        }
      }

      // Reset form and close modal
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Erreur lors de la sauvegarde du produit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (product: ProductWithProducer) => {
    setFormData({
      id: product.id,
      name: product.name,
      producer_id: product.producer_id,
      description: product.description || '',
      unit_type: product.unit_type,
      packaging: product.packaging || '',
      is_active: product.is_active,
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      // Update local state
      setProducts(products.filter((p) => p.id !== productId));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Erreur lors de la suppression du produit');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      producer_id: '',
      description: '',
      unit_type: 'unit',
      packaging: '',
      is_active: true,
    });
    setIsEditing(false);
  };

  const handleOpenModal = () => {
    resetForm();
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Chargement...</div>
      </div>
    );
  }

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.is_active).length;
  const inactiveProducts = products.filter((p) => !p.is_active).length;

  const rows = filteredProducts.map((product) => [
    product.name,
    (product.producer as any)?.name || '-',
    unitTypeLabels[product.unit_type] || product.unit_type,
    product.packaging || '-',
    <span
      key={`active-${product.id}`}
      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
        product.is_active
          ? 'bg-green-100 text-green-800'
          : 'bg-gray-100 text-gray-800'
      }`}
    >
      {product.is_active ? 'Actif' : 'Inactif'}
    </span>,
    <div
      key={`actions-${product.id}`}
      className="flex gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => handleEdit(product)}
        className="px-3 py-1 text-xs border border-slate-300 rounded bg-white text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        onClick={() => setShowDeleteConfirm(product.id)}
        className="px-3 py-1 text-xs border border-red-300 rounded bg-white text-red-700 hover:bg-red-50 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>,
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
            <Package className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestion des produits</h1>
            <p className="text-sm text-slate-600">{filteredProducts.length} produit(s)</p>
          </div>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Ajouter un produit
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total des produits"
          value={totalProducts}
          icon={<Package className="w-6 h-6" />}
        />
        <StatsCard
          title="Actifs"
          value={activeProducts}
          icon={<Package className="w-6 h-6" />}
        />
        <StatsCard
          title="Inactifs"
          value={inactiveProducts}
          icon={<Package className="w-6 h-6" />}
        />
      </div>

      {/* Producer Filter */}
      <div className="flex gap-2">
        <select
          value={producerFilter}
          onChange={(e) => setProducerFilter(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-700 hover:border-green-500 focus:border-green-600 focus:outline-none"
        >
          <option value="all">Tous les producteurs</option>
          {producers.map((producer) => (
            <option key={producer.id} value={producer.id}>
              {producer.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <DataTable
          headers={['Nom', 'Producteur', 'Type d\'unité', 'Conditionnement', 'Statut', 'Actions']}
          rows={rows}
          searchPlaceholder="Rechercher par nom de produit..."
          onSearch={setSearchQuery}
        />
      </div>

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Modifier le produit' : 'Ajouter un produit'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nom du produit <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: Tomate Bio"
                />
              </div>

              {/* Producer */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Producteur <span className="text-red-500">*</span>
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

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  placeholder="Ex: Tomates biologiques cultivées en serre..."
                  rows={3}
                />
              </div>

              {/* Unit Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Type d'unité <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.unit_type}
                  onChange={(e) => setFormData({ ...formData, unit_type: e.target.value as any })}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="unit">Unité</option>
                  <option value="weight">Poids (kg)</option>
                  <option value="volume">Volume (L)</option>
                  <option value="bundle">Lot</option>
                </select>
              </div>

              {/* Packaging */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Conditionnement
                </label>
                <input
                  type="text"
                  value={formData.packaging}
                  onChange={(e) => setFormData({ ...formData, packaging: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: 500g, 1 litre, 6 pièces"
                />
              </div>

              {/* Active Toggle */}
              <div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Produit actif</span>
                </label>
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
                  {isSubmitting ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-sm w-full mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Confirmer la suppression</h2>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-slate-700">
                Êtes-vous sûr de vouloir supprimer ce produit ? Cette action ne peut pas être annulée.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t border-slate-200">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}