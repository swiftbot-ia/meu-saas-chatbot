# 📚 Exemplos de Uso - WhatsApp Connect Modal

## 🎯 Exemplo 1: Uso Básico

```tsx
// app/components/Dashboard.tsx

import { useState } from 'react'
import WhatsAppConnectModal from './WhatsAppConnectModal'

export default function Dashboard() {
  const [showModal, setShowModal] = useState(false)
  const [connectionId] = useState('04338ab7-d4fe-4053-ab29-761d0d2a24bb')

  return (
    <div className="p-8">
      <h1>Dashboard</h1>

      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-green-500 text-white rounded"
      >
        Conectar WhatsApp
      </button>

      <WhatsAppConnectModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        connectionId={connectionId}
        onSuccess={(data) => {
          console.log('Conectado:', data)
          // Atualizar UI, recarregar dados, etc.
        }}
      />
    </div>
  )
}
```

---

## 🎯 Exemplo 2: Com Estado do Supabase

```tsx
// app/components/Dashboard.tsx

import { useState, useEffect } from 'react'
import WhatsAppConnectModal from './WhatsAppConnectModal'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const [showModal, setShowModal] = useState(false)
  const [connectionId, setConnectionId] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [profileName, setProfileName] = useState<string | null>(null)

  // Carregar conexão existente
  useEffect(() => {
    loadConnection()
  }, [])

  const loadConnection = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: connection } = await supabase
        .from('whatsapp_connections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (connection) {
        setConnectionId(connection.id)
        setIsConnected(connection.is_connected)
        setProfileName(connection.profile_name)
      }
    }
  }

  const handleSuccess = (data) => {
    console.log('✅ Conectado:', data)
    setIsConnected(true)
    setProfileName(data.profileName)
    loadConnection() // Recarregar dados
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {isConnected ? (
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-green-800">
            ✅ Conectado como <strong>{profileName}</strong>
          </p>
        </div>
      ) : (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-yellow-800 mb-2">
            WhatsApp não conectado
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Conectar Agora
          </button>
        </div>
      )}

      {connectionId && (
        <WhatsAppConnectModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          connectionId={connectionId}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
```

---

## 🎯 Exemplo 3: Com Loading e Erro

```tsx
// app/components/Dashboard.tsx

import { useState, useEffect } from 'react'
import WhatsAppConnectModal from './WhatsAppConnectModal'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const [showModal, setShowModal] = useState(false)
  const [connectionId, setConnectionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadOrCreateConnection()
  }, [])

  const loadOrCreateConnection = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Usuário não autenticado')
        return
      }

      // Buscar conexão existente
      const { data: connection, error: connError } = await supabase
        .from('whatsapp_connections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (connError && connError.code !== 'PGRST116') {
        // Erro diferente de "não encontrado"
        throw connError
      }

      if (connection) {
        // Conexão encontrada
        setConnectionId(connection.id)
      } else {
        // Criar nova conexão
        const { data: newConnection, error: createError } = await supabase
          .from('whatsapp_connections')
          .insert({
            user_id: user.id,
            status: 'disconnected',
            is_connected: false
          })
          .select()
          .single()

        if (createError) {
          throw createError
        }

        setConnectionId(newConnection.id)
      }

    } catch (err) {
      console.error('Erro ao carregar conexão:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Carregando...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">❌ {error}</p>
          <button
            onClick={loadOrCreateConnection}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <button
        onClick={() => setShowModal(true)}
        disabled={!connectionId}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Conectar WhatsApp
      </button>

      {connectionId && (
        <WhatsAppConnectModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          connectionId={connectionId}
          onSuccess={(data) => {
            console.log('Conectado:', data)
            loadOrCreateConnection() // Recarregar
          }}
        />
      )}
    </div>
  )
}
```

---

## 🎯 Exemplo 4: Com Toast de Notificação

```tsx
// app/components/Dashboard.tsx

import { useState } from 'react'
import WhatsAppConnectModal from './WhatsAppConnectModal'
import { toast } from 'react-hot-toast' // ou sua lib de toast preferida

export default function Dashboard() {
  const [showModal, setShowModal] = useState(false)
  const [connectionId] = useState('connection-id-here')

  const handleSuccess = (data) => {
    toast.success(`Conectado como ${data.profileName || 'WhatsApp'}`, {
      duration: 5000,
      icon: '✅',
    })
  }

  const handleClose = () => {
    setShowModal(false)
    toast.info('Modal de conexão fechado', {
      duration: 3000,
    })
  }

  return (
    <div className="p-8">
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-green-500 text-white rounded"
      >
        Conectar WhatsApp
      </button>

      <WhatsAppConnectModal
        isOpen={showModal}
        onClose={handleClose}
        connectionId={connectionId}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
```

