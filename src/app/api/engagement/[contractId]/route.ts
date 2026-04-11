import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, PDFPage, rgb } from 'pdf-lib';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type Contract = Database['public']['Tables']['contracts']['Row'];
type ContractModel = Database['public']['Tables']['contract_models']['Row'];
type Producer = Database['public']['Tables']['producers']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type Product = Database['public']['Tables']['products']['Row'];

interface ContractItem {
  product_id: string;
  delivery_date: string;
  quantity: number;
}

interface ModelProduct {
  product_id: string;
  price: number;
}

interface ModelDate {
  delivery_date: string;
}

interface ContractWithItems extends Contract {
  contract_items?: ContractItem[];
  contract_models?: ContractModel;
  profiles?: Profile;
}

const PAGE_WIDTH = 612; // 8.5 inches
const PAGE_HEIGHT = 792; // 11 inches
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;
const COLOR = rgb(0, 0, 0);
const GRAY = rgb(0.4, 0.4, 0.4);

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getYear(dateString: string | null | undefined): string {
  if (!dateString) return '';
  return new Date(dateString).getFullYear().toString();
}

async function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  options: any = {}
) {
  const { size = 11, bold = false, color = COLOR, align = 'left' } = options;
  const font = await page.doc.embedFont(bold ? 'Helvetica-Bold' : 'Helvetica');

  let xPos = x;
  if (align === 'center') {
    const textWidth = font.widthOfTextAtSize(text, size);
    xPos = x + (CONTENT_WIDTH - textWidth) / 2;
  } else if (align === 'right') {
    const textWidth = font.widthOfTextAtSize(text, size);
    xPos = x + CONTENT_WIDTH - textWidth;
  }

  page.drawText(text, {
    x: xPos,
    y,
    size,
    font,
    color,
  });
}

