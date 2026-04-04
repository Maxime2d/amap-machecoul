import Link from 'next/link';
import Image from 'next/image';
import { Sprout, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

async function getProducers() {
  const supabase = await createClient();
  const { data: producers } = await supabase
    .from('producers')
    .select('*')
    .eq('status', 'active')
    .order('name', { ascending: true });
  return producers || [];
}

export const metadata = {
  title: 'Nos Producteurs',
  description: 'Découvrez tous nos producteurs paysans de Loire-Atlantique. Des agriculteurs engagés pour la qualité et la durabilité.',
};

export default async function ProducteursPage() {
  const producers = await getProducers();

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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Nos Producteurs</h1>
          <p className="text-xl text-green-100 max-w-2xl">
            Rencontrez les visages derrière vos produits. Des agriculteurs paysans passionnés engagés pour l'excellence et la durabilité de nos terroirs.
          </p>
        </div>
      </section>

      {/* Producers Grid */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {producers.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {producers.map((producer: any) => (
                <Link
                  key={producer.id}
                  href={`/producteurs/${producer.slug}`}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
                >
                  <div className="h-56 bg-gradient-to-br from-green-100 via-green-50 to-emerald-50 rounded-t-lg flex items-center justify-center overflow-hidden relative">
                    {producer.image_url ? (
                      <Image
                        src={producer.image_url}
                        alt={producer.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <Sprout className="w-20 h-20 text-green-300 group-hover:text-green-400 transition-colors" />
                    )}
                  </div>
                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-green-700 transition-colors">
                      {producer.name}
                    </h3>
                    <p className="text-sm text-gray-500 font-semibold mb-4">
                      {producer.city}
                    </p>
                    <p className="text-gray-700 leading-relaxed line-clamp-3">
                      {producer.short_bio}
                    </p>
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <span className="inline-flex items-center text-green-600 font-semibold group-hover:text-green-700 transition-colors">
                        En savoir plus →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Sprout className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Aucun producteur disponible pour le moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Join Section */}
      <section className="py-16 md:py-24 bg-green-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Intéressé par nos produits ?
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            Rejoignez l'AMAP et soutenez nos agriculteurs tout en savourant des produits frais et locaux chaque semaine.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
          >
            Nous contacter
          </Link>
        </div>
      </section>
    </>
  );
}
