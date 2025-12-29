'use client'

import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

/**
 * ConnectionDropdown - Componente UNIFICADO para seleção de conexões
 * Usado em: /dashboard, /crm, /contacts, /chat, /automations, /settings, /dashboard/swiftbot-ia
 * 
 * Props:
 * @param {Array} connections - Lista de conexões do banco de dados
 * @param {Object|string} selectedConnection - Conexão selecionada (objeto ou ID)
 * @param {Function} onSelectConnection - Callback quando seleciona conexão (recebe ID)
 * @param {boolean} showDashboardActions - Se true, mostra botões "Adicionar" e "Aumentar Limite"
 * @param {Function} onAddConnection - Handler para adicionar conexão (apenas se showDashboardActions)
 * @param {Function} onIncreaseLimit - Handler para aumentar limite (apenas se showDashboardActions)
 * @param {number} totalSlots - Total de slots disponíveis (para verificar se pode adicionar)
 */
export default function ConnectionDropdown({
    connections = [],
    selectedConnection,
    onSelectConnection,
    showDashboardActions = false,
    onAddConnection,
    onIncreaseLimit,
    totalSlots = 0
}) {
    const [isOpen, setIsOpen] = useState(false)

    // Suporta tanto ID quanto objeto como selectedConnection
    const selectedId = typeof selectedConnection === 'string'
        ? selectedConnection
        : selectedConnection?.id || selectedConnection?.connectionId

    // Encontra a conexão selecionada
    const selected = connections.find(c =>
        c.id === selectedId || c.connectionId === selectedId
    )

    // Nome de exibição - NUNCA usa instance_name técnico
    const getDisplayName = (conn, index) => {
        if (!conn) return 'Selecionar Conexão'
        if (conn.profile_name) return conn.profile_name
        return `Conexão ${index + 1}`
    }

    // Subtexto - telefone ou status
    const getSubtext = (conn) => {
        if (!conn) return `${connections.length} conexões`
        if (conn.phone_number) return `+${conn.phone_number}`
        return 'Desconectado'
    }

    // Verifica se está conectado
    const isConnected = (conn) => conn?.is_connected ?? conn?.isConnected ?? !!conn?.phone_number

    // Inicial do avatar
    const getInitial = (conn, index = 0) => {
        if (!conn) return '?'
        if (conn.profile_name) return conn.profile_name.charAt(0).toUpperCase()
        return String(index + 1)
    }

    // Índice da conexão selecionada
    const selectedIndex = connections.findIndex(c => (c.id || c.connectionId) === selectedId)

    // Handler de seleção
    const handleSelect = (conn) => {
        const id = conn.id || conn.connectionId
        onSelectConnection(id)
        localStorage.setItem('activeConnectionId', id)
        setIsOpen(false)
    }

    // Sincroniza com localStorage ao iniciar
    useEffect(() => {
        if (selectedId) {
            localStorage.setItem('activeConnectionId', selectedId)
        }
    }, [selectedId])

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-[#1E1E1E] hover:bg-[#252525] rounded-2xl px-4 py-3 transition-all duration-200"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            {selected?.profile_pic_url ? (
                                <img
                                    src={selected.profile_pic_url}
                                    alt={getDisplayName(selected, selectedIndex)}
                                    className="w-10 h-10 rounded-full object-cover bg-[#333333]"
                                    onError={(e) => {
                                        e.target.style.display = 'none'
                                        e.target.nextSibling.style.display = 'flex'
                                    }}
                                />
                            ) : null}
                            <div
                                className={`w-10 h-10 rounded-full bg-[#00A884] flex items-center justify-center text-white font-semibold ${selected?.profile_pic_url ? 'hidden' : 'flex'}`}
                                style={{ display: selected?.profile_pic_url ? 'none' : 'flex' }}
                            >
                                {getInitial(selected, selectedIndex)}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 text-left">
                            <div className="text-white text-sm font-medium truncate">
                                {getDisplayName(selected, selectedIndex)}
                            </div>
                            <div className="text-[13px] text-[#8696A0] truncate">
                                {getSubtext(selected)}
                            </div>
                        </div>
                    </div>

                    <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`}
                    />
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <>
                    {/* Overlay */}
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

                    {/* Menu */}
                    <div className="absolute top-full left-0 right-0 mt-2 backdrop-blur-md bg-[#111111]/95 border border-white/10 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
                        {connections.length === 0 ? (
                            <div className="p-8 text-center text-[#B0B0B0] text-sm">
                                Nenhuma conexão encontrada
                            </div>
                        ) : (
                            connections.map((conn, index) => {
                                const connId = conn.id || conn.connectionId
                                const isSelected = connId === selectedId

                                return (
                                    <button
                                        key={connId}
                                        type="button"
                                        onClick={() => handleSelect(conn)}
                                        className={`w-full p-3 text-left hover:bg-white/5 transition-all border-b border-white/5 last:border-0 ${isSelected ? 'bg-white/5' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Avatar */}
                                            <div className="flex-shrink-0">
                                                {conn.profile_pic_url ? (
                                                    <img
                                                        src={conn.profile_pic_url}
                                                        alt={getDisplayName(conn, index)}
                                                        className="w-10 h-10 rounded-full object-cover bg-[#333333]"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none'
                                                            e.target.nextSibling.style.display = 'flex'
                                                        }}
                                                    />
                                                ) : null}
                                                <div
                                                    className={`w-10 h-10 rounded-full bg-[#00A884] flex items-center justify-center text-white font-semibold ${conn.profile_pic_url ? 'hidden' : 'flex'}`}
                                                    style={{ display: conn.profile_pic_url ? 'none' : 'flex' }}
                                                >
                                                    {getInitial(conn, index)}
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-white font-medium text-[15px] truncate">
                                                    {getDisplayName(conn, index)}
                                                </div>
                                                <div className="text-[#8696A0] text-[13px] truncate mt-0.5">
                                                    {conn.phone_number ? `+${conn.phone_number}` : 'Desconectado'}
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="flex-shrink-0">
                                                <div className={`w-2.5 h-2.5 rounded-full ${isConnected(conn) ? 'bg-green-500' : 'bg-red-500'}`} />
                                            </div>
                                        </div>
                                    </button>
                                )
                            })
                        )}

                        {/* Dashboard Actions - Apenas quando showDashboardActions é true */}
                        {showDashboardActions && (
                            <div className="border-t border-white/10 p-2">
                                {connections.length < totalSlots && onAddConnection && (
                                    <button
                                        onClick={() => {
                                            onAddConnection()
                                            setIsOpen(false)
                                        }}
                                        className="w-full bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black py-3 px-4 rounded-lg font-bold hover:shadow-lg transition-all duration-300 mb-2"
                                    >
                                        + Adicionar Nova Conexão
                                    </button>
                                )}
                                {onIncreaseLimit && (
                                    <button
                                        onClick={() => {
                                            onIncreaseLimit()
                                            setIsOpen(false)
                                        }}
                                        className="w-full bg-[#222222] hover:bg-[#333333] text-[#B0B0B0] py-3 px-4 rounded-lg transition-all duration-300"
                                    >
                                        Aumentar Limite
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
