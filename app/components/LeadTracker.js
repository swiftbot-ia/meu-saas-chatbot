'use client'

import { useEffect, useState } from 'react'
import { getTrackingData, hasLeadData } from '@/lib/utmUtils'

/**
 * Componente que detecta lead salvo e pode disparar automações
 * Inclua no layout principal ou em páginas específicas
 * 
 * @param {Function} onLeadDetected - Callback chamado quando lead é detectado
 * @param {boolean} logToConsole - Se deve logar no console (default: true em dev)
 */
export default function LeadTracker({
    onLeadDetected = null,
    logToConsole = process.env.NODE_ENV === 'development'
}) {
    const [trackingData, setTrackingData] = useState(null)

    useEffect(() => {
        // Recupera dados do lead e UTM
        const data = getTrackingData()
        setTrackingData(data)

        if (logToConsole) {
            if (data.hasLead) {
                console.log('[LeadTracker] Lead identificado:', data.lead)
                console.log('[LeadTracker] UTMs:', data.utm)
            } else {
                console.log('[LeadTracker] Nenhum lead identificado')
            }
        }

        // Dispara callback se lead foi detectado
        if (data.hasLead && onLeadDetected) {
            onLeadDetected(data)
        }

        // Opcional: Disparar evento customizado para outras partes do app
        if (data.hasLead) {
            window.dispatchEvent(new CustomEvent('swiftbot:lead_detected', {
                detail: data
            }))
        }
    }, [onLeadDetected, logToConsole])

    // Não renderiza nada visualmente
    return null
}

/**
 * Hook para usar dados de tracking em qualquer componente
 * @returns {Object} { lead, utm, hasLead }
 */
export function useLeadTracking() {
    const [data, setData] = useState({ lead: null, utm: null, hasLead: false })

    useEffect(() => {
        setData(getTrackingData())
    }, [])

    return data
}
