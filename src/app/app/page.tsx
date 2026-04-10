import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
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
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const dateStr = today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span className="capitalize">{dateStr}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {greeting}, {(profile as any)?.first_name}
          </h1>
          <p className="text-gray-500 mt-1">Voici un résumé de votre espace AMAP.</p>
        </div>

        {/* Alert banner if pending payments */}
        {pendingPayments.length > 0 && (
          <Link
            href="/app/cotisation"
            className="flex items-center gap-3 mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl hover:bg-amber-100 transition-colors group"
          >
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900">{pendingPayments.length} paiement{pendingPayments.length > 1 ? 's' : ''} en attente</p>
              <p className="text-xs text-amber-700">Cliquez pour consulter vos échéances</p>
            </div>
            <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <Leaf className="w-5 h-5 text-green-600" />
              </div>
              {activeContracts.length > 0 && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
            </div>
            <p className="text-2xl font-bold text-gray-900">{activeContracts.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Contrats actifs</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{uniqueDeliveries.length > 0 ? uniqueDeliveries.length : '—'}</p>
            <p className="text-xs text-gray-500 mt-0.5">Prochaines livraisons</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-500" />
              </div>
              {pendingPayments.length > 0 && <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />}
            </div>
            <p className="text-2xl font-bold text-gray-900">{pendingPayments.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Paiements en attente</p>
          </div>

          <Link href="/app/permanences" className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </div>
            <p className="text-sm font-semibold text-gray-900">Permanences</p>
            <p className="text-xs text-gray-500 mt-0.5">Voir le planning</p>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Contracts */}
            {activeContracts.length > 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                  <h2 className="text-base font-semibold text-gray-900">Mes contrats</h2>
                  <Link href="/app/contrats" className="text-xs font-medium text-green-600 hover:text-green-700 flex items-center gap-1">
                    Tout voir <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="divide-y divide-gray-50">
                  {activeContracts.map((contract: any) => {
                    const isFlexible = contract.contract_models?.nature === 'flexible';
                    return (
                      <Link
                        key={contract.id}
                        href={`/app/contrats/${contract.id}`}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors group"
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isFlexible ? 'bg-indigo-50' : 'bg-green-50'
                        }`}>
                          {isFlexible ? (
                            <ShoppingBag className="w-5 h-5 text-indigo-500" />
                          ) : (
                            <Package className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-green-700 transition-colors">
                            {contract.contract_models?.name || 'Contrat'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {contract.contract_models?.producers?.name}
                            {isFlexible && <span className="ml-2 text-indigo-500">Commande flexible</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="hidden sm:inline-flex px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg">
                            Actif
                          </span>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-green-500 transition-colors" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Leaf className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun contrat actif</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                  Commencez votre aventure à l'AMAP en souscrivant un contrat avec nos producteurs bio.
                </p>
                <Link
                  href="/app/contrats/disponibles"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  Découvrir les contrats
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* Upcoming deliveries */}
            {uniqueDeliveries.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                  <h2 className="text-base font-semibold text-gray-900">Prochaines livraisons</h2>
                  <Link href="/app/livraisons" className="text-xs font-medium text-green-600 hover:text-green-700 flex items-center gap-1">
                    Tout voir <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="divide-y divide-gray-50">
                  {uniqueDeliveries.map((delivery: any, i: number) => {
                    const date = new Date(delivery.date + 'T00:00:00');
                    const dayNum = date.getDate();
                    const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
                    const month = date.toLocaleDateString('fr-FR', { month: 'short' });
                    const isNext = i === 0;
                    return (
                      <div key={delivery.date} className="flex items-center gap-4 px-6 py-4">
                        <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                          isNext ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <span className="text-[10px] font-medium uppercase leading-none mt-0.5">{dayName}</span>
                          <span className="text-lg font-bold leading-none">{dayNum}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </p>
                          <p className="text-xs text-gray-500">17h00 — 19h00</p>
                        </div>
                        {isNext && (
                          <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg">
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
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Actions rapides</h3>
              <div className="space-y-2">
                <Link
                  href="/app/contrats/disponibles"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-green-50 transition-colors group"
                >
                  <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
                    <HandshakeIcon className="w-4.5 h-4.5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Souscrire un contrat</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
                <Link
                  href="/app/permanences"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50 transition-colors group"
                >
                  <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                    <Clock className="w-4.5 h-4.5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">S'inscrire aux permanences</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
                <Link
                  href="/app/cotisation"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50 transition-colors group"
                >
                  <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                    <AlertCircle className="w-4.5 h-4.5 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Mes paiements</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
                <Link
                  href="/app/profil"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                    <User className="w-4.5 h-4.5 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Mon profil</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </div>
            </div>

            {/* Info card */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 p-5">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-3 shadow-sm">
                <Leaf className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Distribution chaque vendredi</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                De 17h à 19h à la salle associative de Machecoul. N'oubliez pas vos sacs !
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
