'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, Check, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Profile } from '@/types/database';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

const roleLabels: Record<string, string> = {
  member: 'Adhérent', producer: 'Producteur', referent: 'Référent',
  treasurer: 'Trésorier', admin: 'Admin', superadmin: 'Super Admin',
};

const statusConfig: Record<string, { label: string; dot: string; bg: string }> = {
  active: { label: 'Actif', dot: 'bg-green-500', bg: 'bg-green-50 text-green-700 border-green-200' },
  inactive: { label: 'Inactif', dot: 'bg-stone-400', bg: 'bg-stone-100 text-stone-600 border-stone-200' },
  pending: { label: 'En attente', dot: 'bg-amber-500', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const roleOptions = ['member', 'producer', 'referent', 'treasurer', 'admin', 'superadmin'];
const statusOptions = ['active', 'inactive', 'pending'];

export default function MembersPage() {
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchMembers() {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      setMembers(data || []);
      setLoading(false);
    }
    fetchMembers();
  }, [supabase]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setUpdating(memberId);
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', memberId);
    if (!error) {
      setMembers(members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));
      showToast(`Rôle modifié → ${roleLabels[newRole]}`);
    }
    setUpdating(null);
  };

  const handleStatusChange = async (memberId: string, newStatus: string) => {
    setUpdating(memberId);
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', memberId);
    if (!error) {
      setMembers(members.map((m) => (m.id === memberId ? { ...m, status: newStatus } : m)));
      showToast(`Statut modifié → ${statusConfig[newStatus]?.label}`);
    }
    setUpdating(null);
  };

  // Filtered list
  const filtered = members.filter((m) => {
    if (activeTab !== 'all' && m.status !== activeTab) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return `${m.first_name} ${m.last_name}`.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
    }
    return true;
  });

  const counts = {
    all: members.length,
    active: members.filter((m) => m.status === 'active').length,
    pending: members.filter((m) => m.status === 'pending').length,
    inactive: members.filter((m) => m.status === 'inactive').length,
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="h-8 w-48 bg-stone-200 rounded-lg animate-pulse mb-6" />
        {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-white rounded-xl border border-stone-200 animate-pulse mb-2" />)}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-xl shadow-xl animate-in slide-in-from-top">
          <Check className="w-4 h-4 text-green-400" />
          {toast}
        </div>
      )}

      {/* Header */}
      <AdminPageHeader
        title="Membres"
        subtitle={`${members.length} inscrits au total`}
        imageUrl="https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=900&q=75"
      />

      {/* Tabs with counts */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto">
        {[
          { key: 'all', label: 'Tous' },
          { key: 'active', label: 'Actifs' },
          { key: 'pending', label: 'En attente' },
          { key: 'inactive', label: 'Inactifs' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-green-600 text-white'
                : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-300'
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-md ${
              activeTab === tab.key ? 'bg-white/20' : 'bg-stone-100'
            }`}>
              {counts[tab.key as keyof typeof counts]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          type="text"
          placeholder="Rechercher par nom ou email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        {searchQuery && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-stone-400">
            {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Members list */}
      <div className="space-y-1.5">
        {filtered.length > 0 ? filtered.map((member) => {
          const isUpdating = updating === member.id;
          const status = statusConfig[member.status] || statusConfig.active;

          return (
            <div
              key={member.id}
              className={`flex items-center gap-4 p-3.5 bg-white rounded-xl border border-stone-200 hover:border-stone-300 transition-colors ${isUpdating ? 'opacity-70' : ''}`}
            >
              {/* Avatar */}
              <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">
                {member.first_name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-stone-900 truncate">
                    {member.first_name} {member.last_name}
                  </p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full border ${status.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                </div>
                <p className="text-xs text-stone-500 truncate">{member.email}{member.phone ? ` · ${member.phone}` : ''}</p>
              </div>

              {/* Role selector */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {isUpdating && <Loader2 className="w-3.5 h-3.5 text-stone-400 animate-spin" />}
                <select
                  value={member.role}
                  onChange={(e) => handleRoleChange(member.id, e.target.value)}
                  disabled={isUpdating}
                  className="text-xs font-medium px-2 py-1.5 border border-stone-200 rounded-lg bg-white hover:border-stone-300 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 cursor-pointer"
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>{roleLabels[role]}</option>
                  ))}
                </select>
                <select
                  value={member.status}
                  onChange={(e) => handleStatusChange(member.id, e.target.value)}
                  disabled={isUpdating}
                  className="text-xs font-medium px-2 py-1.5 border border-stone-200 rounded-lg bg-white hover:border-stone-300 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 cursor-pointer"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>{statusConfig[s]?.label}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <span className="text-xs text-stone-400 flex-shrink-0 hidden sm:block">{formatDate(member.created_at)}</span>
            </div>
          );
        }) : (
          <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center">
            <p className="font-bold text-stone-700">Aucun membre trouvé</p>
            <p className="text-sm text-stone-500 mt-1">Essayez un autre filtre ou terme de recherche.</p>
          </div>
        )}
      </div>
    </div>
  );
}
