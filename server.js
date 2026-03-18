require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { generatePDF } = require('./src/pdfGenerator');
const { buildEmailHTML } = require('./src/templateBuilder');

const app = express();
const PORT = process.env.PORT || 4547;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Middleware de autenticação
const authMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (process.env.API_KEY && apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key'
    });
  }

  next();
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// Endpoint 1: Gerar relatório completo (retorna PDF binário)
app.post('/gerar-relatorio-completo', authMiddleware, async (req, res) => {
  try {
    const { participante, pontuacoes, predominante } = req.body;

    if (!participante || !pontuacoes || !predominante) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Campos obrigatórios: participante, pontuacoes, predominante'
      });
    }

    const perfisValidos = ['ACAO', 'RELACIONAL', 'TEMPO', 'MENSAGEM'];
    if (!perfisValidos.includes(predominante)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Perfil inválido. Use: ACAO, RELACIONAL, TEMPO, MENSAGEM'
      });
    }

    console.log(`[${new Date().toISOString()}] Gerando PDF completo para: ${participante} (${predominante})`);

    const pdfBuffer = await generatePDF({
      participante,
      pontuacoes,
      predominante
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="PEC_${participante.replace(/\s+/g, '_')}.pdf"`);
    res.send(pdfBuffer);

    console.log(`[${new Date().toISOString()}] PDF completo gerado para: ${participante}`);

  } catch (error) {
    console.error('Erro ao gerar PDF completo:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Endpoint 2: Gerar relatório (retorna JSON com html + pdf_base64)
app.post('/gerar-relatorio', authMiddleware, async (req, res) => {
  try {
    const { participante, pontuacoes, predominante } = req.body;

    if (!participante || !pontuacoes || !predominante) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Campos obrigatórios: participante, pontuacoes, predominante'
      });
    }

    const perfisValidos = ['ACAO', 'RELACIONAL', 'TEMPO', 'MENSAGEM'];
    if (!perfisValidos.includes(predominante)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Perfil inválido. Use: ACAO, RELACIONAL, TEMPO, MENSAGEM'
      });
    }

    console.log(`[${new Date().toISOString()}] Gerando relatório para: ${participante} (${predominante})`);

    const pdfBuffer = await generatePDF({
      participante,
      pontuacoes,
      predominante
    });

    const emailHTML = buildEmailHTML({ participante, predominante, pontuacoes });
    const pdf_base64 = pdfBuffer.toString('base64');

    res.json({
      html: emailHTML,
      pdf_base64: pdf_base64
    });

    console.log(`[${new Date().toISOString()}] Relatório gerado para: ${participante}`);

  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Rota de teste
app.get('/', (req, res) => {
  res.json({
    message: 'PEC Condensado - PDF Generator API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      relatorioCompleto: 'POST /gerar-relatorio-completo',
      relatorio: 'POST /gerar-relatorio'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'Endpoint não encontrado'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║  PEC Condensado - PDF Generator           ║
║  Porta: ${PORT}                              ║
║  Status: Running                          ║
╚════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});
