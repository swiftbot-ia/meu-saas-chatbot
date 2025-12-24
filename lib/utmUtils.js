/**
 * Utilitários para gerenciamento de parâmetros UTM
 * 
 * UTMs suportados:
 * - utm_source: identifica origem do tráfego (ex: metaads, google)
 * - utm_medium: identifica o meio (ex: ads, email, social)
 * - utm_campaign: identifica a campanha (ex: livedubai)
 * - utm_term: identifica o termo de busca (ex: ads01)
 * - utm_content: identifica o conteúdo do anúncio (ex: perderpordemora)
 */

const UTM_STORAGE_KEY = 'swiftbot_utm_params';
const UTM_EXPIRY_KEY = 'swiftbot_utm_expiry';
const LEAD_STORAGE_KEY = 'swiftbot_lead_data';
const LEAD_EXPIRY_KEY = 'swiftbot_lead_expiry';
const UTM_EXPIRY_DAYS = 30; // UTMs expiram após 30 dias
const LEAD_EXPIRY_DAYS = 30; // Dados do lead expiram após 30 dias

/**
 * Lista de parâmetros UTM válidos
 */
export const UTM_PARAMS = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content'
];

/**
 * Extrai parâmetros UTM de uma URL
 * @param {string} url - URL completa ou apenas query string
 * @returns {Object} Objeto com os parâmetros UTM encontrados
 */
export function parseUtmParams(url) {
    try {
        const urlObj = new URL(url, 'http://localhost');
        const params = new URLSearchParams(urlObj.search);
        const utmParams = {};

        UTM_PARAMS.forEach(param => {
            const value = params.get(param);
            if (value) {
                // Limpa espaços extras (como no exemplo: " utm_term =ads01")
                utmParams[param] = value.trim();
            }
        });

        return utmParams;
    } catch (error) {
        console.error('[UTM] Erro ao parsear URL:', error);
        return {};
    }
}

/**
 * Salva parâmetros UTM no localStorage
 * @param {Object} params - Objeto com parâmetros UTM
 * @returns {boolean} true se salvou com sucesso
 */
export function saveUtmToStorage(params) {
    if (typeof window === 'undefined') return false;

    try {
        // Só salva se houver pelo menos um parâmetro UTM
        if (Object.keys(params).length === 0) {
            return false;
        }

        // Mescla com UTMs existentes (novos sobrescrevem antigos)
        const existing = getUtmFromStorage() || {};
        const merged = { ...existing, ...params };

        // Salva os parâmetros
        localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(merged));

        // Define expiração (30 dias)
        const expiry = Date.now() + (UTM_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        localStorage.setItem(UTM_EXPIRY_KEY, expiry.toString());

        console.log('[UTM] Parâmetros salvos:', merged);
        return true;
    } catch (error) {
        console.error('[UTM] Erro ao salvar:', error);
        return false;
    }
}

/**
 * Recupera parâmetros UTM do localStorage
 * @returns {Object|null} Objeto com parâmetros UTM ou null se não existir/expirado
 */
export function getUtmFromStorage() {
    if (typeof window === 'undefined') return null;

    try {
        // Verifica expiração
        const expiry = localStorage.getItem(UTM_EXPIRY_KEY);
        if (expiry && Date.now() > parseInt(expiry)) {
            clearUtmFromStorage();
            return null;
        }

        const stored = localStorage.getItem(UTM_STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch (error) {
        console.error('[UTM] Erro ao recuperar:', error);
        return null;
    }
}

/**
 * Limpa parâmetros UTM do localStorage
 */
export function clearUtmFromStorage() {
    if (typeof window === 'undefined') return;

    try {
        localStorage.removeItem(UTM_STORAGE_KEY);
        localStorage.removeItem(UTM_EXPIRY_KEY);
        console.log('[UTM] Parâmetros limpos');
    } catch (error) {
        console.error('[UTM] Erro ao limpar:', error);
    }
}

/**
 * Verifica se há UTMs na URL atual e os salva
 * @returns {Object|null} UTMs capturados ou null
 */
export function captureUtmFromCurrentUrl() {
    if (typeof window === 'undefined') return null;

    const params = parseUtmParams(window.location.href);

    if (Object.keys(params).length > 0) {
        saveUtmToStorage(params);
        return params;
    }

    return null;
}

/**
 * Retorna os UTMs para uso em formulários/APIs
 * Prioriza UTMs da URL atual, depois os salvos no storage
 * @returns {Object} Objeto com parâmetros UTM
 */
export function getUtmForSubmission() {
    if (typeof window === 'undefined') return {};

    // Primeiro, verifica se há UTMs na URL atual
    const currentParams = parseUtmParams(window.location.href);

    if (Object.keys(currentParams).length > 0) {
        return currentParams;
    }

    // Se não, retorna os salvos no storage
    return getUtmFromStorage() || {};
}

// =====================================================
// FUNÇÕES PARA DADOS DO LEAD
// =====================================================

/**
 * Salva dados do lead no localStorage
 * @param {Object} leadData - Dados do lead { name, whatsapp, email, source }
 * @returns {boolean} true se salvou com sucesso
 */
export function saveLeadData(leadData) {
    if (typeof window === 'undefined') return false;

    try {
        const { name, whatsapp, email, source } = leadData;

        // Valida campos obrigatórios
        if (!whatsapp) {
            console.error('[Lead] WhatsApp é obrigatório');
            return false;
        }

        // Mescla com dados existentes (novos sobrescrevem)
        const existing = getLeadData() || {};
        const merged = {
            ...existing,
            name: name || existing.name,
            whatsapp: whatsapp,
            email: email || existing.email,
            source: source || existing.source || 'unknown',
            registeredAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Salva os dados
        localStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify(merged));

        // Define expiração (30 dias)
        const expiry = Date.now() + (LEAD_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        localStorage.setItem(LEAD_EXPIRY_KEY, expiry.toString());

        console.log('[Lead] Dados salvos:', merged);
        return true;
    } catch (error) {
        console.error('[Lead] Erro ao salvar:', error);
        return false;
    }
}

/**
 * Recupera dados do lead do localStorage
 * @returns {Object|null} Dados do lead ou null se não existir/expirado
 */
export function getLeadData() {
    if (typeof window === 'undefined') return null;

    try {
        // Verifica expiração
        const expiry = localStorage.getItem(LEAD_EXPIRY_KEY);
        if (expiry && Date.now() > parseInt(expiry)) {
            clearLeadData();
            return null;
        }

        const stored = localStorage.getItem(LEAD_STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch (error) {
        console.error('[Lead] Erro ao recuperar:', error);
        return null;
    }
}

/**
 * Limpa dados do lead do localStorage
 */
export function clearLeadData() {
    if (typeof window === 'undefined') return;

    try {
        localStorage.removeItem(LEAD_STORAGE_KEY);
        localStorage.removeItem(LEAD_EXPIRY_KEY);
        console.log('[Lead] Dados limpos');
    } catch (error) {
        console.error('[Lead] Erro ao limpar:', error);
    }
}

/**
 * Verifica se há dados do lead salvos
 * @returns {boolean} true se há lead salvo
 */
export function hasLeadData() {
    const lead = getLeadData();
    return lead !== null && lead.whatsapp !== undefined;
}

/**
 * Retorna dados combinados do lead e UTMs para automações
 * @returns {Object} Objeto com dados do lead e UTMs
 */
export function getTrackingData() {
    return {
        lead: getLeadData(),
        utm: getUtmFromStorage(),
        hasLead: hasLeadData()
    };
}
