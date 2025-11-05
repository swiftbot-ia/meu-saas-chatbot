// ====================================================================
// SCRIPT: Criar Primeiro Usuário ADMIN
// ====================================================================
// Execute: node scripts/create-first-admin.js
// ====================================================================

// IMPORTANTE: Carregar variáveis de ambiente PRIMEIRO
require('dotenv').config({ path: '.env.local' });

const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validar se as variáveis foram carregadas
if (!supabaseUrl) {
  console.error('❌ ERRO: NEXT_PUBLIC_SUPABASE_URL não encontrada no .env.local');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ ERRO: SUPABASE_SERVICE_ROLE_KEY não encontrada no .env.local');
  console.log('\n⚠️  Você precisa adicionar esta variável no .env.local:');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui');
  console.log('\n📍 Onde encontrar:');
  console.log('   1. Acesse seu projeto no Supabase');
  console.log('   2. Vá em Settings > API');
  console.log('   3. Copie a chave "service_role" (não é a anon!)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createFirstAdmin() {
  try {
    console.log('🚀 Criando primeiro usuário ADMIN...\n');

    // CONFIGURAÇÕES DO ADMIN (ALTERE AQUI!)
    const adminData = {
      email: 'caio.guedes@swiftbot.com.br', // ⚠️ ALTERE ESTE EMAIL
      password: 'cA@4567893535',    // ⚠️ ALTERE ESTA SENHA
      full_name: 'Caio Guedes',
      role: 'admin'
    };

    console.log('📋 Dados do admin:');
    console.log('   Email:', adminData.email);
    console.log('   Senha:', adminData.password);
    console.log('   Nome:', adminData.full_name);
    console.log('   Role:', adminData.role);
    console.log('\n⏳ Processando...\n');

    // Gerar hash da senha
    const passwordHash = await bcrypt.hash(adminData.password, 10);

    // Inserir no banco
    const { data, error } = await supabase
      .from('support_users')
      .insert({
        email: adminData.email,
        password_hash: passwordHash,
        full_name: adminData.full_name,
        role: adminData.role,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar admin:', error.message);
      
      if (error.code === '23505') {
        console.log('\n⚠️  Este email já existe no banco de dados!');
        console.log('   Tente usar outro email ou delete o usuário existente.');
      } else if (error.code === '42P01') {
        console.log('\n⚠️  A tabela support_users não existe!');
        console.log('   Execute o arquivo support-schema-FINAL.sql no Supabase primeiro.');
      }
      
      process.exit(1);
    }

    console.log('✅ Admin criado com sucesso!');
    console.log('\n📧 Credenciais:');
    console.log('   Email:', adminData.email);
    console.log('   Senha:', adminData.password);
    console.log('   ID:', data.id);
    console.log('\n⚠️  IMPORTANTE:');
    console.log('   • Guarde estas credenciais em local seguro!');
    console.log('   • Troque a senha após o primeiro login!');
    console.log('   • Não commite este script com as credenciais reais!\n');
    console.log('🎉 Agora você pode fazer login em: /portal-interno/login\n');

  } catch (err) {
    console.error('❌ Erro fatal:', err.message);
    process.exit(1);
  }
}

createFirstAdmin();