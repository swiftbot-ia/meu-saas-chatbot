'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function AffiliateTracker() {
    const searchParams = useSearchParams()

    useEffect(() => {
        const ref = searchParams.get('ref')

        if (ref) {
            // Last Click Wins: Sobrescreve qualquer código anterior
            localStorage.setItem('affiliate_ref', ref.toUpperCase())
            console.log('🔗 [AffiliateTracker] Novo código registrado:', ref.toUpperCase())
        }
    }, [searchParams])

    return null
}
