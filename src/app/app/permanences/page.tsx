'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Check, MapPin, Loader2, Sparkles } from 'lucide-react';

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

  // Avatar color palette — cycle through colors
  const avatarColors = ['bg-green-500', 'bg-blue-500', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500'];
  const getAvatarColor = (index: number) => avatarColors[index % avatarColors.length];

  // Avatar initials
  const getInitials = (volunteer: Volunteer) => {
    const first = volunteer.first_name?.charAt(0) || '';
    const last = volunteer.last_name?.charAt(0) || '';
    return (first + last).toUpperCase();
  };

  // Avatar component
  const Avatar = ({ volunteer, index, isCurrentUser }: { volunteer: Volunteer; index: number; isCurrentUser: boolean }) => (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white transition-transform hover:scale-110 ${
        getAvatarColor(index)
      }`}
      title={`${volunteer.first_name} ${volunteer.last_name}${isCurrentUser ? ' (Vous)' : ''}`}
    >
      {getInitials(volunteer)}
    </div>
  );

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

          {/* Progress bar — celebrate when target reached */}
          <div className={`rounded-xl p-4 transition-all duration-300 ${
            progress >= TARGET ? 'bg-green-900/40 border border-green-600/50' : 'bg-stone-800'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-stone-400">Votre participation cette saison</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-extrabold text-white">{mySignups.length}/{TARGET}</p>
                {progress >= TARGET && (
                  <span className="text-lg animate-bounce">✓</span>
                )}
              </div>
            </div>
            <div className={`h-3 rounded-full overflow-hidden ${
              progress >= TARGET ? 'bg-green-900/60' : 'bg-stone-700'
            }`}>
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  progress >= TARGET ? 'bg-gradient-to-r from-green-400 to-green-300 shadow-lg shadow-green-400/50' : 'bg-amber-400'
                }`}
                style={{ width: `${(progress / TARGET) * 100}%` }}
              />
            </div>
            <p className={`text-[11px] mt-2 font-medium ${
              progress >= TARGET ? 'text-green-300' : 'text-stone-500'
            }`}>
              {progress >= TARGET
                ? '🎉 Bravo ! Objectif atteint — merci pour votre engagement !'
                : `Encore ${TARGET - progress} permanence${TARGET - progress > 1 ? 's' : ''} à choisir (minimum ${TARGET} par saison)`
              }
            </p>
          </div>
        </div>

        {/* Legend — more compact */}
        <div className="flex items-center gap-3 mb-5 text-[11px] text-stone-500">
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-md bg-green-600 flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white" /></span>
            Inscrit
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-md border border-stone-300" />
            Disponible
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-md bg-stone-200" />
            Complet
          </span>
        </div>

        {/* Shifts list — clickable rows with volunteer avatars */}
        {shiftDates.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedShifts).map(([monthKey, shifts]) => (
              <div key={monthKey}>
                <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2.5 capitalize">{monthKey}</h2>
                <div className="space-y-2">
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
                        className={`w-full flex flex-col gap-2.5 p-4 rounded-xl border text-left transition-all duration-300 group ${
                          shift.is_signed_up
                            ? 'bg-green-50 border-green-300 hover:border-green-400 hover:shadow-md'
                            : isFull
                              ? 'bg-stone-50 border-stone-200 opacity-50 cursor-not-allowed'
                              : 'bg-white border-stone-200 hover:border-green-400 hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
                        } ${isLoading ? 'opacity-70' : ''}`}
                      >
                        {/* Top row: checkbox, date block, info, and count */}
                        <div className="flex items-center gap-3">
                          {/* Checkbox */}
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                            shift.is_signed_up
                              ? 'bg-green-600 border-2 border-green-600'
                              : isFull
                                ? 'bg-stone-200 border-2 border-stone-200'
                                : 'border-2 border-stone-300 group-hover:border-green-500'
                          }`}>
                            {isLoading ? (
                              <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                            ) : shift.is_signed_up ? (
                              <Check className="w-3.5 h-3.5 text-white" />
                            ) : null}
                          </div>

                          {/* Date block */}
                          <div className={`w-12 text-center flex-shrink-0 ${
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
                            <p className={`text-xs ${
                              shift.is_signed_up ? 'text-green-600' : 'text-stone-500'
                            }`}>
                              17h — 19h
                            </p>
                          </div>

                          {/* Count indicator */}
                          <div className="flex-shrink-0 text-right">
                            <p className={`text-xs font-bold ${
                              shift.is_signed_up ? 'text-green-700' : isFull ? 'text-stone-400' : 'text-stone-700'
                            }`}>
                              {shift.volunteer_count}/{shift.capacity}
                            </p>
                            <p className={`text-[10px] ${
                              shift.is_signed_up ? 'text-green-600' : isFull ? 'text-stone-400' : 'text-stone-500'
                            }`}>
                              inscrit{shift.volunteer_count > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>

                        {/* Bottom row: volunteer avatars */}
                        <div className="flex items-center gap-2 ml-9">
                          {shift.volunteers.length > 0 ? (
                            <div className="flex items-center gap-2">
                              {shift.volunteers.map((volunteer, idx) => (
                                <Avatar
                                  key={volunteer.user_id}
                                  volunteer={volunteer}
                                  index={idx}
                                  isCurrentUser={volunteer.user_id === userId}
                                />
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-stone-400 italic">Aucun inscrit yet</span>
                          )}

                          {/* Empty slots */}
                          {shift.volunteer_count < shift.capacity && (
                            <div className="flex items-center gap-2">
                              {Array.from({
                                length: Math.min(2, shift.capacity - shift.volunteer_count),
                              }).map((_, i) => (
                                <div
                                  key={`empty-${i}`}
                                  className="w-9 h-9 rounded-full border-2 border-dashed border-stone-300 flex items-center justify-center text-stone-400 text-xs font-bold"
                                >
                                  ?
                                </div>
                              ))}
                              {shift.capacity - shift.volunteer_count > 2 && (
                                <span className="text-xs text-stone-400 font-medium">
                                  +{shift.capacity - shift.volunteer_count - 2}
                                </span>
                              )}
                            </div>
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
