import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Mail, Phone, MapPin, Leaf } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { Producer } from '@/types/database';

async function getProducer(slug: string): Promise<Producer | null> {
  const supabase = await createClient();
  const { data: producer } = await supabase
    .from('producers')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();
  return producer as Producer | null;
}

async function getProducerProducts(producerId: string) {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('producer_id', producerId)
    .eq('available', true)
    .order('name', { ascending: true });
  return products || [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const producer = await getProducer(slug);
  return {
    title: producer?.name || 'Producteur',
    description: producer?.short_bio || 'Producteur AMAP',
  };
}

export default async function ProducerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const producer = await getProducer(slug);

  if (!producer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Producteur non trouvé</h1>
        <Link href="/producteurs" className="text-green-600 hover:text-green-700 font-semibold">
          Retour à la liste
        </Link>
      </div>
    );
  }

  const products = await getProducerProducts(producer.id);

  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-green-700 to-green-800 text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/producteurs"
            className="inline-flex items-center gap-2 text-green-100 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour aux producteurs
          </Link>
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-shrink-0">
              <div className="w-32 h-32 md:w-40 md:h-40 bg-white bg-opacity-20 rounded-lg flex items-center justify-center overflow-hidden relative">
                {producer.image_url ? (
                  <Image
                    src={producer.image_url}
                    alt={producer.name}
                    fill
                    className="object-cover rounded-lg"
                    sizes="160px"
                  />
                ) : (
                  <Leaf className="w-16 h-16 md:w-20 md:h-20 text-green-100" />
                )}
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold mb-2">{producer.name}</h1>
              <p className="text-lg text-green-100 flex items-center gap-2 mb-6">
                <MapPin className="w-5 h-5" />
                {producer.city}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Description */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">À propos</h2>
            <p className="text-gray-700 leading-relaxed text-lg mb-4">
              {producer.description || producer.short_bio}
            </p>
            {producer.website && (
              <a
                href={producer.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:text-green-700 font-semibold underline"
              >
                Visiter le site
              </a>
            )}
          </div>

          {/* Products */}
          {products.length > 0 && (
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Nos Produits</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="text-left py-4 px-4 text-gray-700 font-bold">Produit</th>
                      <th className="text-left py-4 px-4 text-gray-700 font-bold">Type d'unité</th>
                      <th className="text-left py-4 px-4 text-gray-700 font-bold">Conditionnement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product: any) => (
                      <tr key={product.id} className="border-b border-gray-200 hover:bg-green-50 transition-colors">
                        <td className="py-4 px-4 text-gray-900">{product.name}</td>
                        <td className="py-4 px-4 text-gray-700">{product.unit_type || '-'}</td>
                        <td className="py-4 px-4 text-gray-700">{product.packaging || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Contact */}
          <div className="bg-green-50 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Nous contacter</h2>
            <div className="space-y-4">
              {producer.contact_email && (
                <a
                  href={`mailto:${producer.contact_email}`}
                  className="flex items-center gap-3 text-gray-700 hover:text-green-700 transition-colors"
                >
                  <Mail className="w-5 h-5 text-green-600" />
                  {producer.contact_email}
                </a>
              )}
              {producer.phone && (
                <a
                  href={`tel:${producer.phone}`}
                  className="flex items-center gap-3 text-gray-700 hover:text-green-700 transition-colors"
                >
                  <Phone className="w-5 h-5 text-green-600" />
                  {producer.phone}
                </a>
              )}
              {!producer.contact_email && !producer.phone && (
                <p className="text-gray-600">Contactez-nous via le formulaire de contact du site.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
