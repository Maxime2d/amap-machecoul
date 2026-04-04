import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CreditCard, CheckCircle, AlertCircle, FileText } from 'lucide-react';
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
        return { bg: 'bg-green-100', text: 'text-green-700', label: 'Reçu' };
      case 'pending':
        return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'En attente' };
      case 'late':
        return { bg: 'bg-red-100', text: 'text-red-700', label: 'En retard' };
      case 'cancelled':
        return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Annulé' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-green-100 p-3 rounded-lg">
          <CreditCard className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cotisation et paiements</h1>
          <p className="text-gray-600">Suivez vos contributions à l'AMAP</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total cotisé</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalAmount.toFixed(2)}€
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
              <p className="text-gray-600 text-sm font-medium">En attente</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {pendingAmount.toFixed(2)}€
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
              <p className="text-gray-600 text-sm font-medium">Payé</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {paidAmount.toFixed(2)}€
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            Résumé des contrats
          </h2>
          {contracts && contracts.length > 0 ? (
            <div className="space-y-4">
              {(contracts as any[]).map((contract: any) => (
                <div
                  key={contract.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">Contrat actif</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(contract.contract_models?.start_date || '')} -{' '}
                      {formatDate(contract.contract_models?.end_date || '')}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    Actif
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-sm">
              Vous n'avez actuellement aucun contrat actif.
            </p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            Informations de paiement
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 font-medium">Statut de cotisation</p>
              <p className="mt-2">
                {pendingAmount === 0 ? (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                    À jour
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
                    Paiement en attente
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Méthode de paiement</p>
              <p className="mt-2 text-gray-700">
                Virement bancaire, chèque ou espèces
              </p>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                Pour toute question concernant vos paiements, veuillez contacter le trésorier.
              </p>
            </div>
          </div>
        </div>
      </div>

      {payments && payments.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">
              Historique des paiements
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Date d'échéance
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Méthode
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(payments as any[]).map((payment: any) => {
                  const statusColor = getPaymentStatusColor(payment.status);
                  return (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDate(payment.due_date)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {payment.amount.toFixed(2)}€
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor.bg} ${statusColor.text}`}
                        >
                          {statusColor.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {payment.method
                          ? getPaymentMethodLabel(payment.method)
                          : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
