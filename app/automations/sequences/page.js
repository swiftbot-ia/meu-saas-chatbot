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
    Link as LinkIcon,
    Send
} from 'lucide-react'

// ============================================================================
// SEQUENCE CARD
// ============================================================================
const SequenceCard = ({ sequence, onToggle, onEdit, onDuplicate, onDelete }) => {
    const [showMenu, setShowMenu] = useState(false)

    const stepsCount = sequence.automation_sequence_steps?.length || 0
    // Use subscribers_count from sequence record (subscriptions are in chat DB)
    const subscribersCount = sequence.subscribers_count || 0

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
                <div className="text-gray-400">
                    <span className="text-white font-medium">{subscribersCount}</span> Assinantes
                </div>
                <div className="text-gray-400">
                    <span className="text-white font-medium">{stepsCount}</span> Mensagens
                </div>
                <div className="text-gray-400">
                    <span className="text-white font-medium">0.0%</span> Taxa Abertura
                </div>
                <div className="text-gray-400">
                    <span className="text-white font-medium">0.0%</span> CTR
                </div>
            </div>

            {/* Trigger badge */}
            <div className="mt-3 flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${sequence.trigger_type === 'manual' ? 'bg-blue-500/10 text-blue-400' :
                    sequence.trigger_type === 'new_contact' ? 'bg-green-500/10 text-green-400' :
                        sequence.trigger_type === 'tag' ? 'bg-purple-500/10 text-purple-400' :
                            sequence.trigger_type === 'origin' ? 'bg-orange-500/10 text-orange-400' :
                                'bg-gray-500/10 text-gray-400'
                    }`}>
                    {sequence.trigger_type === 'manual' && 'Manual'}
                    {sequence.trigger_type === 'new_contact' && 'Novo Contato'}
                    {sequence.trigger_type === 'tag' && `Tag: ${sequence.trigger_value || '?'}`}
                    {sequence.trigger_type === 'origin' && `Origem: ${sequence.trigger_value || '?'}`}
                    {sequence.trigger_type === 'keyword' && `Keyword: ${sequence.trigger_value || '?'}`}
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

    // Load sequences
    useEffect(() => {
        if (!selectedConnection) {
            console.log('[Sequences] No connection selected')
            setLoading(false)
            return
        }

        const loadSequences = async () => {
            setLoading(true)
            console.log('[Sequences] Loading for connection:', selectedConnection)
            try {
                // Query only from main DB - automation_sequences and automation_sequence_steps
                // Note: automation_sequence_subscriptions is in CHAT DB, not main DB
                const { data, error } = await supabase
                    .from('automation_sequences')
                    .select(`
                        *,
                        automation_sequence_steps(*)
                    `)
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

        loadSequences()
    }, [selectedConnection])

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
                    onClick={() => alert('Modal de criar sequência - implementar')}
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
                    <p className="text-gray-500 text-sm">Crie sua primeira sequência de mensagens automáticas.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredSequences.map(sequence => (
                        <SequenceCard
                            key={sequence.id}
                            sequence={sequence}
                            onToggle={handleToggle}
                            onEdit={(s) => alert('Editar: ' + s.name)}
                            onDuplicate={(s) => alert('Duplicar: ' + s.name)}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
