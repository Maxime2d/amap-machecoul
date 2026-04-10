import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  AlertCircle,
  Leaf,
  Clock,
  Truck,
  ArrowRight,
  Calendar,
  Package,
  ChevronRight,
  ShoppingBag,
  MapPin,
  FileText,
  CreditCard,
  User,
} from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/connexion');

  const [{ data: profile }, { data: contracts }, { data: nextDeliveries }] = await Promise.all([
    supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single(),
    supabase.from('contracts').select('*, contract_models(name, nature, producer_id, producers(name))').eq('user_id', user.id),
    supabase.from('delivery_dates').select('date, contract_model_id, contract_models(name, producers(name))').gte('date', new Date().toISOString().split('T')[0]).order('date').limit(10),
  ]);

  const { data: payments } = await supabase
    .from('payments').select('*')
    .in('contract_id', (contracts as any[])?.map((c: any) => c.id) || []);

  const activeContracts = (contracts as any[])?.filter((c: any) => c.status === 'active') || [];
  const pendingPayments = (payments as any[])?.filter((p: any) => p.status === 'pending') || [];

  // Get unique next delivery dates with associated producers
  const deliveryMap = new Map<string, string[]>();
  (nextDeliveries as any[])?.forEach((d: any) => {
    const producers = deliveryMap.get(d.date) || [];
    const pName = d.contract_models?.producers?.name;
    if (pName && !producers.includes(pName)) producers.push(pName);
    deliveryMap.set(d.date, producers);
  });
  const upcomingDates = Array.from(deliveryMap.entries()).slice(0, 4);
  const nextDate = upcomingDates[0];

  const firstName = (profile as any)?.first_name || 'Adhérent';
  const pendingTotal = pendingPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

  // Days until next delivery
  let daysUntil = -1;
  if (nextDate) {
    const diff = new Date(nextDate[0] + 'T00:00:00').getTime() - new Date().setHours(0,0,0,0);
    daysUntil = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-10">

        {/* Compact greeting + next delivery as THE focus */}
        <div className="mb-8">
          <p className="text-sm text-stone-500 mb-1">Espace adhérent</p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-stone-900 tracking-tight">
            Salut {firstName} !
          </h1>
        </div>

        {/* NEXT DELIVERY — the #1 thing an adhérent wants to know */}
        {nextDate ? (
          <div className="mb-8 rounded-3xl overflow-hidden bg-white shadow-xl shadow-stone-200/60 border border-stone-200">
            <div className="relative bg-gradient-to-r from-green-700 to-green-600 px-6 md:px-8 py-6 text-white">
              {/* Subtle farm texture */}
              <div className="absolute inset-0 opacity-[0.06]" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'2\' cy=\'2\' r=\'1\' fill=\'white\'/%3E%3C/svg%3E")', backgroundSize: '20px 20px'}} />
              <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-5">
                  <div className="w-[72px] h-[72px] bg-white rounded-2xl flex flex-col items-center justify-center text-green-700 shadow-lg flex-shrink-0">
                    <span className="text-[11px] font-black uppercase tracking-wider leading-none">
                      {new Date(nextDate[0] + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}
                    </span>
                    <span className="text-3xl font-black leading-none -mt-0.5">
                      {new Date(nextDate[0] + 'T00:00:00').getDate()}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider leading-none text-green-600">
                      {new Date(nextDate[0] + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}
                    </span>
                  </div>
                  <div>
                    <p className="text-green-200 text-xs font-bold uppercase tracking-widest mb-1">Prochaine distribution</p>
                    <p className="text-2xl md:text-3xl font-extrabold capitalize leading-tight">
                      {new Date(nextDate[0] + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
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
                      C'est aujourd'hui !
                    </span>
                  ) : daysUntil === 1 ? (
                    <span className="px-4 py-2 bg-white/20 backdrop-blur rounded-full text-sm font-bold border border-white/30">
                      C'est demain
                    </span>
                  ) : daysUntil > 0 ? (
                    <span className="px-4 py-2 bg-white/15 backdrop-blur rounded-full text-sm font-semibold border border-white/20">
                      Dans {daysUntil} jours
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* What you'll get */}
            {nextDate[1].length > 0 && (
              <div className="px-6 md:px-8 py-4 bg-green-50/50 border-t border-green-100">
                <p className="text-xs font-bold text-green-800 uppercase tracking-wider mb-2">Vous recevrez des produits de :</p>
                <div className="flex flex-wrap gap-2">
                  {nextDate[1].map((producer: string) => (
                    <span key={producer} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-sm font-semibold text-green-800 border border-green-200 shadow-sm">
                      <Leaf className="w-3.5 h-3.5 text-green-500" />
                      {producer}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-8 bg-stone-100 rounded-2xl p-8 text-center border border-stone-200">
            <Calendar className="w-10 h-10 text-stone-400 mx-auto mb-3" />
            <p className="font-bold text-stone-700">Pas de livraison prévue</p>
            <p className="text-sm text-stone-500 mt-1">Souscrivez un contrat pour commencer.</p>
          </div>
        )}

        {/* Alert if payments pending */}
        {pendingPayments.length > 0 && (
          <Link href="/app/cotisation" className="flex items-center gap-4 mb-6 p-5 bg-red-50 border-2 border-red-200 rounded-2xl hover:border-red-300 transition-colors group">
            <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/20">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-red-900">{pendingPayments.length} paiement{pendingPayments.length > 1 ? 's' : ''} en attente — {pendingTotal.toFixed(0)} €</p>
              <p className="text-sm text-red-700 mt-0.5">Cliquez pour régulariser votre situation</p>
            </div>
            <ArrowRight className="w-5 h-5 text-red-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-5 gap-6">

          {/* LEFT — Contracts */}
          <div className="lg:col-span-3 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-extrabold text-stone-900">Mes contrats</h2>
                <Link href="/app/contrats" className="text-sm font-bold text-green-700 hover:text-green-800 flex items-center gap-1">
                  Tous <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {activeContracts.length > 0 ? (
                <div className="space-y-3">
                  {activeContracts.map((contract: any) => {
                    const isFlexible = contract.contract_models?.nature === 'flexible';
                    return (
                      <Link
                        key={contract.id}
                        href={`/app/contrats/${contract.id}`}
                        className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-stone-200 hover:border-green-300 hover:shadow-lg hover:shadow-green-100/50 transition-all group"
                      >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                          isFlexible
                            ? 'bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600'
                            : 'bg-gradient-to-br from-green-100 to-emerald-100 text-green-700'
                        }`}>
                          {isFlexible ? <ShoppingBag className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-stone-900 truncate group-hover:text-green-700 transition-colors">
                            {contract.contract_models?.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-stone-500">{contract.contract_models?.producers?.name}</span>
                            {isFlexible && (
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold uppercase">Flexible</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {isFlexible ? (
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">Commander</span>
                          ) : (
                            <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-green-500 transition-colors" />
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <Link
                  href="/app/contrats/disponibles"
                  className="flex items-center gap-5 p-6 bg-gradient-to-r from-green-600 to-emerald-500 rounded-2xl text-white hover:from-green-700 hover:to-emerald-600 transition-all shadow-lg shadow-green-600/20 group"
                >
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Leaf className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <p className="font-extrabold text-lg">Rejoignez nos producteurs bio</p>
                    <p className="text-green-100 text-sm mt-0.5">Souscrivez votre premier contrat — légumes, pain, fromage...</p>
                  </div>
                  <ArrowRight className="w-6 h-6 text-white/70 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>

            {/* Calendar preview — next dates compact */}
            {upcomingDates.length > 1 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-extrabold text-stone-900">Calendrier</h2>
                  <Link href="/app/livraisons" className="text-sm font-bold text-green-700 hover:text-green-800 flex items-center gap-1">
                    Toutes <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {upcomingDates.slice(1, 4).map(([date, producers]: [string, string[]]) => {
                    const d = new Date(date + 'T00:00:00');
                    return (
                      <div key={date} className="bg-white rounded-2xl border border-stone-200 p-4 text-center hover:border-green-300 transition-colors">
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                          {d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}
                        </p>
                        <p className="text-2xl font-black text-stone-900 my-1">{d.getDate()}</p>
                        <p className="text-[10px] font-bold text-stone-500 uppercase">
                          {d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — Navigation & info */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-extrabold text-stone-900 mb-1">Navigation</h2>

            {[
              { href: '/app/contrats/disponibles', label: 'Souscrire un contrat', desc: 'Découvrir les producteurs', icon: Leaf, color: 'green' as const },
              { href: '/app/contrats', label: 'Mes contrats', desc: `${activeContracts.length} actif${activeContracts.length > 1 ? 's' : ''}`, icon: FileText, color: 'stone' as const },
              { href: '/app/livraisons', label: 'Mes livraisons', desc: 'Historique & à venir', icon: Truck, color: 'stone' as const },
              { href: '/app/permanences', label: 'Permanences', desc: 'Planning & inscription', icon: Clock, color: 'stone' as const },
              { href: '/app/cotisation', label: 'Cotisation', desc: pendingPayments.length > 0 ? `${pendingPayments.length} en attente` : 'À jour', icon: CreditCard, color: pendingPayments.length > 0 ? 'red' as const : 'stone' as const },
              { href: '/app/profil', label: 'Mon profil', desc: 'Informations personnelles', icon: User, color: 'stone' as const },
            ].map((item) => {
              const Icon = item.icon;
              const isGreen = item.color === 'green';
              const isRed = item.color === 'red';
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all group ${
                    isGreen
                      ? 'bg-green-700 border-green-700 hover:bg-green-800 text-white shadow-md shadow-green-700/20'
                      : isRed
                        ? 'bg-white border-red-200 hover:border-red-300'
                        : 'bg-white border-stone-200 hover:border-green-300 hover:shadow-md'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isGreen ? 'bg-white/20' : isRed ? 'bg-red-100' : 'bg-stone-100 group-hover:bg-green-100'
                  } transition-colors`}>
                    <Icon className={`w-5 h-5 ${
                      isGreen ? 'text-white' : isRed ? 'text-red-600' : 'text-stone-500 group-hover:text-green-600'
                    } transition-colors`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${isGreen ? '' : 'text-stone-900'}`}>{item.label}</p>
                    <p className={`text-xs mt-0.5 ${
                      isGreen ? 'text-green-200' : isRed ? 'text-red-600 font-semibold' : 'text-stone-500'
                    }`}>{item.desc}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 flex-shrink-0 ${
                    isGreen ? 'text-white/50' : 'text-stone-300'
                  }`} />
                </Link>
              );
            })}

            {/* Distribution reminder */}
            <div className="mt-2 p-4 bg-stone-900 rounded-2xl text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold">Tous les vendredis</p>
                  <p className="text-xs text-stone-400 mt-0.5">17h — 19h · Salle associative de Machecoul</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
