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
} from 'lucide-react';
import type { Contract } from '@/types/database';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/connexion');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', user.id)
    .single();

  const { data: contracts } = await supabase
    .from('contracts')
    .select('*, contract_models(name, producer_id, producers(name))')
    .eq('user_id', user.id) as any;

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .in('contract_id', (contracts as any[])?.map((c: any) => c.id) || []) as any;

  const activeContracts = (contracts as any[])?.filter((c: any) => c.status === 'active') || [];
  const pendingPayments = (payments as any[])?.filter((p: any) => p.status === 'pending') || [];

  // Format current date in French
  const today = new Date();
  const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const formattedDate = dateFormatter.format(today);
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Hero Section with Welcome */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-500 opacity-10 rounded-full -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-green-500 opacity-10 rounded-full -ml-36 -mb-36" />

        <div className="relative z-10 px-6 md:px-8 py-12 md:py-16 max-w-6xl mx-auto">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                Bienvenue, {(profile as any)?.first_name}! 🌱
              </h1>
              <p className="text-green-50 text-lg">
                {capitalizedDate}
              </p>
              <p className="text-green-100 mt-3">
                Gérez vos contrats et vos adhésions à l'AMAP de Machecoul
              </p>
            </div>
            <div className="hidden md:block text-8xl opacity-20">🌿</div>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-8 py-12 max-w-6xl mx-auto">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Active Contracts */}
          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-slate-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Contrats actifs</p>
                <p className="text-4xl font-bold text-gray-900 mt-3">
                  {activeContracts.length}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-100 to-green-50 p-3 rounded-lg">
                <Leaf className="w-6 h-6 text-green-600" />
              </div>
            </div>
            {activeContracts.length > 0 && (
              <p className="text-xs text-green-600 mt-4 font-medium">
                ✓ Contrats en cours
              </p>
            )}
          </div>

          {/* Pending Payments */}
          <div className={`rounded-xl shadow-sm hover:shadow-md transition-shadow border p-6 ${
            pendingPayments.length > 0
              ? 'bg-white border-amber-200'
              : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Paiements en attente</p>
                <p className="text-4xl font-bold text-gray-900 mt-3">
                  {pendingPayments.length}
                </p>
              </div>
              <div className="bg-gradient-to-br from-amber-100 to-amber-50 p-3 rounded-lg">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            {pendingPayments.length === 0 && (
              <p className="text-xs text-green-600 mt-4 font-medium">
                ✓ Tous à jour
              </p>
            )}
          </div>

          {/* Next Delivery */}
          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-slate-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Prochaine livraison</p>
                <p className="text-2xl font-bold text-gray-900 mt-3">
                  {activeContracts.length > 0 ? (
                    <Link href="/app/livraisons" className="text-blue-600 hover:text-blue-700 underline text-sm">
                      Voir livraisons
                    </Link>
                  ) : (
                    'Aucune'
                  )}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-3 rounded-lg">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Actions rapides</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Subscribe to Contract */}
            <Link
              href="/app/contrats/disponibles"
              className="bg-white rounded-xl shadow-sm hover:shadow-md hover:border-green-300 transition-all border border-slate-200 p-6 group"
            >
              <div className="bg-gradient-to-br from-green-100 to-green-50 p-3 rounded-lg w-fit mb-4 group-hover:from-green-200 transition-colors">
                <HandshakeIcon className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Souscrire</h3>
              <p className="text-sm text-slate-600">Un contrat</p>
            </Link>

            {/* Shifts */}
            <Link
              href="/app/permanences"
              className="bg-white rounded-xl shadow-sm hover:shadow-md hover:border-green-300 transition-all border border-slate-200 p-6 group"
            >
              <div className="bg-gradient-to-br from-purple-100 to-purple-50 p-3 rounded-lg w-fit mb-4 group-hover:from-purple-200 transition-colors">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Permanences</h3>
              <p className="text-sm text-slate-600">M'inscrire</p>
            </Link>

            {/* Deliveries */}
            <Link
              href="/app/livraisons"
              className="bg-white rounded-xl shadow-sm hover:shadow-md hover:border-green-300 transition-all border border-slate-200 p-6 group"
            >
              <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-3 rounded-lg w-fit mb-4 group-hover:from-blue-200 transition-colors">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Livraisons</h3>
              <p className="text-sm text-slate-600">Mes paniers</p>
            </Link>

            {/* Profile */}
            <Link
              href="/app/profil"
              className="bg-white rounded-xl shadow-sm hover:shadow-md hover:border-green-300 transition-all border border-slate-200 p-6 group"
            >
              <div className="bg-gradient-to-br from-slate-100 to-slate-50 p-3 rounded-lg w-fit mb-4 group-hover:from-slate-200 transition-colors">
                <User className="w-5 h-5 text-slate-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Mon profil</h3>
              <p className="text-sm text-slate-600">Mes infos</p>
            </Link>
          </div>
        </div>

        {/* Active Contracts Section */}
        {activeContracts.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Contrats actifs</h2>
              <Link
                href="/app/contrats"
                className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center gap-1"
              >
                Tous les contrats
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeContracts.map((contract) => (
                <Link
                  key={contract.id}
                  href={`/app/contrats/${contract.id}`}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md hover:border-green-300 transition-all border border-slate-200 p-6 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                        {contract.contract_models?.name || 'Contrat'}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {contract.contract_models?.producers?.name || 'Producteur'}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full whitespace-nowrap">
                      Actif
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <span className="text-xs text-slate-500">Voir les détails</span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-green-600 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {activeContracts.length === 0 && (
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-dashed border-green-300 p-12 text-center mb-12">
            <div className="text-6xl mb-4">🌾</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Aucun contrat actif pour le moment
            </h3>
            <p className="text-slate-600 mb-6">
              Commencez votre aventure avec l'AMAP en souscrivant à un contrat
            </p>
            <Link
              href="/app/contrats/disponibles"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
            >
              Découvrir nos contrats
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Benefits Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-8">
            <Calendar className="w-8 h-8 text-blue-600 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Restez informé</h3>
            <p className="text-sm text-slate-700">
              Consultez le calendrier des livraisons et des permanences pour ne rien manquer.
            </p>
          </div>

          {/* Support Card */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200 p-8">
            <Leaf className="w-8 h-8 text-amber-600 mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Bienvenue à l'AMAP</h3>
            <p className="text-sm text-slate-700">
              Nous sommes heureux de vous avoir. Explorez votre tableau de bord pour gérer votre adhésion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}