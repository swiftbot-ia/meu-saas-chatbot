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
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html xmlns="http://www.w3.org/1999/xhtml" dir="ltr" lang="pt-BR">
          <head>
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <meta name="x-apple-disable-message-reformatting" />
            <title>Atualização do Ticket #${id.substring(0, 8)}</title>
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
              Atualização sobre o ticket #${id.substring(0, 8)}: ${ticket.subject}
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

                        <h1 style="margin: 0 0 8px 0; color: #FFFFFF; font-size: 22px; font-weight: 700; line-height: 30px; letter-spacing: -0.5px;">
                          Atualização do Ticket
                        </h1>
                        <p style="margin: 0 0 24px 0; color: #B0B0B0; font-size: 16px;">
                          Olá, <strong>${clientName}</strong>.
                        </p>

                        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #151515; border-radius: 12px; margin-bottom: 24px; border: 1px solid #333333;">
                          <tr>
                            <td style="padding: 16px;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                    <tr>
                                        <td style="padding-bottom: 8px;">
                                            <span style="color: #666666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Ticket ID</span><br/>
                                            <span style="color: #FFFFFF; font-size: 14px; font-family: monospace;">#${id.substring(0, 8)}</span>
                                        </td>
                                        <td style="padding-bottom: 8px;" align="right">
                                            <span style="color: #666666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Status</span><br/>
                                            <span style="color: #00FF99; font-size: 14px; font-weight: 600;">
                                                ${ticket.status === 'open' ? '🟡 Aberto' : ticket.status === 'in_progress' ? '🔵 Em Andamento' : '🟢 Resolvido'}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colspan="2" style="border-top: 1px solid #333333; padding-top: 8px;">
                                            <span style="color: #666666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Assunto</span><br/>
                                            <span style="color: #FFFFFF; font-size: 14px;">${ticket.subject}</span>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                          </tr>
                        </table>

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

                        <p style="margin: 0 0 32px 0; color: #B0B0B0; font-size: 16px; line-height: 26px; text-align: center;">
                          Você pode responder diretamente a este ticket acessando sua área do cliente:
                        </p>

                        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                          <tr>
                            <td align="center">
                              <a href="https://swiftbot.com.br/suporte" target="_blank" class="button-link" style="display: inline-block; background-color: #00FF99; color: #000000; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 32px; border-radius: 50px; text-transform: none; mso-padding-alt:0;">
                                <span style="mso-text-raise: 15pt;">Acessar Central de Suporte</span>
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
                          Para mais informações, visite <a href="https://swiftbot.com.br" style="color: #666666; text-decoration: underline;">swiftbot.com.br</a><br/>
                          &copy; ${new Date().getFullYear()} SwiftBot. Todos os direitos reservados.
                        </p>
                        
                      </td>
                    </tr>
                  </table>

                  <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; margin: 0 auto;">
                    <tr>
                      <td style="padding: 20px; text-align: center; color: #444444; font-size: 12px;">
                        SwiftBot • Atendimento com IA
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>
            </table>
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