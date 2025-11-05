// app/api/portal-interno/tickets/[id]/respond/route.js
import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/support-auth';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request, { params }) {
  try {
    const session = await getCurrentSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // ✅ FIX: Await params (Next.js 15)
    const { id } = await params;
    const body = await request.json();
    const { subject, message } = body;

    // Validações
    if (!subject || !subject.trim()) {
      return NextResponse.json(
        { success: false, error: 'Assunto é obrigatório' },
        { status: 400 }
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Mensagem é obrigatória' },
        { status: 400 }
      );
    }

    console.log('📧 ========================================');
    console.log('📧 INICIANDO ENVIO DE EMAIL');
    console.log('📧 Ticket ID:', id);
    console.log('📧 Enviado por:', session.user.full_name);
    console.log('📧 ========================================');

    // Buscar ticket e cliente
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('support_tickets')
      .select(`
        *,
        user_profiles (
          email,
          full_name
        )
      `)
      .eq('id', id)
      .single();

    if (ticketError || !ticket) {
      console.error('❌ Ticket não encontrado:', ticketError);
      return NextResponse.json(
        { success: false, error: 'Ticket não encontrado' },
        { status: 404 }
      );
    }

    const clientEmail = ticket.user_profiles.email;
    const clientName = ticket.user_profiles.full_name || 'Cliente';

    console.log('📧 Destinatário:', clientEmail);
    console.log('📧 Nome:', clientName);
    console.log('📧 Assunto:', subject);

    // ✅ Verificar credenciais SMTP
    const smtpConfig = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      debug: true, // ✅ Ativar debug
      logger: true  // ✅ Ativar logs
    };

    console.log('📧 ========================================');
    console.log('📧 CONFIGURAÇÃO SMTP:');
    console.log('📧 Host:', smtpConfig.host);
    console.log('📧 Port:', smtpConfig.port);
    console.log('📧 Secure:', smtpConfig.secure);
    console.log('📧 User:', smtpConfig.auth.user);
    console.log('📧 Pass:', smtpConfig.auth.pass ? '✅ Configurada' : '❌ FALTANDO');
    console.log('📧 ========================================');

    // ✅ VERIFICAÇÃO CRÍTICA
    if (!smtpConfig.host || !smtpConfig.auth.user || !smtpConfig.auth.pass) {
      console.error('❌ CREDENCIAIS SMTP INCOMPLETAS!');
      return NextResponse.json(
        { success: false, error: 'Configuração de email incompleta no servidor' },
        { status: 500 }
      );
    }

    // Criar transporter
    console.log('📧 Criando transporter...');
    const transporter = nodemailer.createTransport(smtpConfig);

    // ✅ TESTAR CONEXÃO PRIMEIRO
    console.log('📧 Testando conexão SMTP...');
    try {
      await transporter.verify();
      console.log('✅ Conexão SMTP OK!');
    } catch (verifyError) {
      console.error('❌ ERRO NA CONEXÃO SMTP:', verifyError);
      return NextResponse.json(
        { success: false, error: `Erro de conexão SMTP: ${verifyError.message}` },
        { status: 500 }
      );
    }

    // Montar email
    const emailOptions = {
      from: `"SwiftBot Suporte" <${process.env.SMTP_USER}>`,
      to: clientEmail,
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1a1a1a 0%, #000 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .logo { font-size: 28px; font-weight: bold; color: #04F5A0; margin-bottom: 10px; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .message { background: white; padding: 20px; border-left: 4px solid #04F5A0; margin: 20px 0; border-radius: 5px; white-space: pre-wrap; }
            .ticket-info { background: #e8e8e8; padding: 15px; border-radius: 5px; margin: 20px 0; font-size: 14px; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
            .button { display: inline-block; padding: 12px 30px; background: #04F5A0; color: black; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🤖 SwiftBot</div>
              <p style="margin: 0; opacity: 0.9;">Central de Suporte</p>
            </div>
            <div class="content">
              <h2 style="color: #1a1a1a; margin-top: 0;">Olá, ${clientName}!</h2>
              <p>Recebemos sua solicitação e temos uma atualização sobre seu ticket:</p>
              
              <div class="ticket-info">
                <strong>Ticket:</strong> #${id.substring(0, 8)}<br>
                <strong>Assunto Original:</strong> ${ticket.subject}<br>
                <strong>Status:</strong> 🟡 ${ticket.status === 'open' ? 'Aberto' : ticket.status === 'in_progress' ? 'Em Andamento' : 'Resolvido'}
              </div>

              <div class="message">
                <p><strong>Resposta de ${session.user.full_name}:</strong></p>
                <p>${message}</p>
              </div>

              <p>Se precisar de mais ajuda, responda este email ou acesse seu painel:</p>
              <center>
                <a href="https://swiftbot.com.br/suporte" class="button">Acessar Central de Suporte</a>
              </center>

              <div class="footer">
                <p><strong>SwiftBot - Atendimento Automatizado com IA</strong></p>
                <p>Este é um email automático. Para mais informações, visite <a href="https://swiftbot.com.br">swiftbot.com.br</a></p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    console.log('📧 ========================================');
    console.log('📧 ENVIANDO EMAIL...');
    console.log('📧 From:', emailOptions.from);
    console.log('📧 To:', emailOptions.to);
    console.log('📧 Subject:', emailOptions.subject);
    console.log('📧 ========================================');

    // ✅ ENVIAR COM TRY/CATCH
    let info;
    try {
      info = await transporter.sendMail(emailOptions);
      console.log('✅ ========================================');
      console.log('✅ EMAIL ENVIADO COM SUCESSO!');
      console.log('✅ Message ID:', info.messageId);
      console.log('✅ Response:', info.response);
      console.log('✅ ========================================');
    } catch (sendError) {
      console.error('❌ ========================================');
      console.error('❌ ERRO AO ENVIAR EMAIL:');
      console.error('❌ Error:', sendError.message);
      console.error('❌ Code:', sendError.code);
      console.error('❌ Command:', sendError.command);
      console.error('❌ ========================================');
      
      return NextResponse.json(
        { success: false, error: `Erro ao enviar email: ${sendError.message}` },
        { status: 500 }
      );
    }

    // Registrar resposta no banco
    await supabaseAdmin
      .from('support_ticket_responses')
      .insert({
        ticket_id: id,
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
        target_ticket_id: id,
        description: `Email enviado para ${clientEmail}`,
        metadata: { 
          subject, 
          messageId: info.messageId,
          response: info.response
        }
      });

    console.log('✅ Resposta registrada no banco');

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      message: 'Email enviado com sucesso!'
    });

  } catch (error) {
    console.error('❌ ========================================');
    console.error('❌ ERRO FATAL:');
    console.error('❌', error);
    console.error('❌ Stack:', error.stack);
    console.error('❌ ========================================');
    
    return NextResponse.json(
      { success: false, error: `Erro fatal: ${error.message}` },
      { status: 500 }
    );
  }
}