'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '../../lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

// ==================================================================================
// 🎨 COMPONENTE CUSTOM SELECT (Ghost Style - Mantido)
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
      {isOpen && <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />}
    </div>
  )
}

// ==================================================================================
// 💾 CONSTANTES
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

const OBJECTIVES = [
  { value: 'vendas_qualificacao', label: 'Qualificar leads para venda' },
  { value: 'suporte', label: 'Suporte ao cliente' },
  { value: 'informacoes', label: 'Fornecer informações' }
]

const MAX_ITEMS = 15

// ==================================================================================
// 🧠 LÓGICA DO AGENTE
// ==================================================================================
function AgentConfigContent() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  
  // Controle do Modal de Sucesso
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  
  // ID do Agente para controle de UPDATE vs INSERT
  const [agentId, setAgentId] = useState(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const connectionId = searchParams.get('connectionId')

  // CSS GHOST STYLE (Mantido)
  const baseInputClass = "w-full bg-[#1E1E1E] text-white placeholder-gray-500 !rounded-3xl px-6 py-4 border outline-none focus:outline-none focus:!rounded-3xl focus:bg-[#282828] transition-all duration-300 ease-in-out"
  
  const getInputClass = (fieldName) => {
    if (errors[fieldName]) {
        return `${baseInputClass} border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]`
    }
    return `${baseInputClass} border-transparent focus:border-white/10 focus:shadow-[0_0_20px_rgba(255,255,255,0.05)]`
  }
  
  const [formData, setFormData] = useState({
    companyName: '',
    businessSector: '',
    personality: 'amigavel',
    businessHours: '24h',
    welcomeMessage: '',
    defaultResponse: 'Desculpe, não entendi sua pergunta. Pode reformular?',
    productDescription: '',
    botObjective: 'vendas_qualificacao',
    productUrl: '',
    priceRange: '',
    startTime: '08:00',
    endTime: '18:00',
    offHoursMessage: '',
    agentName: '',
    objectionsQA: [{ question: '', answer: '' }],
    objectiveQuestions: [],
    salesCTA: '',
    notifyLeads: false,
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
      
      if (connectionId) {
        query = query.eq('connection_id', connectionId)
      } else {
        query = query.limit(1)
      }
      
      const { data, error } = await query.maybeSingle()

      if (data && !error) {
        setAgentId(data.id)

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
          salesCTA: data.sales_cta || '',
          notifyLeads: data.notify_leads || false
        })
      }
    } catch (error) {
      console.log('Nenhuma configuração encontrada, iniciando novo.')
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    if (name === 'botObjective') {
       setFormData(prev => ({ ...prev, objectiveQuestions: [] }))
    }
  }

  const generateAgentNameSuggestions = () => {
    const suggestions = ['Ana', 'Carlos', 'Sofia', 'Lucas', 'Bia', 'Max', 'Luna', 'Assistente Virtual']
    setFormData(prev => ({ ...prev, agentName: suggestions[Math.floor(Math.random() * suggestions.length)] }))
  }

  const addArrayItem = (field, emptyItem) => {
    if (formData[field].length < MAX_ITEMS) {
      setFormData(prev => ({ ...prev, [field]: [...prev[field], emptyItem] }))
    }
  }

  const removeArrayItem = (field, index) => {
    if (formData[field].length > 0) {
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

  const getEmptyObjectiveItem = () => {
    switch (formData.botObjective) {
      case 'vendas_qualificacao': return { question: '' }
      case 'informacoes': return { info: '', details: '' }
      case 'suporte': return { problem: '', solution: '' }
      default: return { question: '' }
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.companyName.trim()) newErrors.companyName = "O nome da empresa é obrigatório."
    if (!formData.productDescription.trim()) newErrors.productDescription = "A descrição é obrigatória."
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
    }

    setSaving(true)

    try {
      let finalProductUrl = formData.productUrl.trim()
      if (finalProductUrl && !/^https?:\/\//i.test(finalProductUrl)) {
          finalProductUrl = `https://${finalProductUrl}`
      }

      const cleanObjectiveQuestions = formData.objectiveQuestions.filter(item => {
        if (formData.botObjective === 'suporte') return item.problem && item.solution
        if (formData.botObjective === 'informacoes') return item.info && item.details
        return item.question
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
        product_url: finalProductUrl,
        price_range: formData.priceRange,
        agent_name: formData.agentName,
        objections_qa: formData.objectionsQA.filter(q => q.question && q.answer),
        objective_questions: cleanObjectiveQuestions,
        sales_cta: formData.salesCTA,
        notify_leads: formData.notifyLeads,
        is_active: true
      }

      let targetId = agentId

      if (!targetId) {
        let checkQuery = supabase.from('ai_agents').select('id').eq('user_id', user.id)
        if (connectionId) {
            checkQuery = checkQuery.eq('connection_id', connectionId)
        }
        const { data: existingData } = await checkQuery.maybeSingle()
        if (existingData) {
            targetId = existingData.id
        }
      }

      let error = null
      
      if (targetId) {
        const { error: updateError } = await supabase.from('ai_agents').update(agentData).eq('id', targetId)
        error = updateError
      } else {
        const { error: insertError } = await supabase.from('ai_agents').insert(agentData)
        error = insertError
      }

      if (error) throw error

      try {
        await fetch('/api/n8n/update-agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, connectionId, agentData })
        })
      } catch (err) { console.warn('Webhook silencioso falhou') }

      // AQUI MUDOU: Em vez de alert(), abrimos o Modal
      setShowSuccessModal(true)
      
    } catch (error) {
      console.error(error)
      alert('❌ Erro ao salvar: ' + error.message)
    }
    setSaving(false)
  }

  // --- RENDERIZADORES ---
  const renderObjectiveConfig = () => {
    const isSalesOrQual = formData.botObjective === 'vendas_qualificacao'
    const isSupport = formData.botObjective === 'suporte'
    const isInfo = formData.botObjective === 'informacoes'

    let title = "", description = ""
    if (isSalesOrQual) { title = "Qualificação de Vendas"; description = "Configure perguntas para qualificar o lead antes da oferta."; }
    else if (isSupport) { title = "Principais Problemas"; description = "Configure problemas comuns e suas soluções imediatas."; }
    else if (isInfo) { title = "Informações Importantes"; description = "Configure tópicos e seus detalhes."; }

    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <div>
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              {isSalesOrQual && <svg className="w-6 h-6 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              {isSupport && <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
              {isInfo && <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              {title}
            </h3>
            <p className="text-gray-500 text-sm mt-1">{description} (Máx: {MAX_ITEMS})</p>
          </div>
        </div>

        <div className="space-y-4">
          {formData.objectiveQuestions.map((item, index) => (
             <div key={index} className="bg-[#1E1E1E] rounded-3xl p-6 relative group border border-transparent hover:border-white/5 transition-all">
                <button 
                  type="button" 
                  onClick={() => removeArrayItem('objectiveQuestions', index)}
                  className="absolute top-4 right-4 text-gray-600 hover:text-red-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>

                {isSalesOrQual && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Pergunta #{index + 1}</label>
                    <input type="text" value={item.question} onChange={(e) => updateArrayItem('objectiveQuestions', index, 'question', e.target.value)} placeholder="Ex: Qual o tamanho da sua empresa?" className={getInputClass(`question_${index}`)} />
                  </div>
                )}

                {isSupport && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Problema Comum #{index + 1}</label>
                      <input type="text" value={item.problem} onChange={(e) => updateArrayItem('objectiveQuestions', index, 'problem', e.target.value)} placeholder="Ex: Esqueci minha senha" className={getInputClass(`problem_${index}`)} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Solução</label>
                      <textarea value={item.solution} onChange={(e) => updateArrayItem('objectiveQuestions', index, 'solution', e.target.value)} rows={2} placeholder="Ex: Acesse /reset-password..." className={`${getInputClass(`solution_${index}`)} resize-none`} />
                    </div>
                  </div>
                )}

                {isInfo && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Tópico #{index + 1}</label>
                      <input type="text" value={item.info} onChange={(e) => updateArrayItem('objectiveQuestions', index, 'info', e.target.value)} placeholder="Ex: Horário de Entrega" className={getInputClass(`info_${index}`)} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Detalhes</label>
                      <textarea value={item.details} onChange={(e) => updateArrayItem('objectiveQuestions', index, 'details', e.target.value)} rows={2} placeholder="Ex: Entregamos das 8h às 18h..." className={`${getInputClass(`details_${index}`)} resize-none`} />
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

        {isSalesOrQual && (
          <div className="mt-8 pt-8 border-t border-white/5 space-y-8">
            {/* Toggle Switch */}
            <div className="bg-[#181818] p-6 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all">
                <div>
                    <h4 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                        <svg className="w-5 h-5 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        Notificação de Leads Qualificados
                    </h4>
                    <p className="text-gray-500 text-sm">Receber um alerta por e-mail imediatamente quando um lead completar a qualificação.</p>
                </div>
                
                <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, notifyLeads: !prev.notifyLeads }))}
                    className={`
                        relative w-14 h-8 rounded-full transition-all duration-300 ease-in-out focus:outline-none
                        ${formData.notifyLeads ? 'bg-[#00FF99] shadow-[0_0_15px_rgba(0,255,153,0.3)]' : 'bg-gray-700'}
                    `}
                >
                    <span 
                        className={`
                            absolute top-1 left-1 bg-white w-6 h-6 rounded-full shadow-md transition-transform duration-300 ease-in-out
                            ${formData.notifyLeads ? 'translate-x-6' : 'translate-x-0'}
                        `}
                    />
                </button>
            </div>

            <div className="pt-8 border-t border-white/5">
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
                className={`${getInputClass('salesCTA')} resize-none`}
                />
            </div>
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
        
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-white flex items-center gap-3">
            Configurar Agente IA
          </h1>
          <p className="text-[#B0B0B0] text-lg mt-3">
            Personalize o comportamento, tom de voz e objetivos do seu assistente.
          </p>
        </div>

        <div 
          className="rounded-3xl p-[2px]"
          style={{ backgroundImage: 'linear-gradient(to right, #8A2BE2, #00BFFF, #00FF99)' }}
        >
          <div className="bg-[#111111] rounded-[22px] p-8 sm:p-12">
            
            <form onSubmit={handleSubmit} className="space-y-16">
              
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  Identidade e Negócio
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-[#B0B0B0] mb-2 ml-4 uppercase tracking-wider">Nome da Empresa <span className="text-red-500">*</span></label>
                    <input type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} placeholder="Ex: TechSolutions Ltda" className={getInputClass('companyName')} />
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
                  <input type="text" name="agentName" value={formData.agentName} onChange={handleInputChange} placeholder="Ex: Ana, Assistente Virtual..." className={getInputClass('agentName')} />
                </div>
              </div>

              <hr className="border-white/5" />

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
                    <CustomSelect label="Objetivo Principal" value={formData.botObjective} onChange={(val) => handleSelectChange('botObjective', val)} options={OBJECTIVES} placeholder="Selecione o objetivo" />
                  </div>
                </div>
              </div>

              <div className="bg-[#181818] rounded-3xl p-6 border border-white/5">
                {renderObjectiveConfig()}
              </div>

              <hr className="border-white/5" />

              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Conhecimento do Produto
                </h3>
                <div>
                  <label className="block text-xs font-medium text-[#B0B0B0] mb-2 ml-4 uppercase tracking-wider">Descrição do Produto/Serviço <span className="text-red-500">*</span></label>
                  <textarea name="productDescription" value={formData.productDescription} onChange={handleInputChange} rows={4} placeholder="Descreva detalhadamente o que você vende..." className={`${getInputClass('productDescription')} resize-none`} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-[#B0B0B0] mb-2 ml-4 uppercase tracking-wider">Link do Produto (Opcional)</label>
                    <input type="text" name="productUrl" value={formData.productUrl} onChange={handleInputChange} placeholder="www.seusite.com.br" className={getInputClass('productUrl')} />
                    <p className="text-xs text-gray-600 mt-2 ml-2">Adicionaremos https:// automaticamente se você esquecer.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#B0B0B0] mb-2 ml-4 uppercase tracking-wider">Preço / Faixa</label>
                    <input type="text" name="priceRange" value={formData.priceRange} onChange={handleInputChange} placeholder="Ex: R$ 99,90" className={getInputClass('priceRange')} />
                  </div>
                </div>
              </div>

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
                        <input type="text" value={item.question} onChange={(e) => updateArrayItem('objectionsQA', index, 'question', e.target.value)} placeholder="Cliente: 'Está muito caro...'" className={getInputClass(`objectionQ_${index}`)} />
                        <textarea value={item.answer} onChange={(e) => updateArrayItem('objectionsQA', index, 'answer', e.target.value)} rows={2} placeholder="Bot: 'Entendo, mas considere que...'" className={`${getInputClass(`objectionA_${index}`)} resize-none`} />
                      </div>
                    </div>
                  ))}
                  
                  <button type="button" onClick={() => addArrayItem('objectionsQA', { question: '', answer: '' })} disabled={formData.objectionsQA.length >= MAX_ITEMS} className="w-full py-4 border border-dashed border-gray-700 rounded-3xl text-gray-400 hover:border-white hover:text-white transition-all">
                    + Adicionar Objeção
                  </button>
                </div>
              </div>

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

        {/* MODAL DE SUCESSO - SUBSTITUI O ALERT */}
        {showSuccessModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
                <div className="bg-[#1E1E1E] p-8 rounded-3xl border border-[#00FF99]/20 shadow-[0_0_50px_rgba(0,255,153,0.1)] max-w-md w-full text-center transform transition-all scale-100">
                    <div className="w-16 h-16 bg-[#00FF99]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Sucesso!</h3>
                    <p className="text-gray-400 mb-8">Seu agente de inteligência artificial foi configurado e salvo com sucesso.</p>
                    <button 
                        onClick={() => router.push('/dashboard')}
                        className="w-full py-4 bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-bold rounded-2xl hover:shadow-[0_0_20px_rgba(0,255,153,0.3)] transition-all"
                    >
                        Continuar para Dashboard
                    </button>
                </div>
            </div>
        )}

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