async function drawLine(page: PDFPage, x1: number, y1: number, x2: number, y2: number) {
  page.drawLine({
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
    thickness: 0.5,
    color: GRAY,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  try {
    const { contractId } = await params;
    const supabase = await createClient();

    // Fetch contract with related data
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Fetch contract model
    const { data: model, error: modelError } = await supabase
      .from('contract_models')
      .select('*')
      .eq('id', contract.model_id)
      .single();

    if (modelError || !model) {
      return NextResponse.json(
        { error: 'Contract model not found' },
        { status: 404 }
      );
    }

    // Fetch producer
    const { data: producer, error: producerError } = await supabase
      .from('producers')
      .select('*')
      .eq('id', model.producer_id)
      .single();

    if (producerError || !producer) {
      return NextResponse.json(
        { error: 'Producer not found' },
        { status: 404 }
      );
    }

    // Fetch profile (member)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', contract.user_id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Member profile not found' },
        { status: 404 }
      );
    }

    // Fetch contract items
    const { data: contractItems, error: itemsError } = await supabase
      .from('contract_items')
      .select('*')
      .eq('contract_id', contractId);

    if (itemsError) {
      return NextResponse.json(
        { error: 'Failed to fetch contract items' },
        { status: 500 }
      );
    }

    // Fetch model products with prices
    const { data: modelProducts, error: productsError } = await supabase
      .from('model_products')
      .select('*')
      .eq('model_id', model.id);

    if (productsError) {
      return NextResponse.json(
        { error: 'Failed to fetch model products' },
        { status: 500 }
      );
    }

    // Fetch product details
    const productIds = (contractItems || []).map(item => item.product_id);
    const { data: products, error: productDetailsError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds.length > 0 ? productIds : ['']);

    if (productDetailsError) {
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    // Fetch model dates (delivery dates)
    const { data: modelDates, error: datesError } = await supabase
      .from('model_dates')
      .select('*')
      .eq('model_id', model.id);

    if (datesError) {
      return NextResponse.json(
        { error: 'Failed to fetch delivery dates' },
        { status: 500 }
      );
    }

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

    let yPos = PAGE_HEIGHT - MARGIN;

    // 1. Header: "CONTRAT D'ENGAGEMENT"
    await drawText(page, 'CONTRAT D\'ENGAGEMENT', MARGIN, yPos, {
      size: 24,
      bold: true,
      align: 'center',
    });
    yPos -= 35;

    // 2. Subtitle: "AMAP de Machecoul"
    await drawText(page, 'AMAP de Machecoul', MARGIN, yPos, {
      size: 14,
      align: 'center',
      color: GRAY,
    });
    yPos -= 25;

    // 3. Season
    const startYear = getYear(model.start_date);
    const endYear = getYear(model.end_date);
    await drawText(page, `Saison ${startYear} - ${endYear}`, MARGIN, yPos, {
      size: 11,
      align: 'center',
      color: GRAY,
    });
    yPos -= 20;

    // 4. Contract name
    await drawText(page, `Contrat: ${model.name}`, MARGIN, yPos, {
      size: 11,
      bold: true,
    });
    yPos -= 30;

    // Draw separator line
    await drawLine(page, MARGIN, yPos, PAGE_WIDTH - MARGIN, yPos);
    yPos -= 15;

    // 5. Producer section
    await drawText(page, 'PRODUCTEUR', MARGIN, yPos, {
      size: 11,
      bold: true,
    });
    yPos -= 16;

    await drawText(page, `Nom: ${producer.name}`, MARGIN, yPos, { size: 10 });
    yPos -= 14;

    const producerAddress = producer.address || '';
    const producerCity = producer.city || '';
    const addressLine = `${producerAddress}${producerAddress && producerCity ? ', ' : ''}${producerCity}`;
    if (addressLine.trim()) {
      await drawText(page, `Adresse: ${addressLine}`, MARGIN, yPos, { size: 10 });
      yPos -= 14;
    }

    const producerEmail = producer.contact_email || '';
    const producerPhone = producer.phone || '';
    const contactLine = `${producerEmail}${producerEmail && producerPhone ? ' / ' : ''}${producerPhone}`;
    if (contactLine.trim()) {
      await drawText(page, `Contact: ${contactLine}`, MARGIN, yPos, { size: 10 });
      yPos -= 14;
    }

    yPos -= 10;

    // 6. Member section
    await drawText(page, 'ADHÉRENT', MARGIN, yPos, {
      size: 11,
      bold: true,
    });
    yPos -= 16;

    const memberName = `${profile.first_name} ${profile.last_name}`;
    await drawText(page, `Nom: ${memberName}`, MARGIN, yPos, { size: 10 });
    yPos -= 14;

    if (profile.email) {
      await drawText(page, `Email: ${profile.email}`, MARGIN, yPos, { size: 10 });
      yPos -= 14;
    }

    if (profile.phone) {
      await drawText(page, `Téléphone: ${profile.phone}`, MARGIN, yPos, { size: 10 });
      yPos -= 14;
    }

    const memberAddressLine = `${profile.address || ''}${profile.address && (profile.city || profile.zip_code) ? ', ' : ''}${profile.zip_code || ''} ${profile.city || ''}`.trim();
    if (memberAddressLine) {
      await drawText(page, `Adresse: ${memberAddressLine}`, MARGIN, yPos, { size: 10 });
      yPos -= 14;
    }

    yPos -= 10;

    // 7. Products table
    await drawText(page, 'PRODUITS', MARGIN, yPos, {
      size: 11,
      bold: true,
    });
    yPos -= 16;

    // Table headers
    const colWidths = [200, 90, 80, 80];
    const headerY = yPos;

    await drawText(page, 'Produit', MARGIN, headerY, {
      size: 10,
      bold: true,
    });
    await drawText(page, 'Prix unitaire', MARGIN + colWidths[0], headerY, {
      size: 10,
      bold: true,
    });
    await drawText(page, 'Quantité', MARGIN + colWidths[0] + colWidths[1], headerY, {
      size: 10,
      bold: true,
    });
    await drawText(page, 'Sous-total', MARGIN + colWidths[0] + colWidths[1] + colWidths[2], headerY, {
      size: 10,
      bold: true,
    });

    yPos -= 16;
    await drawLine(page, MARGIN, yPos, PAGE_WIDTH - MARGIN, yPos);
    yPos -= 10;

    // Table rows
    let subtotal = 0;
    const productMap = new Map(products?.map(p => [p.id, p]) ?? []);
    const modelProductMap = new Map(modelProducts?.map(mp => [mp.product_id, mp]) ?? []);

    if (contractItems && contractItems.length > 0) {
      for (const item of contractItems) {
        const product = productMap.get(item.product_id);
        const modelProduct = modelProductMap.get(item.product_id);

        if (product && modelProduct) {
          const productName = product.name;
          const price = modelProduct.price;
          const quantity = item.quantity;
          const rowSubtotal = price * quantity;
          subtotal += rowSubtotal;

          await drawText(page, productName, MARGIN, yPos, { size: 9 });
          await drawText(page, `${price.toFixed(2)}€`, MARGIN + colWidths[0], yPos, { size: 9 });
          await drawText(page, quantity.toString(), MARGIN + colWidths[0] + colWidths[1], yPos, {
            size: 9,
          });
          await drawText(page, `${rowSubtotal.toFixed(2)}€`, MARGIN + colWidths[0] + colWidths[1] + colWidths[2], yPos, {
            size: 9,
          });

          yPos -= 14;

          // Check if we need a new page
          if (yPos < MARGIN + 100) {
            page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
            yPos = PAGE_HEIGHT - MARGIN;
          }
        }
      }
    }

    // Total row
    yPos -= 5;
    await drawLine(page, MARGIN, yPos, PAGE_WIDTH - MARGIN, yPos);
    yPos -= 12;

    await drawText(page, 'TOTAL', MARGIN, yPos, { size: 10, bold: true });
    await drawText(page, `${subtotal.toFixed(2)}€`, MARGIN + colWidths[0] + colWidths[1] + colWidths[2], yPos, {
      size: 10,
      bold: true,
    });

    yPos -= 20;

    // 8. Delivery info
    const deliveryCount = modelDates?.length || 0;
    const totalAmount = contract.total_amount ?? subtotal;

    await drawText(page, `Nombre de livraisons: ${deliveryCount}`, MARGIN, yPos, { size: 10 });
    yPos -= 14;

    await drawText(page, `Montant total du contrat: ${totalAmount.toFixed(2)}€`, MARGIN, yPos, {
      size: 10,
    });
    yPos -= 14;

    await drawText(page, 'Lieu de distribution: Pépinières Brenelière, Machecoul', MARGIN, yPos, {
      size: 10,
    });
    yPos -= 14;

    await drawText(page, 'Jour et horaire: Vendredi de 17h à 19h', MARGIN, yPos, {
      size: 10,
    });
    yPos -= 25;

    // 9. Engagement text
    const engagementText1 = `Le soussigné s'engage à régler la somme de ${totalAmount.toFixed(2)}€ selon les modalités de paiement convenues.`;
    const engagementText2 = 'Le producteur s\'engage à fournir les produits listés ci-dessus aux dates de livraison prévues.';

    await drawText(page, engagementText1, MARGIN, yPos, { size: 10 });
    yPos -= 20;
    await drawText(page, engagementText2, MARGIN, yPos, { size: 10 });
    yPos -= 30;

    // 10. Signature lines
    await drawText(page, 'Date: ________________', MARGIN, yPos, { size: 10 });
    yPos -= 25;

    await drawText(page, 'Signature de l\'adhérent: ________________', MARGIN, yPos, {
      size: 10,
    });
    yPos -= 25;

    await drawText(page, 'Signature du producteur: ________________', MARGIN, yPos, {
      size: 10,
    });

    // 11. Footer
    await drawText(page, 'AMAP de Machecoul — Association loi 1901', MARGIN, MARGIN, {
      size: 9,
      align: 'center',
      color: GRAY,
    });

    // Save and return PDF
    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="contrat-engagement-${contractId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
