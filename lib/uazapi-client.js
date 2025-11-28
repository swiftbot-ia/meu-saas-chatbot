// lib/uazapi-client.js
/**
 * ============================================================================
 * UAZAPI Client - Cliente JavaScript para UAZAPI
 * ============================================================================
 * Biblioteca para interagir com a API UAZAPI (https://swiftbot.uazapi.com)
 *
 * Documentação da API: Fornecida pelo usuário
 *
 * ATENÇÃO: Esta API usa dois tipos de autenticação:
 * 1. admintoken - Para endpoints administrativos (criar instância, atualizar campos admin, webhook global)
 * 2. token - Para endpoints de instância específica (status, connect, disconnect)
 * ============================================================================
 */

const UAZAPI_BASE_URL = process.env.UAZAPI_BASE_URL || 'https://swiftbot.uazapi.com'
const UAZAPI_ADMIN_TOKEN = process.env.UAZAPI_ADMIN_TOKEN

/**
 * Classe de erro personalizada para UAZAPI
 */
export class UAZAPIError extends Error {
  constructor(message, status, response) {
    super(message)
    this.name = 'UAZAPIError'
    this.status = status
    this.response = response
  }
}

/**
 * Cliente UAZAPI - Singleton
 */
class UAZAPIClient {
  constructor() {
    if (!UAZAPI_BASE_URL || !UAZAPI_ADMIN_TOKEN) {
      console.warn('⚠️ UAZAPI_BASE_URL ou UAZAPI_ADMIN_TOKEN não configurado')
    }
    this.baseURL = UAZAPI_BASE_URL
    this.adminToken = UAZAPI_ADMIN_TOKEN
  }

  /**
   * Método auxiliar para fazer requisições HTTP
   * @param {string} endpoint - Endpoint da API (ex: /instance/init)
   * @param {object} options - Opções da requisição
   * @param {string} authType - Tipo de autenticação: 'admin' ou 'instance'
   * @param {string} instanceToken - Token da instância (necessário se authType='instance')
   */
  async request(endpoint, options = {}, authType = 'admin', instanceToken = null) {
    const url = `${this.baseURL}${endpoint}`

    // Configurar headers de autenticação
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    // Adicionar autenticação apropriada
    if (authType === 'admin') {
      headers['admintoken'] = this.adminToken
    } else if (authType === 'instance') {
      if (!instanceToken) {
        throw new UAZAPIError('Instance token é obrigatório para este endpoint', 401, null)
      }
      headers['token'] = instanceToken
    }

    try {
      console.log(`📡 UAZAPI Request: ${options.method || 'GET'} ${endpoint} (auth: ${authType})`)

      const response = await fetch(url, {
        ...options,
        headers
      })

      // Tentar parsear resposta
      let data
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      if (!response.ok) {
        console.error(`❌ UAZAPI Error: ${response.status}`, data)
        throw new UAZAPIError(
          `UAZAPI Error: ${response.statusText || 'Request failed'}`,
          response.status,
          data
        )
      }

      console.log(`✅ UAZAPI Success: ${endpoint}`)
      return data

    } catch (error) {
      if (error instanceof UAZAPIError) {
        throw error
      }
      console.error(`❌ UAZAPI Request Failed:`, error)
      throw new UAZAPIError(error.message, 500, null)
    }
  }

  // ============================================================================
  // 1. GERENCIAMENTO DE INSTÂNCIAS
  // ============================================================================

  /**
   * Cria uma nova instância do WhatsApp
   * Endpoint: POST /instance/init
   * Auth: admintoken
   *
   * @param {string} name - Nome único da instância (ex: swiftbot_user123)
   * @param {string} adminField01 - Campo administrativo 1 (ex: client_id)
   * @param {string} adminField02 - Campo administrativo 2 (ex: user_id)
   * @returns {Promise<object>} Dados da instância criada incluindo token
   *
   * Response exemplo:
   * {
   *   "id": "instance_uuid",
   *   "name": "swiftbot_user123",
   *   "token": "instance_token_here",
   *   "adminField01": "client_id",
   *   "adminField02": "user_id",
   *   "status": "connecting"
   * }
   */
  async createInstance(name, adminField01 = null, adminField02 = null) {
    const body = { name }

    if (adminField01) body.adminField01 = adminField01
    if (adminField02) body.adminField02 = adminField02

    return this.request('/instance/init', {
      method: 'POST',
      body: JSON.stringify(body)
    }, 'admin')
  }

