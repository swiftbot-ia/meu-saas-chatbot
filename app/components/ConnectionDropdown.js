'use client'

import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

/**
 * ConnectionDropdown - Componente unificado para seleção de conexões
 * 
 * Props:
 * @param {Array} connections - Lista de conexões [{id, profile_name, profile_pic_url, is_connected, phone_number, instance_name}]
 * @param {Object|string} selectedConnection - Conexão selecionada (objeto ou ID)
 * @param {Function} onSelectConnection - Callback quando seleciona conexão
 * @param {string} variant - 'compact' | 'full' (default: 'compact')
 * @param {boolean} showLabel - Mostrar label "Conexão" acima (default: false)
 */
export default function ConnectionDropdown({
    connections = [],
    selectedConnection,
    onSelectConnection,
    variant = 'compact',
    showLabel = false
}) {
    const [isOpen, setIsOpen] = useState(false)

    // Suporta tanto ID quanto objeto como selectedConnection
    const selectedId = typeof selectedConnection === 'string'
        ? selectedConnection
        : selectedConnection?.id || selectedConnection?.connectionId

    // Encontra a conexão selecionada (normaliza diferentes formatos)
    const selected = connections.find(c =>
        c.id === selectedId || c.connectionId === selectedId
    )

    // Nome de exibição da conexão - NUNCA usar instance_name técnico
    const getDisplayName = (conn, index) => {
        if (!conn) return 'Selecione uma conexão'
        // Prioridade: profile_name > connectionName (se não for técnico) > Conexão X
        if (conn.profile_name) return conn.profile_name
        // Ignora connectionName se parecer um instance_name técnico (contém underscores e UUID)
        if (conn.connectionName && !conn.connectionName.includes('_')) {
            return conn.connectionName
        }
        return `Conexão ${index + 1}`
    }

    // Subtexto (telefone ou status)
    const getSubtext = (conn) => {
        if (!conn) return `${connections.length} conexões`
        if (conn.phone_number) return `+${conn.phone_number}`
        const isConnected = conn.is_connected ?? conn.isConnected
        return isConnected ? 'Conectado' : 'Desconectado'
    }

    // Status de conexão
    const isConnected = (conn) => conn?.is_connected ?? conn?.isConnected

    // Avatar/Inicial - Usa nome amigável, nunca instance_name
    const getInitial = (conn, index = 0) => {
        if (!conn) return '?'
        const name = conn.profile_name
        if (name) return name.charAt(0).toUpperCase()
        // Se não tem profile_name, usa número
        return String(index + 1)
    }

    // Handler de seleção
    const handleSelect = (conn) => {
        const id = conn.id || conn.connectionId
        onSelectConnection(id)
        setIsOpen(false)
    }

    // Sincronizar com localStorage
    useEffect(() => {
        if (selectedId) {
            localStorage.setItem('activeConnectionId', selectedId)
        }
    }, [selectedId])

    return (
        <div className="relative">
            {showLabel && (
                <label className="block text-sm text-gray-400 mb-2">Conexão</label>
            )}

            <div className="bg-[#1E1E1E] rounded-2xl overflow-hidden">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left outline-none hover:bg-[#252525] transition-colors"
                >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            {selected?.profile_pic_url ? (
                                <img
                                    src={selected.profile_pic_url}
                                    alt={getDisplayName(selected, 0)}
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
                                {getInitial(selected, connections.findIndex(c => (c.id || c.connectionId) === selectedId))}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="text-white text-sm font-medium truncate">
                                {getDisplayName(selected, connections.findIndex(c => (c.id || c.connectionId) === selectedId))}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1.5">
                                {selected && (
                                    <span className={isConnected(selected) ? 'text-[#00FF99]' : 'text-red-400'}>
                                        {isConnected(selected) ? '●' : '○'}
                                    </span>
                                )}
                                <span className="truncate">{getSubtext(selected)}</span>
                            </div>
                        </div>
                    </div>

                    <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`}
                    />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 backdrop-blur-md bg-[#1E1E1E]/95 rounded-2xl shadow-2xl z-50 max-h-[300px] overflow-y-auto border border-white/10">
                        {connections.map((conn, index) => {
                            const connId = conn.id || conn.connectionId
                            const isSelected = connId === selectedId

                            return (
                                <button
                                    key={connId}
                                    type="button"
                                    onClick={() => handleSelect(conn)}
                                    className={`
                    w-full p-3 text-sm text-left transition-all duration-150 border-b border-white/5 last:border-0
                    ${isSelected
                                            ? 'bg-[#00FF99]/10 text-[#00FF99]'
                                            : 'text-gray-300 hover:bg-white/5 hover:text-white'}
                  `}
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
                                            <div className="font-medium truncate">{getDisplayName(conn, index)}</div>
                                            <div className="text-xs flex items-center gap-1.5 mt-0.5">
                                                <span className={isConnected(conn) ? 'text-[#00FF99]' : 'text-red-400'}>
                                                    {isConnected(conn) ? '● Conectado' : '○ Desconectado'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Overlay para fechar */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    )
}
