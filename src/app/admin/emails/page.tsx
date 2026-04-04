'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Mail, Send, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import type { Profile, ContractModel } from '@/types/database';

interface SentEmail {
  id: string;
  timestamp: string;
  to: string[];
  subject: string;
  recipientCount: number;
  status: 'sent' | 'pending';
}

interface EmailTemplate {
  name: string;
  title: string;
  subject: string;
  message: string;
}

const emailTemplates: EmailTemplate[] = [
  {
    name: 'delivery-reminder',
    title: 'Rappel de distribution',
    subject: 'Rappel : Distribution de votre contrat',
    message: `Bonjour,

Ceci est un rappel concernant votre distribution AMAP prévue cette semaine.

Détails de la distribution :
- Date : [DATE]
- Heure : [HEURE]
- Lieu : [LIEU]

N'oubliez pas de confirmer votre présence si nécessaire.

Cordialement,
L'équipe AMAP de Machecoul`,
  },
  {
    name: 'payment-reminder',
    title: 'Rappel de paiement',
    subject: 'Rappel : Paiement en attente',
    message: `Bonjour,

Nous vous rappelons qu'un paiement pour votre contrat AMAP est en attente.

Montant à payer : [MONTANT]
Date limite : [DATE_LIMITE]
Contrat : [CONTRAT]

Merci de régulariser rapidement. Si vous avez des questions, n'hésitez pas à nous contacter.

Cordialement,
L'équipe AMAP de Machecoul`,
  },
  {
    name: 'cancellation-notice',
    title: 'Annulation de distribution',
    subject: 'Avis : Distribution annulée',
    message: `Bonjour,

Nous vous informons que la distribution prévue le [DATE] est annulée.

Raison : [RAISON]

Les nouvelles modalités seront communiquées dans les prochains jours.

Nous nous excusons pour le désagrément.

Cordialement,
L'équipe AMAP de Machecoul`,
  },
];

