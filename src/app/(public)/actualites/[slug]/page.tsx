import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar } from 'lucide-react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (!post) {
    return {
      title: 'Article non trouvé',
      description: 'Cet article n\'existe pas ou a été supprimé.',
    };
  }

  return {
    title: post.title,
    description: post.excerpt || post.content?.substring(0, 160),
    openGraph: {
      title: post.title,
      description: post.excerpt || post.content?.substring(0, 160),
      type: 'article',
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch the post from Supabase
  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  // Show 404 if post not found
  if (!post) {
    notFound();
  }

  // Format the published date in French
  const publishedDate = new Date(post.published_at);
  const formattedDate = publishedDate.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-green-700 to-green-800 text-white">
        <div className="container mx-auto px-4 py-8">
          {/* Back button */}
          <Link
            href="/actualites"
            className="inline-flex items-center gap-2 mb-6 hover:opacity-90 transition-opacity"
          >
            <ArrowLeft size={20} />
            <span>Retour aux actualités</span>
          </Link>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {post.title}
          </h1>

          {/* Published date */}
          <div className="flex items-center gap-2 text-green-50">
            <Calendar size={18} />
            <time dateTime={post.published_at}>
              {formattedDate}
            </time>
          </div>
        </div>
      </div>

      {/* Featured image */}
      {post.image_url && (
        <div className="container mx-auto px-4 -mt-6">
          <div className="max-w-3xl mx-auto relative h-64 md:h-96 rounded-lg overflow-hidden shadow-lg">
            <Image
              src={post.image_url}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
              priority
            />
          </div>
        </div>
      )}

      {/* Content section */}
      <div className="container mx-auto px-4 py-12">
        <article className="max-w-3xl mx-auto">
          <div className="prose prose-lg max-w-none whitespace-pre-wrap text-gray-700 leading-relaxed">
            {post.content}
          </div>
        </article>
      </div>

      {/* CTA section */}
      <div className="bg-green-50">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              Vous avez des questions?
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/actualites"
                className="inline-block px-6 py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg transition-colors"
              >
                Voir plus d'actualités
              </Link>
              <Link
                href="/contact"
                className="inline-block px-6 py-3 border-2 border-green-700 text-green-700 hover:bg-green-50 font-semibold rounded-lg transition-colors"
              >
                Nous contacter
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
