'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Package, Calendar, Download, Printer, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

interface ModelDate {
  id: string;
  model_id: string;
  delivery_date: string;
  is_cancelled: boolean;
  cancel_reason: string | null;
}

interface ContractItem {
  id: string;
  contract_id: string;
  product_id: string;
  delivery_date: string;
  quantity: number;
  is_joker: boolean;
}

interface Product {
  id: string;
  name: string;
  unit_type: string;
  producer_id: string;
}

interface Producer {
  id: string;
  name: string;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
}

interface Contract {
  id: string;
  user_id: string;
  model_id: string;
  status: string;
}

interface DistributionData {
  memberId: string;
  memberName: string;
  [productId: string]: number | string | boolean;
}

interface ProducerDistribution {
  producerId: string;
  producerName: string;
  products: Product[];
  members: DistributionData[];
  totals: { [productId: string]: number };
}

interface Summary {
  productId: string;
  productName: string;
  totalQuantity: number;
  unit: string;
}

export default function DistributionsPage() {
  const [upcomingDates, setUpcomingDates] = useState<ModelDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateData, setSelectedDateData] = useState<ModelDate | null>(null);
  const [distributions, setDistributions] = useState<ProducerDistribution[]>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Fetch upcoming distribution dates
  useEffect(() => {
    async function fetchUpcomingDates() {
      try {
        setLoading(true);
        setError(null);

        const today = new Date().toISOString().split('T')[0];

        const { data, error: fetchError } = await supabase
          .from('model_dates')
          .select('*')
          .gte('delivery_date', today)
          .eq('is_cancelled', false)
          .order('delivery_date', { ascending: true });

        if (fetchError) throw fetchError;

        // Deduplicate by delivery_date — model_dates has one row per contract model
        const seen = new Set<string>();
        const unique = (data || []).filter((d: ModelDate) => {
          if (seen.has(d.delivery_date)) return false;
          seen.add(d.delivery_date);
          return true;
        });
        setUpcomingDates(unique);
      } catch (err) {
        console.error('Error fetching distribution dates:', err);
        setError('Erreur lors du chargement des dates de distribution');
      } finally {
        setLoading(false);
      }
    }

    fetchUpcomingDates();
  }, [supabase]);

  // Fetch distribution data when a date is selected
  useEffect(() => {
    if (!selectedDate) {
      setDistributions([]);
      setSummaries([]);
      return;
    }

    async function fetchDistributionData() {
      try {
        setDataLoading(true);
        setError(null);

        // Find the selected date object (use first matching since we deduplicated)
        const dateObj = upcomingDates.find((d) => d.delivery_date === selectedDate);
        setSelectedDateData(dateObj || null);

        // Fetch all contract items for this delivery date
        const { data: items, error: itemsError } = await supabase
          .from('contract_items')
          .select(`
            id,
            contract_id,
            product_id,
            delivery_date,
            quantity,
            is_joker,
            contracts!inner (
              id,
              user_id,
              model_id,
              status,
              profiles:user_id (
                id,
                first_name,
                last_name
              )
            ),
            products!inner (
              id,
              name,
              unit_type,
              producer_id
            )
          `)
          .eq('delivery_date', selectedDate);

        if (itemsError) throw itemsError;

        // Fetch producers for all products
        const { data: producers, error: producersError } = await supabase
          .from('producers')
          .select('id, name');

        if (producersError) throw producersError;

        // Group data by producer
        const distributionMap = new Map<
          string,
          {
            producerId: string;
            producerName: string;
            products: Map<string, Product>;
            members: Map<string, DistributionData>;
          }
        >();

        const producerMap = new Map(producers.map((p: Producer) => [p.id, p]));

        // Build the distribution structure
        if (items && Array.isArray(items)) {
          for (const item of items) {
            const product = item.products as Product;
            const contract = item.contracts as unknown as {
              id: string;
              user_id: string;
              model_id: string;
              status: string;
              profiles?: Profile;
            };

            const producerId = product.producer_id;
            const producerName =
              producerMap.get(producerId)?.name || 'Unknown Producer';

            // Initialize producer distribution if not exists
            if (!distributionMap.has(producerId)) {
              distributionMap.set(producerId, {
                producerId,
                producerName,
                products: new Map(),
                members: new Map(),
              });
            }

            const dist = distributionMap.get(producerId)!;

            // Add product
            if (!dist.products.has(product.id)) {
              dist.products.set(product.id, product);
            }

            // Add or update member
            const memberId = contract.user_id;
            const memberName = contract.profiles
              ? `${contract.profiles.first_name} ${contract.profiles.last_name}`
              : 'Unknown Member';

            if (!dist.members.has(memberId)) {
              dist.members.set(memberId, {
                memberId,
                memberName,
              });
            }

            const member = dist.members.get(memberId)!;
            member[product.id] = item.quantity;

            // Mark joker items with an indicator
            if (item.is_joker) {
              member[`${product.id}_joker`] = true;
            }
          }
        }

        // Convert maps to arrays
        const distributionsArray: ProducerDistribution[] = Array.from(
          distributionMap.values()
        ).map((dist) => ({
          producerId: dist.producerId,
          producerName: dist.producerName,
          products: Array.from(dist.products.values()),
          members: Array.from(dist.members.values()),
          totals: calculateTotals(
            Array.from(dist.members.values()),
            Array.from(dist.products.keys())
          ),
        }));

        setDistributions(distributionsArray);

        // Calculate summaries
        const summaryMap = new Map<string, Summary>();
        if (items && Array.isArray(items)) {
          for (const item of items) {
            const product = item.products as Product;
            const key = product.id;

            if (!summaryMap.has(key)) {
              summaryMap.set(key, {
                productId: product.id,
                productName: product.name,
                totalQuantity: 0,
                unit: product.unit_type,
              });
            }

            const summary = summaryMap.get(key)!;
            summary.totalQuantity += item.quantity;
          }
        }

        setSummaries(Array.from(summaryMap.values()));
      } catch (err) {
        console.error('Error fetching distribution data:', err);
        setError('Erreur lors du chargement des données de distribution');
      } finally {
        setDataLoading(false);
      }
    }

    fetchDistributionData();
  }, [selectedDate, upcomingDates, supabase]);

  // Helper function to calculate totals per product
  function calculateTotals(
    members: DistributionData[],
    productIds: string[]
  ): { [productId: string]: number } {
    const totals: { [productId: string]: number } = {};
    for (const productId of productIds) {
      totals[productId] = members.reduce((sum, member) => {
        const qty = member[productId];
        return sum + (typeof qty === 'number' ? qty : 0);
      }, 0);
    }
    return totals;
  }

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Handle CSV export
  const handleExportCSV = () => {
    if (distributions.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += '\uFEFF'; // BOM for Excel UTF-8

    // Add title
    csvContent += `Feuille de distribution - ${selectedDate ? formatDate(selectedDate) : ''}\n\n`;

    // For each producer
    distributions.forEach((producer) => {
      csvContent += `${producer.producerName}\n`;
      csvContent += 'Adhérent';

      // Header with product names
      producer.products.forEach((product) => {
        csvContent += `,${product.name}`;
      });
      csvContent += ',Total\n';

      // Member rows
      producer.members.forEach((member) => {
        csvContent += `"${member.memberName}"`;
        let total = 0;

        producer.products.forEach((product) => {
          const qty = member[product.id];
          csvContent += `,${typeof qty === 'number' ? qty : ''}`;
          total += typeof qty === 'number' ? qty : 0;
        });

        csvContent += `,${total}\n`;
      });

      // Totals row
      csvContent += 'TOTAL';
      producer.products.forEach((product) => {
        csvContent += `,${producer.totals[product.id] || 0}`;
      });
      csvContent += '\n\n';
    });

    // Add summary
    csvContent += '\nRésumé par produit\n';
    csvContent += 'Produit,Quantité,Unité\n';
    summaries.forEach((summary) => {
      csvContent += `"${summary.productName}",${summary.totalQuantity},${summary.unit}\n`;
    });

    // Download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `distribution_${selectedDate || 'export'}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get unit type label
  const getUnitLabel = (unitType: string): string => {
    const labels: { [key: string]: string } = {
      unit: 'unité',
      weight: 'kg',
      volume: 'L',
      bundle: 'lot',
    };
    return labels[unitType] || unitType;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Chargement des dates de distribution...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }

          .no-print {
            display: none !important;
          }

          .print-section {
            page-break-inside: avoid;
            margin-bottom: 2cm;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1cm;
          }

          th, td {
            border: 1px solid #000;
            padding: 6px;
            font-size: 11pt;
          }

          th {
            background-color: #f3f4f6;
            font-weight: bold;
          }

          h1, h2 {
            margin: 0 0 12pt 0;
          }

          .bg-green-50,
          .bg-slate-50 {
            background-color: #f9fafb;
          }

          .text-green-900 {
            color: #000;
          }

          .text-slate-900,
          .text-slate-700 {
            color: #000;
          }
        }
      `}</style>

      {/* Header */}
      <AdminPageHeader
        title="Distributions"
        subtitle="Gestion des dates de distribution"
        imageUrl="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=900&q=75"
      />

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg no-print">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Date Selector */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm no-print">
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Sélectionnez une date de distribution
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {upcomingDates.map((date) => (
            <button
              key={date.id}
              onClick={() => setSelectedDate(date.delivery_date)}
              className={`p-4 rounded-lg border-2 transition-colors text-left ${
                selectedDate === date.delivery_date
                  ? 'border-green-600 bg-green-50'
                  : 'border-slate-200 bg-white hover:border-green-400'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-slate-600" />
                <p className="font-semibold text-slate-900">
                  {formatDate(date.delivery_date)}
                </p>
              </div>
              <p className="text-xs text-slate-600">
                {new Date(date.delivery_date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                })}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Cancelled date notice */}
      {selectedDateData && selectedDateData.is_cancelled && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Distribution annulée</p>
            <p className="text-sm text-red-700 mt-1">
              {selectedDateData.cancel_reason || 'Aucune raison spécifiée'}
            </p>
          </div>
        </div>
      )}

      {/* Distribution Tables */}
      {selectedDate && !dataLoading && distributions.length > 0 && (
        <>
          {/* Action Buttons */}
          <div className="flex gap-3 no-print">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              <Printer className="w-4 h-4" />
              Imprimer
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium text-sm"
            >
              <Download className="w-4 h-4" />
              Exporter en Excel
            </button>
          </div>

          {/* Distribution Tables by Producer */}
          <div className="space-y-8">
            {distributions.map((producer) => (
              <div
                key={producer.producerId}
                className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm print-section"
              >
                {/* Producer Header */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
                  <h2 className="text-lg font-bold text-green-900">
                    {producer.producerName}
                  </h2>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 w-48">
                          Adhérent
                        </th>
                        {producer.products.map((product) => (
                          <th
                            key={product.id}
                            className="px-4 py-3 text-center text-sm font-semibold text-slate-900 min-w-32"
                          >
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-slate-600 font-normal">
                              ({getUnitLabel(product.unit_type)})
                            </div>
                          </th>
                        ))}
                        <th className="px-4 py-3 text-center text-sm font-semibold text-slate-900 min-w-24">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {producer.members.map((member, idx) => (
                        <tr
                          key={member.memberId}
                          className={`border-b border-slate-200 ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                          }`}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">
                            {member.memberName}
                          </td>
                          {producer.products.map((product) => {
                            const qty = member[product.id];
                            const isJoker = member[`${product.id}_joker`];

                            return (
                              <td
                                key={product.id}
                                className={`px-4 py-3 text-center text-sm ${
                                  isJoker ? 'bg-orange-100' : ''
                                }`}
                              >
                                <span
                                  className={
                                    isJoker ? 'font-semibold text-orange-900' : 'text-slate-700'
                                  }
                                >
                                  {typeof qty === 'number' ? qty : '-'}
                                </span>
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-center text-sm font-semibold text-slate-900">
                            {producer.products.reduce((sum, product) => {
                              const qty = member[product.id];
                              return (
                                sum + (typeof qty === 'number' ? qty : 0)
                              );
                            }, 0)}
                          </td>
                        </tr>
                      ))}

                      {/* Totals Row */}
                      <tr className="bg-green-50 border-t-2 border-green-200">
                        <td className="px-4 py-3 text-sm font-bold text-green-900">
                          TOTAL
                        </td>
                        {producer.products.map((product) => (
                          <td
                            key={product.id}
                            className="px-4 py-3 text-center text-sm font-bold text-green-900"
                          >
                            {producer.totals[product.id] || 0}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center text-sm font-bold text-green-900">
                          {Object.values(producer.totals).reduce(
                            (sum, val) => sum + val,
                            0
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Section */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm print-section">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              Résumé par produit
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                      Produit
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-900">
                      Quantité
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-900">
                      Unité
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {summaries.map((summary, idx) => (
                    <tr
                      key={summary.productId}
                      className={`border-b border-slate-200 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {summary.productName}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-slate-700">
                        {summary.totalQuantity}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-slate-700">
                        {getUnitLabel(summary.unit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {selectedDate && !dataLoading && distributions.length === 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center no-print">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600">
            Aucune distribution trouvée pour cette date
          </p>
        </div>
      )}

      {selectedDate && dataLoading && (
        <div className="flex items-center justify-center h-64 no-print">
          <div className="text-slate-500">Chargement des données...</div>
        </div>
      )}
    </div>
  );
}
