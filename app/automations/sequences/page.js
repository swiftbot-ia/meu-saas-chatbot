'use client'

import { useEffect, useState } from 'react'
import { useAutomations } from '../layout'
import { supabase } from '@/lib/supabase/client'
import {
    Search,
    Plus,
    Clock,
    MoreVertical,
    Trash2,
    Edit3,
    Copy,
    Play,
    Pause,
    Loader2,
    X,
    ToggleLeft,
    ToggleRight
} from 'lucide-react'

// ============================================================================
// SEQUENCE CARD (from original)
// ============================================================================
const SequenceCard = ({ sequence, onToggle, onEdit, onDuplicate, onDelete }) => {
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
                        <div className="text-white font-medium">{sequence.automation_sequence_steps?.length || 0}</div>
                        <div className="text-xs text-gray-500">Mensagens</div>
                    </div>

                    <button
                        onClick={() => onToggle(sequence.id, !sequence.is_active)}
                        className={`
              p-2 rounded-lg transition-colors
              ${sequence.is_active
                                ? 'text-red-400 hover:bg-red-500/10'
                                : 'text-[#00FF99] hover:bg-[#00FF99]/10'}
            `}
                        title={sequence.is_active ? 'Pausar sequência' : 'Ativar sequência'}
                    >
                        {sequence.is_active ? <Pause size={20} /> : <Play size={20} />}
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
                                    <button
                                        onClick={() => { onDuplicate(sequence); setShowMenu(false) }}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
                                    >
                                        <Copy size={14} /> Duplicar
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
// CREATE SEQUENCE MODAL (from original - with template selection)
// ============================================================================
const CreateSequenceModal = ({ isOpen, onClose, onSave, templates = [], tags = [], origins = [] }) => {
    const [name, setName] = useState('')
    const [triggerType, setTriggerType] = useState('manual')
    const [triggerTagId, setTriggerTagId] = useState('')
    const [triggerOriginId, setTriggerOriginId] = useState('')
    const [triggerKeywords, setTriggerKeywords] = useState('')
    const [steps, setSteps] = useState([])
    const [loading, setLoading] = useState(false)

    const triggerTypes = [
        { value: 'manual', label: 'Manual (inscrever pelo sistema)', icon: '👤' },
        { value: 'new_contact', label: 'Novo contato (primeira mensagem)', icon: '🆕' },
        { value: 'has_tag', label: 'Quando receber tag', icon: '🏷️' },
        { value: 'has_origin', label: 'Quando tiver origem', icon: '📍' },
        { value: 'keyword', label: 'Palavra-chave na mensagem', icon: '🔑' }
    ]

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
                triggerType,
                triggerTagId: triggerType === 'has_tag' ? triggerTagId : null,
                triggerOriginId: triggerType === 'has_origin' ? triggerOriginId : null,
                triggerKeywords: triggerType === 'keyword' ? triggerKeywords.split(',').map(k => k.trim()).filter(Boolean) : [],
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
            setTriggerType('manual')
            setTriggerTagId('')
            setTriggerOriginId('')
            setTriggerKeywords('')
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

                    {/* Trigger Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Quando inscrever na sequência?
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {triggerTypes.map(trigger => (
                                <button
                                    key={trigger.value}
                                    onClick={() => setTriggerType(trigger.value)}
                                    className={`p-3 rounded-xl text-left text-sm transition-colors ${triggerType === trigger.value
                                        ? 'bg-[#00FF99]/20 border border-[#00FF99]/50 text-white'
                                        : 'bg-[#252525] border border-white/5 text-gray-400 hover:border-white/20'
                                        }`}
                                >
                                    <span className="mr-2">{trigger.icon}</span>
                                    {trigger.label}
                                </button>
                            ))}
                        </div>

                        {/* Trigger-specific fields */}
                        {triggerType === 'has_tag' && (
                            <div className="mt-3">
                                <select
                                    value={triggerTagId}
                                    onChange={(e) => setTriggerTagId(e.target.value)}
                                    className="w-full bg-[#252525] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF99]/30"
                                >
                                    <option value="">Selecione uma tag...</option>
                                    {tags.map(tag => (
                                        <option key={tag.id} value={tag.id}>{tag.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {triggerType === 'has_origin' && (
                            <div className="mt-3">
                                <select
                                    value={triggerOriginId}
                                    onChange={(e) => setTriggerOriginId(e.target.value)}
                                    className="w-full bg-[#252525] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF99]/30"
                                >
                                    <option value="">Selecione uma origem...</option>
                                    {origins.map(origin => (
                                        <option key={origin.id} value={origin.id}>{origin.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {triggerType === 'keyword' && (
                            <div className="mt-3">
                                <input
                                    type="text"
                                    value={triggerKeywords}
                                    onChange={(e) => setTriggerKeywords(e.target.value)}
                                    placeholder="Ex: promoção, desconto, quero saber (separadas por vírgula)"
                                    className="w-full bg-[#252525] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF99]/30"
                                />
                            </div>
                        )}
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
                                            <label className="text-xs text-gray-400 mb-1 block">Mensagem (Template)</label>
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
// SEQUENCES PAGE
// ============================================================================
export default function SequencesPage() {
    const context = useAutomations()
    const { selectedConnection, ownerUserId } = context || {}

    const [sequences, setSequences] = useState([])
    const [templates, setTemplates] = useState([])
    const [tags, setTags] = useState([])
    const [origins, setOrigins] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false)

    useEffect(() => {
        if (!selectedConnection) {
            setLoading(false)
            return
        }
        loadData()
    }, [selectedConnection])

    const loadData = async () => {
        setLoading(true)
        try {
            // Load sequences
            const { data: seqData } = await supabase
                .from('automation_sequences')
                .select('*, automation_sequence_steps(*)')
                .eq('connection_id', selectedConnection)
                .order('created_at', { ascending: false })

            setSequences(seqData || [])

            // Load templates for step selection
            const { data: tplData } = await supabase
                .from('message_templates')
                .select('*')
                .eq('connection_id', selectedConnection)

            setTemplates(tplData || [])

            // Load tags and origins
            try {
                const response = await fetch(`/api/contacts?connectionId=${selectedConnection}`)
                const data = await response.json()
                if (response.ok) {
                    setTags(data.tags || [])
                    setOrigins(data.origins || [])
                }
            } catch (e) {
                console.log('Could not load tags/origins')
            }
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSaveSequence = async (data) => {
        const { data: { user } } = await supabase.auth.getUser()

        // Create sequence
        const { data: newSequence, error: seqError } = await supabase
            .from('automation_sequences')
            .insert({
                user_id: user.id,
                connection_id: selectedConnection,
                name: data.name,
                trigger_type: data.triggerType,
                trigger_tag_id: data.triggerTagId,
                trigger_origin_id: data.triggerOriginId,
                trigger_keywords: data.triggerKeywords,
                is_active: true
            })
            .select()
            .single()

        if (seqError) throw seqError

        // Create steps
        if (data.steps?.length) {
            const stepsToInsert = data.steps.map((s, i) => ({
                sequence_id: newSequence.id,
                template_id: s.templateId,
                delay_value: s.delayValue,
                delay_unit: s.delayUnit,
                time_window_start: s.timeWindowStart,
                time_window_end: s.timeWindowEnd,
                allowed_days: s.allowedDays,
                is_active: s.isActive,
                order_index: i
            }))
            await supabase.from('automation_sequence_steps').insert(stepsToInsert)
        }

        loadData()
        setShowCreateModal(false)
    }

    const handleToggle = async (sequenceId, newStatus) => {
        await supabase
            .from('automation_sequences')
            .update({ is_active: newStatus })
            .eq('id', sequenceId)

        setSequences(prev => prev.map(s =>
            s.id === sequenceId ? { ...s, is_active: newStatus } : s
        ))
    }

    const handleDelete = async (sequenceId) => {
        if (!confirm('Excluir esta sequência?')) return

        await supabase.from('automation_sequences').delete().eq('id', sequenceId)
        setSequences(prev => prev.filter(s => s.id !== sequenceId))
    }

    const handleDuplicate = async (sequence) => {
        const { data: { user } } = await supabase.auth.getUser()

        const { data: newSequence } = await supabase
            .from('automation_sequences')
            .insert({
                user_id: user.id,
                connection_id: selectedConnection,
                name: `${sequence.name} (cópia)`,
                trigger_type: sequence.trigger_type,
                is_active: false
            })
            .select()
            .single()

        if (newSequence && sequence.automation_sequence_steps?.length) {
            const stepsToInsert = sequence.automation_sequence_steps.map((s, i) => ({
                sequence_id: newSequence.id,
                template_id: s.template_id,
                delay_value: s.delay_value,
                delay_unit: s.delay_unit,
                time_window_start: s.time_window_start,
                time_window_end: s.time_window_end,
                allowed_days: s.allowed_days,
                is_active: s.is_active,
                order_index: i
            }))
            await supabase.from('automation_sequence_steps').insert(stepsToInsert)
        }

        loadData()
    }

    const handleEdit = (sequence) => {
        // TODO: Implementar modal de edição
        alert('Editar: ' + sequence.name + ' - Modal de edição em desenvolvimento')
    }

    const filteredSequences = sequences.filter(s =>
        s.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-[#00FF99]" size={32} />
            </div>
        )
    }

    return (
        <div>
            {/* Search and actions */}
            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar sequências..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#1E1E1E] text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF99]/20"
                    />
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-[#00FF99] text-black font-medium px-4 py-3 rounded-xl hover:bg-[#00E88C] transition-colors"
                >
                    <Plus size={18} />
                    Nova Sequência
                </button>
            </div>

            {/* Sequences list */}
            {filteredSequences.length === 0 ? (
                <div className="text-center py-12">
                    <Clock className="mx-auto text-gray-600 mb-4" size={48} />
                    <h3 className="text-white font-medium mb-2">Nenhuma sequência</h3>
                    <p className="text-gray-500 text-sm mb-4">Crie sua primeira sequência de mensagens automáticas.</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 bg-[#00FF99] text-black font-medium px-4 py-2 rounded-xl hover:bg-[#00E88C] transition-colors"
                    >
                        <Plus size={18} />
                        Criar Sequência
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredSequences.map(sequence => (
                        <SequenceCard
                            key={sequence.id}
                            sequence={sequence}
                            onToggle={handleToggle}
                            onEdit={handleEdit}
                            onDuplicate={handleDuplicate}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            {/* Create Modal */}
            <CreateSequenceModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSave={handleSaveSequence}
                templates={templates}
                tags={tags}
                origins={origins}
            />
        </div>
    )
}