  /**
   * Verifica o status de uma instância e obtém QR Code/Pairing Code
   * Endpoint: GET /instance/status
   * Auth: token (da instância)
   *
   * CRUCIAL: Este endpoint retorna o QR Code em base64 e o Pairing Code
   * quando a instância está em status "connecting"
   *
   * @param {string} instanceToken - Token da instância
   * @returns {Promise<object>} Status da instância com QR Code/Pairing Code
   *
   * Response exemplo (connecting):
   * {
   *   "status": "connecting",
   *   "qrcode": "data:image/png;base64,iVBORw0KG...",
   *   "paircode": "ABC123",
   *   "phoneNumber": null
   * }
   *
   * Response exemplo (connected):
   * {
   *   "status": "connected",
   *   "phoneNumber": "5511999999999",
   *   "qrcode": null,
   *   "paircode": null
   * }
   */
  async getInstanceStatus(instanceToken) {
    return this.request('/instance/status', {
      method: 'GET'
    }, 'instance', instanceToken)
  }

  /**
   * Inicia o processo de conexão da instância
   * Endpoint: POST /instance/connect
   * Auth: token (da instância)
   *
   * Se phoneNumber for fornecido, a API tentará Pairing Code.
   * Se phoneNumber for null, a API inicia o processo de QR Code.
   *
   * IMPORTANTE: Após chamar este método, use getInstanceStatus() para obter o QR Code/Pairing Code
   *
   * @param {string} instanceToken - Token da instância
   * @param {string|null} phoneNumber - Número de telefone para Pairing Code (opcional)
   * @returns {Promise<object>} Resultado da conexão
   *
   * Response exemplo:
   * {
   *   "success": true,
   *   "message": "Conexão iniciada. Use /instance/status para obter QR Code"
   * }
   */
  async connectInstance(instanceToken, phoneNumber = null) {
    const body = phoneNumber ? { phoneNumber } : {}

    return this.request('/instance/connect', {
      method: 'POST',
      body: JSON.stringify(body)
    }, 'instance', instanceToken)
  }

  /**
   * Desconecta (faz logout) de uma instância
   * Endpoint: POST /instance/disconnect
   * Auth: token (da instância)
   *
   * @param {string} instanceToken - Token da instância
   * @returns {Promise<object>} Resultado da desconexão
   *
   * Response exemplo:
   * {
   *   "success": true,
   *   "message": "Instância desconectada com sucesso"
   * }
   */
  async disconnectInstance(instanceToken) {
    return this.request('/instance/disconnect', {
      method: 'POST',
      body: JSON.stringify({})
    }, 'instance', instanceToken)
  }

  /**
   * Deleta completamente uma instância
   * Endpoint: DELETE /instance
   * Auth: token (da instância, não admin!)
   *
   * @param {string} instanceToken - Token da instância
   * @returns {Promise<object>} Resultado da exclusão
   *
   * Response exemplo:
   * {
   *   "success": true,
   *   "message": "Instância deletada com sucesso"
   * }
   */
  async deleteInstance(instanceToken) {
    return this.request('/instance', {
      method: 'DELETE'
    }, 'instance', instanceToken)
  }

  /**
   * Atualiza os campos administrativos da instância
   * Endpoint: POST /instance/updateAdminFields
   * Auth: admintoken (apenas admin pode atualizar)
   *
   * @param {string} instanceId - ID da instância (não o token, mas o UUID/ID)
   * @param {string} adminField01 - Campo administrativo 1
   * @param {string} adminField02 - Campo administrativo 2
   * @returns {Promise<object>} Resultado da atualização
   *
   * Response exemplo:
   * {
   *   "success": true,
   *   "message": "Campos administrativos atualizados"
   * }
   */
  async updateAdminFields(instanceId, adminField01 = null, adminField02 = null) {
    const body = { id: instanceId }

    if (adminField01) body.adminField01 = adminField01
    if (adminField02) body.adminField02 = adminField02

    return this.request('/instance/updateAdminFields', {
      method: 'POST',
      body: JSON.stringify(body)
    }, 'admin')
  }

  // ============================================================================
  // 2. WEBHOOKS
  // ============================================================================

