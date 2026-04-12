import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Check,
  Clock,
  AlertTriangle,
  FileText,
  DollarSign,
  Zap,
} from 'lucide-react';
import type { Contract } from '@/types/database';

export default async function CotisationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/connexion');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: contracts } = await supabase
    .from('contracts')
    .select('*, contract_models(start_date, end_date)')
    .eq('user_id', user.id)
    .eq('status', 'active') as any;

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .in('contract_id', (contracts as any[])?.map((c: any) => c.id) || [])
    .order('due_date', { ascending: false }) as any;

  const paidAmount = (payments as any[])
    ?.filter((p: any) => p.status === 'received' || p.status === 'deposited')
    .reduce((sum: number, p: any) => sum + p.amount, 0) || 0;

  const pendingAmount = (payments as any[])
    ?.filter((p: any) => p.status === 'pending' || p.status === 'late')
    .reduce((sum: number, p: any) => sum + p.amount, 0) || 0;

  const totalAmount = (payments as any[])?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;

  const paidPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'check': return 'Chèque';
      case 'transfer': return 'Virement';
      case 'cash': return 'Espèces';
      case 'card': return 'Carte';
      default: return method;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'received':
      case 'deposited':
        return { bg: 'bg-green-100', text: 'text-green-700', label: 'Reçu', status: 'received' };
      case 'pending':
        return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'En attente', status: 'pending' };
      case 'late':
        return { bg: 'bg-red-100', text: 'text-red-700', label: 'En retard', status: 'late' };
      case 'cancelled':
        return { bg: 'bg-stone-100', text: 'text-stone-700', label: 'Annulé', status: 'cancelled' };
      default:
        return { bg: 'bg-stone-100', text: 'text-stone-700', label: status, status: 'default' };
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'check':
        return <Check className="w-4 h-4" />;
      case 'transfer':
        return <TrendingUp className="w-4 h-4" />;
      case 'cash':
        return <DollarSign className="w-4 h-4" />;
      case 'card':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f7f4] via-white to-[#f8f7f4] p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-2xl shadow-lg">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-stone-900 mb-2">
                Cotisation et paiements
              </h1>
              <p className="text-stone-600 text-lg">
                Suivez vos contributions à l'AMAP
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Amount Card */}
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-8 border border-stone-100">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-stone-600 text-sm font-semibold uppercase tracking-wide mb-2">
                  Total cotisé
                </p>
                <p className="text-4xl font-bold text-stone-900">
                  {totalAmount.toFixed(2)}€
                </p>
                <p className="text-xs text-stone-500 mt-2">
                  sur votre engagement
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
                <TrendingUp className="w-7 h-7 text-green-600" />
              </div>
            </div>
            {/* Progress Ring */}
            <div className="relative w-full h-2 bg-stone-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                style={{ width: `${paidPercentage}%` }}
              />
            </div>
            <p className="text-xs text-stone-600 mt-2 text-right">
              {Math.round(paidPercentage)}% payé
            </p>
          </div>

          {/* Pending Card */}
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-8 border border-stone-100">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-stone-600 text-sm font-semibold uppercase tracking-wide mb-2">
                  En attente
                </p>
                <p className="text-4xl font-bold text-amber-600">
                  {pendingAmount.toFixed(2)}€
                </p>
                <p className="text-xs text-stone-500 mt-2">
                  à régulariser
                </p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl">
                <Clock className="w-7 h-7 text-amber-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4" />
              {pendingAmount === 0 ? 'Tout est à jour' : 'Action requise'}
            </div>
          </div>

          {/* Paid Card */}
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-8 border border-stone-100">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-stone-600 text-sm font-semibold uppercase tracking-wide mb-2">
                  Payé
                </p>
                <p className="text-4xl font-bold text-green-600">
                  {paidAmount.toFixed(2)}€
                </p>
                <p className="text-xs text-stone-500 mt-2">
                  reçu ou déposé
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
              <Check className="w-4 h-4" />
              Confirmé
            </div>
          </div>
        </div>

        {/* Payment Progress Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-8 mb-8">
          <h2 className="text-xl font-bold text-stone-900 mb-6">
            Progression du paiement
          </h2>

          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="relative">
              <div className="flex h-10 rounded-full overflow-hidden bg-stone-100">
                {paidAmount > 0 && (
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center transition-all duration-500"
                    style={{ width: `${paidPercentage}%` }}
                  >
                    {paidPercentage > 15 && (
                      <span className="text-xs font-bold text-white">
                        {Math.round(paidPercentage)}%
                      </span>
                    )}
                  </div>
                )}
                {pendingAmount > 0 && (
                  <div
                    className="bg-amber-300 flex items-center justify-center transition-all duration-500"
                    style={{ width: `${(pendingAmount / totalAmount) * 100}%` }}
                  >
                    {(pendingAmount / totalAmount) * 100 > 15 && (
                      <span className="text-xs font-bold text-amber-900">
                        {Math.round((pendingAmount / totalAmount) * 100)}%
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-green-600 rounded" />
                <span className="text-sm text-stone-700">
                  Payé <span className="font-semibold">{paidAmount.toFixed(2)}€</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-300 rounded" />
                <span className="text-sm text-stone-700">
                  En attente <span className="font-semibold">{pendingAmount.toFixed(2)}€</span>
                </span>
              </div>
              <div className="text-sm text-stone-700">
                Total <span className="font-semibold">{totalAmount.toFixed(2)}€</span>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Contract Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-8">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-bold text-stone-900">
                Résumé des contrats
              </h2>
            </div>

            {contracts && contracts.length > 0 ? (
              <div className="space-y-3">
                {(contracts as any[]).map((contract: any) => (
                  <div
                    key={contract.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-br from-green-50 to-green-50 rounded-xl border border-green-100 hover:border-green-200 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full" />
                      <div>
                        <p className="font-semibold text-stone-900">
                          Contrat actif
                        </p>
                        <p className="text-sm text-stone-600">
                          {formatDate(contract.contract_models?.start_date || '')} à{' '}
                          {formatDate(contract.contract_models?.end_date || '')}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                      Actif
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-stone-600 text-sm">
                  Vous n'avez actuellement aucun contrat actif.
                </p>
              </div>
            )}
          </div>

          {/* Payment Info Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-8">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-bold text-stone-900">
                Informations de paiement
              </h2>
            </div>

            <div className="space-y-6">
              <div className="pb-6 border-b border-stone-100">
                <p className="text-sm text-stone-600 font-semibold uppercase tracking-wide mb-3">
                  Statut de cotisation
                </p>
                <div>
                  {pendingAmount === 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-600 rounded-full" />
                      <span className="px-4 py-2 bg-green-50 text-green-700 text-sm font-semibold rounded-lg border border-green-200">
                        À jour
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-amber-600 rounded-full" />
                      <span className="px-4 py-2 bg-amber-50 text-amber-700 text-sm font-semibold rounded-lg border border-amber-200">
                        Paiement en attente
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pb-6 border-b border-stone-100">
                <p className="text-sm text-stone-600 font-semibold uppercase tracking-wide mb-3">
                  Moyens de paiement
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-stone-700 flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Virement bancaire
                  </p>
                  <p className="text-sm text-stone-700 flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Chèque
                  </p>
                  <p className="text-sm text-stone-700 flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Espèces
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                  <span className="font-semibold text-blue-900 block mb-1">
                    Besoin d'aide ?
                  </span>
                  Pour toute question concernant vos paiements, veuillez contacter le trésorier.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment History */}
        {payments && payments.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
            <div className="p-8 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h2 className="text-xl font-bold text-stone-900">
                  Historique des paiements
                </h2>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">
                      Date d'échéance
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider">
                      Méthode
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {(payments as any[]).map((payment: any, index: number) => {
                    const statusColor = getPaymentStatusColor(payment.status);
                    return (
                      <tr
                        key={payment.id}
                        className={`hover:bg-stone-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-stone-50'
                        }`}
                      >
                        <td className="px-6 py-4 text-sm text-stone-900">
                          {formatDate(payment.due_date)}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-stone-900">
                          {payment.amount.toFixed(2)}€
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-semibold ${statusColor.bg} ${statusColor.text} inline-flex items-center gap-1`}
                          >
                            {statusColor.status === 'received' || statusColor.status === 'deposited' ? (
                              <Check className="w-3 h-3" />
                            ) : statusColor.status === 'late' ? (
                              <AlertTriangle className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {statusColor.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-stone-600">
                          {payment.method ? (
                            <div className="flex items-center gap-2">
                              <div className="text-stone-400">
                                {getPaymentMethodIcon(payment.method)}
                              </div>
                              {getPaymentMethodLabel(payment.method)}
                            </div>
                          ) : (
                            <span className="text-stone-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden p-6 space-y-4">
              {(payments as any[]).map((payment: any) => {
                const statusColor = getPaymentStatusColor(payment.status);
                return (
                  <div
                    key={payment.id}
                    className="border border-stone-200 rounded-xl p-4 hover:border-green-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-stone-900">
                        {payment.amount.toFixed(2)}€
                      </p>
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-semibold ${statusColor.bg} ${statusColor.text} inline-flex items-center gap-1`}
                      >
                        {statusColor.status === 'received' || statusColor.status === 'deposited' ? (
                          <Check className="w-3 h-3" />
                        ) : statusColor.status === 'late' ? (
                          <AlertTriangle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {statusColor.label}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-stone-600">
                      <p>
                        <span className="font-medium">Échéance:</span> {formatDate(payment.due_date)}
                      </p>
                      {payment.method && (
                        <p className="flex items-center gap-2">
                          <span className="font-medium">Méthode:</span>
                          <div className="text-stone-400">
                            {getPaymentMethodIcon(payment.method)}
                          </div>
                          {getPaymentMethodLabel(payment.method)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
