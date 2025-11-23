import UnderDevelopment from '../../components/UnderDevelopment'

/**
 * Página de Chat ao Vivo (Em Desenvolvimento)
 *
 * Antiga rota: /dashboard/messages
 * Nova rota: /dashboard/chat
 */
export default function ChatPage() {
  return (
    <UnderDevelopment
      title="Chat ao Vivo"
      icon="💬"
      description="Interaja com seus clientes em tempo real. Visualize conversas ativas, responda mensagens e gerencie atendimentos diretamente pelo WhatsApp."
      backUrl="/dashboard"
    />
  )
}
