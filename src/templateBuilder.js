const fs = require('fs').promises;
const path = require('path');

let conteudosBase = null;
let devolutivas = null;

async function loadData() {
  if (!conteudosBase) {
    const basePath = path.join(__dirname, '../data/conteudos_base.json');
    conteudosBase = JSON.parse(await fs.readFile(basePath, 'utf-8'));
  }
  if (!devolutivas) {
    const devPath = path.join(__dirname, '../data/devolutivas.json');
    devolutivas = JSON.parse(await fs.readFile(devPath, 'utf-8'));
  }
}

// Converter imagem para base64
async function imageToBase64(imagePath) {
  const imageBuffer = await fs.readFile(imagePath);
  return `data:image/png;base64,${imageBuffer.toString('base64')}`;
}

// Nomes amigáveis dos perfis
function getNomePerfil(perfil) {
  const nomes = {
    'RELACIONAL': 'Empático (Pessoas)',
    'ACAO': 'Prático (Próximo Passo)',
    'TEMPO': 'Objetivo (Solução Imediata)',
    'MENSAGEM': 'Analista (Mensagem)'
  };
  return nomes[perfil] || perfil;
}

// Cores por perfil
function getCorPerfil(perfil) {
  const cores = {
    'RELACIONAL': '#e74c3c',
    'ACAO': '#f39c12',
    'TEMPO': '#27ae60',
    'MENSAGEM': '#2980b9'
  };
  return cores[perfil] || '#17a2b8';
}

