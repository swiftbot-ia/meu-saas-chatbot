'use client'

import { useEffect, useState } from 'react'
import { useAutomations } from '../layout'
import { supabase } from '@/lib/supabase/client'
import {
    Search,
    Plus,
    MessageCircle,
    MoreVertical,
    Trash2,
    Edit3,
    Copy,
    Loader2,
    X
} from 'lucide-react'

// ============================================================================
// TEMPLATE CARD (from original)
// ============================================================================
const TemplateCard = ({ template, onEdit, onDuplicate, onDelete }) => {
    const [showMenu, setShowMenu] = useState(false)

    return (
        <div className="bg-[#1A1A1A] rounded-xl p-4 border border-white/5 hover:border-white/20 transition-colors">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium mb-1">{template.name}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-2">{template.content}</p>
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                        {template.type === 'text' ? 'Texto' : template.type}
                    </span>
                </div>

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
                                    onClick={() => { onEdit(template); setShowMenu(false) }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
                                >
                                    <Edit3 size={14} /> Editar
                                </button>
                                <button
                                    onClick={() => { onDuplicate(template); setShowMenu(false) }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
                                >
                                    <Copy size={14} /> Duplicar
                                </button>
                                <hr className="border-white/10 my-1" />
                                <button
                                    onClick={() => { onDelete(template.id); setShowMenu(false) }}
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
    )
}

// ============================================================================
// CREATE/EDIT TEMPLATE MODAL (from original)
// ============================================================================
const CreateTemplateModal = ({ isOpen, onClose, onSave, template = null }) => {
    const [name, setName] = useState('')
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)
    const isEditing = !!template

    useEffect(() => {
        if (template) {
            setName(template.name || '')
            setContent(template.content || '')
        } else {
            setName('')
            setContent('')
        }
    }, [template, isOpen])

    const handleSubmit = async () => {
        if (!name.trim() || !content.trim()) return
        setLoading(true)
        try {
            await onSave({
                id: template?.id,
                name: name.trim(),
                content: content.trim()
            })
            setName('')
            setContent('')
        } catch (error) {
            console.error('Erro ao salvar template:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1A1A1A] rounded-2xl w-full max-w-lg">
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-semibold text-white">
                        {isEditing ? 'Editar Template' : 'Novo Template'}
                    </h2>
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
                        {isEditing ? 'Salvar' : 'Criar Template'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// TEMPLATES PAGE
// ============================================================================
export default function TemplatesPage() {
    const context = useAutomations()
    const { selectedConnection, ownerUserId } = context || {}

    const [templates, setTemplates] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Modal states
    const [showModal, setShowModal] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    useEffect(() => {
        if (!selectedConnection) {
            setLoading(false)
            return
        }
        loadTemplates()
    }, [selectedConnection])

    const loadTemplates = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('message_templates')
                .select('*')
                .eq('connection_id', selectedConnection)
                .order('created_at', { ascending: false })

            if (error) throw error
            setTemplates(data || [])
        } catch (error) {
            console.error('Error loading templates:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSaveTemplate = async (templateData) => {
        const { data: { user } } = await supabase.auth.getUser()

        if (templateData.id) {
            // Update
            const { error } = await supabase
                .from('message_templates')
                .update({
                    name: templateData.name,
                    content: templateData.content,
                    updated_at: new Date().toISOString()
                })
                .eq('id', templateData.id)

            if (error) throw error
        } else {
            // Create
            const { error } = await supabase
                .from('message_templates')
                .insert({
                    user_id: user.id,
                    connection_id: selectedConnection,
                    name: templateData.name,
                    content: templateData.content,
                    type: 'text'
                })

            if (error) throw error
        }

        loadTemplates()
        setShowModal(false)
        setEditingTemplate(null)
    }

    const handleDelete = async (templateId) => {
        await supabase.from('message_templates').delete().eq('id', templateId)
        setTemplates(prev => prev.filter(t => t.id !== templateId))
        setDeleteConfirm(null)
    }

    const handleDuplicate = async (template) => {
        const { data: { user } } = await supabase.auth.getUser()

        await supabase.from('message_templates').insert({
            user_id: user.id,
            connection_id: selectedConnection,
            name: `${template.name} (cópia)`,
            content: template.content,
            type: template.type
        })

        loadTemplates()
    }

    const handleEdit = (template) => {
        setEditingTemplate(template)
        setShowModal(true)
    }

    const handleCreate = () => {
        setEditingTemplate(null)
        setShowModal(true)
    }

    const filteredTemplates = templates.filter(t =>
        t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.content?.toLowerCase().includes(searchTerm.toLowerCase())
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
                        placeholder="Pesquisar templates..."
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
                    Novo Template
                </button>
            </div>

            {/* Templates grid */}
            {filteredTemplates.length === 0 ? (
                <div className="text-center py-12">
                    <MessageCircle className="mx-auto text-gray-600 mb-4" size={48} />
                    <h3 className="text-white font-medium mb-2">Nenhum template</h3>
                    <p className="text-gray-500 text-sm mb-4">Crie templates de mensagens para usar em automações.</p>
                    <button
                        onClick={handleCreate}
                        className="inline-flex items-center gap-2 bg-[#00FF99] text-black font-medium px-4 py-2 rounded-xl hover:bg-[#00E88C] transition-colors"
                    >
                        <Plus size={18} />
                        Criar Template
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map(template => (
                        <TemplateCard
                            key={template.id}
                            template={template}
                            onEdit={handleEdit}
                            onDuplicate={handleDuplicate}
                            onDelete={() => setDeleteConfirm(template)}
                        />
                    ))}
                </div>
            )}

            {/* Modal */}
            <CreateTemplateModal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditingTemplate(null) }}
                onSave={handleSaveTemplate}
                template={editingTemplate}
            />

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setDeleteConfirm(null)} />
                    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#111111] rounded-2xl p-6 z-50 w-96">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Trash2 size={20} className="text-red-400" />
                                Excluir Template
                            </h3>
                            <button onClick={() => setDeleteConfirm(null)} className="text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-gray-300 mb-2">
                            Tem certeza que deseja excluir <span className="text-white font-semibold">"{deleteConfirm.name}"</span>?
                        </p>
                        <p className="text-sm text-gray-500 mb-6">Esta ação não pode ser desfeita.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 bg-[#1E1E1E] text-white py-3 rounded-xl hover:bg-[#2A2A2A] transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm.id)}
                                className="flex-1 bg-red-500 text-white py-3 rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <Trash2 size={16} />
                                Excluir
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
