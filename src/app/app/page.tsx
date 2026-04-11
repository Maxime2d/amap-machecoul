import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Leaf,
  Clock,
  ArrowRight,
  Calendar,
  Package,
  ChevronRight,
  ShoppingBag,
  MapPin,
  CreditCard,
  Truck,
  FileText,
  Users,
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
  const upcomingDates = Array.from(deliveryMap.entries()).slice(0, 5);
  const nextDate = upcomingDates[0];

  const firstName = (profile as any)?.first_name || 'Adherent';
  const pendingTotal = pendingPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

  // Days until next delivery
  let daysUntil = -1;
  if (nextDate) {
    const diff = new Date(nextDate[0] + 'T00:00:00').getTime() - new Date().setHours(0, 0, 0, 0);
    daysUntil = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  const formatDayLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-10">

        {/* Greeting */}
        <div className="mb-6">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">Espace adherent</p>
          <h1 className="text-2xl font-bold text-stone-900 mt-1">Salut {firstName} !</h1>
        </div>

        {/* Next delivery — compact highlight */}
        {nextDate ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-green-700 uppercase tracking-wide">
                    Prochaine livraison
                  </p>
                  <p className="text-stone-900 font-bold capitalize">
                    {formatDayLabel(nextDate[0])}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 17h — 19h
                    <span className="mx-1">·</span>
                    <MapPin className="w-3 h-3" /> Pepinieres Breneliere, Machecoul
                  </p>
                </div>
              </div>
              <span className="text-sm font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-full flex-shrink-0 ml-3">
                {daysUntil === 0
                  ? "Aujourd'hui !"
                  : daysUntil === 1
                    ? 'Demain'
                    : `J-${daysUntil}`}
              </span>
            </div>

            {/* Producers */}
            {nextDate[1].length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3 pl-13">
                {nextDate[1].map((producer: string) => (
                  <span
                    key={producer}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-full text-xs font-medium text-green-800 border border-green-200"
                  >
                    <Leaf className="w-3 h-3 text-green-500" />
                    {producer}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-stone-200 rounded-xl p-6 text-center mb-4">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-stone-100 mb-2">
              <Calendar className="w-5 h-5 text-stone-400" />
            </div>
            <p className="font-semibold text-stone-700">Pas de livraison prevue</p>
            <p className="text-sm text-stone-500 mt-0.5">Souscrivez un contrat pour commencer.</p>
          </div>
        )}

        {/* Pending payments alert */}
        {pendingPayments.length > 0 && (
          <Link
            href="/app/cotisation"
            className="flex items-center gap-3 mb-4 p-4 bg-red-50 border border-red-200 rounded-xl hover:border-red-300 transition-colors group"
          >
            <div className="w-9 h-9 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-900">
                {pendingPayments.length} paiement{pendingPayments.length > 1 ? 's' : ''} en attente — {pendingTotal.toFixed(0)} &euro;
              </p>
              <p className="text-xs text-red-700">Regulariser votre situation</p>
            </div>
            <ArrowRight className="w-4 h-4 text-red-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </Link>
        )}

        {/* Mes contrats */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide">Mes contrats</h2>
            <Link
              href="/app/contrats"
              className="text-xs font-semibold text-green-700 hover:text-green-800 flex items-center gap-0.5"
            >
              Tous <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {activeContracts.length > 0 ? (
            <div className="space-y-2">
              {activeContracts.map((contract: any) => {
                const isFlexible = contract.contract_models?.nature === 'flexible';
                return (
                  <Link
                    key={contract.id}
                    href={`/app/contrats/${contract.id}`}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-stone-200 hover:border-green-300 transition-colors group"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isFlexible
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {isFlexible ? <ShoppingBag className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-900 truncate group-hover:text-green-700 transition-colors">
                        {contract.contract_models?.name}
                      </p>
                      <p className="text-xs text-stone-500 truncate">
                        {contract.contract_models?.producers?.name}
                        {isFlexible && (
                          <span className="ml-1.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold uppercase">
                            Flexible
                          </span>
                        )}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-green-500 transition-colors flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          ) : (
            <Link
              href="/app/contrats/disponibles"
              className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-dashed border-green-300 hover:border-green-400 hover:bg-green-50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Leaf className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-green-800">Rejoignez nos producteurs bio</p>
                <p className="text-xs text-stone-500">Souscrivez votre premier contrat</p>
              </div>
              <ArrowRight className="w-4 h-4 text-green-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </Link>
          )}
        </div>

        {/* Prochaines dates */}
        {upcomingDates.length > 1 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide">
                Prochaines dates
              </h2>
              <Link
                href="/app/livraisons"
                className="text-xs font-semibold text-green-700 hover:text-green-800 flex items-center gap-0.5"
              >
                Toutes <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2">
              {upcomingDates.slice(1, 5).map(([date, producers]: [string, string[]]) => {
                const d = new Date(date + 'T00:00:00');
                return (
                  <div
                    key={date}
                    className="flex items-center gap-3 bg-white rounded-xl border border-stone-200 p-3"
                  >
                    <div className="w-11 h-11 rounded-lg bg-stone-100 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-stone-400 uppercase leading-none">
                        {d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}
                      </span>
                      <span className="text-lg font-bold text-stone-900 leading-tight">
                        {d.getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 capitalize">
                        {d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                      </p>
                      {producers.length > 0 && (
                        <p className="text-xs text-stone-500 truncate">{producers.join(', ')}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">
            Acces rapide
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/app/permanences"
              className="flex items-center gap-3 p-3 bg-white rounded-xl border border-stone-200 hover:border-green-300 transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-green-700" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-900 group-hover:text-green-700 transition-colors">
                  Permanences
                </p>
                <p className="text-xs text-stone-500">S&apos;inscrire</p>
              </div>
            </Link>
            <Link
              href="/app/cotisation"
              className="flex items-center gap-3 p-3 bg-white rounded-xl border border-stone-200 hover:border-green-300 transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-4 h-4 text-green-700" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-900 group-hover:text-green-700 transition-colors">
                  Cotisation
                </p>
                <p className="text-xs text-stone-500">Paiements</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Distribution info — light green, not dark */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900">Tous les vendredis</p>
              <p className="text-xs text-stone-500 mt-0.5">
                17h — 19h · Pepinieres Breneliere, Machecoul
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
