'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { User, Save, AlertCircle, CheckCircle } from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zip_code: '',
    role: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile({
          first_name: (data as any).first_name || '',
          last_name: (data as any).last_name || '',
          email: (data as any).email || '',
          phone: (data as any).phone || '',
          address: (data as any).address || '',
          city: (data as any).city || '',
          zip_code: (data as any).zip_code || '',
          role: (data as any).role || '',
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await (supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone || null,
          address: profile.address || null,
          city: profile.city || null,
          zip_code: profile.zip_code || null,
        } as any)
        .eq('id', user.id));

      if (error) {
        setMessage({
          type: 'error',
          text: 'Erreur lors de la mise à jour du profil',
        });
      } else {
        setMessage({
          type: 'success',
          text: 'Profil mis à jour avec succès',
        });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: 'Une erreur inattendue est survenue',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-2xl">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-stone-200 rounded mb-4"></div>
            <div className="h-4 bg-stone-200 rounded mb-6"></div>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-10 bg-stone-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-green-100 p-3 rounded-lg">
          <User className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Mon profil</h1>
          <p className="text-stone-600">Gérez vos informations personnelles</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-8 space-y-6">
        {message && (
          <div
            className={`flex items-center gap-3 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <p
              className={
                message.type === 'success' ? 'text-green-700' : 'text-red-700'
              }
            >
              {message.text}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Prénom
            </label>
            <input
              type="text"
              value={profile.first_name}
              onChange={(e) =>
                setProfile({ ...profile, first_name: e.target.value })
              }
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Nom
            </label>
            <input
              type="text"
              value={profile.last_name}
              onChange={(e) =>
                setProfile({ ...profile, last_name: e.target.value })
              }
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={profile.email}
            disabled
            className="w-full px-4 py-2 border border-stone-300 rounded-lg bg-stone-50 text-stone-600"
          />
          <p className="text-xs text-stone-500 mt-1">
            L'adresse email ne peut pas être modifiée
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Téléphone
          </label>
          <input
            type="tel"
            value={profile.phone}
            onChange={(e) =>
              setProfile({ ...profile, phone: e.target.value })
            }
            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="+33 6 12 34 56 78"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Adresse
          </label>
          <input
            type="text"
            value={profile.address}
            onChange={(e) =>
              setProfile({ ...profile, address: e.target.value })
            }
            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Rue de l'exemple"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Ville
            </label>
            <input
              type="text"
              value={profile.city}
              onChange={(e) =>
                setProfile({ ...profile, city: e.target.value })
              }
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Paris"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Code postal
            </label>
            <input
              type="text"
              value={profile.zip_code}
              onChange={(e) =>
                setProfile({ ...profile, zip_code: e.target.value })
              }
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="75000"
            />
          </div>
        </div>

        {profile.role && (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Rôle
            </label>
            <div className="w-full px-4 py-2 border border-stone-300 rounded-lg bg-stone-50 text-stone-600 inline-block">
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                {profile.role === 'member' && 'Adhérent'}
                {profile.role === 'admin' && 'Administrateur'}
                {profile.role === 'producer' && 'Producteur'}
                {profile.role === 'referent' && 'Référent'}
                {profile.role === 'treasurer' && 'Trésorier'}
              </span>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-stone-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 w-full md:w-auto px-6 py-3 bg-green-700 hover:bg-green-800 disabled:bg-stone-400 text-white rounded-lg font-medium transition-colors"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>
    </div>
  );
}
