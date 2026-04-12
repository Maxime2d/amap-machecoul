import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Calendar,
  Leaf,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  ChevronRight,
} from 'lucide-react';
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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          borderColor: 'border-l-green-500',
          badgeBg: 'bg-green-50',
          badgeText: 'text-green-700',
          badgeLabel: 'Actif',
          icon: CheckCircle,
          iconColor: 'text-green-600',
        };
      case 'completed':
        return {
          borderColor: 'border-l-blue-500',
          badgeBg: 'bg-blue-50',
          badgeText: 'text-blue-700',
          badgeLabel: 'Terminé',
          icon: CheckCircle,
          iconColor: 'text-blue-600',
        };
      case 'pending':
        return {
          borderColor: 'border-l-amber-500',
          badgeBg: 'bg-amber-50',
          badgeText: 'text-amber-700',
          badgeLabel: 'En attente',
          icon: Clock,
          iconColor: 'text-amber-600',
        };
      case 'cancelled':
        return {
          borderColor: 'border-l-red-500',
          badgeBg: 'bg-red-50',
          badgeText: 'text-red-700',
          badgeLabel: 'Annulé',
          icon: XCircle,
          iconColor: 'text-red-600',
        };
      case 'open':
        return {
          borderColor: 'border-l-green-500',
          badgeBg: 'bg-green-50',
          badgeText: 'text-green-700',
          badgeLabel: 'Ouvert',
          icon: CheckCircle,
          iconColor: 'text-green-600',
        };
      default:
        return {
          borderColor: 'border-l-gray-500',
          badgeBg: 'bg-stone-50',
          badgeText: 'text-stone-700',
          badgeLabel: status,
          icon: AlertCircle,
          iconColor: 'text-stone-600',
        };
    }
  };

  const getNatureBadgeConfig = (nature: string) => {
    switch (nature) {
      case 'subscription':
        return {
          badgeBg: 'bg-emerald-100',
          badgeText: 'text-emerald-700',
          badgeLabel: 'Abonnement',
        };
      case 'flexible':
        return {
          badgeBg: 'bg-indigo-100',
          badgeText: 'text-indigo-700',
          badgeLabel: 'Commande flexible',
        };
      default:
        return {
          badgeBg: 'bg-stone-100',
          badgeText: 'text-stone-700',
          badgeLabel: nature,
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateLong = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const calculateProgress = (startDate: string, endDate: string) => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();

    if (now < start) return 0;
    if (now > end) return 100;

    const total = end - start;
    const elapsed = now - start;
    return Math.round((elapsed / total) * 100);
  };

  const activeContracts = (contracts || []).filter(
    (c: any) => c.contract_models?.status === 'active'
  );
  const otherContracts = (contracts || []).filter(
    (c: any) => c.contract_models?.status !== 'active'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f7f4] via-white to-[#f8f7f4]">
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-2">
                Mes contrats
              </h1>
              <p className="text-stone-600 text-lg">
                Gérez vos contrats avec les producteurs de l'AMAP
              </p>
            </div>
            <Link
              href="/app/contrats/disponibles"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              Souscrire
            </Link>
          </div>
        </div>

        {contracts && contracts.length > 0 ? (
          <div className="space-y-12">
            {/* Active Contracts Section */}
            {activeContracts.length > 0 && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
                    <div className="w-1 h-8 bg-green-600 rounded-full"></div>
                    Contrats actifs
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(activeContracts as any[]).map((contract: any) => {
                    const statusConfig = getStatusConfig(contract.contract_models?.status);
                    const natureConfig = getNatureBadgeConfig(contract.contract_models?.nature);
                    const StatusIcon = statusConfig.icon;
                    const progress = calculateProgress(
                      contract.contract_models?.start_date || '',
                      contract.contract_models?.end_date || ''
                    );
                    const isFlexible = contract.contract_models?.nature === 'flexible';

                    return (
                      <Link
                        key={contract.id}
                        href={`/app/contrats/${contract.id}`}
                        className={`group relative bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border ${statusConfig.borderColor} border-l-4 transform hover:scale-105`}
                      >
                        {/* Card Background Accent */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-300"></div>

                        <div className="relative p-6 md:p-7">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-5">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="bg-gradient-to-br from-green-100 to-green-50 p-3 rounded-xl">
                                <Leaf className="w-6 h-6 text-green-700" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-stone-900 text-lg group-hover:text-green-700 transition-colors">
                                  {contract.contract_models?.name || 'Contrat'}
                                </h3>
                                <p className="text-sm text-stone-500 font-medium">
                                  {contract.contract_models?.producers?.name || 'Producteur'}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold ${statusConfig.badgeBg} ${statusConfig.badgeText} whitespace-nowrap`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig.badgeLabel}
                            </span>
                          </div>

                          {/* Nature Badge */}
                          <div className="mb-4">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${natureConfig.badgeBg} ${natureConfig.badgeText}`}
                            >
                              {natureConfig.badgeLabel}
                            </span>
                          </div>

                          {/* Amount - Prominent */}
                          {contract.total_amount && (
                            <div className="mb-5 pb-5 border-b border-stone-100">
                              <p className="text-sm text-stone-600 mb-1">Montant du contrat</p>
                              <p className="text-3xl font-bold text-green-700">
                                {contract.total_amount.toFixed(2)}€
                              </p>
                            </div>
                          )}

                          {/* Progress Indicator */}
                          <div className="mb-5">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-semibold text-stone-700 uppercase tracking-wide">
                                Progression
                              </p>
                              <p className="text-xs font-bold text-green-700">{progress}%</p>
                            </div>
                            <div className="w-full bg-stone-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Date Range */}
                          <div className="flex items-center gap-2 text-sm text-stone-600 mb-5">
                            <Calendar className="w-4 h-4 text-stone-400" />
                            <span>
                              {formatDate(contract.contract_models?.start_date || '')} jusqu'au{' '}
                              {formatDate(contract.contract_models?.end_date || '')}
                            </span>
                          </div>

                          {/* Signed Date */}
                          {contract.signed_at && (
                            <p className="text-xs text-stone-500">
                              Signé le {formatDateLong(contract.signed_at)}
                            </p>
                          )}

                          {/* Footer CTA */}
                          <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-green-700 font-semibold group-hover:gap-3 transition-all">
                            <span>{isFlexible ? 'Commander / Détails' : 'Voir les détails'}</span>
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Other Contracts Section */}
            {otherContracts.length > 0 && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
                    <div className="w-1 h-8 bg-orange-500 rounded-full"></div>
                    Autres contrats
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(otherContracts as any[]).map((contract: any) => {
                    const statusConfig = getStatusConfig(contract.contract_models?.status);
                    const natureConfig = getNatureBadgeConfig(contract.contract_models?.nature);
                    const StatusIcon = statusConfig.icon;
                    const isFlexible = contract.contract_models?.nature === 'flexible';

                    return (
                      <Link
                        key={contract.id}
                        href={`/app/contrats/${contract.id}`}
                        className={`group relative bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border ${statusConfig.borderColor} border-l-4 opacity-85 hover:opacity-100`}
                      >
                        {/* Card Background Accent */}
                        <div className="absolute top-0 right-0 w-20 h-20 bg-stone-50 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-300"></div>

                        <div className="relative p-6 md:p-7">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="bg-stone-100 p-3 rounded-xl">
                                <FileText className="w-6 h-6 text-stone-600" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-stone-900 text-lg">
                                  {contract.contract_models?.name || 'Contrat'}
                                </h3>
                                <p className="text-sm text-stone-500 font-medium">
                                  {contract.contract_models?.producers?.name || 'Producteur'}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold ${statusConfig.badgeBg} ${statusConfig.badgeText} whitespace-nowrap`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig.badgeLabel}
                            </span>
                          </div>

                          {/* Nature Badge */}
                          <div className="mb-4">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${natureConfig.badgeBg} ${natureConfig.badgeText}`}
                            >
                              {natureConfig.badgeLabel}
                            </span>
                          </div>

                          {/* Amount */}
                          {contract.total_amount && (
                            <div className="mb-4 pb-4 border-b border-stone-100">
                              <p className="text-sm text-stone-600 mb-1">Montant</p>
                              <p className="text-2xl font-bold text-stone-800">
                                {contract.total_amount.toFixed(2)}€
                              </p>
                            </div>
                          )}

                          {/* Date Range */}
                          <div className="flex items-center gap-2 text-sm text-stone-600 mb-4">
                            <Calendar className="w-4 h-4 text-stone-400" />
                            <span>
                              {formatDate(contract.contract_models?.start_date || '')} -{' '}
                              {formatDate(contract.contract_models?.end_date || '')}
                            </span>
                          </div>

                          {/* Signed Date */}
                          {contract.signed_at && (
                            <p className="text-xs text-stone-500 mb-4">
                              Signé le {formatDateLong(contract.signed_at)}
                            </p>
                          )}

                          {/* Footer CTA */}
                          <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between text-stone-700 font-semibold group-hover:gap-3 transition-all">
                            <span>{isFlexible ? 'Commander / Détails' : 'Voir les détails'}</span>
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="relative">
            <div className="bg-white rounded-3xl shadow-lg p-12 md:p-16 text-center border border-stone-100">
              {/* Decorative Elements */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl flex items-center justify-center shadow-lg">
                  <Leaf className="w-10 h-10 text-green-600" />
                </div>
              </div>

              <div className="pt-6">
                <h2 className="text-3xl font-bold text-stone-900 mb-3">
                  Aucun contrat pour le moment
                </h2>
                <p className="text-stone-600 text-lg mb-2">
                  Vous n'avez pas encore souscrit à un contrat AMAP.
                </p>
                <p className="text-stone-500 mb-8">
                  Découvrez nos offres disponibles et rejoignez nos producteurs partenaires!
                </p>

                <Link
                  href="/app/contrats/disponibles"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Leaf className="w-5 h-5" />
                  Découvrir les contrats disponibles
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
