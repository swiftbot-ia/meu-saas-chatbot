'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import NoSubscription from '../../components/NoSubscription'


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

// Opções para o Modal de IA - usando mesmas labels do formulário
const AI_COMMUNICATION_STYLES = [
  { value: 'amigavel', label: 'Amigável e Descontraído', icon: 'smile' },
  { value: 'formal', label: 'Formal e Profissional', icon: 'briefcase' },
  { value: 'tecnico', label: 'Técnico e Objetivo', icon: 'target' },
  { value: 'vendas', label: 'Focado em Vendas (Agressivo)', icon: 'trending' },
  { value: 'suporte', label: 'Empático (Suporte)', icon: 'heart' }
]

const AI_OBJECTIVES = [
  { value: 'vendas_qualificacao', label: 'Qualificar leads para venda', icon: 'dollar' },
  { value: 'suporte', label: 'Suporte ao cliente', icon: 'support' },
  { value: 'informacoes', label: 'Fornecer informações', icon: 'info' }
]

// Componente de ícone SVG para o modal
const ModalIcon = ({ type, isSelected }) => {
  const color = isSelected ? '#00FF99' : '#9CA3AF'
  const icons = {
    smile: <svg className="w-6 h-6" fill="none" stroke={color} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    briefcase: <svg className="w-6 h-6" fill="none" stroke={color} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    target: <svg className="w-6 h-6" fill="none" stroke={color} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    trending: <svg className="w-6 h-6" fill="none" stroke={color} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
    heart: <svg className="w-6 h-6" fill="none" stroke={color} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
    dollar: <svg className="w-6 h-6" fill="none" stroke={color} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    support: <svg className="w-6 h-6" fill="none" stroke={color} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    info: <svg className="w-6 h-6" fill="none" stroke={color} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  }
  return icons[type] || null
}

const MAX_ITEMS = 15

// Velocidades de digitação para o dropdown
const TYPING_SPEEDS = [
  { value: 'slow', label: 'Lento', description: 'Simula digitação humana mais lenta' },
  { value: 'normal', label: 'Normal', description: 'Velocidade padrão de digitação' },
  { value: 'fast', label: 'Rápido', description: 'Respostas quase instantâneas' }
]

