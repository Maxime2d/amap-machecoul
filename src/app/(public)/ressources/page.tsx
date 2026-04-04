'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ChevronDown, Book, MapPin, Mail, Users, Leaf, Heart } from 'lucide-react';

export default function RessourcesPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  const faqItems = [
    {
      question: "Comment devenir amapien ?",
      answer: "C'est simple ! Vous pouvez nous contacter via le formulaire de contact ou directement lors d'une distribution le vendredi. Nous vous expliquerons le fonctionnement, les tarifs et les engagements. Vous signerez ensuite un contrat de partenariat avant de commencer à recevoir vos paniers."
    },
    {
      question: "Quel est le coût d'un abonnement ?",
      answer: "Les prix varient selon le type et la taille du panier choisi. Ils sont définis de manière transparente et juste pour rémunérer équitablement notre paysan. Lors de votre premier contact, on vous présentera les différentes options et tarifs disponibles."
    },
    {
      question: "Peux-je changer de taille de panier en cours de saison ?",
      answer: "Oui, les ajustements sont possibles avec un préavis auprès de l'AMAP. Contactez-nous pour discuter de vos besoins et des modalités."
    },
    {
      question: "Que faire si je suis absent une semaine ?",
      answer: "Informez-nous de votre absence à l'avance si possible. Des solutions peuvent être trouvées : délégation à un ami, récupération le week-end, ou ajustement temporaire de votre abonnement."
    },
    {
      question: "Pourquoi y a-t-il des différences de qualité ou de quantité dans les paniers ?",
      answer: "C'est la réalité de l'agriculture ! Les récoltes dépendent de la météo, des saisons et des conditions du terroir. Cette variabilité fait partie du partage des risques avec le paysan, et c'est ce qui rend l'AMAP authentique."
    },    {
      question: "Puis-je visiter la ferme ?",
      answer: "Bien sûr ! Nous organisons régulièrement des visites à la ferme pour permettre aux amapiens de découvrir les conditions de production et de rencontrer le paysan. Consultez notre calendrier ou posez la question lors d'une distribution."
    },
    {
      question: "L'AMAP livre-t-elle à domicile ?",
      answer: "Non, les distributions se font à la salle polyvalente de Machecoul-Saint-Même chaque vendredi de 17h à 19h. C'est une occasion importante de créer du lien et de partager un moment ensemble."
    },
    {
      question: "Puis-je apporter des amis ou de la famille ?",
      answer: "Tout à fait ! Nous accueillons avec plaisir nouveaux amapiens et visiteurs. C'est d'ailleurs un excellent moyen de faire connaître notre projet et de créer une dynamique collective plus forte."
    }
  ];

  const resources = [
    {
      title: "Réseau National des AMAP",
      description: "Site officiel du réseau français des AMAP avec informations, actualités et documentation.",
      url: "https://www.amap-france.fr",
      icon: Users
    },
    {
      title: "Charte Nationale des AMAP",
      description: "Document de référence définissant les principes de fonctionnement des AMAP en France.",
      url: "https://www.amap-france.fr/la-charte-des-amap",
      icon: Book
    },    {
      title: "Agriculture Paysanne",
      description: "Informations sur les principes et pratiques de l'agriculture paysanne durable.",
      url: "https://www.agriculturepaysanne.org",
      icon: Leaf
    },
    {
      title: "Économie Solidaire",
      description: "Ressources sur le modèle économique solidaire et son impact social.",
      url: "https://www.economiesolidaire.org",
      icon: Heart
    }
  ];

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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Ressources</h1>
          <p className="text-xl text-green-100 max-w-2xl">
            Informations pratiques, documents utiles et réponses à vos questions.          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* How to Join */}
          <div className="mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Comment rejoindre l'AMAP ?</h2>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-14 w-14 rounded-full bg-green-600 text-white font-bold text-lg">
                    1
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Nous Contacter</h3>
                  <p className="text-gray-700 mb-4">
                    Remplissez le formulaire de contact ou venez nous parler directement lors d'une distribution
                    (tous les vendredis de 17h à 19h). Nous répondrons à toutes vos questions avec plaisir.
                  </p>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 text-green-600 font-bold hover:text-green-700"
                  >
                    Formulaire de contact
                    <ArrowRight className="w-4 h-4" />                  </Link>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-14 w-14 rounded-full bg-green-600 text-white font-bold text-lg">
                    2
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Discuter de vos Besoins</h3>
                  <p className="text-gray-700">
                    Nous vous présenterons les différents types de paniers, les tarifs, les calendriers et les modalités
                    de fonctionnement. Vous pourrez poser toutes vos questions et clarifier votre compréhension du modèle AMAP.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-14 w-14 rounded-full bg-green-600 text-white font-bold text-lg">
                    3
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Signer le Contrat</h3>
                  <p className="text-gray-700">
                    Vous signerez un contrat ou prendrez un abonnement avec les conditions convenues                    (durée, tarif, type de panier). Ce document formalise votre engagement mutuel.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-14 w-14 rounded-full bg-green-600 text-white font-bold text-lg">
                    4
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Effectuer le Paiement</h3>
                  <p className="text-gray-700">
                    Vous versez le montant convenu selon le calendrier défini (paiement anticipé ou échelonné).
                    Cet argent finance la production de votre paysan.
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-14 w-14 rounded-full bg-green-600 text-white font-bold text-lg">
                    5
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Venir Chercher vos Paniers</h3>                  <p className="text-gray-700">
                    À partir de la première semaine, venez chercher votre panier chaque vendredi de 17h à 19h
                    à la salle polyvalente de Machecoul-Saint-Même. Bienvenue dans la famille !
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Information & Documents */}
          <div className="mb-20 border-t-2 border-gray-200 pt-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Informations Pratiques</h2>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Location */}
              <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="w-6 h-6 text-green-600" />
                  <h3 className="text-xl font-bold text-gray-900">Lieu de Distribution</h3>
                </div>
                <p className="text-gray-700 mb-2">
                  <strong>Salle Polyvalente</strong><br />
                  Machecoul-Saint-Même<br />
                  Loire-Atlantique, Pays de Retz<br />
                  France
                </p>
              </div>

              {/* Contact */}
              <div className="bg-green-50 rounded-lg p-6 border border-green-200">                <div className="flex items-center gap-3 mb-4">
                  <Mail className="w-6 h-6 text-green-600" />
                  <h3 className="text-xl font-bold text-gray-900">Contact</h3>
                </div>
                <p className="text-gray-700">
                  <strong>Email :</strong><br />
                  <a
                    href="mailto:contact@amapmachemachecoul.fr"
                    className="text-green-600 hover:text-green-700 font-semibold"
                  >
                    contact@amapmachemachecoul.fr
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mb-20 border-t-2 border-gray-200 pt-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Questions Fréquemment Posées</h2>

            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <div
                  key={index}
                  className="border border-gray-300 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <button
                    onClick={() => setOpenFAQ(openFAQ === index ? null : index)}                    className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                  >
                    <h3 className="text-lg font-bold text-gray-900 text-left">
                      {item.question}
                    </h3>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-600 flex-shrink-0 transition-transform ${
                        openFAQ === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFAQ === index && (
                    <div className="px-6 py-4 bg-white border-t border-gray-300">
                      <p className="text-gray-700 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* External Resources */}
          <div className="border-t-2 border-gray-200 pt-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Ressources Externes</h2>
            <p className="text-gray-700 mb-8">
              Explorez ces ressources externes pour approfondir votre compréhension de l'agriculture paysanne,
              du modèle AMAP et de l'économie solidaire.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {resources.map((resource, index) => {
                const IconComponent = resource.icon;
                return (
                  <a
                    key={index}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white border-2 border-green-200 rounded-lg p-6 hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-green-100">
                          <IconComponent className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-700 transition-colors mb-2">
                          {resource.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3">
                          {resource.description}
                        </p>
                        <span className="inline-flex items-center gap-2 text-green-600 font-semibold text-sm group-hover:text-green-700">
                          Visiter le site
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-green-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Des questions sans réponse ?
          </h2>
          <p className="text-gray-700 text-lg mb-12 max-w-2xl mx-auto">
            Notre équipe est disponible et souhaite répondre à toutes vos interrogations.
            N'hésitez pas à nous contacter directement.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
            >
              Nous contacter
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/agenda"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-green-600 text-green-600 font-bold rounded-lg hover:bg-white transition-colors"
            >              Voir le calendrier
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