  /**
   * Configura webhook global (para todas as instâncias)
   * Endpoint: POST /globalwebhook
   * Auth: admintoken
   *
   * @param {string} webhookUrl - URL do webhook
   * @param {array} events - Lista de eventos (ex: ['messages', 'connection'])
   * @param {array} excludeMessages - Mensagens a excluir (recomendado: ['wasSentByApi'])
   * @returns {Promise<object>} Configuração do webhook
   *
   * Response exemplo:
   * {
   *   "success": true,
   *   "webhook": {
   *     "url": "https://seu-dominio.com/api/webhooks/uazapi",
   *     "events": ["messages", "connection"],
   *     "excludeMessages": ["wasSentByApi"]
   *   }
   * }
   */
  async configureGlobalWebhook(webhookUrl, events = null, excludeMessages = null) {
    const body = {
      url: webhookUrl,
      events: events || ['messages', 'connection'],
      excludeMessages: excludeMessages || ['wasSentByApi']
    }

    return this.request('/globalwebhook', {
      method: 'POST',
      body: JSON.stringify(body)
    }, 'admin')
  }

  // ============================================================================
  // 3. HELPERS E UTILITÁRIOS
  // ============================================================================

  /**
   * Gera um nome de instância único baseado no user_id
   * @param {string} userId - ID do usuário
   * @returns {string} Nome da instância
   */
  generateInstanceName(userId) {
    // Remove caracteres especiais e substitui por underscore
    return `swiftbot_${userId.replace(/[^a-zA-Z0-9]/g, '_')}`
  }

  /**
   * Extrai QR Code da resposta de status
   * @param {object} statusData - Dados retornados por getInstanceStatus()
   * @returns {string|null} QR Code em base64 ou null
   */
  extractQRCode(statusData) {
    // A UAZAPI retorna diretamente em statusData.qrcode
    if (statusData.qrcode) {
      return statusData.qrcode
    }
    return null
  }

  /**
   * Extrai Pairing Code da resposta de status
   * @param {object} statusData - Dados retornados por getInstanceStatus()
   * @returns {string|null} Pairing Code ou null
   */
  extractPairingCode(statusData) {
    if (statusData.paircode) {
      return statusData.paircode
    }
    return null
  }

  /**
   * Verifica se a instância está conectada baseado no status
   * @param {object} statusData - Dados retornados por getInstanceStatus()
   * @returns {boolean} true se conectada
   */
  isConnected(statusData) {
    return statusData.status === 'connected' || statusData.status === 'open'
  }

  /**
   * Verifica se a instância está em processo de conexão
   * @param {object} statusData - Dados retornados por getInstanceStatus()
   * @returns {boolean} true se conectando
   */
  isConnecting(statusData) {
    return statusData.status === 'connecting'
  }

  // ============================================================================
  // 4. ENVIO DE MENSAGENS
  // ============================================================================

  /**
   * Envia uma mensagem de texto
   * Endpoint: POST /message/sendText
   * Auth: token (da instância)
   *
   * @param {string} instanceToken - Token da instância
   * @param {string} to - Número do destinatário (formato: 5511999999999)
   * @param {string} message - Texto da mensagem
   * @returns {Promise<object>} Resultado do envio
   */
  async sendMessage(instanceToken, to, message) {
    return this.request('/message/sendText', {
      method: 'POST',
      body: JSON.stringify({
        to,
        message
      })
    }, 'instance', instanceToken)
  }

  /**
   * Envia uma imagem
   * Endpoint: POST /message/sendImage
   * Auth: token (da instância)
   *
   * @param {string} instanceToken - Token da instância
   * @param {string} to - Número do destinatário
   * @param {string} mediaUrl - URL da imagem
   * @param {string} caption - Legenda (opcional)
   * @returns {Promise<object>} Resultado do envio
   */
  async sendImage(instanceToken, to, mediaUrl, caption = '') {
    return this.request('/message/sendImage', {
      method: 'POST',
      body: JSON.stringify({
        to,
        mediaUrl,
        caption
      })
    }, 'instance', instanceToken)
  }

  /**
   * Envia um vídeo
   * Endpoint: POST /message/sendVideo
   * Auth: token (da instância)
   *
   * @param {string} instanceToken - Token da instância
   * @param {string} to - Número do destinatário
   * @param {string} mediaUrl - URL do vídeo
   * @param {string} caption - Legenda (opcional)
   * @returns {Promise<object>} Resultado do envio
   */
  async sendVideo(instanceToken, to, mediaUrl, caption = '') {
    return this.request('/message/sendVideo', {
      method: 'POST',
      body: JSON.stringify({
        to,
        mediaUrl,
        caption
      })
    }, 'instance', instanceToken)
  }

