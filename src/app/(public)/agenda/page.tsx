import Link from 'next/link';
import { Calendar, Clock, MapPin, ArrowLeft, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { Post } from '@/types/database';

async function getUpcomingEvents(): Promise<Post[]> {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from('posts')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(10);
  return (events as Post[] | null) || [];
}

export const metadata = {
  title: 'Agenda',
  description: 'Découvrez le calendrier des distributions et des événements de l\'AMAP de Machecoul.',
};

export default async function AgendaPage() {
  const events = await getUpcomingEvents();

  // Get current date for calendar display
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Generate calendar for current and next two months
  const generateCalendarDays = (year: number, month: number) => {    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  // Get all Fridays in current month (distribution days)
  const getFridaysInMonth = (year: number, month: number) => {
    const fridays = [];
    const date = new Date(year, month, 1);
    while (date.getMonth() === month) {
      if (date.getDay() === 5) { // Friday is 5
        fridays.push(date.getDate());
      }
      date.setDate(date.getDate() + 1);
    }
    return fridays;
  };

  const currentFridays = getFridaysInMonth(currentYear, currentMonth);
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-green-700 to-green-800 text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-green-100 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour à l'accueil
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Agenda</h1>
          <p className="text-xl text-green-100 max-w-2xl">
            Consultez le calendrier de nos distributions et des événements de l'AMAP.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Regular Distribution Section */}
          <div className="mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Distributions régulières</h2>

            <div className="bg-green-50 rounded-lg p-8 border-2 border-green-200 mb-12">              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-600 text-white">
                    <Calendar className="w-8 h-8" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Chaque vendredi</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-green-600" />
                      <span className="text-lg text-gray-700"><strong>17h00 à 19h00</strong></span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-green-600" />
                      <span className="text-lg text-gray-700">
                        <strong>Pépinières Brenelière, Machecoul-Saint-Même</strong><br />
                        <span className="text-sm text-gray-600">Loire-Atlantique, Pays de Retz</span>
                      </span>
                    </div>
                  </div>
                  <p className="mt-6 text-gray-700">
                    Venez chercher votre panier de produits frais chaque vendredi. Les distributions se font dans
                    la joie et la convivialité, c'est aussi l'occasion de rencontrer d'autres amapiens et échanger
                    avec le paysan.
                  </p>
                </div>
              </div>
            </div>            {/* Mini Calendar - Current Month */}
            <div className="bg-white border border-gray-300 rounded-lg overflow-hidden mb-8">
              <div className="bg-green-600 text-white px-6 py-4">
                <h3 className="text-xl font-bold">
                  {monthNames[currentMonth]} {currentYear}
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {dayNames.map((day) => (
                    <div key={day} className="text-center font-bold text-gray-600 text-sm py-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {generateCalendarDays(currentYear, currentMonth).map((day, index) => (
                    <div
                      key={index}
                      className={`aspect-square flex items-center justify-center rounded text-sm font-semibold ${
                        day === null
                          ? 'bg-gray-50'
                          : currentFridays.includes(day)
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : day < today.getDate() && currentMonth === today.getMonth()
                          ? 'text-gray-400 bg-gray-50'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } transition-colors`}
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-green-600 rounded"></span>
                    Jours de distribution (vendredis)
                  </p>
                </div>
              </div>
            </div>            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg">
              <p className="text-gray-700">
                <strong>Note :</strong> Les distributions ont lieu chaque vendredi de 17h à 19h.
                En cas de jour férié ou de circonstances exceptionnelles, une alternative sera proposée.
                Consultez notre section actualités pour les informations de dernière minute.
              </p>
            </div>
          </div>

          {/* Events Section */}
          <div className="border-t-2 border-gray-200 pt-20">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Événements à venir</h2>

            {events.length > 0 ? (
              <div className="space-y-8">
                {events.map((event: any, index: number) => (
                  <div
                    key={event.id}
                    className="bg-white border-2 border-green-200 rounded-lg p-8 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                          <span className="text-2xl font-bold text-green-600">
                            {index + 1}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">                        {event.published_at && (
                          <p className="text-sm text-green-700 font-semibold mb-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(event.published_at).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        )}
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                          {event.title}
                        </h3>
                        <p className="text-gray-700 mb-4 leading-relaxed">
                          {event.excerpt}
                        </p>
                        {event.slug && (
                          <Link
                            href={`/actualites/${event.slug}`}
                            className="inline-flex items-center gap-2 text-green-600 font-bold hover:text-green-700 transition-colors"
                          >
                            En savoir plus
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">
                  Aucun événement spécial programmé actuellement. Les distributions régulières
                  se poursuivent chaque vendredi de 17h à 19h !
                </p>
              </div>
            )}
          </div>          {/* Info Box */}
          <div className="mt-16 bg-green-50 rounded-lg p-8 border-l-4 border-green-600">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Vous avez une question ?</h3>
            <p className="text-gray-700 mb-6">
              Pour toute question concernant les horaires, les distributions ou les événements à venir,
              n'hésitez pas à nous contacter directement. Nous sommes toujours disponibles pour vous aider
              et répondre à vos interrogations.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-colors"
            >
              Nous contacter
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-green-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Prêt à rejoindre nos distributions ?
          </h2>
          <p className="text-gray-700 text-lg mb-12 max-w-2xl mx-auto">
            Devenez amapien et profitez de produits frais chaque vendredi. Nos portes vous sont ouvertes !
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-colors"
            >
              Rejoindre l'AMAP
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/qu-est-ce-qu-une-amap"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-orange-500 text-orange-500 font-bold rounded-lg hover:bg-orange-50 transition-colors"
            >
              En savoir plus
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}