'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Calendar, ShoppingCart, Plus, Minus, Check, Lock, Package, Euro } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
}

interface ModelProduct {
  id: string;
  model_id: string;
  product_id: string;
  products: Product;
}

interface ModelDate {
  id: string;
  model_id: string;
  delivery_date: string;
  is_cancelled: boolean;
}

interface ContractItem {
  id: string;
  contract_id: string;
  product_id: string;
  delivery_date: string;
  quantity: number;
}

interface Contract {
  id: string;
  user_id: string;
  model_id: string;
  contract_models: {
    id: string;
    name: string;
    nature: string;
    producer_id: string;
    joker_config: {
      order_deadline_days: number;
    };
    producers: {
      id: string;
      name: string;
    };
  };
}

export default function CommanderPage({ params }: { params: Promise<{ contractId: string }> }) {
  const { contractId } = use(params);
  const supabase = createClient();

  const [contract, setContract] = useState<Contract | null>(null);
  const [products, setProducts] = useState<ModelProduct[]>([]);
  const [deliveryDates, setDeliveryDates] = useState<ModelDate[]>([]);
  const [existingOrders, setExistingOrders] = useState<ContractItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setError('Utilisateur non authentifié');
          return;
        }

        // Fetch contract with contract_model and producer
        const { data: contractData, error: contractError } = await supabase
          .from('contracts')
          .select(`
            id,
            user_id,
            model_id,
            contract_models (
              id,
              name,
              nature,
              producer_id,
              joker_config,
              producers (
                id,
                name
              )
            )
          `)
          .eq('id', contractId)
          .eq('user_id', user.id)
          .single();

        if (contractError || !contractData) {
          setError('Contrat non trouvé');
          return;
        }

        setContract(contractData as Contract);

        const modelId = contractData.model_id;

        // Fetch available products
        const { data: productsData, error: productsError } = await supabase
          .from('model_products')
          .select(`
            id,
            model_id,
            product_id,
            products (
              id,
              name,
              description,
              price
            )
          `)
          .eq('model_id', modelId);

        if (!productsError && productsData) {
          setProducts(productsData as ModelProduct[]);
        }

        // Fetch upcoming delivery dates
        const today = new Date().toISOString().split('T')[0];
        const { data: datesData, error: datesError } = await supabase
          .from('model_dates')
          .select('id, model_id, delivery_date, is_cancelled')
          .eq('model_id', modelId)
          .gte('delivery_date', today)
          .eq('is_cancelled', false)
          .order('delivery_date', { ascending: true });

        if (!datesError && datesData) {
          setDeliveryDates(datesData as ModelDate[]);
          if (datesData.length > 0) {
            setSelectedDate(datesData[0].delivery_date);
          }
        }

        // Fetch existing orders
        if (datesData && datesData.length > 0) {
          const dateRange = datesData.map((d) => d.delivery_date);
          const { data: ordersData, error: ordersError } = await supabase
            .from('contract_items')
            .select('id, contract_id, product_id, delivery_date, quantity')
            .eq('contract_id', contractId)
            .in('delivery_date', dateRange);

          if (!ordersError && ordersData) {
            setExistingOrders(ordersData as ContractItem[]);
            // Initialize quantities from existing orders
            const newQuantities: Record<string, number> = {};
            ordersData.forEach((order) => {
              newQuantities[`${order.product_id}-${order.delivery_date}`] = order.quantity;
            });
            setQuantities(newQuantities);
          }
        }
      } catch (err) {
        setError('Erreur lors du chargement des données');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [contractId]);

  const isDeadlinePassed = (deliveryDate: string): boolean => {
    if (!contract) return true;
    const orderDeadlineDays = contract.contract_models.joker_config.order_deadline_days || 0;
    const deadline = new Date(deliveryDate);
    deadline.setDate(deadline.getDate() - orderDeadlineDays);
    return new Date() > deadline;
  };

  const updateQuantity = (productId: string, delta: number) => {
    const key = `${productId}-${selectedDate}`;
    const current = quantities[key] || 0;
    const newQuantity = Math.max(0, current + delta);
    setQuantities({ ...quantities, [key]: newQuantity });
  };

  const calculateSubtotal = (product: Product): number => {
    const key = `${product.id}-${selectedDate}`;
    const quantity = quantities[key] || 0;
    return product.price * quantity;
  };

  const calculateTotal = (): number => {
    if (!selectedDate) return 0;
    return products.reduce((sum, mp) => sum + calculateSubtotal(mp.products), 0);
  };

  const handleSubmitOrder = async () => {
    if (!selectedDate || !contract) return;

    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');

      // Prepare operations
      const upserts = [];
      const deletes = [];

      for (const mp of products) {
        const key = `${mp.product_id}-${selectedDate}`;
        const newQuantity = quantities[key] || 0;

        const existingOrder = existingOrders.find(
          (o) => o.product_id === mp.product_id && o.delivery_date === selectedDate
        );

        if (newQuantity > 0) {
          // Upsert: insert or update
          if (existingOrder) {
            // Update
            const { error: updateError } = await supabase
              .from('contract_items')
              .update({ quantity: newQuantity })
              .eq('id', existingOrder.id);

            if (updateError) throw updateError;
          } else {
            // Insert
            const { error: insertError } = await supabase
              .from('contract_items')
              .insert({
                contract_id: contractId,
                product_id: mp.product_id,
                delivery_date: selectedDate,
                quantity: newQuantity,
              });

            if (insertError) throw insertError;
          }
        } else if (existingOrder && existingOrder.quantity > 0) {
          // Delete if quantity is 0 and record exists
          const { error: deleteError } = await supabase
            .from('contract_items')
            .delete()
            .eq('id', existingOrder.id);

          if (deleteError) throw deleteError;
        }
      }

      // Refresh existing orders
      const dateRange = deliveryDates.map((d) => d.delivery_date);
      const { data: ordersData, error: ordersError } = await supabase
        .from('contract_items')
        .select('id, contract_id, product_id, delivery_date, quantity')
        .eq('contract_id', contractId)
        .in('delivery_date', dateRange);

      if (!ordersError && ordersData) {
        setExistingOrders(ordersData as ContractItem[]);
      }

      setSuccessMessage('Commande validée avec succès!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Erreur lors de la sauvegarde de la commande');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getDateTotalForDelivery = (deliveryDate: string): number => {
    return products.reduce((sum, mp) => {
      const existingOrder = existingOrders.find(
        (o) => o.product_id === mp.product_id && o.delivery_date === deliveryDate
      );
      return sum + (existingOrder ? existingOrder.quantity * mp.products.price : 0);
    }, 0);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const day = daysOfWeek[date.getDay()];
    const formattedDate = date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
    return `${day} ${formattedDate}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="p-6">
        <div className="text-red-600">{error || 'Contrat non trouvé'}</div>
      </div>
    );
  }

  const deadlinePassed = selectedDate ? isDeadlinePassed(selectedDate) : false;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/app/contrats"
                className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Commander</h1>
                <p className="text-sm text-slate-600">
                  {contract.contract_models.name} • {contract.contract_models.producers.name}
                </p>
              </div>
            </div>
            <ShoppingCart className="text-slate-400" size={24} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
            <Check size={18} />
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Delivery date tabs */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Calendar size={20} />
                Dates de livraison
              </h2>
              <div className="space-y-2">
                {deliveryDates.map((date) => {
                  const isSelected = selectedDate === date.delivery_date;
                  const isPassed = isDeadlinePassed(date.delivery_date);
                  const hasOrder = existingOrders.some((o) => o.delivery_date === date.delivery_date);
                  const dateTotal = getDateTotalForDelivery(date.delivery_date);

                  return (
                    <button
                      key={date.id}
                      onClick={() => !isPassed && setSelectedDate(date.delivery_date)}
                      disabled={isPassed}
                      className={`w-full p-4 rounded-lg border-2 transition text-left ${
                        isSelected
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      } ${isPassed ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900">{formatDate(date.delivery_date)}</div>
                          <div className="text-xs text-slate-600 mt-1">
                            {isPassed ? (
                              <span className="inline-flex items-center gap-1 text-red-600">
                                <Lock size={14} />
                                Délai dépassé
                              </span>
                            ) : (
                              <span className="text-slate-600">Commande possible</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasOrder && (
                            <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              <Check size={12} />
                              Commandé
                            </div>
                          )}
                          {dateTotal > 0 && (
                            <div className="text-sm font-semibold text-slate-900">
                              {dateTotal.toFixed(2)} €
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Order form */}
            {selectedDate && (
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Package size={20} />
                  Produits
                </h2>

                {deadlinePassed && (
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm flex items-center gap-2">
                    <Lock size={18} />
                    Le délai de commande pour cette date est dépassé. Vous ne pouvez plus modifier votre commande.
                  </div>
                )}

                <div className="space-y-3 mb-6">
                  {products.map((mp) => {
                    const product = mp.products;
                    const quantity = quantities[`${product.id}-${selectedDate}`] || 0;
                    const subtotal = calculateSubtotal(product);

                    return (
                      <div
                        key={mp.id}
                        className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900">{product.name}</h3>
                            <p className="text-sm text-slate-600 mt-1">{product.description}</p>
                            <div className="mt-2 flex items-center gap-1 text-lg font-bold text-green-600">
                              <Euro size={18} />
                              {product.price.toFixed(2)}
                            </div>
                          </div>

                          <div className={`flex flex-col items-end ${deadlinePassed ? 'opacity-50' : ''}`}>
                            {!deadlinePassed && (
                              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                                <button
                                  onClick={() => updateQuantity(product.id, -1)}
                                  className="p-1 hover:bg-gray-200 rounded transition disabled:opacity-50"
                                  disabled={quantity === 0}
                                >
                                  <Minus size={16} className="text-slate-600" />
                                </button>
                                <span className="w-8 text-center font-semibold text-slate-900">
                                  {quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(product.id, 1)}
                                  className="p-1 hover:bg-gray-200 rounded transition"
                                >
                                  <Plus size={16} className="text-slate-600" />
                                </button>
                              </div>
                            )}
                            {subtotal > 0 && (
                              <div className="mt-2 text-sm font-semibold text-slate-900">
                                {subtotal.toFixed(2)} €
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Submit button */}
                <button
                  onClick={handleSubmitOrder}
                  disabled={deadlinePassed || saving}
                  className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
                    deadlinePassed
                      ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                  } ${saving ? 'opacity-50' : ''}`}
                >
                  {saving ? (
                    <>Enregistrement...</>
                  ) : (
                    <>
                      <Check size={18} />
                      Valider la commande
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Sidebar - Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-24">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <ShoppingCart size={18} />
                Récapitulatif
              </h3>

              <div className="space-y-2 mb-6">
                {deliveryDates.map((date) => {
                  const dateTotal = getDateTotalForDelivery(date.delivery_date);
                  const hasOrder = existingOrders.some((o) => o.delivery_date === date.delivery_date);

                  if (!hasOrder && dateTotal === 0) return null;

                  return (
                    <div key={date.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{formatDate(date.delivery_date)}</span>
                      <span className="font-semibold text-slate-900">{dateTotal.toFixed(2)} €</span>
                    </div>
                  );
                })}
              </div>

              {selectedDate && !deadlinePassed && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">Total sélectionné</span>
                    <span className="text-lg font-bold text-green-600">{calculateTotal().toFixed(2)} €</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}