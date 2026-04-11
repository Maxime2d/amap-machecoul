'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Plus, Trash2, Users, Check, Loader2 } from 'lucide-react';

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

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function AdminPermanencesPage() {
  const [periods, setPeriods] = useState<ShiftPeriod[]>([]);
  const [shiftDates, setShiftDates] = useState<ShiftDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newCapacity, setNewCapacity] = useState(3);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const supabase = createClient();

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2500);
  };

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

  const getWeekday = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    const weekdays = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
    return weekdays[date.getDay()];
  };

  const getDayNumber = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.getDate();
  };

  const getMonthYear = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase();
  };

  const handleAddDate = async () => {
    if (!newDate || !selectedPeriod) {
      addToast('Veuillez sélectionner une date et une période', 'error');
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
      addToast('Erreur: ' + error.message, 'error');
      return;
    }

    addToast('Permanence ajoutée avec succès', 'success');
    setNewDate('');
    setNewCapacity(3);
    setShowForm(false);
    fetchData();
  };

  const handleDeleteDate = async (id: string) => {
    setDeletingId(id);
    try {
      await supabase.from('volunteer_shifts').delete().eq('shift_date_id', id);
      const { error } = await supabase.from('shift_dates').delete().eq('id', id);
      if (error) {
        addToast('Erreur: ' + error.message, 'error');
        return;
      }
      addToast('Permanence supprimée', 'success');
      fetchData();
    } finally {
      setDeletingId(null);
    }
  };

  const isPast = (dateStr: string) => {
    return new Date(dateStr + 'T23:59:59') < new Date();
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingDates = shiftDates.filter(d => d.date >= todayStr);
  const pastDates = shiftDates.filter(d => d.date < todayStr);
  const totalVolunteers = shiftDates.reduce((sum, d) => sum + d.volunteer_count, 0);
  const totalCapacity = shiftDates.reduce((sum, d) => sum + d.capacity, 0);
  const avgFillRate = totalCapacity > 0 ? Math.round((totalVolunteers / totalCapacity) * 100) : 0;

  // Group shifts by month
  const groupedByMonth: { [key: string]: ShiftDate[] } = {};
  shiftDates.forEach(shift => {
    const monthYear = getMonthYear(shift.date);
    if (!groupedByMonth[monthYear]) {
      groupedByMonth[monthYear] = [];
    }
    groupedByMonth[monthYear].push(shift);
  });

  const months = Object.keys(groupedByMonth).sort((a, b) => {
    const dateA = new Date(groupedByMonth[a][0].date + 'T00:00:00');
    const dateB = new Date(groupedByMonth[b][0].date + 'T00:00:00');
    return dateA.getTime() - dateB.getTime();
  });

  // Volunteer dots
  const renderVolunteerDots = (shift: ShiftDate) => {
    const dots = [];
    for (let i = 0; i < shift.capacity; i++) {
      const isFilled = i < shift.volunteer_count;
      dots.push(
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${
            isFilled ? 'bg-emerald-500' : 'bg-stone-300'
          }`}
        />
      );
    }
    return dots;
  };

  // Confirmed volunteers
  const confirmedVolunteers = (shift: ShiftDate) => {
    return shift.volunteers.filter(v => v.status === 'confirmed');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in fade-in slide-in-from-top-2 ${
              toast.type === 'success'
                ? 'bg-emerald-500 text-white'
                : toast.type === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-stone-800 text-white'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-200">
              <Calendar className="w-6 h-6 text-stone-700" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-stone-900">Gestion des permanences</h1>
              <p className="text-sm text-stone-600">{shiftDates.length} date(s) programmée(s)</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Ajouter une date
          </button>
        </div>

        {/* Stats - Compact inline blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
            <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">Prochaines permanences</div>
            <div className="text-3xl font-extrabold text-emerald-900">{upcomingDates.length}</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Bénévoles inscrits</div>
            <div className="text-3xl font-extrabold text-blue-900">{totalVolunteers}</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Taux de remplissage</div>
            <div className="text-3xl font-extrabold text-amber-900">{avgFillRate}%</div>
          </div>
        </div>

        {/* Period Filter */}
        {periods.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {periods.map((period) => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id)}
                className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors whitespace-nowrap ${
                  selectedPeriod === period.id
                    ? 'bg-green-600 text-white'
                    : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-50'
                }`}
              >
                {period.name}
              </button>
            ))}
          </div>
        )}

        {/* Add Form - Collapsible */}
        {showForm && (
          <div className="bg-white rounded-xl border border-stone-300 p-6 shadow-sm">
            <h3 className="text-lg font-extrabold text-stone-900 mb-4">Nouvelle permanence</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Capacité</label>
                <input
                  type="number"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(parseInt(e.target.value) || 3)}
                  min={1}
                  max={10}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Période</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
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
                className="px-4 py-2 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 transition-colors font-medium text-sm"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Shifts List - Grouped by Month */}
        {shiftDates.length > 0 ? (
          <div className="space-y-8">
            {months.map((monthYear) => (
              <div key={monthYear}>
                <h2 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider mb-3">
                  {monthYear}
                </h2>
                <div className="space-y-2">
                  {groupedByMonth[monthYear].map((shift) => (
                    <div
                      key={shift.id}
                      className={`bg-white rounded-xl border border-stone-300 p-4 flex items-center justify-between transition-opacity ${
                        isPast(shift.date) ? 'opacity-50' : ''
                      }`}
                    >
                      {/* Date Block */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="w-14 text-center">
                          <div className="text-2xl font-extrabold text-stone-900">
                            {getDayNumber(shift.date)}
                          </div>
                          <div className="text-xs font-semibold text-stone-600 uppercase">
                            {getWeekday(shift.date)}
                          </div>
                        </div>
                        <div className="border-l border-stone-300 pl-3">
                          <div className="text-sm font-medium text-stone-900">{formatDate(shift.date)}</div>
                          <div className="text-xs text-stone-500">17:00 - 19:00</div>
                        </div>
                      </div>

                      {/* Volunteer Dots */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {renderVolunteerDots(shift)}
                        <span className="text-xs text-stone-600 font-medium ml-2">
                          {shift.volunteer_count}/{shift.capacity}
                        </span>
                      </div>

                      {/* Volunteer Badges */}
                      <div className="flex flex-wrap gap-1.5 flex-1 px-4">
                        {confirmedVolunteers(shift).length > 0 ? (
                          confirmedVolunteers(shift).map((v, i) => (
                            <span
                              key={i}
                              className="inline-block px-2 py-1 bg-stone-100 text-stone-700 rounded-full text-xs font-medium"
                            >
                              {v.first_name} {v.last_name.charAt(0)}.
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-stone-400 italic">Aucun inscrit</span>
                        )}
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteDate(shift.id)}
                        disabled={deletingId === shift.id}
                        className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-red-50 text-stone-600 hover:text-red-600 transition-colors flex-shrink-0 disabled:opacity-50"
                        title="Supprimer"
                      >
                        {deletingId === shift.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-stone-300 p-12 text-center">
            <Calendar className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <h3 className="text-lg font-extrabold text-stone-900 mb-2">Aucune permanence programmée</h3>
            <p className="text-stone-600 mb-6">Commencez par ajouter une première date de permanence</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Ajouter une date
            </button>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-stone-100 border border-stone-300 rounded-xl p-4">
          <p className="text-sm text-stone-900">
            <strong>Info :</strong> Les permanences sont programmées par défaut le vendredi de 17h à 19h.
            Chaque adhérent peut s'inscrire via son espace personnel. Vous pouvez ajouter ou supprimer des dates ici.
          </p>
        </div>
      </div>
    </div>
  );
}
