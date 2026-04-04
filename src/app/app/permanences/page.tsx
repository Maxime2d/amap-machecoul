import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Calendar, Clock, Users } from 'lucide-react';

export default async function ShiftsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/connexion');
  }

  // This is a placeholder - you'll need to create the shifts table in your database
  const shifts: any[] = [];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };
  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Permanences
        </h1>
        <p className="text-gray-600 mb-8">
          Inscrivez-vous aux permanences de distribution. Chaque vendredi de 17h à 19h
        </p>
      </div>

      {shifts && shifts.length > 0 ? (
        <div className="space-y-4">
          {shifts.map((shift: any) => (
            <div
              key={shift.id}
              className="bg-white rounded-lg shadow p-6 border border-gray-100 hover:border-green-200 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {formatDate(shift.date)}
                    </h3>                    <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                      <Clock className="w-4 h-4" />
                      {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-gray-600 text-sm">
                    <Users className="w-4 h-4" />
                    <span>{shift.enrolled_count || 0}/{shift.capacity || 3} inscrits</span>
                  </div>
                  <button className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
                    S'inscrire
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gray-100 p-3 rounded-lg">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Aucune permanence prévue
          </h2>          <p className="text-gray-600">
            Il n'y a actuellement aucune permanence de distribution programmée.
          </p>
        </div>
      )}
    </div>
  );
}
