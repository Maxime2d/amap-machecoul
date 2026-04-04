# Engagement Document PDF API

## Overview

This API route generates a formal "Contrat d'Engagement" (Engagement Contract) PDF document for AMAP members.

## Route

```
GET /api/engagement/[contractId]
```

## Parameters

- `contractId` (path parameter): The unique identifier of the contract

## Response

Returns a PDF file with `Content-Type: application/pdf` and proper Content-Disposition header for download.

## Error Handling

Returns JSON error responses:
- `404`: Contract not found
- `500`: Database query or PDF generation errors

## PDF Content Structure

The generated PDF includes:

1. **Header**: "CONTRAT D'ENGAGEMENT" (bold, centered, 24pt)
2. **Subtitle**: "AMAP de Machecoul" (14pt, gray)
3. **Season**: "Saison YYYY - YYYY"
4. **Contract Name**: "Contrat: [Model Name]"
5. **Producer Section**:
   - Name
   - Address
   - Email and Phone
6. **Member Section**:
   - Name (first_name + last_name)
   - Email
   - Phone
   - Address with zip code and city
7. **Products Table**:
   - Columns: Produit | Prix unitaire | Quantité | Sous-total
   - One row per product with quantities
   - Total row
8. **Delivery Information**:
   - Number of deliveries (from model_dates)
   - Total contract amount (from contract.total_amount or calculated from items)
   - Distribution location: "Salle associative, Machecoul"
   - Distribution time: "Vendredi de 17h à 19h"
9. **Engagement Text**:
   - Member commitment to pay
   - Producer commitment to deliver
10. **Signature Lines**:
    - Date
    - Member signature
    - Producer signature
11. **Footer**: "AMAP de Machecoul — Association loi 1901"

## Database Queries

The route performs the following queries:

1. Fetch contract from `contracts` table
2. Fetch contract model from `contract_models` table
3. Fetch producer from `producers` table
4. Fetch member profile from `profiles` table
5. Fetch contract items from `contract_items` table
6. Fetch model products with prices from `model_products` table
7. Fetch product details from `products` table
8. Fetch delivery dates from `model_dates` table

## Usage Example

```typescript
// In a Next.js client component
async function downloadEngagement(contractId: string) {
  const response = await fetch(`/api/engagement/${contractId}`);
  
  if (!response.ok) {
    throw new Error('Failed to generate engagement document');
  }
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `contrat-engagement-${contractId}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
```

## PDF Specifications

- **Page Size**: US Letter (8.5" x 11")
- **Margins**: 40pt on all sides
- **Font**: Helvetica for regular text, Helvetica-Bold for headings
- **Color**: Black for main text, Gray (40% opacity) for secondary text

## Implementation Notes

- Uses `pdf-lib` library for PDF generation (pure PDF-lib, no HTML-to-PDF)
- Async/await for database queries using Supabase
- Dynamic page creation if content exceeds a single page
- Handles missing optional fields gracefully
- Formats prices with 2 decimal places and euro symbol
- French localization for dates and text
