/**
 * USAGE EXAMPLE: Engagement PDF Download Button Component
 * 
 * Add this to your contract detail page to allow members to download their engagement document
 */

// Example 1: Simple download function (can be used in any component)
export async function downloadEngagementPDF(contractId: string) {
  try {
    const response = await fetch(`/api/engagement/${contractId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate engagement document');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contrat-engagement-${contractId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('PDF download error:', error);
    throw error;
  }
}

// Example 2: React component with button
/*
'use client';

import { useState } from 'react';
import { downloadEngagementPDF } from '@/lib/pdf-utils'; // or wherever you put the function

interface EngagementDownloadButtonProps {
  contractId: string;
}

export function EngagementDownloadButton({ contractId }: EngagementDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await downloadEngagementPDF(contractId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download PDF');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Téléchargement...' : 'Télécharger le contrat'}
      </button>
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
}
*/

// Example 3: Use in a contract detail page
/*
import { EngagementDownloadButton } from '@/components/EngagementDownloadButton';

export default function ContractDetailPage({ params }: { params: { contractId: string } }) {
  return (
    <div className="space-y-4">
      <h1>Détail du Contrat</h1>
      
      <EngagementDownloadButton contractId={params.contractId} />
      
      // ... rest of contract details
    </div>
  );
}
*/
