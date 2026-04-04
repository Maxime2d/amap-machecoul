'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, UserCheck, UserPlus, Clock } from 'lucide-react';
import { DataTable } from '@/components/admin/DataTable';
import { StatsCard } from '@/components/admin/StatsCard';
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

const roleOptions = ['member', 'producer', 'referent', 'treasurer', 'admin', 'superadmin'];
const statusOptions = ['active', 'inactive', 'pending'];

export default function MembersPage() {  const [members, setMembers] = useState<Profile[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchMembers() {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        setMembers(data || []);
      } finally {
        setLoading(false);
      }
    }

    fetchMembers();
  }, [supabase]);

  useEffect(() => {
    let filtered = members;

    if (activeStatusFilter !== 'all') {
      filtered = filtered.filter((member) => member.status === activeStatusFilter);
    }

    filtered = filtered.filter(
      (member) =>
        member.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredMembers(filtered);
  }, [searchQuery, members, activeStatusFilter]);  const handleRoleChange = async (memberId: string, newRole: string) => {
    setUpdating(memberId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      setMembers(
        members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
    } catch (error) {
      console.error('Error updating role:', error);
    } finally {
      setUpdating(null);
    }
  };

  const handleStatusChange = async (memberId: string, newStatus: string) => {
    setUpdating(memberId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', memberId);

      if (error) throw error;

      setMembers(
        members.map((m) => (m.id === memberId ? { ...m, status: newStatus } : m))
      );
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdating(null);
    }
  };  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getColorForInitials = (id: string): string => {
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-teal-500',
    ];
    const index = id.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const stats = [
    {
      label: 'Membres totaux',
      value: members.length,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      label: 'Actifs',
      value: members.filter((m) => m.status === 'active').length,
      icon: UserCheck,
      color: 'text-green-600',
    },
    {
      label: 'En attente',
      value: members.filter((m) => m.status === 'pending').length,
      icon: UserPlus,
      color: 'text-yellow-600',
    },
    {
      label: 'Inactifs',
      value: members.filter((m) => m.status === 'inactive').length,
      icon: Clock,
      color: 'text-red-600',
    },
  ];  const rows = filteredMembers.map((member) => [
    <div key={`avatar-${member.id}`} className="flex items-center gap-3">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full text-white font-semibold text-sm ${getColorForInitials(
          member.id
        )}`}
      >
        {getInitials(member.first_name, member.last_name)}
      </div>
      <span>{`${member.first_name} ${member.last_name}`}</span>
    </div>,
    member.email,
    member.phone || '—',
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
    <div
      key={`actions-${member.id}`}
      className="flex gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      <select
        value={member.role}
        onChange={(e) => handleRoleChange(member.id, e.target.value)}
        disabled={updating === member.id}
        className="px-2 py-1 text-xs border border-slate-300 rounded bg-white hover:border-green-500 focus:border-green-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {roleOptions.map((role) => (
          <option key={role} value={role}>
            {roleLabels[role]}
          </option>
        ))}
      </select>
      <select
        value={member.status}
        onChange={(e) => handleStatusChange(member.id, e.target.value)}
        disabled={updating === member.id}
        className="px-2 py-1 text-xs border border-slate-300 rounded bg-white hover:border-green-500 focus:border-green-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {statusOptions.map((status) => (
          <option key={status} value={status}>
            {statusLabels[status]?.label}
          </option>
        ))}
      </select>
    </div>,
  ]);  if (loading) {
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
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestion des membres</h1>
            <p className="text-sm text-slate-600">{filteredMembers.length} membre(s)</p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2">        <button
          onClick={() => setActiveStatusFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeStatusFilter === 'all'
              ? 'bg-green-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Tous
        </button>
        <button
          onClick={() => setActiveStatusFilter('active')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeStatusFilter === 'active'
              ? 'bg-green-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Actifs
        </button>
        <button
          onClick={() => setActiveStatusFilter('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeStatusFilter === 'pending'
              ? 'bg-green-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          En attente
        </button>
        <button
          onClick={() => setActiveStatusFilter('inactive')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeStatusFilter === 'inactive'
              ? 'bg-green-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Inactifs
        </button>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <DataTable
          headers={['Nom', 'Email', 'Téléphone', 'Rôle', 'Statut', 'Inscrit le', 'Actions']}
          rows={rows}
          searchPlaceholder="Rechercher par nom ou email..."
          onSearch={setSearchQuery}
        />
      </div>
    </div>
  );
}