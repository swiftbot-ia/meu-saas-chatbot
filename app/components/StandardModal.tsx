'use client'

import React, { useEffect, useCallback } from 'react'
import { Check, AlertTriangle, XCircle, Info, X } from 'lucide-react'

// ============================================================================
// TIPOS
// ============================================================================
export type ModalType = 'success' | 'error' | 'warning' | 'info'

export interface StandardModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: ModalType
  onConfirm?: () => void
  confirmText?: string
  cancelText?: string
  showCancelButton?: boolean
}

// ============================================================================
// CONFIGURAÇÃO DE ESTILOS POR TIPO
// ============================================================================
const typeConfig: Record<ModalType, {
  icon: React.ReactNode
  iconBgColor: string
  iconColor: string
  confirmButtonColor: string
  confirmButtonHoverColor: string
}> = {
  success: {
    icon: <Check size={32} strokeWidth={2.5} />,
    iconBgColor: 'bg-green-500/10',
    iconColor: 'text-[#00FF99]',
    confirmButtonColor: 'bg-[#00FF99] text-black',
    confirmButtonHoverColor: 'hover:bg-[#00E88C]'
  },
  error: {
    icon: <XCircle size={32} strokeWidth={2} />,
    iconBgColor: 'bg-red-500/10',
    iconColor: 'text-red-500',
    confirmButtonColor: 'bg-red-500 text-white',
    confirmButtonHoverColor: 'hover:bg-red-600'
  },
  warning: {
    icon: <AlertTriangle size={32} strokeWidth={2} />,
    iconBgColor: 'bg-orange-500/10',
    iconColor: 'text-orange-500',
    confirmButtonColor: 'bg-orange-500 text-white',
    confirmButtonHoverColor: 'hover:bg-orange-600'
  },
  info: {
    icon: <Info size={32} strokeWidth={2} />,
    iconBgColor: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
    confirmButtonColor: 'bg-blue-500 text-white',
    confirmButtonHoverColor: 'hover:bg-blue-600'
  }
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function StandardModal({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  onConfirm,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  showCancelButton = true
}: StandardModalProps) {

  const config = typeConfig[type]

  // ========================================================================
  // HANDLER: Fechar com ESC
  // ========================================================================
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  // ========================================================================
  // HANDLER: Clique no overlay (fora do modal)
  // ========================================================================
  const handleOverlayClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }, [onClose])

  // ========================================================================
  // HANDLER: Confirmar ação
  // ========================================================================
  const handleConfirm = useCallback(() => {
    if (onConfirm) {
      onConfirm()
    }
    onClose()
  }, [onConfirm, onClose])

  // ========================================================================
  // EFEITO: Adicionar listener para tecla ESC
  // ========================================================================
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevenir scroll do body quando modal está aberto
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleKeyDown])

  // ========================================================================
  // RENDERIZAÇÃO
  // ========================================================================
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div
        className="
          relative
          bg-[#1F1F1F] rounded-xl shadow-2xl
          p-6 max-w-md w-full
          transform transition-all duration-200
          animate-slideIn
          border border-gray-800
        "
      >
        {/* Botão de Fechar (X) */}
        <button
          onClick={onClose}
          className="
            absolute top-4 right-4
            text-gray-500 hover:text-gray-300
            transition-colors duration-200
            p-1 rounded-lg hover:bg-gray-800
          "
          aria-label="Fechar modal"
        >
          <X size={20} />
        </button>

        {/* Ícone */}
        <div className="flex justify-center mb-5">
          <div className={`${config.iconBgColor} ${config.iconColor} p-4 rounded-full`}>
            {config.icon}
          </div>
        </div>

        {/* Título */}
        <h2
          id="modal-title"
          className="text-xl font-bold text-white text-center mb-3"
        >
          {title}
        </h2>

        {/* Mensagem */}
        <p
          id="modal-description"
          className="text-[#B0B0B0] text-center mb-6 leading-relaxed"
        >
          {message}
        </p>

        {/* Botões */}
        <div className={`flex gap-3 ${showCancelButton ? 'flex-row' : 'flex-col'}`}>
          {showCancelButton && (
            <button
              onClick={onClose}
              className="
                flex-1 px-4 py-3 rounded-lg
                bg-gray-700 hover:bg-gray-600
                text-gray-300 font-semibold
                transition-all duration-200
                border border-gray-600
              "
            >
              {cancelText}
            </button>
          )}

          <button
            onClick={handleConfirm}
            className={`
              flex-1 px-4 py-3 rounded-lg
              ${config.confirmButtonColor}
              ${config.confirmButtonHoverColor}
              font-semibold
              transition-all duration-200
              shadow-lg
            `}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// HELPER: Hook para gerir estado do modal
// ============================================================================
export interface ModalConfig {
  isOpen: boolean
  title: string
  message: string
  type: ModalType
  onConfirm?: () => void
  confirmText?: string
  cancelText?: string
  showCancelButton?: boolean
}

export const initialModalConfig: ModalConfig = {
  isOpen: false,
  title: '',
  message: '',
  type: 'info',
  confirmText: 'OK',
  cancelText: 'Cancelar',
  showCancelButton: false
}

// ============================================================================
// HELPER: Funções para abrir modais rapidamente
// ============================================================================
export const createModalConfig = {
  success: (title: string, message: string, onConfirm?: () => void): ModalConfig => ({
    isOpen: true,
    title,
    message,
    type: 'success',
    confirmText: 'OK',
    showCancelButton: false,
    onConfirm
  }),

  error: (title: string, message: string, onConfirm?: () => void): ModalConfig => ({
    isOpen: true,
    title,
    message,
    type: 'error',
    confirmText: 'Fechar',
    showCancelButton: false,
    onConfirm
  }),

  warning: (title: string, message: string, onConfirm?: () => void): ModalConfig => ({
    isOpen: true,
    title,
    message,
    type: 'warning',
    confirmText: 'OK',
    showCancelButton: false,
    onConfirm
  }),

  info: (title: string, message: string, onConfirm?: () => void): ModalConfig => ({
    isOpen: true,
    title,
    message,
    type: 'info',
    confirmText: 'OK',
    showCancelButton: false,
    onConfirm
  }),

  confirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    type: ModalType = 'warning',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar'
  ): ModalConfig => ({
    isOpen: true,
    title,
    message,
    type,
    onConfirm,
    confirmText,
    cancelText,
    showCancelButton: true
  })
}
