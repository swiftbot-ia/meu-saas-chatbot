// lib/uazapi-client.js
/**
 * ============================================================================
 * UAZAPI Client - Cliente JavaScript para Evolution/UAZAPI
 * ============================================================================
 * Biblioteca para interagir com a API Swiftbot/UAZAPI (Evolution API)
 *
 * Documentação da API: https://evolution.swiftbot.com.br/docs
 * ============================================================================
 */

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY

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
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      console.warn('⚠️ EVOLUTION_API_URL ou EVOLUTION_API_KEY não configurado')
    }
    this.baseURL = EVOLUTION_API_URL
    this.adminToken = EVOLUTION_API_KEY
  }

  /**
   * Método auxiliar para fazer requisições HTTP
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      'apikey': this.adminToken,
      ...options.headers
    }

    try {
      console.log(`📡 UAZAPI Request: ${options.method || 'GET'} ${endpoint}`)

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
          `UAZAPI Error: ${response.statusText}`,
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
   * @param {string} instanceName - Nome único da instância (ex: swiftbot_user123)
   * @param {object} options - Opções adicionais
   * @returns {Promise<object>} Dados da instância criada
   */
  async createInstance(instanceName, options = {}) {
    return this.request('/instance/create', {
      method: 'POST',
      body: JSON.stringify({
        instanceName,
        qrcode: options.qrcode !== false, // true por padrão
        integration: options.integration || 'WHATSAPP-BAILEYS',
        ...options
      })
    })
  }

  /**
   * Conecta uma instância e gera QR Code
   * @param {string} instanceName - Nome da instância
   * @returns {Promise<object>} Dados da conexão com QR Code
   */
  async connectInstance(instanceName) {
    return this.request(`/instance/connect/${instanceName}`, {
      method: 'GET'
    })
  }

  /**
   * Desconecta (logout) uma instância
   * @param {string} instanceName - Nome da instância
   * @returns {Promise<object>} Resultado da desconexão
   */
  async disconnectInstance(instanceName) {
    return this.request(`/instance/logout/${instanceName}`, {
      method: 'DELETE'
    })
  }

  /**
   * Deleta uma instância completamente
   * @param {string} instanceName - Nome da instância
   * @returns {Promise<object>} Resultado da deleção
   */
  async deleteInstance(instanceName) {
    return this.request(`/instance/delete/${instanceName}`, {
      method: 'DELETE'
    })
  }

  /**
   * Reinicia uma instância
   * @param {string} instanceName - Nome da instância
   * @returns {Promise<object>} Resultado do restart
   */
  async restartInstance(instanceName) {
    return this.request(`/instance/restart/${instanceName}`, {
      method: 'PUT'
    })
  }

  /**
   * Verifica o status de conexão de uma instância
   * @param {string} instanceName - Nome da instância
   * @returns {Promise<object>} Status da conexão
   */
  async getInstanceStatus(instanceName) {
    return this.request(`/instance/connectionState/${instanceName}`, {
      method: 'GET'
    })
  }

  /**
   * Busca informações de todas as instâncias
   * @returns {Promise<Array>} Lista de instâncias
   */
  async fetchAllInstances() {
    return this.request('/instance/fetchInstances', {
      method: 'GET'
    })
  }

  /**
   * Busca informações de uma instância específica
   * @param {string} instanceName - Nome da instância
   * @returns {Promise<object>} Dados da instância
   */
  async fetchInstanceInfo(instanceName) {
    const instances = await this.fetchAllInstances()
    return instances.find(i => i.name === instanceName || i.instanceName === instanceName)
  }

  // ============================================================================
  // 2. ATUALIZAÇÃO DE CAMPOS ADMINISTRATIVOS
  // ============================================================================

  /**
   * Atualiza os campos administrativos da instância
   * @param {string} instanceName - Nome da instância
   * @param {object} fields - Campos administrativos
   * @param {string} fields.adminField01 - Campo admin 1 (ex: client_id)
   * @param {string} fields.adminField02 - Campo admin 2 (ex: user_id interno)
   * @returns {Promise<object>} Resultado da atualização
   */
  async updateAdminFields(instanceName, fields) {
    const body = {}
    if (fields.adminField01) body.adminField01 = fields.adminField01
    if (fields.adminField02) body.adminField02 = fields.adminField02

    return this.request(`/instance/updateAdminFields/${instanceName}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    })
  }

  // ============================================================================
  // 3. WEBHOOKS
  // ============================================================================

  /**
   * Configura webhook global (para todas as instâncias)
   * @param {object} webhookConfig - Configuração do webhook
   * @param {string} webhookConfig.url - URL do webhook
   * @param {boolean} webhookConfig.enabled - Se o webhook está habilitado
   * @param {array} webhookConfig.events - Eventos a serem capturados
   * @returns {Promise<object>} Configuração do webhook
   */
  async setGlobalWebhook(webhookConfig) {
    return this.request('/globalwebhook', {
      method: 'POST',
      body: JSON.stringify({
        webhook: {
          url: webhookConfig.url,
          enabled: webhookConfig.enabled !== false,
          webhookByEvents: webhookConfig.webhookByEvents || false,
          events: webhookConfig.events || [
            'MESSAGES_UPSERT',
            'CONNECTION_UPDATE'
          ]
        }
      })
    })
  }

  /**
   * Configura webhook para uma instância específica
   * @param {string} instanceName - Nome da instância
   * @param {object} webhookConfig - Configuração do webhook
   * @returns {Promise<object>} Configuração do webhook
   */
  async setInstanceWebhook(instanceName, webhookConfig) {
    return this.request(`/webhook/set/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        webhook: {
          url: webhookConfig.url,
          enabled: webhookConfig.enabled !== false,
          webhookByEvents: webhookConfig.webhookByEvents || false,
          events: webhookConfig.events || [
            'MESSAGES_UPSERT',
            'CONNECTION_UPDATE'
          ]
        }
      })
    })
  }

  /**
   * Busca configuração de webhook de uma instância
   * @param {string} instanceName - Nome da instância
   * @returns {Promise<object>} Configuração atual do webhook
   */
  async getInstanceWebhook(instanceName) {
    return this.request(`/webhook/find/${instanceName}`, {
      method: 'GET'
    })
  }

  // ============================================================================
  // 4. ENVIO DE MENSAGENS
  // ============================================================================

  /**
   * Envia uma mensagem de texto
   * @param {string} instanceName - Nome da instância
   * @param {string} number - Número do destinatário (formato: 5511999999999)
   * @param {string} text - Texto da mensagem
   * @returns {Promise<object>} Resultado do envio
   */
  async sendTextMessage(instanceName, number, text) {
    return this.request(`/message/sendText/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: number.replace(/\D/g, ''), // Remove caracteres não numéricos
        text: text
      })
    })
  }

  /**
   * Envia uma mensagem com mídia
   * @param {string} instanceName - Nome da instância
   * @param {string} number - Número do destinatário
   * @param {string} mediaUrl - URL da mídia
   * @param {string} caption - Legenda (opcional)
   * @returns {Promise<object>} Resultado do envio
   */
  async sendMediaMessage(instanceName, number, mediaUrl, caption = '') {
    return this.request(`/message/sendMedia/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: number.replace(/\D/g, ''),
        mediaUrl,
        caption
      })
    })
  }

  // ============================================================================
  // 5. HELPERS E UTILITÁRIOS
  // ============================================================================

  /**
   * Gera um nome de instância único baseado no user_id
   * @param {string} userId - ID do usuário
   * @returns {string} Nome da instância
   */
  generateInstanceName(userId) {
    return `swiftbot_${userId.replace(/[^a-zA-Z0-9]/g, '_')}`
  }

  /**
   * Valida se uma instância está conectada
   * @param {string} instanceName - Nome da instância
   * @returns {Promise<boolean>} true se conectada
   */
  async isInstanceConnected(instanceName) {
    try {
      const status = await this.getInstanceStatus(instanceName)
      return status.instance?.state === 'open'
    } catch (error) {
      return false
    }
  }

  /**
   * Extrai QR Code da resposta da API
   * @param {object} connectData - Dados retornados pela API
   * @returns {string|null} QR Code em base64 ou null
   */
  extractQRCode(connectData) {
    if (connectData.qrcode?.base64) return connectData.qrcode.base64
    if (connectData.qrcode) return connectData.qrcode
    if (connectData.qr) return connectData.qr
    if (connectData.base64) return connectData.base64
    return null
  }
}

// Exportar instância singleton
export const uazapi = new UAZAPIClient()

// Exportar classe também (para testes ou múltiplas instâncias)
export default uazapi
