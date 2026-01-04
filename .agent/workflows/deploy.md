---
description: Deploy da aplicação SwiftBot na VPS via Docker
---

# Deploy SwiftBot

// turbo-all

## Pré-requisitos
- Ter feito commit e push das mudanças para o branch `main`
- Acesso SSH à VPS via atalho `swiftbot`

## Passos

1. Conectar na VPS:
```bash
swiftbot
```

2. Ir para o diretório do projeto:
```bash
cd /var/www/swiftbot
```

3. Atualizar código e rebuildar:
```bash
git pull origin main
docker compose build swiftbot --no-cache
docker compose up -d swiftbot
```

4. Verificar logs (opcional):
```bash
docker compose logs -f swiftbot --tail 100
```

## Verificação
- Acessar o site e confirmar que está funcionando
- Verificar logs para erros
