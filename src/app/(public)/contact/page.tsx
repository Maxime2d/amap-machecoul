'use client';

import { useState, useEffect, useRef } from 'react';
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
                      Pépinières Brenelière<br />
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
                      Chaque vendredi<br />
                      17h00 à 19h00
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

              {/* Map */}
              <div className="mt-12">
                <ContactMap />
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

/* ─── Map component using Leaflet + OpenStreetMap ─── */

const PEPINIERES_LAT = 46.9926;
const PEPINIERES_LNG = -1.8185;

function ContactMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current || loaded) return;

    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      if (!mapRef.current) return;
      const L = (window as any).L;

      const map = L.map(mapRef.current, {
        scrollWheelZoom: false,
      }).setView([PEPINIERES_LAT, PEPINIERES_LNG], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Custom green marker
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width: 36px; height: 36px;
          background: #16a34a;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });

      L.marker([PEPINIERES_LAT, PEPINIERES_LNG], { icon })
        .addTo(map)
        .bindPopup(
          `<div style="text-align:center;font-family:system-ui;padding:4px 0;">
            <strong style="font-size:14px;">AMAP Machecoul</strong><br/>
            <span style="color:#555;font-size:12px;">Pepinieres Breneliere</span><br/>
            <span style="color:#555;font-size:12px;">Vendredi 17h-19h</span>
          </div>`
        )
        .openPopup();

      setLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup handled by React unmount
    };
  }, [loaded]);

  return (
    <div
      ref={mapRef}
      className="w-full h-72 rounded-xl overflow-hidden border border-gray-200 shadow-sm"
      style={{ zIndex: 0 }}
    />
  );
}
