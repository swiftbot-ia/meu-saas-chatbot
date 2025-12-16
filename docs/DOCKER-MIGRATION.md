# 🐳 Guia de Deploy: Docker + Traefik (Produção)

Guia completo para deploy do SwiftBot com Docker e Traefik para SSL automático.

---

## 📋 O que está incluído

- ✅ **Traefik v3.2** - Proxy reverso moderno
- ✅ **SSL Automático** - Let's Encrypt
- ✅ **Redirect HTTP → HTTPS** - Automático
- ✅ **Health Checks** - Monitoramento
- ✅ **Headers de Segurança** - HSTS

---

## 1️⃣ Pré-requisitos na VPS

```bash
# Conectar na VPS
ssh root@seu-ip

# Docker já instalado? Verificar:
docker --version
docker compose version

# Se não tiver, instalar:
curl -fsSL https://get.docker.com | sh
```

---

## 2️⃣ Parar PM2 (se ainda estiver rodando)

```bash
# Ver processos PM2
pm2 list

# Parar tudo
pm2 stop all
pm2 delete all

# Remover do startup
pm2 unstartup
```

---

## 3️⃣ Liberar Portas 80 e 443

O Traefik precisa das portas 80 e 443. Verifique se algo está usando:

```bash
# Verificar portas em uso
sudo lsof -i :80
sudo lsof -i :443

# Se Nginx estiver rodando, parar:
sudo systemctl stop nginx
sudo systemctl disable nginx
```

---

## 4️⃣ Configurar Variáveis de Ambiente

```bash
cd /var/www/swiftbot

# Criar .env a partir do exemplo
cp .env.example .env

# Editar com suas credenciais reais
nano .env
```

### Variáveis obrigatórias no .env:

```env
# Supabase Principal
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Supabase Chat
NEXT_PUBLIC_CHAT_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_CHAT_SUPABASE_ANON_KEY=eyJ...
CHAT_SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OpenAI
OPENAI_API_KEY=sk-...

# Site
NEXT_PUBLIC_SITE_URL=https://swiftbot.com.br
NODE_ENV=production
```

---

## 5️⃣ Deploy Completo

```bash
cd /var/www/swiftbot

# Atualizar código
git pull origin main

# Remover containers e redes antigos
docker compose down
docker network rm swiftbot_rede 2>/dev/null || true

# Build e iniciar tudo
docker compose up -d --build

# Acompanhar logs
docker compose logs -f
```

---

## 6️⃣ Verificar se Funcionou

```bash
# Ver containers rodando
docker ps

# Deve mostrar 2 containers:
# - traefik
# - swiftbot-app

# Testar health check
docker exec swiftbot-app wget -qO- http://localhost:3000/api/health

# Testar via HTTPS (pode demorar ~1min para SSL)
curl -I https://swiftbot.com.br
```

---

## 🔧 Comandos Úteis

```bash
# Ver logs do SwiftBot
docker logs -f swiftbot-app

# Ver logs do Traefik
docker logs -f traefik

# Reiniciar SwiftBot
docker compose restart swiftbot

# Rebuild após mudanças no código
docker compose up -d --build swiftbot

# Parar tudo
docker compose down

# Limpar imagens antigas
docker image prune -af
```

---

## 🔐 Dashboard do Traefik (Opcional)

O dashboard está disponível em: `https://traefik.swiftbot.com.br`

**Credenciais padrão:**
- Usuário: `admin`
- Senha: `swiftbot2024`

⚠️ **IMPORTANTE:** Mude a senha em produção!

Para gerar nova senha:
```bash
# Instalar htpasswd
sudo apt install apache2-utils

# Gerar hash
htpasswd -nb admin SuaNovaSenha

# Copiar resultado para docker-compose.yml na linha traefik-auth
```

---

## 🌐 DNS Cloudflare

Certifique-se que o DNS está configurado:

| Tipo | Nome | Conteúdo | Proxy |
|------|------|----------|-------|
| A | swiftbot.com.br | IP-da-VPS | ✅ (ou DNS only) |
| A | www | IP-da-VPS | ✅ (ou DNS only) |
| A | traefik | IP-da-VPS | ❌ DNS only |

> 💡 Se usar proxy do Cloudflare + SSL do Traefik, configure Cloudflare como "Full (Strict)"

---

## 🚨 Troubleshooting

### Erro: "port is already allocated"
```bash
sudo lsof -i :80
sudo kill -9 <PID>
```

### Erro: SSL não funciona
```bash
# Verificar logs do Traefik
docker logs traefik | grep -i acme

# Verificar se o volume está correto
docker volume ls | grep traefik
```

### Container reiniciando
```bash
# Ver o motivo
docker logs swiftbot-app --tail 50
```

---

## ✅ Checklist Final

- [ ] PM2 parado e desabilitado
- [ ] Portas 80 e 443 livres
- [ ] .env configurado com credenciais reais
- [ ] DNS apontando para a VPS
- [ ] `docker compose up -d --build` executado
- [ ] Health check retornando `{"status":"healthy"}`
- [ ] Site acessível via HTTPS
- [ ] SSL funcionando (cadeado verde)

---

**Dúvidas?** Me chame que eu ajudo! 🎯
