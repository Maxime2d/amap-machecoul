'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Check, MapPin, Loader2 } from 'lucide-react';

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

  const handleToggle = async (shift: ShiftDate) => {
    if (!userId) return;
    const isFull = shift.volunteer_count >= shift.capacity;
    if (!shift.is_signed_up && isFull) return;

    const loadingKey = shift.is_signed_up ? shift.my_shift_id! : shift.id;
    setActionLoading(loadingKey);

    if (shift.is_signed_up && shift.my_shift_id) {
      await supabase.from('volunteer_shifts').delete().eq('id', shift.my_shift_id);
    } else {
      await supabase.from('volunteer_shifts').insert({
        shift_date_id: shift.id, user_id: userId, role: 'distribution', status: 'confirmed',
      });
    }

    setActionLoading(null);
    fetchData();
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
  const TARGET = 2;
  const progress = Math.min(mySignups.length, TARGET);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] p-6 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="h-8 w-48 bg-stone-200 rounded-lg animate-pulse mb-4" />
          <div className="h-20 bg-stone-200 rounded-xl animate-pulse mb-6" />
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-white rounded-xl border border-stone-200 animate-pulse mb-2" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4] p-6 md:p-8">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight mb-4">Permanences</h1>

        {/* Info + progress card */}
        <div className="mb-6 bg-stone-900 rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-4">
            <MapPin className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-white">Chaque vendredi · 17h — 19h</p>
              <p className="text-xs text-stone-400 mt-0.5">Pépinières Brenelière, Machecoul</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="bg-stone-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-stone-400">Votre participation cette saison</p>
              <p className="text-sm font-extrabold text-white">{mySignups.length}/{TARGET}</p>
            </div>
            <div className="h-2.5 bg-stone-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progress >= TARGET ? 'bg-green-400' : 'bg-amber-400'
                }`}
                style={{ width: `${(progress / TARGET) * 100}%` }}
              />
            </div>
            <p className="text-[11px] mt-2 text-stone-500">
              {progress >= TARGET
                ? 'Objectif atteint — merci pour votre engagement !'
                : `Encore ${TARGET - progress} permanence${TARGET - progress > 1 ? 's' : ''} à choisir (minimum ${TARGET} par saison)`
              }
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4 text-xs text-stone-500">
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md bg-green-600 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></span>
            Inscrit
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md border-2 border-stone-300" />
            Disponible
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md bg-stone-200" />
            Complet
          </span>
        </div>

        {/* Shifts list — clickable rows */}
        {shiftDates.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedShifts).map(([monthKey, shifts]) => (
              <div key={monthKey}>
                <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 capitalize">{monthKey}</h2>
                <div className="space-y-1.5">
                  {shifts.map((shift) => {
                    const isFull = shift.volunteer_count >= shift.capacity;
                    const isLoading = actionLoading === shift.id || actionLoading === shift.my_shift_id;
                    const d = new Date(shift.date + 'T00:00:00');
                    const isClickable = shift.is_signed_up || !isFull;

                    return (
                      <button
                        key={shift.id}
                        onClick={() => handleToggle(shift)}
                        disabled={!isClickable || isLoading}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-150 ${
                          shift.is_signed_up
                            ? 'bg-green-50 border-green-300 hover:bg-green-100'
                            : isFull
                              ? 'bg-stone-50 border-stone-200 opacity-50 cursor-not-allowed'
                              : 'bg-white border-stone-200 hover:border-green-400 hover:shadow-sm cursor-pointer'
                        } ${isLoading ? 'opacity-70' : ''}`}
                      >
                        {/* Checkbox */}
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                          shift.is_signed_up
                            ? 'bg-green-600 border-2 border-green-600'
                            : isFull
                              ? 'bg-stone-200 border-2 border-stone-200'
                              : 'border-2 border-stone-300 hover:border-green-500'
                        }`}>
                          {isLoading ? (
                            <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                          ) : shift.is_signed_up ? (
                            <Check className="w-3.5 h-3.5 text-white" />
                          ) : null}
                        </div>

                        {/* Date block compact */}
                        <div className={`w-10 text-center flex-shrink-0 ${
                          shift.is_signed_up ? 'text-green-700' : 'text-stone-500'
                        }`}>
                          <p className="text-[10px] font-bold uppercase leading-none">
                            {d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}
                          </p>
                          <p className="text-lg font-black leading-tight">{d.getDate()}</p>
                        </div>

                        {/* Date text */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold capitalize ${
                            shift.is_signed_up ? 'text-green-800' : isFull ? 'text-stone-400' : 'text-stone-800'
                          }`}>
                            {d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                          </p>
                        </div>

                        {/* Places indicator */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <div className="flex gap-0.5">
                            {Array.from({ length: shift.capacity }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-full ${
                                  i < shift.volunteer_count ? 'bg-green-500' : 'bg-stone-300'
                                }`}
                              />
                            ))}
                          </div>
                          {isFull && !shift.is_signed_up && (
                            <span className="text-[10px] font-bold text-stone-400 ml-1">Complet</span>
                          )}
                        </div>
                      </button>
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
