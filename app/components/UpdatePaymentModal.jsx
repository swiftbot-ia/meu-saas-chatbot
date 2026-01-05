'use client'
import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import StandardModal from './StandardModal'

// Inicializar Stripe fora do render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

export default function UpdatePaymentModal({ isOpen, onClose, userId, onSuccess }) {
    const [clientSecret, setClientSecret] = useState(null)
    const [stripeElements, setStripeElements] = useState(null)
    const [paymentElement, setPaymentElement] = useState(null)
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState(null)
    const [success, setSuccess] = useState(false)
    const [stripeInstance, setStripeInstance] = useState(null)

    // Carregar Stripe Instance
    useEffect(() => {
        async function initStripe() {
            const stripe = await stripePromise
            setStripeInstance(stripe)
        }
        initStripe()
    }, [])

    // 1. Ao abrir, buscar Client Secret
    useEffect(() => {
        if (isOpen && userId) {
            startUpdateFlow()
        } else {
            // Resetar estados ao fechar
            setClientSecret(null)
            setErrorMessage(null)
            setSuccess(false)
            setLoading(false)
        }
    }, [isOpen, userId])

    const startUpdateFlow = async () => {
        setLoading(true)
        setErrorMessage(null)
        try {
            const response = await fetch('/api/checkout/create-setup-intent-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            })
            const data = await response.json()

            if (data.success) {
                setClientSecret(data.clientSecret)
            } else {
                setErrorMessage(data.error || 'Erro ao iniciar atualização')
            }
        } catch (error) {
            setErrorMessage('Erro de conexão: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    // 2. Montar Payment Element quando tiver Client Secret
    useEffect(() => {
        if (!clientSecret || !stripeInstance || !isOpen) return

        const appearance = {
            theme: 'night',
            variables: {
                colorPrimary: '#00FF99',
                colorBackground: '#111111',
                colorText: '#ffffff',
                fontFamily: 'system-ui, sans-serif'
            }
        }

        const elements = stripeInstance.elements({ clientSecret, appearance })
        setStripeElements(elements)

        const paymentWidget = elements.create('payment', {
            layout: 'accordion'
        })

        // Pequeno delay para garantir DOM
        setTimeout(() => {
            const container = document.getElementById('update-card-element')
            if (container) {
                paymentWidget.mount('#update-card-element')
                setPaymentElement(paymentWidget)
            }
        }, 100)

    }, [clientSecret, stripeInstance, isOpen])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!stripeInstance || !stripeElements) return

        setLoading(true)
        setErrorMessage(null)

        try {
            // 3. Confirmar Setup
            const result = await stripeInstance.confirmSetup({
                elements: stripeElements,
                confirmParams: {
                    return_url: window.location.href, // Fallback
                },
                redirect: 'if_required'
            })

            if (result.error) {
                throw new Error(result.error.message)
            }

            // 4. Finalizar no Backend
            const setupIntent = result.setupIntent
            if (setupIntent.status === 'succeeded') {
                const updateRes = await fetch('/api/checkout/update-payment-method', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId,
                        setupIntentId: setupIntent.id
                    })
                })
                const updateData = await updateRes.json()

                if (!updateData.success) {
                    throw new Error(updateData.error)
                }

                setSuccess(true)
                if (onSuccess) onSuccess()

                // Fechar após 2s
                setTimeout(() => {
                    onClose()
                }, 2000)
            }

        } catch (error) {
            setErrorMessage(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <StandardModal
            isOpen={isOpen}
            onClose={onClose}
            title="Atualizar Cartão de Crédito"
            width="max-w-md"
        >
            <div className="p-4">
                {success ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Cartão Atualizado!</h3>
                        <p className="text-gray-400">Seu método de pagamento foi alterado com sucesso.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <p className="text-gray-400 mb-6 text-sm">
                            Insira os dados do novo cartão. Ele será definido como padrão para futuras cobranças.
                        </p>

                        {errorMessage && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg mb-4 text-sm">
                                {errorMessage}
                            </div>
                        )}

                        <div id="update-card-element" className="min-h-[200px] mb-6"></div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 rounded-xl bg-[#1A1A1A] text-white hover:bg-[#252525] transition-colors font-medium border border-white/10"
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-bold hover:shadow-[0_0_20px_rgba(0,255,153,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                disabled={loading || !stripeElements}
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    'Salvar Cartão'
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </StandardModal>
    )
}
