import Link from 'next/link';
import { Share2, Heart } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-green-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold mb-4">À propos de l'AMAP</h3>
            <p className="text-green-100 leading-relaxed">
              L'AMAP de Machecoul-Saint-Même soutient les agriculteurs locaux en vous proposant des produits frais, de saison et cultivés selon les principes de l'agriculture paysanne.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-green-100 hover:text-white transition-colors">
                  Accueil
                </Link>
              </li>              <li>
                <Link href="/qu-est-ce-qu-une-amap" className="text-green-100 hover:text-white transition-colors">
                  Qu'est-ce qu'une AMAP ?
                </Link>
              </li>
              <li>
                <Link href="/la-charte" className="text-green-100 hover:text-white transition-colors">
                  La Charte
                </Link>
              </li>
              <li>
                <Link href="/producteurs" className="text-green-100 hover:text-white transition-colors">
                  Nos Producteurs
                </Link>
              </li>
              <li>
                <Link href="/agenda" className="text-green-100 hover:text-white transition-colors">
                  Agenda
                </Link>
              </li>
              <li>
                <Link href="/ressources" className="text-green-100 hover:text-white transition-colors">
                  Ressources
                </Link>
              </li>
              <li>
                <Link href="/actualites" className="text-green-100 hover:text-white transition-colors">
                  Actualités
                </Link>
              </li>              <li>
                <Link href="/contact" className="text-green-100 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-4">Infos pratiques</h3>
            <p className="text-green-100 mb-2">
              <strong>Distribution:</strong><br />
              Chaque vendredi de 17h à 19h
            </p>
            <p className="text-green-100">
              <strong>Lieu:</strong><br />
              Pépinières Brenelière<br />
              Machecoul-Saint-Même
            </p>
          </div>
        </div>

        {/* Social Links */}
        <div className="border-t border-green-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-green-100">
            &copy; {currentYear} AMAP de Machecoul. Tous droits réservés.
          </p>          <div className="flex gap-4 mt-4 md:mt-0">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-100 hover:text-white transition-colors"
              aria-label="Partager"
            >
              <Share2 className="w-5 h-5" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-100 hover:text-white transition-colors"
              aria-label="Nous aimer"
            >
              <Heart className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
