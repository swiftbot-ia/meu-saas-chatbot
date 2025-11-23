'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

/**
 * InstanceCard Component
 *
 * Exibe informações de uma instância WhatsApp em formato de card
 *
 * @param {Object} props
 * @param {Object} props.instance - Dados da instância
 * @param {string} props.instance.id - ID da instância
 * @param {string} props.instance.instance_name - Nome da instância
 * @param {string} props.instance.profile_name - Nome do perfil WhatsApp
 * @param {string} props.instance.profile_pic_url - URL da foto de perfil
 * @param {string} props.instance.phone_number - Número de telefone
 * @param {string} props.instance.status - Status da conexão (open, connected, disconnected)
 * @param {boolean} props.instance.is_connected - Se está conectado
 * @param {string} props.instance.last_connected_at - Data da última conexão
 */
export default function InstanceCard({ instance }) {
  // Determinar se está conectado
  const isConnected = instance.is_connected ||
    instance.status === 'open' ||
    instance.status === 'connected'

  // Formatar última conexão
  const formatLastConnected = (dateString) => {
    if (!dateString) return 'Nunca conectado'

    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Agora mesmo'
    if (minutes < 60) return `${minutes}m atrás`
    if (hours < 24) return `${hours}h atrás`
    if (days < 7) return `${days}d atrás`

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <Link href={`/dashboard/instances/${instance.id}`}>
      <div
        className="
          bg-[#1F1F1F] rounded-xl p-6
          hover:shadow-xl hover:shadow-[#00FF99]/10
          transition-all duration-300
          border border-transparent hover:border-[#00FF99]/20
          cursor-pointer
          group
        "
      >
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {instance.profile_pic_url ? (
              <img
                src={instance.profile_pic_url}
                alt={instance.profile_name || instance.instance_name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00FF99] to-[#00E88C] flex items-center justify-center">
                <span className="text-3xl">📱</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className="text-white font-bold text-lg mb-1 truncate">
              {instance.profile_name || instance.instance_name}
            </h3>

            {/* Status badge */}
            <div className="flex items-center gap-2 mb-2">
              {isConnected ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                  ✅ Conectado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                  ❌ Desconectado
                </span>
              )}
            </div>

            {/* Phone number */}
            {instance.phone_number && (
              <p className="text-[#B0B0B0] text-sm mb-1">
                📞 {instance.phone_number}
              </p>
            )}

            {/* Last connected */}
            <p className="text-gray-500 text-xs">
              Última conexão: {formatLastConnected(instance.last_connected_at)}
            </p>
          </div>

          {/* Arrow icon */}
          <div className="flex-shrink-0">
            <ChevronRight
              size={24}
              className="text-gray-600 group-hover:text-[#00FF99] transition-colors"
            />
          </div>
        </div>
      </div>
    </Link>
  )
}