// ==================================================================================
// ✨ COMPONENTE: SMART GENERATE BUTTON (Otimizar com IA)
// ==================================================================================
const SmartGenerateButton = ({ fieldName, currentValue, onSuggestion, disabled = false }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [suggestion, setSuggestion] = useState('')

  const handleGenerate = async () => {
    if (isLoading || disabled) return
    setIsLoading(true)

    try {
      const response = await fetch('/api/agent/generate-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldName, currentValue })
      })

      const data = await response.json()

      if (data.suggestion) {
        setSuggestion(data.suggestion)
        setShowSuggestion(true)
      }
    } catch (error) {
      console.error('Erro ao gerar sugestão:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccept = () => {
    onSuggestion(suggestion)
    setShowSuggestion(false)
    setSuggestion('')
  }

  const handleMerge = () => {
    // Mescla o texto atual com a sugestão
    const merged = currentValue ? `${currentValue}\n\n${suggestion}` : suggestion
    onSuggestion(merged)
    setShowSuggestion(false)
    setSuggestion('')
  }

  return (
    <>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isLoading || disabled}
        className="ml-2 p-1.5 rounded-lg bg-gradient-to-r from-purple-500/10 to-cyan-500/10 hover:from-purple-500/20 hover:to-cyan-500/20 border border-purple-500/20 transition-all group"
        title="Otimizar com IA"
      >
        {isLoading ? (
          <svg className="w-4 h-4 text-purple-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-purple-400 group-hover:text-purple-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
          </svg>
        )}
      </button>

      {/* Modal de Sugestão */}
      {showSuggestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn p-4">
          <div className="bg-[#1E1E1E] rounded-3xl p-6 max-w-lg w-full shadow-[0_0_40px_rgba(138,43,226,0.2)]">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
              </svg>
              <h3 className="text-lg font-bold text-white">Sugestão da IA</h3>
            </div>

            <div className="bg-[#111]/50 rounded-2xl p-4 mb-4 max-h-60 overflow-y-auto">
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{suggestion}</p>
            </div>

            {currentValue && (
              <p className="text-xs text-gray-500 mb-4">
                💡 Seu texto atual será preservado. Escolha "Mesclar" para combinar ambos.
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowSuggestion(false)}
                className="flex-1 py-3 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              {currentValue && (
                <button
                  onClick={handleMerge}
                  className="flex-1 py-3 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-colors"
                >
                  Mesclar
                </button>
              )}
              <button
                onClick={handleAccept}
                className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold rounded-xl hover:shadow-lg transition-all"
              >
                {currentValue ? 'Substituir' : 'Aceitar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ==================================================================================
// 🧠 LÓGICA DO AGENTE
// ==================================================================================
function AgentConfigContent() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState(null)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  // Controle do Modal de Sucesso
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Controle do Modal de IA
  const [showAIModal, setShowAIModal] = useState(false)
  const [aiSelectedStyle, setAiSelectedStyle] = useState('')
  const [aiSelectedObjective, setAiSelectedObjective] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [formKey, setFormKey] = useState(0) // Force re-render when AI generates

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
    ignoredKeywords: [],
    forbiddenInstructions: '',
    responseDelay: 30,
    responseDelayUnit: 'seconds',
    alwaysEndWithQuestion: true,
    productsServices: '',
    ignoreEmojiOnly: true,
    silenceConditions: '',
    // Novos campos - Melhorias 2026-01-07
    companyContext: '',
    productUrls: [],
    responseMode: 'single',  // 'single' | 'humanized'
    typingSpeed: 'normal',   // 'slow' | 'normal' | 'fast'
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
      await loadSubscription(user.id)
    }
    setLoading(false)
  }
  const loadSubscription = async (userId) => {
    try {
      // Get owner user ID for team members
      let ownerUserId = userId;
      try {
        const accountResponse = await fetch('/api/account/team');
        const accountData = await accountResponse.json();

        if (accountData.success && accountData.account) {
          const owner = accountData.members?.find(m => m.role === 'owner');
          if (owner) {
            ownerUserId = owner.userId;
            console.log('👥 [AgentConfig] Team member, using owner subscription:', ownerUserId);
          }
        }
      } catch (accountError) {
        console.log('⚠️ [AgentConfig] Account check failed:', accountError.message);
      }

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', ownerUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (!error && data) {
        const isActive = ['active', 'trial', 'trialing'].includes(data.status) || data.stripe_subscription_id === 'super_account_bypass'
        const isTrial = ['trial', 'trialing'].includes(data.status)
        const isExpired = isTrial && data.trial_end_date && new Date() > new Date(data.trial_end_date)

        if (isActive && !isExpired) {
          setSubscription(data)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar assinatura:', error)
    }
  }
  const loadExistingConfig = async (userId) => {
    try {
      // Get owner user ID for team members
      let ownerUserId = userId;
      try {
        const accountResponse = await fetch('/api/account/team');
        const accountData = await accountResponse.json();

        if (accountData.success && accountData.account) {
          const owner = accountData.members?.find(m => m.role === 'owner');
          if (owner) {
            ownerUserId = owner.userId;
            console.log('👥 [AgentConfig] Team member, loading owner config:', ownerUserId);
          }
        }
      } catch (accountError) {
        console.log('⚠️ [AgentConfig] Account check failed:', accountError.message);
      }

      let query = supabase.from('ai_agents').select('*').eq('user_id', ownerUserId)

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
          notifyLeads: data.notify_leads || false,
          ignoredKeywords: data.ignored_keywords || [],
          forbiddenInstructions: data.forbidden_instructions || '',
          forbiddenInstructions: data.forbidden_instructions || '',
          responseDelay: data.response_delay !== null ? data.response_delay : 30,
          responseDelayUnit: 'seconds',
          alwaysEndWithQuestion: data.always_end_with_question !== false, // Default to true if null or undefined
          productsServices: data.products_services || '',
          ignoreEmojiOnly: data.ignore_emoji_only !== false, // Default to true if null or undefined
          silenceConditions: data.silence_conditions || '',
          // Novos campos - Melhorias 2026-01-07
          companyContext: data.company_context || '',
          productUrls: Array.isArray(data.product_urls) ? data.product_urls : (data.product_url ? [data.product_url] : []),
          responseMode: data.response_mode || 'single',
          typingSpeed: data.typing_speed || 'normal',
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

  // Handler para gerar agente com IA
  const handleGenerateWithAI = async () => {
    if (!connectionId) {
      alert('Selecione uma conexão antes de gerar com IA')
      return
    }

    setIsGenerating(true)

    try {
      // Chamar endpoint que gera config com IA baseado na análise
      const response = await fetch(`/api/conversation-analysis/agent-config/${connectionId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          style: aiSelectedStyle || 'amigavel',
          objective: aiSelectedObjective || 'vendas_qualificacao'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          setShowAIModal(false)
          alert('Não há análise de conversas disponível.\n\nSincronize suas conversas primeiro para ativar a geração automática com IA.')
          return
        }
        throw new Error(data.error || 'Erro ao gerar configuração')
      }

      // Preencher formulário com os valores gerados pela IA
      const formValues = data.form_values || {}

      // Aplicar valores ao formulário
      setFormData(prev => ({
        ...prev,
        companyName: formValues.companyName || prev.companyName,
        businessSector: formValues.businessSector || prev.businessSector,
        personality: formValues.personality || aiSelectedStyle || prev.personality,
        botObjective: formValues.botObjective || aiSelectedObjective || prev.botObjective,
        welcomeMessage: formValues.welcomeMessage || prev.welcomeMessage,
        defaultResponse: formValues.defaultResponse || prev.defaultResponse,
        productDescription: formValues.productDescription || prev.productDescription,
        priceRange: formValues.priceRange || prev.priceRange,
        agentName: formValues.agentName || prev.agentName,
        objectionsQA: Array.isArray(formValues.objectionsQA) && formValues.objectionsQA.length > 0
          ? formValues.objectionsQA
          : prev.objectionsQA,
        objectiveQuestions: Array.isArray(formValues.objectiveQuestions) && formValues.objectiveQuestions.length > 0
          ? formValues.objectiveQuestions
          : prev.objectiveQuestions,
        salesCTA: formValues.salesCTA || prev.salesCTA,
        forbiddenInstructions: formValues.forbiddenInstructions || prev.forbiddenInstructions,
        responseDelay: formValues.responseDelay !== undefined ? formValues.responseDelay : 30,
        responseDelayUnit: 'seconds',
        alwaysEndWithQuestion: formValues.alwaysEndWithQuestion !== undefined ? formValues.alwaysEndWithQuestion : prev.alwaysEndWithQuestion,
        productsServices: formValues.productsServices || prev.productsServices
      }))

      // Force re-render of form components
      setFormKey(prev => prev + 1)

      setShowAIModal(false)
      setAiSelectedStyle('')
      setAiSelectedObjective('')

      // Scroll para o topo para ver os campos preenchidos
      window.scrollTo({ top: 0, behavior: 'smooth' })

    } catch (error) {
      console.error('Erro ao gerar com IA:', error)
      alert('Erro ao gerar configuração: ' + error.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setSaving(true)

    try {
      // Get owner user ID for team members
      let ownerUserId = user.id;
      try {
        const accountResponse = await fetch('/api/account/team');
        const accountData = await accountResponse.json();

        if (accountData.success && accountData.account) {
          const owner = accountData.members?.find(m => m.role === 'owner');
          if (owner) {
            ownerUserId = owner.userId;
            console.log('👥 [AgentConfig] Team member, saving as owner:', ownerUserId);
          }
        }
      } catch (accountError) {
        console.log('⚠️ [AgentConfig] Account check failed:', accountError.message);
      }

      let finalProductUrl = formData.productUrl.trim()
      if (finalProductUrl && !/^https?:\/\//i.test(finalProductUrl)) {
        finalProductUrl = `https://${finalProductUrl}`
      }

      const cleanObjectiveQuestions = formData.objectiveQuestions.filter(item => {
        if (formData.botObjective === 'suporte') return item.problem && item.solution
        if (formData.botObjective === 'informacoes') return item.info && item.details
        return item.question
      })

      // Calcular delay em segundos
      let finalDelay = parseInt(formData.responseDelay) || 0
      if (formData.responseDelayUnit === 'minutes') {
        finalDelay = finalDelay * 60
      }

      const agentData = {
        user_id: ownerUserId,
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
        ignored_keywords: formData.ignoredKeywords.filter(k => k.trim()),
        forbidden_instructions: formData.forbiddenInstructions,
        response_delay: finalDelay,
        always_end_with_question: formData.alwaysEndWithQuestion,
        products_services: formData.productsServices,
        ignore_emoji_only: formData.ignoreEmojiOnly,
        silence_conditions: formData.silenceConditions,
        // Novos campos - Melhorias 2026-01-07
        company_context: formData.companyContext,
        product_urls: formData.productUrls.filter(url => url.trim()),
        response_mode: formData.responseMode,
        typing_speed: formData.typingSpeed,
        is_active: true
      }

      // Usar UPSERT com constraint composta (user_id, connection_id)
      // Isso permite um agente por conexão para cada usuário
      const { data: upsertedAgent, error } = await supabase
        .from('ai_agents')
        .upsert(agentData, {
          onConflict: 'user_id,connection_id',
          ignoreDuplicates: false
        })
        .select('id')
        .single()

      if (error) throw error

      // Atualizar o agentId local para futuras operações
      if (upsertedAgent?.id) {
        setAgentId(upsertedAgent.id)
      }

      try {
        await fetch('/api/webhooks/n8n-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            connectionId,
            agentData: { ...agentData, id: upsertedAgent?.id },
            isNew: !agentId
          })
        })
      } catch (err) { console.warn('Webhook silencioso falhou') }

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
            <div className="bg-[#181818] p-6 rounded-3xl flex items-center justify-between group hover:bg-[#1a1a1a] transition-all">
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
  if (!subscription) {
    return <NoSubscription />
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

              {/* Botão Gerar com IA */}
              <div className="flex items-center gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setShowAIModal(true)}
                  className="group relative px-6 py-3 rounded-2xl font-bold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(138,43,226,0.4)]"
                  style={{ backgroundImage: 'linear-gradient(to right, #8A2BE2, #00BFFF, #00FF99)' }}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Gerar com IA
                  </span>
                </button>

                {/* Logo SwiftBot com Pulse e Tooltip */}
                <div className="relative group">
                  <img
                    src="/LOGO-SWIFTBOT.png"
                    alt="SwiftBot AI"
                    className="w-10 h-10 object-contain cursor-pointer animate-[pulse_2s_ease-in-out_infinite]"
                  />

                  {/* Tooltip */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50">
                    <div className="bg-[#1E1E1E] rounded-2xl p-4 shadow-[0_0_30px_rgba(0,255,153,0.15)] w-72">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-[#00FF99]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span className="text-[#00FF99] font-semibold text-sm">Inteligência Adaptativa</span>
                      </div>
                      <p className="text-gray-300 text-xs leading-relaxed">
                        Nossa IA analisa o histórico de conversas com seus clientes para configurar automaticamente o agente ideal — o tom, as respostas e as estratégias perfeitas para o seu negócio.
                      </p>
                      <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-3 h-3 bg-[#1E1E1E] rotate-45" />
                    </div>
                  </div>
                </div>
              </div>

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

              {/* NOVA SEÇÃO: Sobre a Empresa e Configurações de Resposta */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  Contexto da Empresa
                </h3>

                {/* Sobre a Empresa */}
                <div>
                  <div className="flex items-center mb-2 ml-4">
                    <label className="block text-xs font-medium text-[#B0B0B0] uppercase tracking-wider">Sobre a Empresa</label>
                    <SmartGenerateButton
                      fieldName="companyContext"
                      currentValue={formData.companyContext}
                      onSuggestion={(value) => setFormData(prev => ({ ...prev, companyContext: value }))}
                    />
                  </div>
                  <textarea
                    name="companyContext"
                    value={formData.companyContext}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Descreva a história, valores, missão e políticas da empresa... Informações que servem de contexto para a IA, mas não fazem parte do fluxo de conversa."
                    className={`${getInputClass('companyContext')} resize-none`}
                  />
                  <p className="text-xs text-gray-600 mt-2 ml-2">Informações institucionais que ajudam a IA a entender melhor o contexto da empresa.</p>
                </div>

                {/* Grid: Modo de Resposta e Velocidade */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Toggle: Modo de Resposta */}
                  <div className="bg-[#181818] p-4 rounded-2xl">
                    <label className="block text-xs font-medium text-[#B0B0B0] mb-3 uppercase tracking-wider">Modo de Resposta</label>
                    <div className="flex items-center justify-between bg-[#252525] p-3 rounded-xl border border-white/5">
                      <div className="flex-1">
                        <span className="text-sm text-gray-300">
                          {formData.responseMode === 'single' ? 'Bloco Único' : 'Blocos Humanizados'}
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formData.responseMode === 'single'
                            ? 'Uma mensagem completa'
                            : 'Várias mensagens menores'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          responseMode: prev.responseMode === 'single' ? 'humanized' : 'single'
                        }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-[#181818] ${formData.responseMode === 'single' ? 'bg-cyan-400' : 'bg-gray-700'}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.responseMode === 'single' ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Select: Velocidade de Digitação */}
                  <div className="bg-[#181818] p-4 rounded-2xl">
                    <label className="block text-xs font-medium text-[#B0B0B0] mb-3 uppercase tracking-wider">Velocidade de Digitação</label>
                    <CustomSelect
                      label=""
                      value={formData.typingSpeed}
                      onChange={(val) => setFormData(prev => ({ ...prev, typingSpeed: val }))}
                      options={TYPING_SPEEDS}
                      placeholder="Selecione a velocidade"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Controla o delay de "digitando..." antes do envio.
                    </p>
                  </div>
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

              <div className="bg-[#181818] rounded-3xl p-6">
                {renderObjectiveConfig()}
              </div>

              <hr className="border-white/5" />

              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Conhecimento do Produto
                </h3>

                <div>
                  <label className="block text-xs font-medium text-[#B0B0B0] mb-2 ml-4 uppercase tracking-wider">Funções do Agente <span className="text-red-500">*</span></label>
                  <textarea name="productDescription" value={formData.productDescription} onChange={handleInputChange} rows={4} placeholder="Descreva quais funções o agente deve executar (ex: Agendar reuniões, tirar dúvidas, vender produtos)..." className={`${getInputClass('productDescription')} resize-none`} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#B0B0B0] mb-2 ml-4 uppercase tracking-wider text-red-400">Proibido (O que não fazer)</label>
                  <textarea name="forbiddenInstructions" value={formData.forbiddenInstructions} onChange={handleInputChange} rows={3} placeholder="Ex: Não revelar que é uma IA, não falar sobre política, não dar descontos maiores que 10%..." className={`${getInputClass('forbiddenInstructions')} resize-none border-red-500/20 focus:border-red-500/50`} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-[#B0B0B0] mb-2 ml-4 uppercase tracking-wider text-yellow-500/80">Atraso na Resposta</label>
                    <div className="flex gap-4">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          name="responseDelay"
                          value={formData.responseDelay}
                          onChange={handleInputChange}
                          min="0"
                          className={`${getInputClass('responseDelay')}`}
                          placeholder="30"
                        />
                      </div>
                      <div className="w-1/3">
                        <select
                          value={formData.responseDelayUnit}
                          onChange={(e) => setFormData(prev => ({ ...prev, responseDelayUnit: e.target.value }))}
                          className={`${baseInputClass} !px-4 cursor-pointer appearance-none`}
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: 'right 0.5rem center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '1.5em 1.5em'
                          }}
                        >
                          <option value="seconds">Segundos</option>
                          <option value="minutes">Minutos</option>
                        </select>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 ml-2">Tempo de espera antes de enviar a resposta.</p>
                    <p className="text-xs text-gray-600 mt-2 ml-2">Tempo de espera antes de enviar a resposta.</p>
                  </div>

                  {/* Switch: Sempre terminar com pergunta */}
                  <div className="flex flex-col justify-center">
                    <label className="block text-xs font-medium text-[#B0B0B0] mb-2 ml-4 uppercase tracking-wider">Regra de Ouro</label>
                    <div className="flex items-center justify-between bg-[#252525] p-3 rounded-xl border border-white/5">
                      <span className="text-sm text-gray-300">Sempre terminar com pergunta</span>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, alwaysEndWithQuestion: !prev.alwaysEndWithQuestion }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#00FF99] focus:ring-offset-2 focus:ring-offset-[#181818] ${formData.alwaysEndWithQuestion ? 'bg-[#00FF99]' : 'bg-gray-700'}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.alwaysEndWithQuestion ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 ml-2">Força o agente a sempre fazer uma pergunta no final para engajar.</p>
                  </div>

                  {/* Lista dinâmica de Links de Produtos */}
                  <div>
                    <div className="flex justify-between items-center mb-2 ml-4">
                      <label className="block text-xs font-medium text-[#B0B0B0] uppercase tracking-wider">Links de Produtos</label>
                      <span className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">
                        {formData.productUrls.length} links
                      </span>
                    </div>

                    <div className="space-y-2">
                      {formData.productUrls.map((url, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={url}
                            onChange={(e) => {
                              const newUrls = [...formData.productUrls]
                              newUrls[index] = e.target.value
                              setFormData(prev => ({ ...prev, productUrls: newUrls }))
                            }}
                            placeholder="www.seusite.com.br/produto"
                            className={`${getInputClass('productUrl')} flex-1`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                productUrls: prev.productUrls.filter((_, i) => i !== index)
                              }))
                            }}
                            className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, productUrls: [...prev.productUrls, ''] }))}
                        className="w-full py-3 border border-dashed border-gray-700 rounded-xl text-gray-400 hover:border-[#00FF99] hover:text-[#00FF99] transition-all flex justify-center items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Adicionar novo produto
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 ml-2">Adicione links para cada produto ou serviço que o agente pode compartilhar.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#B0B0B0] mb-2 ml-4 uppercase tracking-wider">Preço / Faixa</label>
                    <input type="text" name="priceRange" value={formData.priceRange} onChange={handleInputChange} placeholder="Ex: R$ 99,90" className={getInputClass('priceRange')} />
                  </div>
                </div>

                {/* Produtos / Serviços */}
                <div className="mt-6">
                  <label className="block text-xs font-medium text-[#B0B0B0] mb-2 ml-4 uppercase tracking-wider">Produtos / Serviços (Lista Detalhada)</label>
                  <textarea
                    name="productsServices"
                    value={formData.productsServices}
                    onChange={handleInputChange}
                    rows={5}
                    placeholder="Liste seus produtos ou serviços com preços e detalhes...&#10;Ex:&#10;- Consultoria One-on-One: R$ 500/hora&#10;- Ebook Completo: R$ 97,00"
                    className={`${getInputClass('productsServices')} resize-none font-mono text-sm`}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Treinamento de Objeções
                  </h3>
                  <span className="text-xs text-gray-600 bg-white/5 px-3 py-1 rounded-full">
                    {formData.objectionsQA.length} / {MAX_ITEMS}
                  </span>
                </div>

                <div className="space-y-4" key={`objections-${formKey}`}>
                  {formData.objectionsQA.map((item, index) => (
                    <div key={`obj-${formKey}-${index}`} className="bg-[#1E1E1E] rounded-3xl p-6 relative group hover:bg-[#222222] transition-all">
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

              {/* SEÇÃO: REGRAS DE SILÊNCIO */}
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                    Regras de Silêncio
                  </h3>
                  <span className="text-xs text-gray-600 bg-white/5 px-3 py-1 rounded-full">
                    {formData.ignoredKeywords.length} palavras
                  </span>
                </div>
                <p className="text-gray-500 text-sm -mt-2">
                  Configure quando o agente deve <strong>permanecer em silêncio</strong> e não responder.
                </p>

                {/* Toggle: Ignorar mensagens apenas com emoji */}
                <div className="bg-[#181818] p-4 rounded-2xl flex items-center justify-between group hover:bg-[#1a1a1a] transition-all">
                  <div>
                    <h4 className="text-white font-medium text-sm mb-1 flex items-center gap-2">
                      <span className="text-lg"></span>
                      Ignorar mensagens apenas com emoji
                    </h4>
                    <p className="text-gray-500 text-xs">Quando ativado, mensagens contendo apenas emojis (sem texto) serão ignoradas silenciosamente.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, ignoreEmojiOnly: !prev.ignoreEmojiOnly }))}
                    className={`
                      relative w-12 h-6 rounded-full transition-all duration-300 ease-in-out focus:outline-none flex-shrink-0 ml-4
                      ${formData.ignoreEmojiOnly ? 'bg-[#00FF99] shadow-[0_0_10px_rgba(0,255,153,0.3)]' : 'bg-gray-700'}
                    `}
                  >
                    <span
                      className={`
                        absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow-md transition-transform duration-300 ease-in-out
                        ${formData.ignoreEmojiOnly ? 'translate-x-6' : 'translate-x-0'}
                      `}
                    />
                  </button>
                </div>

                <div className="bg-[#1E1E1E] rounded-3xl p-6">
                  <div className="flex gap-3 mb-4">
                    <input
                      type="text"
                      id="newIgnoredKeyword"
                      placeholder="Ex: Preenchi seu formulário, email:, Telefone/WhatsApp:"
                      className={`${getInputClass('newKeyword')} flex-1`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const value = e.target.value.trim()
                          if (value && !formData.ignoredKeywords.includes(value)) {
                            setFormData(prev => ({
                              ...prev,
                              ignoredKeywords: [...prev.ignoredKeywords, value]
                            }))
                            e.target.value = ''
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('newIgnoredKeyword')
                        const value = input.value.trim()
                        if (value && !formData.ignoredKeywords.includes(value)) {
                          setFormData(prev => ({
                            ...prev,
                            ignoredKeywords: [...prev.ignoredKeywords, value]
                          }))
                          input.value = ''
                        }
                      }}
                      className="px-6 py-4 bg-orange-500/10 text-orange-400 rounded-3xl hover:bg-orange-500/20 transition-all font-medium"
                    >
                      Adicionar
                    </button>
                  </div>

                  {formData.ignoredKeywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {formData.ignoredKeywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-300 rounded-full text-sm group"
                        >
                          {keyword}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                ignoredKeywords: prev.ignoredKeywords.filter((_, i) => i !== index)
                              }))
                            }}
                            className="text-orange-400/50 hover:text-red-400 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm text-center py-4">
                      Nenhuma palavra ignorada configurada. Pressione Enter ou clique em Adicionar.
                    </p>
                  )}
                </div>

                {/* Condições Especiais */}
                <div className="bg-[#1E1E1E] rounded-3xl p-6 mt-4">
                  <h4 className="text-white font-medium text-sm mb-2 flex items-center gap-2">
                    <span className="text-lg"></span>
                    Condições Especiais
                  </h4>
                  <p className="text-gray-500 text-xs mb-3">
                    Descreva situações em que o agente deve permanecer em silêncio. A IA analisará cada mensagem.
                  </p>
                  <textarea
                    name="silenceConditions"
                    value={formData.silenceConditions}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Ex: Mensagens com apenas 'ok' ou 'sim', respostas de confirmação curtas, mensagens que parecem ser de bots automáticos..."
                    className={`${getInputClass('silenceConditions')} resize-none`}
                  />
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
        </div >

        {/* MODAL DE SUCESSO */}
        {
          showSuccessModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
              <div className="bg-[#1E1E1E] p-8 rounded-3xl shadow-[0_0_50px_rgba(0,255,153,0.1)] max-w-md w-full text-center transform transition-all scale-100">
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
          )
        }

        {/* MODAL DE IA - GERAR AGENTE */}
        {
          showAIModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn p-4">
              <div className="bg-[#111111] rounded-3xl shadow-[0_0_60px_rgba(138,43,226,0.2)] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src="/LOGO-SWIFTBOT.png" alt="SwiftBot" className="w-12 h-12 object-contain" />
                      <div>
                        <h2 className="text-2xl font-bold text-white">Gerar Agente com IA</h2>
                        <p className="text-gray-400 text-sm">Configure seu agente em segundos</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAIModal(false)
                        setAiSelectedStyle('')
                        setAiSelectedObjective('')
                      }}
                      className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-xl"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">
                  {/* Estilo de Comunicação */}
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-white uppercase tracking-wider">
                      Estilo de Comunicação
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {AI_COMMUNICATION_STYLES.map((style) => (
                        <button
                          key={style.value}
                          type="button"
                          onClick={() => setAiSelectedStyle(style.value)}
                          className={`
                          p-4 rounded-2xl text-left transition-all duration-300
                          ${aiSelectedStyle === style.value
                              ? 'bg-[#00FF99]/10 shadow-[0_0_20px_rgba(0,255,153,0.2)]'
                              : 'bg-[#1E1E1E] hover:bg-[#252525]'
                            }
                        `}
                        >
                          <div className="flex items-center gap-3">
                            <ModalIcon type={style.icon} isSelected={aiSelectedStyle === style.value} />
                            <p className={`font-semibold ${aiSelectedStyle === style.value ? 'text-[#00FF99]' : 'text-white'}`}>
                              {style.label}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Objetivo Principal */}
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-white uppercase tracking-wider">
                      Objetivo Principal
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {AI_OBJECTIVES.map((obj) => (
                        <button
                          key={obj.value}
                          type="button"
                          onClick={() => setAiSelectedObjective(obj.value)}
                          className={`
                          p-4 rounded-2xl text-left transition-all duration-300
                          ${aiSelectedObjective === obj.value
                              ? 'bg-[#00FF99]/10 shadow-[0_0_20px_rgba(0,255,153,0.2)]'
                              : 'bg-[#1E1E1E] hover:bg-[#252525]'
                            }
                        `}
                        >
                          <div className="flex items-center gap-3">
                            <ModalIcon type={obj.icon} isSelected={aiSelectedObjective === obj.value} />
                            <p className={`font-semibold ${aiSelectedObjective === obj.value ? 'text-[#00FF99]' : 'text-white'}`}>
                              {obj.label}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6">
                  <button
                    type="button"
                    onClick={handleGenerateWithAI}
                    disabled={!aiSelectedStyle || !aiSelectedObjective || isGenerating}
                    className={`
                    w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3
                    ${(!aiSelectedStyle || !aiSelectedObjective)
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'text-white hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(138,43,226,0.4)]'
                      }
                  `}
                    style={aiSelectedStyle && aiSelectedObjective && !isGenerating ? { backgroundImage: 'linear-gradient(to right, #8A2BE2, #00BFFF, #00FF99)' } : {}}
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Gerando seu agente...
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Gerar seu Agente
                      </>
                    )}
                  </button>
                  {(!aiSelectedStyle || !aiSelectedObjective) && (
                    <p className="text-center text-xs text-gray-500 mt-3">
                      Selecione o estilo e objetivo para continuar
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        }

      </main >
    </div >
  )
}

export default function AgentConfigPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FF99]" /></div>}>
      <AgentConfigContent />
    </Suspense>
  )
}