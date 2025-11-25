'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '../../lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

// ==================================================================================
// 🎨 COMPONENTE CUSTOM SELECT (Mantido o design original)
// ==================================================================================
const CustomSelect = ({ label, value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find(opt => opt.value === value)
  const displayValue = selectedOption ? selectedOption.label : placeholder

  return (
    <div className="w-full relative">
      <label className="block text-xs font-medium text-[#B0B0B0] mb-2 ml-4 uppercase tracking-wider">
        {label}
      </label>
      <div 
        className={`
          bg-[#1E1E1E] w-full transition-all duration-300 ease-out overflow-hidden z-20 relative
          border border-transparent
          ${isOpen ? 'rounded-[28px] shadow-[0_0_20px_rgba(255,255,255,0.05)] bg-[#282828]' : 'rounded-3xl'}
        `}
      >
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-6 py-4 flex items-center justify-between text-left outline-none"
        >
          <span className={`${!value ? 'text-gray-500' : 'text-white'} transition-colors truncate pr-4`}>
            {displayValue}
          </span>
          <svg 
            className={`w-4 h-4 text-gray-500 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : 'rotate-0'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div 
          className={`
            transition-all duration-300 ease-out 
            ${isOpen ? 'max-h-[300px] opacity-100 pb-2' : 'max-h-0 opacity-0'}
            overflow-y-auto custom-scrollbar
          `}
        >
          <div className="flex flex-col px-2">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
                className={`
                  px-4 py-3 text-sm text-left rounded-xl transition-all duration-200
                  ${value === opt.value 
                    ? 'bg-[#00FF99]/10 text-[#00FF99] font-medium' 
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'}
                `}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Overlay para fechar ao clicar fora (UX Improvement) */}
      {isOpen && <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />}
    </div>
  )
}

// ==================================================================================
// 💾 CONSTANTES & CONFIGURAÇÕES
// ==================================================================================

const SECTORS = [
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'saude', label: 'Saúde' },
  { value: 'educacao', label: 'Educação' },
  { value: 'comercio', label: 'Comércio / Varejo' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'imobiliario', label: 'Imobiliário' },
  { value: 'outro', label: 'Outro' }
]

const PERSONALITIES = [
  { value: 'amigavel', label: 'Amigável e Descontraído' },
  { value: 'formal', label: 'Formal e Profissional' },
  { value: 'tecnico', label: 'Técnico e Objetivo' },
  { value: 'vendas', label: 'Focado em Vendas (Agressivo)' },
  { value: 'suporte', label: 'Empático (Suporte)' }
]

// MERGE REALIZADO: "Vendas" e "Qualificação" unificados.
const OBJECTIVES = [
  { value: 'vendas_qualificacao', label: 'Qualificar leads para venda' },
  { value: 'suporte', label: 'Suporte ao cliente' },
  { value: 'informacoes', label: 'Fornecer informações' },
  { value: 'agendamento', label: 'Agendar consultas/reuniões' }
]

const MAX_ITEMS = 15 // Limite aumentado conforme solicitado

// ==================================================================================
// 🧠 COMPONENTE PRINCIPAL (Lógica)
// ==================================================================================
function AgentConfigContent() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const connectionId = searchParams.get('connectionId')

  // Estilos globais de input
  const inputClass = "w-full bg-[#1E1E1E] text-white placeholder-gray-600 !rounded-3xl px-6 py-4 border border-transparent outline-none focus:outline-none focus:!rounded-3xl focus:bg-[#282828] focus:border-white/10 focus:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all duration-300 ease-in-out"
  
  const [formData, setFormData] = useState({
    companyName: '',
    businessSector: '',
    personality: 'amigavel',
    businessHours: '24h',
    welcomeMessage: '',
    defaultResponse: 'Desculpe, não entendi sua pergunta. Pode reformular?',
    productDescription: '',
    botObjective: 'vendas_qualificacao', // Default atualizado
    productUrl: '',
    priceRange: '',
    startTime: '08:00',
    endTime: '18:00',
    offHoursMessage: '',
    agentName: '',
    objectionsQA: [{ question: '', answer: '' }],
    objectiveQuestions: [],
    salesCTA: '',
  })

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
    } else {
      setUser(user)
      loadExistingConfig(user.id)
    }
    setLoading(false)
  }

  const loadExistingConfig = async (userId) => {
    try {
      let query = supabase.from('ai_agents').select('*').eq('user_id', userId)
      if (connectionId) query = query.eq('connection_id', connectionId)
      
      const { data, error } = await query.single()

      if (data && !error) {
        // Mapeamento de legado: Se o banco tiver 'vendas' ou 'qualificacao' antigo, converte para o novo merge
        let loadedObjective = data.bot_objective
        if (loadedObjective === 'vendas' || loadedObjective === 'qualificacao') {
            loadedObjective = 'vendas_qualificacao'
        }

        setFormData({
          companyName: data.company_name || '',
          businessSector: data.business_sector || '',
          personality: data.personality || 'amigavel',
          businessHours: data.business_hours || '24h',
          welcomeMessage: data.welcome_message || '',
          defaultResponse: data.default_response || '',
          productDescription: data.product_description || '',
          botObjective: loadedObjective,
          productUrl: data.product_url || '',
          priceRange: data.price_range || '',
          startTime: data.start_time || '08:00',
          endTime: data.end_time || '18:00',
          offHoursMessage: data.off_hours_message || '',
          agentName: data.agent_name || '',
          objectionsQA: data.objections_qa?.length > 0 ? data.objections_qa : [{ question: '', answer: '' }],
          objectiveQuestions: data.objective_questions || [],
          salesCTA: data.sales_cta || ''
        })
      }
    } catch (error) {
      console.log('Configuração nova inicia limpa.')
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    // Ao mudar o objetivo, limpamos as perguntas específicas para evitar conflito de dados
    if (name === 'botObjective') {
       setFormData(prev => ({ ...prev, objectiveQuestions: [] }))
    }
  }

  const generateAgentNameSuggestions = () => {
    const suggestions = ['Ana', 'Carlos', 'Sofia', 'Lucas', 'Bia', 'Max', 'Luna', 'Assistente Virtual']
    setFormData(prev => ({ ...prev, agentName: suggestions[Math.floor(Math.random() * suggestions.length)] }))
  }

  // --- Lógica de Perguntas Dinâmicas (Genérica para Objeções e Objetivos) ---

  const addArrayItem = (field, emptyItem) => {
    if (formData[field].length < MAX_ITEMS) {
      setFormData(prev => ({ ...prev, [field]: [...prev[field], emptyItem] }))
    }
  }

  const removeArrayItem = (field, index) => {
    if (formData[field].length > 0) { // Permite deletar tudo se quiser
      setFormData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }))
    }
  }

  const updateArrayItem = (field, index, subField, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => 
        i === index ? { ...item, [subField]: value } : item
      )
    }))
  }

  // Helper para identificar qual estrutura de pergunta criar baseado no objetivo
  const getEmptyObjectiveItem = () => {
    switch (formData.botObjective) {
      case 'vendas_qualificacao': return { question: '' }
      case 'agendamento': return { question: '' }
      case 'informacoes': return { info: '', details: '' }
      case 'suporte': return { problem: '', solution: '' }
      default: return { question: '' }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Filtragem inteligente antes de salvar
      const cleanObjectiveQuestions = formData.objectiveQuestions.filter(item => {
        if (formData.botObjective === 'suporte') return item.problem && item.solution
        if (formData.botObjective === 'informacoes') return item.info && item.details
        return item.question // Para vendas_qualificacao e agendamento
      })

      const agentData = {
        user_id: user.id,
        connection_id: connectionId,
        company_name: formData.companyName,
        business_sector: formData.businessSector,
        personality: formData.personality,
        welcome_message: formData.welcomeMessage,
        default_response: formData.defaultResponse,
        product_description: formData.productDescription,
        bot_objective: formData.botObjective,
        product_url: formData.productUrl,
        price_range: formData.priceRange,
        agent_name: formData.agentName,
        objections_qa: formData.objectionsQA.filter(q => q.question && q.answer),
        objective_questions: cleanObjectiveQuestions,
        sales_cta: formData.salesCTA,
        is_active: true
      }

      const { error } = await supabase
        .from('ai_agents')
        .upsert(agentData, { onConflict: connectionId ? 'user_id,connection_id' : 'user_id' })

      if (error) throw error

      // Webhook Trigger (Opcional)
      try {
        await fetch('/api/n8n/update-agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, connectionId, agentData })
        })
      } catch (err) { console.warn('Webhook silencioso falhou') }

      alert('✅ Agente salvo com sucesso!')
      router.push('/dashboard')
      
    } catch (error) {
      alert('Erro ao salvar: ' + error.message)
    }
    setSaving(false)
  }

  // --- RENDERIZADORES DE SEÇÃO DINÂMICA ---
  // Esta função decide o que mostrar na tela baseado no Objetivo selecionado
  const renderObjectiveConfig = () => {
    const isSalesOrQual = formData.botObjective === 'vendas_qualificacao'
    const isSupport = formData.botObjective === 'suporte'
    const isInfo = formData.botObjective === 'informacoes'
    const isSchedule = formData.botObjective === 'agendamento'

    let title = ""
    let description = ""
    
    if (isSalesOrQual) { title = "Qualificação de Vendas"; description = "Configure perguntas para qualificar o lead antes da oferta."; }
    else if (isSupport) { title = "Principais Problemas"; description = "Configure problemas comuns e suas soluções imediatas."; }
    else if (isInfo) { title = "Informações Importantes"; description = "Configure tópicos e seus detalhes."; }
    else if (isSchedule) { title = "Perguntas de Pré-Agendamento"; description = "O que você precisa saber antes de agendar?"; }

    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <div>
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              {/* Ícone Dinâmico */}
              {isSalesOrQual && <svg className="w-6 h-6 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              {isSupport && <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
              {isInfo && <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              {isSchedule && <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              {title}
            </h3>
            <p className="text-gray-500 text-sm mt-1">{description} (Máx: {MAX_ITEMS})</p>
          </div>
        </div>

        {/* LISTA DINÂMICA */}
        <div className="space-y-4">
          {formData.objectiveQuestions.map((item, index) => (
             <div key={index} className="bg-[#1E1E1E] rounded-3xl p-6 relative group border border-transparent hover:border-white/5 transition-all">
                {/* Botão Remover */}
                <button 
                  type="button" 
                  onClick={() => removeArrayItem('objectiveQuestions', index)}
                  className="absolute top-4 right-4 text-gray-600 hover:text-red-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>

                {/* Renderização Condicional dos Inputs Internos */}
                {(isSalesOrQual || isSchedule) && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Pergunta de Qualificação #{index + 1}</label>
                    <input 
                      type="text" 
                      value={item.question} 
                      onChange={(e) => updateArrayItem('objectiveQuestions', index, 'question', e.target.value)}
                      placeholder="Ex: Qual o tamanho da sua empresa?" 
                      className={inputClass}
                    />
                  </div>
                )}

                {isSupport && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Problema Comum #{index + 1}</label>
                      <input 
                        type="text" 
                        value={item.problem} 
                        onChange={(e) => updateArrayItem('objectiveQuestions', index, 'problem', e.target.value)}
                        placeholder="Ex: Esqueci minha senha" 
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Solução / Resposta</label>
                      <textarea 
                        value={item.solution} 
                        onChange={(e) => updateArrayItem('objectiveQuestions', index, 'solution', e.target.value)}
                        rows={2} 
                        placeholder="Ex: Acesse /reset-password para redefinir." 
                        className={`${inputClass} resize-none`}
                      />
                    </div>
                  </div>
                )}

                {isInfo && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Tópico #{index + 1}</label>
                      <input 
                        type="text" 
                        value={item.info} 
                        onChange={(e) => updateArrayItem('objectiveQuestions', index, 'info', e.target.value)}
                        placeholder="Ex: Horário de Entrega" 
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Detalhes</label>
                      <textarea 
                        value={item.details} 
                        onChange={(e) => updateArrayItem('objectiveQuestions', index, 'details', e.target.value)}
                        rows={2} 
                        placeholder="Ex: Entregamos das 8h às 18h em dias úteis." 
                        className={`${inputClass} resize-none`}
                      />
                    </div>
                  </div>
                )}
             </div>
          ))}

          <button
            type="button"
            onClick={() => addArrayItem('objectiveQuestions', getEmptyObjectiveItem())}
            disabled={formData.objectiveQuestions.length >= MAX_ITEMS}
            className="w-full py-4 border border-dashed border-gray-700 rounded-3xl text-gray-400 hover:border-[#00FF99] hover:text-[#00FF99] hover:bg-[#00FF99]/5 transition-all flex justify-center items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Adicionar {isSalesOrQual ? 'Pergunta' : isSupport ? 'Problema' : 'Item'}
          </button>
        </div>

        {/* CTA DE VENDAS (Apenas se for Vendas/Qualificação) */}
        {isSalesOrQual && (
          <div className="mt-8 pt-8 border-t border-white/5">
            <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Call-to-Action (CTA) de Vendas
            </h4>
            <p className="text-gray-500 text-sm mb-4">A mensagem final que convida o cliente a comprar.</p>
            <textarea
              name="salesCTA"
              value={formData.salesCTA}
              onChange={handleInputChange}
              rows={2}
              placeholder="Ex: Gostaria de finalizar sua compra agora com 5% de desconto?"
              className={`${inputClass} resize-none`}
            />
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FF99]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <main className="relative z-10 max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-white flex items-center gap-3">
            Configurar Agente IA
          </h1>
          <p className="text-[#B0B0B0] text-lg mt-3">
            Personalize o comportamento, tom de voz e objetivos do seu assistente.
          </p>
        </div>

        {/* Container Principal com Borda Gradiente */}
        <div 
          className="rounded-3xl p-[2px]"
          style={{ backgroundImage: 'linear-gradient(to right, #8A2BE2, #00BFFF, #00FF99)' }}
        >
          <div className="bg-[#111111] rounded-[22px] p-8 sm:p-12">
            
            <form onSubmit={handleSubmit} className="space-y-16">
              
              {/* --- BLOCO 1: IDENTIDADE --- */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  Identidade e Negócio
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-[#B0B0B0] mb-2 ml-4 uppercase tracking-wider">Nome da Empresa</label>
                    <input type="text" name="companyName" required value={formData.companyName} onChange={handleInputChange} placeholder="Ex: TechSolutions Ltda" className={inputClass} />
                  </div>
                  <div>
                    <CustomSelect label="Setor de Atuação" value={formData.businessSector} onChange={(val) => handleSelectChange('businessSector', val)} options={SECTORS} placeholder="Selecione o setor" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-end mb-2 ml-4">
                    <label className="block text-xs font-medium text-[#B0B0B0] uppercase tracking-wider">Nome do Agente</label>
                    <button type="button" onClick={generateAgentNameSuggestions} className="text-xs text-[#00FF99] hover:underline flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      Gerar Sugestão
                    </button>
                  </div>
                  <input type="text" name="agentName" value={formData.agentName} onChange={handleInputChange} placeholder="Ex: Ana, Assistente Virtual..." className={inputClass} />
                </div>
              </div>

              <hr className="border-white/5" />

              {/* --- BLOCO 2: COMPORTAMENTO E OBJETIVO --- */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Personalidade e Objetivo
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <CustomSelect label="Estilo de Comunicação" value={formData.personality} onChange={(val) => handleSelectChange('personality', val)} options={PERSONALITIES} placeholder="Selecione a personalidade" />
                  </div>
                  <div>
                    {/* O SELECT DO OBJETIVO QUE GATILHA A MUDANÇA DE UI */}
                    <CustomSelect label="Objetivo Principal" value={formData.botObjective} onChange={(val) => handleSelectChange('botObjective', val)} options={OBJECTIVES} placeholder="Selecione o objetivo" />
                  </div>
                </div>
              </div>

              {/* --- BLOCO 3: CONFIGURAÇÃO ESPECÍFICA DO OBJETIVO (O NOVO MERGE) --- */}
              <div className="bg-[#181818] rounded-3xl p-6 border border-white/5">
                {renderObjectiveConfig()}
              </div>

              <hr className="border-white/5" />

              {/* --- BLOCO 4: PRODUTO --- */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Conhecimento do Produto
                </h3>
                <div>
                  <label className="block text-xs font-medium text-[#B0B0B0] mb-2 ml-4 uppercase tracking-wider">Descrição do Produto/Serviço</label>
                  <textarea name="productDescription" value={formData.productDescription} onChange={handleInputChange} rows={4} placeholder="Descreva detalhadamente o que você vende..." className={`${inputClass} resize-none`} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-[#B0B0B0] mb-2 ml-4 uppercase tracking-wider">Link do Produto</label>
                    <input type="url" name="productUrl" value={formData.productUrl} onChange={handleInputChange} placeholder="https://..." className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#B0B0B0] mb-2 ml-4 uppercase tracking-wider">Preço / Faixa</label>
                    <input type="text" name="priceRange" value={formData.priceRange} onChange={handleInputChange} placeholder="Ex: R$ 99,90" className={inputClass} />
                  </div>
                </div>
              </div>

              {/* --- BLOCO 5: OBJEÇÕES (TREINAMENTO) --- */}
              <div className="space-y-6">
                 <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Treinamento de Objeções
                  </h3>
                  <span className="text-xs text-gray-600 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                    {formData.objectionsQA.length} / {MAX_ITEMS}
                  </span>
                </div>
                
                <div className="space-y-4">
                  {formData.objectionsQA.map((item, index) => (
                    <div key={index} className="bg-[#1E1E1E] rounded-3xl p-6 relative group border border-transparent hover:border-white/5 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Objeção #{index + 1}</span>
                        <button type="button" onClick={() => removeArrayItem('objectionsQA', index)} className="text-gray-600 hover:text-red-500 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                      <div className="space-y-4">
                        <input type="text" value={item.question} onChange={(e) => updateArrayItem('objectionsQA', index, 'question', e.target.value)} placeholder="Cliente: 'Está muito caro...'" className={inputClass} />
                        <textarea value={item.answer} onChange={(e) => updateArrayItem('objectionsQA', index, 'answer', e.target.value)} rows={2} placeholder="Bot: 'Entendo, mas considere que...'" className={`${inputClass} resize-none`} />
                      </div>
                    </div>
                  ))}
                  
                  <button type="button" onClick={() => addArrayItem('objectionsQA', { question: '', answer: '' })} disabled={formData.objectionsQA.length >= MAX_ITEMS} className="w-full py-4 border border-dashed border-gray-700 rounded-3xl text-gray-400 hover:border-white hover:text-white transition-all">
                    + Adicionar Objeção
                  </button>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex justify-end gap-4 pt-8 border-t border-white/10">
                <button type="button" onClick={() => router.push('/dashboard')} className="px-8 py-4 bg-[#1E1E1E] hover:bg-[#2A2A2A] text-white rounded-3xl font-medium transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="px-10 py-4 bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-bold rounded-3xl hover:shadow-[0_0_30px_rgba(0,255,153,0.4)] transition-all flex items-center gap-2">
                  {saving ? 'Salvando...' : 'Salvar Configuração'}
                  {!saving && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function AgentConfigPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FF99]" /></div>}>
      <AgentConfigContent />
    </Suspense>
  )
}