# =============================================================================
# SwiftBot - Dockerfile para Produção (Next.js 16 Standalone)
# =============================================================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Instalar dependências de sistema
RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci && npm cache clean --force

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar node_modules do stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variáveis de ambiente para build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# ⚠️ IMPORTANTE: Variáveis NEXT_PUBLIC_* são passadas via build args
# Isso permite que sejam substituídas durante o build na VPS
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_CHAT_SUPABASE_URL
ARG NEXT_PUBLIC_CHAT_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_CHAT_SUPABASE_URL=$NEXT_PUBLIC_CHAT_SUPABASE_URL
ENV NEXT_PUBLIC_CHAT_SUPABASE_ANON_KEY=$NEXT_PUBLIC_CHAT_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

# Variáveis server-side (não precisam estar no build, mas evita erros)
ENV SUPABASE_SERVICE_ROLE_KEY=placeholder_will_be_replaced_at_runtime
ENV CHAT_SUPABASE_SERVICE_ROLE_KEY=placeholder_will_be_replaced_at_runtime
ENV STRIPE_SECRET_KEY=sk_placeholder
ENV STRIPE_WEBHOOK_SECRET=whsec_placeholder
ENV OPENAI_API_KEY=sk-placeholder

# Build da aplicação Next.js (standalone mode)
RUN npm run build

# Stage 3: Runner (imagem final)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Instalar ffmpeg para processamento de áudio
RUN apk add --no-cache ffmpeg

# Criar usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar arquivos necessários para produção (standalone mode)
# O standalone inclui um servidor minificado com apenas as dependências necessárias
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Criar diretórios de mídia com permissões de escrita
RUN mkdir -p /app/public/media/audio /app/public/media/image /app/public/media/video /app/public/media/document

# Mudar ownership para usuário não-root
RUN chown -R nextjs:nodejs /app

# Mudar para usuário não-root
USER nextjs

# Expor porta
EXPOSE 3000

# Variáveis de ambiente de runtime
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Healthcheck para monitoramento
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Comando de inicialização (standalone mode usa node server.js)
CMD ["node", "server.js"]

