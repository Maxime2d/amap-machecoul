'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Check, MapPin, Loader2, UserPlus, X } from 'lucide-react';

interface Volunteer {
  user_id: string;
  first_name: string;
  last_name: string;
}

interface ShiftDate {
  id: string;
  date: string;
  capacity: number;
  volunteer_count: number;
  is_signed_up: boolean;
  my_shift_id: string | null;
  volunteers: Volunteer[];
}

interface GroupedShifts {
  [monthKey: string]: ShiftDate[];
}

export default function MemberPermanencesPage() {
  const [shiftDates, setShiftDates] = useState<ShiftDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const supabase = createClient();

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: activePeriod } = await supabase
      .from('shift_periods').select('id').eq('status', 'active').single();

    if (!activePeriod) { setShiftDates([]); setLoading(false); return; }

    const { data: dates } = await supabase
      .from('shift_dates')
      .select('id, date, capacity, volunteer_shifts ( id, user_id, status, profiles ( first_name, last_name ) )')
      .eq('period_id', activePeriod.id)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true });

    const enriched: ShiftDate[] = (dates || []).map((d: any) => {
      const confirmed = (d.volunteer_shifts || []).filter((v: any) => v.status === 'confirmed');
      const myShift = confirmed.find((v: any) => v.user_id === user.id);
      return {
        id: d.id,
        date: d.date,
        capacity: d.capacity,
        volunteer_count: confirmed.length,
        is_signed_up: !!myShift,
        my_shift_id: myShift?.id || null,
        volunteers: confirmed.map((v: any) => ({
          user_id: v.user_id,
          first_name: v.profiles?.first_name || '',
          last_name: v.profiles?.last_name || '',
        })),
      };
    });

    setShiftDates(enriched);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggle = async (shift: ShiftDate) => {
    if (!userId) return;
    if (actionLoading) return;
    const isFull = shift.volunteer_count >= shift.capacity;
    if (!shift.is_signed_up && isFull) return;

    setActionLoading(shift.id);

    try {
      if (shift.is_signed_up && shift.my_shift_id) {
        await supabase.from('volunteer_shifts').delete().eq('id', shift.my_shift_id);
        showToast('Inscription annulée', 'info');
      } else {
        await supabase.from('volunteer_shifts').insert({
          shift_date_id: shift.id, user_id: userId, role: 'distribution', status: 'confirmed',
        });
        const d = new Date(shift.date + 'T00:00:00');
        const label = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
        showToast(`Inscrit pour le ${label} !`, 'success');
      }
      await fetchData();
    } finally {
      setActionLoading(null);
    }
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

  const avatarColors = ['bg-green-600', 'bg-blue-600', 'bg-amber-500', 'bg-violet-600', 'bg-rose-500'];
  const getAvatarColor = (index: number) => avatarColors[index % avatarColors.length];

  const getInitials = (v: Volunteer) => {
    return ((v.first_name?.charAt(0) || '') + (v.last_name?.charAt(0) || '')).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f7f4] p-6 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="h-8 w-48 bg-stone-200 rounded-lg animate-pulse mb-4" />
          <div className="h-28 bg-stone-200 rounded-xl animate-pulse mb-6" />
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-white rounded-xl border border-stone-200 animate-pulse mb-3" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4] p-6 md:p-8">
      <div className="max-w-2xl mx-auto">

        {/* Toast notification */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white flex items-center gap-2 animate-[slideIn_0.3s_ease-out] ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-stone-700'
          }`}>
            {toast.type === 'success' ? <Check className="w-4 h-4" /> : null}
            {toast.message}
          </div>
        )}

        {/* Header */}
        <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight mb-4">Permanences</h1>

        {/* Info + progress card — light green theme */}
        <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-4">
            <MapPin className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-green-900">Chaque vendredi · 17h — 19h</p>
              <p className="text-xs text-green-700 mt-0.5">Pépinières Brenelière, Machecoul</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className={`rounded-xl p-4 transition-all duration-300 ${
            progress >= TARGET ? 'bg-green-100 border border-green-300' : 'bg-white border border-green-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-green-700">Votre participation cette saison</p>
              <p className="text-sm font-extrabold text-green-900">{mySignups.length}/{TARGET}</p>
            </div>
            <div className="h-3 bg-green-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  progress >= TARGET ? 'bg-green-500' : 'bg-amber-400'
                }`}
                style={{ width: `${(progress / TARGET) * 100}%` }}
              />
            </div>
            <p className={`text-[11px] mt-2 font-medium ${
              progress >= TARGET ? 'text-green-700' : 'text-stone-500'
            }`}>
              {progress >= TARGET
                ? 'Bravo ! Objectif atteint — merci pour votre engagement !'
                : `Encore ${TARGET - progress} permanence${TARGET - progress > 1 ? 's' : ''} à choisir (minimum ${TARGET} par saison)`
              }
            </p>
          </div>
        </div>

        {/* Explanation text */}
        <p className="text-sm text-stone-500 mb-4">
          Cliquez sur <span className="font-semibold text-green-700">« Je participe »</span> pour vous inscrire à une permanence.
        </p>

        {/* Shifts list */}
        {shiftDates.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedShifts).map(([monthKey, shifts]) => (
              <div key={monthKey}>
                <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2.5 capitalize">{monthKey}</h2>
                <div className="space-y-3">
                  {shifts.map((shift) => {
                    const isFull = shift.volunteer_count >= shift.capacity;
                    const isLoading = actionLoading === shift.id;
                    const d = new Date(shift.date + 'T00:00:00');
                    const spotsLeft = shift.capacity - shift.volunteer_count;

                    return (
                      <div
                        key={shift.id}
                        className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                          shift.is_signed_up
                            ? 'bg-green-50 border-green-300'
                            : isFull
                              ? 'bg-stone-50 border-stone-200 opacity-60'
                              : 'bg-white border-stone-200'
                        }`}
                      >
                        {/* Main row */}
                        <div className="p-4 flex items-center gap-3">
                          {/* Date block */}
                          <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                            shift.is_signed_up ? 'bg-green-600 text-white' : 'bg-stone-100 text-stone-700'
                          }`}>
                            <span className="text-[10px] font-bold uppercase leading-none">
                              {d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}
                            </span>
                            <span className="text-xl font-black leading-tight">{d.getDate()}</span>
                          </div>

                          {/* Date + time */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold capitalize ${
                              shift.is_signed_up ? 'text-green-800' : isFull ? 'text-stone-400' : 'text-stone-800'
                            }`}>
                              {d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </p>
                            <p className="text-xs text-stone-500">17h — 19h</p>
                          </div>

                          {/* Places count */}
                          <div className="flex-shrink-0 text-right mr-2">
                            <div className="flex gap-0.5 justify-end mb-1">
                              {Array.from({ length: shift.capacity }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-2.5 h-2.5 rounded-full ${
                                    i < shift.volunteer_count ? 'bg-green-500' : 'bg-stone-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <p className={`text-[11px] font-semibold ${
                              isFull ? 'text-stone-400' : 'text-stone-600'
                            }`}>
                              {shift.volunteer_count}/{shift.capacity} inscrit{shift.volunteer_count !== 1 ? 's' : ''}
                            </p>
                          </div>

                          {/* ACTION BUTTON — explicit and clear */}
                          <div className="flex-shrink-0">
                            {shift.is_signed_up ? (
                              <button
                                onClick={() => handleToggle(shift)}
                                disabled={isLoading}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition-all disabled:opacity-50"
                              >
                                {isLoading ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                                Inscrit
                              </button>
                            ) : isFull ? (
                              <span className="px-3 py-2 rounded-lg bg-stone-200 text-stone-500 text-xs font-semibold">
                                Complet
                              </span>
                            ) : (
                              <button
                                onClick={() => handleToggle(shift)}
                                disabled={isLoading}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-green-600 text-green-700 text-xs font-bold hover:bg-green-600 hover:text-white transition-all disabled:opacity-50"
                              >
                                {isLoading ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <UserPlus className="w-3.5 h-3.5" />
                                )}
                                Je participe
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Volunteers row — who's signed up */}
                        {shift.volunteer_count > 0 && (
                          <div className={`px-4 pb-3 flex items-center gap-2 ${
                            shift.is_signed_up ? '' : ''
                          }`}>
                            <div className="flex -space-x-1.5">
                              {shift.volunteers.map((v, idx) => {
                                const isMe = v.user_id === userId;
                                return (
                                  <div
                                    key={v.user_id}
                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold ring-2 ${
                                      isMe ? 'ring-green-300' : 'ring-white'
                                    } ${getAvatarColor(idx)}`}
                                    title={`${v.first_name} ${v.last_name}${isMe ? ' (Vous)' : ''}`}
                                  >
                                    {getInitials(v)}
                                  </div>
                                );
                              })}
                            </div>
                            <p className="text-xs text-stone-500">
                              {shift.volunteers.map((v, i) => {
                                const isMe = v.user_id === userId;
                                const name = isMe ? 'Vous' : v.first_name;
                                if (i === 0) return name;
                                if (i === shift.volunteers.length - 1) return ` et ${name}`;
                                return `, ${name}`;
                              }).join('')}
                            </p>
                            {spotsLeft > 0 && (
                              <span className="text-[10px] text-stone-400 ml-auto">
                                {spotsLeft} place{spotsLeft > 1 ? 's' : ''} restante{spotsLeft > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Empty state — encourage sign up */}
                        {shift.volunteer_count === 0 && !isFull && (
                          <div className="px-4 pb-3">
                            <p className="text-xs text-stone-400 italic">
                              Personne n'est encore inscrit — soyez le premier !
                            </p>
                          </div>
                        )}
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
