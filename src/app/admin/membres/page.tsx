'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users } from 'lucide-react';
import { DataTable } from '@/components/admin/DataTable';
import { formatDate } from '@/lib/utils';
import type { Profile } from '@/types/database';

const roleLabels: Record<string, string> = {
  member: 'Adhérent',
  producer: 'Producteur',
  referent: 'Référent',
  treasurer: 'Trésorier',
  admin: 'Admin',
  superadmin: 'Super Admin',
};

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: 'Actif', color: 'bg-green-100 text-green-800' },
  inactive: { label: 'Inactif', color: 'bg-red-100 text-red-800' },
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
};

export default function MembersPage() {
  const [members, setMembers] = useState<Profile[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const supabase = createClient();

  useEffect(() => {
    async function fetchMembers() {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        setMembers(data || []);
        setFilteredMembers(data || []);
      } finally {
        setLoading(false);
      }
    }

    fetchMembers();
  }, [supabase]);

  useEffect(() => {
    const filtered = members.filter(
      (member) =>
        member.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredMembers(filtered);
  }, [searchQuery, members]);

  const rows = filteredMembers.map((member) => [
    `${member.first_name} ${member.last_name}`,
    member.email,
    roleLabels[member.role] || member.role,
    <span
      key={`status-${member.id}`}
      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
        statusLabels[member.status]?.color || 'bg-gray-100 text-gray-800'
      }`}
    >
      {statusLabels[member.status]?.label || member.status}
    </span>,
    formatDate(member.created_at),
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestion des membres</h1>
            <p className="text-sm text-slate-600">{filteredMembers.length} membre(s)</p>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <DataTable
          headers={['Nom', 'Email', 'Rôle', 'Statut', 'Inscrit le']}
          rows={rows}
          searchPlaceholder="Rechercher par nom ou email..."
          onSearch={setSearchQuery}
        />
      </div>
    </div>
  );
}
