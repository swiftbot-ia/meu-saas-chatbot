'use client'

import { useState, useEffect } from 'react'
import {
    Zap,
    Plus,
    MoreVertical,
    Trash2,
    Edit3,
    ToggleLeft,
    ToggleRight,
    Loader2,
    X,
    Tag,
    Hash,
    List,
    UserPlus,
    ChevronDown
} from 'lucide-react'

// ============================================================================
// TRIGGER CARD
// ============================================================================
const TriggerCard = ({ automation, onToggle, onEdit, onDelete }) => {
    const [showMenu, setShowMenu] = useState(false)

    const getTriggerIcon = () => {
        switch (automation.trigger_type) {
            case 'contact_created': return <UserPlus size={16} className="text-blue-400" />
            case 'tag_added': return <Tag size={16} className="text-purple-400" />
            case 'funnel_stage_changed': return <List size={16} className="text-orange-400" />
            case 'custom_field_changed': return <Hash size={16} className="text-cyan-400" />
            default: return <Zap size={16} className="text-gray-400" />
        }
    }

    const getTriggerDescription = () => {
        const config = automation.trigger_config || {}
        switch (automation.trigger_type) {
            case 'contact_created': return 'Quando um contato é criado'
            case 'tag_added': return `Quando tag "${config.tag_name || config.tag_id}" é adicionada`
            case 'funnel_stage_changed': return `Mudança de etapa no funil`
            case 'custom_field_changed':
                const op = config.operator === 'equals' ? '=' : config.operator === 'contains' ? 'contém' : config.operator
                return `Campo "${config.field_key}" ${op} "${config.value}"`
            default: return 'Gatilho desconhecido'
        }
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
                        <div className="p-1.5 rounded-lg bg-white/5">
                            {getTriggerIcon()}
                        </div>
                        <h3 className="text-white font-medium truncate">{automation.name}</h3>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-400 ml-9">
                        {getTriggerDescription()}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onToggle(automation.id, !automation.is_active)}
                        className={`p-2 rounded-lg transition-colors ${automation.is_active ? 'text-[#00FF99] hover:bg-[#00FF99]/10' : 'text-gray-500 hover:bg-white/5'}`}
                        title={automation.is_active ? 'Desativar' : 'Ativar'}
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
                                <div className="absolute right-0 top-full mt-1 bg-[#252525] border border-white/10 rounded-xl shadow-xl z-50 py-1 min-w-[150px]">
                                    <button
                                        onClick={() => { onEdit(automation); setShowMenu(false) }}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
                                    >
                                        <Edit3 size={14} /> Editar
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
// EDIT TRIGGER MODAL
// ============================================================================
const EditTriggerModal = ({ isOpen, onClose, automation, onSave, loading, selectedConnection }) => {
    const [name, setName] = useState('')
    const [triggerType, setTriggerType] = useState('contact_created')

    // Config specific states
    const [fieldKey, setFieldKey] = useState('')
    const [fieldOperator, setFieldOperator] = useState('equals')
    const [fieldValue, setFieldValue] = useState('')
    const [tagId, setTagId] = useState('')

    // Available data
    const [availableTags, setAvailableTags] = useState([])
    const [availableFields, setAvailableFields] = useState([])
    const [loadingData, setLoadingData] = useState(false)

    // New field creation
    const [showNewField, setShowNewField] = useState(false)
    const [newFieldName, setNewFieldName] = useState('')

    useEffect(() => {
        if (isOpen) {
            if (automation) {
                setName(automation.name)
                setTriggerType(automation.trigger_type)
                // Hydrate local states
                const conf = automation.trigger_config || {}
                setFieldKey(conf.field_key || '')
                setFieldOperator(conf.operator || 'equals')
                setFieldValue(conf.value || '')
                setTagId(conf.tag_id || '')
            } else {
                // New
                setName('')
                setTriggerType('contact_created')
                setFieldKey('')
                setFieldOperator('equals')
                setFieldValue('')
                setTagId('')
            }
            fetchData()
        }
    }, [isOpen, automation])

    const fetchData = async () => {
        setLoadingData(true)
        try {
            if (selectedConnection) {
                // Fetch tags
                const contactsRes = await fetch(`/api/contacts?connectionId=${selectedConnection}`)
                const contactsData = await contactsRes.json()
                if (contactsData.tags) setAvailableTags(contactsData.tags)

                // Fetch global fields
                const fieldsRes = await fetch(`/api/contacts/global-field?connectionId=${selectedConnection}`)
                const fieldsData = await fieldsRes.json()
                if (fieldsData.fields) setAvailableFields(fieldsData.fields)
            }
        } catch (e) { console.error(e) }
        finally { setLoadingData(false) }
    }

    const handleCreateField = async () => {
        if (!newFieldName.trim()) return
        try {
            const res = await fetch('/api/contacts/global-field', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    connectionId: selectedConnection,
                    name: newFieldName.trim(),
                    defaultValue: ''
                })
            })
            if (res.ok) {
                setFieldKey(newFieldName.trim())
                setShowNewField(false)
                setNewFieldName('')
                fetchData() // Refresh fields list
            }
        } catch (e) { console.error(e) }
    }

    const handleSubmit = () => {
        const config = {}
        if (triggerType === 'custom_field_changed') {
            config.field_key = fieldKey
            config.operator = fieldOperator
            config.value = fieldValue
        } else if (triggerType === 'tag_added') {
            config.tag_id = tagId
            // Also store tag name for display purposes
            const tag = availableTags.find(t => t.id === tagId)
            if (tag) config.tag_name = tag.name
        }

        onSave({
            name,
            triggerType,
            triggerConfig: config
        })
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1A1A1A] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-white/10">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-white">
                        {automation ? 'Editar Gatilho' : 'Novo Gatilho'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Nome do Gatilho *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-[#252525] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00FF99]/30"
                            placeholder="Ex: Lead Quente"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Tipo de Evento *</label>
                        <select
                            value={triggerType}
                            onChange={(e) => setTriggerType(e.target.value)}
                            className="w-full bg-[#252525] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00FF99]/30"
                        >
                            <option value="contact_created">Contato Criado</option>
                            <option value="tag_added">Tag Adicionada</option>
                            <option value="custom_field_changed">Campo de Contato Alterado</option>
                            <option value="funnel_stage_changed">Mudança de Etapa (Funil)</option>
                        </select>
                    </div>

                    {/* TAG ADDED CONFIG */}
                    {triggerType === 'tag_added' && (
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Selecione a Tag</label>
                            <select
                                value={tagId}
                                onChange={(e) => setTagId(e.target.value)}
                                disabled={loadingData}
                                className="w-full bg-[#252525] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00FF99]/30 disabled:opacity-50"
                            >
                                <option value="">{loadingData ? 'Carregando...' : 'Selecione uma tag...'}</option>
                                {availableTags.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* CUSTOM FIELD CHANGED CONFIG */}
                    {triggerType === 'custom_field_changed' && (
                        <div className="space-y-3 p-4 bg-[#252525] rounded-lg border border-white/5">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Campo</label>
                                {!showNewField ? (
                                    <div className="flex gap-2">
                                        <select
                                            value={fieldKey}
                                            onChange={(e) => {
                                                if (e.target.value === '__NEW__') {
                                                    setShowNewField(true)
                                                    setFieldKey('')
                                                } else {
                                                    setFieldKey(e.target.value)
                                                }
                                            }}
                                            disabled={loadingData}
                                            className="flex-1 bg-[#1A1A1A] border border-white/10 rounded px-3 py-2 text-white text-sm disabled:opacity-50"
                                        >
                                            <option value="">{loadingData ? 'Carregando...' : 'Selecione um campo...'}</option>
                                            {availableFields.map(f => (
                                                <option key={f.name} value={f.name}>{f.name}</option>
                                            ))}
                                            <option value="__NEW__">+ Criar novo campo...</option>
                                        </select>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newFieldName}
                                            onChange={(e) => setNewFieldName(e.target.value)}
                                            placeholder="Nome do novo campo"
                                            className="flex-1 bg-[#1A1A1A] border border-white/10 rounded px-3 py-2 text-white text-sm"
                                        />
                                        <button
                                            onClick={handleCreateField}
                                            className="px-3 py-2 bg-[#00FF99] text-black rounded text-sm font-medium hover:bg-[#00E88C]"
                                        >
                                            Criar
                                        </button>
                                        <button
                                            onClick={() => { setShowNewField(false); setNewFieldName('') }}
                                            className="px-3 py-2 bg-white/5 text-white rounded text-sm hover:bg-white/10"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Operador</label>
                                    <select
                                        value={fieldOperator}
                                        onChange={(e) => setFieldOperator(e.target.value)}
                                        className="w-full bg-[#1A1A1A] border border-white/10 rounded px-3 py-2 text-white text-sm"
                                    >
                                        <option value="equals">Igual a</option>
                                        <option value="contains">Contém</option>
                                        <option value="starts_with">Começa com</option>
                                        <option value="not_empty">Não está vazio</option>
                                    </select>
                                </div>
                                {fieldOperator !== 'not_empty' && (
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Valor</label>
                                        <input
                                            type="text"
                                            value={fieldValue}
                                            onChange={(e) => setFieldValue(e.target.value)}
                                            className="w-full bg-[#1A1A1A] border border-white/10 rounded px-3 py-2 text-white text-sm"
                                            placeholder="Ex: OMR-NT-25"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {triggerType === 'funnel_stage_changed' && (
                        <div className="text-sm text-gray-500 italic p-4 bg-[#252525] rounded-lg">
                            Configuração de funil em desenvolvimento.
                        </div>
                    )}

                </div>

                <div className="p-6 border-t border-white/10 flex gap-3">
                    <button onClick={onClose} className="flex-1 px-4 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !name}
                        className="flex-1 px-4 py-3 bg-[#00FF99] text-black font-bold rounded-xl hover:bg-[#00E88C] disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin mx-auto" /> : (automation ? 'Salvar' : 'Criar')}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// MAIN TAB COMPONENT
// ============================================================================
export default function TriggersTab({ connections, selectedConnection }) {
    const [triggers, setTriggers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingTrigger, setEditingTrigger] = useState(null)
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        fetchTriggers()
    }, [selectedConnection])

    const fetchTriggers = async () => {
        if (!selectedConnection) return
        setLoading(true)
        try {
            const res = await fetch(`/api/automations?connectionId=${selectedConnection}`)
            const data = await res.json()
            if (data.automations) {
                // Filter only trigger types
                const triggerList = data.automations.filter(a =>
                    ['contact_created', 'tag_added', 'custom_field_changed', 'funnel_stage_changed'].includes(a.trigger_type)
                )
                setTriggers(triggerList)
            }
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    const handleSave = async (data) => {
        setActionLoading(true)
        try {
            const payload = {
                ...data,
                connectionId: selectedConnection,
                type: 'trigger'
            }

            let url = '/api/automations'
            let method = 'POST'

            if (editingTrigger) {
                url = `/api/automations/${editingTrigger.id}`
                method = 'PUT'
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                setShowModal(false)
                setEditingTrigger(null)
                fetchTriggers()
            }
        } catch (e) { console.error(e) }
        finally { setActionLoading(false) }
    }

    const handleToggle = async (id, isActive) => {
        // Optimistic update
        setTriggers(prev => prev.map(t => t.id === id ? { ...t, is_active: isActive } : t))
        try {
            await fetch(`/api/automations/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive })
            })
        } catch (e) { fetchTriggers() }
    }

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este gatilho?')) return
        try {
            await fetch(`/api/automations/${id}`, { method: 'DELETE' })
            fetchTriggers()
        } catch (e) { console.error(e) }
    }

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-500/10 to-transparent rounded-xl p-5 border border-orange-500/20">
                <div className="flex items-start gap-4">
                    <Zap className="text-orange-400 flex-shrink-0 mt-1" size={24} />
                    <div>
                        <h2 className="text-white font-semibold mb-1">Gatilhos de Eventos</h2>
                        <p className="text-gray-400 text-sm">
                            Configure ações automáticas baseadas em eventos do sistema, como criação de contatos,
                            mudança de tags ou campos personalizados.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center">
                <h3 className="text-white font-medium">Seus Gatilhos</h3>
                <button
                    onClick={() => { setEditingTrigger(null); setShowModal(true) }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#00FF99]/10 text-[#00FF99] rounded-lg text-sm font-medium hover:bg-[#00FF99]/20 transition-colors"
                >
                    <Plus size={16} />
                    Novo Gatilho
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-gray-500" /></div>
            ) : triggers.length === 0 ? (
                <div className="bg-[#1A1A1A] rounded-xl p-8 text-center border border-white/5">
                    <Zap className="mx-auto text-gray-600 mb-3" size={48} />
                    <p className="text-gray-500">Nenhum gatilho configurado.</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {triggers.map(t => (
                        <TriggerCard
                            key={t.id}
                            automation={t}
                            onToggle={handleToggle}
                            onEdit={(item) => { setEditingTrigger(item); setShowModal(true) }}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            <EditTriggerModal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditingTrigger(null) }}
                automation={editingTrigger}
                onSave={handleSave}
                loading={actionLoading}
                selectedConnection={selectedConnection}
            />
        </div>
    )
}
