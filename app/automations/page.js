'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import NoSubscription from '../components/NoSubscription'
import {
  Search,
  Plus,
  ChevronDown,
  Bot,
  Zap,
  Clock,
  MoreVertical,
  Filter,
  Folder,
  FolderPlus,
  Trash2,
  Edit3,
  Copy,
  ToggleLeft,
  ToggleRight,
  MessageCircle,
  Hash,
  Loader2,
  X,
  Play,
  Pause,
  Tag,
  Link,
  Send,
  Settings
} from 'lucide-react'

// ============================================================================
// CONNECTION DROPDOWN - Mesmo estilo do contacts/page.js
// ============================================================================
const ConnectionDropdown = ({ connections, selectedConnection, onSelectConnection }) => {
  const [isOpen, setIsOpen] = useState(false)

  const selected = connections.find(c => c.id === selectedConnection)
  const displayValue = selected
    ? (selected.profile_name || selected.instance_name)
    : 'Selecione uma instância'

  return (
    <div className="relative">
      <div className="bg-[#1E1E1E] rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 flex items-center justify-between text-left outline-none"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {selected && (
              <div className="flex-shrink-0">
                {selected.profile_pic_url ? (
                  <img
                    src={selected.profile_pic_url}
                    alt={selected.profile_name || 'Conexão'}
                    className="w-10 h-10 rounded-full object-cover bg-[#333333]"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div
                  className={`w-10 h-10 rounded-full bg-[#00A884] flex items-center justify-center text-white font-semibold ${selected.profile_pic_url ? 'hidden' : 'flex'}`}
                  style={{ display: selected.profile_pic_url ? 'none' : 'flex' }}
                >
                  {selected.profile_name ? selected.profile_name.charAt(0).toUpperCase() : '?'}
                </div>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">
                {displayValue}
              </div>
              {selected && (
                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                  <span className={selected.is_connected ? 'text-[#00FF99]' : 'text-red-400'}>
                    {selected.is_connected ? '●' : '○'}
                  </span>
                  <span className="truncate">
                    {selected.is_connected ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
              )}
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 backdrop-blur-md bg-[#1E1E1E]/95 rounded-2xl shadow-2xl z-50 max-h-[300px] overflow-y-auto">
            {connections.map((connection, index) => (
              <button
                key={connection.id}
                type="button"
                onClick={() => {
                  onSelectConnection(connection.id)
                  setIsOpen(false)
                }}
                className={`
                  w-full p-3 text-sm text-left transition-all duration-150 border-b border-white/5 last:border-0
                  ${selectedConnection === connection.id
                    ? 'bg-[#00FF99]/10 text-[#00FF99]'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {connection.profile_pic_url ? (
                      <img
                        src={connection.profile_pic_url}
                        alt={connection.profile_name || `Conexão ${index + 1}`}
                        className="w-10 h-10 rounded-full object-cover bg-[#333333]"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-10 h-10 rounded-full bg-[#00A884] flex items-center justify-center text-white font-semibold ${connection.profile_pic_url ? 'hidden' : 'flex'}`}
                      style={{ display: connection.profile_pic_url ? 'none' : 'flex' }}
                    >
                      {connection.profile_name ? connection.profile_name.charAt(0).toUpperCase() : (index + 1)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {connection.profile_name || connection.instance_name}
                    </div>
                    <div className="text-xs flex items-center gap-1.5 mt-0.5">
                      <span className={connection.is_connected ? 'text-[#00FF99]' : 'text-red-400'}>
                        {connection.is_connected ? '● Conectado' : '○ Desconectado'}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  )
}

// ============================================================================
// TAB NAVIGATION
// ============================================================================
const TabNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'templates', label: 'Meus Templates', icon: MessageCircle },
    { id: 'keywords', label: 'Palavras-chave', icon: Hash },
    { id: 'sequences', label: 'Sequências', icon: Clock }
  ]

  return (
    <div className="flex gap-2 border-b border-white/10">
      {tabs.map(tab => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all
              border-b-2 -mb-[2px]
              ${isActive
                ? 'text-[#00FF99] border-[#00FF99]'
                : 'text-gray-400 border-transparent hover:text-white hover:border-white/20'}
            `}
          >
            <Icon size={16} />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

// ============================================================================
// AUTOMATION CARD
// ============================================================================
const AutomationCard = ({ automation, onToggle, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false)

  const keywords = automation.automation_keywords || []
  const keywordsPreview = keywords.slice(0, 3).map(k => k.keyword).join(', ')
  const hasMoreKeywords = keywords.length > 3

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className={`
      bg-[#1A1A1A] rounded-xl p-4 border transition-all
      ${automation.is_active ? 'border-[#00FF99]/20' : 'border-white/5'}
      hover:border-white/20
    `}>
      <div className="flex items-start justify-between gap-4">
        {/* Left side - Name and trigger */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-medium truncate">
              {automation.name}
            </h3>
            {automation.folder && (
              <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Folder size={10} />
                {automation.folder.name}
              </span>
            )}
          </div>

          {/* Trigger preview */}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className={`w-2 h-2 rounded-full ${automation.is_active ? 'bg-[#00FF99]' : 'bg-gray-500'}`} />
            {automation.trigger_type === 'message_contains' && 'A mensagem contém'}
            {automation.trigger_type === 'message_is' && 'Mensagem é'}
            {automation.trigger_type === 'message_starts_with' && 'Mensagem começa com'}
            {automation.trigger_type === 'reaction' && 'Reação é'}
            {keywordsPreview && (
              <span className="text-[#00FF99]">
                {keywordsPreview}{hasMoreKeywords && '...'}
              </span>
            )}
          </div>
        </div>

        {/* Right side - Metrics and actions */}
        <div className="flex items-center gap-6 text-sm">
          <div className="text-center">
            <div className="text-white font-medium">{automation.execution_count || 0}</div>
            <div className="text-xs text-gray-500">Execuções</div>
          </div>
          <div className="text-center">
            <div className="text-white font-medium">{automation.ctr_percentage || 0}%</div>
            <div className="text-xs text-gray-500">CTR</div>
          </div>
          <div className="text-center hidden sm:block">
            <div className="text-white font-medium">{formatDate(automation.updated_at)}</div>
            <div className="text-xs text-gray-500">Modificado</div>
          </div>

          {/* Toggle */}
          <button
            onClick={() => onToggle(automation.id, !automation.is_active)}
            className={`
              p-2 rounded-lg transition-colors
              ${automation.is_active ? 'text-[#00FF99] hover:bg-[#00FF99]/10' : 'text-gray-500 hover:bg-white/5'}
            `}
          >
            {automation.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
          </button>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <MoreVertical size={16} />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 bg-[#252525] rounded-xl shadow-xl z-50 py-1 min-w-[150px]">
                  <button
                    onClick={() => { onEdit(automation); setShowMenu(false) }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
                  >
                    <Edit3 size={14} /> Editar
                  </button>
                  <button
                    onClick={() => setShowMenu(false)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
                  >
                    <Copy size={14} /> Duplicar
                  </button>
                  <hr className="border-white/10 my-1" />
                  <button
                    onClick={() => { onDelete(automation.id); setShowMenu(false) }}
                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                  >
                    <Trash2 size={14} /> Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SEQUENCE CARD
// ============================================================================
const SequenceCard = ({ sequence, onToggle, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className={`
      bg-[#1A1A1A] rounded-xl p-4 border transition-all
      ${sequence.is_active ? 'border-[#00FF99]/20' : 'border-white/5'}
      hover:border-white/20
    `}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium truncate mb-1">
            {sequence.name}
          </h3>
          {sequence.description && (
            <p className="text-sm text-gray-400 truncate">{sequence.description}</p>
          )}
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div className="text-center">
            <div className="text-white font-medium">{sequence.subscribers_count || 0}</div>
            <div className="text-xs text-gray-500">Assinantes</div>
          </div>
          <div className="text-center">
            <div className="text-white font-medium">{sequence.messagesCount || 0}</div>
            <div className="text-xs text-gray-500">Mensagens</div>
          </div>
          <div className="text-center">
            <div className="text-white font-medium">{sequence.openRate || '0%'}</div>
            <div className="text-xs text-gray-500">Taxa Abertura</div>
          </div>
          <div className="text-center">
            <div className="text-white font-medium">{sequence.ctr || '0%'}</div>
            <div className="text-xs text-gray-500">CTR</div>
          </div>

          <button
            onClick={() => onToggle(sequence.id, !sequence.is_active)}
            className={`
              p-2 rounded-lg transition-colors
              ${sequence.is_active ? 'text-[#00FF99] hover:bg-[#00FF99]/10' : 'text-gray-500 hover:bg-white/5'}
            `}
          >
            {sequence.is_active ? <Play size={20} /> : <Pause size={20} />}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <MoreVertical size={16} />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 bg-[#252525] rounded-xl shadow-xl z-50 py-1 min-w-[150px]">
                  <button
                    onClick={() => { onEdit(sequence); setShowMenu(false) }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
                  >
                    <Edit3 size={14} /> Editar
                  </button>
                  <hr className="border-white/10 my-1" />
                  <button
                    onClick={() => { onDelete(sequence.id); setShowMenu(false) }}
                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                  >
                    <Trash2 size={14} /> Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// CREATE TEMPLATE MODAL
// ============================================================================
const CreateTemplateModal = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim() || !content.trim()) return
    setLoading(true)
    try {
      await onSave({ name: name.trim(), content: content.trim() })
      setName('')
      setContent('')
    } catch (error) {
      console.error('Erro ao criar template:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1A1A] rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Novo Template</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome do Template
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Boas-vindas, Follow-up 1..."
              className="w-full bg-[#252525] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF99]/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Conteúdo da Mensagem
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Digite o texto da mensagem..."
              rows={4}
              className="w-full bg-[#252525] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF99]/30 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !content.trim() || loading}
            className="flex-1 px-4 py-3 bg-[#00FF99] text-black rounded-xl font-medium hover:bg-[#00E88C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="animate-spin" size={18} />}
            Criar Template
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// CREATE SEQUENCE MODAL
// ============================================================================
const CreateSequenceModal = ({ isOpen, onClose, onSave, templates = [] }) => {
  const [name, setName] = useState('')
  const [steps, setSteps] = useState([])
  const [loading, setLoading] = useState(false)

  const delayUnits = [
    { value: 'immediately', label: 'Imediatamente' },
    { value: 'minutes', label: 'Minutos' },
    { value: 'hours', label: 'Horas' },
    { value: 'days', label: 'Dias' }
  ]

  const daysOfWeek = [
    { value: 'mon', label: 'Seg' },
    { value: 'tue', label: 'Ter' },
    { value: 'wed', label: 'Qua' },
    { value: 'thu', label: 'Qui' },
    { value: 'fri', label: 'Sex' },
    { value: 'sat', label: 'Sáb' },
    { value: 'sun', label: 'Dom' }
  ]

  const addStep = () => {
    setSteps([...steps, {
      id: Date.now(),
      templateId: null,
      customContent: '',
      delayValue: 1,
      delayUnit: 'hours',
      timeWindowStart: null,
      timeWindowEnd: null,
      allowedDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      isActive: true
    }])
  }

  const updateStep = (index, updates) => {
    const newSteps = [...steps]
    newSteps[index] = { ...newSteps[index], ...updates }
    setSteps(newSteps)
  }

  const removeStep = (index) => {
    setSteps(steps.filter((_, i) => i !== index))
  }

  const toggleDay = (index, day) => {
    const step = steps[index]
    const days = step.allowedDays || []
    const newDays = days.includes(day)
      ? days.filter(d => d !== day)
      : [...days, day]
    updateStep(index, { allowedDays: newDays })
  }

  const getDelayLabel = (step) => {
    if (step.delayUnit === 'immediately') return 'Imediatamente'
    return `Após ${step.delayValue} ${delayUnits.find(u => u.value === step.delayUnit)?.label || 'horas'}`
  }

  const handleSubmit = async () => {
    if (!name.trim() || steps.length === 0) return
    setLoading(true)
    try {
      await onSave({
        name: name.trim(),
        steps: steps.map(s => ({
          templateId: s.templateId,
          delayValue: s.delayUnit === 'immediately' ? 0 : s.delayValue,
          delayUnit: s.delayUnit,
          timeWindowStart: s.timeWindowStart,
          timeWindowEnd: s.timeWindowEnd,
          allowedDays: s.allowedDays,
          isActive: s.isActive
        }))
      })
      setName('')
      setSteps([])
    } catch (error) {
      console.error('Erro ao criar sequência:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1A1A] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
          <h2 className="text-xl font-semibold text-white">Nova Sequência</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Nome da sequência */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome da Sequência
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Follow-up Vendas, Boas-vindas..."
              className="w-full bg-[#252525] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF99]/30"
            />
          </div>

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">Mensagens da Sequência</h3>
              <button
                onClick={addStep}
                className="text-sm text-[#00FF99] hover:underline flex items-center gap-1"
              >
                <Plus size={14} /> Adicionar Mensagem
              </button>
            </div>

            {steps.length === 0 ? (
              <div className="text-center py-8 bg-[#252525] rounded-xl">
                <Clock className="mx-auto text-gray-600 mb-2" size={32} />
                <p className="text-gray-400 text-sm">Nenhuma mensagem adicionada</p>
                <button
                  onClick={addStep}
                  className="mt-3 text-sm text-[#00FF99] hover:underline"
                >
                  + Adicionar primeira mensagem
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div key={step.id} className="bg-[#252525] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#00FF99]/20 text-[#00FF99] text-xs px-2 py-1 rounded-full font-medium">
                          {getDelayLabel(step)}
                        </span>
                        <button
                          onClick={() => updateStep(index, { isActive: !step.isActive })}
                          className={`p-1 rounded ${step.isActive ? 'text-[#00FF99]' : 'text-gray-500'}`}
                        >
                          {step.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        </button>
                      </div>
                      <button
                        onClick={() => removeStep(index)}
                        className="text-gray-400 hover:text-red-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Delay config */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="col-span-1">
                        <label className="text-xs text-gray-400 mb-1 block">Tempo</label>
                        <input
                          type="number"
                          min="0"
                          value={step.delayValue}
                          onChange={(e) => updateStep(index, { delayValue: parseInt(e.target.value) || 0 })}
                          className="w-full bg-[#1A1A1A] text-white px-3 py-2 rounded-lg text-sm"
                          disabled={step.delayUnit === 'immediately'}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-gray-400 mb-1 block">Unidade</label>
                        <select
                          value={step.delayUnit}
                          onChange={(e) => updateStep(index, { delayUnit: e.target.value })}
                          className="w-full bg-[#1A1A1A] text-white px-3 py-2 rounded-lg text-sm"
                        >
                          {delayUnits.map(u => (
                            <option key={u.value} value={u.value}>{u.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Template selection */}
                    <div className="mb-4">
                      <label className="text-xs text-gray-400 mb-1 block">Mensagem</label>
                      <select
                        value={step.templateId || ''}
                        onChange={(e) => updateStep(index, { templateId: e.target.value || null })}
                        className="w-full bg-[#1A1A1A] text-white px-3 py-2 rounded-lg text-sm"
                      >
                        <option value="">Selecione um template...</option>
                        {templates.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Time window */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Enviar a partir de</label>
                        <input
                          type="time"
                          value={step.timeWindowStart || ''}
                          onChange={(e) => updateStep(index, { timeWindowStart: e.target.value || null })}
                          className="w-full bg-[#1A1A1A] text-white px-3 py-2 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Até</label>
                        <input
                          type="time"
                          value={step.timeWindowEnd || ''}
                          onChange={(e) => updateStep(index, { timeWindowEnd: e.target.value || null })}
                          className="w-full bg-[#1A1A1A] text-white px-3 py-2 rounded-lg text-sm"
                        />
                      </div>
                    </div>

                    {/* Days of week */}
                    <div>
                      <label className="text-xs text-gray-400 mb-2 block">Dias permitidos</label>
                      <div className="flex gap-2">
                        {daysOfWeek.map(day => (
                          <button
                            key={day.value}
                            onClick={() => toggleDay(index, day.value)}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${(step.allowedDays || []).includes(day.value)
                              ? 'bg-[#00FF99]/20 text-[#00FF99]'
                              : 'bg-white/5 text-gray-500'
                              }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-white/10 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || steps.length === 0 || loading}
            className="flex-1 px-4 py-3 bg-[#00FF99] text-black rounded-xl font-medium hover:bg-[#00E88C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="animate-spin" size={18} />}
            Criar Sequência
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// CREATE AUTOMATION MODAL
// ============================================================================
const CreateAutomationModal = ({ isOpen, onClose, onCreate, connectionId }) => {
  const [name, setName] = useState('')
  const [triggerType, setTriggerType] = useState('message_contains')
  const [keywords, setKeywords] = useState([])
  const [keywordInput, setKeywordInput] = useState('')
  const [responseContent, setResponseContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()])
      setKeywordInput('')
    }
  }

  const handleRemoveKeyword = (kw) => {
    setKeywords(keywords.filter(k => k !== kw))
  }

  const handleSubmit = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      await onCreate({
        connectionId,
        name: name.trim(),
        type: 'keyword',
        triggerType,
        keywords,
        responses: responseContent ? [{ type: 'text', content: responseContent }] : []
      })
      onClose()
      setName('')
      setKeywords([])
      setResponseContent('')
    } catch (error) {
      console.error('Erro ao criar automação:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1A1A] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Nova Automação</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome da automação
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Welcome Message"
              className="w-full bg-[#252525] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF99]/30"
            />
          </div>

          {/* Tipo de gatilho */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Quando disparar
            </label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value)}
              className="w-full bg-[#252525] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF99]/30"
            >
              <option value="message_contains">A mensagem contém</option>
              <option value="message_is">Mensagem é exatamente</option>
              <option value="message_starts_with">Mensagem começa com</option>
              <option value="word">Mensagem contém palavra inteira</option>
              <option value="reaction">Reação é</option>
            </select>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Palavras-chave / Gatilhos
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                placeholder="Digite e pressione Enter"
                className="flex-1 bg-[#252525] text-white px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF99]/30"
              />
              <button
                onClick={handleAddKeyword}
                className="px-4 py-2 bg-[#00FF99] text-black rounded-xl font-medium hover:bg-[#00E88C] transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 bg-[#00FF99]/10 text-[#00FF99] px-3 py-1 rounded-full text-sm"
                  >
                    {kw}
                    <button onClick={() => handleRemoveKeyword(kw)} className="hover:text-white">
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Resposta */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Resposta automática
            </label>
            <textarea
              value={responseContent}
              onChange={(e) => setResponseContent(e.target.value)}
              placeholder="Digite a mensagem que será enviada..."
              rows={4}
              className="w-full bg-[#252525] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF99]/30 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || loading}
            className="flex-1 px-4 py-3 bg-[#00FF99] text-black rounded-xl font-medium hover:bg-[#00E88C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="animate-spin" size={18} />}
            Criar Automação
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// EDIT AUTOMATION MODAL - Com configurações de ações (tags, webhook)
// ============================================================================
const EditAutomationModal = ({ isOpen, onClose, automation, onSave, connectionId }) => {
  const [name, setName] = useState('')
  const [triggerType, setTriggerType] = useState('message_contains')
  const [keywords, setKeywords] = useState([])
  const [keywordInput, setKeywordInput] = useState('')
  const [responseContent, setResponseContent] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookEnabled, setWebhookEnabled] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [tagsToAdd, setTagsToAdd] = useState([])
  const [selectedOriginId, setSelectedOriginId] = useState(null)
  const [availableOrigins, setAvailableOrigins] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState('trigger') // 'trigger', 'response', 'actions'

  // Carregar dados da automação e origens quando abrir
  useEffect(() => {
    if (automation && isOpen) {
      setName(automation.name || '')
      setTriggerType(automation.trigger_type || 'message_contains')
      setKeywords(automation.automation_keywords?.map(k => k.keyword) || [])
      setResponseContent(automation.automation_responses?.[0]?.content || '')
      setWebhookUrl(automation.action_webhook_url || '')
      setWebhookEnabled(automation.action_webhook_enabled || false)
      setTagsToAdd(automation.action_add_tags || [])
      setSelectedOriginId(automation.action_set_origin_id || null)

      // Carregar campos personalizados
      const savedFields = automation.action_custom_fields || {}
      setCustomFields(Object.entries(savedFields).map(([name, value]) => ({ name, value })))

      // Carregar origens disponíveis
      loadOrigins()
    }
  }, [automation, isOpen])

  const loadOrigins = async () => {
    try {
      const response = await fetch(`/api/contacts?connectionId=${connectionId}`)
      const data = await response.json()
      if (response.ok) {
        setAvailableOrigins(data.origins || [])
      }
    } catch (error) {
      console.error('Erro ao carregar origens:', error)
    }
  }

  // Estado para campos personalizados
  const [customFields, setCustomFields] = useState([])
  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldValue, setNewFieldValue] = useState('')

  const handleAddCustomField = () => {
    if (newFieldName.trim() && newFieldValue.trim()) {
      setCustomFields([...customFields, { name: newFieldName.trim(), value: newFieldValue.trim() }])
      setNewFieldName('')
      setNewFieldValue('')
    }
  }

  const handleRemoveCustomField = (index) => {
    setCustomFields(customFields.filter((_, i) => i !== index))
  }

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()])
      setKeywordInput('')
    }
  }

  const handleRemoveKeyword = (kw) => {
    setKeywords(keywords.filter(k => k !== kw))
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !tagsToAdd.includes(tagInput.trim())) {
      setTagsToAdd([...tagsToAdd, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag) => {
    setTagsToAdd(tagsToAdd.filter(t => t !== tag))
  }

  const handleSubmit = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      // Converter array de campos para objeto
      const customFieldsObj = customFields.reduce((acc, field) => {
        acc[field.name] = field.value
        return acc
      }, {})

      await onSave({
        name: name.trim(),
        triggerType,
        keywords: keywords.map(k => ({ keyword: k, matchType: triggerType.replace('message_', '') })),
        responses: responseContent ? [{ type: 'text', content: responseContent }] : [],
        actionWebhookUrl: webhookUrl,
        actionWebhookEnabled: webhookEnabled,
        actionAddTags: tagsToAdd,
        actionSetOriginId: selectedOriginId,
        actionCustomFields: customFieldsObj
      })
      onClose()
    } catch (error) {
      console.error('Erro ao salvar automação:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !automation) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1A1A] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
          <h2 className="text-xl font-semibold text-white">Editar Automação</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Tabs de navegação */}
        <div className="flex border-b border-white/10 flex-shrink-0">
          <button
            onClick={() => setActiveSection('trigger')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 border-b-2 ${activeSection === 'trigger' ? 'text-[#00FF99] border-[#00FF99]' : 'text-gray-400 border-transparent hover:text-white'
              }`}
          >
            <Zap size={16} /> Gatilho
          </button>
          <button
            onClick={() => setActiveSection('response')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 border-b-2 ${activeSection === 'response' ? 'text-[#00FF99] border-[#00FF99]' : 'text-gray-400 border-transparent hover:text-white'
              }`}
          >
            <Send size={16} /> Resposta
          </button>
          <button
            onClick={() => setActiveSection('actions')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 border-b-2 ${activeSection === 'actions' ? 'text-[#00FF99] border-[#00FF99]' : 'text-gray-400 border-transparent hover:text-white'
              }`}
          >
            <Tag size={16} /> Ações
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* SEÇÃO: GATILHO */}
          {activeSection === 'trigger' && (
            <>
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome da automação
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Welcome Message"
                  className="w-full bg-[#252525] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF99]/30"
                />
              </div>

              {/* Tipo de gatilho */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quando disparar
                </label>
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value)}
                  className="w-full bg-[#252525] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF99]/30"
                >
                  <option value="message_contains">A mensagem contém</option>
                  <option value="message_is">Mensagem é exatamente</option>
                  <option value="message_starts_with">Mensagem começa com</option>
                  <option value="word">Mensagem contém palavra inteira</option>
                  <option value="reaction">Reação é</option>
                </select>
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Palavras-chave / Gatilhos
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                    placeholder="Digite e pressione Enter"
                    className="flex-1 bg-[#252525] text-white px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF99]/30"
                  />
                  <button
                    onClick={handleAddKeyword}
                    className="px-4 py-2 bg-[#00FF99] text-black rounded-xl font-medium hover:bg-[#00E88C] transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 bg-[#00FF99]/10 text-[#00FF99] px-3 py-1 rounded-full text-sm"
                      >
                        {kw}
                        <button onClick={() => handleRemoveKeyword(kw)} className="hover:text-white">
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* SEÇÃO: RESPOSTA */}
          {activeSection === 'response' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Resposta automática
              </label>
              <textarea
                value={responseContent}
                onChange={(e) => setResponseContent(e.target.value)}
                placeholder="Digite a mensagem que será enviada automaticamente..."
                rows={8}
                className="w-full bg-[#252525] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF99]/30 resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                Você pode usar variáveis como: {'{nome}'}, {'{telefone}'}, {'{mensagem}'}
              </p>
            </div>
          )}

          {/* SEÇÃO: AÇÕES */}
          {activeSection === 'actions' && (
            <>
              {/* Adicionar Tags */}
              <div className="bg-[#252525] rounded-xl p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Tag className="text-blue-400" size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Adicionar Tags</h3>
                    <p className="text-xs text-gray-400">Tags serão adicionadas ao contato quando a automação disparar</p>
                  </div>
                </div>

                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Nome da tag (ex: lead-quente)"
                    className="flex-1 bg-[#1A1A1A] text-white px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {tagsToAdd.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tagsToAdd.map((tag, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm"
                      >
                        <Tag size={12} />
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)} className="hover:text-white">
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Enviar para Webhook */}
              <div className="bg-[#252525] rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Link className="text-purple-400" size={20} />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Enviar para Webhook</h3>
                      <p className="text-xs text-gray-400">Envie os dados do lead para um sistema externo</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setWebhookEnabled(!webhookEnabled)}
                    className={`p-2 rounded-lg transition-colors ${webhookEnabled ? 'text-purple-400 bg-purple-500/20' : 'text-gray-500 bg-white/5'
                      }`}
                  >
                    {webhookEnabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </button>
                </div>

                {webhookEnabled && (
                  <div>
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://seu-sistema.com/webhook"
                      className="w-full bg-[#1A1A1A] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Dados enviados: nome, telefone, mensagem, data/hora, tags
                    </p>
                  </div>
                )}
              </div>

              {/* Definir Origem */}
              <div className="bg-[#252525] rounded-xl p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Send className="text-orange-400" size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Definir Origem</h3>
                    <p className="text-xs text-gray-400">Atribuir origem ao contato para tracking</p>
                  </div>
                </div>
                <select
                  value={selectedOriginId || ''}
                  onChange={(e) => setSelectedOriginId(e.target.value || null)}
                  className="w-full bg-[#1A1A1A] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                >
                  <option value="">Nenhuma origem</option>
                  {availableOrigins.map(origin => (
                    <option key={origin.id} value={origin.id}>{origin.name}</option>
                  ))}
                </select>
              </div>

              {/* Campos Personalizados */}
              <div className="bg-[#252525] rounded-xl p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <Settings className="text-cyan-400" size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Campos Personalizados</h3>
                    <p className="text-xs text-gray-400">Enviar dados extras no webhook</p>
                  </div>
                </div>

                {/* Input para adicionar campo */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    placeholder="Nome do campo"
                    className="flex-1 bg-[#1A1A1A] text-white px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                  <input
                    type="text"
                    value={newFieldValue}
                    onChange={(e) => setNewFieldValue(e.target.value)}
                    placeholder="Valor"
                    className="flex-1 bg-[#1A1A1A] text-white px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                  <button
                    onClick={handleAddCustomField}
                    disabled={!newFieldName.trim() || !newFieldValue.trim()}
                    className="px-3 py-2 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Lista de campos */}
                {customFields.length > 0 && (
                  <div className="space-y-2">
                    {customFields.map((field, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-[#1A1A1A] px-3 py-2 rounded-lg"
                      >
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-cyan-400 font-medium">{field.name}:</span>
                          <span className="text-gray-300">{field.value}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveCustomField(i)}
                          className="text-gray-500 hover:text-red-400 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-white/10 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || loading}
            className="flex-1 px-4 py-3 bg-[#00FF99] text-black rounded-xl font-medium hover:bg-[#00E88C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="animate-spin" size={18} />}
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function AutomationsPage() {
  const router = useRouter()

  // Auth & subscription
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState(null)
  const [subscriptionChecked, setSubscriptionChecked] = useState(false)

  // Data
  const [connections, setConnections] = useState([])
  const [selectedConnection, setSelectedConnection] = useState(null)
  const [automations, setAutomations] = useState([])
  const [sequences, setSequences] = useState([])
  const [templates, setTemplates] = useState([])
  const [folders, setFolders] = useState([])

  // UI
  const [activeTab, setActiveTab] = useState('keywords')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showSequenceModal, setShowSequenceModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [editingAutomation, setEditingAutomation] = useState(null)

  // Load connections on mount
  useEffect(() => {
    loadConnections()
  }, [])

  // Load data when connection changes
  useEffect(() => {
    if (selectedConnection) {
      loadAutomations()
      loadSequences()
      loadTemplates()
    }
  }, [selectedConnection])

  const loadConnections = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/whatsapp/connections')
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setConnections(data.connections || [])

      if (data.connections?.length > 0) {
        // Check localStorage for saved connection
        const savedId = localStorage.getItem('activeConnectionId')
        const savedConn = savedId && data.connections.find(c => c.id === savedId)
        const selected = savedConn || data.connections.find(c => c.is_connected) || data.connections[0]
        setSelectedConnection(selected.id)
      }

      await loadSubscription(user.id)
    } catch (error) {
      console.error('Erro ao carregar conexões:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSubscription = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!error && data) {
        const isActive = ['active', 'trial', 'trialing'].includes(data.status) || data.stripe_subscription_id === 'super_account_bypass'
        const isExpired = data.trial_end_date && new Date() > new Date(data.trial_end_date)
        if (isActive && !isExpired) {
          setSubscription(data)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar subscription:', error)
    } finally {
      setSubscriptionChecked(true)
    }
  }

  const loadAutomations = async () => {
    try {
      const params = new URLSearchParams()
      params.set('connectionId', selectedConnection)
      if (selectedFolder) params.set('folderId', selectedFolder)
      if (searchTerm) params.set('search', searchTerm)

      const response = await fetch(`/api/automations?${params}`)
      const data = await response.json()

      if (response.ok) {
        setAutomations(data.automations || [])
        setFolders(data.folders || [])
      }
    } catch (error) {
      console.error('Erro ao carregar automações:', error)
    }
  }

  const loadSequences = async () => {
    try {
      const response = await fetch(`/api/automations/sequences?connectionId=${selectedConnection}`)
      const data = await response.json()
      if (response.ok) {
        setSequences(data.sequences || [])
      }
    } catch (error) {
      console.error('Erro ao carregar sequências:', error)
    }
  }

  const loadTemplates = async () => {
    try {
      const response = await fetch(`/api/automations/templates?connectionId=${selectedConnection}`)
      const data = await response.json()
      if (response.ok) {
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    }
  }

  const handleCreateTemplate = async (templateData) => {
    const response = await fetch('/api/automations/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...templateData, connectionId: selectedConnection })
    })
    if (response.ok) {
      await loadTemplates()
      setShowTemplateModal(false)
    } else {
      throw new Error('Erro ao criar template')
    }
  }

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Excluir este template?')) return
    await fetch(`/api/automations/templates/${id}`, { method: 'DELETE' })
    await loadTemplates()
  }

  const handleCreateSequence = async (sequenceData) => {
    const response = await fetch('/api/automations/sequences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...sequenceData, connectionId: selectedConnection })
    })
    if (response.ok) {
      await loadSequences()
      setShowSequenceModal(false)
    } else {
      throw new Error('Erro ao criar sequência')
    }
  }

  const handleConnectionSelect = (id) => {
    setSelectedConnection(id)
    localStorage.setItem('activeConnectionId', id)
  }

  const handleCreateAutomation = async (data) => {
    const response = await fetch('/api/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (response.ok) {
      await loadAutomations()
    } else {
      throw new Error('Erro ao criar')
    }
  }

  const handleToggleAutomation = async (id, isActive) => {
    await fetch(`/api/automations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive })
    })
    await loadAutomations()
  }

  const handleDeleteAutomation = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta automação?')) return
    await fetch(`/api/automations/${id}`, { method: 'DELETE' })
    await loadAutomations()
  }

  const handleEditAutomation = async (data) => {
    const response = await fetch(`/api/automations/${editingAutomation.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (response.ok) {
      await loadAutomations()
      setEditingAutomation(null)
    } else {
      throw new Error('Erro ao atualizar')
    }
  }

  const handleToggleSequence = async (id, isActive) => {
    await fetch(`/api/automations/sequences/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive })
    })
    await loadSequences()
  }

  const handleDeleteSequence = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta sequência?')) return
    await fetch(`/api/automations/sequences/${id}`, { method: 'DELETE' })
    await loadSequences()
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FF99]" />
      </div>
    )
  }

  // No subscription
  if (subscriptionChecked && !subscription) {
    return <NoSubscription />
  }

  // No connections
  if (connections.length === 0) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center max-w-md">
          <Bot className="text-gray-600 mx-auto mb-4" size={64} />
          <h2 className="text-2xl font-bold text-white mb-2">
            Nenhuma conexão WhatsApp
          </h2>
          <p className="text-gray-400 mb-6">
            Conecte uma instância do WhatsApp para criar automações.
          </p>
          <a
            href="/dashboard"
            className="inline-block bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-bold px-6 py-3 rounded-full hover:shadow-[0_0_20px_rgba(0,255,153,0.3)] transition-all"
          >
            Ir para Dashboard
          </a>
        </div>
      </div>
    )
  }

  // Filter keyword-based automations
  const keywordAutomations = automations.filter(a => a.type === 'keyword')

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Bot className="text-[#00FF99]" size={28} />
              <h1 className="text-2xl font-bold text-white">Automações</h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-64">
                <ConnectionDropdown
                  connections={connections}
                  selectedConnection={selectedConnection}
                  onSelectConnection={handleConnectionSelect}
                />
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-[#00FF99] text-black px-4 py-2.5 rounded-xl font-medium hover:bg-[#00E88C] transition-colors"
              >
                <Plus size={18} />
                Nova Automação
              </button>
            </div>
          </div>

          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Search and filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Pesquisar automações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1E1E1E] text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF99]/20"
            />
          </div>

          {folders.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedFolder(null)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2
                  ${!selectedFolder ? 'bg-[#00FF99]/10 text-[#00FF99]' : 'text-gray-400 hover:bg-white/5'}`}
              >
                <Folder size={14} /> Todas
              </button>
              {folders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                  className={`px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2
                    ${selectedFolder === folder.id ? 'bg-[#00FF99]/10 text-[#00FF99]' : 'text-gray-400 hover:bg-white/5'}`}
                >
                  <Folder size={14} /> {folder.name}
                </button>
              ))}
              <button className="px-3 py-2 text-gray-400 hover:text-white transition-colors">
                <FolderPlus size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Content based on active tab */}
        {activeTab === 'sequences' ? (
          // Sequences list (for follow-ups)
          <div className="space-y-3">
            {sequences.length === 0 ? (
              <div className="text-center py-16">
                <Clock className="mx-auto text-gray-600 mb-4" size={48} />
                <h3 className="text-lg font-medium text-white mb-2">Nenhuma sequência criada</h3>
                <p className="text-gray-400 mb-4">Crie sequências para enviar mensagens de follow-up automaticamente.</p>
                <button
                  onClick={() => setShowSequenceModal(true)}
                  className="inline-flex items-center gap-2 bg-[#00FF99] text-black px-4 py-2 rounded-xl font-medium hover:bg-[#00E88C] transition-colors"
                >
                  <Plus size={18} /> Nova Sequência
                </button>
              </div>
            ) : (
              sequences.map(seq => (
                <SequenceCard
                  key={seq.id}
                  sequence={seq}
                  onToggle={handleToggleSequence}
                  onEdit={() => { }}
                  onDelete={handleDeleteSequence}
                />
              ))
            )}
          </div>
        ) : activeTab === 'templates' ? (
          // Templates list - Mensagens modelo
          <div className="space-y-3">
            {templates.length === 0 ? (
              <div className="text-center py-16">
                <MessageCircle className="mx-auto text-gray-600 mb-4" size={48} />
                <h3 className="text-lg font-medium text-white mb-2">Nenhum template criado</h3>
                <p className="text-gray-400 mb-4">Crie mensagens modelo para usar nas suas automações e sequências.</p>
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="inline-flex items-center gap-2 bg-[#00FF99] text-black px-4 py-2 rounded-xl font-medium hover:bg-[#00E88C] transition-colors"
                >
                  <Plus size={18} /> Novo Template
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setShowTemplateModal(true)}
                    className="inline-flex items-center gap-2 bg-[#00FF99] text-black px-4 py-2 rounded-xl font-medium hover:bg-[#00E88C] transition-colors"
                  >
                    <Plus size={18} /> Novo Template
                  </button>
                </div>
                {templates.map(template => (
                  <div
                    key={template.id}
                    className="bg-[#1A1A1A] rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-white font-medium mb-1">{template.name}</h3>
                        <p className="text-gray-400 text-sm line-clamp-2">{template.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                            {template.type === 'text' ? 'Texto' : template.type}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        ) : (
          // Keywords list - Automações por palavra-chave
          <div className="space-y-3">
            {keywordAutomations.length === 0 ? (
              <div className="text-center py-16">
                <Zap className="mx-auto text-gray-600 mb-4" size={48} />
                <h3 className="text-lg font-medium text-white mb-2">Nenhuma automação criada</h3>
                <p className="text-gray-400 mb-4">Crie automações para responder mensagens automaticamente.</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 bg-[#00FF99] text-black px-4 py-2 rounded-xl font-medium hover:bg-[#00E88C] transition-colors"
                >
                  <Plus size={18} /> Nova Automação
                </button>
              </div>
            ) : (
              keywordAutomations.map(automation => (
                <AutomationCard
                  key={automation.id}
                  automation={automation}
                  onToggle={handleToggleAutomation}
                  onEdit={(automation) => setEditingAutomation(automation)}
                  onDelete={handleDeleteAutomation}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Create automation modal */}
      <CreateAutomationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateAutomation}
        connectionId={selectedConnection}
      />

      {/* Create template modal */}
      <CreateTemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSave={handleCreateTemplate}
      />

      {/* Create sequence modal */}
      <CreateSequenceModal
        isOpen={showSequenceModal}
        onClose={() => setShowSequenceModal(false)}
        onSave={handleCreateSequence}
        templates={templates}
      />

      {/* Edit modal */}
      <EditAutomationModal
        isOpen={!!editingAutomation}
        onClose={() => setEditingAutomation(null)}
        automation={editingAutomation}
        onSave={handleEditAutomation}
        connectionId={selectedConnection}
      />
    </div>
  )
}