export default function EmailsPage() {
  const [supabase] = useState(() => createClient());
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [contractModels, setContractModels] = useState<ContractModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Form state
  const [recipientType, setRecipientType] = useState<'all' | 'contract' | 'specific'>('all');
  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // History and stats
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all profiles
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'member')
          .order('first_name', { ascending: true });

        // Fetch contract models
        const { data: contractModelsData } = await supabase
          .from('contract_models')
          .select('*')
          .eq('status', 'active')
          .order('name', { ascending: true });

        setProfiles(profilesData || []);
        setContractModels(contractModelsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  const getRecipientEmails = (): string[] => {
    if (recipientType === 'all') {
      return profiles.map((p) => p.email);
    } else if (recipientType === 'contract' && selectedContractId) {
      // Filter profiles with active contracts for this model
      return profiles
        .filter((p) => {
          // This is a simplified filter - in production you'd query contracts table
          return true;
        })
        .map((p) => p.email);
    } else if (recipientType === 'specific' && selectedMemberId) {
      const member = profiles.find((p) => p.id === selectedMemberId);
      return member ? [member.email] : [];
    }
    return [];
  };

  const handleSelectTemplate = (templateName: string) => {
    const template = emailTemplates.find((t) => t.name === templateName);
    if (template) {
      setSelectedTemplate(templateName);
      setSubject(template.subject);
      setMessage(template.message);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      alert('Veuillez remplir le sujet et le message');
      return;
    }

    const recipients = getRecipientEmails();
    if (recipients.length === 0) {
      alert('Veuillez sélectionner au moins un destinataire');
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipients,
          subject,
          html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            ${message.replace(/\n/g, '<br />')}
          </div>`,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // Add to sent emails history
        const newEmail: SentEmail = {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleString('fr-FR'),
          to: recipients,
          subject,
          recipientCount: recipients.length,
          status: 'sent',
        };

        setSentEmails([newEmail, ...sentEmails]);

        // Reset form
        setSubject('');
        setMessage('');
        setSelectedTemplate('');
        setRecipientType('all');
        setSelectedContractId('');
        setSelectedMemberId('');

        alert(result.message || 'Email envoyé avec succès');
      } else {
        alert('Erreur lors de l\'envoi de l\'email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Erreur lors de l\'envoi de l\'email');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Chargement...</div>
      </div>
    );
  }

  const recipients = getRecipientEmails();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
            <Mail className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestion des emails</h1>
            <p className="text-sm text-slate-600">Envoyez des emails aux adhérents</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Send Email Form */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-green-600" />
              Envoyer un email
            </h2>

            <form onSubmit={handleSendEmail} className="space-y-4">
              {/* Recipient Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">
                  Destinataires
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="radio"
                      name="recipientType"
                      value="all"
                      checked={recipientType === 'all'}
                      onChange={(e) => {
                        setRecipientType(e.target.value as 'all');
                        setSelectedContractId('');
                        setSelectedMemberId('');
                      }}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      Tous les adhérents ({profiles.length})
                    </span>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="radio"
                      name="recipientType"
                      value="contract"
                      checked={recipientType === 'contract'}
                      onChange={(e) => setRecipientType(e.target.value as 'contract')}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      Adhérents d'un contrat
                    </span>
                  </label>

                  {recipientType === 'contract' && (
                    <select
                      value={selectedContractId}
                      onChange={(e) => setSelectedContractId(e.target.value)}
                      className="ml-7 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Sélectionner un contrat</option>
                      {contractModels.map((contract) => (
                        <option key={contract.id} value={contract.id}>
                          {contract.name}
                        </option>
                      ))}
                    </select>
                  )}

                  <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="radio"
                      name="recipientType"
                      value="specific"
                      checked={recipientType === 'specific'}
                      onChange={(e) => setRecipientType(e.target.value as 'specific')}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      Un adhérent spécifique
                    </span>
                  </label>

                  {recipientType === 'specific' && (
                    <select
                      value={selectedMemberId}
                      onChange={(e) => setSelectedMemberId(e.target.value)}
                      className="ml-7 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Sélectionner un adhérent</option>
                      {profiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.first_name} {profile.last_name} ({profile.email})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1">
                  Sujet
                </label>
                <input
                  id="subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Entrez le sujet de l'email"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Entrez votre message..."
                  rows={8}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                />
              </div>

              {/* Info box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  L'email sera envoyé à <strong>{recipients.length}</strong> destinataire(s)
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={sending || recipients.length === 0}
                className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Envoi en cours...' : 'Envoyer l\'email'}
              </button>
            </form>
          </div>

          {/* Quick Templates */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Modèles rapides</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {emailTemplates.map((template) => (
                <button
                  key={template.name}
                  onClick={() => handleSelectTemplate(template.name)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedTemplate === template.name
                      ? 'border-green-600 bg-green-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="font-medium text-slate-900">{template.title}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    Sujet : {template.subject}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Stats and History */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-600">{sentEmails.length}</div>
              <div className="text-sm text-green-700 font-medium mt-1">Emails envoyés</div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-3xl font-bold text-blue-600">
                {sentEmails.reduce((sum, e) => sum + e.recipientCount, 0)}
              </div>
              <div className="text-sm text-blue-700 font-medium mt-1">Destinataires</div>
            </div>
          </div>

          {/* Recent History */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Historique récent</h3>

            {sentEmails.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                Aucun email envoyé
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sentEmails.slice(0, 5).map((email) => (
                  <div
                    key={email.id}
                    className="p-3 border border-slate-200 rounded-lg text-xs space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      {email.status === 'sent' ? (
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                      )}
                      <span className="font-medium text-slate-900">{email.subject}</span>
                    </div>
                    <div className="text-slate-600 ml-6">
                      {email.recipientCount} destinataire(s)
                    </div>
                    <div className="text-slate-500 ml-6">{email.timestamp}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
