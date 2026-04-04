import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FileText, Plus } from 'lucide-react';
import type { Contract, SubscriptionStatus } from '@/types/database';

export default async function ContractsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/connexion');
  }

  const { data: contracts } = await supabase
    .from('contracts')
    .select('*, contract_models(name, producer_id, nature, status, start_date, end_date, producers(name))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false }) as any;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return { bg: 'bg-green-100', text: 'text-green-700', label: 'Actif' };
      case 'completed':
        return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Terminé' };
      case 'pending':
        return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'En attente' };
      case 'cancelled':
        return { bg: 'bg-red-100', text: 'text-red-700', label: 'Annulé' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes contrats</h1>
          <p className="text-gray-600">
            Gérez vos contrats avec les producteurs de l'AMAP
          </p>
        </div>
        <Link
          href="/app/contrats/disponibles"
          className="mt-4 md:mt-0 inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Souscrire à un contrat
        </Link>
      </div>

      {contracts && contracts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(contracts as any[]).map((contract: any) => {
            const statusColor = getStatusColor(contract.status);
            return (
              <div
                key={contract.id}
                className="bg-white rounded-lg shadow p-6 border border-gray-100 hover:border-green-200 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <FileText className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {contract.contract_models?.name || 'Contrat'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {contract.contract_models?.producers?.name || 'Producteur'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor.bg} ${statusColor.text}`}
                  >
                    {statusColor.label}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Nature:</span>
                    <span className="font-medium text-gray-900">
                      {contract.contract_models?.nature === 'subscription'
                        ? 'Abonnement'
                        : 'Flexible'}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Période:</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(contract.contract_models?.start_date || '')} -{' '}
                      {formatDate(contract.contract_models?.end_date || '')}
                    </span>
                  </div>

                  {contract.total_amount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Montant:</span>
                      <span className="font-medium text-gray-900">
                        {contract.total_amount.toFixed(2)}€
                      </span>
                    </div>
                  )}

                  {contract.signed_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Signé le:</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(contract.signed_at)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <button className="w-full px-4 py-2 border border-green-600 text-green-600 hover:bg-green-50 rounded-lg font-medium transition-colors">
                    Voir les détails
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gray-100 p-3 rounded-lg">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Aucun contrat</h2>
          <p className="text-gray-600 mb-6">
            Vous n'avez pas encore souscrit à un contrat. Explorez nos offres disponibles!
          </p>
          <Link
            href="/app/contrats/disponibles"
            className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            Découvrir les contrats disponibles
          </Link>
        </div>
      )}
    </div>
  );
}
