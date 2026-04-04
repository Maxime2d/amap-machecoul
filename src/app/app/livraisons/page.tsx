
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
      }      // Group contract_items by delivery_date across all contracts
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
  }, [supabase]);  useEffect(() => {
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

  const getNextDeliveryDate = (): string | null => {
    return upcomingDeliveries.length > 0 ? upcomingDeliveries[0].date : null;
  };

  const isNextDelivery = (date: string): boolean => {
    const nextDate = getNextDeliveryDate();
    return nextDate === date;
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-6xl">
        <div>
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
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 md:p-8 max-w-6xl">
        <div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold">Erreur</h2>
            <p className="text-red-700 mt-2">{error}</p>
          </div>
        </div>
      </div>
    );
  }  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <div>
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mes livraisons</h1>
          <p className="text-gray-600 mt-2">
            Consultez vos livraisons à venir et historique des livraisons passées
          </p>
        </div>

        {/* Summary Card */}
        {upcomingDeliveries.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-l-4 border-green-600">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <p className="text-gray-600 font-medium">Prochaine livraison</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDate(upcomingDeliveries[0].date)}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Package className="w-5 h-5 text-green-600" />
                  <p className="text-gray-600 font-medium">Livraisons à venir</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {upcomingDeliveries.length}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {upcomingDeliveries.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 mb-8 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Aucune livraison à venir
            </h2>
            <p className="text-gray-600">
              Vos livraisons apparaîtront ici dès qu'elles seront planifiées
            </p>
          </div>
        )}        {/* Upcoming Deliveries */}
        {upcomingDeliveries.length > 0 && (
          <div className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Livraisons à venir</h2>
            {upcomingDeliveries.map((delivery) => (
              <div
                key={delivery.date}
                className={`rounded-lg shadow-md overflow-hidden transition-all ${
                  isNextDelivery(delivery.date)
                    ? 'bg-green-50 border-2 border-green-600'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <div
                  className={`p-6 ${
                    isNextDelivery(delivery.date)
                      ? 'bg-green-100 border-b border-green-200'
                      : 'bg-gray-50 border-b border-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isNextDelivery(delivery.date) && (
                        <div className="flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          <CheckCircle className="w-4 h-4" />
                          Prochaine livraison
                        </div>
                      )}
                      <h3 className="text-lg font-bold text-gray-900">
                        {formatDate(delivery.date)}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  {delivery.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">
                          {item.product_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          De {item.producer_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {item.quantity} {item.unit_type}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}        {/* Past Deliveries Section */}
        {pastDeliveries.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <button
              onClick={() => setExpandedPast(!expandedPast)}
              className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  Livraisons passées
                </h2>
                <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  {pastDeliveries.length}
                </span>
              </div>
              {expandedPast ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {expandedPast && (
              <div className="border-t border-gray-200 space-y-4 p-6">
                {pastDeliveries.map((delivery) => (
                  <div
                    key={delivery.date}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-100"
                  >
                    <p className="font-semibold text-gray-900 mb-3">
                      {formatDate(delivery.date)}
                    </p>
                    <div className="space-y-2">
                      {delivery.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <div>
                            <p className="text-gray-900">{item.product_name}</p>
                            <p className="text-gray-600 text-xs">
                              {item.producer_name}
                            </p>
                          </div>
                          <p className="text-gray-900 font-medium">
                            {item.quantity} {item.unit_type}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
