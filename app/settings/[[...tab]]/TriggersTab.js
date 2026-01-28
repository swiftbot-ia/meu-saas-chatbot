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
    ChevronDown,
    Link,
    Send,
    Settings,
    Check
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
            case 'deal_won': return <Check size={16} className="text-[#00FF99]" />
            case 'deal_lost': return <X size={16} className="text-red-400" />
            case 'custom_field_changed': return <Hash size={16} className="text-cyan-400" />
            default: return <Zap size={16} className="text-gray-400" />
        }
    }

    const getTriggerDescription = () => {
        const config = automation.trigger_config || {}
        switch (automation.trigger_type) {
            case 'contact_created': return 'Quando um contato é criado'
            case 'tag_added': return `Quando tag "${config.tag_name || config.tag_id}" é adicionada`
            case 'funnel_stage_changed':
                return config.target_stage
                    ? `Quando entrar na etapa "${config.target_stage}"`
                    : `Qualquer mudança de etapa no funil`
            case 'deal_won': return 'Quando um negócio é GANHO'
            case 'deal_lost': return 'Quando um negócio é PERDIDO'
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
    const [activeSection, setActiveSection] = useState('trigger')

    // Trigger State
    const [name, setName] = useState('')
    const [triggerType, setTriggerType] = useState('contact_created')
    const [fieldKey, setFieldKey] = useState('')
    const [fieldOperator, setFieldOperator] = useState('equals')
    const [fieldValue, setFieldValue] = useState('')
    const [tagId, setTagId] = useState('')
    const [targetStage, setTargetStage] = useState('')

    // Actions State
    const [webhookUrl, setWebhookUrl] = useState('')
    const [webhookEnabled, setWebhookEnabled] = useState(false)
    const [selectedTagId, setSelectedTagId] = useState('')
    const [tagsToAdd, setTagsToAdd] = useState([])
    const [selectedOriginId, setSelectedOriginId] = useState(null)
    const [customFields, setCustomFields] = useState([]) // {name, value}

    // Available Data
    const [availableTags, setAvailableTags] = useState([])
    const [availableFields, setAvailableFields] = useState([])
    const [availableOrigins, setAvailableOrigins] = useState([])
    const [availableStages, setAvailableStages] = useState([])
    const [loadingData, setLoadingData] = useState(false)

    // UI States
    const [showNewField, setShowNewField] = useState(false)
    const [newFieldName, setNewFieldName] = useState('')
    const [newCustomFieldName, setNewCustomFieldName] = useState('')
    const [newCustomFieldValue, setNewCustomFieldValue] = useState('')

    useEffect(() => {
        if (isOpen) {
            setActiveSection('trigger')
            if (automation) {
                setName(automation.name)
                setTriggerType(automation.trigger_type)

                // Trigger Config
                const conf = automation.trigger_config || {}
                setFieldKey(conf.field_key || '')
                setFieldOperator(conf.operator || 'equals')
                setFieldValue(conf.value || '')
                setTagId(conf.tag_id || '')
                setTargetStage(conf.target_stage || '')

                // Actions Config
                setWebhookUrl(automation.action_webhook_url || '')
                setWebhookEnabled(automation.action_webhook_enabled || false)
                setTagsToAdd(automation.action_add_tags ? automation.action_add_tags.map(id => ({ id })) : [])
                setSelectedOriginId(automation.action_set_origin_id || null)

                const cFields = automation.action_custom_fields || {}
                setCustomFields(Object.entries(cFields).map(([name, value]) => ({ name, value })))
            } else {
                // Reset
                setName('')
                setTriggerType('contact_created')
                setFieldKey('')
                setFieldOperator('equals')
                setFieldValue('')
                setTagId('')
                setTargetStage('')

                setWebhookUrl('')
                setWebhookEnabled(false)
                setTagsToAdd([])
                setSelectedOriginId(null)
                setCustomFields([])
            }
            fetchData()
        }
    }, [isOpen, automation])

    const fetchData = async () => {
        if (!selectedConnection) return
        setLoadingData(true)
        try {
            // Fetch contacts data (tags, origins)
            const contactsRes = await fetch(`/api/contacts?connectionId=${selectedConnection}`)
            const contactsData = await contactsRes.json()

            if (contactsData.tags) {
                setAvailableTags(contactsData.tags)
                // Hydrate tagsToAdd with full objects if we only have IDs (from automation load)
                if (automation?.action_add_tags) {
                    setTagsToAdd(prev => prev.map(t => {
                        const found = contactsData.tags.find(av => av.id === t.id)
                        return found || t
                    }))
                }
            }
            if (contactsData.origins) setAvailableOrigins(contactsData.origins)

            // Fetch global fields
            const fieldsRes = await fetch(`/api/contacts/global-field?connectionId=${selectedConnection}`)
            const fieldsData = await fieldsRes.json()
            if (fieldsData.fields) setAvailableFields(fieldsData.fields)

            // Fetch funnel stages
            const stagesRes = await fetch(`/api/crm/stages?connectionId=${selectedConnection}`)
            const stagesData = await stagesRes.json()
            if (stagesData.stages) setAvailableStages(stagesData.stages)

        } catch (e) {
            console.error(e)
        } finally {
            setLoadingData(false)
        }
    }

    // --- Action Handlers ---

    const handleCreateGlobalField = async () => {
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
                fetchData()
            }
        } catch (e) { console.error(e) }
    }

    const handleAddTag = () => {
        if (selectedTagId) {
            const tag = availableTags.find(t => t.id === selectedTagId)
            if (tag && !tagsToAdd.some(t => t.id === tag.id)) {
                setTagsToAdd([...tagsToAdd, tag])
            }
            setSelectedTagId('')
        }
    }

    const handleRemoveTag = (id) => {
        setTagsToAdd(tagsToAdd.filter(t => t.id !== id))
    }

    const handleAddCustomField = () => {
        if (newCustomFieldName.trim() && newCustomFieldValue.trim()) {
            setCustomFields([...customFields, { name: newCustomFieldName.trim(), value: newCustomFieldValue.trim() }])
            setNewCustomFieldName('')
            setNewCustomFieldValue('')
        }
    }

    const handleRemoveCustomField = (index) => {
        setCustomFields(customFields.filter((_, i) => i !== index))
    }

    const handleSubmit = () => {
        const config = {}
        if (triggerType === 'custom_field_changed') {
            config.field_key = fieldKey
            config.operator = fieldOperator
            config.value = fieldValue
        } else if (triggerType === 'tag_added') {
            config.tag_id = tagId
            const tag = availableTags.find(t => t.id === tagId)
            if (tag) config.tag_name = tag.name
        } else if (triggerType === 'funnel_stage_changed') {
            config.target_stage = targetStage
        }

        const customFieldsObj = customFields.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.value }), {})

        onSave({
            name,
            triggerType,
            triggerConfig: config,
            actionWebhookUrl: webhookUrl,
            actionWebhookEnabled: webhookEnabled,
            actionAddTags: tagsToAdd.map(t => t.id),
            actionSetOriginId: selectedOriginId,
            actionCustomFields: customFieldsObj
        })
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1A1A1A] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-white/10">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
                    <h3 className="text-xl font-semibold text-white">
                        {automation ? 'Editar Gatilho' : 'Novo Gatilho'}
                    </h3>
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
                        onClick={() => setActiveSection('actions')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 border-b-2 ${activeSection === 'actions' ? 'text-[#00FF99] border-[#00FF99]' : 'text-gray-400 border-transparent hover:text-white'}`}
                    >
                        <Tag size={16} /> Ações
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">

                    {/* --- TRIGGER TAB --- */}
                    {activeSection === 'trigger' && (
                        <div className="space-y-6">
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
                                    <option value="funnel_stage_changed">Entrou na Etapa do Funil</option>
                                    <option value="deal_won">Negócio Ganho (Ganhou)</option>
                                    <option value="deal_lost">Negócio Perdido (Perdeu)</option>
                                </select>
                            </div>

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

                            {triggerType === 'custom_field_changed' && (
                                <div className="space-y-4 p-4 bg-[#252525] rounded-xl border border-white/5">
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
                                                    className="flex-1 bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-white text-sm disabled:opacity-50"
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
                                                    className="flex-1 bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                                />
                                                <button onClick={handleCreateGlobalField} className="px-3 py-2 bg-[#00FF99] text-black rounded-lg text-sm font-medium">Criar</button>
                                                <button onClick={() => { setShowNewField(false); setNewFieldName('') }} className="px-3 py-2 bg-white/5 text-white rounded-lg text-sm">Cancelar</button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Operador</label>
                                            <select
                                                value={fieldOperator}
                                                onChange={(e) => setFieldOperator(e.target.value)}
                                                className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
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
                                                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                                    placeholder="Ex: OMR-NT-25"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {triggerType === 'funnel_stage_changed' && (
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Etapa Alvo</label>
                                    <select
                                        value={targetStage}
                                        onChange={(e) => setTargetStage(e.target.value)}
                                        disabled={loadingData}
                                        className="w-full bg-[#252525] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00FF99]/30 disabled:opacity-50"
                                    >
                                        <option value="">Qualquer etapa</option>
                                        {availableStages.map(stage => (
                                            <option key={stage.id} value={stage.stage_key}>
                                                {stage.name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Selecione a etapa do funil que disparará este gatilho.
                                    </p>
                                </div>
                            )}

                            {(triggerType === 'deal_won' || triggerType === 'deal_lost') && (
                                <div className="text-sm text-[#00FF99] italic p-4 bg-[#00FF99]/10 rounded-xl border border-[#00FF99]/20">
                                    Este gatilho dispara automaticamente quando o contato é marcado como {triggerType === 'deal_won' ? 'GANHO' : 'PERDIDO'} no CRM.
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- ACTIONS TAB --- */}
                    {activeSection === 'actions' && (
                        <div className="space-y-6">

                            {/* Tags */}
                            <div className="bg-[#252525] rounded-xl p-5 border border-white/5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                        <Tag className="text-blue-400" size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium">Adicionar Tags</h3>
                                        <p className="text-xs text-gray-400">Tags a adicionar quando o gatilho disparar</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 mb-3">
                                    <div className="relative flex-1">
                                        <select
                                            value={selectedTagId}
                                            onChange={(e) => setSelectedTagId(e.target.value)}
                                            disabled={loadingData}
                                            className="w-full bg-[#1A1A1A] text-white px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50 border border-white/5"
                                        >
                                            <option value="">{loadingData ? 'Carregando...' : 'Selecione uma tag...'}</option>
                                            {availableTags
                                                .filter(tag => !tagsToAdd.some(t => t.id === tag.id))
                                                .map(tag => (
                                                    <option key={tag.id} value={tag.id}>{tag.name}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                    <button
                                        onClick={handleAddTag}
                                        disabled={!selectedTagId}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                                {tagsToAdd.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {tagsToAdd.map((tag) => (
                                            <span
                                                key={tag.id}
                                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                            >
                                                <Tag size={12} />
                                                {tag.name}
                                                <button onClick={() => handleRemoveTag(tag.id)} className="hover:text-white ml-1">
                                                    <X size={14} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Webhook */}
                            <div className="bg-[#252525] rounded-xl p-5 border border-white/5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                            <Link className="text-purple-400" size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium">Enviar para Webhook</h3>
                                            <p className="text-xs text-gray-400">Disparar um POST para URL externa</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setWebhookEnabled(!webhookEnabled)}
                                        className={`p-2 rounded-lg transition-colors ${webhookEnabled ? 'text-purple-400 bg-purple-500/20' : 'text-gray-500 bg-white/5'}`}
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
                                            className="w-full bg-[#1A1A1A] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 border border-white/5"
                                        />
                                        <p className="text-xs text-gray-500 mt-2">Payload inclui dados do contato e do evento.</p>
                                    </div>
                                )}
                            </div>

                            {/* Origin */}
                            <div className="bg-[#252525] rounded-xl p-5 border border-white/5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                                        <Send className="text-orange-400" size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium">Definir Origem</h3>
                                        <p className="text-xs text-gray-400">Atribuir origem ao contato</p>
                                    </div>
                                </div>
                                <select
                                    value={selectedOriginId || ''}
                                    onChange={(e) => setSelectedOriginId(e.target.value || null)}
                                    className="w-full bg-[#1A1A1A] text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 border border-white/5"
                                >
                                    <option value="">Nenhuma origem</option>
                                    {availableOrigins.map(origin => (
                                        <option key={origin.id} value={origin.id}>{origin.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Custom Fields */}
                            <div className="bg-[#252525] rounded-xl p-5 border border-white/5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                                        <Settings className="text-cyan-400" size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium">Campos Personalizados</h3>
                                        <p className="text-xs text-gray-400">Adicionar dados no webhook/contato</p>
                                    </div>
                                </div>

                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={newCustomFieldName}
                                        onChange={(e) => setNewCustomFieldName(e.target.value)}
                                        placeholder="Nome"
                                        className="flex-1 bg-[#1A1A1A] text-white px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 border border-white/5"
                                    />
                                    <input
                                        type="text"
                                        value={newCustomFieldValue}
                                        onChange={(e) => setNewCustomFieldValue(e.target.value)}
                                        placeholder="Valor"
                                        className="flex-1 bg-[#1A1A1A] text-white px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 border border-white/5"
                                    />
                                    <button
                                        onClick={handleAddCustomField}
                                        disabled={!newCustomFieldName.trim() || !newCustomFieldValue.trim()}
                                        className="px-3 py-2 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>

                                {customFields.length > 0 && (
                                    <div className="space-y-2">
                                        {customFields.map((field, i) => (
                                            <div key={i} className="flex items-center justify-between bg-[#1A1A1A] px-3 py-2 rounded-lg border border-white/5">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <span className="text-cyan-400 font-medium">{field.name}:</span>
                                                    <span className="text-gray-300">{field.value}</span>
                                                </div>
                                                <button onClick={() => handleRemoveCustomField(i)} className="text-gray-500 hover:text-red-400">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex gap-3 flex-shrink-0">
                    <button onClick={onClose} className="flex-1 px-4 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !name}
                        className="flex-1 px-4 py-3 bg-[#00FF99] text-black font-bold rounded-xl hover:bg-[#00E88C] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="animate-spin" size={18} />}
                        {automation ? 'Salvar Alterações' : 'Criar Gatilho'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// MAIN TAB COMPONENT
// ============================================================================
export default function TriggersTab({ connections, selectedConnection, showConfirm }) {
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
        if (showConfirm) {
            showConfirm(
                'Excluir Gatilho',
                'Tem certeza que deseja excluir este gatilho? Esta ação não pode ser desfeita.',
                async () => {
                    try {
                        await fetch(`/api/automations/${id}`, { method: 'DELETE' })
                        fetchTriggers()
                    } catch (e) { console.error(e) }
                }
            )
        } else {
            if (!confirm('Tem certeza que deseja excluir este gatilho?')) return
            try {
                await fetch(`/api/automations/${id}`, { method: 'DELETE' })
                fetchTriggers()
            } catch (e) { console.error(e) }
        }
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
