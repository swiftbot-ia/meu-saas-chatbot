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
    Loader2
} from 'lucide-react'

// ============================================================================
// TEMPLATE CARD
// ============================================================================
const TemplateCard = ({ template, onEdit, onDuplicate, onDelete }) => {
    const [showMenu, setShowMenu] = useState(false)

    return (
        <div className="bg-[#1E1E1E] rounded-xl p-4 hover:bg-[#252525] transition-all border border-transparent hover:border-white/5">
            <div className="flex items-start justify-between mb-2">
                <h3 className="text-white font-medium">{template.name}</h3>
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
                                <button onClick={() => { onEdit(template); setShowMenu(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5">
                                    <Edit3 size={14} /> Editar
                                </button>
                                <button onClick={() => { onDuplicate(template); setShowMenu(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5">
                                    <Copy size={14} /> Duplicar
                                </button>
                                <hr className="my-1 border-white/10" />
                                <button onClick={() => { onDelete(template); setShowMenu(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10">
                                    <Trash2 size={14} /> Excluir
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <p className="text-gray-500 text-sm line-clamp-3">{template.content}</p>
            <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-gray-500">
                    {template.content?.length || 0} caracteres
                </span>
            </div>
        </div>
    )
}

// ============================================================================
// TEMPLATES PAGE
// ============================================================================
export default function TemplatesPage() {
    const context = useAutomations()
    const { selectedConnection } = context || {}

    const [templates, setTemplates] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        if (!selectedConnection) return

        const loadTemplates = async () => {
            setLoading(true)
            try {
                const { data, error } = await supabase
                    .from('automation_templates')
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

        loadTemplates()
    }, [selectedConnection])

    const handleDelete = async (template) => {
        if (!confirm(`Excluir template "${template.name}"?`)) return

        await supabase.from('automation_templates').delete().eq('id', template.id)
        setTemplates(prev => prev.filter(t => t.id !== template.id))
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
                    onClick={() => alert('Modal de criar template - implementar')}
                    className="flex items-center gap-2 bg-[#00FF99] text-black font-medium px-4 py-3 rounded-xl hover:bg-[#00E88C] transition-colors"
                >
                    <Plus size={18} />
                    Novo Template
                </button>
            </div>

            {filteredTemplates.length === 0 ? (
                <div className="text-center py-12">
                    <MessageCircle className="mx-auto text-gray-600 mb-4" size={48} />
                    <h3 className="text-white font-medium mb-2">Nenhum template</h3>
                    <p className="text-gray-500 text-sm">Crie templates de mensagens para usar em automações.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map(template => (
                        <TemplateCard
                            key={template.id}
                            template={template}
                            onEdit={(t) => alert('Editar: ' + t.name)}
                            onDuplicate={(t) => alert('Duplicar: ' + t.name)}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
