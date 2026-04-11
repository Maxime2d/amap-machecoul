'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Package, Plus, Pencil, Trash2, X, Search, Check, Loader2 } from 'lucide-react';
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

  // Toast notification system
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  // Update error handlers to use toast
  const handleSubmitWithToast = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEditing && formData.id) {
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
        showToast('Produit modifié avec succès', 'success');
      } else {
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
        showToast('Produit créé avec succès', 'success');
      }

      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving product:', error);
      showToast('Erreur lors de la sauvegarde du produit', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWithToast = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.filter((p) => p.id !== productId));
      setShowDeleteConfirm(null);
      showToast('Produit supprimé avec succès', 'success');
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast('Erreur lors de la suppression du produit', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
      </div>
    );
  }

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.is_active).length;
  const inactiveProducts = products.filter((p) => !p.is_active).length;

  return (
    <div className="space-y-6 min-h-screen bg-[#f8f7f4]">
      {/* Toast Notifications */}
      {toast && (
        <div
          className={`fixed top-6 right-6 rounded-xl px-6 py-3 text-sm font-medium text-white z-50 shadow-lg animate-in fade-in slide-in-from-top-4 ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <Check className="w-4 h-4" />
            ) : (
              <X className="w-4 h-4" />
            )}
            {toast.message}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-stone-900">Gestion des produits</h1>
          <p className="text-sm text-stone-600 mt-1">{filteredProducts.length} produit(s) affichés</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 px-5 py-3 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors font-semibold text-sm"
        >
          <Plus className="w-4 h-4" />
          Ajouter un produit
        </button>
      </div>

      {/* Compact Inline Stats */}
      <div className="grid grid-cols-3 gap-3">
        {/* Total */}
        <div className="bg-white rounded-xl p-4 border border-stone-200">
          <p className="text-xs text-stone-600 font-medium uppercase tracking-wide">Total</p>
          <p className="text-2xl font-extrabold text-stone-900 mt-1">{totalProducts}</p>
        </div>

        {/* Actifs */}
        <div className="bg-white rounded-xl p-4 border border-green-200">
          <p className="text-xs text-green-700 font-medium uppercase tracking-wide">Actifs</p>
          <p className="text-2xl font-extrabold text-green-600 mt-1">{activeProducts}</p>
        </div>

        {/* Inactifs */}
        <div className="bg-white rounded-xl p-4 border border-stone-200">
          <p className="text-xs text-stone-500 font-medium uppercase tracking-wide">Inactifs</p>
          <p className="text-2xl font-extrabold text-stone-400 mt-1">{inactiveProducts}</p>
        </div>
      </div>

      {/* Producer Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setProducerFilter('all')}
          className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-colors ${
            producerFilter === 'all'
              ? 'bg-stone-900 text-white'
              : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
          }`}
        >
          Tous les producteurs
        </button>
        {producers.map((producer) => (
          <button
            key={producer.id}
            onClick={() => setProducerFilter(producer.id)}
            className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-colors ${
              producerFilter === producer.id
                ? 'bg-stone-900 text-white'
                : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {producer.name}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
        <input
          type="text"
          placeholder="Rechercher par nom de produit..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm"
        />
        {searchQuery && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-stone-500 font-medium">
            {filteredProducts.length} résultat(s)
          </span>
        )}
      </div>

      {/* Products List */}
      <div className="space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl p-8 border border-stone-200 text-center">
            <Package className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-600 font-medium">Aucun produit trouvé</p>
            <p className="text-xs text-stone-500 mt-1">Ajoutez un produit pour commencer</p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl p-4 border border-stone-200 hover:border-stone-300 transition-colors"
            >
              {/* Product Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-stone-400 flex-shrink-0" />
                    <h3 className="text-base font-extrabold text-stone-900 truncate">
                      {product.name}
                    </h3>
                  </div>

                  {/* Product Details */}
                  <div className="text-xs text-stone-600 space-y-1">
                    <p>
                      <span className="font-semibold">
                        {(product.producer as any)?.name || '-'}
                      </span>
                      {' · '}
                      <span>{unitTypeLabels[product.unit_type] || product.unit_type}</span>
                      {product.packaging && (
                        <>
                          {' · '}
                          <span>{product.packaging}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex-shrink-0">
                  <span
                    className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                      product.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {product.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-stone-100">
                <button
                  onClick={() => handleEdit(product)}
                  className="flex items-center gap-2 flex-1 px-3 py-2 text-xs font-medium text-stone-700 bg-stone-50 border border-stone-200 rounded-lg hover:bg-stone-100 transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                  Modifier
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(product.id)}
                  className="flex items-center gap-2 flex-1 px-3 py-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Supprimer
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-stone-200">
              <h2 className="text-lg font-extrabold text-stone-900">
                {isEditing ? 'Modifier le produit' : 'Ajouter un produit'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitWithToast} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Nom du produit <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm"
                  placeholder="Ex: Tomate Bio"
                />
              </div>

              {/* Producer */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Producteur <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.producer_id}
                  onChange={(e) => setFormData({ ...formData, producer_id: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm"
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
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent resize-none text-sm"
                  placeholder="Ex: Tomates biologiques cultivées en serre..."
                  rows={3}
                />
              </div>

              {/* Unit Type */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Type d'unité <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.unit_type}
                  onChange={(e) => setFormData({ ...formData, unit_type: e.target.value as any })}
                  required
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm"
                >
                  <option value="unit">Unité</option>
                  <option value="weight">Poids (kg)</option>
                  <option value="volume">Volume (L)</option>
                  <option value="bundle">Lot</option>
                </select>
              </div>

              {/* Packaging */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  Conditionnement
                </label>
                <input
                  type="text"
                  value={formData.packaging}
                  onChange={(e) => setFormData({ ...formData, packaging: e.target.value })}
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-sm"
                  placeholder="Ex: 500g, 1 litre, 6 pièces"
                />
              </div>

              {/* Active Toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                  />
                  <span className="text-sm font-medium text-stone-700">Produit actif</span>
                </label>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-stone-200 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors font-medium text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Enregistrement...
                    </>
                  ) : isEditing ? (
                    'Modifier'
                  ) : (
                    'Ajouter'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-stone-200">
              <h2 className="text-lg font-extrabold text-stone-900">Confirmer la suppression</h2>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-stone-700">
                Êtes-vous sûr de vouloir supprimer ce produit ? Cette action ne peut pas être annulée.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t border-stone-200">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-stone-200 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors font-medium text-sm"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteWithToast(showDeleteConfirm)}
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