// app/api/portal-interno/tickets/send-email/route.js
import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/support-auth';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px; }
            .message { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .button { display: inline-block; padding: 12px 30px; background: #04F5A0; color: black; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✉️ Resposta do Suporte SwiftBot</h1>
            </div>
            <div class="content">
              <p>Olá,</p>
              <p>Recebemos uma resposta para o seu ticket de suporte:</p>
              
              <div class="message">
                ${message.replace(/\n/g, '<br>')}
              </div>

              <p>Atenciosamente,<br><strong>${session.user.full_name}</strong><br>Equipe SwiftBot</p>
              
              <center>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/portal-interno/tickets/${ticketId}" class="button">
                  Ver Ticket Completo
                </a>
              </center>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} SwiftBot - Todos os direitos reservados</p>
              <p>Este é um email automático, não responda.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log('✅ Email enviado:', info.messageId);

    // Registrar no histórico
    await supabaseAdmin
      .from('support_ticket_responses')
      .insert({
        ticket_id: ticketId,
        support_user_id: session.user.id,
        message: message,
        is_internal_note: false
      });

    // Log de ação
    await supabaseAdmin
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