---

## 🎯 Exemplo 5: Com Múltiplos Modals (Multi-Usuário)

```tsx
// app/components/Dashboard.tsx

import { useState } from 'react'
import WhatsAppConnectModal from './WhatsAppConnectModal'

interface Connection {
  id: string
  user_id: string
  profile_name: string | null
  is_connected: boolean
}

export default function Dashboard() {
  const [connections, setConnections] = useState<Connection[]>([
    { id: 'conn-1', user_id: 'user-1', profile_name: null, is_connected: false },
    { id: 'conn-2', user_id: 'user-2', profile_name: null, is_connected: false },
  ])

  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null)

  const handleOpenModal = (connectionId: string) => {
    setActiveConnectionId(connectionId)
  }

  const handleSuccess = (data) => {
    // Atualizar conexão específica
    setConnections(prev =>
      prev.map(conn =>
        conn.id === activeConnectionId
          ? { ...conn, profile_name: data.profileName, is_connected: true }
          : conn
      )
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Gerenciar Conexões</h1>

      <div className="grid grid-cols-2 gap-4">
        {connections.map(conn => (
          <div
            key={conn.id}
            className="border rounded-lg p-4"
          >
            <h3 className="font-bold">
              {conn.profile_name || 'Não Conectado'}
            </h3>
            <p className="text-sm text-gray-600">
              {conn.is_connected ? '✅ Conectado' : '❌ Desconectado'}
            </p>
            <button
              onClick={() => handleOpenModal(conn.id)}
              className="mt-2 px-4 py-2 bg-green-500 text-white rounded text-sm"
            >
              {conn.is_connected ? 'Reconectar' : 'Conectar'}
            </button>
          </div>
        ))}
      </div>

      {activeConnectionId && (
        <WhatsAppConnectModal
          isOpen={!!activeConnectionId}
          onClose={() => setActiveConnectionId(null)}
          connectionId={activeConnectionId}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
```

---

## 🎯 Exemplo 6: Com Verificação de Permissões

```tsx
// app/components/Dashboard.tsx

import { useState, useEffect } from 'react'
import WhatsAppConnectModal from './WhatsAppConnectModal'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const [showModal, setShowModal] = useState(false)
  const [connectionId, setConnectionId] = useState<string | null>(null)
  const [canConnect, setCanConnect] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('')

  useEffect(() => {
    checkPermissions()
  }, [])

  const checkPermissions = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Verificar assinatura
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (subscription) {
        setSubscriptionStatus(subscription.status)

        // Permitir conexão se status for válido
        const allowedStatuses = ['active', 'trial']
        setCanConnect(allowedStatuses.includes(subscription.status))
      }

      // Buscar connectionId
      const { data: connection } = await supabase
        .from('whatsapp_connections')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (connection) {
        setConnectionId(connection.id)
      }
    }
  }

  const handleConnect = () => {
    if (!canConnect) {
      alert('Você precisa de uma assinatura ativa para conectar o WhatsApp')
      return
    }

    setShowModal(true)
  }

  return (
    <div className="p-8">
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Status da assinatura: <strong>{subscriptionStatus}</strong>
        </p>
      </div>

      <button
        onClick={handleConnect}
        disabled={!canConnect || !connectionId}
        className={`px-4 py-2 rounded ${
          canConnect && connectionId
            ? 'bg-green-500 hover:bg-green-600 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {canConnect ? 'Conectar WhatsApp' : 'Assinatura Inativa'}
      </button>

      {connectionId && canConnect && (
        <WhatsAppConnectModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          connectionId={connectionId}
          onSuccess={(data) => {
            console.log('Conectado:', data)
          }}
        />
      )}
    </div>
  )
}
```

---

## 🎯 Exemplo 7: Com Analytics/Tracking

```tsx
// app/components/Dashboard.tsx

import { useState } from 'react'
import WhatsAppConnectModal from './WhatsAppConnectModal'

