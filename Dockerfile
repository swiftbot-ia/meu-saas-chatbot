# =============================================================================
# SwiftBot - Dockerfile Otimizado para Produção
# =============================================================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Instalar dependências de sistema necessárias para ffmpeg
RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar node_modules do stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variáveis de ambiente para build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build da aplicação Next.js
RUN npm run build

# Stage 3: Runner (imagem final otimizada)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Instalar ffmpeg para processamento de áudio
RUN apk add --no-cache ffmpeg

# Criar usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar apenas arquivos necessários para produção
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copiar o standalone build do Next.js (mais eficiente)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Mudar para usuário não-root
USER nextjs

# Expor porta
EXPOSE 3000

# Variáveis de ambiente de runtime
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Healthcheck para monitoramento
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

# Comando de inicialização
CMD ["node", "server.js"]
