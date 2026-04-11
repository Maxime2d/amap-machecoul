import type { Metadata } from 'next';
import { Leaf } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Authentification | AMAP de Machecoul',
  description: 'Connectez-vous ou créez un compte sur l\'AMAP de Machecoul',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8f7f4] flex">
      {/* Left — decorative panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 relative overflow-hidden flex-col justify-between p-10">
        {/* Subtle texture */}
        <div className="absolute inset-0 opacity-[0.06]" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'2\' cy=\'2\' r=\'1\' fill=\'white\'/%3E%3C/svg%3E")', backgroundSize: '20px 20px'}} />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute top-20 -left-10 w-40 h-40 bg-white/5 rounded-full" />

        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-3 mb-16 group">
            <div className="w-11 h-11 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold text-lg">AMAP de Machecoul</span>
          </Link>
          <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-4">
            Des produits bio,<br />
            locaux et de saison.
          </h2>
          <p className="text-green-100 text-lg leading-relaxed max-w-sm">
            Rejoignez notre communauté d'adhérents et soutenez une agriculture paysanne et responsable.
          </p>
        </div>

        <div className="relative">
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
              🌿
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Distribution chaque vendredi</p>
              <p className="text-green-200 text-xs mt-0.5">17h — 19h · Pépinières Brenelière, Machecoul</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right — form area */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-stone-900 font-bold text-lg">AMAP de Machecoul</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
