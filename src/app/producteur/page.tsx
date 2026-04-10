'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  Package,
  Users,
  Truck,
  ArrowRight,
  Calendar,
  AlertCircle,
  ChevronRight,
  ClipboardList,
  FileText,
  Leaf,
  Sun,
  CloudSun,
  Moon,
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
      <div className="min-h-screen">
        <div className="h-52 bg-gradient-to-br from-slate-800 to-slate-700 animate-pulse" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl border border-gray-200 animate-pulse" />)}
          </div>
          <div className="h-48 bg-white rounded-2xl border border-gray-200 animate-pulse" />
        </div>
      </div>
    );
  }

  const today = new Date();
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const GreetIcon = hour < 12 ? Sun : hour < 18 ? CloudSun : Moon;
  const dateStr = today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  const totalItems = nextDeliveryQuantities.reduce((sum, q) => sum + q.totalQuantity, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero header — dark/warm for producers */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-green-400 rounded-full" />
          <div className="absolute -bottom-32 -left-16 w-64 h-64 bg-amber-400 rounded-full" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <GreetIcon className="w-5 h-5 text-amber-400" />
                <span className="text-slate-400 text-sm font-medium capitalize">{dateStr}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {greeting}, {producer?.name}
              </h1>
              <p className="text-slate-400 text-base">
                Gérez vos commandes et préparez vos livraisons.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="w-14 h-14 bg-green-500/15 backdrop-blur rounded-2xl flex items-center justify-center border border-green-500/20">
                <Leaf className="w-7 h-7 text-green-400" />
              </div>
            </div>
          </div>

          {/* Next delivery card inline */}
          {nextDelivery && (
            <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-green-500 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg shadow-green-500/30">
                    <span className="text-[10px] font-bold uppercase leading-none mt-0.5">
                      {new Date(nextDelivery.delivery_date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short' })}
                    </span>
                    <span className="text-2xl font-black leading-none">
                      {new Date(nextDelivery.delivery_date + 'T00:00:00').getDate()}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-green-400 uppercase tracking-wider">Prochaine livraison</p>
                    <p className="text-xl font-bold text-white capitalize">
                      {new Date(nextDelivery.delivery_date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-2xl font-black text-white">{totalItems}</p>
                    <p className="text-xs text-slate-400">articles à préparer</p>
                  </div>
                  <Link
                    href="/producteur/commandes"
                    className="px-5 py-3 bg-green-500 hover:bg-green-400 text-white font-bold rounded-xl transition-colors shadow-lg shadow-green-500/30 flex items-center gap-2"
                  >
                    Préparer
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* No delivery warning */}
        {!nextDelivery && (
          <div className="flex items-center gap-3 p-4 mb-6 bg-amber-50 border-2 border-amber-200 rounded-2xl">
            <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">Aucune livraison prévue</p>
              <p className="text-xs text-amber-700">Pas de livraison à venir pour le moment.</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Contrats', value: contractModels.length, icon: FileText, bg: 'bg-green-100', iconColor: 'text-green-700', accent: 'border-green-200' },
            { label: 'Adhérents', value: subscribersCount, icon: Users, bg: 'bg-blue-100', iconColor: 'text-blue-700', accent: 'border-blue-200' },
            { label: 'Produits', value: products.length, icon: Package, bg: 'bg-amber-100', iconColor: 'text-amber-700', accent: 'border-amber-200' },
            { label: 'Livraisons', value: upcomingDeliveries.length, icon: Truck, bg: 'bg-purple-100', iconColor: 'text-purple-700', accent: 'border-purple-200' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className={`bg-white rounded-2xl border-2 ${stat.accent} p-5`}>
                <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                <p className="text-3xl font-black text-gray-900">{stat.value}</p>
                <p className="text-xs font-semibold text-gray-500 mt-0.5 uppercase tracking-wide">{stat.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Preparation details */}
          {nextDeliveryQuantities.length > 0 && (
            <div className="lg:col-span-2 bg-white rounded-2xl border-2 border-green-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-green-100 bg-green-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-green-700" />
                  <h2 className="text-sm font-bold text-green-900 uppercase tracking-wide">Préparation à venir</h2>
                </div>
                <Link href="/producteur/commandes" className="text-xs font-semibold text-green-600 hover:text-green-700 flex items-center gap-1">
                  Détails <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="p-6 grid sm:grid-cols-2 gap-3">
                {nextDeliveryQuantities.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{item.productName}</p>
                      <p className="text-xs text-gray-500">à préparer</p>
                    </div>
                    <div className="text-2xl font-black text-green-600 bg-green-50 px-4 py-1.5 rounded-xl border border-green-200">
                      {item.totalQuantity}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-4">
                <div className="flex items-center justify-between bg-slate-900 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-white font-bold">{subscribersCount} adhérents à servir</p>
                      <p className="text-slate-400 text-xs">{totalItems} articles au total</p>
                    </div>
                  </div>
                  <Link href="/producteur/commandes" className="px-4 py-2 bg-green-500 hover:bg-green-400 text-white text-sm font-bold rounded-lg transition-colors">
                    Préparer
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Upcoming deliveries or full width if no quantities */}
          <div className={`${nextDeliveryQuantities.length > 0 ? '' : 'lg:col-span-2'} bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden`}>
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Calendrier</h2>
              </div>
              <Link href="/producteur/livraisons" className="text-xs font-semibold text-green-600 hover:text-green-700 flex items-center gap-1">
                Tout voir <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {upcomingDeliveries.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {upcomingDeliveries.slice(0, 6).map((delivery, i) => {
                  const date = new Date(delivery.delivery_date + 'T00:00:00');
                  const isNext = i === 0;
                  return (
                    <div key={delivery.id} className="flex items-center gap-4 px-6 py-3.5">
                      <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 ${
                        isNext ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <span className="text-[10px] font-bold uppercase leading-none mt-0.5">{date.toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
                        <span className="text-lg font-black leading-none">{date.getDate()}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 capitalize">
                          {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                        <p className="text-xs text-gray-500">17h — 19h</p>
                      </div>
                      {isNext && <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">Prochaine</span>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-10 text-center text-sm text-gray-500">Aucune livraison prévue.</div>
            )}
          </div>

          {/* Quick access - always in last column */}
          {nextDeliveryQuantities.length === 0 && <div />}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 h-fit">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Accès rapide</h3>
            <div className="space-y-2">
              {[
                { href: '/producteur/commandes', label: 'Commandes', desc: 'Préparation & export', icon: ClipboardList, bg: 'bg-green-600', primary: true },
                { href: '/producteur/livraisons', label: 'Livraisons', desc: 'Planning & feuilles', icon: Truck, bg: 'bg-blue-100', primary: false },
                { href: '/producteur/contrats', label: 'Contrats', desc: 'Adhérents & tarifs', icon: FileText, bg: 'bg-purple-100', primary: false },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                      action.primary ? 'bg-slate-900 hover:bg-slate-800 text-white' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      action.primary ? 'bg-green-500' : action.bg
                    }`}>
                      <Icon className={`w-[18px] h-[18px] ${
                        action.primary ? 'text-white' : action.bg.includes('blue') ? 'text-blue-700' : 'text-purple-700'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${action.primary ? '' : 'text-gray-900'}`}>{action.label}</p>
                      <p className={`text-xs ${action.primary ? 'text-slate-400' : 'text-gray-500'}`}>{action.desc}</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${action.primary ? 'text-slate-500' : 'text-gray-300'}`} />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
