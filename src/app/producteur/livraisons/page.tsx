'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import { Printer, AlertCircle } from 'lucide-react';

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
  is_joker: boolean;
  products?: {
    name: string;
  };
  contracts?: {
    user_id: string;
    profiles?: {
      first_name: string;
      last_name: string;
    };
  };
}

interface GroupedDelivery {
  date: string;
  items: ContractItem[];
  isCancelled: boolean;
}

export default function DeliveriesPage() {
  const supabase = createClient();
  const [deliveries, setDeliveries] = useState<GroupedDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDeliveries() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        // Get producer referent
        const { data: referent } = await supabase
          .from('producer_referents')
          .select('producer_id')
          .eq('user_id', user.id)
          .single();

        if (!referent) return;

        // Get contract models for this producer
        const { data: contractModels } = await supabase
          .from('contract_models')
          .select('id')
          .eq('producer_id', referent.producer_id);

        if (!contractModels || contractModels.length === 0) {
          setDeliveries([]);
          return;
        }

        const modelIds = contractModels.map((m) => m.id);

        // Get model dates
        const { data: modelDates } = await supabase
          .from('model_dates')
          .select('id, model_id, delivery_date, is_cancelled')
          .in('model_id', modelIds)
          .order('delivery_date', { ascending: true });

        if (!modelDates || modelDates.length === 0) {
          setDeliveries([]);
          return;
        }

        // Get all contract items for these dates
        const deliveryDates = modelDates.map((md) => md.delivery_date);
        const { data: contractItems } = await supabase
          .from('contract_items')
          .select(
            `
            id,
            contract_id,
            product_id,
            delivery_date,
            quantity,
            is_joker,
            products(name),
            contracts(user_id, profiles(first_name, last_name))
          `
          )
          .in('product_id', [])
          .in('delivery_date', deliveryDates);

        // Get all contracts for this producer's models
        const { data: contracts } = await supabase
          .from('contracts')
          .select('id, user_id, model_id, profiles(first_name, last_name)')
          .in('model_id', modelIds);

        // Get all contract items with related data
        const { data: allItems } = await supabase
          .from('contract_items')
          .select(
            `
            id,
            contract_id,
            product_id,
            delivery_date,
            quantity,
            is_joker,
            products(name)
          `
          )
          .in('delivery_date', deliveryDates);

        // Match contract items with contract info
        const enrichedItems = (allItems || []).map((item) => {
          const contract = (contracts || []).find((c) => c.id === item.contract_id);
          return {
            ...item,
            contracts: contract,
          };
        });

        // Group by delivery date
        const grouped: { [key: string]: GroupedDelivery } = {};

        (modelDates as ModelDate[]).forEach((md) => {
          if (!grouped[md.delivery_date]) {
            grouped[md.delivery_date] = {
              date: md.delivery_date,
              items: [],
              isCancelled: md.is_cancelled,
            };
          } else {
            grouped[md.delivery_date].isCancelled =
              grouped[md.delivery_date].isCancelled || md.is_cancelled;
          }
        });

        enrichedItems.forEach((item) => {
          if (grouped[item.delivery_date]) {
            grouped[item.delivery_date].items.push(item as any);
          }
        });

        const deliveryList = Object.values(grouped).sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        setDeliveries(deliveryList);
      } catch (error) {
        console.error('Error fetching deliveries:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDeliveries();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Livraisons
          </h1>
          <p className="text-slate-600">
            Feuilles de distribution pour vos adhérents
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors print:hidden"
        >
          <Printer className="w-5 h-5" />
          Imprimer
        </button>
      </div>

      {deliveries.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">
            Aucune livraison prévue pour le moment.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {deliveries.map((delivery) => (
            <div
              key={delivery.date}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <div
                className={`px-6 py-4 border-b border-slate-200 ${
                  delivery.isCancelled ? 'bg-red-50' : 'bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {new Date(delivery.date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                      {delivery.items.length} adhérent
                      {delivery.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {delivery.isCancelled && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                      ANNULÉE
                    </span>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Adhérent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Produit
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Quantité
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {delivery.items.map((item, index) => (
                      <tr
                        key={item.id}
                        className={`border-b border-slate-100 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                        }`}
                      >
                        <td className="px-6 py-4 text-sm text-slate-900">
                          {item.contracts?.profiles
                            ? `${item.contracts.profiles.first_name} ${item.contracts.profiles.last_name}`
                            : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900">
                          {item.products?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium text-slate-900">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {item.is_joker && (
                            <span className="text-amber-600 font-medium">Joker</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
