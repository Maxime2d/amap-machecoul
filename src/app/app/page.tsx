import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  Leaf,
  Clock,
  User,
  Truck,
  HandshakeIcon,
  ArrowRight,
  Calendar,
  Package,
  ChevronRight,
  ShoppingBag,
  Sprout,
  Sun,
  Moon,
  CloudSun,
} from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/connexion');

  const [{ data: profile }, { data: contracts }, { data: nextDeliveries }] = await Promise.all([
    supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single(),
    supabase.from('contracts').select('*, contract_models(name, nature, producer_id, producers(name))').eq('user_id', user.id),
    supabase.from('delivery_dates').select('date, contract_model_id, contract_models(name)').gte('date', new Date().toISOString().split('T')[0]).order('date').limit(5),
  ]);

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .in('contract_id', (contracts as any[])?.map((c: any) => c.id) || []);

  const activeContracts = (contracts as any[])?.filter((c: any) => c.status === 'active') || [];
  const pendingPayments = (payments as any[])?.filter((p: any) => p.status === 'pending') || [];
  const uniqueDeliveries = (nextDeliveries as any[])?.reduce((acc: any[], d: any) => {
    if (!acc.find((x: any) => x.date === d.date)) acc.push(d);
    return acc;
  }, []).slice(0, 3) || [];

  const today = new Date();
  const hour = today.getHours();
  const GreetIcon = hour < 12 ? Sun : hour < 18 ? CloudSun : Moon;
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const dateStr = today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="min-h-screen">
      {/* Hero header with strong identity */}
      <div className="bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white rounded-full" />
          <div className="absolute -bottom-32 -left-16 w-64 h-64 bg-white rounded-full" />
          <div className="absolute top-10 right-1/3 w-40 h-40 bg-white rounded-full" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <GreetIcon className="w-5 h-5 text-green-200" />
                <span className="text-green-200 text-sm font-medium capitalize">{dateStr}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {greeting}, {(profile as any)?.first_name} !
              </h1>
              <p className="text-green-100 text-base max-w-lg">
                Votre espace AMAP de Machecoul — produits bio, circuit court, solidarité paysanne.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="w-14 h-14 bg-white/15 backdrop-blur rounded-2xl flex items-center justify-center">
                <Leaf className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          {/* Inline stats in hero */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <p className="text-3xl font-bold text-white">{activeContracts.length}</p>
              <p className="text-green-100 text-xs mt-1">Contrats actifs</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <p className="text-3xl font-bold text-white">{uniqueDeliveries.length > 0 ? uniqueDeliveries.length : '—'}</p>
              <p className="text-green-100 text-xs mt-1">Prochaines livraisons</p>
            </div>
            <div className={`backdrop-blur-sm rounded-2xl p-4 border ${pendingPayments.length > 0 ? 'bg-amber-500/30 border-amber-400/30' : 'bg-white/15 border-white/10'}`}>
              <p className="text-3xl font-bold text-white">{pendingPayments.length}</p>
              <p className={`text-xs mt-1 ${pendingPayments.length > 0 ? 'text-amber-100' : 'text-green-100'}`}>
                {pendingPayments.length > 0 ? 'Paiements en attente !' : 'Paiements à jour'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alert banner */}
        {pendingPayments.length > 0 && (
          <Link
            href="/app/cotisation"
            className="flex items-center gap-3 mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl hover:bg-amber-100 transition-colors group"
          >
            <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-900">{pendingPayments.length} paiement{pendingPayments.length > 1 ? 's' : ''} en attente</p>
              <p className="text-xs text-amber-700">Régularisez votre cotisation</p>
            </div>
            <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Contracts */}
            {activeContracts.length > 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <Sprout className="w-4 h-4 text-green-600" />
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Mes contrats</h2>
                  </div>
                  <Link href="/app/contrats" className="text-xs font-semibold text-green-600 hover:text-green-700 flex items-center gap-1">
                    Tout voir <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="divide-y divide-gray-100">
                  {activeContracts.map((contract: any) => {
                    const isFlexible = contract.contract_models?.nature === 'flexible';
                    return (
                      <Link
                        key={contract.id}
                        href={`/app/contrats/${contract.id}`}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-green-50/40 transition-colors group"
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                          isFlexible ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'
                        }`}>
                          {isFlexible ? <ShoppingBag className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate group-hover:text-green-700 transition-colors">
                            {contract.contract_models?.name || 'Contrat'}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {contract.contract_models?.producers?.name}
                            {isFlexible && <span className="ml-2 inline-flex items-center px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-semibold">Commande flexible</span>}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-green-500 group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="relative bg-gradient-to-br from-green-600 to-emerald-500 rounded-2xl p-10 text-center overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full" />
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white rounded-full" />
                </div>
                <div className="relative">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Leaf className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Bienvenue à l'AMAP !</h3>
                  <p className="text-green-100 text-sm mb-6 max-w-sm mx-auto">
                    Soutenez nos producteurs bio locaux en souscrivant un contrat. Légumes, pain, fromage, volailles...
                  </p>
                  <Link
                    href="/app/contrats/disponibles"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-green-700 font-bold rounded-xl hover:bg-green-50 transition-colors shadow-lg"
                  >
                    Découvrir les contrats
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {/* Upcoming deliveries */}
            {uniqueDeliveries.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Prochaines livraisons</h2>
                  </div>
                  <Link href="/app/livraisons" className="text-xs font-semibold text-green-600 hover:text-green-700 flex items-center gap-1">
                    Tout voir <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="divide-y divide-gray-100">
                  {uniqueDeliveries.map((delivery: any, i: number) => {
                    const date = new Date(delivery.date + 'T00:00:00');
                    const dayNum = date.getDate();
                    const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
                    const isNext = i === 0;
                    return (
                      <div key={delivery.date} className="flex items-center gap-4 px-6 py-4">
                        <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 ${
                          isNext ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <span className="text-[10px] font-bold uppercase leading-none mt-0.5">{dayName}</span>
                          <span className="text-xl font-black leading-none">{dayNum}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 capitalize">
                            {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">Vendredi 17h — 19h, salle associative</p>
                        </div>
                        {isNext && (
                          <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-full animate-pulse">
                            Prochaine
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Actions rapides</h3>
              </div>
              <div className="p-3 space-y-1">
                {[
                  { href: '/app/contrats/disponibles', label: 'Souscrire un contrat', icon: HandshakeIcon, bg: 'bg-green-600', text: 'text-white' },
                  { href: '/app/permanences', label: 'Permanences', icon: Clock, bg: 'bg-purple-100', text: 'text-purple-700' },
                  { href: '/app/cotisation', label: 'Mes paiements', icon: AlertCircle, bg: 'bg-amber-100', text: 'text-amber-700' },
                  { href: '/app/profil', label: 'Mon profil', icon: User, bg: 'bg-gray-100', text: 'text-gray-700' },
                ].map((action, idx) => {
                  const Icon = action.icon;
                  const isPrimary = idx === 0;
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                        isPrimary
                          ? 'bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-600/20'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isPrimary ? 'bg-white/20' : action.bg
                      }`}>
                        <Icon className={`w-4 h-4 ${isPrimary ? 'text-white' : action.text}`} />
                      </div>
                      <span className={`text-sm font-semibold flex-1 ${isPrimary ? '' : 'text-gray-700'}`}>{action.label}</span>
                      <ChevronRight className={`w-4 h-4 ${isPrimary ? 'text-white/60' : 'text-gray-300'}`} />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Distribution info */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-amber-900">Distribution</h3>
              </div>
              <p className="text-amber-800 text-sm font-semibold mb-1">Chaque vendredi</p>
              <p className="text-amber-700 text-xs leading-relaxed">
                De 17h à 19h — Salle associative de Machecoul. Pensez à vos sacs et cabas !
              </p>
            </div>

            {/* AMAP spirit card */}
            <div className="bg-gradient-to-br from-green-800 to-green-900 rounded-2xl p-5 text-white relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-green-700 rounded-full opacity-50" />
              <div className="relative">
                <Leaf className="w-6 h-6 text-green-300 mb-3" />
                <h3 className="text-sm font-bold mb-1">L'esprit AMAP</h3>
                <p className="text-green-200 text-xs leading-relaxed">
                  En soutenant vos producteurs, vous participez à une agriculture durable et solidaire. Merci !
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
