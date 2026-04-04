'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Package,
  Calendar,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Leaf,
  Truck,
  ArrowRight,
} from 'lucide-react';

interface Product {
  name: string;
  unit_type: string;
}

interface ContractItem {
  id: string;
  product_id: string;
  delivery_date: string;
  quantity: number;
  products: Product;
}

interface Producer {
  name: string;
}

interface ContractModel {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  producers: Producer;
}

interface Contract {
  id: string;
  status: string;
  total_amount: number;  contract_models: ContractModel;
  contract_items: ContractItem[];
}

interface GroupedDelivery {
  date: string;
  items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    unit_type: string;
    producer_name: string;
  }>;
}

export default function LivraisonsPage() {
  const [upcomingDeliveries, setUpcomingDeliveries] = useState<GroupedDelivery[]>([]);
  const [pastDeliveries, setPastDeliveries] = useState<GroupedDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPast, setExpandedPast] = useState(false);

  const supabase = createClient();

  const fetchDeliveries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Get current user
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        throw new Error('Unable to fetch user');
      }

      const userId = authData.user.id;

      // Fetch contracts with related data
      const { data: contracts, error: contractError } = await supabase
        .from('contracts')
        .select(`
          id, status, total_amount,
          contract_models ( id, name, start_date, end_date, producers ( name ) ),
          contract_items ( id, product_id, delivery_date, quantity, products ( name, unit_type ) )
        `)
        .eq('user_id', userId)
        .in('status', ['active', 'pending']);

      if (contractError) {
        throw new Error('Failed to fetch contracts');
      }

      // Group contract_items by delivery_date across all contracts
      const deliveriesMap = new Map<string, GroupedDelivery>();
      if (contracts && Array.isArray(contracts)) {
        for (const contract of contracts) {
          const items = contract.contract_items || [];
          const producerName = contract.contract_models?.producers?.name || 'Unknown Producer';

          for (const item of items) {
            const dateKey = item.delivery_date;

            if (!deliveriesMap.has(dateKey)) {
              deliveriesMap.set(dateKey, {
                date: dateKey,
                items: [],
              });
            }

            const delivery = deliveriesMap.get(dateKey)!;
            delivery.items.push({
              id: item.id,
              product_name: item.products?.name || 'Unknown Product',
              quantity: item.quantity,
              unit_type: item.products?.unit_type || '',
              producer_name: producerName,
            });
          }
        }
      }
      // Sort dates ascending
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const allDeliveries = Array.from(deliveriesMap.values()).sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

      // Separate into upcoming and past
      const upcoming = allDeliveries.filter(
        (d) => new Date(d.date).getTime() >= today.getTime()
      );

      const past = allDeliveries
        .filter((d) => new Date(d.date).getTime() < today.getTime())
        .reverse()
        .slice(0, 5);

      setUpcomingDeliveries(upcoming);
      setPastDeliveries(past);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching deliveries:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString('fr-FR', options);
  };

  const formatDateShort = (dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
    };
    return date.toLocaleDateString('fr-FR', options);
  };

  const formatMonth = (dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      year: 'numeric',
    };
    return date.toLocaleDateString('fr-FR', options);
  };

  const getDayOfWeek = (dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
    };
    return date.toLocaleDateString('fr-FR', options);
  };

  const getDaysUntil = (dateString: string): number => {
    const deliveryDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysUntil = Math.ceil(
      (deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntil;
  };

  const groupDeliveriesByMonth = (deliveries: GroupedDelivery[]) => {
    const grouped: { [key: string]: GroupedDelivery[] } = {};
    deliveries.forEach((delivery) => {
      const monthKey = formatMonth(delivery.date);
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(delivery);
    });
    return grouped;
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header skeleton */}
          <div className="mb-8 animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-20 bg-gray-200 rounded-lg"></div>
              <div className="h-20 bg-gray-200 rounded-lg"></div>
            </div>
          </div>

          {/* Hero card skeleton */}
          <div className="mb-8 animate-pulse">
            <div className="h-80 bg-gray-200 rounded-xl"></div>
          </div>

          {/* Timeline skeleton */}
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-red-500">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-bold text-red-900">Oups! Une erreur est survenue</h2>
            </div>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const monthlyGrouped = groupDeliveriesByMonth(upcomingDeliveries);
  const monthKeys = Object.keys(monthlyGrouped);

  // Empty state
  if (upcomingDeliveries.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Mes livraisons</h1>
            <p className="text-gray-600">Consultez vos livraisons à venir et passées</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-16 text-center">
            <div className="inline-block p-4 bg-green-50 rounded-full mb-6">
              <Truck className="w-16 h-16 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Aucune livraison à venir
            </h2>
            <p className="text-gray-600 text-lg max-w-md mx-auto">
              Vos livraisons apparaîtront ici dès qu'elles seront planifiées. Restez à l'écoute!
            </p>
          </div>

          {/* Past deliveries if any */}
          {pastDeliveries.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Historique des livraisons</h2>
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <button
                  onClick={() => setExpandedPast(!expandedPast)}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Clock className="w-6 h-6 text-green-600" />
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-gray-900">
                        Livraisons passées
                      </h3>
                      <p className="text-sm text-gray-600">
                        {pastDeliveries.length} livraison{pastDeliveries.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  {expandedPast ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </button>

                {expandedPast && (
                  <div className="border-t border-gray-200">
                    <div className="divide-y divide-gray-100">
                      {pastDeliveries.map((delivery) => (
                        <div key={delivery.date} className="p-6 hover:bg-gray-50 transition-colors">
                          <h4 className="font-semibold text-gray-900 mb-4">
                            {formatDate(delivery.date)}
                          </h4>
                          <div className="space-y-3">
                            {delivery.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded-lg"
                              >
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {item.product_name}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {item.producer_name}
                                  </p>
                                </div>
                                <p className="text-gray-900 font-semibold">
                                  {item.quantity} {item.unit_type}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const nextDelivery = upcomingDeliveries[0];
  const daysUntilNext = getDaysUntil(nextDelivery.date);
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with stats */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Mes livraisons</h1>
          <p className="text-gray-600 mb-6">Consultez vos livraisons à venir et passées</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Next delivery stat */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-600">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-green-600" />
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  Prochaine livraison
                </p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatDateShort(nextDelivery.date)}
              </p>
            </div>

            {/* Total upcoming stat */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-600">
              <div className="flex items-center gap-3 mb-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  Livraisons à venir
                </p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {upcomingDeliveries.length}
              </p>
            </div>
          </div>
        </div>

        {/* Next delivery hero card */}
        <div className="mb-12">
          <div className="relative overflow-hidden bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl shadow-2xl p-8 md:p-10 text-white">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-green-500 rounded-full opacity-10 -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500 rounded-full opacity-10 -ml-16 -mb-16"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full px-4 py-1 flex items-center gap-2">
                  <Leaf className="w-4 h-4" />
                  <span className="text-sm font-semibold">Prochaine livraison</span>
                </div>
              </div>

              <div className="mb-8">
                <p className="text-white text-opacity-80 text-sm mb-2">
                  {getDayOfWeek(nextDelivery.date).charAt(0).toUpperCase() +
                    getDayOfWeek(nextDelivery.date).slice(1)}
                </p>
                <h2 className="text-5xl font-bold mb-2">
                  {new Date(nextDelivery.date).getDate()}
                </h2>
                <p className="text-xl text-white text-opacity-90">
                  {formatMonth(nextDelivery.date)}
                </p>
              </div>

              {/* Countdown */}
              <div className="inline-block bg-white bg-opacity-20 backdrop-blur-sm rounded-xl px-6 py-3 mb-8">
                <p className="text-lg font-semibold">
                  Dans{' '}
                  <span className="text-2xl font-bold">
                    {daysUntilNext}
                  </span>{' '}
                  {daysUntilNext === 1 ? 'jour' : 'jours'}
                </p>
              </div>

              {/* Products list */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-white text-opacity-80 uppercase tracking-wide">
                  Vous recevrez
                </p>
                {nextDelivery.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-3"
                  >
                    <div className="mt-1">
                      <Leaf className="w-5 h-5 text-green-200" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">
                        {item.quantity} {item.unit_type} {item.product_name}
                      </p>
                      <p className="text-sm text-white text-opacity-75">
                        De {item.producer_name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming deliveries timeline */}
        {upcomingDeliveries.length > 1 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Calendrier des livraisons</h2>

            {monthKeys.map((monthKey, monthIndex) => (
              <div key={monthKey} className="mb-10">
                {/* Month header */}
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-6 pl-6">
                  {monthKey}
                </h3>

                {/* Timeline for this month */}
                <div className="space-y-6 relative">
                  {/* Vertical line */}
                  <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-400 to-emerald-400"></div>

                  {/* Timeline items */}
                  {monthlyGrouped[monthKey].map((delivery, index) => (
                    <div key={delivery.date} className="ml-12 relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-10 top-1 w-5 h-5 bg-white border-3 border-green-500 rounded-full shadow-md"></div>

                      {/* Card */}
                      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="p-6 border-b border-gray-100 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600 font-medium">
                                {getDayOfWeek(delivery.date)}
                              </p>
                              <h3 className="text-xl font-bold text-gray-900">
                                {formatDateShort(delivery.date)}
                              </h3>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                                {delivery.items.length} produit
                                {delivery.items.length > 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Products */}
                        <div className="p-6 space-y-4">
                          {delivery.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between py-2"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <Leaf className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900">
                                    {item.product_name}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {item.producer_name}
                                  </p>
                                </div>
                              </div>
                              <p className="font-bold text-gray-900 text-right ml-4">
                                {item.quantity}
                                <span className="text-sm font-normal text-gray-600 ml-1">
                                  {item.unit_type}
                                </span>
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Past deliveries accordion */}
        {pastDeliveries.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Historique des livraisons</h2>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <button
                onClick={() => setExpandedPast(!expandedPast)}
                className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Clock className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-gray-900">
                      Livraisons passées
                    </h3>
                    <p className="text-sm text-gray-600">
                      {pastDeliveries.length} livraison{pastDeliveries.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-gray-600">
                  {expandedPast ? (
                    <ChevronUp className="w-6 h-6" />
                  ) : (
                    <ChevronDown className="w-6 h-6" />
                  )}
                </div>
              </button>

              {expandedPast && (
                <div className="border-t border-gray-200">
                  <div className="divide-y divide-gray-100">
                    {pastDeliveries.map((delivery) => (
                      <div
                        key={delivery.date}
                        className="p-6 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="text-sm text-gray-600">
                              {getDayOfWeek(delivery.date)}
                            </p>
                            <h4 className="text-lg font-bold text-gray-900">
                              {formatDateShort(delivery.date)}
                            </h4>
                          </div>
                          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            {delivery.items.length} produit
                            {delivery.items.length > 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {delivery.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between bg-gray-50 p-3 rounded-lg text-sm"
                            >
                              <div>
                                <p className="font-medium text-gray-900">
                                  {item.product_name}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {item.producer_name}
                                </p>
                              </div>
                              <p className="font-semibold text-gray-900">
                                {item.quantity} {item.unit_type}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}