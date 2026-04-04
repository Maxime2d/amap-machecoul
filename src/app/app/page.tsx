import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, AlertCircle, TrendingUp, ArrowRight } from 'lucide-react';
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

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bienvenue, {(profile as any)?.first_name}!
        </h1>
        <p className="text-gray-600">
          Gérez vos contrats et vos adhésions à l'AMAP de Machecoul
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Contrats actifs</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {activeContracts.length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Paiements en attente</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {pendingPayments.length}
              </p>
            </div>
            <div className="bg-amber-100 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Votre cotisation</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">À jour</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Mes contrats</h2>
          {activeContracts.length > 0 ? (
            <>
              <div className="space-y-3 mb-4">
                {activeContracts.slice(0, 3).map((contract) => (
                  <div
                    key={contract.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {contract.contract_models?.name || 'Contrat'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {contract.contract_models?.producers?.name || 'Producteur'}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      Actif
                    </span>
                  </div>
                ))}
              </div>
              <Link
                href="/app/contrats"
                className="flex items-center justify-center gap-2 w-full px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg font-medium transition-colors"
              >
                Voir tous les contrats
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          ) : (
            <>
              <p className="text-gray-600 text-sm mb-4">
                Vous n'avez pas encore de contrat actif.
              </p>
              <Link
                href="/app/contrats/disponibles"
                className="block w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-center"
              >
                Souscrire à un contrat
              </Link>
            </>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Actions rapides</h2>
          <div className="space-y-3">
            <Link
              href="/app/contrats/disponibles"
              className="block w-full px-4 py-2 border border-green-600 text-green-600 hover:bg-green-50 rounded-lg font-medium transition-colors text-center"
            >
              Souscrire à un contrat
            </Link>
            <Link
              href="/app/permanences"
              className="block w-full px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors text-center"
            >
              S'inscrire à une permanence
            </Link>
            <Link
              href="/app/profil"
              className="block w-full px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors text-center"
            >
              Mettre à jour mon profil
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Activité récente</h2>
        <p className="text-gray-600 text-sm">
          Aucune activité récente pour le moment.
        </p>
      </div>
    </div>
  );
}
