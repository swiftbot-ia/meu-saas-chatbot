// app/api/portal-interno/tickets/send-email/route.js
import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/support-auth';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Lazy initialization to avoid build-time errors
let supabaseAdmin = null;
function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      supabaseAdmin = createClient(url, key);
    }
  }
  return supabaseAdmin;
}

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { ticketId, to, subject, message } = await request.json();

    // Validações
    if (!ticketId || !to || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    console.log('📧 Enviando email:', { ticketId, to, subject });

    // Configurar nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Enviar email
    const info = await transporter.sendMail({
      from: `"SwiftBot Suporte" <${process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      html: `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" dir="ltr" lang="pt-BR">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <meta name="x-apple-disable-message-reformatting" />
    <title>Resposta do Suporte SwiftBot</title>
    <style type="text/css">
      /* Reset e Base */
      body { margin: 0; padding: 0; min-width: 100%; background-color: #0A0A0A; }
      table { border-spacing: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
      td { padding: 0; }
      img { border: 0; }
      
      /* Hover do Botão */
      .button-link:hover { background-color: #00E88C !important; box-shadow: 0 0 15px rgba(0, 255, 153, 0.4) !important; }
    </style>
  </head>
  <body style="background-color: #0A0A0A; margin: 0; padding: 0;">
    
    <div style="display:none;font-size:1px;color:#0A0A0A;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
      Você recebeu uma resposta referente ao seu ticket de suporte.
    </div>

    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #0A0A0A; padding: 40px 0;">
      <tr>
        <td align="center">
          
          <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #1E1E1E; border-radius: 24px; border: 1px solid #333333;">
            <tr>
              <td style="padding: 48px;">
                
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td>
                      <img 
                        src="https://swiftbot.com.br/LOGO-SWIFTBOT.png" 
                        alt="SwiftBot" 
                        width="40" 
                        height="40"
                        style="display: block; width: 40px; height: 40px; border: 0;"
                      />
                    </td>
                  </tr>
                </table>

                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-top: 24px; margin-bottom: 24px;">
                  <tr>
                    <td style="border-top: 1px solid #333333;"></td>
                  </tr>
                </table>

                <h1 style="margin: 0 0 24px 0; color: #FFFFFF; font-size: 22px; font-weight: 700; line-height: 30px; letter-spacing: -0.5px;">
                  Atualização do Ticket
                </h1>

                <p style="margin: 0 0 24px 0; color: #B0B0B0; font-size: 16px; line-height: 26px;">
                  Olá, a equipe de suporte da SwiftBot acabou de responder ao seu chamado.
                </p>

                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #252525; border-radius: 16px; border-left: 4px solid #00FF99; margin-bottom: 32px;">
                  <tr>
                    <td style="padding: 24px;">
                      <p style="margin: 0 0 16px 0; color: #00FF99; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                        ${session.user.full_name} respondeu:
                      </p>
                      <div style="color: #E0E0E0; font-size: 16px; line-height: 26px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                        ${message.replace(/\n/g, '<br>')}
                      </div>
                    </td>
                  </tr>
                </table>

                <p style="margin: 0 0 32px 0; color: #B0B0B0; font-size: 16px; line-height: 26px;">
                  Para responder ou ver o histórico completo, acesse o portal clicando abaixo:
                </p>

                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td align="center">
                      <a href="${process.env.NEXT_PUBLIC_APP_URL}/portal-interno/tickets/${ticketId}" target="_blank" class="button-link" style="display: inline-block; background-color: #00FF99; color: #000000; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 32px; border-radius: 50px; text-transform: none; mso-padding-alt:0;">
                        <span style="mso-text-raise: 15pt;">Ver Ticket Completo</span>
                        </a>
                    </td>
                  </tr>
                </table>

                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-top: 32px; margin-bottom: 32px;">
                  <tr>
                    <td style="border-top: 1px solid #333333;"></td>
                  </tr>
                </table>

                <p style="margin: 0; color: #444444; font-size: 12px; line-height: 18px;">
                  Por favor, não responda diretamente a este email automático.<br/>
                  &copy; ${new Date().getFullYear()} SwiftBot. Todos os direitos reservados.
                </p>
                
              </td>
            </tr>
          </table>

          <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; margin: 0 auto;">
            <tr>
              <td style="padding: 20px; text-align: center; color: #444444; font-size: 12px;">
                SwiftBot • Suporte Técnico
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </body>
</html>
`
    });

    console.log('✅ Email enviado:', info.messageId);

    // Registrar no histórico
    await getSupabaseAdmin()
      .from('support_ticket_responses')
      .insert({
        ticket_id: ticketId,
        support_user_id: session.user.id,
        message: message,
        is_internal_note: false
      });

    // Log de ação
    await getSupabaseAdmin()
      .from('support_actions_log')
      .insert({
        support_user_id: session.user.id,
        action_type: 'email_sent',
        target_ticket_id: ticketId,
        description: `Email enviado para ${to}`,
        metadata: { subject, messageId: info.messageId }
      });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      message: 'Email enviado com sucesso!'
    });

  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    return NextResponse.json(
      { success: false, error: `Erro ao enviar email: ${error.message}` },
      { status: 500 }
    );
  }
}