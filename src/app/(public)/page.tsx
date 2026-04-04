import Link from 'next/link';
import Image from 'next/image';
import { Sprout, Heart, ShoppingBasket, ArrowRight, Leaf, Star } from 'lucide-react';
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
      <section className="relative overflow-hidden pt-20 pb-32 md:pt-32 md:pb-48">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-700 via-green-600 to-emerald-700" />

        {/* Decorative shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-500 rounded-full opacity-10 blur-3xl -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500 rounded-full opacity-10 blur-3xl -ml-48 -mb-48" />

        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="leaf-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 10 0 Q 15 5 10 10 Q 5 5 10 0" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#leaf-pattern)" />
          </svg>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 mb-6 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Leaf className="w-4 h-4 text-green-100" />
              <span className="text-sm font-semibold text-green-100">Depuis 2005, au cœur de Loire-Atlantique</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-white">
              Mangez{' '}
              <span className="relative inline-block">
                <span className="absolute inset-0 bg-gradient-to-r from-yellow-200 via-yellow-100 to-green-100 blur-lg opacity-30" />
                <span className="relative bg-gradient-to-r from-yellow-200 via-yellow-100 to-yellow-50 bg-clip-text text-transparent">
                  local
                </span>
              </span>
              , mangez{' '}
              <span className="relative inline-block">
                <span className="absolute inset-0 bg-gradient-to-r from-green-200 to-emerald-200 blur-lg opacity-30" />
                <span className="relative bg-gradient-to-r from-green-100 to-emerald-50 bg-clip-text text-transparent">
                  frais
                </span>
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-green-50 mb-12 max-w-3xl mx-auto leading-relaxed">
              Découvrez les produits de nos agriculteurs paysans. Frais de saison, cultivés avec passion et respect de l'environnement.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/producteurs"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-green-700 font-bold rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group shadow-lg"
              >
                Découvrir nos producteurs
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-green-950/20 backdrop-blur-sm text-white font-bold rounded-xl hover:bg-green-950/40 transition-all duration-300 border border-green-300/20 hover:border-green-300/50"
              >
                Rejoindre l'AMAP
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Trois étapes simples pour bénéficier de produits frais et locaux chaque semaine.
            </p>
          </div>

          <div className="relative">
            {/* Connecting line - hidden on mobile */}
            <div className="hidden md:block absolute top-24 left-[12%] right-[12%] h-1 bg-gradient-to-r from-green-200 via-green-400 to-green-200" />

            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="relative z-10 inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-6 shadow-lg">
                    <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-10 h-10 bg-white rounded-full text-green-600 font-bold text-lg shadow-md">
                      1
                    </span>
                    <Sprout className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Les producteurs cultivent</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Nos agriculteurs paysans cultivent des produits de qualité selon les principes du développement durable.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="relative z-10 inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full mb-6 shadow-lg">
                    <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-10 h-10 bg-white rounded-full text-emerald-600 font-bold text-lg shadow-md">
                      2
                    </span>
                    <Heart className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Vous vous engagez</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Vous vous abonnez à un panier de produits variés, soutenant directement nos producteurs.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="relative z-10 inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 to-green-700 rounded-full mb-6 shadow-lg">
                    <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-10 h-10 bg-white rounded-full text-green-700 font-bold text-lg shadow-md">
                      3
                    </span>
                    <ShoppingBasket className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Vous récoltez chaque semaine</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Chaque vendredi de 17h à 19h, venez chercher votre panier rempli de saveurs et de fraîcheur.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Producers Section */}
      <section className="py-20 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Nos Producteurs
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Rencontrez les visages derrière vos produits. Des agriculteurs passionnés engagés pour l'excellence et la durabilité.
            </p>
          </div>

          {producers.length > 0 ? (
            <>
              <div className="grid md:grid-cols-3 gap-8">
                {producers.map((producer: any) => (
                  <Link
                    key={producer.id}
                    href={`/producteurs/${producer.slug}`}
                    className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden"
                  >
                    <div className="relative h-56 bg-gradient-to-br from-green-100 to-emerald-50 overflow-hidden">
                      {producer.image_url ? (
                        <Image
                          src={producer.image_url}
                          alt={producer.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Sprout className="w-20 h-20 text-green-200" />
                        </div>
                      )}
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-green-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Badge */}
                      <div className="absolute top-4 right-4">
                        <span className="inline-flex items-center gap-1 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-green-700 shadow-md">
                          <Star className="w-4 h-4 fill-green-700" />
                          Fermier
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-2xl font-bold text-gray-900 group-hover:text-green-700 transition-colors mb-1">
                        {producer.name}
                      </h3>
                      <p className="text-sm font-medium text-green-600 mb-3">{producer.city}</p>
                      <p className="text-gray-600 line-clamp-2 leading-relaxed">{producer.short_bio}</p>
                    </div>

                    {/* Hover indicator */}
                    <div className="h-1 w-0 group-hover:w-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300" />
                  </Link>
                ))}
              </div>

              <div className="text-center mt-16">
                <Link
                  href="/producteurs"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 group shadow-md"
                >
                  Voir tous nos producteurs
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-600 text-lg">Aucun producteur disponible pour le moment.</p>
          )}
        </div>
      </section>

      {/* Latest News */}
      {latestPost && (
        <section className="py-20 md:py-32 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-16">
              Dernières Actualités
            </h2>

            <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Image section - left side on desktop */}
              <div className="order-2 md:order-1">
                {latestPost.image_url && (
                  <div className="relative h-80 md:h-96 rounded-2xl overflow-hidden shadow-xl group">
                    <Image
                      src={latestPost.image_url}
                      alt={latestPost.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                )}
              </div>

              {/* Text section - right side on desktop */}
              <div className="order-1 md:order-2">
                {latestPost.published_at && (
                  <div className="inline-flex items-center gap-2 mb-4 bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold text-sm">
                    <span className="w-2 h-2 bg-green-600 rounded-full" />
                    {new Date(latestPost.published_at).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                )}

                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                  {latestPost.title}
                </h3>

                <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                  {latestPost.excerpt}
                </p>

                <Link
                  href="/actualites"
                  className="inline-flex items-center gap-2 text-green-700 font-bold text-lg hover:text-green-800 transition-all duration-300 group"
                >
                  <span className="relative">
                    Lire la suite
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-700 group-hover:w-full transition-all duration-300" />
                  </span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Join CTA */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-700 via-emerald-700 to-green-800" />

        {/* Decorative elements */}
        <div className="absolute top-0 right-10 w-72 h-72 bg-green-500 rounded-full opacity-10 blur-3xl" />
        <div className="absolute bottom-0 left-10 w-72 h-72 bg-emerald-500 rounded-full opacity-10 blur-3xl" />

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <Leaf className="w-12 h-12 text-green-100 mx-auto mb-6" />

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Prêt à nous rejoindre ?
            </h2>

            <p className="text-xl text-green-50 mb-12 max-w-2xl mx-auto leading-relaxed">
              Devenir adhérent de l'AMAP c'est soutenir les agriculteurs paysans et savourer des produits frais chaque semaine. Ensemble, créons une communauté plus solidaire et durable.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-green-700 font-bold rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group shadow-lg"
              >
                Nous contacter
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/actualites"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white text-white font-bold rounded-xl hover:bg-green-950/40 backdrop-blur-sm transition-all duration-300 group"
              >
                Consulter les actualités
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
