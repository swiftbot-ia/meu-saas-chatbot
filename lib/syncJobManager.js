// lib/syncJobManager.js
// ============================================================================
// Gerenciador de Jobs de Sincronização em Memória
// ============================================================================

import { randomUUID } from 'crypto'

// Armazenamento em memória dos jobs
const syncJobs = new Map()

// Tempo para limpar jobs antigos (1 hora)
const JOB_EXPIRY_MS = 60 * 60 * 1000

/**
 * Cria um novo job de sincronização
 * @param {object} options - Opções do job
 * @returns {object} Job criado
 */
export function createSyncJob({ connectionId, type = 'full' }) {
    const jobId = randomUUID()

    const job = {
        id: jobId,
        connectionId,
        type, // 'contacts' | 'messages' | 'full'
        status: 'pending', // 'pending' | 'processing' | 'completed' | 'failed'
        progress: {
            total: 0,
            processed: 0,
            percentage: 0,
            currentPhase: 'starting' // 'contacts' | 'conversations' | 'messages'
        },
        stats: {
            contactsTotal: 0,
            contactsCreated: 0,
            contactsUpdated: 0,
            conversationsCreated: 0,
            messagesProcessed: 0,
            errors: 0
        },
        errors: [],
        startTime: new Date(),
        endTime: null,
        updatedAt: new Date()
    }

    syncJobs.set(jobId, job)
    return job
}

/**
 * Atualiza um job existente
 * @param {string} jobId - ID do job
 * @param {object} updates - Atualizações
 * @returns {object|null} Job atualizado ou null
 */
export function updateSyncJob(jobId, updates) {
    const job = syncJobs.get(jobId)
    if (!job) return null

    // Merge updates
    if (updates.progress) {
        job.progress = { ...job.progress, ...updates.progress }
        // Recalcular porcentagem
        if (job.progress.total > 0) {
            job.progress.percentage = Math.round((job.progress.processed / job.progress.total) * 100)
        }
    }

    if (updates.stats) {
        job.stats = { ...job.stats, ...updates.stats }
    }

    if (updates.status) {
        job.status = updates.status
        if (updates.status === 'completed' || updates.status === 'failed') {
            job.endTime = new Date()
        }
    }

    if (updates.error) {
        job.errors.push({
            message: updates.error,
            timestamp: new Date()
        })
    }

    job.updatedAt = new Date()
    syncJobs.set(jobId, job)
    return job
}

/**
 * Obtém um job pelo ID
 * @param {string} jobId - ID do job
 * @returns {object|null} Job ou null
 */
export function getSyncJob(jobId) {
    return syncJobs.get(jobId) || null
}

/**
 * Obtém job ativo por connectionId
 * @param {string} connectionId - ID da conexão
 * @returns {object|null} Job ativo ou null
 */
export function getActiveJobByConnection(connectionId) {
    for (const job of syncJobs.values()) {
        if (job.connectionId === connectionId &&
            (job.status === 'pending' || job.status === 'processing')) {
            return job
        }
    }
    return null
}

/**
 * Lista todos os jobs
 * @param {string} connectionId - Filtrar por connectionId (opcional)
 * @returns {Array} Lista de jobs
 */
export function listSyncJobs(connectionId = null) {
    const jobs = Array.from(syncJobs.values())

    if (connectionId) {
        return jobs.filter(j => j.connectionId === connectionId)
    }

    return jobs
}

/**
 * Limpa jobs antigos
 */
export function cleanupOldJobs() {
    const now = Date.now()

    for (const [jobId, job] of syncJobs.entries()) {
        const jobAge = now - job.startTime.getTime()

        // Remover jobs completados/falhados com mais de 1 hora
        if ((job.status === 'completed' || job.status === 'failed') && jobAge > JOB_EXPIRY_MS) {
            syncJobs.delete(jobId)
        }

        // Remover jobs pendentes/processando com mais de 2 horas (travados)
        if ((job.status === 'pending' || job.status === 'processing') && jobAge > JOB_EXPIRY_MS * 2) {
            job.status = 'failed'
            job.errors.push({ message: 'Job expirado por timeout', timestamp: new Date() })
            job.endTime = new Date()
            syncJobs.set(jobId, job)
        }
    }
}

// Limpar jobs antigos a cada 10 minutos
setInterval(cleanupOldJobs, 10 * 60 * 1000)

export default {
    createSyncJob,
    updateSyncJob,
    getSyncJob,
    getActiveJobByConnection,
    listSyncJobs,
    cleanupOldJobs
}
