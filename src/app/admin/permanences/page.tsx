'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Plus, Trash2, Users, Clock } from 'lucide-react';
import { DataTable } from '@/components/admin/DataTable';
import { StatsCard } from '@/components/admin/StatsCard';

interface ShiftDate {
  id: string;
  date: string;
  capacity: number;
  period_id: string;
  volunteer_count: number;
  volunteers: { user_id: string; first_name: string; last_name: string; role: string; status: string }[];
}

interface ShiftPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  max_per_shift: number;
  status: string;
}

export default function AdminPermanencesPage() {
  const [periods, setPeriods] = useState<ShiftPeriod[]>([]);
  const [shiftDates, setShiftDates] = useState<ShiftDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newCapacity, setNewCapacity] = useState(3);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: periodsData } = await supabase
        .from('shift_periods')
        .select('*')
        .order('start_date', { ascending: false });

      setPeriods(periodsData || []);

      const activePeriod = periodsData?.find(p => p.status === 'active');
      if (activePeriod && !selectedPeriod) {
        setSelectedPeriod(activePeriod.id);
      }

      const periodId = selectedPeriod || activePeriod?.id;
      if (!periodId) {
        setShiftDates([]);
        setLoading(false);
        return;
      }

      const { data: datesData } = await supabase
        .from('shift_dates')
        .select(`
          id, date, capacity, period_id,
          volunteer_shifts (
            id, user_id, role, status,
            profiles ( first_name, last_name )
          )
        `)
        .eq('period_id', periodId)
        .order('date', { ascending: true });

      const enriched: ShiftDate[] = (datesData || []).map((d: any) => ({
        id: d.id,
        date: d.date,
        capacity: d.capacity,
        period_id: d.period_id,
        volunteer_count: d.volunteer_shifts?.filter((v: any) => v.status === 'confirmed').length || 0,
        volunteers: (d.volunteer_shifts || []).map((v: any) => ({
          user_id: v.user_id,
          first_name: v.profiles?.first_name || '',
          last_name: v.profiles?.last_name || '',
          role: v.role || 'distribution',
          status: v.status,
        })),
      }));

      setShiftDates(enriched);
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedPeriod]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleAddDate = async () => {
    if (!newDate || !selectedPeriod) {
      alert('Veuillez sélectionner une date et une période');
      return;
    }

    const { error } = await supabase
      .from('shift_dates')
      .insert({
        period_id: selectedPeriod,
        date: newDate,
        capacity: newCapacity,
      });

    if (error) {
      alert('Erreur: ' + error.message);
      return;
    }

    setNewDate('');
    setNewCapacity(3);
    setShowForm(false);
    fetchData();
  };

  const handleDeleteDate = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette permanence ?')) return;

    await supabase.from('volunteer_shifts').delete().eq('shift_date_id', id);
    const { error } = await supabase.from('shift_dates').delete().eq('id', id);
    if (error) {
      alert('Erreur: ' + error.message);
      return;
    }
    fetchData();
  };

  const isPast = (dateStr: string) => {
    return new Date(dateStr + 'T23:59:59') < new Date();
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingDates = shiftDates.filter(d => d.date >= todayStr);
  const pastDates = shiftDates.filter(d => d.date < todayStr);
  const totalVolunteers = shiftDates.reduce((sum, d) => sum + d.volunteer_count, 0);
  const avgFillRate = shiftDates.length > 0
    ? Math.round((totalVolunteers / shiftDates.reduce((sum, d) => sum + d.capacity, 0)) * 100)
    : 0;

  const getCapacityBadge = (count: number, capacity: number) => {
    const pct = (count / capacity) * 100;
    if (pct >= 100) return 'bg-red-100 text-red-800';
    if (pct >= 66) return 'bg-green-100 text-green-800';
    if (pct >= 33) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const rows = shiftDates.map((shift) => [
    <span key={`date-${shift.id}`} className={isPast(shift.date) ? 'text-gray-400' : 'font-medium'}>
      {formatDate(shift.date)}
    </span>,
    <span key={`time-${shift.id}`} className="text-gray-600">17:00 - 19:00</span>,
    <div key={`cap-${shift.id}`} className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[120px]">
        <div
          className="bg-green-600 h-2 rounded-full transition-all"
          style={{ width: `${Math.min((shift.volunteer_count / shift.capacity) * 100, 100)}%` }}
        />
      </div>
      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${getCapacityBadge(shift.volunteer_count, shift.capacity)}`}>
        {shift.volunteer_count}/{shift.capacity}
      </span>
    </div>,
    <div key={`vol-${shift.id}`} className="flex flex-wrap gap-1">
      {shift.volunteers.filter(v => v.status === 'confirmed').map((v, i) => (
        <span key={i} className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
          {v.first_name} {v.last_name.charAt(0)}.
        </span>
      ))}
      {shift.volunteers.filter(v => v.status === 'confirmed').length === 0 && (
        <span className="text-gray-400 text-xs">Aucun inscrit</span>
      )}
    </div>,
    <button
      key={`del-${shift.id}`}
      onClick={() => handleDeleteDate(shift.id)}
      className="inline-flex items-center gap-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors text-sm"
      title="Supprimer"
    >
      <Trash2 className="w-4 h-4" />
    </button>,
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
            <Calendar className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestion des permanences</h1>
            <p className="text-sm text-slate-600">{shiftDates.length} date(s) programmée(s)</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Ajouter une date
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Prochaines permanences"
          value={upcomingDates.length}
          icon={<Calendar className="w-6 h-6" />}
        />
        <StatsCard
          title="Bénévoles inscrits"
          value={totalVolunteers}
          icon={<Users className="w-6 h-6" />}
        />
        <StatsCard
          title="Taux de remplissage"
          value={`${avgFillRate}%`}
          icon={<Clock className="w-6 h-6" />}
          trend={avgFillRate >= 50 ? 'up' : 'down'}
        />
      </div>

      {/* Period Filter */}
      {periods.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {periods.map((period) => (
            <button
              key={period.id}
              onClick={() => setSelectedPeriod(period.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
                selectedPeriod === period.id
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {period.name}
            </button>
          ))}
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Nouvelle permanence</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Capacité</label>
              <input
                type="number"
                value={newCapacity}
                onChange={(e) => setNewCapacity(parseInt(e.target.value) || 3)}
                min={1}
                max={10}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Période</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <button
              onClick={handleAddDate}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
            >
              Ajouter
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        {shiftDates.length > 0 ? (
          <DataTable
            headers={['Date', 'Horaires', 'Inscriptions', 'Bénévoles', 'Action']}
            rows={rows}
          />
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Aucune permanence programmée</h3>
            <p className="text-slate-600 mb-4">Commencez par ajouter une première date de permanence</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Ajouter une date
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-900">
          <strong>Info :</strong> Les permanences sont programmées par défaut le vendredi de 17h à 19h.
          Chaque adhérent peut s'inscrire via son espace personnel. Vous pouvez ajouter ou supprimer des dates ici.
        </p>
      </div>
    </div>
  );
}
