'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus } from 'lucide-react';
import { DataTable } from '@/components/admin/DataTable';
import Link from 'next/link';

interface ShiftPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  enrolledCount: number;
  capacity: number;
}

const mockShifts: ShiftPeriod[] = [
  {
    id: '1',
    name: 'Permanences avril',
    startDate: '2026-04-01',
    endDate: '2026-04-30',
    enrolledCount: 24,
    capacity: 30,
  },
  {
    id: '2',
    name: 'Permanences mai',
    startDate: '2026-05-01',
    endDate: '2026-05-31',
    enrolledCount: 18,
    capacity: 30,
  },
  {
    id: '3',
    name: 'Permanences juin',
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    enrolledCount: 12,
    capacity: 30,
  },
];

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<ShiftPeriod[]>([]);

  useEffect(() => {
    setShifts(mockShifts);
  }, []);

  const getCapacityBadge = (enrolled: number, capacity: number) => {
    const percentage = (enrolled / capacity) * 100;
    if (percentage >= 90) {
      return 'bg-red-100 text-red-800';
    }
    if (percentage >= 70) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-green-100 text-green-800';
  };

  const rows = shifts.map((shift) => [
    shift.name,
    shift.startDate,
    shift.endDate,
    <div key={`capacity-${shift.id}`} className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
        <div
          className="bg-indigo-600 h-2 rounded-full"
          style={{ width: `${(shift.enrolledCount / shift.capacity) * 100}%` }}
        />
      </div>
      <span
        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getCapacityBadge(
          shift.enrolledCount,
          shift.capacity
        )}`}
      >
        {shift.enrolledCount}/{shift.capacity}
      </span>
    </div>,
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestion des permanences</h1>
            <p className="text-sm text-slate-600">{shifts.length} période(s)</p>
          </div>
        </div>
        <Link
          href="#"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Nouvelle période
        </Link>
      </div>

      {/* Shifts Table */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <DataTable
          headers={['Période', 'Début', 'Fin', 'Inscriptions']}
          rows={rows}
        />
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Conseil:</strong> Les permanences sont gérées par période. Vous pouvez créer, modifier ou archiver les périodes ici. Les capacités sont affichées en temps réel.
        </p>
      </div>
    </div>
  );
}
