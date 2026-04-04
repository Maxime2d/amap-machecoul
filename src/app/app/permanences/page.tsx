'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Clock, Users, CheckCircle, XCircle, ChevronRight } from 'lucide-react';

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

    // Get active period
    const { data: activePeriod } = await supabase
      .from('shift_periods')
      .select('id')
      .eq('status', 'active')
      .single();

    if (!activePeriod) {
      setShiftDates([]);
      setLoading(false);
      return;
    }

    // Get shift dates with volunteers
    const { data: dates } = await supabase
      .from('shift_dates')
      .select(`
        id, date, capacity,
        volunteer_shifts ( id, user_id, status )
      `)
      .eq('period_id', activePeriod.id)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true });

    const enriched: ShiftDate[] = (dates || []).map((d: any) => {
      const confirmedVolunteers = (d.volunteer_shifts || []).filter((v: any) => v.status === 'confirmed');
      const myShift = confirmedVolunteers.find((v: any) => v.user_id === user.id);
      return {
        id: d.id,
        date: d.date,
        capacity: d.capacity,
        volunteer_count: confirmedVolunteers.length,
        is_signed_up: !!myShift,
        my_shift_id: myShift?.id || null,
      };
    });

    setShiftDates(enriched);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSignUp = async (shiftDateId: string) => {
    if (!userId) return;
    setActionLoading(shiftDateId);

    const { error } = await supabase
      .from('volunteer_shifts')
      .insert({
        shift_date_id: shiftDateId,
        user_id: userId,
        role: 'distribution',
        status: 'confirmed',
      });

    if (error) {
      alert('Erreur lors de l\'inscription: ' + error.message);
    }

    setActionLoading(null);
    fetchData();
  };

  const handleCancel = async (shiftId: string) => {
    setActionLoading(shiftId);

    const { error } = await supabase
      .from('volunteer_shifts')
      .delete()
      .eq('id', shiftId);

    if (error) {
      alert('Erreur lors de la désinscription: ' + error.message);
    }

    setActionLoading(null);
    fetchData();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getMonthKey = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('fr-FR', { weekday: 'short' }).toUpperCase();
  };

  const getDayNumber = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.getDate();
  };

  const groupShiftsByMonth = (): GroupedShifts => {
    return shiftDates.reduce((acc, shift) => {
      const monthKey = getMonthKey(shift.date);
      if (!acc[monthKey]) acc[monthKey] = [];
      acc[monthKey].push(shift);
      return acc;
    }, {} as GroupedShifts);
  };

  const mySignups = shiftDates.filter(d => d.is_signed_up);
  const nextSignup = mySignups.length > 0 ? mySignups[0] : null;
  const groupedShifts = groupShiftsByMonth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
              <span className="text-gray-500">Chargement des permanences...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Permanences</h1>
              <p className="text-gray-600 text-sm mt-1">Distribution AMAP - Chaque vendredi 17h-19h</p>
            </div>
          </div>
        </div>

        {/* My Signups Banner */}
        {mySignups.length > 0 && nextSignup && (
          <div className="mb-8 bg-white rounded-xl shadow-sm border border-green-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-white flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">
                      Inscrit(e) à {mySignups.length} permanence{mySignups.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-green-100 text-sm">
                      Prochain créneaux: {formatDate(nextSignup.date)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{mySignups.length}</div>
                  <p className="text-green-100 text-xs">créneaux</p>
                </div>
              </div>
            </div>
            {mySignups.length > 0 && (
              <div className="px-6 py-3 bg-green-50 border-t border-green-200">
                <div className="flex flex-wrap gap-2">
                  {mySignups.map(s => (
                    <div key={s.id} className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-green-300 text-green-800 rounded-full text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      {formatDate(s.date)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Shifts Grid by Month */}
        {shiftDates.length > 0 ? (
          <div className="space-y-10">
            {Object.entries(groupedShifts).map(([monthKey, shifts]) => (
              <div key={monthKey} className="space-y-5">
                {/* Month Header */}
                <div className="flex items-center gap-3 mt-8 first:mt-0">
                  <h2 className="text-2xl font-bold text-gray-900 capitalize">{monthKey}</h2>
                  <div className="flex-1 h-1 bg-gradient-to-r from-green-300 to-transparent rounded-full" />
                  <span className="text-sm text-gray-500 font-medium">{shifts.length} créneaux</span>
                </div>

                {/* Shifts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {shifts.map((shift) => {
                    const isFull = shift.volunteer_count >= shift.capacity;
                    const isLoading = actionLoading !== null && (actionLoading === shift.id || actionLoading === shift.my_shift_id);
                    const availableSlots = shift.capacity - shift.volunteer_count;

                    return (
                      <div
                        key={shift.id}
                        className={`group bg-white rounded-xl shadow-sm border-2 transition-all duration-200 overflow-hidden hover:shadow-md ${
                          shift.is_signed_up
                            ? 'border-green-400 bg-green-50/40'
                            : isFull
                              ? 'border-gray-200'
                              : 'border-gray-200 hover:border-green-300'
                        }`}
                      >
                        {/* Date Card Header */}
                        <div className={`px-5 py-4 ${shift.is_signed_up ? 'bg-green-100/60' : 'bg-gray-50'} border-b-2 ${shift.is_signed_up ? 'border-green-200' : 'border-gray-100'}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                                {getDayOfWeek(shift.date)}
                              </div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-gray-900">
                                  {getDayNumber(shift.date)}
                                </span>
                              </div>
                            </div>
                            {shift.is_signed_up && (
                              <div className="flex-shrink-0 px-3 py-1 bg-green-600 text-white rounded-full flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-xs font-bold">Inscrit</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="px-5 py-4 space-y-4">
                          {/* Time */}
                          <div className="flex items-center gap-3 text-gray-700">
                            <Clock className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span className="text-sm font-medium">17h00 - 19h00</span>
                          </div>

                          {/* Volunteer Slots - Avatar Dots */}
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                              Bénévoles
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              {Array.from({ length: shift.capacity }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-7 h-7 rounded-full flex items-center justify-center border-2 text-xs font-bold ${
                                    i < shift.volunteer_count
                                      ? 'bg-green-500 border-green-600 text-white'
                                      : 'bg-gray-100 border-gray-300 text-gray-400'
                                  }`}
                                  title={i < shift.volunteer_count ? 'Slot occupé' : 'Slot libre'}
                                >
                                  {i < shift.volunteer_count ? '✓' : '+'}
                                </div>
                              ))}
                            </div>
                            <p className={`text-xs ${isFull ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                              {shift.volunteer_count}/{shift.capacity}
                              {availableSlots > 0 && ` · ${availableSlots} libre${availableSlots > 1 ? 's' : ''}`}
                            </p>
                          </div>

                          {/* Status Badge */}
                          {isFull && !shift.is_signed_up && (
                            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full" />
                              <span className="text-xs font-semibold text-red-700">Complet</span>
                            </div>
                          )}
                        </div>

                        {/* CTA Button */}
                        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                          {shift.is_signed_up ? (
                            <button
                              onClick={() => shift.my_shift_id && handleCancel(shift.my_shift_id)}
                              disabled={isLoading}
                              className="w-full py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-200 border-2 border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              <XCircle className="w-4 h-4" />
                              {isLoading ? 'Annulation...' : 'Se désinscrire'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSignUp(shift.id)}
                              disabled={isFull || isLoading}
                              className={`w-full py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                                isFull
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-2 border-gray-300'
                                  : 'bg-green-600 hover:bg-green-700 text-white border-2 border-green-600 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed'
                              }`}
                            >
                              {isLoading ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  Inscription...
                                </>
                              ) : isFull ? (
                                <>
                                  <XCircle className="w-4 h-4" />
                                  Complet
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  S'inscrire
                                </>
                              )}
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Aucune permanence à venir
            </h2>
            <p className="text-gray-600 max-w-sm mx-auto">
              Il n'y a actuellement aucune permanence de distribution programmée pour cette période.
            </p>
          </div>
        )}

        {/* Info Banner */}
        <div className="mt-12 bg-white rounded-xl shadow-sm border-l-4 border-l-green-600 p-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-1 bg-gradient-to-b from-green-600 to-green-200 rounded-full" />
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Comment ça marche ?</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Chaque adhérent est invité à participer à au moins <strong>2 permanences par saison</strong>. C'est un moment convivial d'échange et de partage lors de la distribution hebdomadaire. Les créneaux se remplissent rapidement, alors inscrivez-vous dès que possible !
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
