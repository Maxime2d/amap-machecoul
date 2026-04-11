'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  Package,
  Users,
  Truck,
  ArrowRight,
  AlertCircle,
  ChevronRight,
  ClipboardList,
  Clock,
  MapPin,
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
                itemsData.forEach((item: any) => { quantityMap.set(item.product_id, (quantityMap.get(item.product_id) || 0) + item.quantity); });
                setNextDeliveryQuantities(Array.from(quantityMap.entries()).map(([productId, totalQuantity]) => ({
                  productId, totalQuantity, productName: productsData.find((p) => p.id === productId)?.name || 'Produit inconnu',
                })));
              }
            }
          }
        }
        const { data: contractsData } = await supabase.from('contracts').select('id', { count: 'exact' }).eq('status', 'active');
        if (contractsData) setSubscribersCount(contractsData.length);
      } catch (error) { console.error('Error:', error); } finally { setLoading(false); }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div className="h-8 w-48 bg-slate-800 rounded-lg animate-pulse" />
          <div className="h-48 bg-slate-900 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-900 rounded-2xl animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  const totalItems = nextDeliveryQuantities.reduce((sum, q) => sum + q.totalQuantity, 0);

  // Days until next delivery
  let daysUntil = -1;
  if (nextDelivery) {
    const diff = new Date(nextDelivery.delivery_date + 'T00:00:00').getTime() - new Date().setHours(0, 0, 0, 0);
    daysUntil = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-10">

        {/* Compact greeting */}
        <div className="mb-8">
          <p className="text-sm text-slate-500 mb-1">Espace producteur</p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            {producer?.name || 'Producteur'}
          </h1>
        </div>

        {/* NEXT DELIVERY — the #1 thing a producer needs */}
        {nextDelivery ? (
          <div className="mb-8 rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
            <div className="relative bg-gradient-to-r from-green-600 to-emerald-500 px-6 md:px-8 py-6 text-white">
              <div className="absolute inset-0 opacity-[0.08]" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'2\' cy=\'2\' r=\'1\' fill=\'white\'/%3E%3C/svg%3E")', backgroundSize: '20px 20px'}} />
              <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-5">
                  <div className="w-[72px] h-[72px] bg-white rounded-2xl flex flex-col items-center justify-center text-green-700 shadow-lg flex-shrink-0">
                    <span className="text-[11px] font-black uppercase tracking-wider leading-none">
                      {new Date(nextDelivery.delivery_date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}
                    </span>
                    <span className="text-3xl font-black leading-none -mt-0.5">
                      {new Date(nextDelivery.delivery_date + 'T00:00:00').getDate()}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider leading-none text-green-600">
                      {new Date(nextDelivery.delivery_date + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}
                    </span>
                  </div>
                  <div>
                    <p className="text-green-200 text-xs font-bold uppercase tracking-widest mb-1">Prochaine livraison</p>
                    <p className="text-2xl md:text-3xl font-extrabold capitalize leading-tight">
                      {new Date(nextDelivery.delivery_date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-green-100 text-sm">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 17h — 19h</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Machecoul</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:flex-col md:items-end">
                  {daysUntil === 0 ? (
                    <span className="px-4 py-2 bg-white text-green-700 rounded-full text-sm font-extrabold shadow-lg animate-pulse">
                      C&apos;est aujourd&apos;hui !
                    </span>
                  ) : daysUntil === 1 ? (
                    <span className="px-4 py-2 bg-white/20 backdrop-blur rounded-full text-sm font-bold border border-white/30">
                      C&apos;est demain
                    </span>
                  ) : daysUntil > 0 ? (
                    <span className="px-4 py-2 bg-white/15 backdrop-blur rounded-full text-sm font-semibold border border-white/20">
                      Dans {daysUntil} jours
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Preparation summary inline */}
            {nextDeliveryQuantities.length > 0 && (
              <div className="px-6 md:px-8 py-5 border-t border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">À préparer</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500">{subscribersCount} adhérents</span>
                    <span className="text-slate-700">·</span>
                    <span className="text-white font-extrabold">{totalItems} articles</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {nextDeliveryQuantities.map((item) => (
                    <div key={item.productId} className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/50">
                      <p className="text-xs text-slate-400 truncate">{item.productName}</p>
                      <p className="text-2xl font-black text-green-400 mt-1">{item.totalQuantity}</p>
                    </div>
                  ))}
                </div>
                <Link
                  href="/producteur/commandes"
                  className="mt-4 w-full flex items-center justify-center gap-2 px-5 py-3 bg-green-500 hover:bg-green-400 text-white font-bold rounded-xl transition-colors shadow-lg shadow-green-500/20"
                >
                  <ClipboardList className="w-4 h-4" />
                  Voir le détail des commandes
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {nextDeliveryQuantities.length === 0 && (
              <div className="px-6 md:px-8 py-4 border-t border-slate-800 flex items-center justify-between">
                <p className="text-sm text-slate-400">Aucune commande enregistrée pour cette livraison.</p>
                <Link href="/producteur/commandes" className="text-sm font-bold text-green-400 hover:text-green-300 flex items-center gap-1">
                  Commandes <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-8 bg-slate-900 rounded-2xl p-8 text-center border border-slate-800">
            <AlertCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="font-bold text-slate-300">Aucune livraison prévue</p>
            <p className="text-sm text-slate-500 mt-1">Pas de livraison à venir pour le moment.</p>
          </div>
        )}

        {/* Stats + Calendar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Contrats', value: contractModels.length, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
            { label: 'Adhérents', value: subscribersCount, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
            { label: 'Produits', value: products.length, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
            { label: 'Livraisons', value: upcomingDeliveries.length, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.bg} rounded-2xl border ${stat.border} p-4`}>
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Calendar — upcoming dates */}
        {upcomingDeliveries.length > 1 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold text-white">Prochaines dates</h2>
              <Link href="/producteur/livraisons" className="text-sm font-bold text-green-400 hover:text-green-300 flex items-center gap-1">
                Tout voir <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {upcomingDeliveries.slice(1, 4).map((delivery) => {
                const date = new Date(delivery.delivery_date + 'T00:00:00');
                return (
                  <div key={delivery.id} className="bg-slate-900 rounded-2xl border border-slate-800 p-4 text-center hover:border-slate-700 transition-colors">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}
                    </p>
                    <p className="text-2xl font-black text-white my-1">{date.getDate()}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">
                      {date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Distribution info */}
        <div className="mt-6 p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Tous les vendredis</p>
              <p className="text-xs text-slate-400 mt-0.5">17h — 19h · Salle associative de Machecoul</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
