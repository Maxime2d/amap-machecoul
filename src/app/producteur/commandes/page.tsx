'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Package,
  Users,
  Calendar,
  Printer,
  Download,
  Check,
  X,
  ClipboardList,
} from 'lucide-react';

interface ModelDate {
  id: string;
  delivery_date: string;
  model_id: string;
}

interface ContractItem {
  id: string;
  contract_id: string;
  product_id: string;
  quantity: number;
  is_joker: boolean;
  delivery_date: string;
  product_name: string;
  adherent_first_name: string;
  adherent_last_name: string;
  user_id: string;
}

interface ProductBreakdown {
  [key: string]: number;
}

interface PreparedState {
  [key: string]: boolean;
}

export default function CommandesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<ModelDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [orders, setOrders] = useState<ContractItem[]>([]);
  const [prepared, setPrepared] = useState<PreparedState>({});
  const [viewMode, setViewMode] = useState<'table' | 'pivot'>('table');
  const supabase = createClient();

  // Load available dates and orders
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setError('Authentification requise');
          return;
        }

        // Get producer_referents for this user
        const { data: referents, error: referentsError } = await supabase
          .from('producer_referents')
          .select('producer_id')
          .eq('user_id', user.id);

        if (referentsError) throw referentsError;
        if (!referents || referents.length === 0) {
          setError('Aucun producteur associé');
          return;
        }

        const producerIds = referents.map(r => r.producer_id);

        // Get contract_models for these producers
        const { data: models, error: modelsError } = await supabase
          .from('contract_models')
          .select('id')
          .in('producer_id', producerIds);

        if (modelsError) throw modelsError;
        if (!models || models.length === 0) {
          setError('Aucun modèle de contrat');
          return;
        }

        const modelIds = models.map(m => m.id);

        // Get all model_dates for these models (future dates)
        const today = new Date().toISOString().split('T')[0];
        const { data: dates, error: datesError } = await supabase
          .from('model_dates')
          .select('id, delivery_date, model_id')
          .in('model_id', modelIds)
          .gte('delivery_date', today)
          .order('delivery_date', { ascending: true });

        if (datesError) throw datesError;

        setAvailableDates(dates || []);
        if (dates && dates.length > 0) {
          setSelectedDate(dates[0].delivery_date);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Load orders for selected date
  useEffect(() => {
    const loadOrders = async () => {
      if (!selectedDate) return;

      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get producer IDs
        const { data: referents } = await supabase
          .from('producer_referents')
          .select('producer_id')
          .eq('user_id', user.id);

        if (!referents) return;
        const producerIds = referents.map(r => r.producer_id);

        // Get model IDs
        const { data: models } = await supabase
          .from('contract_models')
          .select('id')
          .in('producer_id', producerIds);

        if (!models) return;
        const modelIds = models.map(m => m.id);

        // Get contract items for selected date
        const { data: items, error: itemsError } = await supabase
          .from('contract_items')
          .select(
            `
            id,
            contract_id,
            product_id,
            quantity,
            is_joker,
            delivery_date,
            products(name),
            contracts(user_id, contract_models(id)),
            profiles:contracts(user_id).profiles(first_name, last_name)
          `
          )
          .eq('delivery_date', selectedDate);

        if (itemsError) throw itemsError;

        // Filter and map items
        const filteredItems: ContractItem[] = [];
        if (items) {
          for (const item of items) {
            const contract = item.contracts as any;
            if (contract && modelIds.includes(contract.contract_models?.id)) {
              const profile = item.profiles?.[0] as any;
              filteredItems.push({
                id: item.id,
                contract_id: item.contract_id,
                product_id: item.product_id,
                quantity: item.quantity,
                is_joker: item.is_joker,
                delivery_date: item.delivery_date,
                product_name: (item.products as any)?.name || 'Produit inconnu',
                adherent_first_name: profile?.first_name || '',
                adherent_last_name: profile?.last_name || '',
                user_id: contract?.user_id || '',
              });
            }
          }
        }

        setOrders(filteredItems);
        setPrepared({});
      } catch (err) {
        console.error('Error loading orders:', err);
        setError('Erreur lors du chargement des commandes');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [selectedDate]);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  const handlePreparedToggle = (itemId: string) => {
    setPrepared(prev => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const getProductBreakdown = (): ProductBreakdown => {
    const breakdown: ProductBreakdown = {};
    orders.forEach(order => {
      if (!order.is_joker) {
        breakdown[order.product_name] = (breakdown[order.product_name] || 0) + order.quantity;
      }
    });
    return breakdown;
  };

  const getUniqueAdherents = (): number => {
    const adherentIds = new Set<string>();
    orders.forEach(order => {
      if (!order.is_joker) {
        adherentIds.add(order.user_id);
      }
    });
    return adherentIds.size;
  };

  const getTotalItems = (): number => {
    return orders.reduce((sum, order) => sum + (order.is_joker ? 0 : order.quantity), 0);
  };

  const exportToCSV = () => {
    const breakdown = getProductBreakdown();
    const headers = ['Adhérent', 'Produit', 'Quantité', 'Joker', 'Préparé'];
    const rows = orders.map(order => [
      `${order.adherent_first_name} ${order.adherent_last_name}`,
      order.product_name,
      order.quantity.toString(),
      order.is_joker ? 'Oui' : 'Non',
      prepared[order.id] ? 'Oui' : 'Non',
    ]);

    const csvContent = [
      '\uFEFF' + headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `commandes-${selectedDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPivotData = () => {
    const products = Array.from(new Set(orders.map(o => o.product_name)));
    const adherents = Array.from(
      new Set(orders.map(o => `${o.adherent_first_name} ${o.adherent_last_name}`))
    );

    const pivotMatrix: { [adherent: string]: { [product: string]: number } } = {};
    adherents.forEach(adherent => {
      pivotMatrix[adherent] = {};
      products.forEach(product => {
        pivotMatrix[adherent][product] = 0;
      });
    });

    orders.forEach(order => {
      const adherentName = `${order.adherent_first_name} ${order.adherent_last_name}`;
      if (pivotMatrix[adherentName]) {
        pivotMatrix[adherentName][order.product_name] =
          (pivotMatrix[adherentName][order.product_name] || 0) + order.quantity;
      }
    });

    return { products, adherents, pivotMatrix };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <Package className="h-12 w-12 text-green-600 mx-auto" />
          </div>
          <p className="text-slate-600">Chargement des commandes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <X className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  const breakdown = getProductBreakdown();
  const uniqueAdherents = getUniqueAdherents();
  const totalItems = getTotalItems();
  const pivotData = getPivotData();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Commandes à préparer</h1>
          <p className="text-slate-600">Sélectionnez une date de livraison pour voir les commandes</p>
        </div>

        {/* Date Selector */}
        <div className="bg-white rounded-lg shadow mb-6 p-6 border-l-4 border-green-600">
          <div className="flex items-center mb-4">
            <Calendar className="h-5 w-5 text-green-600 mr-2" />
            <label className="font-semibold text-slate-900">Date de livraison</label>
          </div>
          <div className="flex gap-2 flex-wrap">
            {availableDates.length === 0 ? (
              <p className="text-slate-600 italic">Aucune date de livraison disponible</p>
            ) : (
              availableDates.map(date => (
                <button
                  key={date.id}
                  onClick={() => handleDateChange(date.delivery_date)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedDate === date.delivery_date
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                  }`}
                >
                  {new Date(date.delivery_date).toLocaleDateString('fr-FR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </button>
              ))
            )}
          </div>
        </div>

        {selectedDate && orders.length > 0 && (
          <>
            {/* Summary Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-6 border-t-4 border-green-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Adhérents à servir</p>
                    <p className="text-3xl font-bold text-green-600">{uniqueAdherents}</p>
                  </div>
                  <Users className="h-10 w-10 text-green-200" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border-t-4 border-green-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Total d'articles</p>
                    <p className="text-3xl font-bold text-green-600">{totalItems}</p>
                  </div>
                  <Package className="h-10 w-10 text-green-200" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 border-t-4 border-green-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Produits</p>
                    <p className="text-3xl font-bold text-green-600">{Object.keys(breakdown).length}</p>
                  </div>
                  <ClipboardList className="h-10 w-10 text-green-200" />
                </div>
              </div>
            </div>

            {/* Products Breakdown */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="font-semibold text-slate-900 mb-4 flex items-center">
                <Package className="h-5 w-5 text-green-600 mr-2" />
                Récapitulatif des produits
              </h2>
              <div className="flex flex-wrap gap-4">
                {Object.entries(breakdown).map(([product, quantity]) => (
                  <div key={product} className="bg-gradient-to-r from-green-50 to-slate-50 px-4 py-2 rounded-lg border border-green-200">
                    <span className="font-medium text-slate-900">{product}</span>
                    <span className="ml-2 text-green-600 font-bold">× {quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-slate-900 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                Vue tableau
              </button>
              <button
                onClick={() => setViewMode('pivot')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'pivot'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-slate-900 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                Vue pivot
              </button>
            </div>

            {/* Table View */}
            {viewMode === 'table' && (
              <div className="bg-white rounded-lg shadow mb-6 overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-100 border-b-2 border-slate-300">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Adhérent</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Produit</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">Quantité</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">Statut</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">Préparé</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {orders.map(order => (
                      <tr
                        key={order.id}
                        className={`transition-colors ${
                          order.is_joker
                            ? 'bg-amber-50 hover:bg-amber-100'
                            : prepared[order.id]
                              ? 'bg-green-50 hover:bg-green-100'
                              : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className={`px-6 py-4 text-sm ${prepared[order.id] ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                          {order.adherent_first_name} {order.adherent_last_name}
                        </td>
                        <td className={`px-6 py-4 text-sm ${prepared[order.id] ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                          {order.product_name}
                        </td>
                        <td className={`px-6 py-4 text-center text-sm font-medium ${prepared[order.id] ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                          {order.quantity}
                        </td>
                        <td className="px-6 py-4 text-center text-sm">
                          {order.is_joker && (
                            <span className="inline-block bg-amber-200 text-amber-900 px-3 py-1 rounded-full text-xs font-semibold">
                              Joker
                            </span>
                          )}
                          {!order.is_joker && !prepared[order.id] && (
                            <span className="inline-block bg-green-200 text-green-900 px-3 py-1 rounded-full text-xs font-semibold">
                              À préparer
                            </span>
                          )}
                          {prepared[order.id] && (
                            <span className="inline-block bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 mx-auto w-fit">
                              <Check className="h-3 w-3" />
                              Préparé
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handlePreparedToggle(order.id)}
                            disabled={order.is_joker}
                            className={`p-2 rounded-lg transition-colors ${
                              prepared[order.id]
                                ? 'bg-green-600 text-white'
                                : order.is_joker
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                          >
                            {prepared[order.id] ? <Check className="h-5 w-5" /> : <Check className="h-5 w-5" />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pivot View */}
            {viewMode === 'pivot' && (
              <div className="bg-white rounded-lg shadow mb-6 overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-100 border-b-2 border-slate-300">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 sticky left-0 bg-slate-100 z-10">Adhérent</th>
                      {pivotData.products.map(product => (
                        <th key={product} className="px-6 py-3 text-center text-sm font-semibold text-slate-900 min-w-24">
                          {product}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {pivotData.adherents.map(adherent => {
                      const adherentOrders = orders.filter(
                        o => `${o.adherent_first_name} ${o.adherent_last_name}` === adherent
                      );
                      const hasJoker = adherentOrders.some(o => o.is_joker);
                      const allPrepared = adherentOrders.every(o => prepared[o.id]);

                      return (
                        <tr
                          key={adherent}
                          className={`transition-colors ${
                            hasJoker
                              ? 'bg-amber-50 hover:bg-amber-100'
                              : allPrepared
                                ? 'bg-green-50 hover:bg-green-100'
                                : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className={`px-6 py-4 text-sm font-medium sticky left-0 z-10 ${
                            hasJoker ? 'bg-amber-50' : allPrepared ? 'bg-green-50' : 'bg-white'
                          } ${allPrepared ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                            {adherent}
                          </td>
                          {pivotData.products.map(product => {
                            const quantity = pivotData.pivotMatrix[adherent]?.[product] || 0;
                            const relatedOrder = orders.find(
                              o =>
                                `${o.adherent_first_name} ${o.adherent_last_name}` === adherent &&
                                o.product_name === product
                            );

                            return (
                              <td
                                key={`${adherent}-${product}`}
                                className={`px-6 py-4 text-center text-sm font-medium ${
                                  relatedOrder && prepared[relatedOrder.id]
                                    ? 'line-through text-slate-500'
                                    : 'text-slate-900'
                                }`}
                              >
                                {quantity > 0 ? quantity : '-'}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 print:hidden">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium hover:bg-slate-50 transition-colors"
              >
                <Printer className="h-5 w-5" />
                Imprimer
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                <Download className="h-5 w-5" />
                Exporter CSV
              </button>
            </div>
          </>
        )}

        {selectedDate && orders.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <ClipboardList className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Aucune commande</h2>
            <p className="text-slate-600">
              Aucune commande à préparer pour la date du{' '}
              {new Date(selectedDate).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              .
            </p>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none;
          }
          table {
            page-break-inside: avoid;
          }
          tr {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
