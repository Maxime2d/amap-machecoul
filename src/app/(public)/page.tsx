import Link from 'next/link';
import { Sprout, Heart, ShoppingBasket, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { Post } from '@/types/database';

async function getProducers() {
  const supabase = await createClient();
  const { data: producers } = await supabase
    .from('producers')
    .select('*')
    .eq('status', 'active')
    .limit(6);
  return producers || [];
}

async function getLatestPost(): Promise<Post | null> {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(1);
  return (posts as Post[] | null)?.[0] || null;
}

export default async function HomePage() {
  const [producers, latestPost] = await Promise.all([getProducers(), getLatestPost()]);

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-700 via-green-600 to-green-800 text-white py-20 md:py-32">
        <div className="absolute inset-0 opacity-10 bg-pattern" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Mangez local, mangez frais
            </h1>
            <p className="text-xl md:text-2xl text-green-100 mb-12 max-w-3xl mx-auto">
              Découvrez les produits de nos agriculteurs paysans de Loire-Atlantique. Frais, de saison, cultivés avec passion et respect de l'environnement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/producteurs"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-green-700 font-bold rounded-lg hover:bg-green-50 transition-colors"
              >
                Découvrir nos producteurs
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-green-900 text-white font-bold rounded-lg hover:bg-green-950 transition-colors border border-green-100"
              >
                Rejoindre l'AMAP
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
            Comment ça marche ?
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Trois étapes simples pour bénéficier de produits frais et locaux chaque semaine.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Sprout className="w-8 h-8 text-green-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Les producteurs cultivent</h3>
              <p className="text-gray-600">
                Nos agriculteurs paysans cultivent des produits de qualité selon les principes du développement durable.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Heart className="w-8 h-8 text-green-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Vous vous engagez</h3>
              <p className="text-gray-600">
                Vous vous abonnez à un panier de produits variés, soutenant directement nos producteurs.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <ShoppingBasket className="w-8 h-8 text-green-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Vous récoltez chaque semaine</h3>
              <p className="text-gray-600">
                Chaque jeudi, venez chercher votre panier rempli de saveurs et de fraîcheur.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Producers Section */}
      <section className="py-16 md:py-24 bg-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
            Nos Producteurs
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Rencontrez les visages derrière vos produits. Des agriculteurs passionnés engagés pour l'excellence et la durabilité.
          </p>

          {producers.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {producers.map((producer: any) => (
                <Link
                  key={producer.id}
                  href={`/producteurs/${producer.slug}`}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-all group"
                >
                  <div className="h-48 bg-gradient-to-br from-green-100 to-green-50 rounded-t-lg flex items-center justify-center">
                    <Sprout className="w-16 h-16 text-green-300" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                      {producer.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">{producer.city}</p>
                    <p className="text-gray-600 line-clamp-2">{producer.short_bio}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">Aucun producteur disponible pour le moment.</p>
          )}

          <div className="text-center mt-12">
            <Link
              href="/producteurs"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
            >
              Voir tous nos producteurs
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Latest News */}
      {latestPost && (
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
              Dernières Actualités
            </h2>
            <div className="bg-green-50 rounded-lg p-8 md:p-12">
              <div className="max-w-3xl">
                {latestPost.published_at && (
                  <p className="text-sm text-green-700 font-semibold mb-2">
                    {new Date(latestPost.published_at).toLocaleDateString('fr-FR')}
                  </p>
                )}
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  {latestPost.title}
                </h3>
                <p className="text-gray-700 mb-6 leading-relaxed">{latestPost.excerpt}</p>
                <Link
                  href="/actualites"
                  className="inline-flex items-center gap-2 text-green-700 font-bold hover:text-green-800 transition-colors"
                >
                  Lire la suite
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Join CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-green-700 to-green-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Prêt à nous rejoindre ?</h2>
          <p className="text-lg text-green-100 mb-12">
            Devenir adhérent de l'AMAP c'est soutenir les agriculteurs paysans et savourer des produits frais chaque semaine.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-green-700 font-bold rounded-lg hover:bg-green-50 transition-colors"
            >
              Nous contacter
            </Link>
            <Link
              href="/actualites"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-green-900 transition-colors"
            >
              Consulter les actualités
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
