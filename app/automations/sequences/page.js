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
    Tag,
    Users,
    MessageSquare
} from 'lucide-react'

// ============================================================================
// CREATE/EDIT SEQUENCE MODAL
// ============================================================================
const SequenceModal = ({ isOpen, onClose, onSave, sequence = null, connectionId }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        trigger_type: 'manual',
        trigger_value: '',
        is_active: true
    })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (sequence) {
            setFormData({
                name: sequence.name || '',
                description: sequence.description || '',
                trigger_type: sequence.trigger_type || 'manual',
                trigger_value: sequence.trigger_value || '',
                is_active: sequence.is_active !== false
            })
        } else {
            setFormData({
                name: '',
                description: '',
                trigger_type: 'manual',
                trigger_value: '',
                is_active: true
            })
        }
    }, [sequence, isOpen])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.name.trim()) return

        setSaving(true)
        try {
            const payload = {
                name: formData.name.trim(),
                description: formData.description.trim() || null,
                trigger_type: formData.trigger_type,
                is_active: formData.is_active,
                connection_id: connectionId
            }

            if (sequence) {
                // Update
                const { error } = await supabase
                    .from('automation_sequences')
                    .update(payload)
                    .eq('id', sequence.id)
                if (error) throw error
            } else {
                // Create - need user_id
                const { data: { user } } = await supabase.auth.getUser()
                payload.user_id = user.id

                const { error } = await supabase
                    .from('automation_sequences')
                    .insert(payload)
                if (error) throw error
            }

            onSave()
            onClose()
        } catch (error) {
            console.error('Error saving sequence:', error)
            alert('Erro ao salvar: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-[#1E1E1E] rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">
                        {sequence ? 'Editar Sequência' : 'Nova Sequência'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Nome da Sequência *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: Follow-up Pós-Venda"
                            className="w-full bg-[#2A2A2A] text-white px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-[#00FF99]/50"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Descrição (opcional)
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Descreva o objetivo desta sequência..."
                            rows={3}
                            className="w-full bg-[#2A2A2A] text-white px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-[#00FF99]/50 resize-none"
                        />
                    </div>

                    {/* Trigger Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Gatilho de Ativação
                        </label>
                        <select
                            value={formData.trigger_type}
                            onChange={(e) => setFormData({ ...formData, trigger_type: e.target.value })}
                            className="w-full bg-[#2A2A2A] text-white px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-[#00FF99]/50"
                        >
                            <option value="manual">Manual (adicionar contatos manualmente)</option>
                            <option value="new_contact">Novo Contato</option>
                            <option value="has_tag">Quando receber Tag</option>
                            <option value="has_origin">Por Origem do Contato</option>
                            <option value="keyword">Por Palavra-chave</option>
                        </select>
                    </div>

                    {/* Active toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white font-medium">Ativar imediatamente</p>
                            <p className="text-gray-500 text-sm">A sequência começará a funcionar após salvar</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                            className={`w-12 h-6 rounded-full transition-colors ${formData.is_active ? 'bg-[#00FF99]' : 'bg-gray-600'}`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-0.5'}`} />
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-[#2A2A2A] text-white rounded-xl hover:bg-[#333] transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !formData.name.trim()}
                            className="flex-1 px-4 py-3 bg-[#00FF99] text-black font-medium rounded-xl hover:bg-[#00E88C] transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Salvando...' : (sequence ? 'Salvar' : 'Criar Sequência')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ============================================================================
// SEQUENCE CARD
// ============================================================================
const SequenceCard = ({ sequence, onToggle, onEdit, onDuplicate, onDelete }) => {
    const [showMenu, setShowMenu] = useState(false)

    const stepsCount = sequence.automation_sequence_steps?.length || 0
    const subscribersCount = sequence.subscribers_count || 0

    const getTriggerLabel = () => {
        switch (sequence.trigger_type) {
            case 'manual': return 'Manual'
            case 'new_contact': return 'Novo Contato'
            case 'has_tag': return `Tag: ${sequence.trigger_value || '?'}`
            case 'has_origin': return `Origem: ${sequence.trigger_value || '?'}`
            case 'keyword': return `Keyword: ${sequence.trigger_value || '?'}`
            default: return 'Manual'
        }
    }

    const getTriggerColor = () => {
        switch (sequence.trigger_type) {
            case 'manual': return 'bg-blue-500/10 text-blue-400'
            case 'new_contact': return 'bg-green-500/10 text-green-400'
            case 'has_tag': return 'bg-purple-500/10 text-purple-400'
            case 'has_origin': return 'bg-orange-500/10 text-orange-400'
            case 'keyword': return 'bg-yellow-500/10 text-yellow-400'
            default: return 'bg-gray-500/10 text-gray-400'
        }
    }

    return (
        <div className="bg-[#1E1E1E] rounded-xl p-4 hover:bg-[#252525] transition-all border border-transparent hover:border-white/5">
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <h3 className="text-white font-medium mb-1">{sequence.name}</h3>
                    {sequence.description && (
                        <p className="text-gray-500 text-sm line-clamp-2">{sequence.description}</p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onToggle(sequence)}
                        className={`p-2 rounded-lg transition-colors ${sequence.is_active
                            ? 'bg-[#00FF99]/10 text-[#00FF99]'
                            : 'bg-gray-700/50 text-gray-400'
                            }`}
                        title={sequence.is_active ? 'Pausar' : 'Ativar'}
                    >
                        {sequence.is_active ? <Pause size={16} /> : <Play size={16} />}
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
                                <div className="absolute right-0 top-full mt-1 bg-[#2A2A2A] rounded-lg shadow-xl z-50 py-1 min-w-[140px] border border-white/10">
                                    <button onClick={() => { onEdit(sequence); setShowMenu(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5">
                                        <Edit3 size={14} /> Editar
                                    </button>
                                    <button onClick={() => { onDuplicate(sequence); setShowMenu(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5">
                                        <Copy size={14} /> Duplicar
                                    </button>
                                    <hr className="my-1 border-white/10" />
                                    <button onClick={() => { onDelete(sequence); setShowMenu(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10">
                                        <Trash2 size={14} /> Excluir
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-1.5 text-gray-400">
                    <Users size={14} />
                    <span className="text-white font-medium">{subscribersCount}</span> Assinantes
                </div>
                <div className="flex items-center gap-1.5 text-gray-400">
                    <MessageSquare size={14} />
                    <span className="text-white font-medium">{stepsCount}</span> Mensagens
                </div>
            </div>

            {/* Trigger badge */}
            <div className="mt-3">
                <span className={`text-xs px-2 py-1 rounded-full ${getTriggerColor()}`}>
                    {getTriggerLabel()}
                </span>
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
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Modal states
    const [showModal, setShowModal] = useState(false)
    const [editingSequence, setEditingSequence] = useState(null)

    // Load sequences
    useEffect(() => {
        if (!selectedConnection) {
            console.log('[Sequences] No connection selected')
            setLoading(false)
            return
        }

        loadSequences()
    }, [selectedConnection])

    const loadSequences = async () => {
        setLoading(true)
        console.log('[Sequences] Loading for connection:', selectedConnection)
        try {
            const { data, error } = await supabase
                .from('automation_sequences')
                .select(`*, automation_sequence_steps(*)`)
                .eq('connection_id', selectedConnection)
                .order('created_at', { ascending: false })

            console.log('[Sequences] Query result:', { data, error, count: data?.length })

            if (error) {
                console.error('[Sequences] Query error:', error)
                throw error
            }
            setSequences(data || [])
        } catch (error) {
            console.error('[Sequences] Error loading sequences:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleToggle = async (sequence) => {
        const newStatus = !sequence.is_active
        await supabase
            .from('automation_sequences')
            .update({ is_active: newStatus })
            .eq('id', sequence.id)

        setSequences(prev => prev.map(s =>
            s.id === sequence.id ? { ...s, is_active: newStatus } : s
        ))
    }

    const handleDelete = async (sequence) => {
        if (!confirm(`Excluir sequência "${sequence.name}"?`)) return

        await supabase
            .from('automation_sequences')
            .delete()
            .eq('id', sequence.id)

        setSequences(prev => prev.filter(s => s.id !== sequence.id))
    }

    const handleDuplicate = async (sequence) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            const { error } = await supabase
                .from('automation_sequences')
                .insert({
                    user_id: user.id,
                    connection_id: selectedConnection,
                    name: `${sequence.name} (cópia)`,
                    description: sequence.description,
                    trigger_type: sequence.trigger_type,
                    is_active: false
                })

            if (error) throw error
            loadSequences()
        } catch (error) {
            console.error('Error duplicating:', error)
            alert('Erro ao duplicar: ' + error.message)
        }
    }

    const handleEdit = (sequence) => {
        setEditingSequence(sequence)
        setShowModal(true)
    }

    const handleCreate = () => {
        setEditingSequence(null)
        setShowModal(true)
    }

    // Filter sequences
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
                    onClick={handleCreate}
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
                        onClick={handleCreate}
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

            {/* Modal */}
            <SequenceModal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditingSequence(null) }}
                onSave={loadSequences}
                sequence={editingSequence}
                connectionId={selectedConnection}
            />
        </div>
    )
}
