#!/usr/bin/env node
/**
 * Script: Limpar URLs de Fotos de Perfil Quebradas
 * 
 * Verifica cada profile_pic_url na tabela whatsapp_contacts
 * e limpa as que estão inacessíveis (WhatsApp CDN expira links)
 * 
 * Uso: node scripts/cleanup-broken-images.js
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const CHAT_DB_URL = process.env.NEXT_PUBLIC_CHAT_SUPABASE_URL
const CHAT_DB_KEY = process.env.CHAT_SUPABASE_SERVICE_ROLE_KEY

if (!CHAT_DB_URL || !CHAT_DB_KEY) {
    console.error('❌ Chat DB não configurado')
    process.exit(1)
}

const supabase = createClient(CHAT_DB_URL, CHAT_DB_KEY)

// Configurações
const BATCH_SIZE = 50
const TIMEOUT_MS = 5000
const DRY_RUN = process.argv.includes('--dry-run')

console.log('🧹 Limpeza de URLs de Fotos Quebradas')
console.log(`   Mode: ${DRY_RUN ? 'DRY RUN (não altera nada)' : 'PRODUÇÃO'}`)
console.log('')

/**
 * Verifica se uma URL de imagem está acessível
 */
async function isImageAccessible(url) {
    if (!url) return false

    try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

        const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal
        })

        clearTimeout(timeout)
        return response.ok
    } catch (error) {
        return false
    }
}

/**
 * Processa contatos em lotes
 */
async function cleanupBrokenImages() {
    let offset = 0
    let totalContacts = 0
    let brokenCount = 0
    let fixedCount = 0
    const brokenUrls = []

    console.log('📊 Buscando contatos com foto...')

    while (true) {
        // Buscar contatos com foto
        const { data: contacts, error } = await supabase
            .from('whatsapp_contacts')
            .select('id, whatsapp_number, name, profile_pic_url')
            .not('profile_pic_url', 'is', null)
            .range(offset, offset + BATCH_SIZE - 1)

        if (error) {
            console.error('❌ Erro ao buscar contatos:', error.message)
            break
        }

        if (!contacts || contacts.length === 0) {
            break
        }

        console.log(`\n📦 Processando lote ${Math.floor(offset / BATCH_SIZE) + 1} (${contacts.length} contatos)`)

        for (const contact of contacts) {
            totalContacts++
            process.stdout.write(`   Verificando ${contact.name || contact.whatsapp_number}... `)

            const isAccessible = await isImageAccessible(contact.profile_pic_url)

            if (isAccessible) {
                console.log('✅')
            } else {
                console.log('❌ QUEBRADA')
                brokenCount++
                brokenUrls.push({
                    id: contact.id,
                    name: contact.name,
                    number: contact.whatsapp_number,
                    url: contact.profile_pic_url?.substring(0, 80) + '...'
                })

                // Limpar URL quebrada
                if (!DRY_RUN) {
                    const { error: updateError } = await supabase
                        .from('whatsapp_contacts')
                        .update({ profile_pic_url: null })
                        .eq('id', contact.id)

                    if (updateError) {
                        console.error(`      ⚠️ Erro ao limpar: ${updateError.message}`)
                    } else {
                        fixedCount++
                    }
                }
            }
        }

        offset += BATCH_SIZE

        // Pausa entre lotes para não sobrecarregar
        await new Promise(r => setTimeout(r, 500))
    }

    // Resumo
    console.log('\n' + '='.repeat(50))
    console.log('📊 RESUMO')
    console.log('='.repeat(50))
    console.log(`   Total de contatos com foto: ${totalContacts}`)
    console.log(`   URLs quebradas encontradas: ${brokenCount}`)
    console.log(`   URLs limpas: ${DRY_RUN ? '0 (dry run)' : fixedCount}`)
    console.log('')

    if (brokenUrls.length > 0 && brokenUrls.length <= 20) {
        console.log('📋 URLs quebradas:')
        brokenUrls.forEach(b => {
            console.log(`   - ${b.name || b.number}: ${b.url}`)
        })
    }

    if (DRY_RUN && brokenCount > 0) {
        console.log('\n💡 Execute sem --dry-run para limpar as URLs quebradas')
    }
}

cleanupBrokenImages().catch(console.error)
