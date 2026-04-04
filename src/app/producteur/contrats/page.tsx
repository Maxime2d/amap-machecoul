'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDate, formatCurrency } from '@/lib/utils';
import { AlertCircle, Calendar, Users, DollarSign } from 'lucide-react';

interface ContractModel {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface ContractWithCount extends ContractModel {
  subscriberCount: number;
  totalAmount: number;
}

export default function ContractsPage() {
  const supabase = createClient();
  const [contracts, setContracts] = useState<ContractWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContracts() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        // Get producer referent
        const { data: referent } = await supabase
          .from('producer_referents')
          .select('producer_id')
          .eq('user_id', user.id)
          .single();

        if (!referent) return;

        // Get all contract models for this producer
        const { data: contractModels } = await supabase
          .from('contract_models')
          .select('id, name, start_date, end_date, status')
          .eq('producer_id', referent.producer_id)
          .order('start_date', { ascending: false });

        if (!contractModels || contractModels.length === 0) {
          setContracts([]);
          return;
        }

        // For each contract model, count subscribers and calculate total amount
        const enrichedContracts = await Promise.all(
          (contractModels as ContractModel[]).map(async (model) => {
            // Get contracts (subscriptions) for this model
            const { data: modelContracts, count: subscriberCount } = await supabase
              .from('contracts')
              .select('total_amount', { count: 'exact' })
              .eq('model_id', model.id);

            const totalAmount = (modelContracts || []).reduce(
              (sum, c) => sum + (c.total_amount || 0),
              0
            );

            return {
              ...model,
              subscriberCount: subscriberCount || 0,
              totalAmount,
            };
          })
        );

        setContracts(enrichedContracts as ContractWithCount[]);
      } catch (error) {
        console.error('Error fetching contracts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchContracts();
  }, []);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'open':
        return 'bg-blue-100 text-blue-700';
      case 'closed':
        return 'bg-slate-100 text-slate-700';
      case 'archived':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'open':
        return 'Ouvert';
      case 'closed':
        return 'Fermé';
      case 'archived':
        return 'Archivé';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Mes contrats
        </h1>
        <p className="text-slate-600">
          Gestion des contrats et des adhérents
        </p>
      </div>

      {contracts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">
            Vous n'avez pas encore de contrat.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 flex-1">
                    {contract.name}
                  </h3>
                  <span
                    className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusBadgeColor(
                      contract.status
                    )}`}
                  >
                    {getStatusLabel(contract.status)}
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  {/* Date */}
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-slate-600">
                        {new Date(contract.start_date).toLocaleDateString(
                          'fr-FR'
                        )}{' '}
                        -{' '}
                        {new Date(contract.end_date).toLocaleDateString(
                          'fr-FR'
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Subscribers */}
                  <div className="flex items-center gap-3 text-sm">
                    <Users className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-slate-600">
                        {contract.subscriberCount} adhérent
                        {contract.subscriberCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Total Amount */}
                  <div className="flex items-center gap-3 text-sm">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-slate-600">
                        {formatCurrency(contract.totalAmount)}
                      </p>
                    </div>
                  </div>
                </div>

                <button className="w-full px-4 py-2 border border-green-600 text-green-600 hover:bg-green-50 rounded-lg font-medium transition-colors text-sm">
                  Voir détails
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
