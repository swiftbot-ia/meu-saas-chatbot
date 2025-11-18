# ⚠️ ROTAS DEPRECADAS

As rotas neste diretório (`/api/whatsapp/*`) estão **DEPRECADAS** e não devem ser usadas.

## 🔄 Migração

Todas as funcionalidades foram migradas para:

### **Nova API (RECOMENDADA):**
- `POST /api/whatsapp/instance/manage` - Criar e conectar instância
- `GET /api/whatsapp/instance/manage?userId=xxx` - Verificar status
- `DELETE /api/whatsapp/instance/manage?connectionId=xxx` - Desconectar

### **Webhook:**
- Antigo: `/api/webhooks/evolution` ❌
- Novo: `/api/webhooks/uazapi` ✅

## 📚 Documentação

Ver: `docs/UAZAPI-MIGRATION-GUIDE.md`

## ⚠️ Estas rotas antigas usam Evolution API e podem não funcionar:

- `/api/whatsapp/connect`
- `/api/whatsapp/disconnect`
- `/api/whatsapp/generate-qr`
- `/api/whatsapp/status`
- `/api/whatsapp/set-webhook`
- `/api/whatsapp/delete-instance`
- `/api/whatsapp/save-phone`

**Recomendação:** Migre para `/api/whatsapp/instance/manage`
