'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/admin/DataTable';

interface PermanenceDate {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  enrolledCount: number;
  capacity: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
}

const mockPermanences: PermanenceDate[] = [
  {
    id: '1',
    date: '2026-04-04',
    startTime: '17:00',
    endTime: '19:00',
    enrolledCount: 8,
    capacity: 15,
    status: 'upcoming',
  },
  {
    id: '2',
    date: '2026-04-11',
    startTime: '17:00',
    endTime: '19:00',    enrolledCount: 12,
    capacity: 15,
    status: 'scheduled',
  },
  {
    id: '3',
    date: '2026-04-18',
    startTime: '17:00',
    endTime: '19:00',
    enrolledCount: 15,
    capacity: 15,
    status: 'scheduled',
  },
  {
    id: '4',
    date: '2026-04-25',
    startTime: '17:00',
    endTime: '19:00',
    enrolledCount: 5,
    capacity: 15,
    status: 'scheduled',
  },
];

export default function PermanencesPage() {
  const [permanences, setPermanences] = useState<PermanenceDate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('17:00');
  const [newEndTime, setNewEndTime] = useState('19:00');
  useEffect(() => {
    setPermanences(mockPermanences);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      scheduled: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Programmé' },
      ongoing: { bg: 'bg-green-100', text: 'text-green-800', label: 'En cours' },
      completed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Complété' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Annulé' },
      upcoming: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Imminent' },
    };
    const config = statusConfig[status] || statusConfig.scheduled;
    return `${config.bg} ${config.text}`;
  };

  const getCapacityBadge = (enrolled: number, capacity: number) => {
    const percentage = (enrolled / capacity) * 100;
    if (percentage >= 90) {
      return 'bg-red-100 text-red-800';
    }    if (percentage >= 70) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-green-100 text-green-800';
  };

  const handleAddPermanence = () => {
    if (!newDate) {
      alert('Veuillez sélectionner une date');
      return;
    }
    const newPermanence: PermanenceDate = {
      id: Date.now().toString(),
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      enrolledCount: 0,
      capacity: 15,
      status: 'scheduled',
    };
    setPermanences([...permanences, newPermanence].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ));
    setNewDate('');
    setNewStartTime('17:00');
    setNewEndTime('19:00');
    setShowForm(false);
  };

  const handleDeletePermanence = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette permanence ?')) {      setPermanences(permanences.filter(p => p.id !== id));
    }
  };

  const rows = permanences.map((perm) => [
    formatDate(perm.date),
    `${perm.startTime} - ${perm.endTime}`,
    <span key={`status-${perm.id}`} className={`inline-block px-3 py-1 rounded text-xs font-semibold ${getStatusBadge(perm.status)}`}>
      {perm.status === 'scheduled' ? 'Programmé' : perm.status === 'ongoing' ? 'En cours' : 'Complété'}
    </span>,
    <div key={`capacity-${perm.id}`} className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
        <div
          className="bg-green-600 h-2 rounded-full"
          style={{ width: `${(perm.enrolledCount / perm.capacity) * 100}%` }}
        />
      </div>
      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${getCapacityBadge(perm.enrolledCount, perm.capacity)}`}>
        {perm.enrolledCount}/{perm.capacity}
      </span>
    </div>,
    <button
      key={`delete-${perm.id}`}
      onClick={() => handleDeletePermanence(perm.id)}
      className="inline-flex items-center gap-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors text-sm"
      title="Supprimer"
    >
      <Trash2 className="w-4 h-4" />
      Supprimer
    </button>,
  ]);
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
            <Calendar className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestion des permanences</h1>
            <p className="text-sm text-slate-600">{permanences.length} date(s) programmée(s)</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Ajouter une date
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Nouvelle permanence</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>              <label className="block text-sm font-medium text-slate-700 mb-2">
                Date (vendredi)
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Heure de début
              </label>
              <input
                type="time"
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Heure de fin
              </label>
              <input
                type="time"
                value={newEndTime}
                onChange={(e) => setNewEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <button
              onClick={handleAddPermanence}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
            >
              Ajouter
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Permanences Table */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        {permanences.length > 0 ? (
          <DataTable
            headers={['Date', 'Horaires', 'Statut', 'Inscriptions', 'Action']}
            rows={rows}
          />
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />            <h3 className="text-lg font-bold text-slate-900 mb-2">Aucune permanence programmée</h3>
            <p className="text-slate-600 mb-4">Commencez par ajouter une première date de permanence</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Ajouter une date
            </button>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-900">
          <strong>Info:</strong> Les permanences sont programmées par défaut le vendredi de 17h à 19h. Vous pouvez ajouter, modifier les dates et consulter les inscriptions des adhérents.
        </p>
      </div>
    </div>
  );
}
