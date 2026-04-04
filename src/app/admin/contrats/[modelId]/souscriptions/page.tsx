'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Plus,
  X,
  ChevronDown,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { DataTable } from '@/components/admin/DataTable';
import { StatsCard } from '@/components/admin/StatsCard';

interface ContractModel {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  producers: { name: string };
  model_products: Array<{
    id: string;
    price: number;
    products: { id: string; name: string; unit_type: string };
  }>;
  model_dates: Array<{
    id: string;
    delivery_date: string;
    is_cancelled: boolean;
  }>;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Contract {
  id: string;
  user_id: string;
  model_id: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  total_amount: number | null;
  signed_at: string | null;
  created_at: string;
  profiles: Profile;
  contract_items?: Array<{
    id: string;
    product_id: string;
    delivery_date: string;
    quantity: number;
    is_joker: boolean;
  }>;
}

interface ContractItem {
  id: string;
  contract_id: string;
  product_id: string;
  delivery_date: string;
  quantity: number;
  is_joker: boolean;
}

const subscriptionStatusLabels: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: 'En attente',
    color: 'bg-yellow-100 text-yellow-800',
    icon: <Clock className="w-4 h-4" />,
  },
  active: {
    label: 'Actif',
    color: 'bg-green-100 text-green-800',
    icon: <CheckCircle className="w-4 h-4" />,
  },
  completed: {
    label: 'Complété',
    color: 'bg-blue-100 text-blue-800',
    icon: <CheckCircle className="w-4 h-4" />,
  },
  cancelled: {
    label: 'Annulé',
    color: 'bg-red-100 text-red-800',
    icon: <XCircle className="w-4 h-4" />,
  },
};

const unitTypeLabels: Record<string, string> = {
  unit: 'unité',
  weight: 'kg',
  volume: 'litre',
  bundle: 'lot',
};

