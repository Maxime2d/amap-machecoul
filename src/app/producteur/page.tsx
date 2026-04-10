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
  ChevronRight,
  ClipboardList,
  FileText,
} from 'lucide-react';

interface ContractModel { id: string; name: string; }
interface ModelDate { id: string; delivery_date: string; is_cancelled: boolean; model_id: string; }
interface Product { id: string; name: string; }
interface Producer { id: string; name: string; }
interface ProductQuantity { productId: string; productName: string; totalQuantity: number; }

export default function ProducerDashboard() {
  const supabase = createClient();
  const [producer, setProducer] = useState<Producer | null>(null);
  const [contractModels, setContractModels] = useState<ContractModel[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [upcomingDeliveries, setUpcomingDeliveries] = useState<ModelDate[]>([]);
  const [nextDelivery, setNextDelivery] = useState<ModelDate | null>(null);
  const [nextDeliveryQuantities, setNextDeliveryQuantities] = useState<ProductQuantity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: referent } = await supabase.from('producer_referents').select('producer_id').eq('user_id', user.id).single();
        if (!referent) return;

        const { data: producerData } = await supabase.from('producers').select('id, name').eq('id', referent.producer_id).single();
        if (!producerData) return;
        setProducer(producerData as Producer);

        const { data: modelsData } = await supabase.from('contract_models').select('id, name').eq('producer_id', referent.producer_id);
        if (modelsData && modelsData.length > 0) {
          setContractModels(modelsData as ContractModel[]);
          const modelIds = modelsData.map((m) => m.id);

          const { data: deliveriesData } = await supabase
            .from('model_dates').select('id, delivery_date, is_cancelled, model_id')
            .in('model_id', modelIds).gte('delivery_date', new Date().toISOString().split('T')[0])
            .eq('is_cancelled', false).order('delivery_date', { ascending: true });

          if (deliveriesData && deliveriesData.length > 0) {
            setUpcomingDeliveries(deliveriesData as ModelDate[]);
            setNextDelivery(deliveriesData[0]);

            const { data: productsData } = await supabase.from('products').select('id, name').eq('producer_id', referent.producer_id);
            if (productsData) {
              setProducts(productsData as Product[]);
              const nextDate = deliveriesData[0].delivery_date;
              const { data: itemsData } = await supabase.from('contract_items').select('product_id, quantity').eq('delivery_date', nextDate).eq('is_joker', false);

              if (itemsData && itemsData.length > 0) {
                const quantityMap = new Map<string, number>();
                itemsData.forEach((item: any) => {
                  quantityMap.set(item.product_id, (quantityMap.get(item.product_id) || 0) + item.quantity);
                });
                setNextDeliveryQuantities(Array.from(quantityMap.entries()).map(([productId, totalQuantity]) => ({
                  productId, totalQuantity,
                  productName: productsData.find((p) => p.id === productId)?.name || 'Produit inconnu',
                })));
              }
            }
          }
        }

        const { data: contractsData } = await supabase.from('contracts').select('id', { count: 'exact' }).eq('status', 'active');
        if (contractsData) setSubscribersCount(contractsData.length);
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Skeleton loader */}
        <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
        <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const today = new Date();
  const dateStr = today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Calendar className="w-3.5 h-3.5" />
          <span className="capitalize">{dateStr}</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {greeting}, {producer?.name}
        </h1>
        <p className="text-gray-500 mt-1">Voici le résumé de votre activité.</p>
      </div>

      {/* Next Delivery Hero */}
      {nextDelivery ? (
        <div className="mb-8 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-5 flex items-center justify-between">
            <div>
              <p className="text-green-100 text-xs font-semibold uppercase tracking-wider mb-1">Prochaine livraison</p>
              <h2 className="text-2xl font-bold text-white capitalize">
                {new Date(nextDelivery.delivery_date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h2>
            </div>
            <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Products to prepare */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">À préparer</p>
                {nextDeliveryQuantities.length > 0 ? (
                  <div className="space-y-2">
                    {nextDeliveryQuantities.map((item) => (
                      <div key={item.productId} className="flex items-center justify-between bg-gray-50 rounded-xl p-3.5">
                        <span className="text-sm font-medium text-gray-700">{item.productName}</span>
                        <span className="text-lg font-bold text-green-600 bg-green-50 px-3 py-0.5 rounded-lg">{item.totalQuantity}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Aucune commande pour cette livraison.</p>
                )}
              </div>

              {/* Subscribers + CTA */}
              <div className="flex flex-col">
                <div className="bg-gray-50 rounded-xl p-5 mb-4 flex-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Adhérents à servir</p>
                  <p className="text-4xl font-bold text-gray-900">{subscribersCount}</p>
                </div>
                <Link
                  href="/producteur/commandes"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition-colors"
                >
                  Voir la préparation complète
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8 flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-900">Aucune livraison prévue</p>
            <p className="text-xs text-amber-700">Il n'y a pas de livraison à venir pour le moment.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Contrats', value: contractModels.length, icon: FileText, color: 'green' },
          { label: 'Adhérents actifs', value: subscribersCount, icon: Users, color: 'blue' },
          { label: 'Produits', value: products.length, icon: Package, color: 'amber' },
          { label: 'Livraisons à venir', value: upcomingDeliveries.length, icon: Truck, color: 'purple' },
        ].map((stat) => {
          const Icon = stat.icon;
          const bgColor = `bg-${stat.color}-50`;
          const textColor = `text-${stat.color}-600`;
          return (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  stat.color === 'green' ? 'bg-green-50' : stat.color === 'blue' ? 'bg-blue-50' : stat.color === 'amber' ? 'bg-amber-50' : 'bg-purple-50'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    stat.color === 'green' ? 'text-green-600' : stat.color === 'blue' ? 'text-blue-600' : stat.color === 'amber' ? 'text-amber-500' : 'text-purple-600'
                  }`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming deliveries */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h2 className="text-base font-semibold text-gray-900">Prochaines livraisons</h2>
            <Link href="/producteur/livraisons" className="text-xs font-medium text-green-600 hover:text-green-700 flex items-center gap-1">
              Tout voir <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {upcomingDeliveries.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {upcomingDeliveries.slice(0, 6).map((delivery, i) => {
                const date = new Date(delivery.delivery_date + 'T00:00:00');
                const dayNum = date.getDate();
                const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
                const isNext = i === 0;
                return (
                  <div key={delivery.id} className="flex items-center gap-4 px-6 py-3.5">
                    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                      isNext ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <span className="text-[10px] font-medium uppercase leading-none mt-0.5">{dayName}</span>
                      <span className="text-lg font-bold leading-none">{dayNum}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                      <p className="text-xs text-gray-500">17h00 — 19h00</p>
                    </div>
                    {isNext && <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg">Prochaine</span>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-10 text-center text-sm text-gray-500">Aucune livraison prévue.</div>
          )}
        </div>

        {/* Quick Actions sidebar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 h-fit">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Accès rapide</h3>
          <div className="space-y-2">
            {[
              { href: '/producteur/commandes', label: 'Commandes', desc: 'Préparation', icon: ClipboardList, color: 'green' },
              { href: '/producteur/livraisons', label: 'Livraisons', desc: 'Planning', icon: Truck, color: 'blue' },
              { href: '/producteur/contrats', label: 'Contrats', desc: 'Gestion', icon: FileText, color: 'purple' },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    action.color === 'green' ? 'bg-green-50 group-hover:bg-green-100' : action.color === 'blue' ? 'bg-blue-50 group-hover:bg-blue-100' : 'bg-purple-50 group-hover:bg-purple-100'
                  } transition-colors`}>
                    <Icon className={`w-[18px] h-[18px] ${
                      action.color === 'green' ? 'text-green-600' : action.color === 'blue' ? 'text-blue-600' : 'text-purple-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{action.label}</p>
                    <p className="text-xs text-gray-500">{action.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
