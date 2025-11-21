'use client'

import { useState } from 'react'
import DashboardSummary from './DashboardSummary'
import WhatsAppConnectModal from './WhatsAppConnectModal'

/**
 * ============================================================================
 * EXEMPLO: Página de Dashboard com DashboardSummary
 * ============================================================================
 *
 * Este é um exemplo completo de como usar o componente DashboardSummary
 * em uma página real do Next.js.
 */

export default function ExampleDashboardPage() {
  // ==========================================================================
  // STATE
  // ==========================================================================
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null)

  // IMPORTANTE: Em produção, obter o userId do Supabase Auth
  // Exemplo: const { data: { user } } = await supabase.auth.getUser()
  const userId = '0574fd83-711b-4c05-9d4c-a7d4d96e8842' // Exemplo: Caio

  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  const handleAddNewConnection = () => {
    console.log('➕ Adicionar nova conexão')
    // Em produção, criar nova linha em whatsapp_connections
    // e então abrir o modal
    setShowConnectModal(true)
  }

  const handleSelectConnection = (connectionId: string) => {
    console.log('🔍 Conexão selecionada:', connectionId)
    setSelectedConnectionId(connectionId)
    setShowConnectModal(true)
  }

  const handleConnectionSuccess = (data: any) => {
    console.log('✅ Conexão bem-sucedida:', data)
    // Recarregar dados do dashboard
    window.location.reload()
  }

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard WhatsApp</h1>
          <p className="text-gray-600 mt-2">
            Gerencie suas conexões WhatsApp Business
          </p>
        </div>

        {/* Dashboard Summary Component */}
        <DashboardSummary
          userId={userId}
          onAddNewConnection={handleAddNewConnection}
          onSelectConnection={handleSelectConnection}
        />

        {/* Modal de Conexão WhatsApp */}
        {showConnectModal && selectedConnectionId && (
          <WhatsAppConnectModal
            isOpen={showConnectModal}
            onClose={() => {
              setShowConnectModal(false)
              setSelectedConnectionId(null)
            }}
            connectionId={selectedConnectionId}
            onSuccess={handleConnectionSuccess}
          />
        )}

      </div>
    </div>
  )
}