export default function SubscriptionsPage() {
  const params = useParams();
  const modelId = params.modelId as string;
  const supabase = createClient();

  const [model, setModel] = useState<ContractModel | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Form state
  const [selectedMember, setSelectedMember] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch model data
  useEffect(() => {
    async function fetchModel() {
      try {
        const { data } = await supabase
          .from('contract_models')
          .select(
            `
            id, name, start_date, end_date,
            producers ( name ),
            model_products ( id, price, products ( id, name, unit_type ) ),
            model_dates ( id, delivery_date, is_cancelled )
          `
          )
          .eq('id', modelId)
          .single();

        if (data) {
          setModel(data as any);
        }
      } catch (error) {
        console.error('Error fetching model:', error);
      }
    }

    fetchModel();
  }, [modelId, supabase]);

  // Fetch contracts
  useEffect(() => {
    async function fetchContracts() {
      try {
        const { data } = await supabase
          .from('contracts')
          .select(
            `
            id, user_id, model_id, status, total_amount, signed_at, created_at,
            profiles ( id, first_name, last_name, email ),
            contract_items ( id, contract_id, product_id, delivery_date, quantity, is_joker )
          `
          )
          .eq('model_id', modelId)
          .order('created_at', { ascending: false });

        setContracts((data || []) as any);
      } catch (error) {
        console.error('Error fetching contracts:', error);
      } finally {
        setLoading(false);
      }
    }

    if (modelId) fetchContracts();
  }, [modelId, supabase]);

  // Fetch members for dropdown
  useEffect(() => {
    async function fetchMembers() {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('role', ['member', 'referent', 'treasurer', 'admin'])
          .order('first_name', { ascending: true });

        setMembers(data || []);
      } catch (error) {
        console.error('Error fetching members:', error);
      }
    }

    fetchMembers();
  }, [supabase]);

  // Initialize form when adding new subscription
  const handleOpenAddModal = () => {
    setSelectedMember('');
    const q: Record<string, number> = {};
    model?.model_products?.forEach((mp) => {
      q[mp.id] = 1;
    });
    setQuantities(q);
    setShowAddModal(true);
  };

  // Initialize form when editing subscription
  const handleOpenEditModal = (contract: Contract) => {
    setEditingContract(contract);
    const q: Record<string, number> = {};
    model?.model_products?.forEach((mp) => {
      const item = contract.contract_items?.find(
        (ci) => ci.product_id === mp.products.id
      );
      q[mp.id] = item?.quantity || 1;
    });
    setQuantities(q);
    setShowEditModal(true);
  };

  // Get future delivery dates (delivery_date > today)
  const getFutureDeliveryDates = () => {
    if (!model) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return model.model_dates.filter(
      (md) => new Date(md.delivery_date) > today && !md.is_cancelled
    );
  };

  // Calculate total for a subscription
  const calculateTotal = (qty: Record<string, number>): number => {
    if (!model) return 0;
    const futureCount = getFutureDeliveryDates().length;
    return model.model_products.reduce((sum, mp) => {
      return sum + (qty[mp.id] || 0) * mp.price * futureCount;
    }, 0);
  };

  // Create new subscription
  const handleAddSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !model) return;

    setIsSubmitting(true);
    try {
      // Create contract
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .insert([
          {
            user_id: selectedMember,
            model_id: modelId,
            status: 'pending',
            total_amount: calculateTotal(quantities),
          },
        ])
        .select()
        .single();

      if (contractError) throw contractError;

      // Create contract items for future delivery dates
      const futureDeliveries = getFutureDeliveryDates();
      const items: ContractItem[] = [];

      model.model_products.forEach((mp) => {
        futureDeliveries.forEach((md) => {
          items.push({
            id: '', // Will be generated by DB
            contract_id: contractData.id,
            product_id: mp.products.id,
            delivery_date: md.delivery_date,
            quantity: quantities[mp.id] || 0,
            is_joker: false,
          });
        });
      });

      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('contract_items')
          .insert(items);

        if (itemsError) throw itemsError;
      }

      // Create payment record
      const totalAmount = calculateTotal(quantities);
      const { error: paymentError } = await supabase
        .from('payments')
        .insert([
          {
            contract_id: contractData.id,
            amount: totalAmount,
            due_date: model.start_date,
            status: 'pending',
          },
        ]);

      if (paymentError) throw paymentError;

      // Refresh contracts list
      const { data: updatedContracts } = await supabase
        .from('contracts')
        .select(
          `
          id, user_id, model_id, status, total_amount, signed_at, created_at,
          profiles ( id, first_name, last_name, email ),
          contract_items ( id, contract_id, product_id, delivery_date, quantity, is_joker )
        `
        )
        .eq('model_id', modelId)
        .order('created_at', { ascending: false });

      setContracts((updatedContracts || []) as any);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error creating subscription:', error);
      alert('Erreur lors de la création de la souscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update subscription quantities
  const handleEditSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContract || !model) return;

    setIsSubmitting(true);
    try {
      // Get future delivery dates
      const futureDeliveries = getFutureDeliveryDates();

      // Delete old items
      const { error: deleteError } = await supabase
        .from('contract_items')
        .delete()
        .eq('contract_id', editingContract.id);

      if (deleteError) throw deleteError;

      // Create new items
      const items: ContractItem[] = [];
      model.model_products.forEach((mp) => {
        futureDeliveries.forEach((md) => {
          items.push({
            id: '',
            contract_id: editingContract.id,
            product_id: mp.products.id,
            delivery_date: md.delivery_date,
            quantity: quantities[mp.id] || 0,
            is_joker: false,
          });
        });
      });

      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('contract_items')
          .insert(items);

        if (itemsError) throw itemsError;
      }

      // Update total amount
      const newTotal = calculateTotal(quantities);
      const { error: updateError } = await supabase
        .from('contracts')
        .update({ total_amount: newTotal })
        .eq('id', editingContract.id);

      if (updateError) throw updateError;

      // Refresh contracts list
      const { data: updatedContracts } = await supabase
        .from('contracts')
        .select(
          `
          id, user_id, model_id, status, total_amount, signed_at, created_at,
          profiles ( id, first_name, last_name, email ),
          contract_items ( id, contract_id, product_id, delivery_date, quantity, is_joker )
        `
        )
        .eq('model_id', modelId)
        .order('created_at', { ascending: false });

      setContracts((updatedContracts || []) as any);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Erreur lors de la modification de la souscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Activate subscription
  const handleActivate = async (contractId: string) => {
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ status: 'active' })
        .eq('id', contractId);

      if (error) throw error;

      setContracts(
        contracts.map((c) =>
          c.id === contractId ? { ...c, status: 'active' } : c
        )
      );
    } catch (error) {
      console.error('Error activating subscription:', error);
      alert('Erreur lors de l\'activation de la souscription');
    }
  };

  // Cancel subscription
  const handleCancel = async (contractId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette souscription ?'))
      return;

    try {
      // Set status to cancelled
      const { error: updateError } = await supabase
        .from('contracts')
        .update({ status: 'cancelled' })
        .eq('id', contractId);

      if (updateError) throw updateError;

      // Delete future contract items
      const futureDeliveryIds = getFutureDeliveryDates().map((md) => md.id);
      if (futureDeliveryIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('contract_items')
          .delete()
          .eq('contract_id', contractId)
          .in(
            'delivery_date',
            getFutureDeliveryDates().map((md) => md.delivery_date)
          );

        if (deleteError) throw deleteError;
      }

      setContracts(
        contracts.map((c) =>
          c.id === contractId ? { ...c, status: 'cancelled' } : c
        )
      );
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Erreur lors de l\'annulation de la souscription');
    }
  };

  // Toggle row expansion
  const toggleExpanded = (contractId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(contractId)) {
      newExpanded.delete(contractId);
    } else {
      newExpanded.add(contractId);
    }
    setExpandedRows(newExpanded);
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
        <div className="text-slate-500">Modèle non trouvé</div>
      </div>
    );
  }

  // Calculate stats
  const totalSubscriptions = contracts.length;
  const activeSubscriptions = contracts.filter(
    (c) => c.status === 'active'
  ).length;
  const pendingSubscriptions = contracts.filter(
    (c) => c.status === 'pending'
  ).length;
  const cancelledSubscriptions = contracts.filter(
    (c) => c.status === 'cancelled'
  ).length;

  // Build table rows
  const rows = contracts.map((contract) => {
    const member = contract.profiles;
    const hasItems = contract.contract_items && contract.contract_items.length > 0;
    const isExpanded = expandedRows.has(contract.id);

    // Build quantities display
    const quantitiesByProduct: Record<string, number> = {};
    contract.contract_items?.forEach((item) => {
      const product = model.model_products.find(
        (mp) => mp.products.id === item.product_id
      );
      if (product) {
        quantitiesByProduct[product.id] =
          (quantitiesByProduct[product.id] || 0) + item.quantity;
      }
    });

    const quantitiesDisplay = model.model_products
      .map((mp) => {
        const qty = quantitiesByProduct[mp.id];
        return qty ? `${mp.products.name}: ${qty}${mp.products.unit_type === 'unit' ? '' : unitTypeLabels[mp.products.unit_type] || ''}` : null;
      })
      .filter(Boolean)
      .join(' | ');

    return [
      <div key={`member-${contract.id}`} className="flex items-center gap-2">
        <button
          onClick={() => toggleExpanded(contract.id)}
          className="p-1 hover:bg-slate-100 rounded"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>
        <div>
          <div className="font-medium text-slate-900">
            {member.first_name} {member.last_name}
          </div>
          <div className="text-xs text-slate-500">{member.email}</div>
        </div>
      </div>,
      <span
        key={`status-${contract.id}`}
        className={`inline-flex items-center gap-2 px-3 py-1 rounded text-xs font-semibold ${
          subscriptionStatusLabels[contract.status]?.color ||
          'bg-gray-100 text-gray-800'
        }`}
      >
        {subscriptionStatusLabels[contract.status]?.icon}
        {subscriptionStatusLabels[contract.status]?.label ||
          contract.status}
      </span>,
      <div key={`quantities-${contract.id}`} className="text-sm text-slate-700">
        {quantitiesDisplay || 'Aucun article'}
      </div>,
      formatCurrency(contract.total_amount || 0),
      contract.signed_at ? formatDate(contract.signed_at) : formatDate(contract.created_at),
      <div key={`actions-${contract.id}`} className="flex gap-2">
        {contract.status === 'pending' && (
          <button
            onClick={() => handleActivate(contract.id)}
            className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors font-medium"
          >
            Activer
          </button>
        )}
        {(contract.status === 'pending' || contract.status === 'active') && (
          <>
            <button
              onClick={() => handleOpenEditModal(contract)}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Modifier"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleCancel(contract.id)}
              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Annuler"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>,
    ];
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {model.name}
          </h1>
          <div className="flex gap-4 mt-2 text-sm text-slate-600">
            <span>Producteur: {(model.producers as any).name}</span>
            <span>
              {formatDate(model.start_date)} au {formatDate(model.end_date)}
            </span>
          </div>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Ajouter un contrat
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total souscriptions"
          value={totalSubscriptions}
          icon={<Plus className="w-6 h-6" />}
        />
        <StatsCard
          title="Actives"
          value={activeSubscriptions}
          icon={<CheckCircle className="w-6 h-6" />}
        />
        <StatsCard
          title="En attente"
          value={pendingSubscriptions}
          icon={<Clock className="w-6 h-6" />}
        />
        <StatsCard
          title="Annulées"
          value={cancelledSubscriptions}
          icon={<XCircle className="w-6 h-6" />}
        />
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        {contracts.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            Aucune souscription pour ce modèle de contrat
          </div>
        ) : (
          <>
            <DataTable
              headers={[
                'Adhérent',
                'Statut',
                'Quantités',
                'Total',
                'Date inscription',
                'Actions',
              ]}
              rows={rows}
            />

            {/* Expanded rows - delivery schedule */}
            {contracts.map((contract) => {
              if (!expandedRows.has(contract.id)) return null;

              return (
                <div
                  key={`expanded-${contract.id}`}
                  className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <h4 className="font-semibold text-slate-900 mb-3">
                    Calendrier de livraison
                  </h4>
                  <div className="space-y-2 text-sm">
                    {model.model_dates.map((delivery) => {
                      const deliveryItems = contract.contract_items?.filter(
                        (ci) => ci.delivery_date === delivery.delivery_date
                      ) || [];

                      return (
                        <div
                          key={delivery.id}
                          className="flex items-center justify-between p-2 bg-white rounded border border-slate-200"
                        >
                          <span className="font-medium text-slate-700">
                            {formatDate(delivery.delivery_date)}
                          </span>
                          <div className="text-slate-600">
                            {deliveryItems.length > 0
                              ? deliveryItems
                                  .map((item) => {
                                    const product = model.model_products.find(
                                      (mp) =>
                                        mp.products.id === item.product_id
                                    );
                                    return product
                                      ? `${product.products.name}: ${item.quantity}`
                                      : null;
                                  })
                                  .filter(Boolean)
                                  .join(', ')
                              : 'Aucun article'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Add Subscription Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-slate-900">
                Ajouter un contrat
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddSubscription} className="p-6 space-y-4">
              {/* Member Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Adhérent
                </label>
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Sélectionnez un adhérent</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.first_name} {member.last_name} ({member.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Products Quantities */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Quantités par produit
                </label>
                <div className="space-y-3">
                  {model.model_products.map((mp) => (
                    <div
                      key={mp.id}
                      className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-slate-900">
                          {mp.products.name}
                        </div>
                        <div className="text-sm text-slate-600">
                          {formatCurrency(mp.price)} /{' '}
                          {unitTypeLabels[mp.products.unit_type] || 'unité'}
                        </div>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={quantities[mp.id] || 0}
                        onChange={(e) =>
                          setQuantities({
                            ...quantities,
                            [mp.id]: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-16 px-2 py-1 border border-slate-200 rounded text-center"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm text-slate-600">
                  {getFutureDeliveryDates().length} livraison(s) à venir
                </div>
                <div className="text-lg font-bold text-green-700">
                  Total: {formatCurrency(calculateTotal(quantities))}
                </div>
              </div>

              {/* Modal Footer */}
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
                  disabled={isSubmitting || !selectedMember}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Subscription Modal */}
      {showEditModal && editingContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-slate-900">
                Modifier la souscription
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleEditSubscription} className="p-6 space-y-4">
              {/* Member Display */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Adhérent
                </label>
                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                  {editingContract.profiles.first_name}{' '}
                  {editingContract.profiles.last_name}
                </div>
              </div>

              {/* Products Quantities */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Quantités par produit (futures livraisons)
                </label>
                <div className="space-y-3">
                  {model.model_products.map((mp) => (
                    <div
                      key={mp.id}
                      className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-slate-900">
                          {mp.products.name}
                        </div>
                        <div className="text-sm text-slate-600">
                          {formatCurrency(mp.price)} /{' '}
                          {unitTypeLabels[mp.products.unit_type] || 'unité'}
                        </div>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={quantities[mp.id] || 0}
                        onChange={(e) =>
                          setQuantities({
                            ...quantities,
                            [mp.id]: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-16 px-2 py-1 border border-slate-200 rounded text-center"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm text-slate-600">
                  {getFutureDeliveryDates().length} livraison(s) à venir
                </div>
                <div className="text-lg font-bold text-green-700">
                  Total: {formatCurrency(calculateTotal(quantities))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Mise à jour...' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
