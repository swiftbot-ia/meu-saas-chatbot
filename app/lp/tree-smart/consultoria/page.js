'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import Image from 'next/image'

export default function ConsultoriaTreeSmart() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: '',
        companyName: '',
        companySize: '',
        productSummary: '',
        sector: '',
        website: '',
        objective: 'vendas_qualificacao',
        targetAudience: '',
        personality: 'amigavel',
        challenge: ''
    })

    const [errors, setErrors] = useState({})

    // Cleaner input styling (no harsh borders, subtle background)
    const inputClass = (name) => `w-full bg-[#1A1A1A] text-white border-0 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-[#00FF99] outline-none transition-all placeholder-gray-600 shadow-inner ${errors[name] ? 'ring-2 ring-red-500' : ''}`
    const labelClass = "block text-sm font-bold text-gray-300 mb-2 tracking-wide ml-1"
    const errorClass = "text-red-500 text-xs mt-2 ml-2 font-medium block animate-pulse"

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const validateForm = () => {
        const newErrors = {}
        const requiredFields = [
            'name', 'email', 'whatsapp',
            'companyName', 'companySize', 'sector', 'website', 'productSummary',
            'objective', 'targetAudience', 'personality', 'challenge'
        ]

        requiredFields.forEach(field => {
            if (!formData[field] || formData[field].toString().trim() === '') {
                newErrors[field] = '* É obrigatório preencher esse campo'
            }
        })

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            // Scroll to the first error
            const firstError = document.querySelector('.ring-red-500')
            if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' })
            return
        }

        setLoading(true)

        try {
            const response = await fetch('/api/lp/afr/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await response.json()

            if (data.success) {
                router.push('/lp/tree-smart/confirmacao')
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
        <div className="min-h-screen bg-black text-white font-sans selection:bg-[#00FF99] selection:text-black">

            {/* Background Particles (Optional: mimicking main page vibe subtly) */}
            <div className="fixed inset-0 pointer-events-none opacity-20">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00FF99]/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-screen">
                <div className="max-w-4xl w-full">

                    {/* Header Clean */}
                    <div className="text-center mb-16 animate-fade-in-up">
                        <div
                            onClick={() => router.push('/lp/tree-smart')}
                            className="inline-flex items-center gap-2 mb-8 cursor-pointer text-gray-400 hover:text-white transition-colors group"
                        >
                            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span className="font-medium">Voltar ao início</span>
                        </div>

                        <div className="flex justify-center mb-8">
                            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-[#111] shadow-2xl">
                                <Image
                                    src="/logo-tech-tree.webp"
                                    alt="Tree Smart Logo"
                                    width={80}
                                    height={80}
                                    className="object-cover w-full h-full opacity-90"
                                />
                            </div>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Diagnóstico Gratuito</h1>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            Preencha as informações abaixo para que possamos desenhar a melhor estratégia de IA para sua empresa.
                        </p>
                    </div>

                    {/* Form Container - Borderless, Clean */}
                    <div className="bg-transparent animate-fade-in-up delay-100">
                        <form onSubmit={handleSubmit} className="space-y-12">

                            {/* Section 1: Contato */}
                            <div className="bg-[#111] rounded-[40px] p-8 md:p-12 shadow-sm">
                                <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#00FF99] text-black text-sm font-bold">1</span>
                                    Quem é você?
                                </h2>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className={labelClass}>Nome Completo</label>
                                        <input
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className={inputClass('name')}
                                            placeholder="Seu nome"
                                        />
                                        {errors.name && <span className={errorClass}>{errors.name}</span>}
                                    </div>
                                    <div>
                                        <label className={labelClass}>Email Corporativo</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className={inputClass('email')}
                                            placeholder="seu@email.com"
                                        />
                                        {errors.email && <span className={errorClass}>{errors.email}</span>}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelClass}>WhatsApp</label>
                                        <div className={`transition-all rounded-2xl ${errors.whatsapp ? 'ring-2 ring-red-500' : ''} [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:text-white [&_.PhoneInputInput]:outline-none [&_.PhoneInputCountrySelect]:bg-[#1A1A1A] [&_.PhoneInputCountrySelect]:text-white [&_.PhoneInputCountryIcon]:hidden`}>
                                            <PhoneInput
                                                defaultCountry="BR"
                                                value={formData.whatsapp}
                                                onChange={(val) => {
                                                    setFormData(prev => ({ ...prev, whatsapp: val }))
                                                    if (errors.whatsapp) setErrors(prev => ({ ...prev, whatsapp: '' }))
                                                }}
                                                className={`w-full bg-[#1A1A1A] text-white border-0 rounded-2xl px-5 py-4 focus-within:ring-2 focus-within:ring-[#00FF99] transition-all shadow-inner items-center gap-3`}
                                                placeholder="(11) 99999-9999"
                                            />
                                        </div>
                                        {errors.whatsapp && <span className={errorClass}>{errors.whatsapp}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Empresa */}
                            <div className="bg-[#111] rounded-[40px] p-8 md:p-12 shadow-sm">
                                <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#00FF99] text-black text-sm font-bold">2</span>
                                    Sua Empresa
                                </h2>

                                <div className="grid md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className={labelClass}>Nome da Empresa</label>
                                        <input
                                            name="companyName"
                                            value={formData.companyName}
                                            onChange={handleChange}
                                            className={inputClass('companyName')}
                                            placeholder="Nome do seu negócio"
                                        />
                                        {errors.companyName && <span className={errorClass}>{errors.companyName}</span>}
                                    </div>
                                    <div>
                                        <label className={labelClass}>Quantidade de Funcionários</label>
                                        <select
                                            name="companySize"
                                            value={formData.companySize}
                                            onChange={handleChange}
                                            className={`${inputClass('companySize')} appearance-none cursor-pointer`}
                                        >
                                            <option value="" disabled>Selecione...</option>
                                            <option value="1-2">1-2 pessoas</option>
                                            <option value="2-5">2-5 pessoas</option>
                                            <option value="5-10">5-10 pessoas</option>
                                            <option value="10-20">10-20 pessoas</option>
                                            <option value="+20">+20 pessoas</option>
                                        </select>
                                        {errors.companySize && <span className={errorClass}>{errors.companySize}</span>}
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className={labelClass}>Setor de Atuação</label>
                                        <select
                                            name="sector"
                                            value={formData.sector}
                                            onChange={handleChange}
                                            className={`${inputClass('sector')} appearance-none cursor-pointer`}
                                        >
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
                                        {errors.sector && <span className={errorClass}>{errors.sector}</span>}
                                    </div>
                                    <div>
                                        <label className={labelClass}>Site ou Instagram</label>
                                        <input
                                            name="website"
                                            value={formData.website}
                                            onChange={handleChange}
                                            className={inputClass('website')}
                                            placeholder="Link da sua presença digital"
                                        />
                                        {errors.website && <span className={errorClass}>{errors.website}</span>}
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass}>O que você vende? (Resumo)</label>
                                    <textarea
                                        name="productSummary"
                                        value={formData.productSummary}
                                        onChange={handleChange}
                                        rows={3}
                                        className={`${inputClass('productSummary')} resize-none`}
                                        placeholder="Ex: Vendo consultoria financeira para pequenas empresas..."
                                    />
                                    {errors.productSummary && <span className={errorClass}>{errors.productSummary}</span>}
                                </div>
                            </div>

                            {/* Section 3: IA Config */}
                            <div className="bg-[#111] rounded-[40px] p-8 md:p-12 shadow-sm">
                                <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#00FF99] text-black text-sm font-bold">3</span>
                                    Objetivos
                                </h2>

                                <div className="grid md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className={labelClass}>Objetivo Principal do Agente</label>
                                        <select
                                            name="objective"
                                            value={formData.objective}
                                            onChange={handleChange}
                                            className={`${inputClass('objective')} appearance-none cursor-pointer`}
                                        >
                                            <option value="" disabled>Selecione...</option>
                                            <option value="vendas_qualificacao">Vendas e Qualificação (SDR)</option>
                                            <option value="suporte">Suporte ao Cliente 24/7</option>
                                            <option value="agendamento">Agendamento de Reuniões</option>
                                            <option value="informacoes">Tira-Dúvidas (FAQ)</option>
                                        </select>
                                        {errors.objective && <span className={errorClass}>{errors.objective}</span>}
                                    </div>
                                    <div>
                                        <label className={labelClass}>Tom de Voz Desejado</label>
                                        <select
                                            name="personality"
                                            value={formData.personality}
                                            onChange={handleChange}
                                            className={`${inputClass('personality')} appearance-none cursor-pointer`}
                                        >
                                            <option value="" disabled>Selecione...</option>
                                            <option value="amigavel">Amigável e Empático</option>
                                            <option value="profissional">Formal e Executivo</option>
                                            <option value="vendedor">Persuasivo (Vendedor)</option>
                                            <option value="tecnico">Técnico e Direto</option>
                                        </select>
                                        {errors.personality && <span className={errorClass}>{errors.personality}</span>}
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className={labelClass}>Quem é seu público alvo?</label>
                                    <input
                                        name="targetAudience"
                                        value={formData.targetAudience}
                                        onChange={handleChange}
                                        className={inputClass('targetAudience')}
                                        placeholder="Ex: Empresários de 30-50 anos..."
                                    />
                                    {errors.targetAudience && <span className={errorClass}>{errors.targetAudience}</span>}
                                </div>

                                <div>
                                    <label className={labelClass}>Qual seu maior desafio de atendimento hoje?</label>
                                    <textarea
                                        name="challenge"
                                        value={formData.challenge}
                                        onChange={handleChange}
                                        rows={3}
                                        className={`${inputClass('challenge')} resize-none`}
                                        placeholder="Ex: Perco muitos leads por demora na resposta..."
                                    />
                                    {errors.challenge && <span className={errorClass}>{errors.challenge}</span>}
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="pt-4 pb-20">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-6 bg-[#00FF99] disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-black font-black text-xl rounded-full hover:scale-[1.01] hover:shadow-[0_0_40px_rgba(0,255,153,0.3)] active:scale-[0.99] transition-all duration-300"
                                >
                                    {loading ? 'ANALISANDO SEUS DADOS...' : 'SOLICITAR ANÁLISE DO ESPECIALISTA'}
                                </button>
                                <p className="text-center text-sm text-gray-500 mt-6 flex items-center justify-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Seus dados estão protegidos.
                                </p>
                            </div>

                        </form>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.8s ease-out forwards;
                }
                .delay-100 { animation-delay: 0.1s; }
            `}</style>
        </div>
    )
}
