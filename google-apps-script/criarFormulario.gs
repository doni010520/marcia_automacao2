/**
 * PEC CONDENSADO - Criador de Formulário Google
 *
 * COMO USAR:
 * 1. Acesse https://script.google.com
 * 2. Crie um novo projeto
 * 3. Cole este código
 * 4. Execute a função criarFormularioPEC()
 * 5. Autorize as permissões quando solicitado
 * 6. O link do formulário aparecerá no log (Ctrl+Enter para ver logs)
 */

function criarFormularioPEC() {
  // Criar formulário
  var form = FormApp.create('Qual é o seu estilo de vendas? - Mini PEC');

  // Configurações do formulário
  form.setDescription(
    'A forma como você se comunica influencia diretamente como o cliente reage durante a conversa.\n\n' +
    'Este mini diagnóstico revela qual é o seu Perfil de Escuta e Comunicação (PEC) — o estilo natural que você usa quando conversa com clientes.\n\n' +
    'Em menos de 2 minutos você descobre:\n' +
    '• qual é a sua força natural nas conversas\n' +
    '• por que alguns clientes se abrem facilmente\n\n' +
    'Responda pensando em como você realmente age nas conversas com clientes, porque não existem respostas certas ou erradas.\n\n' +
    'Cada corretor tem um estilo predominante de escuta e comunicação.\n' +
    'Quando você entende o seu estilo, começa a perceber como ele influencia o comportamento do cliente durante a conversa.'
  );
  form.setCollectEmail(false);
  form.setConfirmationMessage(
    'Obrigado por responder!\n\n' +
    'Agora vamos analisar suas respostas para identificar qual é o seu Perfil de Escuta e Comunicação predominante.\n\n' +
    'Esse perfil mostra qual é a sua força natural quando conversa com clientes.\n\n' +
    'Em poucos minutos você receberá seu relatório.\n\n' +
    'Nenhum perfil é melhor.\nMas vender usando apenas o seu, pode limitar sua conversão.'
  );

  // --- SEÇÃO 1: Dados pessoais ---
  form.addTextItem()
    .setTitle('Nome completo:')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Informe seu melhor e-mail:')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Qual é o seu número de WhatsApp?  (Use apenas números, com DDD. Ex: 11987654321) Vamos usar esse número só para enviar o seu resultado e informações do treinamento.')
    .setRequired(true);

  // --- SEÇÃO 2: Perguntas (escala Nunca / Às vezes / Sempre) ---
  var opcoes = ['Nunca', 'Às vezes', 'Sempre'];

  var perguntas = [
    // AÇÃO (1, 2, 3)
    '1. Enquanto o cliente fala, já estou pensando no próximo passo.',
    '2. Gosto de conversas que terminam com uma ação clara.',
    '3. Fico incomodado quando a reunião acaba sem próximo passo definido.',
    // RELACIONAL (4, 5, 6)
    '4. Percebo facilmente quando o cliente está inseguro ou preocupado.',
    '5. Antes de falar de valores, prefiro fortalecer a confiança.',
    '6. Para mim, conexão pessoal vem antes da apresentação do produto.',
    // TEMPO (7, 8, 9)
    '7. Prefiro ir direto ao ponto, sem muitos rodeios.',
    '8. Reuniões longas me desgastam.',
    '9. Gosto de análises resumidas para tomar decisões.',
    // MENSAGEM (10, 11, 12)
    '10. Gosto de entender todos os detalhes antes de sugerir algo.',
    '11. Costumo fazer tabelas comparativas para apresentar produtos.',
    '12. Quero saber dos números e da legislação para me preparar para falar com o cliente.'
  ];

  for (var i = 0; i < perguntas.length; i++) {
    form.addMultipleChoiceItem()
      .setTitle(perguntas[i])
      .setChoiceValues(opcoes)
      .setRequired(true);
  }

  // Log do link
  Logger.log('Formulário criado com sucesso!');
  Logger.log('Link do formulário: ' + form.getPublishedUrl());
  Logger.log('Link de edição: ' + form.getEditUrl());

  // Obter a planilha de respostas
  var spreadsheetId = form.getDestinationId();
  if (!spreadsheetId) {
    // Criar destino de respostas (Google Sheets)
    form.setDestination(FormApp.DestinationType.SPREADSHEET, SpreadsheetApp.create('Respostas - Mini PEC').getId());
    Logger.log('Planilha de respostas criada automaticamente.');
  }

  return form;
}
