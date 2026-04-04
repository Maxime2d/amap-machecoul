import Link from 'next/link';
import { ArrowLeft, CheckCircle, Handshake } from 'lucide-react';

export const metadata = {
  title: 'La Charte des AMAP',
  description: 'Découvrez les principes et engagements de la Charte des AMAP.',
};

export default function CharterPage() {
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">La Charte des AMAP</h1>
          <p className="text-xl text-green-100 max-w-2xl">
            Les principes et engagements mutuels qui fondent notre partenariat solidaire.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">          {/* Introduction */}
          <div className="mb-16 p-8 bg-green-50 rounded-lg border-l-4 border-green-600">
            <p className="text-lg text-gray-800 leading-relaxed">
              La Charte des AMAP est un document fondateur qui définit les principes et engagements
              mutuels entre les paysans et les amapiens. Elle garantit que notre partenariat est
              basé sur la confiance, la transparence et le respect des valeurs communes.
            </p>
          </div>

          {/* For Producers/Farmers */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <Handshake className="w-8 h-8 text-green-600" />
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Engagements des Paysans</h2>
            </div>

            <div className="space-y-6">
              {/* Engagement 1 */}
              <div className="bg-white border-2 border-green-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Cultiver selon les principes de l'agriculture paysanne
                    </h3>
                    <p className="text-gray-700">
                      Privilégier les méthodes respectueuses de l'environnement, limiter l'usage des intrants chimiques,
                      favoriser la biodiversité et les pratiques agroécologiques. S'engager dans une démarche de
                      durabilité à long terme pour préserver nos terres.
                    </p>
                  </div>
                </div>
              </div>

              {/* Engagement 2 */}
              <div className="bg-white border-2 border-green-200 rounded-lg p-6 hover:shadow-lg transition-shadow">                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Approvisionner régulièrement en produits de qualité
                    </h3>
                    <p className="text-gray-700">
                      Livrer des produits frais et variés chaque semaine selon les saisons. Garantir la meilleure
                      qualité possible et la fraîcheur des produits. Respecter le calendrier des distributions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Engagement 3 */}
              <div className="bg-white border-2 border-green-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Assurer la transparence et la confiance
                    </h3>
                    <p className="text-gray-700">
                      Communiquer ouvertement sur les conditions de production, les difficultés rencontrées et les
                      solutions apportées. Accueillir les amapiens à la ferme pour renforcer le lien de confiance.
                      Expliquer les variations de récolte dues aux aléas climatiques.
                    </p>
                  </div>
                </div>
              </div>

              {/* Engagement 4 */}
              <div className="bg-white border-2 border-green-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Respecter les engagements financiers
                    </h3>
                    <p className="text-gray-700">
                      Établir des prix justes et raisonnables en fonction des coûts de production réels.
                      Informer les amapiens des tarifs et des conditions de vente. Respecter le calendrier de
                      paiement convenu. Gérer les fonds de manière transparente et responsable.
                    </p>
                  </div>
                </div>
              </div>

              {/* Engagement 5 */}
              <div className="bg-white border-2 border-green-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Participer à la vie collective de l'AMAP
                    </h3>
                    <p className="text-gray-700">
                      Assister aux réunions importantes de l'AMAP. Contribuer aux échanges et décisions collectives.
                      Partager ses connaissances et expériences avec les amapiens. Collaborer à l'amélioration continue
                      du partenariat.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* For Members/Citizens */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <Handshake className="w-8 h-8 text-green-600" />
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Engagements des Amapiens</h2>
            </div>
            <div className="space-y-6">
              {/* Engagement 1 */}
              <div className="bg-white border-2 border-green-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      S'engager via un contrat de partenariat
                    </h3>
                    <p className="text-gray-700">
                      Accepter un contrat ou un abonnement sur une période déterminée (généralement un trimestre ou une saison).
                      Verser le paiement à l'avance ou selon le calendrier convenu. Respecter les délais de rétractation
                      stipulés dans le contrat.
                    </p>
                  </div>
                </div>
              </div>

              {/* Engagement 2 */}
              <div className="bg-white border-2 border-green-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Accepter les variations de récolte
                    </h3>
                    <p className="text-gray-700">
                      Comprendre et accepter que la composition des paniers varie selon les saisons et les conditions
                      climatiques. Partager les bons et mauvais rendements avec le paysan. Valoriser l'authenticité
                      d'une agriculture réelle et vivante.
                    </p>
                  </div>
                </div>
              </div>
              {/* Engagement 3 */}
              <div className="bg-white border-2 border-green-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Récupérer les paniers régulièrement
                    </h3>
                    <p className="text-gray-700">
                      Se présenter aux distributions chaque semaine ou selon le calendrier convenu.
                      À Machecoul, les distributions se déroulent le vendredi de 17h à 19h.
                      Respecter les horaires et informer l'AMAP en cas d'absence.
                    </p>
                  </div>
                </div>
              </div>

              {/* Engagement 4 */}
              <div className="bg-white border-2 border-green-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Participer à la vie de l'AMAP
                    </h3>
                    <p className="text-gray-700">
                      Contribuer bénévolement aux tâches de l'association (distribution, organisation, accueil).
                      Participer à l'assemblée générale et aux réunions importantes. Engager un dialogue constructif
                      avec les autres membres et le paysan.
                    </p>
                  </div>
                </div>
              </div>
              {/* Engagement 5 */}
              <div className="bg-white border-2 border-green-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Respecter les valeurs de solidarité
                    </h3>
                    <p className="text-gray-700">
                      Soutenir une économie solidaire et équitable. Ne pas rester indifférent aux difficultés du paysan.
                      Reconnaître et valoriser le travail de celui-ci. Promouvoir l'agriculture paysanne auprès d'autres
                      personnes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Engagement 6 */}
              <div className="bg-white border-2 border-green-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Respecter l'environnement et la qualité
                    </h3>
                    <p className="text-gray-700">
                      Accepter des produits imparfaits mais sains et frais. Reconnaître que l'agriculture naturelle
                      n'est pas esthétiquement identique à celle de la grande distribution.
                      Réduire ses déchets en apportant ses contenants.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Mutual Principles */}
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Principes Mutuels</h2>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-8 border-2 border-green-600">
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Transparence et Confiance</h3>
                  <p className="text-gray-700">
                    Les deux parties s'engagent à communiquer ouvertement et honnêtement. Les prix doivent être justes
                    et raisonnables. Les décisions importantes sont prises collectivement.
                  </p>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Partage des Risques</h3>
                  <p className="text-gray-700">
                    Amapiens et paysans partagent ensemble les réalités de l'agriculture : bonnes récoltes comme
                    mauvaises. C'est le fondement de notre solidarité.
                  </p>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Respect Mutuel</h3>
                  <p className="text-gray-700">
                    Respect du travail et des efforts de chacun. Valorisation du métier de paysan et de l'engagement
                    des amapiens. Dialogue respectueux en cas de désaccord.
                  </p>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Amélioration Continue</h3>
                  <p className="text-gray-700">
                    L'AMAP évolue pour mieux servir ses membres. Les retours constructifs sont bienvenus.
                    Les ajustements se font dans le respect des principes fondamentaux.
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Reference to National Charter */}
          <div className="bg-blue-50 border-l-4 border-blue-600 p-8 rounded-r-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Référence à la Charte Nationale</h3>
            <p className="text-gray-700 mb-4">
              L'AMAP de Machecoul adhère aux principes de la Charte Nationale des AMAP,
              un document de référence adopté par le réseau français des AMAP pour garantir
              l'authenticité et la cohérence du modèle dans toute la France.
            </p>
            <p className="text-gray-700">
              Cette charte locale complète la charte nationale en adaptant les principes à
              la réalité de notre territoire et aux spécificités de notre région (Loire-Atlantique,
              Pays de Retz, Machecoul).
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-green-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 text-center">
            En accord avec ces principes ?
          </h2>
          <p className="text-center text-gray-700 text-lg mb-12 max-w-2xl mx-auto">
            Si vous partagez nos valeurs et souhaitez soutenir une agriculture paysanne en adhérant à cette charte,
            nous serions heureux de vous accueillir parmi nos amapiens.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
            >
              Rejoindre l'AMAP
            </Link>
            <Link
              href="/qu-est-ce-qu-une-amap"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-green-600 text-green-600 font-bold rounded-lg hover:bg-green-50 transition-colors"
            >
              En savoir plus sur les AMAP
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}