export default function Dashboard() {
  const [showModal, setShowModal] = useState(false)
  const [connectionId] = useState('connection-id-here')

  const handleOpenModal = () => {
    // Track modal opened
    if (window.gtag) {
      window.gtag('event', 'whatsapp_modal_opened', {
        event_category: 'WhatsApp',
        event_label: 'Connect Modal Opened'
      })
    }

    setShowModal(true)
  }

  const handleClose = () => {
    // Track modal closed
    if (window.gtag) {
      window.gtag('event', 'whatsapp_modal_closed', {
        event_category: 'WhatsApp',
        event_label: 'Connect Modal Closed'
      })
    }

    setShowModal(false)
  }

  const handleSuccess = (data) => {
    // Track successful connection
    if (window.gtag) {
      window.gtag('event', 'whatsapp_connected', {
        event_category: 'WhatsApp',
        event_label: 'Connection Success',
        value: 1
      })
    }

    console.log('Conectado:', data)
  }

  return (
    <div className="p-8">
      <button
        onClick={handleOpenModal}
        className="px-4 py-2 bg-green-500 text-white rounded"
      >
        Conectar WhatsApp
      </button>

      <WhatsAppConnectModal
        isOpen={showModal}
        onClose={handleClose}
        connectionId={connectionId}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
```

---

## 🎯 Exemplo 8: Com Context API

```tsx
// app/contexts/WhatsAppContext.tsx

import { createContext, useContext, useState, useCallback } from 'react'
import WhatsAppConnectModal from '@/components/WhatsAppConnectModal'

interface WhatsAppContextData {
  openConnectModal: (connectionId: string) => void
  closeConnectModal: () => void
  isConnected: boolean
  profileName: string | null
}

const WhatsAppContext = createContext<WhatsAppContextData | undefined>(undefined)

export function WhatsAppProvider({ children }: { children: React.ReactNode }) {
  const [showModal, setShowModal] = useState(false)
  const [connectionId, setConnectionId] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [profileName, setProfileName] = useState<string | null>(null)

  const openConnectModal = useCallback((connId: string) => {
    setConnectionId(connId)
    setShowModal(true)
  }, [])

  const closeConnectModal = useCallback(() => {
    setShowModal(false)
  }, [])

  const handleSuccess = useCallback((data) => {
    setIsConnected(true)
    setProfileName(data.profileName)
  }, [])

  return (
    <WhatsAppContext.Provider
      value={{
        openConnectModal,
        closeConnectModal,
        isConnected,
        profileName
      }}
    >
      {children}

      {connectionId && (
        <WhatsAppConnectModal
          isOpen={showModal}
          onClose={closeConnectModal}
          connectionId={connectionId}
          onSuccess={handleSuccess}
        />
      )}
    </WhatsAppContext.Provider>
  )
}

export function useWhatsApp() {
  const context = useContext(WhatsAppContext)
  if (!context) {
    throw new Error('useWhatsApp must be used within WhatsAppProvider')
  }
  return context
}

// Uso em qualquer componente:
// app/components/Dashboard.tsx

import { useWhatsApp } from '@/contexts/WhatsAppContext'

export default function Dashboard() {
  const { openConnectModal, isConnected, profileName } = useWhatsApp()

  return (
    <div className="p-8">
      {isConnected ? (
        <p>Conectado como {profileName}</p>
      ) : (
        <button onClick={() => openConnectModal('connection-id')}>
          Conectar WhatsApp
        </button>
      )}
    </div>
  )
}
```

---

## 📋 Checklist de Implementação

- [ ] Copiar `WhatsAppConnectModal.tsx` para `app/components/`
- [ ] Importar no componente pai (Dashboard, etc.)
- [ ] Passar props obrigatórias: `isOpen`, `onClose`, `connectionId`
- [ ] Implementar callback `onSuccess` (opcional)
- [ ] Testar abertura do modal
- [ ] Testar polling de 5 segundos
- [ ] Testar timeout de 30 segundos
- [ ] Testar conexão bem-sucedida
- [ ] Verificar cleanup de timers
- [ ] Validar dados no Supabase

---

## 🎉 Conclusão

Você tem **8 exemplos completos** de como usar o `WhatsAppConnectModal` em diferentes cenários:

1. ✅ Uso básico
2. ✅ Com estado do Supabase
3. ✅ Com loading e erro
4. ✅ Com toast de notificação
5. ✅ Com múltiplos modals
6. ✅ Com verificação de permissões
7. ✅ Com analytics/tracking
8. ✅ Com Context API

Escolha o exemplo que melhor se adapta ao seu caso de uso e customize conforme necessário!
