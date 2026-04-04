'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Tractor, Plus } from 'lucide-react';
import { DataTable } from '@/components/admin/DataTable';
import Link from 'next/link';
import type { Producer } from '@/types/database';

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: 'Actif', color: 'bg-green-100 text-green-800' },
  inactive: { label: 'Inactif', color: 'bg-red-100 text-red-800' },
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
};

export default function ProducersPage() {
  const [producers, setProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchProducers() {
      try {
        const { data } = await supabase
          .from('producers')
          .select('*')
          .order('name', { ascending: true });
        setProducers(data || []);
      } finally {
        setLoading(false);
      }
    }

    fetchProducers();
  }, [supabase]);

  const rows = producers.map((producer) => [
    producer.name,
    producer.city || '-',
    producer.slug,
    <span
      key={`status-${producer.id}`}
      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
        statusLabels[producer.status]?.color || 'bg-gray-100 text-gray-800'
      }`}
    >
      {statusLabels[producer.status]?.label || producer.status}
    </span>,
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
            <Tractor className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestion des producteurs</h1>
            <p className="text-sm text-slate-600">{producers.length} producteur(s)</p>
          </div>
        </div>
        <Link
          href="#"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Ajouter un producteur
        </Link>
      </div>

      {/* Producers Table */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <DataTable
          headers={['Nom', 'Ville', 'Slug', 'Statut']}
          rows={rows}
        />
      </div>
    </div>
  );
}
