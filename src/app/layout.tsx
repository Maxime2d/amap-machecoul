import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'AMAP de Machecoul', template: '%s | AMAP de Machecoul' },
  description: 'Association pour le Maintien d\'une Agriculture Paysanne à Machecoul-Saint-Même. Produits frais, locaux et de saison directement auprès de nos producteurs.',
  keywords: ['AMAP', 'Machecoul', 'agriculture paysanne', 'circuit court', 'bio', 'local'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
