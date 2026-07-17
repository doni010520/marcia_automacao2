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

// Montar HTML completo do PDF
async function buildHTML(data) {
  await loadData();

  const { participante, pontuacoes, predominante } = data;
  const perfil = devolutivas[predominante];

  if (!perfil) {
    throw new Error(`Perfil ${predominante} não encontrado`);
  }

  const primeiroNome = participante.split(' ')[0];

  // Carregar imagem da capa
  let brainBase64 = '';
  try {
    const brainPath = path.join(__dirname, '../assets/brain-icon.png');
    brainBase64 = await imageToBase64(brainPath);
  } catch (e) {
    console.warn('Imagem brain-icon.png não encontrada, usando placeholder');
  }

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
    }

    .content-page h1 {
      color: #17a2b8;
      font-size: 24pt;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 3px solid #17a2b8;
    }

    .content-page h2 {
      color: #333;
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

    /* Seção de detalhes do relatório */
    .secao-detalhes-relatorio {
      page-break-before: always;
      margin-top: 0;
    }

    .secao-detalhes-relatorio p {
      margin-bottom: 25px;
      text-align: justify;
      line-height: 1.9;
      text-indent: 1.5em;
    }

    .secao-detalhes-relatorio h2 {
      color: #333;
      font-size: 18pt;
      margin-top: 30px;
      margin-bottom: 20px;
      page-break-after: avoid;
    }

    .secao-detalhes-relatorio h3 {
      color: #333;
      font-size: 14pt;
      margin-top: 25px;
      margin-bottom: 15px;
    }

    strong {
      font-weight: 600;
      color: #333;
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

    ${conteudosBase.arquetipos.map(a => `<p style="text-indent: 0;"><strong>${a.nome}</strong> – ${a.descricao}</p>`).join('\n')}

    <p>${conteudosBase.resultado_intro}</p>
  </div>

  <!-- PÁGINA 3+: RESULTADO E PERFIL DETALHADO -->
  <div class="secao-detalhes-relatorio">
    <h1 style="color: #17a2b8; font-size: 24pt; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 3px solid #17a2b8;">Seu Resultado</h1>


    <p>${conteudosBase.resultado_frase}</p>

    <p style="text-indent: 0;"><strong>Estilo predominante:</strong> ${perfil.titulo}</p>

    <h2>${perfil.titulo}</h2>

    <h3>Diagnóstico</h3>
    <p>${perfil.diagnostico}</p>

    <h3>Impacto na conversa</h3>
    <p>${perfil.impacto}</p>

    <h3>Vantagem comercial</h3>
    <p>${perfil.vantagem}</p>

    <h3>Quando esse perfil brilha nas vendas</h3>
    <p>${perfil.quando_brilha}</p>

    <h3>Por que a IA não consegue fazer isso</h3>
    <p>${perfil.por_que_ia}</p>
  </div>

  <!-- PÁGINA FINAL: FECHAMENTO + CTA -->
  <div class="content-page">
    <h1>Próximos Passos</h1>

    ${conteudosBase.fechamento.map(p => `<p>${p}</p>`).join('\n')}

    <h2>Além disso, o método ensina:</h2>
    <ul>
      ${conteudosBase.metodo.map(item => `<li>${item}</li>`).join('\n')}
    </ul>
    <p>${conteudosBase.metodo_complemento}</p>

    <h2>${conteudosBase.cta_titulo}</h2>
    <p>${conteudosBase.cta_texto}</p>
    <p style="text-indent: 0;"><a href="${conteudosBase.cta_link}" style="color: #333; font-weight: bold;">${conteudosBase.cta_link}</a></p>

    <p style="text-indent: 0;">${conteudosBase.instagram_texto}</p>
    <p style="text-indent: 0;"><a href="${conteudosBase.instagram_link}" style="color: #333; font-weight: bold;">${conteudosBase.instagram_handle}</a></p>
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
      <h1 style="margin: 0;">Seu Diagnóstico PEC está pronto!</h1>
    </div>

    <div style="padding: 30px 20px;">
      <p>Ooi, <strong>${primeiroNome}</strong>!</p>

      <p>Seu Diagnóstico PEC está pronto.</p>

      <p>Você vai descobrir qual é o seu estilo natural de escuta e porque a IA não consegue fazer o que você faz.</p>

      <p>Tem um insight bem importante lá dentro que pode mudar como você vende.</p>

      <p>Lê com atenção!</p>

      <p style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <strong style="color: #17a2b8;">Seu estilo predominante:</strong> ${titulo}
      </p>

      <p>Um abraço,<br>
      <strong>Márcia Shimizu | Criando Clientes</strong></p>
    </div>
  </div>
</body>
</html>`;
}

module.exports = { buildHTML, buildEmailHTML };
