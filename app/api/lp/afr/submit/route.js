import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
    try {
        const body = await request.json();
        const {
            name,
            email,
            whatsapp,
            companyName,
            sector,
            website,
            objective,
            targetAudience,
            personality,
            challenge
        } = body;

        // Basic Validation
        if (!name || !email || !whatsapp) {
            return NextResponse.json(
                { success: false, error: 'Campos obrigatórios faltando (Nome, Email, WhatsApp)' },
                { status: 400 }
            );
        }

        console.log('📧 Recebendo lead AFR:', { name, email, companyName });

        // Configure Transporter (using existing env vars)
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const partnerEmail = "cleiton.calixto@treesmart.com.br";

        // Formatting the email content
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; color: #333; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
    h2 { color: #000; border-bottom: 2px solid #00FF99; padding-bottom: 10px; }
    .item { margin-bottom: 15px; }
    .label { font-weight: bold; color: #666; font-size: 0.9em; text-transform: uppercase; }
    .value { font-size: 1.1em; color: #000; }
    .highlight { background-color: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #00FF99; }
  </style>
</head>
<body>
  <div class="container">
    <h2>🎯 Novo Contato - Consultoria SwiftBot</h2>
    <p>Um novo cliente interessado preencheu o formulário na sua Landing Page.</p>
    
    <div class="item">
      <div class="label">Nome</div>
      <div class="value">${name}</div>
    </div>
    
    <div class="item">
      <div class="label">Email</div>
      <div class="value"><a href="mailto:${email}">${email}</a></div>
    </div>
    
    <div class="item">
      <div class="label">WhatsApp</div>
      <div class="value"><a href="https://wa.me/${whatsapp.replace(/\D/g, '')}">${whatsapp}</a></div>
    </div>
    
    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
    
    <div class="item">
      <div class="label">Empresa</div>
      <div class="value">${companyName || 'Não informado'}</div>
    </div>
    
    <div class="item">
      <div class="label">Setor</div>
      <div class="value">${sector || 'Não informado'}</div>
    </div>
    
    <div class="item">
      <div class="label">Site/Instagram</div>
      <div class="value">${website || 'Não informado'}</div>
    </div>
    
    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
    
    <div class="highlight">
      <div class="item">
        <div class="label">Objetivo do Agente</div>
        <div class="value">${objective || 'Não informado'}</div>
      </div>
      
      <div class="item">
        <div class="label">Público Alvo</div>
        <div class="value">${targetAudience || 'Não informado'}</div>
      </div>
      
      <div class="item">
        <div class="label">Personalidade Desejada</div>
        <div class="value">${personality || 'Não informado'}</div>
      </div>
    </div>
    
    <div class="item" style="margin-top: 20px;">
      <div class="label">Maior Desafio/Observações</div>
      <div class="value" style="white-space: pre-wrap;">${challenge || 'Não informado'}</div>
    </div>
    
    <p style="font-size: 0.8em; color: #999; margin-top: 30px; text-align: center;">
      Lead capturado via Landing Page Parceiro (AFR)
    </p>
  </div>
</body>
</html>
    `;

        // Send Email
        await transporter.sendMail({
            from: `"SwiftBot Partner LP" <${process.env.SMTP_USER}>`,
            to: partnerEmail,
            replyTo: email, // Facilitate reply
            subject: `🎯 Novo Lead Consultoria: ${name} - ${companyName}`,
            html: htmlContent
        });

        return NextResponse.json({ success: true, message: 'Solicitação enviada com sucesso!' });

    } catch (error) {
        console.error('❌ Erro no envio do lead AFR:', error);
        return NextResponse.json(
            { success: false, error: 'Erro ao processar solicitação.' },
            { status: 500 }
        );
    }
}
