const http = require('http');
const fs = require('fs');

const BASE_URL = process.env.TEST_URL || 'http://localhost:4547';

const testData = {
  participante: 'Teste da Silva',
  pontuacoes: {
    RELACIONAL: 5,
    ACAO: 3,
    TEMPO: 2,
    MENSAGEM: 4
  },
  predominante: 'RELACIONAL'
};

// Teste 1: Health check
function testHealth() {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const json = JSON.parse(data);
        if (json.status === 'ok') {
          console.log('[OK] Health check');
          resolve();
        } else {
          reject(new Error('Health check falhou'));
        }
      });
    }).on('error', reject);
  });
}

// Teste 2: Gerar relatório completo (PDF binário)
function testRelatorioCompleto() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(testData);
    const url = new URL(`${BASE_URL}/gerar-relatorio-completo`);

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        if (res.statusCode === 200 && buffer.length > 0) {
          fs.writeFileSync('teste_pec.pdf', buffer);
          console.log(`[OK] Relatório completo - PDF gerado (${buffer.length} bytes) -> teste_pec.pdf`);
          resolve();
        } else {
          reject(new Error(`Status: ${res.statusCode}, Body: ${buffer.toString()}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Teste 3: Gerar relatório (JSON com html + pdf_base64)
function testRelatorio() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(testData);
    const url = new URL(`${BASE_URL}/gerar-relatorio`);

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const json = JSON.parse(data);
          if (json.html && json.pdf_base64) {
            console.log(`[OK] Relatório JSON - html: ${json.html.length} chars, base64: ${json.pdf_base64.length} chars`);
            resolve();
          } else {
            reject(new Error('Resposta sem html ou pdf_base64'));
          }
        } else {
          reject(new Error(`Status: ${res.statusCode}, Body: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Executar testes
async function runTests() {
  console.log('=== Testes PEC Condensado ===\n');

  try {
    await testHealth();
    await testRelatorioCompleto();
    await testRelatorio();
    console.log('\n=== Todos os testes passaram! ===');
  } catch (error) {
    console.error('\n[ERRO]', error.message);
    process.exit(1);
  }
}

runTests();