  /**
   * Envia um áudio
   * Endpoint: POST /message/sendAudio
   * Auth: token (da instância)
   *
   * @param {string} instanceToken - Token da instância
   * @param {string} to - Número do destinatário
   * @param {string} audioUrl - URL do áudio
   * @returns {Promise<object>} Resultado do envio
   */
  async sendAudio(instanceToken, to, audioUrl) {
    return this.request('/message/sendAudio', {
      method: 'POST',
      body: JSON.stringify({
        to,
        audioUrl
      })
    }, 'instance', instanceToken)
  }

  /**
   * Envia um documento
   * Endpoint: POST /message/sendDocument
   * Auth: token (da instância)
   *
   * @param {string} instanceToken - Token da instância
   * @param {string} to - Número do destinatário
   * @param {string} documentUrl - URL do documento
   * @param {string} caption - Nome do arquivo/legenda (opcional)
   * @returns {Promise<object>} Resultado do envio
   */
  async sendDocument(instanceToken, to, documentUrl, caption = '') {
    return this.request('/message/sendDocument', {
      method: 'POST',
      body: JSON.stringify({
        to,
        documentUrl,
        caption
      })
    }, 'instance', instanceToken)
  }

  /**
   * Upload de mídia para a UAZAPI
   * Endpoint: POST /media/upload
   * Auth: token (da instância)
   *
   * @param {string} instanceToken - Token da instância
   * @param {File|Buffer} file - Arquivo a ser enviado
   * @param {string} mimeType - Tipo MIME do arquivo
   * @param {string} filename - Nome do arquivo
   * @returns {Promise<object>} URL da mídia hospedada
   */
  async uploadMedia(instanceToken, file, mimeType, filename) {
    const formData = new FormData()
    formData.append('file', file, filename)

    const url = `${this.baseURL}/media/upload`
    const headers = {
      'token': instanceToken
    }

    try {
      console.log(`📡 UAZAPI Upload Media: ${filename}`)

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData
      })

      let data
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      if (!response.ok) {
        console.error(`❌ UAZAPI Upload Error: ${response.status}`, data)
        throw new UAZAPIError(
          `UAZAPI Upload Error: ${response.statusText || 'Upload failed'}`,
          response.status,
          data
        )
      }

      console.log(`✅ UAZAPI Upload Success`)
      return data

    } catch (error) {
      if (error instanceof UAZAPIError) {
        throw error
      }
      console.error(`❌ UAZAPI Upload Failed:`, error)
      throw new UAZAPIError(error.message, 500, null)
    }
  }

  /**
   * Download de mídia descriptografada via UazAPI
   * Endpoint: POST /message/downloadMedia
   * Auth: token (da instância)
   *
   * WhatsApp envia URLs de mídia criptografadas. A UazAPI descriptografa
   * e retorna o arquivo original.
   *
   * @param {string} instanceToken - Token da instância
   * @param {string} mediaUrl - URL da mídia do WhatsApp (criptografada)
   * @returns {Promise<Buffer>} Buffer do arquivo descriptografado
   */
  async downloadMedia(instanceToken, mediaUrl) {
    const url = `${this.baseURL}/message/downloadMedia`
    const headers = {
      'Content-Type': 'application/json',
      'token': instanceToken
    }

    try {
      console.log(`📡 UAZAPI Download Media: ${mediaUrl.substring(0, 60)}...`)

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ url: mediaUrl })
      })

      if (!response.ok) {
        console.error(`❌ UAZAPI Download Error: ${response.status}`)
        throw new UAZAPIError(
          `UAZAPI Download Error: ${response.statusText || 'Download failed'}`,
          response.status,
          null
        )
      }

      // Retornar buffer do arquivo descriptografado
      const buffer = await response.arrayBuffer()

      console.log(`✅ UAZAPI Download Success (${buffer.byteLength} bytes)`)

      return Buffer.from(buffer)

    } catch (error) {
      if (error instanceof UAZAPIError) {
        throw error
      }
      console.error(`❌ UAZAPI Download Failed:`, error)
      throw new UAZAPIError(error.message, 500, null)
    }
  }
}

// Exportar instância singleton
export const uazapi = new UAZAPIClient()

// Exportar classe também (para testes ou múltiplas instâncias)
export default uazapi
