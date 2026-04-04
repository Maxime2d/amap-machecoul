import Link from 'next/link';
import { Leaf, Users, Heart, ShieldCheck, Sprout, ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata = {
  title: "Qu'est-ce qu'une AMAP?",
  description: "Découvrez ce qu'est une AMAP et ses principes fondamentaux.",
};

export default function WhatIsAMAPPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-green-700 to-green-800 text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-green-100 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-5 h-5" />Retour à l&apos;accueil
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Qu&apos;est-ce qu&apos;une AMAP ?</h1>
          <p className="text-xl text-green-100 max-w-2xl">Comprendre le modèle de l&apos;agriculture paysanne et de la solidarité économique.</p>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Définition</h2>
            <div className="bg-green-50 border-l-4 border-green-600 p-8 rounded-r-lg">
              <p className="text-lg text-gray-800 leading-relaxed">
                <strong>AMAP</strong> signifie <strong>Association pour le Maintien d&apos;une Agriculture Paysanne</strong>.
                C&apos;est un partenariat entre citoyens et agriculteurs paysans basé sur un engagement mutuel,
                la solidarité et le respect de l&apos;environnement. L&apos;AMAP de Machecoul relie les habitants de
                notre région à des agriculteurs locaux de Loire-Atlantique et du Pays de Retz.
              </p>
            </div>
          </div>

          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Un partenariat entre citoyens et paysans</h2>
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <Users className="w-8 h-8 text-green-600" />Pour les citoyens (amapiens)
                </h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex gap-3"><span className="text-green-600 font-bold">•</span><span>Accès à des produits frais et de saison</span></li>
                  <li className="flex gap-3"><span className="text-green-600 font-bold">•</span><span>Soutien direct aux agriculteurs locaux</span></li>
                  <li className="flex gap-3"><span className="text-green-600 font-bold">•</span><span>Traçabilité complète de votre nourriture</span></li>
                  <li className="flex gap-3"><span className="text-green-600 font-bold">•</span><span>Engagement dans une démarche solidaire</span></li>
                  <li className="flex gap-3"><span className="text-green-600 font-bold">•</span><span>Partage de risques et de récoltes avec les paysans</span></li>
                </ul>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <Sprout className="w-8 h-8 text-green-600" />Pour les paysans
                </h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex gap-3"><span className="text-green-600 font-bold">•</span><span>Débouché assuré pour leur production</span></li>
                  <li className="flex gap-3"><span className="text-green-600 font-bold">•</span><span>Paiement anticipé ou régulier</span></li>
                  <li className="flex gap-3"><span className="text-green-600 font-bold">•</span><span>Réduction des risques liés aux aléas climatiques</span></li>
                  <li className="flex gap-3"><span className="text-green-600 font-bold">•</span><span>Reconnaissance et lien direct avec les consommateurs</span></li>
                  <li className="flex gap-3"><span className="text-green-600 font-bold">•</span><span>Autonomie dans leurs choix agricoles</span></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Comment ça marche ?</h2>
            <div className="space-y-6">
              {[
                { num: '1', title: 'Engagement et pré-financement', desc: "Vous vous engagez auprès d'un agriculteur paysan en finançant sa production à l'avance." },
                { num: '2', title: 'Paniers réguliers', desc: 'Chaque vendredi de 17h à 19h, vous recevez un panier rempli de produits variés cultivés par votre paysan.' },
                { num: '3', title: 'Partage des risques', desc: "Les bonnes comme les mauvaises récoltes sont partagées entre citoyens et paysans. C'est une forme de solidarité." },
                { num: '4', title: 'Engagement communautaire', desc: "Les amapiens s'investissent dans la vie de l'AMAP : organisation des distributions, participation aux récoltes." },
              ].map((step) => (
                <div key={step.num} className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-600 text-white font-bold text-lg">{step.num}</div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-700">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Les 5 principes de l&apos;AMAP</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { icon: Leaf, title: 'Agriculture Paysanne', desc: "Soutien à une agriculture respectueuse de l'environnement, à taille humaine, basée sur les savoirs locaux." },
                { icon: Heart, title: 'Économie Solidaire', desc: 'Prix justes, transparence totale, et partage équitable des bénéfices entre paysans et amapiens.' },
                { icon: Sprout, title: 'Pratiques Écologiques', desc: "Préservation de l'environnement, réduction des pollutions et protection de la biodiversité." },
                { icon: ShieldCheck, title: 'Lien Direct', desc: 'Relation de confiance directe entre paysans et consommateurs, sans intermédiaire.' },
                { icon: Users, title: 'Esprit Collectif', desc: "Gouvernance démocratique, décisions collectives, implication active de tous les membres." },
              ].map((p, i) => (
                <div key={i} className="bg-white border-2 border-green-200 rounded-lg p-8 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <p.icon className="w-8 h-8 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">{p.title}</h3>
                      <p className="text-gray-700">{p.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Pourquoi rejoindre l&apos;AMAP de Machecoul ?</h2>
            <div className="space-y-4 text-gray-700">
              <p><strong>Soutenir l&apos;agriculture paysanne locale</strong> en Loire-Atlantique et Pays de Retz.</p>
              <p><strong>Manger mieux :</strong> Des produits frais, de saison, cultivés avec passion à quelques kilomètres de chez vous.</p>
              <p><strong>Créer du lien :</strong> Découvrir les visages de ceux qui cultivent votre nourriture.</p>
              <p><strong>Faire un geste pour la planète :</strong> Réduire votre empreinte écologique.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-green-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Prêt à nous rejoindre ?</h2>
          <p className="text-lg text-green-100 mb-12 max-w-2xl mx-auto">Découvrez notre charte et comment devenir amapien dans la région de Machecoul.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/la-charte" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-green-700 font-bold rounded-lg hover:bg-green-50 transition-colors">
              Lire la Charte<ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-green-800 transition-colors">
              Nous contacter
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
