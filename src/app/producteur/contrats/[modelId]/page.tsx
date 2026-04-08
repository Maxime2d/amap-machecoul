'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Users,
  Euro,
  Package,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ContractModel {
  id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
}

interface ModelProduct {
  id: string;
  model_id: string;
  product_id: string;
  price: number;
  products: {
    id: string;
    name: string;
  };
}

interface Contract {
  id: string;
  model_id: string;
  user_id: string;
  status: string;
  total_amount: number;
  signed_at: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
}

interface ModelDate {
  id: string;
  model_id: string;
  delivery_date: string;
  is_cancelled: boolean;
}

interface Stats {
  subscribers_count: number;
  total_revenue: number;
  deliveries_count: number;
}

export default function ContractDetailPage({
  params,
}: {
  params: Promise<{ modelId: string }>;
}) {
  const { modelId } = use(params);
  const supabase = createClient();

  const [contractModel, setContractModel] = useState<ContractModel | null>(null);
  const [products, setProducts] = useState<ModelProduct[]>([]);
  const [subscribers, setSubscribers] = useState<Contract[]>([]);
  const [deliveryDates, setDeliveryDates] = useState<ModelDate[]>([]);
  const [stats, setStats] = useState<Stats>({
    subscribers_count: 0,
    total_revenue: 0,
    deliveries_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProducerId, setUserProducerId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Auth flow
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }

        const { data: referent } = await supabase
          .from('producer_referents')
          .select('producer_id')
          .eq('user_id', user.id)
          .single();

        if (!referent) {
          setError('Producer not found');
          setLoading(false);
          return;
        }

        setUserProducerId(referent.producer_id);

        // Load contract model
        const { data: modelData, error: modelError } = await supabase
          .from('contract_models')
          .select('*')
          .eq('id', modelId)
          .single();

        if (modelError) throw modelError;
        setContractModel(modelData);

        // Load products for this model
        const { data: productsData, error: productsError } = await supabase
          .from('model_products')
          .select(
            `
            id,
            model_id,
            product_id,
            price,
            products (
              id,
              name
            )
          `
          )
          .eq('model_id', modelId);

        if (productsError) throw productsError;
        setProducts(productsData || []);

        // Load subscribers (contracts)
        const { data: contractsData, error: contractsError } = await supabase
          .from('contracts')
          .select(
            `
            id,
            model_id,
            user_id,
            status,
            total_amount,
            signed_at,
            profiles (
              first_name,
              last_name
            )
          `
          )
          .eq('model_id', modelId);

        if (contractsError) throw contractsError;
        setSubscribers(contractsData || []);

        // Calculate stats
        const totalRevenue = (contractsData || []).reduce(
          (sum, contract) => sum + (contract.total_amount || 0),
          0
        );
        setStats({
          subscribers_count: contractsData?.length || 0,
          total_revenue: totalRevenue,
          deliveries_count: 0,
        });

        // Load delivery dates
        const { data: datesData, error: datesError } = await supabase
          .from('model_dates')
          .select('*')
          .eq('model_id', modelId)
          .order('delivery_date', { ascending: true });

        if (datesError) throw datesError;
        setDeliveryDates(datesData || []);

        // Update deliveries count
        const activeDates = (datesData || []).filter(
          (d) => !d.is_cancelled
        ).length;
        setStats((prev) => ({
          ...prev,
          deliveries_count: activeDates,
        }));
      } catch (err) {
        console.error('Error loading contract data:', err);
        setError('Failed to load contract details');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [modelId, supabase]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'pending':
        return 'En attente';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 p-8 flex items-center justify-center">
        <div className="text-slate-600">Chargement...</div>
      </div>
    );
  }

  if (error || !contractModel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 p-8">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/producteur/contrats"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux contrats
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">
            {error || 'Contrat non trouvé'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Link */}
        <Link
          href="/producteur/contrats"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux contrats
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-3">
                {contractModel.name}
              </h1>
              <div className="flex items-center gap-4 text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-600" />
                  <span>
                    {new Date(contractModel.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}{' '}
                    -{' '}
                    {new Date(contractModel.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
            <span
              className={`px-4 py-2 rounded-full font-medium text-sm ${getStatusColor(
                contractModel.status
              )}`}
            >
              {getStatusLabel(contractModel.status)}
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium mb-1">
                  Nombre d'adhérents
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {stats.subscribers_count}
                </p>
              </div>
              <Users className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium mb-1">
                  Chiffre d'affaires total
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {stats.total_revenue.toFixed(2)} €
                </p>
              </div>
              <Euro className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium mb-1">
                  Nombre de livraisons
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {stats.deliveries_count}
                </p>
              </div>
              <Package className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            Produits du contrat
          </h2>
          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="border border-slate-200 rounded-lg p-4 hover:border-green-300 transition"
                >
                  <p className="font-medium text-slate-900 mb-2">
                    {product.products.name}
                  </p>
                  <div className="flex items-center gap-1 text-green-600 font-bold text-lg">
                    <Euro className="w-4 h-4" />
                    {product.price.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600">Aucun produit associé</p>
          )}
        </div>

        {/* Subscribers Table */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            Adhérents ({subscribers.length})
          </h2>
          {subscribers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-700 text-sm">
                      Nom
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700 text-sm">
                      Statut
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700 text-sm">
                      Montant total
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700 text-sm">
                      Date de signature
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((subscriber) => (
                    <tr
                      key={subscriber.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition"
                    >
                      <td className="py-3 px-4 text-slate-900">
                        {subscriber.profiles.first_name}{' '}
                        {subscriber.profiles.last_name}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            subscriber.status
                          )}`}
                        >
                          {getStatusLabel(subscriber.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-900 font-medium">
                        {subscriber.total_amount.toFixed(2)} €
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-sm">
                        {subscriber.signed_at
                          ? new Date(subscriber.signed_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-600">Aucun adhérent pour ce contrat</p>
          )}
        </div>

        {/* Delivery Dates Section */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            Dates de livraison
          </h2>
          {deliveryDates.length > 0 ? (
            <div className="space-y-2">
              {deliveryDates.map((date) => (
                <div
                  key={date.id}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-green-300 transition"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-900">
                      {new Date(date.delivery_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  {date.is_cancelled ? (
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-600 font-medium">
                        Annulée
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">
                        Prévue
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600">Aucune date de livraison</p>
          )}
        </div>
      </div>
    </div>
  );
}