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
    Loader2
} from 'lucide-react'

// ============================================================================
// AUTOMATION CARD (Keyword-based)
// ============================================================================
const AutomationCard = ({ automation, onToggle, onEdit, onDuplicate, onDelete }) => {
    const [showMenu, setShowMenu] = useState(false)

    const keywords = automation.automation_keywords || []
    const keywordsPreview = keywords.slice(0, 3).map(k => k.keyword).join(', ')
    const hasMoreKeywords = keywords.length > 3

    const formatDate = (date) => {
        if (!date) return '-'
        return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    }

    return (
        <div className="bg-[#1E1E1E] rounded-xl p-4 hover:bg-[#252525] transition-all border border-transparent hover:border-white/5">
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <h3 className="text-white font-medium mb-1">{automation.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Hash size={12} />
                        <span className="truncate max-w-[200px]">
                            {keywordsPreview}{hasMoreKeywords && ` +${keywords.length - 3}`}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onToggle(automation)}
                        className={`p-2 rounded-lg transition-colors ${automation.is_active
                                ? 'text-[#00FF99]'
                                : 'text-gray-400'
                            }`}
                        title={automation.is_active ? 'Desativar' : 'Ativar'}
                    >
                        {automation.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
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
                                    <button onClick={() => { onEdit(automation); setShowMenu(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5">
                                        <Edit3 size={14} /> Editar
                                    </button>
                                    <button onClick={() => { onDuplicate(automation); setShowMenu(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5">
                                        <Copy size={14} /> Duplicar
                                    </button>
                                    <hr className="my-1 border-white/10" />
                                    <button onClick={() => { onDelete(automation); setShowMenu(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10">
                                        <Trash2 size={14} /> Excluir
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <p className="text-gray-500 text-sm line-clamp-2 mb-3">{automation.response_message}</p>

            <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{automation.trigger_count || 0} disparos</span>
                <span>Atualizado: {formatDate(automation.updated_at)}</span>
            </div>
        </div>
    )
}

// ============================================================================
// KEYWORDS PAGE
// ============================================================================
export default function KeywordsPage() {
    const context = useAutomations()
    const { selectedConnection } = context || {}

    const [automations, setAutomations] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        if (!selectedConnection) return

        const loadAutomations = async () => {
            setLoading(true)
            try {
                const { data, error } = await supabase
                    .from('automations')
                    .select(`*, automation_keywords(*)`)
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

        loadAutomations()
    }, [selectedConnection])

    const handleToggle = async (automation) => {
        const newStatus = !automation.is_active
        await supabase.from('automations').update({ is_active: newStatus }).eq('id', automation.id)
        setAutomations(prev => prev.map(a => a.id === automation.id ? { ...a, is_active: newStatus } : a))
    }

    const handleDelete = async (automation) => {
        if (!confirm(`Excluir automação "${automation.name}"?`)) return
        await supabase.from('automations').delete().eq('id', automation.id)
        setAutomations(prev => prev.filter(a => a.id !== automation.id))
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
                    onClick={() => alert('Modal de criar automação - implementar')}
                    className="flex items-center gap-2 bg-[#00FF99] text-black font-medium px-4 py-3 rounded-xl hover:bg-[#00E88C] transition-colors"
                >
                    <Plus size={18} />
                    Nova Automação
                </button>
            </div>

            {filteredAutomations.length === 0 ? (
                <div className="text-center py-12">
                    <Hash className="mx-auto text-gray-600 mb-4" size={48} />
                    <h3 className="text-white font-medium mb-2">Nenhuma automação</h3>
                    <p className="text-gray-500 text-sm">Crie automações baseadas em palavras-chave.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredAutomations.map(automation => (
                        <AutomationCard
                            key={automation.id}
                            automation={automation}
                            onToggle={handleToggle}
                            onEdit={(a) => alert('Editar: ' + a.name)}
                            onDuplicate={(a) => alert('Duplicar: ' + a.name)}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
