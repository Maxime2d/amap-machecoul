'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  CheckCircle,
  Package,
  Users,
  Truck,
  ArrowRight,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface ContractModel {
  id: string;
  name: string;
}

interface ModelDate {
  id: string;
  delivery_date: string;
  is_cancelled: boolean;
  model_id: string;
}

interface Product {
  id: string;
  name: string;
}

interface Producer {
  id: string;
  name: string;
}

interface ContractItem {
  product_id: string;
  quantity: number;
}

interface ProductQuantity {
  productId: string;
  productName: string;
  totalQuantity: number;
}

export default function ProducerDashboard() {
  const supabase = createClient();
  const [producer, setProducer] = useState<Producer | null>(null);
  const [contractModels, setContractModels] = useState<ContractModel[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [upcomingDeliveries, setUpcomingDeliveries] = useState<ModelDate[]>([]);
  const [nextDelivery, setNextDelivery] = useState<ModelDate | null>(null);
  const [nextDeliveryQuantities, setNextDeliveryQuantities] = useState<
    ProductQuantity[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
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

        // Get producer details
        const { data: producerData } = await supabase
          .from('producers')
          .select('id, name')
          .eq('id', referent.producer_id)
          .single();

        if (!producerData) return;

        setProducer(producerData as Producer);

        // Get contract models
        const { data: modelsData } = await supabase
          .from('contract_models')
          .select('id, name')
          .eq('producer_id', referent.producer_id);

        if (modelsData && modelsData.length > 0) {
          setContractModels(modelsData as ContractModel[]);

          const modelIds = modelsData.map((m) => m.id);

          // Get upcoming deliveries
          const { data: deliveriesData } = await supabase
            .from('model_dates')
            .select('id, delivery_date, is_cancelled, model_id')
            .in('model_id', modelIds)
            .gte('delivery_date', new Date().toISOString().split('T')[0])
            .eq('is_cancelled', false)
            .order('delivery_date', { ascending: true });

          if (deliveriesData && deliveriesData.length > 0) {
            setUpcomingDeliveries(deliveriesData as ModelDate[]);
            setNextDelivery(deliveriesData[0]);

            // Get products for this producer
            const { data: productsData } = await supabase
              .from('products')
              .select('id, name')
              .eq('producer_id', referent.producer_id);

            if (productsData) {
              setProducts(productsData as Product[]);

              // Get contract items for next delivery
              const nextDate = deliveriesData[0].delivery_date;
              const { data: itemsData } = await supabase
                .from('contract_items')
                .select('product_id, quantity')
                .eq('delivery_date', nextDate)
                .eq('is_joker', false);

              if (itemsData && itemsData.length > 0) {
                // Group by product and sum quantities
                const quantityMap = new Map<string, number>();
                itemsData.forEach((item: ContractItem) => {
                  const current = quantityMap.get(item.product_id) || 0;
                  quantityMap.set(item.product_id, current + item.quantity);
                });

                // Map to product names
                const quantities: ProductQuantity[] = Array.from(
                  quantityMap.entries()
                ).map(([productId, totalQuantity]) => {
                  const product = productsData.find((p) => p.id === productId);
                  return {
                    productId,
                    productName: product?.name || 'Produit inconnu',
                    totalQuantity,
                  };
                });

                setNextDeliveryQuantities(quantities);
              }
            }
          }
        }

        // Get active subscribers count
        const { data: contractsData } = await supabase
          .from('contracts')
          .select('id', { count: 'exact' })
          .eq('status', 'active');

        if (contractsData) {
          setSubscribersCount(contractsData.length);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-600">Chargement...</p>
      </div>
    );
  }

  const today = new Date();
  const todayFormatted = today.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">
          Bienvenue, {producer?.name}!
        </h1>
        <p className="text-slate-600 text-sm">{todayFormatted}</p>
      </div>

      {/* Next Delivery Hero Card */}
      {nextDelivery ? (
        <div className="mb-8 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-8 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-2">
                Prochaine livraison
              </p>
              <h2 className="text-4xl font-bold text-slate-900">
                {new Date(nextDelivery.delivery_date).toLocaleDateString(
                  'fr-FR',
                  {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  }
                )}
              </h2>
            </div>
            <Calendar className="w-12 h-12 text-green-600" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Quantities to Prepare */}
            <div>
              <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">
                À préparer
              </p>
              {nextDeliveryQuantities.length > 0 ? (
                <div className="space-y-3">
                  {nextDeliveryQuantities.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm"
                    >
                      <span className="text-slate-700 font-medium">
                        {item.productName}
                      </span>
                      <span className="text-2xl font-bold text-green-600">
                        {item.totalQuantity}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 text-sm">
                  Aucune commande pour cette livraison.
                </p>
              )}
            </div>

            {/* Subscribers Count */}
            <div className="flex flex-col justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">
                  Adhérents à servir
                </p>
                <p className="text-5xl font-bold text-green-600">
                  {subscribersCount}
                </p>
              </div>
              <Link
                href="/producteur/commandes"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors w-full md:w-auto"
              >
                Voir la préparation complète
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8 bg-amber-50 border-2 border-amber-200 rounded-xl p-8">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-amber-900">
                Aucune livraison prévue
              </p>
              <p className="text-sm text-amber-700 mt-1">
                Il n'y a pas de livraison prévue pour le moment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-xs font-semibold uppercase tracking-wide">
                Modèles de contrats
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {contractModels.length}
              </p>
            </div>
            <CheckCircle className="w-6 h-6 text-green-600 opacity-70" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-xs font-semibold uppercase tracking-wide">
                Adhérents actifs
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {subscribersCount}
              </p>
            </div>
            <Users className="w-6 h-6 text-blue-600 opacity-70" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-xs font-semibold uppercase tracking-wide">
                Produits
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {products.length}
              </p>
            </div>
            <Package className="w-6 h-6 text-amber-600 opacity-70" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-xs font-semibold uppercase tracking-wide">
                Livraisons à venir
              </p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {upcomingDeliveries.length}
              </p>
            </div>
            <Truck className="w-6 h-6 text-purple-600 opacity-70" />
          </div>
        </div>
      </div>

      {/* Upcoming 5 Deliveries List */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          Prochaines livraisons
        </h2>
        {upcomingDeliveries.length > 0 ? (
          <div className="space-y-2">
            {upcomingDeliveries.map((delivery, index) => (
              <div
                key={delivery.id}
                className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      delivery.is_cancelled
                        ? 'bg-red-400'
                        : index === 0
                          ? 'bg-green-500'
                          : 'bg-slate-300'
                    }`}
                  />
                  <div>
                    <p
                      className={`font-medium ${
                        delivery.is_cancelled
                          ? 'text-slate-500 line-through'
                          : 'text-slate-900'
                      }`}
                    >
                      {new Date(delivery.delivery_date).toLocaleDateString(
                        'fr-FR',
                        {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        }
                      )}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold uppercase tracking-wide ${
                    delivery.is_cancelled
                      ? 'text-red-600 bg-red-50'
                      : 'text-green-600 bg-green-50'
                  } px-3 py-1 rounded-full`}
                >
                  {delivery.is_cancelled ? 'Annulée' : 'Prévue'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-600 text-sm">
            Aucune livraison prévue pour le moment.
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/producteur/commandes"
          className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition-colors"
        >
          <Package className="w-5 h-5" />
          Commandes
        </Link>
        <Link
          href="/producteur/livraisons"
          className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition-colors"
        >
          <Truck className="w-5 h-5" />
          Livraisons
        </Link>
        <Link
          href="/producteur/contrats"
          className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition-colors"
        >
          <CheckCircle className="w-5 h-5" />
          Contrats
        </Link>
      </div>
    </div>
  );
}
