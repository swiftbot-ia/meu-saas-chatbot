'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

export default function ConsultoriaForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: '',
        companyName: '',
        sector: '',
        website: '',
        objective: 'vendas_qualificacao',
        targetAudience: '',
        personality: 'amigavel',
        challenge: ''
    })

    // Input styling classes
    const inputClass = "w-full bg-[#1E1E1E] text-white border border-white/10 rounded-xl px-4 py-3 focus:border-[#00FF99] focus:ring-1 focus:ring-[#00FF99] outline-none transition-all placeholder-gray-600"
    const labelClass = "block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide"

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch('/api/lp/afr/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await response.json()

            if (data.success) {
                router.push('/lp/AFR/confirmacao')
            } else {
                alert('Erro ao enviar: ' + (data.error || 'Tente novamente.'))
            }
        } catch (error) {
            console.error('Submit Error:', error)
            alert('Erro inesperado. Verifique sua conexão.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-black text-white py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <div className="max-w-3xl w-full">
                {/* Header */}
                <div className="text-center mb-10">
                    <div
                        onClick={() => router.push('/lp/AFR')}
                        className="inline-flex items-center gap-2 mb-6 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span>Voltar</span>
                    </div>

                    <h1 className="text-4xl font-bold mb-3">Diagnóstico de IA</h1>
                    <p className="text-gray-400 text-lg">
                        Preencha os dados abaixo para que eu possa desenhar a estratégia ideal para o seu negócio.
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-[#111] border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* Section 1: Contato */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <span className="w-8 h-8 rounded-full bg-[#00FF99]/20 text-[#00FF99] flex items-center justify-center text-sm">1</span>
                                Seus Dados
                            </h2>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClass}>Nome Completo *</label>
                                    <input required name="name" value={formData.name} onChange={handleChange} className={inputClass} placeholder="Ex: João da Silva" />
                                </div>
                                <div>
                                    <label className={labelClass}>Email Profissional *</label>
                                    <input required type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} placeholder="joao@empresa.com" />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>WhatsApp *</label>
                                <div className="[&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:text-white [&_.PhoneInputInput]:outline-none [&_.PhoneInputCountrySelect]:text-black">
                                    <PhoneInput
                                        defaultCountry="BR"
                                        value={formData.whatsapp}
                                        onChange={(val) => setFormData(prev => ({ ...prev, whatsapp: val }))}
                                        className={`${inputClass} flex items-center gap-2`}
                                        placeholder="(11) 99999-9999"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-white/5" />

                        {/* Section 2: Empresa */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <span className="w-8 h-8 rounded-full bg-[#00FF99]/20 text-[#00FF99] flex items-center justify-center text-sm">2</span>
                                Sobre a Empresa
                            </h2>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClass}>Nome da Empresa</label>
                                    <input name="companyName" value={formData.companyName} onChange={handleChange} className={inputClass} placeholder="Sua Empresa Ltda" />
                                </div>
                                <div>
                                    <label className={labelClass}>Setor de Atuação</label>
                                    <select name="sector" value={formData.sector} onChange={handleChange} className={inputClass}>
                                        <option value="" disabled>Selecione...</option>
                                        <option value="tecnologia">Tecnologia</option>
                                        <option value="saude">Saúde</option>
                                        <option value="educacao">Educação</option>
                                        <option value="varejo">Comércio / Varejo</option>
                                        <option value="servicos">Serviços</option>
                                        <option value="imobiliario">Imobiliário</option>
                                        <option value="financeiro">Financeiro</option>
                                        <option value="outro">Outro</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Site ou Instagram</label>
                                <input name="website" value={formData.website} onChange={handleChange} className={inputClass} placeholder="instagram.com/suaempresa" />
                            </div>
                        </div>

                        <div className="h-px bg-white/5" />

                        {/* Section 3: IA Config */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <span className="w-8 h-8 rounded-full bg-[#00FF99]/20 text-[#00FF99] flex items-center justify-center text-sm">3</span>
                                Expectativas com a IA
                            </h2>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClass}>Objetivo Principal</label>
                                    <select name="objective" value={formData.objective} onChange={handleChange} className={inputClass}>
                                        <option value="vendas_qualificacao">Vendas e Qualificação</option>
                                        <option value="suporte">Suporte ao Cliente (Tirar Dúvidas)</option>
                                        <option value="agendamento">Agendamento de Serviços</option>
                                        <option value="informacoes">Apenas fornecer informações</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Personalidade do Agente</label>
                                    <select name="personality" value={formData.personality} onChange={handleChange} className={inputClass}>
                                        <option value="amigavel">Amigável e Empático</option>
                                        <option value="profissional">Formal e Profissional</option>
                                        <option value="vendedor">Focado em Vendas (Agressivo)</option>
                                        <option value="tecnico">Técnico e Direto</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Quem é seu público alvo?</label>
                                <input name="targetAudience" value={formData.targetAudience} onChange={handleChange} className={inputClass} placeholder="Ex: Jovens de 18-25 anos interessados em games..." />
                            </div>

                            <div>
                                <label className={labelClass}>Qual seu maior desafio de atendimento hoje?</label>
                                <textarea
                                    name="challenge"
                                    value={formData.challenge}
                                    onChange={handleChange}
                                    rows={4}
                                    className={`${inputClass} resize-none`}
                                    placeholder="Ex: Demoro muito para responder e perco vendas; Meus atendentes não seguem o script..."
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-[#00FF99] disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold text-lg rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(0,255,153,0.3)]"
                            >
                                {loading ? 'Enviando...' : 'ENVIAR SOLICITAÇÃO DE DIAGNÓSTICO'}
                            </button>
                            <p className="text-center text-xs text-gray-500 mt-4">
                                Seus dados estão seguros. Entraremos em contato em até 24h úteis.
                            </p>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    )
}
