'use client'

import { useEffect, useState } from 'react'
import { useAutomations } from '../layout'
import { supabase } from '@/lib/supabase/client'
import {
    Search,
    Plus,
    Hash,
    MoreVertical,
    Trash2,
    Edit3,
    Copy,
    ToggleLeft,
    ToggleRight,
    Loader2,
    X,
    Folder,
    Zap,
    Send,
    Tag,
    Link
} from 'lucide-react'

// ============================================================================
// AUTOMATION CARD (from original)
// ============================================================================
const AutomationCard = ({ automation, onToggle, onEdit, onDuplicate, onDelete }) => {
    const [showMenu, setShowMenu] = useState(false)

    const keywords = automation.automation_keywords || []
    const keywordsPreview = keywords.slice(0, 3).map(k => k.keyword).join(', ')
    const hasMoreKeywords = keywords.length > 3

    const formatDate = (date) => {
        if (!date) return '-'
        return new Date(date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short'
        })
    }

    return (
        <div className={`
      bg-[#1A1A1A] rounded-xl p-4 border transition-all
      ${automation.is_active ? 'border-[#00FF99]/20' : 'border-white/5'}
      hover:border-white/20
    `}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-medium truncate">{automation.name}</h3>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span className={`w-2 h-2 rounded-full ${automation.is_active ? 'bg-[#00FF99]' : 'bg-gray-500'}`} />
                        {automation.trigger_type === 'message_contains' && 'A mensagem contém'}
                        {automation.trigger_type === 'message_is' && 'Mensagem é'}
                        {automation.trigger_type === 'message_starts_with' && 'Mensagem começa com'}
                        {keywordsPreview && (
                            <span className="text-[#00FF99]">
                                {keywordsPreview}{hasMoreKeywords && '...'}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                    <div className="text-center hidden sm:block">
                        <div className="text-white font-medium">{automation.execution_count || 0}</div>
                        <div className="text-xs text-gray-500">Execuções</div>
                    </div>

                    <button
                        onClick={() => onToggle(automation.id, !automation.is_active)}
                        className={`p-2 rounded-lg transition-colors ${automation.is_active ? 'text-[#00FF99] hover:bg-[#00FF99]/10' : 'text-gray-500 hover:bg-white/5'}`}
                    >
                        {automation.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
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
                                        onClick={() => { onEdit(automation); setShowMenu(false) }}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
                                    >
                                        <Edit3 size={14} /> Editar
                                    </button>
                                    <button
                                        onClick={() => { onDuplicate(automation); setShowMenu(false) }}
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
// AUTOMATION MODAL (Create/Edit combined - from original)
// ============================================================================
const AutomationModal = ({ isOpen, onClose, onSave, automation = null, connectionId }) => {
    const [name, setName] = useState('')
    const [triggerType, setTriggerType] = useState('message_contains')
    const [keywords, setKeywords] = useState([])
    const [keywordInput, setKeywordInput] = useState('')
    const [responseContent, setResponseContent] = useState('')
    const [webhookUrl, setWebhookUrl] = useState('')
    const [webhookEnabled, setWebhookEnabled] = useState(false)
    const [loading, setLoading] = useState(false)
    const [activeSection, setActiveSection] = useState('trigger')

    const isEditing = !!automation

    useEffect(() => {
        if (automation && isOpen) {
            setName(automation.name || '')
            setTriggerType(automation.trigger_type || 'message_contains')
            setKeywords(automation.automation_keywords?.map(k => k.keyword) || [])
            setResponseContent(automation.automation_responses?.[0]?.content || '')
            setWebhookUrl(automation.action_webhook_url || '')
            setWebhookEnabled(automation.action_webhook_enabled || false)
        } else if (!automation && isOpen) {
            setName('')
            setTriggerType('message_contains')
            setKeywords([])
            setResponseContent('')
            setWebhookUrl('')
            setWebhookEnabled(false)
        }
    }, [automation, isOpen])

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
            await onSave({
                id: automation?.id,
                name: name.trim(),
                triggerType,
                keywords: keywords.map(k => ({ keyword: k, matchType: triggerType.replace('message_', '') })),
                responses: responseContent ? [{ type: 'text', content: responseContent }] : [],
                actionWebhookUrl: webhookUrl,
                actionWebhookEnabled: webhookEnabled
            })
            onClose()
        } catch (error) {
            console.error('Erro ao salvar automação:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1A1A1A] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
                    <h2 className="text-xl font-semibold text-white">
                        {isEditing ? 'Editar Automação' : 'Nova Automação'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10 flex-shrink-0">
                    <button
                        onClick={() => setActiveSection('trigger')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 border-b-2 ${activeSection === 'trigger' ? 'text-[#00FF99] border-[#00FF99]' : 'text-gray-400 border-transparent hover:text-white'}`}
                    >
                        <Zap size={16} /> Gatilho
                    </button>
                    <button
                        onClick={() => setActiveSection('response')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 border-b-2 ${activeSection === 'response' ? 'text-[#00FF99] border-[#00FF99]' : 'text-gray-400 border-transparent hover:text-white'}`}
                    >
                        <Send size={16} /> Resposta
                    </button>
                    <button
                        onClick={() => setActiveSection('actions')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 border-b-2 ${activeSection === 'actions' ? 'text-[#00FF99] border-[#00FF99]' : 'text-gray-400 border-transparent hover:text-white'}`}
                    >
                        <Tag size={16} /> Ações
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                    {activeSection === 'trigger' && (
                        <>
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
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Palavras-chave
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

                    {activeSection === 'response' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Resposta automática
                            </label>
                            <textarea
                                value={responseContent}
                                onChange={(e) => setResponseContent(e.target.value)}
                                placeholder="Digite a mensagem que será enviada..."
                                rows={6}
                                className="w-full bg-[#252525] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF99]/30 resize-none"
                            />
                        </div>
                    )}

                    {activeSection === 'actions' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Webhook URL (opcional)
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        value={webhookUrl}
                                        onChange={(e) => setWebhookUrl(e.target.value)}
                                        placeholder="https://..."
                                        className="flex-1 bg-[#252525] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF99]/30"
                                    />
                                    <button
                                        onClick={() => setWebhookEnabled(!webhookEnabled)}
                                        className={`p-2 rounded-lg ${webhookEnabled ? 'text-[#00FF99]' : 'text-gray-500'}`}
                                    >
                                        {webhookEnabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Dispara um webhook quando a automação é executada
                                </p>
                            </div>
                        </div>
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
                        {isEditing ? 'Salvar' : 'Criar Automação'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// KEYWORDS PAGE
// ============================================================================
export default function KeywordsPage() {
    const context = useAutomations()
    const { selectedConnection, ownerUserId } = context || {}

    const [automations, setAutomations] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Modal states
    const [showModal, setShowModal] = useState(false)
    const [editingAutomation, setEditingAutomation] = useState(null)

    useEffect(() => {
        if (!selectedConnection) {
            setLoading(false)
            return
        }
        loadAutomations()
    }, [selectedConnection])

    const loadAutomations = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('automations')
                .select(`*, automation_keywords(*), automation_responses(*)`)
                .eq('connection_id', selectedConnection)
                .eq('type', 'keyword')
                .order('created_at', { ascending: false })

            if (error) throw error
            setAutomations(data || [])
        } catch (error) {
            console.error('Error loading automations:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSaveAutomation = async (data) => {
        const { data: { user } } = await supabase.auth.getUser()

        if (data.id) {
            // Update automation
            const { error: autoError } = await supabase
                .from('automations')
                .update({
                    name: data.name,
                    trigger_type: data.triggerType,
                    action_webhook_url: data.actionWebhookUrl || null,
                    action_webhook_enabled: data.actionWebhookEnabled || false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', data.id)

            if (autoError) throw autoError

            // Delete old keywords
            await supabase.from('automation_keywords').delete().eq('automation_id', data.id)

            // Insert new keywords
            if (data.keywords?.length) {
                const keywordsToInsert = data.keywords.map(k => ({
                    automation_id: data.id,
                    keyword: k.keyword,
                    match_type: k.matchType || 'contains'
                }))
                await supabase.from('automation_keywords').insert(keywordsToInsert)
            }

            // Delete old responses
            await supabase.from('automation_responses').delete().eq('automation_id', data.id)

            // Insert new responses
            if (data.responses?.length) {
                const responsesToInsert = data.responses.map((r, i) => ({
                    automation_id: data.id,
                    response_type: r.type,
                    content: r.content,
                    order_index: i
                }))
                await supabase.from('automation_responses').insert(responsesToInsert)
            }
        } else {
            // Create automation
            const { data: newAutomation, error: autoError } = await supabase
                .from('automations')
                .insert({
                    user_id: user.id,
                    connection_id: selectedConnection,
                    name: data.name,
                    type: 'keyword',
                    trigger_type: data.triggerType,
                    action_webhook_url: data.actionWebhookUrl || null,
                    action_webhook_enabled: data.actionWebhookEnabled || false,
                    is_active: true
                })
                .select()
                .single()

            if (autoError) throw autoError

            // Insert keywords
            if (data.keywords?.length) {
                const keywordsToInsert = data.keywords.map(k => ({
                    automation_id: newAutomation.id,
                    keyword: k.keyword,
                    match_type: k.matchType || 'contains'
                }))
                await supabase.from('automation_keywords').insert(keywordsToInsert)
            }

            // Insert responses
            if (data.responses?.length) {
                const responsesToInsert = data.responses.map((r, i) => ({
                    automation_id: newAutomation.id,
                    response_type: r.type,
                    content: r.content,
                    order_index: i
                }))
                await supabase.from('automation_responses').insert(responsesToInsert)
            }
        }

        loadAutomations()
        setShowModal(false)
        setEditingAutomation(null)
    }

    const handleToggle = async (automationId, newStatus) => {
        await supabase
            .from('automations')
            .update({ is_active: newStatus })
            .eq('id', automationId)

        setAutomations(prev => prev.map(a =>
            a.id === automationId ? { ...a, is_active: newStatus } : a
        ))
    }

    const handleDelete = async (automationId) => {
        if (!confirm('Excluir esta automação?')) return

        await supabase.from('automations').delete().eq('id', automationId)
        setAutomations(prev => prev.filter(a => a.id !== automationId))
    }

    const handleDuplicate = async (automation) => {
        const { data: { user } } = await supabase.auth.getUser()

        const { data: newAutomation } = await supabase
            .from('automations')
            .insert({
                user_id: user.id,
                connection_id: selectedConnection,
                name: `${automation.name} (cópia)`,
                type: 'keyword',
                trigger_type: automation.trigger_type,
                is_active: false
            })
            .select()
            .single()

        if (newAutomation && automation.automation_keywords?.length) {
            const keywordsToInsert = automation.automation_keywords.map(k => ({
                automation_id: newAutomation.id,
                keyword: k.keyword,
                match_type: k.match_type
            }))
            await supabase.from('automation_keywords').insert(keywordsToInsert)
        }

        loadAutomations()
    }

    const handleEdit = (automation) => {
        setEditingAutomation(automation)
        setShowModal(true)
    }

    const handleCreate = () => {
        setEditingAutomation(null)
        setShowModal(true)
    }

    const filteredAutomations = automations.filter(a =>
        a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.automation_keywords?.some(k => k.keyword?.toLowerCase().includes(searchTerm.toLowerCase()))
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
                        placeholder="Pesquisar por palavra-chave..."
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
                    Nova Automação
                </button>
            </div>

            {/* Automations list */}
            {filteredAutomations.length === 0 ? (
                <div className="text-center py-12">
                    <Hash className="mx-auto text-gray-600 mb-4" size={48} />
                    <h3 className="text-white font-medium mb-2">Nenhuma automação</h3>
                    <p className="text-gray-500 text-sm mb-4">Crie automações baseadas em palavras-chave.</p>
                    <button
                        onClick={handleCreate}
                        className="inline-flex items-center gap-2 bg-[#00FF99] text-black font-medium px-4 py-2 rounded-xl hover:bg-[#00E88C] transition-colors"
                    >
                        <Plus size={18} />
                        Criar Automação
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredAutomations.map(automation => (
                        <AutomationCard
                            key={automation.id}
                            automation={automation}
                            onToggle={handleToggle}
                            onEdit={handleEdit}
                            onDuplicate={handleDuplicate}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            {/* Modal */}
            <AutomationModal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditingAutomation(null) }}
                onSave={handleSaveAutomation}
                automation={editingAutomation}
                connectionId={selectedConnection}
            />
        </div>
    )
}
