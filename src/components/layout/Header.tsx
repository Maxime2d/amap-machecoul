'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Leaf } from 'lucide-react';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Leaf className="w-6 h-6 text-green-600 group-hover:text-green-700 transition-colors" />
            <span className="text-xl font-bold text-gray-900 group-hover:text-green-700 transition-colors">
              AMAP Machecoul
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-gray-700 hover:text-green-700 font-medium transition-colors"
            >
              Accueil
            </Link>
            <Link
              href="/producteurs"
              className="text-gray-700 hover:text-green-700 font-medium transition-colors"
            >
              Nos Producteurs
            </Link>
            <Link
              href="/actualites"
              className="text-gray-700 hover:text-green-700 font-medium transition-colors"
            >
              Actualités
            </Link>
            <Link
              href="/contact"
              className="text-gray-700 hover:text-green-700 font-medium transition-colors"
            >
              Contact
            </Link>
          </nav>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Link
              href="/connexion"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Espace adhérent
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-green-700 transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <nav className="md:hidden pb-4 space-y-3">
            <Link
              href="/"
              className="block text-gray-700 hover:text-green-700 font-medium transition-colors py-2"
              onClick={() => setIsOpen(false)}
            >
              Accueil
            </Link>
            <Link
              href="/producteurs"
              className="block text-gray-700 hover:text-green-700 font-medium transition-colors py-2"
              onClick={() => setIsOpen(false)}
            >
              Nos Producteurs
            </Link>
            <Link
              href="/actualites"
              className="block text-gray-700 hover:text-green-700 font-medium transition-colors py-2"
              onClick={() => setIsOpen(false)}
            >
              Actualités
            </Link>
            <Link
              href="/contact"
              className="block text-gray-700 hover:text-green-700 font-medium transition-colors py-2"
              onClick={() => setIsOpen(false)}
            >
              Contact
            </Link>
            <Link
              href="/connexion"
              className="block w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-center"
              onClick={() => setIsOpen(false)}
            >
              Espace adhérent
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
