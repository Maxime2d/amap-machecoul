'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { LogIn } from 'lucide-react';

export default function ConnexionPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message === 'Invalid login credentials') {
          setError('Email ou mot de passe incorrect');
        } else {
          setError(signInError.message || 'Une erreur est survenue');
        }
        return;
      }

      router.push('/app');
    } catch (err) {
      setError('Une erreur inattendue est survenue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 border border-green-100">
      <div className="flex justify-center mb-8">
        <div className="bg-green-100 p-3 rounded-lg">
          <LogIn className="w-6 h-6 text-green-700" />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Connexion</h1>
      <p className="text-center text-gray-600 text-sm mb-8">
        Accédez à votre espace adhérent
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="vous@exemple.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {loading ? 'Connexion en cours...' : 'Se connecter'}
        </button>
      </form>

      <div className="mt-6 space-y-3">
        <Link
          href="/inscription"
          className="block text-center text-sm text-green-600 hover:text-green-700 font-medium"
        >
          Créer un compte
        </Link>
        <Link
          href="/mot-de-passe-oublie"
          className="block text-center text-sm text-gray-600 hover:text-gray-700"
        >
          Mot de passe oublié?
        </Link>
      </div>
    </div>
  );
}
