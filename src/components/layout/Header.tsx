'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Leaf, ChevronDown } from 'lucide-react';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
            {/* L'AMAP Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-gray-700 hover:text-green-700 font-medium transition-colors">
                L'AMAP
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute left-0 mt-0 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 z-50">
                <Link
                  href="/qu-est-ce-qu-une-amap"
                  className="block px-4 py-2 text-gray-700 hover:text-green-700 hover:bg-green-50 transition-colors"
                >
                  Qu'est-ce qu'une AMAP ?
                </Link>
                <Link
                  href="/la-charte"
                  className="block px-4 py-2 text-gray-700 hover:text-green-700 hover:bg-green-50 transition-colors"
                >
                  La Charte
                </Link>
                <Link
                  href="/producteurs"
                  className="block px-4 py-2 text-gray-700 hover:text-green-700 hover:bg-green-50 transition-colors"
                >
                  Nos Producteurs
                </Link>
              </div>
            </div>
            <Link
              href="/agenda"
              className="text-gray-700 hover:text-green-700 font-medium transition-colors"
            >
              Agenda
            </Link>
            <Link
              href="/ressources"
              className="text-gray-700 hover:text-green-700 font-medium transition-colors"
            >
              Ressources
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
            {/* L'AMAP Mobile Section */}
            <div>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 text-gray-700 hover:text-green-700 font-medium transition-colors py-2 w-full"
              >
                L'AMAP
                <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {dropdownOpen && (
                <div className="pl-4 space-y-2 mt-2">
                  <Link
                    href="/qu-est-ce-qu-une-amap"
                    className="block text-gray-700 hover:text-green-700 transition-colors py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    Qu'est-ce qu'une AMAP ?
                  </Link>
                  <Link
                    href="/la-charte"
                    className="block text-gray-700 hover:text-green-700 transition-colors py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    La Charte
                  </Link>
                  <Link
                    href="/producteurs"
                    className="block text-gray-700 hover:text-green-700 transition-colors py-2"                    onClick={() => setIsOpen(false)}
                  >
                    Nos Producteurs
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/agenda"
              className="block text-gray-700 hover:text-green-700 font-medium transition-colors py-2"
              onClick={() => setIsOpen(false)}
            >
              Agenda
            </Link>
            <Link
              href="/ressources"
              className="block text-gray-700 hover:text-green-700 font-medium transition-colors py-2"
              onClick={() => setIsOpen(false)}
            >
              Ressources
            </Link>
            <Link
              href="/actualites"
              className="block text-gray-700 hover:text-green-700 font-medium transition-colors py-2"
              onClick={() => setIsOpen(false)}
            >
              Actualités
            </Link>            <Link
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
