// Helper to generate URL
const webhookUrl = (id) => `https://swiftbot.com.br/api/webhooks/incoming/${id}`

// Helper to generate cURL
const generateCurl = (webhook, apiKey) => {
    return `curl -X POST "${webhookUrl(webhook.id)}" \\
  -H "Content-Type: application/json" \\
  -H "X-API-KEY: ${apiKey}" \\
  -d '{
  "phone": "5511999999999",
  "name": "Fulano de Tal",
  "email": "fulano@email.com"
}'`
}

// Helper to generate n8n JSON
const generateN8n = (webhook, apiKey) => {
    const url = webhookUrl(webhook.id)
    return JSON.stringify({
        "nodes": [
            {
                "parameters": {
                    "method": "POST",
                    "url": url,
                    "sendHeaders": true,
                    "headerParameters": {
                        "parameters": [
                            {
                                "name": "X-API-KEY",
                                "value": apiKey
                            }
                        ]
                    },
                    "sendBody": true,
                    "specifyBody": "json",
                    "jsonBody": "={\n  \"phone\": \"{{ $('Webhook').item.json.body.phone }}\",\n  \"name\": \"{{ $('Webhook').item.json.body.name }}\",\n  \"email\": \"{{ $('Webhook').item.json.body.email }}\"\n}",
                    "options": {}
                },
                "type": "n8n-nodes-base.httpRequest",
                "typeVersion": 4.1,
                "position": [416, 0],
                "id": crypto.randomUUID(),
                "name": `Send to ${webhook.name}`
            }
        ],
        "connections": {}
    }, null, 2)
}

// Helper to generate Make JSON
const generateMake = (webhook, apiKey) => {
    const url = webhookUrl(webhook.id)
    return JSON.stringify({
        "subflows": [
            {
                "flow": [
                    {
                        "id": 1,
                        "module": "http:MakeRequest",
                        "version": 4,
                        "parameters": {
                            "authenticationType": "noAuth"
                        },
                        "mapper": {
                            "url": url,
                            "method": "post",
                            "headers": [
                                { "name": "X-API-KEY", "value": apiKey },
                                { "name": "Content-Type", "value": "application/json" }
                            ],
                            "jsonStringBodyContent": "{\n  \"phone\": \"{{1.phone}}\",\n  \"name\": \"{{1.name}}\",\n  \"email\": \"{{1.email}}\"\n}",
                            "contentType": "json",
                            "parseResponse": true
                        },
                        "metadata": {
                            "designer": { "x": 300, "y": 0 }
                        }
                    }
                ]
            }
        ]
    }, null, 2)
}

export { generateCurl, generateN8n, generateMake }
