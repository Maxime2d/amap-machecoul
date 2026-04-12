'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  Calendar,
  Package,
  Check,
  X,
  AlertTriangle,
  ArrowLeft,
  Zap,
  ShoppingCart,
} from 'lucide-react';

const unitTypeLabels: Record<string, string> = {
  unit: 'unité',
  weight: 'kg',
  volume: 'L',
  bundle: 'lot',
};

interface Product {
  id: string;
  name: string;
  unit_type: string;
}

interface ContractItem {
  id: string;
  product_id: string;
  delivery_date: string;
  quantity: number;
  is_joker: boolean;
  products: Product;
}

interface Producer {
  id: string;
  name: string;
}

interface ContractModel {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  nature: string;
  joker_config: {
    max_jokers: number;
    min_days_before: number;
  } | null;
  producer_id: string;
  producers: Producer;
}

interface Contract {
  id: string;
  status: string;
  total_amount: number;
  signed_at: string;
  contract_models: ContractModel;
  contract_items: ContractItem[];
}

interface DeliveryGroup {
  delivery_date: string;
  items: ContractItem[];
  is_cancelled: boolean;
  cancel_reason: string | null;
}

export default function ContractDetailPage() {
  const params = useParams();
  const contractId = params.contractId as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [deliveryGroups, setDeliveryGroups] = useState<DeliveryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingJokerId, setUpdatingJokerId] = useState<string | null>(null);

  const supabase = createClient();

  const fetchContractData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch contract with all related data
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select(`
          id,
          status,
          total_amount,
          signed_at,
          contract_models (
            id,
            name,
            start_date,
            end_date,
            nature,
            joker_config,
            producer_id,
            producers ( id, name )
          ),
          contract_items (
            id,
            product_id,
            delivery_date,
            quantity,
            is_joker,
            products ( id, name, unit_type )
          )
        `)
        .eq('id', contractId)
        .single();

      if (contractError || !contractData) {
        throw new Error('Contrat non trouvé');
      }

      setContract(contractData as Contract);

      // Fetch model_dates to check for cancellations
      const { data: modelDates, error: datesError } = await supabase
        .from('model_dates')
        .select('delivery_date, is_cancelled, cancel_reason')
        .eq('model_id', contractData.contract_models.id);

      if (!datesError && modelDates) {
        // Group contract_items by delivery_date
        const groupedByDate = new Map<string, ContractItem[]>();
        for (const item of contractData.contract_items || []) {
          const date = item.delivery_date;
          if (!groupedByDate.has(date)) {
            groupedByDate.set(date, []);
          }
          groupedByDate.get(date)!.push(item);
        }

        // Build delivery groups with cancellation info
        const groups: DeliveryGroup[] = [];
        for (const [date, items] of groupedByDate.entries()) {
          const modelDate = modelDates.find(
            (md) => md.delivery_date === date
          );
          groups.push({
            delivery_date: date,
            items,
            is_cancelled: modelDate?.is_cancelled || false,
            cancel_reason: modelDate?.cancel_reason || null,
          });
        }

        // Sort by date ascending
        groups.sort(
          (a, b) =>
            new Date(a.delivery_date).getTime() -
            new Date(b.delivery_date).getTime()
        );

        setDeliveryGroups(groups);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      console.error('Error fetching contract:', err);
    } finally {
      setLoading(false);
    }
  }, [contractId, supabase]);

  useEffect(() => {
    fetchContractData();
  }, [fetchContractData]);

  const toggleJoker = useCallback(
    async (deliveryDate: string, shouldBeJoker: boolean) => {
      if (!contract) return;

      setUpdatingJokerId(deliveryDate);
      try {
        // Get all items for this delivery date
        const itemsToUpdate = contract.contract_items.filter(
          (item) => item.delivery_date === deliveryDate
        );

        // Update all items for this delivery date
        for (const item of itemsToUpdate) {
          const { error } = await supabase
            .from('contract_items')
            .update({ is_joker: shouldBeJoker })
            .eq('id', item.id);

          if (error) {
            throw error;
          }
        }

        // Refresh the contract data
        await fetchContractData();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Erreur lors de la mise à jour du joker'
        );
        console.error('Error toggling joker:', err);
      } finally {
        setUpdatingJokerId(null);
      }
    },
    [contract, supabase, fetchContractData]
  );

  const getDeliveryStatus = (deliveryDate: string): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deliveryDateObj = new Date(deliveryDate);
    deliveryDateObj.setHours(0, 0, 0, 0);

    const group = deliveryGroups.find(
      (g) => g.delivery_date === deliveryDate
    );

    if (group?.is_cancelled) {
      return 'cancelled';
    }

    const isJoker = group?.items.some((item) => item.is_joker) || false;
    if (isJoker) {
      return 'joker';
    }

    if (deliveryDateObj < today) {
      return 'delivered';
    }

    return 'upcoming';
  };

  const canSetJoker = (deliveryDate: string): boolean => {
    if (!contract?.contract_models?.joker_config) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deliveryDateObj = new Date(deliveryDate);
    deliveryDateObj.setHours(0, 0, 0, 0);

    // Must be future date
    if (deliveryDateObj <= today) {
      return false;
    }

    // Must be at least min_days_before days in the future
    const minDate = new Date(today);
    minDate.setDate(
      minDate.getDate() + contract.contract_models.joker_config.min_days_before
    );

    return deliveryDateObj >= minDate;
  };

  const getJokerUsageCount = (): number => {
    if (!contract) return 0;
    const jokerDates = new Set<string>();
    for (const item of contract.contract_items) {
      if (item.is_joker) {
        jokerDates.add(item.delivery_date);
      }
    }
    return jokerDates.size;
  };

  const getMaxJokers = (): number => {
    return contract?.contract_models?.joker_config?.max_jokers || 0;
  };

  const jokerUsed = getJokerUsageCount();
  const maxJokers = getMaxJokers();
  const jokerPercentage = maxJokers > 0 ? (jokerUsed / maxJokers) * 100 : 0;

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-6xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="p-6 md:p-8 max-w-6xl">
        <Link
          href="/app/contrats"
          className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à mes contrats
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-800 font-semibold">Erreur</h2>
          <p className="text-red-700 mt-2">
            {error || 'Contrat non trouvé'}
          </p>
        </div>
      </div>
    );
  }

  const isFlexibleContract = contract.contract_models.nature === 'flexible';

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      {/* Back Link */}
      <Link
        href="/app/contrats"
        className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à mes contrats
      </Link>

      {/* Contract Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {contract.contract_models.name}
            </h1>
            <p className="text-gray-600">
              Producteur: {contract.contract_models.producers.name}
            </p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                contract.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : contract.status === 'completed'
                    ? 'bg-blue-100 text-blue-700'
                    : contract.status === 'pending'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
              }`}
            >
              {contract.status === 'active'
                ? 'Actif'
                : contract.status === 'completed'
                  ? 'Terminé'
                  : contract.status === 'pending'
                    ? 'En attente'
                    : 'Annulé'}
            </span>
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                isFlexibleContract
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {isFlexibleContract ? 'Commande flexible' : 'Abonnement'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-600" />
            <div>
              <p className="text-gray-600">Période</p>
              <p className="font-semibold text-gray-900">
                {formatDate(contract.contract_models.start_date)} -{' '}
                {formatDate(contract.contract_models.end_date)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-600" />
            <div>
              <p className="text-gray-600">Nature</p>
              <p className="font-semibold text-gray-900">
                {isFlexibleContract ? 'Commande flexible' : 'Abonnement'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-gray-600" />
            <div>
              <p className="text-gray-600">Signé le</p>
              <p className="font-semibold text-gray-900">
                {formatDate(contract.signed_at)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Commander Button for Flexible Contracts */}
      {isFlexibleContract && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow p-6 mb-6 border border-green-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                Prêt à commander?
              </h2>
              <p className="text-gray-600 text-sm">
                Sélectionnez vos produits pour cette période de contrat flexible.
              </p>
            </div>
            <Link
              href={`/app/contrats/${contractId}/commander`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white hover:bg-green-700 rounded-lg font-semibold transition-colors shadow-md"
            >
              <ShoppingCart className="w-5 h-5" />
              Commander
            </Link>
          </div>
        </div>
      )}

      {/* Joker Section - Only for Subscription Contracts */}
      {!isFlexibleContract && contract.contract_models.joker_config && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg shadow p-6 mb-6 border border-amber-200">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-6 h-6 text-amber-600" />
            <h2 className="text-xl font-bold text-gray-900">Jokers disponibles</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">
                Jokers utilisés: {jokerUsed} / {maxJokers}
              </span>
              <span className="text-sm text-gray-600">
                {jokerUsed === maxJokers && 'Tous les jokers utilisés'}
                {jokerUsed < maxJokers &&
                  `${maxJokers - jokerUsed} joker${maxJokers - jokerUsed !== 1 ? 's' : ''} restant${maxJokers - jokerUsed !== 1 ? 's' : ''}`}
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-amber-500 to-orange-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${jokerPercentage}%` }}
              ></div>
            </div>

            <p className="text-xs text-gray-600">
              Minimum {contract.contract_models.joker_config.min_days_before}{' '}
              jours avant la livraison pour poser un joker
            </p>
          </div>
        </div>
      )}

      {/* Delivery Schedule Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Produits
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Statut
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {deliveryGroups.length > 0 ? (
                deliveryGroups.map((group) => {
                  const status = getDeliveryStatus(group.delivery_date);
                  const canSetJokerValue = canSetJoker(group.delivery_date);
                  const hasJoker = group.items.some((item) => item.is_joker);
                  const jokerAllowed =
                    contract.contract_models.joker_config !== null && !isFlexibleContract;

                  return (
                    <tr key={group.delivery_date} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {formatDate(group.delivery_date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="space-y-1">
                          {group.items.map((item) => (
                            <div key={item.id} className="text-gray-900">
                              {item.products.name} x{item.quantity}{' '}
                              {unitTypeLabels[item.products.unit_type] || item.products.unit_type}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {status === 'cancelled' && (
                          <div className="flex items-center gap-2">
                            <X className="w-4 h-4 text-red-600" />
                            <span className="text-red-600 font-medium">
                              Annulé
                            </span>
                            {group.cancel_reason && (
                              <span className="text-gray-600 text-xs">
                                ({group.cancel_reason})
                              </span>
                            )}
                          </div>
                        )}
                        {status === 'joker' && (
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-amber-600" />
                            <span className="text-amber-600 font-medium">
                              Joker
                            </span>
                          </div>
                        )}
                        {status === 'delivered' && (
                          <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-600" />
                            <span className="text-green-600 font-medium">
                              Livré
                            </span>
                          </div>
                        )}
                        {status === 'upcoming' && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <span className="text-blue-600 font-medium">
                              À venir
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {status === 'upcoming' && jokerAllowed && (
                          <div>
                            {!hasJoker && canSetJokerValue && jokerUsed < maxJokers ? (
                              <button
                                onClick={() => toggleJoker(group.delivery_date, true)}
                                disabled={updatingJokerId === group.delivery_date}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {updatingJokerId === group.delivery_date ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-amber-700 border-t-transparent rounded-full animate-spin"></div>
                                    Mise à jour...
                                  </>
                                ) : (
                                  <>
                                    <Zap className="w-4 h-4" />
                                    Poser un joker
                                  </>
                                )}
                              </button>
                            ) : null}
                            {hasJoker && (
                              <button
                                onClick={() => toggleJoker(group.delivery_date, false)}
                                disabled={updatingJokerId === group.delivery_date}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {updatingJokerId === group.delivery_date ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin"></div>
                                    Mise à jour...
                                  </>
                                ) : (
                                  <>
                                    <X className="w-4 h-4" />
                                    Annuler le joker
                                  </>
                                )}
                              </button>
                            )}
                            {!canSetJokerValue && !hasJoker && (
                              <div className="inline-flex items-center gap-1 text-gray-500 text-xs">
                                <AlertTriangle className="w-3 h-3" />
                                Trop proche
                              </div>
                            )}
                          </div>
                        )}
                        {status === 'delivered' && (
                          <span className="text-gray-500 text-sm">—</span>
                        )}
                        {status === 'cancelled' && (
                          <span className="text-gray-500 text-sm">—</span>
                        )}
                        {(status === 'joker' || (!canSetJokerValue && !hasJoker && status === 'upcoming')) && (
                          <span className="text-gray-500 text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">Aucune livraison planifiée</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-white rounded-lg shadow p-6 mt-6 border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Récapitulatif de paiement
        </h3>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Montant total du contrat:</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(contract.total_amount)}
            </span>
          </div>

          {!isFlexibleContract && contract.contract_models.joker_config && jokerUsed > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                Jokers utilisés: {jokerUsed}
              </span>
              <span className="text-amber-600 font-semibold">
                -{formatCurrency(
                  (contract.total_amount / deliveryGroups.length) * jokerUsed
                )}
              </span>
            </div>
          )}

          <div className="pt-3 border-t border-gray-200 flex justify-between text-base">
            <span className="font-semibold text-gray-900">Montant dû:</span>
            <span className="font-bold text-green-600 text-lg">
              {formatCurrency(
                contract.total_amount -
                  (!isFlexibleContract && contract.contract_models.joker_config && jokerUsed > 0
                    ? (contract.total_amount / deliveryGroups.length) * jokerUsed
                    : 0)
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
