'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Clock, ArrowLeft } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission logic will be added later
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', message: '' });
      setSubmitted(false);
    }, 3000);
  };

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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact</h1>
          <p className="text-xl text-green-100">
            Une question ? Nous sommes là pour vous aider et répondre à vos demandes.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16">
            {/* Contact Info */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Informations pratiques</h2>

              {/* Location */}
              <div className="mb-8">
                <div className="flex gap-4 mb-4">
                  <MapPin className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Adresse</h3>
                    <p className="text-gray-700">
                      Salle polyvalente<br />
                      Machecoul-Saint-Même<br />
                      Loire-Atlantique
                    </p>
                  </div>
                </div>
              </div>

              {/* Hours */}
              <div className="mb-8">
                <div className="flex gap-4 mb-4">
                  <Clock className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Distribution</h3>
                    <p className="text-gray-700">
                      Chaque jeudi<br />
                      17h30 à 19h00
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Methods */}
              <div className="mb-8">
                <div className="flex gap-4 mb-4">
                  <Mail className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Email</h3>
                    <a href="mailto:contact@amapmachemachecoul.fr" className="text-green-600 hover:text-green-700 transition-colors">
                      contact@amapmachemachecoul.fr
                    </a>
                  </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="mt-12 bg-gray-200 rounded-lg h-64 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-600 font-semibold">Carte à venir</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Envoyez-nous un message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                    placeholder="Votre nom"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                    placeholder="votre@email.com"
                  />
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all resize-none"
                    placeholder="Votre message..."
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitted}
                >
                  {submitted ? 'Message envoyé !' : 'Envoyer le message'}
                </button>

                {/* Success Message */}
                {submitted && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 font-semibold">
                      Merci ! Votre message a été envoyé avec succès.
                    </p>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Useful Links */}
          <div className="mt-24 pt-24 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Liens utiles</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Link
                href="/producteurs"
                className="p-6 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
              >
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-700 transition-colors mb-2">
                  Nos Producteurs
                </h3>
                <p className="text-gray-600">Découvrez tous nos producteurs paysans.</p>
              </Link>

              <Link
                href="/actualites"
                className="p-6 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
              >
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-700 transition-colors mb-2">
                  Actualités
                </h3>
                <p className="text-gray-600">Suivez l'actualité de l'AMAP.</p>
              </Link>

              <Link
                href="/"
                className="p-6 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
              >
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-700 transition-colors mb-2">
                  Accueil
                </h3>
                <p className="text-gray-600">Retour à la page d'accueil.</p>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
