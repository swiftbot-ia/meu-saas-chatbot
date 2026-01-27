import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      whatsapp,
      companyName,
      sector,
      companySize,
      productSummary,
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

    console.log('📧 Recebendo lead Tree Smart:', { name, email, companyName });

    // Função auxiliar para criar transporter
    const createTransporter = (host) => {
      const port = parseInt(process.env.SMTP_PORT || '465');
      return nodemailer.createTransport({
        host: host,
        port: port,
        secure: process.env.SMTP_SECURE === 'true' || port === 465, // Force secure if port 465
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD || process.env.SMTP_PASS // Supports both
        }
      });
    };

    // Email de destino
    const partnerEmail = "eucalixtocleiton@gmail.com";

    // Formatting the email content
    const htmlContent = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" dir="ltr" lang="pt-BR">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Novo Lead - Tree Smart</title>
    <style type="text/css">
      body { margin: 0; padding: 0; min-width: 100%; background-color: #0A0A0A; }
      table { border-spacing: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
      td { padding: 0; }
      img { border: 0; }
    </style>
  </head>
  <body style="background-color: #0A0A0A; margin: 0; padding: 0;">
    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #0A0A0A; padding: 40px 0;">
      <tr>
        <td align="center">
          <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #1E1E1E; border-radius: 24px; border: 1px solid #333333;">
            <tr>
              <td style="padding: 48px;">
                
                <h1 style="margin: 0 0 24px 0; color: #FFFFFF; font-size: 22px; font-weight: 700; line-height: 30px;">
                  🎯 Novo Lead (Tree Smart)
                </h1>

                <p style="margin: 0 0 24px 0; color: #B0B0B0; font-size: 16px;">
                  Um novo cliente solicitou diagnóstico via Landing Page.
                </p>

                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #252525; border-radius: 16px; border-left: 4px solid #00FF99; margin-bottom: 32px;">
                  <tr>
                    <td style="padding: 24px;">
                      
                      <!-- CONTATO -->
                      <p style="color: #00FF99; font-size: 12px; font-weight: 700; text-transform: uppercase;">👤 Contato</p>
                      <p style="color: #E0E0E0; font-size: 16px; margin: 5px 0 20px 0;">
                        <strong>Nome:</strong> ${name}<br/>
                        <strong>Email:</strong> ${email}<br/>
                        <strong>WhatsApp:</strong> ${whatsapp}
                      </p>

                      <hr style="border: 0; border-top: 1px solid #333; margin: 15px 0;" />
                      
                      <!-- EMPRESA -->
                      <p style="color: #00FF99; font-size: 12px; font-weight: 700; text-transform: uppercase;">🏢 Empresa</p>
                      <p style="color: #E0E0E0; font-size: 16px; margin: 5px 0 20px 0;">
                        <strong>Nome:</strong> ${companyName || '-'}<br/>
                        <strong>Tamanho:</strong> ${companySize || '-'}<br/>
                        <strong>Setor:</strong> ${sector || '-'}<br/>
                        <strong>Site:</strong> ${website || '-'}
                      </p>
                      <p style="color: #AAA; font-size: 14px; margin: 0 0 20px 0;">
                        <em>" ${productSummary || '(Sem resumo)'} "</em>
                      </p>

                      <hr style="border: 0; border-top: 1px solid #333; margin: 15px 0;" />

                      <!-- OBJETIVO -->
                      <p style="color: #00FF99; font-size: 12px; font-weight: 700; text-transform: uppercase;">🚀 IA & Objetivos</p>
                      <p style="color: #E0E0E0; font-size: 16px; margin: 5px 0 0 0;">
                        <strong>Objetivo:</strong> ${objective}<br/>
                        <strong>Público:</strong> ${targetAudience || '-'}<br/>
                        <strong>Personalidade:</strong> ${personality}
                      </p>

                    </td>
                  </tr>
                </table>

                <p style="color: #B0B0B0; font-size: 14px; font-weight: bold;">Desafio/Observações:</p>
                <div style="background-color: #111; padding: 15px; border-radius: 8px; color: #FFF; font-size: 14px; line-height: 1.5; border: 1px solid #333;">
                  ${challenge || 'Nenhuma observação.'}
                </div>

                <p style="color: #444444; font-size: 12px; margin-top: 30px; text-align: center;">
                  Lead gerado em ${new Date().toLocaleString('pt-BR')} via SwiftBot Partnership
                </p>
                
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
    `;

    // Tentar enviar com o host do .env
    try {
      console.log(`📧 Tentando enviar via ${process.env.SMTP_HOST}...`);
      const transporter = createTransporter(process.env.SMTP_HOST);
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"SwiftBot Partner LP" <${process.env.SMTP_USER}>`,
        to: partnerEmail,
        replyTo: email,
        subject: `🎯 Novo Lead: ${name} - ${companyName || 'Empresa'}`,
        html: htmlContent
      });
    } catch (error) {
      // Se der erro de DNS (ENOTFOUND), tenta fallback para Zoho
      if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
        console.warn(`⚠️ Falha DNS no host ${process.env.SMTP_HOST}. Tentando fallback para smtppro.zoho.com...`);
        const fallbackTransporter = createTransporter('smtppro.zoho.com');

        await fallbackTransporter.sendMail({
          from: process.env.SMTP_FROM || `"SwiftBot Partner LP" <${process.env.SMTP_USER}>`,
          to: partnerEmail,
          replyTo: email,
          subject: `🎯 Novo Lead: ${name} - ${companyName || 'Empresa'}`,
          html: htmlContent
        });
      } else {
        // Se for outro erro (ex: Auth 535), repassa o erro original
        throw error;
      }
    }

    return NextResponse.json({ success: true, message: 'Solicitação enviada com sucesso!' });

  } catch (error) {
    console.error('❌ Erro no envio do lead AFR:', error);
    // Return detailed error for debugging
    return NextResponse.json(
      { success: false, error: 'Erro ao processar solicitação: ' + (error.message || 'Erro desconhecido') },
      { status: 500 }
    );
  }
}
