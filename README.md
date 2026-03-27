# PEC Condensado - API de Geração de PDFs

API para geração de relatórios PDF personalizados do **Perfil de Escuta e Comunicação (PEC) Condensado**.

Integrada com **n8n** para automação completa: Google Forms → cálculo de perfil → geração de PDF → envio por e-mail e WhatsApp.

## Arquitetura

```
Google Forms (12 perguntas)
       ↓
Google Sheets (respostas)
       ↓
n8n: Google Sheets Trigger (polling a cada 1 min)
       ↓
n8n: Code → calcula pontuações (4 perfis × 3 perguntas, escala 0-1-2)
       ↓
n8n: Edit Fields → organiza campos
       ↓
n8n: HTTP Request → API /gerar-relatorio-completo (PDF binário)
       ↓
n8n: HTTP Request → API /gerar-relatorio (HTML + pdf_base64)
       ↓
n8n: Convert to File → converte base64 em binário
       ↓
n8n: Send Email (SMTP) → envia PDF anexo
       ↓
n8n: UAZAPI → envia PDF no WhatsApp
       ↓
n8n: UAZAPI → adiciona contato
```

## Perfis

| Perfil | Chave | Perguntas |
|--------|-------|-----------|
| O Empático \| Pessoas | `RELACIONAL` | 4, 5, 6 |
| O Prático \| Próximo Passo | `ACAO` | 1, 2, 3 |
| O Objetivo \| Solução Imediata | `TEMPO` | 7, 8, 9 |
| O Analista \| Mensagem | `MENSAGEM` | 10, 11, 12 |

- **Escala:** Nunca (0) / Às vezes (1) / Sempre (2)
- **Pontuação máxima por perfil:** 6 (3 perguntas × 2 pontos)
- **Perfil predominante:** maior pontuação

## Estrutura do Projeto

```
├── server.js                  # API Express (porta 4547)
├── package.json
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── test.js                    # Script de teste
├── src/
│   ├── pdfGenerator.js        # Geração de PDF com Puppeteer
│   └── templateBuilder.js     # Template HTML do relatório
├── data/
│   ├── devolutivas.json       # Conteúdo dos 4 perfis
│   └── conteudos_base.json    # Textos introdutórios e CTA
├── assets/
│   ├── brain-icon.png         # Imagem da capa
│   └── logo.png               # Logo Criando Clientes
├── n8n/
│   └── workflow-pec-condensado.json  # Workflow n8n (importar)
└── google-apps-script/
    └── criarFormulario.gs     # Script para criar o Google Forms
```

## API Endpoints

### `GET /health`
Health check.

### `POST /gerar-relatorio-completo`
Retorna o PDF como binário.

```json
{
  "participante": "Nome Completo",
  "pontuacoes": {
    "RELACIONAL": 5,
    "ACAO": 3,
    "TEMPO": 2,
    "MENSAGEM": 4
  },
  "predominante": "RELACIONAL"
}
```

### `POST /gerar-relatorio`
Retorna JSON com HTML (para e-mail) e PDF em base64 (para anexo/WhatsApp).

Mesmo body do endpoint anterior. Resposta:

```json
{
  "html": "<!DOCTYPE html>...",
  "pdf_base64": "JVBERi0xLjQ..."
}
```

## Deploy (EasyPanel)

### Variáveis de ambiente

| Variável | Valor | Obrigatório |
|----------|-------|-------------|
| `PORT` | `4547` | Sim |
| `NODE_ENV` | `production` | Sim |
| `API_KEY` | *(qualquer texto)* | Não |

### Com Docker

```bash
docker-compose up -d
```

### Sem Docker

```bash
npm install
npm start
```

## Configuração do n8n

1. Importe o workflow de `n8n/workflow-pec-condensado.json`
2. Configure as credenciais:
   - **Google Sheets Trigger** → OAuth2 do Google
   - **Send Email** → SMTP (marcia@criandoclientes.com.br)
   - **UAZAPI** → token no header
3. No nó **Google Sheets Trigger**, atualize o `documentId` com o ID da planilha de respostas
4. Nos nós **HTTP Request**, atualize a URL com o domínio do EasyPanel
5. Adicione um nó **Convert to File** entre HTTP Request2 e Send Email para converter `pdf_base64` em binário

## Google Forms

O formulário foi criado via Google Apps Script. O código está em `google-apps-script/criarFormulario.gs`.

Para criar um novo formulário:
1. Acesse https://script.google.com
2. Crie um novo projeto
3. Cole o conteúdo de `criarFormulario.gs`
4. Salve e execute a função `criarFormularioPEC()`
5. O link do formulário aparece no log de execução
6. Vincule as respostas a uma planilha: Formulário → Respostas → Vincular ao Planilhas

## Teste

```bash
node test.js
```

Gera um PDF de teste em `teste_pec.pdf`.

## Tecnologias

- Node.js 20
- Express 4
- Puppeteer 21 (Chromium headless)
- Docker (node:20-slim + Chromium)
- n8n (automação)
- UAZAPI (WhatsApp)