// Montar HTML completo do PDF
async function buildHTML(data) {
  await loadData();

  const { participante, pontuacoes, predominante } = data;
  const perfil = devolutivas[predominante];

  if (!perfil) {
    throw new Error(`Perfil ${predominante} não encontrado`);
  }

  // Calcular percentuais (máximo = 6 pontos por perfil)
  const percentuais = {
    RELACIONAL: Math.round((pontuacoes.RELACIONAL / 6) * 100),
    ACAO: Math.round((pontuacoes.ACAO / 6) * 100),
    TEMPO: Math.round((pontuacoes.TEMPO / 6) * 100),
    MENSAGEM: Math.round((pontuacoes.MENSAGEM / 6) * 100)
  };

  // Carregar imagem da capa
  let brainBase64 = '';
  try {
    const brainPath = path.join(__dirname, '../assets/brain-icon.png');
    brainBase64 = await imageToBase64(brainPath);
  } catch (e) {
    console.warn('Imagem brain-icon.png não encontrada, usando placeholder');
  }

  const primeiroNome = participante.split(' ')[0];
  const corPredominante = getCorPerfil(predominante);

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>PEC Condensado - ${participante}</title>
  <style>
    @page {
      size: A4;
      margin: 80px 80px 90px 80px;
    }

    @page :first {
      margin: 0;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
      line-height: 1.6;
      color: #333;
      font-size: 11pt;
    }

    /* PÁGINA DE CAPA */
    .capa {
      page-break-after: always;
      height: 297mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
      padding: 40px;
      text-align: center;
    }

    .capa-brain {
      width: 300px;
      margin-bottom: 40px;
    }

    .capa-titulo {
      font-size: 36pt;
      font-weight: bold;
      color: #17a2b8;
      margin-bottom: 20px;
      letter-spacing: 2px;
    }

    .capa-subtitulo {
      font-size: 20pt;
      color: #666;
      margin-bottom: 10px;
    }

    .capa-nome {
      font-size: 28pt;
      font-weight: bold;
      color: #333;
      margin-top: 40px;
      padding: 20px 40px;
      border-top: 3px solid #17a2b8;
      border-bottom: 3px solid #17a2b8;
    }

    /* CONTEÚDO DAS PÁGINAS */
    .content-page {
      margin-top: 0;
      padding: 0;
      page-break-before: always;
      page-break-inside: avoid;
    }

    .content-page h1 {
      color: #17a2b8;
      font-size: 24pt;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 3px solid #17a2b8;
    }

    .content-page h2 {
      color: #17a2b8;
      font-size: 18pt;
      margin-top: 30px;
      margin-bottom: 20px;
      page-break-after: avoid;
    }

    .content-page h3 {
      color: #333;
      font-size: 14pt;
      margin-top: 25px;
      margin-bottom: 15px;
    }

    .content-page p {
      margin-bottom: 20px;
      text-align: justify;
      line-height: 1.8;
      text-indent: 1.5em;
    }

    .content-page ul {
      margin: 10px 0 10px 30px;
    }

    .content-page li {
      margin: 8px 0;
      line-height: 1.6;
    }

    /* SEÇÃO DE PONTUAÇÕES */
    .pontuacoes-box {
      background: #f8f9fa;
      border-left: 5px solid #17a2b8;
      padding: 20px;
      margin: 25px 0;
      page-break-inside: avoid;
    }

    .pontuacao-item {
      margin: 20px 0;
    }

    .pontuacao-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-weight: 600;
      font-size: 10pt;
    }

    .pontuacao-bar {
      height: 25px;
      background: #e9ecef;
      border-radius: 12px;
      overflow: hidden;
      position: relative;
    }

    .pontuacao-fill {
      height: 100%;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 12px;
      color: white;
      font-weight: 600;
      font-size: 10pt;
      min-width: 40px;
    }

    .pontuacao-fill.relacional {
      background: linear-gradient(90deg, #e74c3c 0%, #c0392b 100%);
    }
    .pontuacao-fill.acao {
      background: linear-gradient(90deg, #f39c12 0%, #e67e22 100%);
    }
    .pontuacao-fill.tempo {
      background: linear-gradient(90deg, #27ae60 0%, #229954 100%);
    }
    .pontuacao-fill.mensagem {
      background: linear-gradient(90deg, #2980b9 0%, #2471a3 100%);
    }

    /* DESTAQUE */
    .destaque {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px 20px;
      margin: 20px 0;
      page-break-inside: avoid;
    }

    .destaque strong {
      color: #856404;
    }

    /* RESULTADO GERAL */
    .resultado-geral {
      background: #e7f7f9;
      border: 2px solid #17a2b8;
      border-radius: 10px;
      padding: 25px;
      margin: 25px 0;
      page-break-inside: avoid;
    }

    .resultado-geral h2 {
      margin-top: 0;
    }

    .resultado-item {
      margin: 20px 0;
    }

    .resultado-label {
      font-size: 10pt;
      color: #666;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .resultado-valor {
      font-size: 16pt;
      color: #17a2b8;
      font-weight: bold;
      margin-top: 5px;
    }

    /* SEÇÃO DO PERFIL */
    .secao-perfil {
      page-break-before: always;
      margin-top: 0;
    }

    .secao-perfil p {
      margin-bottom: 25px;
      line-height: 1.9;
    }

    .perfil-titulo-box {
      background: ${corPredominante};
      color: white;
      padding: 20px 30px;
      border-radius: 10px;
      margin-bottom: 30px;
      text-align: center;
    }

    .perfil-titulo-box h2 {
      color: white;
      margin: 0;
      font-size: 22pt;
    }

    .secao-detalhe {
      margin: 25px 0;
      page-break-inside: avoid;
    }

    .secao-detalhe h3 {
      color: ${corPredominante};
      font-size: 14pt;
      margin-bottom: 10px;
      padding-left: 10px;
      border-left: 4px solid ${corPredominante};
    }

    .secao-detalhe p {
      text-indent: 0;
      padding-left: 14px;
    }

    /* ARQUETIPOS */
    .arquetipo-item {
      padding: 12px 15px;
      margin: 10px 0;
      border-radius: 8px;
      background: #f8f9fa;
      border-left: 4px solid #ccc;
    }

    .arquetipo-item.relacional { border-left-color: #e74c3c; }
    .arquetipo-item.mensagem { border-left-color: #2980b9; }
    .arquetipo-item.acao { border-left-color: #f39c12; }
    .arquetipo-item.tempo { border-left-color: #27ae60; }

    .arquetipo-item strong {
      color: #333;
    }

    /* CTA */
    .cta-box {
      background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
      color: white;
      padding: 30px;
      border-radius: 10px;
      margin: 30px 0;
      text-align: center;
      page-break-inside: avoid;
    }

    .cta-box h2 {
      color: white;
      margin-top: 0;
      margin-bottom: 15px;
    }

    .cta-box p {
      color: white;
      text-indent: 0;
      text-align: center;
    }

    .cta-box a {
      color: #ffc107;
      font-weight: bold;
      text-decoration: underline;
    }

    .cta-metodo {
      text-align: left;
      margin: 15px 0;
    }

    .cta-metodo li {
      color: white;
      margin: 5px 0;
    }

    strong {
      font-weight: 600;
      color: #17a2b8;
    }

    .page-break {
      page-break-after: always;
    }
  </style>
</head>
<body>

  <!-- PÁGINA 1: CAPA -->
  <div class="capa">
    ${brainBase64 ? `<img src="${brainBase64}" alt="Criando Clientes" class="capa-brain">` : ''}
    <div class="capa-titulo">DIAGNÓSTICO</div>
    <div class="capa-subtitulo">Perfil de Escuta e Comunicação</div>
    <div class="capa-nome">${participante}</div>
  </div>

  <!-- PÁGINA 2: INTRODUÇÃO -->
  <div class="content-page">
    <h1>Olá, ${primeiroNome}!</h1>

    ${conteudosBase.intro.map(p => `<p>${p}</p>`).join('\n')}

    <h2>${conteudosBase.arquetipos_intro}</h2>

    <div class="arquetipo-item relacional">
      <strong>Empático</strong> – ${conteudosBase.arquetipos[0].descricao}
    </div>
    <div class="arquetipo-item mensagem">
      <strong>Analista</strong> – ${conteudosBase.arquetipos[1].descricao}
    </div>
    <div class="arquetipo-item acao">
      <strong>Prático</strong> – ${conteudosBase.arquetipos[2].descricao}
    </div>
    <div class="arquetipo-item tempo">
      <strong>Objetivo</strong> – ${conteudosBase.arquetipos[3].descricao}
    </div>

    <p style="margin-top: 25px;">${conteudosBase.resultado_intro}</p>
  </div>

  <!-- PÁGINA 3: RESULTADO + PONTUAÇÕES -->
  <div class="content-page">
    <h1>Seu Resultado</h1>

    <p>${conteudosBase.resultado_frase}</p>

    <!-- Resultado Geral -->
    <div class="resultado-geral">
      <h2>Resultado Geral</h2>
      <div class="resultado-item">
        <div class="resultado-label">Seu Estilo Predominante</div>
        <div class="resultado-valor">${perfil.titulo}</div>
      </div>
    </div>

    <p>${conteudosBase.resultado_complemento}</p>

    <!-- Pontuações Detalhadas -->
    <div class="pontuacoes-box">
      <h3>Suas Pontuações</h3>

      <div class="pontuacao-item">
        <div class="pontuacao-label">
          <span>Empático (Pessoas)</span>
          <span><strong>${pontuacoes.RELACIONAL}</strong> / 6</span>
        </div>
        <div class="pontuacao-bar">
          <div class="pontuacao-fill relacional" style="width: ${Math.max(percentuais.RELACIONAL, 8)}%">${percentuais.RELACIONAL}%</div>
        </div>
      </div>

      <div class="pontuacao-item">
        <div class="pontuacao-label">
          <span>Prático (Próximo Passo)</span>
          <span><strong>${pontuacoes.ACAO}</strong> / 6</span>
        </div>
        <div class="pontuacao-bar">
          <div class="pontuacao-fill acao" style="width: ${Math.max(percentuais.ACAO, 8)}%">${percentuais.ACAO}%</div>
        </div>
      </div>

      <div class="pontuacao-item">
        <div class="pontuacao-label">
          <span>Objetivo (Solução Imediata)</span>
          <span><strong>${pontuacoes.TEMPO}</strong> / 6</span>
        </div>
        <div class="pontuacao-bar">
          <div class="pontuacao-fill tempo" style="width: ${Math.max(percentuais.TEMPO, 8)}%">${percentuais.TEMPO}%</div>
        </div>
      </div>

      <div class="pontuacao-item">
        <div class="pontuacao-label">
          <span>Analista (Mensagem)</span>
          <span><strong>${pontuacoes.MENSAGEM}</strong> / 6</span>
        </div>
        <div class="pontuacao-bar">
          <div class="pontuacao-fill mensagem" style="width: ${Math.max(percentuais.MENSAGEM, 8)}%">${percentuais.MENSAGEM}%</div>
        </div>
      </div>
    </div>
  </div>

  <!-- PÁGINA 4: PERFIL DETALHADO -->
  <div class="secao-perfil">
    <div class="perfil-titulo-box">
      <h2>${perfil.titulo}</h2>
    </div>

    <div class="secao-detalhe">
      <h3>Diagnóstico</h3>
      <p>${perfil.diagnostico}</p>
    </div>

    <div class="secao-detalhe">
      <h3>Impacto na conversa</h3>
      <p>${perfil.impacto}</p>
    </div>

    <div class="secao-detalhe">
      <h3>Vantagem comercial</h3>
      <p>${perfil.vantagem}</p>
    </div>

    <div class="secao-detalhe">
      <h3>Quando esse perfil brilha nas vendas</h3>
      <p>${perfil.quando_brilha}</p>
    </div>
  </div>

  <!-- PÁGINA 5: FECHAMENTO + CTA -->
  <div class="content-page">
    <h1>Próximos Passos</h1>

    ${conteudosBase.fechamento.map(p => `<p>${p}</p>`).join('\n')}

    <p style="text-indent: 0;"><strong>Além disso, o método ensina:</strong></p>
    <ul>
      ${conteudosBase.metodo.map(item => `<li>${item}</li>`).join('\n')}
    </ul>
    <p>${conteudosBase.metodo_complemento}</p>

    <div class="cta-box">
      <h2>${conteudosBase.cta_titulo}</h2>
      <p>${conteudosBase.cta_texto}</p>
      <p><a href="${conteudosBase.cta_link}">${conteudosBase.cta_link}</a></p>
    </div>
  </div>

</body>
</html>
  `;

  return html;
}

// HTML do e-mail (usado no n8n para o body do Send Email)
function buildEmailHTML(data) {
  const { participante, predominante, pontuacoes } = data;
  const perfil = devolutivas ? devolutivas[predominante] : null;
  const titulo = perfil ? perfil.titulo : predominante;
  const primeiroNome = participante.split(' ')[0];

  return `<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); color: white; padding: 30px; text-align: center; border-radius: 10px;">
      <h1 style="margin: 0;">Seu Diagnóstico PEC está Pronto!</h1>
    </div>

    <div style="padding: 30px 20px;">
      <p>Olá, <strong>${primeiroNome}</strong>!</p>

      <p>Parabéns por dedicar um tempo para se conhecer melhor!</p>

      <p style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <strong style="color: #17a2b8;">Seu estilo predominante:</strong> ${titulo}
      </p>

      <p>Anexo a este e-mail você encontra seu relatório com o diagnóstico do seu Perfil de Escuta e Comunicação, incluindo análise detalhada e recomendações práticas personalizadas.</p>

      <p>Um abraço,<br>
      <strong>Márcia Shimizu | Criando Clientes</strong></p>
    </div>
  </div>
</body>
</html>`;
}

module.exports = { buildHTML, buildEmailHTML };
