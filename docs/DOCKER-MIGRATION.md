# 🐳 Guia de Migração: PM2 → Docker

Guia completo para instalar Docker na VPS e migrar do PM2.

---

## 📋 Pré-requisitos

- Acesso SSH à VPS (Ubuntu/Debian)
- Git configurado
- PM2 rodando atualmente

---

## 1️⃣ Instalar Docker na VPS

```bash
# Conectar na VPS
ssh root@seu-ip

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Adicionar chave GPG do Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Adicionar repositório Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verificar instalação
docker --version
docker compose version

# Iniciar Docker no boot
sudo systemctl enable docker
sudo systemctl start docker
```

---

## 2️⃣ Preparar na Máquina Local

```bash
# Adicionar arquivos ao Git
git add Dockerfile docker-compose.yml .dockerignore .env.example next.config.ts app/api/health/

# Commitar
git commit -m "feat: Docker configuration for production"

# Push para o repositório
git push origin main
```

---

## 3️⃣ Configurar na VPS

```bash
# Navegar até o projeto
cd /caminho/do/seu/projeto

# Pull do repositório
git pull origin main

# Criar arquivo .env a partir do exemplo
cp .env.example .env

# Editar .env com suas credenciais reais
nano .env
```

### Preencher o .env:
Copie as variáveis do seu `.env.local` atual (local ou PM2) para o novo `.env`.

---

## 4️⃣ Criar Rede Docker (para Traefik)

```bash
# Criar rede externa para comunicação com Traefik
docker network create swiftbot_rede
```

> ⚠️ **Se você já tem Traefik rodando**, verifique o nome da rede e ajuste no `docker-compose.yml`.

---

## 5️⃣ Migrar do PM2

```bash
# Ver processos PM2 atuais
pm2 list

# Parar todos os processos PM2
pm2 stop all

# OPCIONAL: Salvar estado antes de deletar (backup)
pm2 save

# Deletar processos PM2
pm2 delete all

# Remover PM2 do startup (opcional)
pm2 unstartup
```

---

## 6️⃣ Iniciar com Docker

```bash
# Build e iniciar container
docker compose up -d --build

# Verificar se está rodando
docker ps

# Ver logs em tempo real
docker logs -f swiftbot-app

# Verificar saúde da aplicação
curl http://localhost:3000/api/health
```

---

## 7️⃣ Comandos Úteis

```bash
# Parar container
docker compose down

# Reiniciar
docker compose restart

# Rebuild após mudanças
docker compose up -d --build

# Ver logs
docker logs swiftbot-app

# Logs em tempo real
docker logs -f swiftbot-app

# Entrar no container
docker exec -it swiftbot-app sh

# Limpar imagens antigas
docker image prune -a
```

---

## 🔧 Troubleshooting

### Container não inicia
```bash
# Ver logs detalhados
docker logs swiftbot-app

# Verificar build
docker compose build --no-cache
```

### Erro de porta em uso
```bash
# Verificar o que está usando a porta 3000
sudo lsof -i :3000

# Matar processo se necessário
sudo kill -9 <PID>
```

### Variáveis de ambiente não funcionam
```bash
# Verificar se o .env existe
ls -la .env

# Verificar conteúdo (sem expor secrets)
cat .env | head -20
```

---

## 🚀 Próximos Passos (Opcional)

### Configurar Traefik (se ainda não tem)
Se você ainda não tem Traefik configurado para SSL, vou precisar criar a configuração. Me avise!

### GitHub Actions para Deploy Automático
Posso configurar CI/CD para deploy automático quando fizer push no main.

---

## ✅ Checklist Final

- [ ] Docker instalado na VPS
- [ ] Arquivos commitados e push feito
- [ ] Pull na VPS concluído
- [ ] .env criado e configurado
- [ ] Rede Docker criada
- [ ] PM2 parado e removido
- [ ] Container Docker rodando
- [ ] Health check funcionando
- [ ] Site acessível

---

**Dúvidas?** Me chame que eu ajudo! 🎯
