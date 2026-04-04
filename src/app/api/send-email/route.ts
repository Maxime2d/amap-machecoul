import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html } = await request.json();

    // Validate input
    if (!to || !Array.isArray(to) || to.length === 0) {
      return NextResponse.json(
        { error: 'Recipients (to) must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!subject || typeof subject !== 'string') {
      return NextResponse.json(
        { error: 'Subject is required and must be a string' },
        { status: 400 }
      );
    }

    if (!html || typeof html !== 'string') {
      return NextResponse.json(
        { error: 'HTML content is required and must be a string' },
        { status: 400 }
      );
    }

    // TODO: Configure Resend API key in .env.local
    // Uncomment the following code when RESEND_API_KEY is set:
    // import { Resend } from 'resend';
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // const { data, error } = await resend.emails.send({
    //   from: 'AMAP de Machecoul <noreply@amap-machecoul.fr>',
    //   to,
    //   subject,
    //   html,
    // });
    //
    // if (error) {
    //   console.error('Resend API error:', error);
    //   return NextResponse.json(
    //     { error: 'Failed to send email' },
    //     { status: 500 }
    //   );
    // }
    //
    // return NextResponse.json({
    //   success: true,
    //   message: `Email envoyé à ${to.length} destinataire(s)`,
    //   messageId: data?.id,
    // });

    // For now, just log the email details
    console.log('Email would be sent with the following details:', {
      from: 'AMAP de Machecoul <noreply@amap-machecoul.fr>',
      to,
      subject,
      recipientCount: to.length,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Email envoyé à ${to.length} destinataire(s)`,
    });
  } catch (error) {
    console.error('Error processing email request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
