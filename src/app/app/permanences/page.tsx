'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Clock, Users, CheckCircle, XCircle } from 'lucide-react';

interface ShiftDate {
  id: string;
  date: string;
  capacity: number;
  volunteer_count: number;
  is_signed_up: boolean;
  my_shift_id: string | null;
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

  const mySignups = shiftDates.filter(d => d.is_signed_up);

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Permanences</h1>
        <p className="text-gray-600">
          Inscrivez-vous aux permanences de distribution. Chaque vendredi de 17h à 19h.
        </p>
      </div>

      {/* My signups summary */}
      {mySignups.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-green-900">
              Vous êtes inscrit(e) à {mySignups.length} permanence{mySignups.length > 1 ? 's' : ''}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {mySignups.map(s => (
              <span key={s.id} className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                {formatDate(s.date)}
              </span>
            ))}
          </div>
        </div>
      )}

      {shiftDates.length > 0 ? (
        <div className="space-y-4">
          {shiftDates.map((shift) => {
            const isFull = shift.volunteer_count >= shift.capacity;
            const isLoading = actionLoading !== null && (actionLoading === shift.id || actionLoading === shift.my_shift_id);

            return (
              <div
                key={shift.id}
                className={`bg-white rounded-lg shadow p-6 border transition-colors ${
                  shift.is_signed_up
                    ? 'border-green-300 bg-green-50/30'
                    : 'border-gray-100 hover:border-green-200'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${shift.is_signed_up ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <Calendar className={`w-5 h-5 ${shift.is_signed_up ? 'text-green-600' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 capitalize">
                        {formatDate(shift.date)}
                      </h3>
                      <div className="flex items-center gap-4 text-gray-600 text-sm mt-1">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          17:00 - 19:00
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {shift.volunteer_count}/{shift.capacity} inscrits
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Progress bar */}
                    <div className="hidden md:flex items-center gap-2 min-w-[120px]">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isFull ? 'bg-red-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min((shift.volunteer_count / shift.capacity) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    {shift.is_signed_up ? (
                      <button
                        onClick={() => shift.my_shift_id && handleCancel(shift.my_shift_id)}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 px-5 py-2 border-2 border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        {isLoading ? 'Annulation...' : 'Se désinscrire'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSignUp(shift.id)}
                        disabled={isFull || isLoading}
                        className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                          isFull
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        {isLoading ? 'Inscription...' : isFull ? 'Complet' : "S'inscrire"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gray-100 p-3 rounded-lg">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Aucune permanence à venir
          </h2>
          <p className="text-gray-600">
            Il n'y a actuellement aucune permanence de distribution programmée.
          </p>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Rappel :</strong> Chaque adhérent est invité à participer à au moins une permanence par mois.
          C'est un moment convivial d'échange et de partage lors de la distribution.
        </p>
      </div>
    </div>
  );
}
