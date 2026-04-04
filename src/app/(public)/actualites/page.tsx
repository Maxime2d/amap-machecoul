import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

async function getPosts() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false });
  return posts || [];
}

export const metadata = {
  title: 'Actualités',
  description: 'Suivez l\'actualité de l\'AMAP de Machecoul. Nouvelles, événements et mises à jour de nos producteurs.',
};

export default async function ActualitesPage() {
  const posts = await getPosts();

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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Actualités</h1>
          <p className="text-xl text-green-100 max-w-2xl">
            Restez informé des dernières nouvelles, événements et mises à jour de l'AMAP de Machecoul.
          </p>
        </div>
      </section>

      {/* Posts List */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {posts.length > 0 ? (
            <div className="space-y-12">
              {posts.map((post: any) => (
                <article
                  key={post.id}
                  className="pb-12 border-b border-gray-200 last:border-b-0"
                >
                  {post.image_url && (
                    <div className="relative h-48 md:h-64 rounded-lg overflow-hidden mb-6">
                      <Image
                        src={post.image_url}
                        alt={post.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 800px"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600 mb-3">
                    <Calendar className="w-5 h-5" />
                    <time dateTime={post.published_at}>
                      {new Date(post.published_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                  </div>

                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 hover:text-green-700 transition-colors">
                    {post.title}
                  </h2>

                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    {post.excerpt}
                  </p>

                  {post.slug && (
                    <Link
                      href={`/actualites/${post.slug}`}
                      className="inline-flex items-center gap-2 text-green-600 font-bold hover:text-green-700 transition-colors"
                    >
                      Lire l'article complet →
                    </Link>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                Aucun article disponible pour le moment. Revenez bientôt !
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-green-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Vous avez des questions ?
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            N'hésitez pas à nous contacter ou à explorer nos producteurs pour en savoir plus.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
            >
              Nous contacter
            </Link>
            <Link
              href="/producteurs"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-green-600 text-green-600 font-bold rounded-lg hover:bg-green-50 transition-colors"
            >
              Voir nos producteurs
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
