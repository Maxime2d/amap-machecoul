'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Package,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Leaf,
  Truck,
  MapPin,
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
  total_amount: number;
  contract_models: ContractModel;
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
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        throw new Error('Unable to fetch user');
      }

      const userId = authData.user.id;

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

      const deliveriesMap = new Map<string, GroupedDelivery>();
      if (contracts && Array.isArray(contracts)) {
        for (const contract of contracts) {
          const items = contract.contract_items || [];
          const producerName = contract.contract_models?.producers?.name || 'Producteur';

          for (const item of items) {
            const dateKey = item.delivery_date;
            if (!deliveriesMap.has(dateKey)) {
              deliveriesMap.set(dateKey, { date: dateKey, items: [] });
            }
            const delivery = deliveriesMap.get(dateKey)!;
            delivery.items.push({
              id: item.id,
              product_name: item.products?.name || 'Produit',
              quantity: item.quantity,
              unit_type: item.products?.unit_type || '',
              producer_name: producerName,
            });
          }
        }
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const allDeliveries = Array.from(deliveriesMap.values()).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

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
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      console.error('Error fetching deliveries:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const formatDateFull = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const formatDateShort = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const formatMonth = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  const getDaysUntil = (dateString: string): number => {
    const deliveryDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getDayOfWeek = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { weekday: 'short' });
  };

  const groupDeliveriesByMonth = (deliveries: GroupedDelivery[]) => {
    const grouped: { [key: string]: GroupedDelivery[] } = {};
    deliveries.forEach((delivery) => {
      const monthKey = formatMonth(delivery.date);
      if (!grouped[monthKey]) grouped[monthKey] = [];
      grouped[monthKey].push(delivery);
    });
    return grouped;
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
          <div className="h-8 bg-stone-200 rounded w-48" />
          <div className="h-24 bg-stone-200 rounded-xl" />
          <div className="h-20 bg-stone-200 rounded-xl" />
          <div className="h-20 bg-stone-200 rounded-xl" />
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl border border-red-200 p-6">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const monthlyGrouped = groupDeliveriesByMonth(upcomingDeliveries);
  const monthKeys = Object.keys(monthlyGrouped);
  const nextDelivery = upcomingDeliveries[0];
  const daysUntilNext = nextDelivery ? getDaysUntil(nextDelivery.date) : 0;

  // Empty state
  if (upcomingDeliveries.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-stone-900 mb-6">Mes livraisons</h1>

          <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-stone-100 mb-4">
              <Truck className="w-7 h-7 text-stone-400" />
            </div>
            <p className="text-stone-900 font-semibold mb-1">Aucune livraison a venir</p>
            <p className="text-stone-500 text-sm">
              Vos livraisons apparaitront ici des qu&apos;elles seront planifiees.
            </p>
          </div>

          {pastDeliveries.length > 0 && (
            <div className="mt-8">
              <PastDeliveriesSection
                pastDeliveries={pastDeliveries}
                expandedPast={expandedPast}
                setExpandedPast={setExpandedPast}
                formatDateFull={formatDateFull}
                getDayOfWeek={getDayOfWeek}
                formatDateShort={formatDateShort}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4] p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-900">Mes livraisons</h1>
          <p className="text-stone-500 text-sm mt-1">
            {upcomingDeliveries.length} livraison{upcomingDeliveries.length > 1 ? 's' : ''} a venir
          </p>
        </div>

        {/* Next delivery - compact highlight */}
        {nextDelivery && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                  <Truck className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-green-700 uppercase tracking-wide">
                    Prochaine livraison
                  </p>
                  <p className="text-stone-900 font-bold capitalize">
                    {formatDateFull(nextDelivery.date)}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                {daysUntilNext === 0
                  ? "Aujourd'hui"
                  : daysUntilNext === 1
                    ? 'Demain'
                    : `J-${daysUntilNext}`}
              </span>
            </div>

            <div className="space-y-2">
              {nextDelivery.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-white rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Leaf className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-stone-900 truncate">
                        {item.product_name}
                      </p>
                      <p className="text-xs text-stone-500">{item.producer_name}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-stone-700 ml-3 flex-shrink-0">
                    {item.quantity} {item.unit_type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming deliveries list */}
        {upcomingDeliveries.length > 1 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">
              Calendrier
            </h2>

            {monthKeys.map((monthKey) => (
              <div key={monthKey} className="mb-6">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 px-1">
                  {monthKey}
                </p>

                <div className="space-y-2">
                  {monthlyGrouped[monthKey].map((delivery) => {
                    // Skip the first delivery since it's already shown above
                    if (delivery.date === nextDelivery.date) return null;
                    const days = getDaysUntil(delivery.date);

                    return (
                      <DeliveryCard
                        key={delivery.date}
                        delivery={delivery}
                        daysUntil={days}
                        getDayOfWeek={getDayOfWeek}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Past deliveries */}
        {pastDeliveries.length > 0 && (
          <PastDeliveriesSection
            pastDeliveries={pastDeliveries}
            expandedPast={expandedPast}
            setExpandedPast={setExpandedPast}
            formatDateFull={formatDateFull}
            getDayOfWeek={getDayOfWeek}
            formatDateShort={formatDateShort}
          />
        )}
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function DeliveryCard({
  delivery,
  daysUntil,
  getDayOfWeek,
}: {
  delivery: GroupedDelivery;
  daysUntil: number;
  getDayOfWeek: (d: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const date = new Date(delivery.date);
  const dayNum = date.getDate();
  const dayName = getDayOfWeek(delivery.date);
  const monthShort = date.toLocaleDateString('fr-FR', { month: 'short' });

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-stone-50 transition-colors"
      >
        {/* Date badge */}
        <div className="w-12 h-12 rounded-lg bg-stone-100 flex flex-col items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-medium text-stone-500 uppercase leading-none">
            {dayName}
          </span>
          <span className="text-lg font-bold text-stone-900 leading-tight">{dayNum}</span>
          <span className="text-[10px] text-stone-400 leading-none">{monthShort}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-stone-900">
              {delivery.items.length} produit{delivery.items.length > 1 ? 's' : ''}
            </p>
            <span className="text-xs text-stone-400">
              {daysUntil === 0
                ? "Aujourd'hui"
                : daysUntil === 1
                  ? 'Demain'
                  : `dans ${daysUntil}j`}
            </span>
          </div>
          <p className="text-xs text-stone-500 truncate">
            {delivery.items.map((i) => i.product_name).join(', ')}
          </p>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-stone-400 transition-transform flex-shrink-0 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="border-t border-stone-100 px-3 pb-3 pt-2 space-y-1.5">
          {delivery.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between bg-stone-50 rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Leaf className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-900 truncate">
                    {item.product_name}
                  </p>
                  <p className="text-xs text-stone-500">{item.producer_name}</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-stone-700 ml-3 flex-shrink-0">
                {item.quantity} {item.unit_type}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PastDeliveriesSection({
  pastDeliveries,
  expandedPast,
  setExpandedPast,
  formatDateFull,
  getDayOfWeek,
  formatDateShort,
}: {
  pastDeliveries: GroupedDelivery[];
  expandedPast: boolean;
  setExpandedPast: (v: boolean) => void;
  formatDateFull: (d: string) => string;
  getDayOfWeek: (d: string) => string;
  formatDateShort: (d: string) => string;
}) {
  return (
    <div>
      <button
        onClick={() => setExpandedPast(!expandedPast)}
        className="w-full flex items-center justify-between bg-white rounded-xl border border-stone-200 p-4 hover:bg-stone-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
            <Clock className="w-4 h-4 text-stone-500" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-stone-900">Historique</p>
            <p className="text-xs text-stone-500">
              {pastDeliveries.length} livraison{pastDeliveries.length > 1 ? 's' : ''} passee{pastDeliveries.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {expandedPast ? (
          <ChevronUp className="w-4 h-4 text-stone-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-stone-400" />
        )}
      </button>

      {expandedPast && (
        <div className="mt-2 space-y-2">
          {pastDeliveries.map((delivery) => (
            <div
              key={delivery.date}
              className="bg-white rounded-xl border border-stone-200 p-4"
            >
              <p className="text-sm font-semibold text-stone-900 capitalize mb-2">
                {formatDateFull(delivery.date)}
              </p>
              <div className="space-y-1.5">
                {delivery.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Leaf className="w-3 h-3 text-stone-400 flex-shrink-0" />
                      <span className="text-stone-700 truncate">{item.product_name}</span>
                      <span className="text-xs text-stone-400">({item.producer_name})</span>
                    </div>
                    <span className="text-stone-600 font-medium ml-2 flex-shrink-0">
                      {item.quantity} {item.unit_type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
