// scripts/setup-stripe-prices.js
// Script para criar todos os Prices na Stripe para o sistema de upgrade/downgrade
// Execute: node scripts/setup-stripe-prices.js

require('dotenv').config({ path: '.env.local' })
const Stripe = require('stripe')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// ============================================
// CONFIGURAÇÃO DE PREÇOS
// ============================================

const PLAN_PRICES = {
  monthly: {
    1: 165,
    2: 305,
    3: 445,
    4: 585,
    5: 625,
    6: 750,
    7: 875
  },
  annual: {
    1: 1776,
    2: 3294,
    3: 4806,
    4: 6318,
    5: 6750,
    6: 8100,
    7: 9450
  }
}

const PLAN_NAMES = {
  1: 'Plano Starter',
  2: 'Plano Growth',
  3: 'Plano Professional',
  4: 'Plano Business',
  5: 'Plano Enterprise',
  6: 'Plano Premium',
  7: 'Plano Ultimate'
}

// ============================================
// CRIAR OU BUSCAR PRODUTO
// ============================================

async function getOrCreateProduct() {
  try {
    console.log('📦 Buscando produto existente...')

    const products = await stripe.products.list({
      limit: 100,
      active: true
    })

    const existingProduct = products.data.find(p =>
      p.metadata?.app === 'swiftbot' &&
      p.metadata?.type === 'subscription'
    )

    if (existingProduct) {
      console.log(`✅ Produto encontrado: ${existingProduct.name} (${existingProduct.id})`)
      return existingProduct
    }

    console.log('🆕 Criando novo produto...')

    const newProduct = await stripe.products.create({
      name: 'SwiftBot - Automação de WhatsApp',
      description: 'Plataforma SaaS de automação de WhatsApp com IA',
      type: 'service',
      metadata: {
        app: 'swiftbot',
        type: 'subscription',
        created_by: 'setup-script',
        created_at: new Date().toISOString()
      }
    })

    console.log(`✅ Produto criado: ${newProduct.name} (${newProduct.id})`)
    return newProduct

  } catch (error) {
    console.error('❌ Erro ao criar/buscar produto:', error.message)
    throw error
  }
}

// ============================================
// CRIAR PRICE
// ============================================

async function createPrice(product, connections, period) {
  const amount = PLAN_PRICES[period][connections]
  const planName = PLAN_NAMES[connections]
  const interval = period === 'monthly' ? 'month' : 'year'
  const periodLabel = period === 'monthly' ? 'Mensal' : 'Anual'

  try {
    // Verificar se já existe
    const existingPrices = await stripe.prices.list({
      product: product.id,
      active: true,
      limit: 100
    })

    const existing = existingPrices.data.find(p =>
      p.metadata?.connections === String(connections) &&
      p.metadata?.billing_period === period
    )

    if (existing) {
      console.log(`⏭️  Price já existe: ${planName} ${periodLabel} - R$ ${amount} (${existing.id})`)
      return existing
    }

    // Criar novo price
    const price = await stripe.prices.create({
      product: product.id,
      currency: 'brl',
      unit_amount: Math.round(amount * 100), // Converter para centavos
      recurring: {
        interval: interval,
        interval_count: 1
      },
      metadata: {
        connections: String(connections),
        billing_period: period,
        plan_name: planName,
        app: 'swiftbot',
        created_at: new Date().toISOString()
      },
      nickname: `${planName} - ${periodLabel} (${connections} ${connections === 1 ? 'conexão' : 'conexões'})`
    })

    console.log(`✅ Price criado: ${price.nickname} - R$ ${amount} (${price.id})`)
    return price

  } catch (error) {
    console.error(`❌ Erro ao criar price ${connections} ${period}:`, error.message)
    throw error
  }
}

// ============================================
// EXECUTAR SETUP
// ============================================

async function setupAllPrices() {
  console.log('🚀 Iniciando setup de Prices na Stripe...\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  try {
    // 1. Criar/buscar produto
    const product = await getOrCreateProduct()
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // 2. Criar todos os prices
    console.log('💰 Criando Prices...\n')

    const createdPrices = {
      monthly: {},
      annual: {}
    }

    // Mensal
    console.log('📅 PLANOS MENSAIS:')
    for (let connections = 1; connections <= 7; connections++) {
      const price = await createPrice(product, connections, 'monthly')
      createdPrices.monthly[connections] = price.id
    }

    console.log('\n📅 PLANOS ANUAIS:')
    for (let connections = 1; connections <= 7; connections++) {
      const price = await createPrice(product, connections, 'annual')
      createdPrices.annual[connections] = price.id
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('✅ Setup concluído com sucesso!\n')
    console.log('📋 RESUMO DOS PRICE IDs CRIADOS:\n')
    console.log('```javascript')
    console.log('const STRIPE_PRICE_IDS = {')
    console.log('  monthly: {')
    for (let i = 1; i <= 7; i++) {
      console.log(`    ${i}: '${createdPrices.monthly[i]}',`)
    }
    console.log('  },')
    console.log('  annual: {')
    for (let i = 1; i <= 7; i++) {
      console.log(`    ${i}: '${createdPrices.annual[i]}',`)
    }
    console.log('  }')
    console.log('}')
    console.log('```\n')
    console.log('💡 PRÓXIMOS PASSOS:')
    console.log('1. Copie o objeto STRIPE_PRICE_IDS acima')
    console.log('2. Cole no arquivo lib/stripe.js')
    console.log('3. Use esses IDs nas funções de upgrade/downgrade')
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    return createdPrices

  } catch (error) {
    console.error('\n❌ ERRO FATAL NO SETUP:', error.message)
    console.error('\n🔍 Stack trace:', error.stack)
    process.exit(1)
  }
}

// ============================================
// VERIFICAR ENVIRONMENT
// ============================================

function checkEnvironment() {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ ERRO: STRIPE_SECRET_KEY não encontrada no .env.local')
    console.error('💡 Adicione sua chave secreta da Stripe no arquivo .env.local:')
    console.error('   STRIPE_SECRET_KEY=sk_test_...')
    process.exit(1)
  }

  if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    console.error('❌ ERRO: STRIPE_SECRET_KEY inválida (deve começar com "sk_")')
    process.exit(1)
  }

  const isTestMode = process.env.STRIPE_SECRET_KEY.includes('test')
  console.log(`🔑 Stripe API Key detectada: ${isTestMode ? 'TEST MODE' : '🚨 LIVE MODE'}`)

  if (!isTestMode) {
    console.warn('\n⚠️  ATENÇÃO: Você está usando a chave LIVE da Stripe!')
    console.warn('⚠️  Isso criará prices reais no seu ambiente de produção.')
    console.warn('⚠️  Tem certeza que quer continuar? (Ctrl+C para cancelar)\n')
  }
}

// ============================================
// EXECUTAR
// ============================================

checkEnvironment()
setupAllPrices()
  .then(() => {
    console.log('✅ Script finalizado com sucesso!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script finalizado com erro:', error)
    process.exit(1)
  })