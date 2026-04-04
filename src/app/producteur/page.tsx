'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import {
  CheckCircle,
  Package,
  Users,
  Truck,
  ArrowRight,
} from 'lucide-react';

interface ContractModel {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface ModelDate {
  id: string;
  delivery_date: string;
  is_cancelled: boolean;
}

interface Product {
  id: string;
  name: string;
}

interface Contract {
  id: string;
  status: string;
}

interface Producer {
  id: string;
  name: string;
}

export default function ProducerDashboard() {
  const supabase = createClient();
  const [producer, setProducer] = useState<Producer | null>(null);
  const [contracts, setContracts] = useState<ContractModel[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [subscribers, setSubscribers] = useState<Contract[]>([]);
  const [upcomingDeliveries, setUpcomingDeliveries] = useState<ModelDate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
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

        // Get producer details
        const { data: producerData } = await supabase
          .from('producers')
          .select('id, name')
          .eq('id', referent.producer_id)
          .single();

        if (producerData) {
          setProducer(producerData as Producer);

          // Get contract models
          const { data: contractModels } = await supabase
            .from('contract_models')
            .select('id, name, start_date, end_date, status')
            .eq('producer_id', referent.producer_id);

          if (contractModels) {
            setContracts(contractModels as ContractModel[]);
          }

          // Get products
          const { data: productsData } = await supabase
            .from('products')
            .select('id, name')
            .eq('producer_id', referent.producer_id);

          if (productsData) {
            setProducts(productsData as Product[]);
          }

          // Get active contracts (subscribers)
          const { data: contractsData } = await supabase
            .from('contracts')
            .select('id, status, model_id')
            .in(
              'model_id',
              (contractModels as ContractModel[])?.map((c) => c.id) || []
            )
            .eq('status', 'active');

          if (contractsData) {
            setSubscribers(contractsData as Contract[]);
          }

          // Get upcoming deliveries
          if (contractModels && contractModels.length > 0) {
            const { data: deliveries } = await supabase
              .from('model_dates')
              .select('id, delivery_date, is_cancelled')
              .in(
                'model_id',
                (contractModels as ContractModel[]).map((c) => c.id)
              )
              .gte('delivery_date', new Date().toISOString())
              .order('delivery_date', { ascending: true })
              .limit(5);

            if (deliveries) {
              setUpcomingDeliveries(deliveries as ModelDate[]);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-600">Chargement...</p>
      </div>
    );
  }

  const activeContracts = contracts.filter(
    (c) => c.status === 'active' || c.status === 'open'
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Bienvenue, {producer?.name}!
        </h1>
        <p className="text-slate-600">
          Gérez vos livraisons, contrats et adhérents
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Contrats actifs</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {activeContracts.length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Prochaine livraison</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {upcomingDeliveries.length > 0
                  ? new Date(upcomingDeliveries[0]?.delivery_date || '').toLocaleDateString(
                      'fr-FR'
                    )
                  : 'N/A'}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Adhérents total</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {subscribers.length}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Produits</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">
                {products.length}
              </p>
            </div>
            <div className="bg-amber-100 p-3 rounded-lg">
              <Package className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Deliveries */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            Prochaines livraisons
          </h2>
          {upcomingDeliveries.length > 0 ? (
            <>
              <div className="space-y-3 mb-4">
                {upcomingDeliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {new Date(delivery.delivery_date).toLocaleDateString(
                            'fr-FR',
                            {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                            }
                          )}
                        </p>
                        <p className="text-xs text-slate-600">
                          {delivery.is_cancelled ? 'Annulée' : 'Prévue'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/producteur/livraisons"
                className="flex items-center justify-center gap-2 w-full px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg font-medium transition-colors"
              >
                Voir toutes les livraisons
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          ) : (
            <p className="text-slate-600 text-sm">
              Aucune livraison prévue pour le moment.
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Actions rapides</h2>
          <div className="space-y-3">
            <Link
              href="/producteur/livraisons"
              className="block w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-center"
            >
              Mes livraisons
            </Link>
            <Link
              href="/producteur/contrats"
              className="block w-full px-4 py-2 border border-green-600 text-green-600 hover:bg-green-50 rounded-lg font-medium transition-colors text-center"
            >
              Mes contrats
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
