import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PackageOpen, ArrowRight } from 'lucide-react';
import type { ContractModel } from '@/types/database';

export default async function AvailableContractsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/connexion');
  }

  const { data: contractModels } = await supabase
    .from('contract_models')
    .select('*, producers(name, short_bio), products(id)')
    .eq('status', 'open')
    .gte('enroll_end', new Date().toISOString()) as any;

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
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Contrats disponibles
        </h1>
        <p className="text-gray-600 mb-8">
          Découvrez les offres actuelles et souscrivez à un contrat
        </p>
      </div>

      {contractModels && contractModels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(contractModels as any[]).map((model: any) => (
            <div
              key={model.id}
              className="bg-white rounded-lg shadow p-6 border border-gray-100 hover:border-green-200 transition-colors"
            >
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {model.name}
                </h3>
                <p className="text-sm text-green-600 font-medium">
                  {model.producers?.name || 'Producteur'}
                </p>
              </div>

              {model.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {model.description}
                </p>
              )}

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Nature:</span>
                  <span className="font-medium text-gray-900">
                    {model.nature === 'subscription' ? 'Abonnement' : 'Flexible'}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Période:</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(model.start_date)} à {formatDate(model.end_date)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Produits:</span>
                  <span className="font-medium text-gray-900">
                    {model.products ? model.products.length : 0} produits
                  </span>
                </div>

                {model.enroll_end && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Inscription jusqu'au:</span>
                    <span className="font-medium text-amber-600">
                      {formatDate(model.enroll_end)}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button className="px-4 py-2 border border-green-600 text-green-600 hover:bg-green-50 rounded-lg font-medium transition-colors text-sm">
                  Plus d'infos
                </button>
                <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm">
                  Souscrire
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gray-100 p-3 rounded-lg">
              <PackageOpen className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Aucun contrat disponible
          </h2>
          <p className="text-gray-600 mb-6">
            Il n'y a actuellement aucune offre de contrat ouverte aux inscriptions.
            Revenez bientôt!
          </p>
          <Link
            href="/app"
            className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            Retour au tableau de bord
          </Link>
        </div>
      )}
    </div>
  );
}
