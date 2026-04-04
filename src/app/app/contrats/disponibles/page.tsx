import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  ArrowLeft,
  ShoppingBag,
  Calendar,
  Package,
  Users,
  Check,
} from 'lucide-react';

export default async function AvailableContractsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/connexion');
  }

  // Fetch open contract models with all related data
  const { data: contractModels } = await supabase
    .from('contract_models')
    .select(`
      id,
      name,
      description,
      nature,
      start_date,
      end_date,
      enroll_end,
      producers (
        id,
        name,
        slug
      ),
      model_products (
        id,
        price,
        products (
          id,
          name,
          unit_type,
          packaging
        )
      ),
      model_dates (
        delivery_date
      )
    `)
    .eq('status', 'open')
    .order('start_date', { ascending: true });
  // Fetch user's existing contracts
  const { data: userContracts } = await supabase
    .from('contracts')
    .select('model_id')
    .eq('user_id', user.id);

  const userContractModelIds = new Set(
    userContracts?.map((c) => c.model_id) || []
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const calculateTotalCost = (
    modelProducts: any[],
    deliveryCount: number
  ): number => {
    if (!modelProducts || modelProducts.length === 0) return 0;
    const sum = modelProducts.reduce((total, mp) => total + (mp.price || 0), 0);
    return sum * deliveryCount;
  };

  const hasOpenContracts = contractModels && contractModels.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-6 md:py-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/app/contrats"
              className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour
            </Link>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Contrats disponibles
          </h1>
          <p className="text-gray-600">
            Découvrez les offres actuelles et souscrivez à un contrat
          </p>
        </div>
      </div>
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-8 md:py-12">
        {hasOpenContracts ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(contractModels as any[]).map((model: any) => {
              const deliveryCount = model.model_dates?.length || 0;
              const totalCost = calculateTotalCost(
                model.model_products || [],
                deliveryCount
              );
              const isAlreadySubscribed = userContractModelIds.has(model.id);

              return (
                <div
                  key={model.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100"
                >
                  {/* Card Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {model.name}
                        </h3>
                        <p className="text-sm font-medium text-green-600">
                          {model.producers?.name || 'Producteur'}
                        </p>
                      </div>
                      {isAlreadySubscribed && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">
                            Inscrit
                          </span>
                        </div>
                      )}
                    </div>

                    {model.description && (
                      <p className="text-gray-600 text-sm">
                        {model.description}
                      </p>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-6 space-y-6">
                    {/* Date Range */}
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Période du contrat
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDate(model.start_date)} à{' '}
                          {formatDate(model.end_date)}
                        </p>
                      </div>
                    </div>

                    {/* Delivery Dates Count */}
                    <div className="flex items-start gap-3">
                      <ShoppingBag className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Livraisons
                        </p>
                        <p className="text-sm text-gray-600">
                          {deliveryCount} livraison
                          {deliveryCount > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>                    {/* Products */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Package className="w-5 h-5 text-green-600" />
                        <p className="text-sm font-medium text-gray-900">
                          Produits inclus
                        </p>
                      </div>
                      <div className="space-y-2 ml-8">
                        {model.model_products && model.model_products.length > 0 ? (
                          model.model_products.map(
                            (modelProduct: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-sm"
                              >
                                <span className="text-gray-700">
                                  {modelProduct.products?.name || 'Produit'}
                                  {modelProduct.products?.unit_type && (
                                    <span className="text-gray-500 text-xs ml-1">
                                      ({modelProduct.products.unit_type})
                                    </span>
                                  )}
                                </span>
                                <span className="font-medium text-gray-900">
                                  {modelProduct.price.toFixed(2)}€
                                </span>
                              </div>
                            )
                          )
                        ) : (
                          <p className="text-sm text-gray-500 italic">
                            Aucun produit spécifié
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Total Cost */}
                    {deliveryCount > 0 && model.model_products?.length > 0 && (
                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Coût estimé (total pour {deliveryCount} livraison
                            {deliveryCount > 1 ? 's' : ''})
                          </span>
                          <span className="text-2xl font-bold text-green-600">
                            {totalCost.toFixed(2)}€
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Enrollment Deadline */}
                    {model.enroll_end && (
                      <div className="pt-4 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                          Inscription jusqu'au
                        </p>
                        <p className="text-sm font-semibold text-amber-600 mt-1">
                          {formatDate(model.enroll_end)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Card Footer / CTA */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-lg">
                    {isAlreadySubscribed ? (
                      <div className="text-center py-2">
                        <p className="text-sm font-medium text-gray-600">
                          Vous êtes déjà inscrit à ce contrat
                        </p>
                      </div>
                    ) : (
                      <Link
                        href={`/app/contrats/souscrire/${model.id}`}
                        className="inline-block w-full text-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                      >
                        Souscrire
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-lg shadow-md border border-gray-100 p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-gray-100 p-4 rounded-full">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Aucun contrat disponible
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Il n'y a actuellement aucune offre de contrat ouverte aux
              inscriptions. Revenez bientôt pour découvrir les nouvelles offres!
            </p>
            <Link
              href="/app/contrats"
              className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              Retour à mes contrats
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
