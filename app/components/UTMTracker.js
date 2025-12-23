'use client'

import { useEffect } from 'react'
import { captureUtmFromCurrentUrl } from '@/lib/utmUtils'

/**
 * Componente que captura automaticamente parâmetros UTM da URL
 * Deve ser incluído no layout principal da aplicação
 * Não renderiza nada visualmente
 */
export default function UTMTracker() {
    useEffect(() => {
        // Captura UTMs da URL atual ao carregar a página
        const captured = captureUtmFromCurrentUrl()

        if (captured && Object.keys(captured).length > 0) {
            console.log('[UTMTracker] UTMs capturados:', captured)
        }
    }, [])

    // Não renderiza nada
    return null
}
