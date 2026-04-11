'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Clock, CheckCircle, XCircle, Users, MapPin } from 'lucide-react';

interface ShiftDate {
  id: string;
  date: string;
  capacity: number;
  volunteer_count: number;
  is_signed_up: boolean;
  my_shift_id: string | null;
}

interface GroupedShifts {
  [monthKey: string]: ShiftDate[];
}

export default function MemberPermanencesPage() {
  const [shiftDates, setShiftDates] = useState<ShiftDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: activePeriod } = await supabase
      .from('shift_periods').select('id').eq('status', 'active').single();

    if (!activePeriod) { setShiftDates([]); setLoading(false); return; }

    const { data: dates } = await supabase
      .from('shift_dates')
      .select('id, date, capacity, volunteer_shifts ( id, user_id, status )')
      .eq('period_id', activePeriod.id)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true });

    const enriched: ShiftDate[] = (dates || []).map((d: any) => {
      const confirmed = (d.volunteer_shifts || []).filter((v: any) => v.status === 'confirmed');
      const myShift = confirmed.find((v: any) => v.user_id === user.id);
      return {
        id: d.id, date: d.date, capacity: d.capacity,
        volunteer_count: confirmed.length,
        is_signed_up: !!myShift,
        my_shift_id: myShift?.id || null,
      };
    });

    setShiftDates(enriched);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSignUp = async (shiftDateId: string) => {
    if (!userId) return;
    setActionLoading(shiftDateId);
    await supabase.from('volunteer_shifts').insert({
      shift_date_id: shiftDateId, user_id: userId, role: 'distribution', status: 'confirmed',
    });
    setActionLoading(null);
    fetchData();
  };

  const handleCancel = async (shiftId: string) => {
    setActionLoading(shiftId);
    await supabase.from('volunteer_shifts').delete().eq('id', shiftId);
    setActionLoading(null);
    fetchData();
  };

  const formatDateLong = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long',
    });
  };

  const getMonthKey = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  const groupShiftsByMonth = (): GroupedShifts => {
    return shiftDates.reduce((acc, shift) => {
      const key = getMonthKey(shift.date);
      if (!acc[key]) acc[key] = [];
      acc[key].push(shift);
      return acc;
    }, {} as GroupedShifts);
  };

  const mySignups = shiftDates.filter(d => d.is_signed_up);
  const groupedShifts = groupShiftsByMonth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] p-6 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="h-8 w-48 bg-stone-200 rounded-lg animate-pulse mb-6" />
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-white rounded-xl border border-stone-200 animate-pulse mb-2" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4] p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header + lieu */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">Permanences</h1>
          <div className="mt-3 p-4 bg-stone-900 rounded-xl flex items-start gap-3">
            <MapPin className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-white">Chaque vendredi · 17h — 19h</p>
              <p className="text-xs text-stone-400 mt-0.5">Pépinières Brenelière, Machecoul</p>
              <p className="text-xs text-stone-500 mt-1">Chaque adhérent participe à au moins 2 permanences par saison.</p>
            </div>
          </div>
        </div>

        {/* My signups summary */}
        {mySignups.length > 0 && (
          <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800">
              <span className="font-bold">Inscrit(e) à {mySignups.length} permanence{mySignups.length > 1 ? 's' : ''}</span>
              {' — '}prochaine : <span className="font-semibold capitalize">{formatDateLong(mySignups[0].date)}</span>
            </p>
          </div>
        )}

        {/* Shifts list */}
        {shiftDates.length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedShifts).map(([monthKey, shifts]) => (
              <div key={monthKey}>
                <h2 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-3 capitalize">{monthKey}</h2>
                <div className="space-y-2">
                  {shifts.map((shift) => {
                    const isFull = shift.volunteer_count >= shift.capacity;
                    const isLoading = actionLoading === shift.id || actionLoading === shift.my_shift_id;
                    const d = new Date(shift.date + 'T00:00:00');

                    return (
                      <div
                        key={shift.id}
                        className={`flex items-center gap-4 p-3.5 bg-white rounded-xl border transition-colors ${
                          shift.is_signed_up
                            ? 'border-green-300 bg-green-50/40'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        {/* Date block */}
                        <div className={`w-12 h-14 rounded-lg flex flex-col items-center justify-center flex-shrink-0 ${
                          shift.is_signed_up ? 'bg-green-600 text-white' : 'bg-stone-100 text-stone-600'
                        }`}>
                          <span className="text-[10px] font-bold uppercase leading-none">
                            {d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}
                          </span>
                          <span className="text-xl font-black leading-none mt-0.5">{d.getDate()}</span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-stone-900 capitalize">{formatDateLong(shift.date)}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-stone-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> 17h — 19h
                            </span>
                            <span className={`text-xs font-semibold flex items-center gap-1 ${
                              isFull ? 'text-red-600' : 'text-stone-500'
                            }`}>
                              <Users className="w-3 h-3" />
                              {shift.volunteer_count}/{shift.capacity}
                              {!isFull && <span className="text-stone-400 font-normal">· {shift.capacity - shift.volunteer_count} libre{shift.capacity - shift.volunteer_count > 1 ? 's' : ''}</span>}
                            </span>
                          </div>
                        </div>

                        {/* Action */}
                        <div className="flex-shrink-0">
                          {shift.is_signed_up ? (
                            <button
                              onClick={() => shift.my_shift_id && handleCancel(shift.my_shift_id)}
                              disabled={isLoading}
                              className="px-3 py-1.5 text-xs font-bold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              {isLoading ? '...' : 'Annuler'}
                            </button>
                          ) : isFull ? (
                            <span className="px-3 py-1.5 text-xs font-bold text-stone-400 bg-stone-100 rounded-lg">
                              Complet
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSignUp(shift.id)}
                              disabled={isLoading}
                              className="px-3 py-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {isLoading ? '...' : "S'inscrire"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center">
            <Calendar className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="font-bold text-stone-700">Aucune permanence à venir</p>
            <p className="text-sm text-stone-500 mt-1">Pas de créneaux programmés pour le moment.</p>
          </div>
        )}

      </div>
    </div>
  );
}
