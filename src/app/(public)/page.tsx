import Link from 'next/link';
import Image from 'next/image';
import { Sprout, Heart, ShoppingBasket, ArrowRight, Leaf, ShieldCheck, Truck, Users } from 'lucide-react';
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
      {/* Hero Section with farm photo background */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Background image - champ de légumes */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=1920&q=80"
            alt="Champ de légumes bio"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-green-900/85 via-green-900/70 to-green-800/50" />
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-24">
          <div className="max-w-3xl">
            {/* Bio label */}
            <div className="inline-flex items-center gap-2 mb-8 bg-white/15 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20">
              <span className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-full">
                <Leaf className="w-4 h-4 text-white" />
              </span>
              <span className="text-sm font-bold text-white tracking-wide uppercase">Agriculture paysanne et biologique</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-[1.1] text-white">
              Des produits{' '}
              <span className="text-green-300">bio</span>
              {' '}et{' '}
              <span className="text-yellow-300">locaux</span>
              ,{' '}du champ à votre assiette
            </h1>

            <p className="text-xl md:text-2xl text-green-50/90 mb-10 leading-relaxed max-w-2xl">
              L'AMAP de Machecoul réunit des producteurs bio de Loire-Atlantique et des consommateurs engagés. Légumes, pain, fromage, œufs, volaille — cultivés et élevés dans le respect du vivant.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/producteurs"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-green-700 font-bold rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group shadow-lg text-lg"
              >
                Découvrir nos producteurs
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-green-600/30 backdrop-blur-sm text-white font-bold rounded-xl hover:bg-green-600/50 transition-all duration-300 border border-white/30 text-lg"
              >
                Rejoindre l'AMAP
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bio guarantee band */}
      <section className="bg-green-700 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-sm">Bio</p>
                <p className="text-green-200 text-xs">Sans pesticides ni OGM</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-sm">Circuit court</p>
                <p className="text-green-200 text-xs">Du producteur à vous</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-sm">De saison</p>
                <p className="text-green-200 text-xs">Récolté frais chaque semaine</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-sm">Solidaire</p>
                <p className="text-green-200 text-xs">Soutien direct aux paysans</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Photo gallery strip */}
      <section className="bg-gray-100 py-2">
        <div className="flex gap-2 overflow-hidden">
          {[
            { src: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&h=250&fit=crop', alt: 'Légumes bio du potager' },
            { src: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&h=250&fit=crop', alt: 'Récolte dans les champs' },
            { src: 'https://images.unsplash.com/photo-1498579397066-22750a3cb424?w=400&h=250&fit=crop', alt: 'Panier de légumes frais' },
            { src: 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=400&h=250&fit=crop', alt: 'Tomates bio sur pied' },
            { src: 'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=400&h=250&fit=crop', alt: 'Marché de producteurs' },
            { src: 'https://images.unsplash.com/photo-1592921870789-04563d55041c?w=400&h=250&fit=crop', alt: 'Carottes fraîches bio' },
          ].map((img, i) => (
            <div key={i} className="relative flex-shrink-0 w-64 h-40 rounded-lg overflow-hidden">
              <Image src={img.src} alt={img.alt} fill className="object-cover" sizes="256px" />
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-bold mb-4">Comment ça marche</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Du champ à votre panier
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Trois étapes simples pour des produits bio, frais et locaux chaque semaine.
            </p>
          </div>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-24 left-[12%] right-[12%] h-1 bg-gradient-to-r from-green-200 via-green-400 to-green-200 rounded-full" />

            <div className="grid md:grid-cols-3 gap-12">
              {[
                {
                  icon: Sprout,
                  num: '1',
                  title: 'Nos paysans cultivent en bio',
                  desc: 'Nos producteurs bio cultivent fruits, légumes, céréales et élèvent leurs animaux dans le respect du vivant et des sols.',
                  gradient: 'from-green-500 to-green-600',
                },
                {
                  icon: Heart,
                  num: '2',
                  title: 'Vous vous engagez',
                  desc: 'Vous choisissez vos contrats : panier de légumes, pain, fromage, volaille… et soutenez directement nos producteurs locaux.',
                  gradient: 'from-emerald-500 to-emerald-600',
                },
                {
                  icon: ShoppingBasket,
                  num: '3',
                  title: 'Vous récoltez le vendredi',
                  desc: 'Chaque vendredi de 17h à 19h, retrouvez-nous pour récupérer vos produits bio frais, dans une ambiance conviviale.',
                  gradient: 'from-green-600 to-green-700',
                },
              ].map((step) => (
                <div key={step.num} className="relative flex flex-col items-center text-center">
                  <div className={`relative z-10 inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br ${step.gradient} rounded-full mb-6 shadow-lg`}>
                    <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-10 h-10 bg-white rounded-full text-green-600 font-bold text-lg shadow-md">
                      {step.num}
                    </span>
                    <step.icon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bio highlight section with photo */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=1920&q=80"
            alt="Champ bio en Loire-Atlantique"
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-green-900/75" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 mb-6 bg-green-500/20 backdrop-blur-sm px-4 py-2 rounded-full border border-green-400/30">
                <Leaf className="w-5 h-5 text-green-300" />
                <span className="text-green-200 font-bold text-sm">Engagement bio</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Pourquoi choisir le bio avec l'AMAP ?
              </h2>
              <div className="space-y-6 text-green-50 text-lg leading-relaxed">
                <p>
                  Tous nos producteurs pratiquent une <strong className="text-green-300">agriculture biologique</strong>. Sans pesticides, sans engrais chimiques, sans OGM — des produits sains pour vous et pour la terre.
                </p>
                <p>
                  En AMAP, vous payez un prix juste qui permet aux paysans de vivre dignement de leur travail. C'est un engagement solidaire qui garantit des revenus stables à nos producteurs.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <p className="text-4xl font-bold text-green-300 mb-2">6</p>
                <p className="text-white font-medium">Producteurs bio locaux</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <p className="text-4xl font-bold text-green-300 mb-2">100%</p>
                <p className="text-white font-medium">Produits bio</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <p className="text-4xl font-bold text-green-300 mb-2">30 km</p>
                <p className="text-white font-medium">Rayon maximum</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <p className="text-4xl font-bold text-green-300 mb-2">20+</p>
                <p className="text-white font-medium">Années d'existence</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Producers Section */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-bold mb-4">Nos producteurs</span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Rencontrez nos paysans bio
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Des agriculteurs passionnés qui pratiquent l'agriculture biologique, à quelques kilomètres de chez vous.
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

                      {/* Bio badge */}
                      <div className="absolute top-4 right-4">
                        <span className="inline-flex items-center gap-1.5 bg-green-600 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-md">
                          <Leaf className="w-3.5 h-3.5" />
                          Bio
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors mb-1">
                        {producer.name}
                      </h3>
                      <p className="text-sm font-medium text-green-600 mb-3">{producer.city}</p>
                      <p className="text-gray-600 line-clamp-2 leading-relaxed text-sm">{producer.short_bio}</p>
                    </div>

                    <div className="h-1 w-0 group-hover:w-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300" />
                  </Link>
                ))}
              </div>

              <div className="text-center mt-16">
                <Link
                  href="/producteurs"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 hover:shadow-lg transition-all duration-300 group"
                >
                  Voir tous nos producteurs bio
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
        <section className="py-20 md:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-16">
              Dernières Actualités
            </h2>

            <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
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
                  </div>
                )}
              </div>

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
                  className="inline-flex items-center gap-2 text-green-700 font-bold text-lg hover:text-green-800 transition-all group"
                >
                  Lire la suite
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Join CTA with farm photo */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=1920&q=80"
            alt="Distribution AMAP"
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-green-900/90 to-green-800/80" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 backdrop-blur-sm rounded-full mb-8 border border-green-400/30">
              <Leaf className="w-8 h-8 text-green-200" />
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Prêt à manger bio et local ?
            </h2>

            <p className="text-xl text-green-50 mb-12 max-w-2xl mx-auto leading-relaxed">
              Rejoignez l'AMAP de Machecoul et soutenez une agriculture paysanne, biologique et solidaire. Chaque panier fait la différence.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-green-700 font-bold rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group shadow-lg text-lg"
              >
                Nous contacter
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/connexion"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 backdrop-blur-sm transition-all duration-300 text-lg"
              >
                Espace adhérent
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
