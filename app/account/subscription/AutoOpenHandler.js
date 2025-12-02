'use client'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function AutoOpenHandler({ onAutoOpen }) {
    const searchParams = useSearchParams()

    useEffect(() => {
        if (searchParams.get('autoOpen') === 'true') {
            onAutoOpen()
        }
    }, [searchParams, onAutoOpen])

    return null
}
