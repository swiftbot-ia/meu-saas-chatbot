'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Construction } from 'lucide-react'

/**
 * UnderDevelopment Component
 *
 * Componente placeholder para páginas em desenvolvimento
 *
 * @param {Object} props
 * @param {string} props.title - Título da página
 * @param {string} props.icon - Emoji ou ícone (opcional)
 * @param {string} props.description - Descrição (opcional)
 * @param {string} props.backUrl - URL para voltar (padrão: /dashboard)
 */
export default function UnderDevelopment({
  title = 'Em Desenvolvimento',
  icon = '🚧',
  description = 'Esta funcionalidade está sendo desenvolvida e estará disponível em breve.',
  backUrl = '/dashboard'
}) {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="bg-[#1F1F1F] rounded-xl p-12 text-center border border-[#272727]">
          {/* Icon */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-[#272727] rounded-full">
              <span className="text-6xl">{icon}</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {title}
          </h1>

          {/* Description */}
          <p className="text-[#B0B0B0] text-lg mb-8 max-w-md mx-auto">
            {description}
          </p>

          {/* Construction notice */}
          <div className="flex items-center justify-center gap-2 text-[#00FF99] mb-8">
            <Construction size={20} />
            <span className="text-sm font-medium">
              Estamos trabalhando nisso!
            </span>
          </div>

          {/* Back button */}
          <button
            onClick={() => router.push(backUrl)}
            className="
              inline-flex items-center gap-2 px-6 py-3 rounded-lg
              bg-[#00FF99] hover:bg-[#00E88C]
              text-black font-semibold
              transition-all duration-200
            "
          >
            <ArrowLeft size={20} />
            Voltar
          </button>
        </div>
      </div>
    </div>
  )
}
