'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FileText, Plus } from 'lucide-react';
import { DataTable } from '@/components/admin/DataTable';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import type { ContractModel, Producer } from '@/types/database';

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
  open: { label: 'Ouvert', color: 'bg-blue-100 text-blue-800' },
  active: { label: 'Actif', color: 'bg-green-100 text-green-800' },
  closed: { label: 'Fermé', color: 'bg-red-100 text-red-800' },
  archived: { label: 'Archivé', color: 'bg-slate-100 text-slate-800' },
};

interface ContractWithProducer extends ContractModel {
  producer?: { name: string };
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<ContractWithProducer[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<ContractWithProducer[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const supabase = createClient();

  useEffect(() => {
    async function fetchContracts() {
      try {
        const { data } = await supabase
          .from('contract_models')
          .select('*, producer:producers(name)')
          .order('created_at', { ascending: false });
        setContracts(data || []);
        setFilteredContracts(data || []);
      } finally {
        setLoading(false);
      }
    }

    fetchContracts();
  }, [supabase]);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredContracts(contracts);
    } else {
      setFilteredContracts(
        contracts.filter((contract) => contract.status === statusFilter)
      );
    }
  }, [statusFilter, contracts]);

  const rows = filteredContracts.map((contract) => [
    contract.name,
    (contract.producer as any)?.name || '-',
    contract.nature === 'subscription' ? 'Abonnement' : 'Flexible',
    <span
      key={`status-${contract.id}`}
      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
        statusLabels[contract.status]?.color || 'bg-gray-100 text-gray-800'
      }`}
    >
      {statusLabels[contract.status]?.label || contract.status}
    </span>,
    `${formatDate(contract.start_date)} au ${formatDate(contract.end_date)}`,
    contract.enroll_start && contract.enroll_end ? 'Ouvert' : 'Fermé',
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Chargement...</div>
      </div>
    );
  }

  const statuses = ['all', 'draft', 'open', 'active', 'closed', 'archived'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
            <FileText className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestion des contrats</h1>
            <p className="text-sm text-slate-600">{filteredContracts.length} contrat(s)</p>
          </div>
        </div>
        <Link
          href="#"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Créer un modèle
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
              statusFilter === status
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {status === 'all'
              ? 'Tous'
              : statusLabels[status]?.label || status}
          </button>
        ))}
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <DataTable
          headers={['Nom', 'Producteur', 'Nature', 'Statut', 'Période', 'Inscriptions']}
          rows={rows}
        />
      </div>
    </div>
  );
}
