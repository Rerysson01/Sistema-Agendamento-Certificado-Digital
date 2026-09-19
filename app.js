function sincronizarAgenda() {
  // Conecta na planilha e na aba específica
  const abaNome = "Agendamentos"; // Confirme que essa é exatamente a nova aba renomeada
  const planilha = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(abaNome);

  if (!planilha) {
    SpreadsheetApp.getUi().alert("Aba '" + abaNome + "' não encontrada. Verifique se o nome está exatamente igual (sem espaços extras).");
    return;
  }

  const primeiraLinhaDados = 3; // Linha 1 = título mesclado, Linha 2 = cabeçalho, dados começam na 3
  const ultimaLinha = planilha.getLastRow();

  if (ultimaLinha < primeiraLinhaDados) {
    SpreadsheetApp.getUi().alert("Nenhum dado encontrado a partir da linha " + primeiraLinhaDados + ".");
    return;
  }

  const numLinhas = ultimaLinha - primeiraLinhaDados + 1;
  const dados = planilha.getRange(primeiraLinhaDados, 1, numLinhas, 7).getValues();

  let calendario;
  try {
    calendario = CalendarApp.getDefaultCalendar();
  } catch (e) {
    SpreadsheetApp.getUi().alert("Não foi possível acessar o Google Agenda. Autorize o script e tente novamente.\n" + e.toString());
    return;
  }

  let eventosCriados = 0;
  let linhasComErro = [];

  for (let i = 0; i < dados.length; i++) {
    const linhaPlanilha = i + primeiraLinhaDados; // linha real na planilha

    let cliente = dados[i][0];
    let data = dados[i][2];     // Coluna C
    let horario = dados[i][3];  // Coluna D
    let status = String(dados[i][4]).trim(); // Coluna E
    let idEvento = String(dados[i][6]).trim(); // Coluna G

    // Pula linhas em branco
    if (!cliente) continue;

    const statusOk = status === "Agendado";
    const semIdEvento = idEvento === "";
    const dataValida = data instanceof Date;
    const horarioValido = horario instanceof Date;

    if (statusOk && semIdEvento && dataValida && horarioValido) {
      let dataHoraInicio = new Date(
        data.getFullYear(), data.getMonth(), data.getDate(),
        horario.getHours(), horario.getMinutes()
      );

      let dataHoraFim = new Date(dataHoraInicio.getTime());
      dataHoraFim.setHours(dataHoraInicio.getHours() + 1);

      let tituloEvento = "Certificado Digital: " + cliente;
      let descricaoEvento = "Cliente: " + cliente +
        "\nCPF/CNPJ: " + dados[i][1] +
        "\nObservação: " + dados[i][5];

      try {
        let evento = calendario.createEvent(tituloEvento, dataHoraInicio, dataHoraFim, {
          description: descricaoEvento
        });

        evento.addPopupReminder(1440); // 24h antes
        evento.addPopupReminder(60);   // 1h antes

        planilha.getRange(linhaPlanilha, 7).setValue(evento.getId());
        eventosCriados++;

      } catch (e) {
        Logger.log("Erro ao criar evento para " + cliente + " (linha " + linhaPlanilha + "): " + e.toString());
        linhasComErro.push(linhaPlanilha + " (" + cliente + ")");
      }
    }
  }

  let mensagem = eventosCriados + " novos agendamentos sincronizados com sucesso no Google Agenda!";
  if (linhasComErro.length > 0) {
    mensagem += "\n\nFalha nas linhas: " + linhasComErro.join(", ") + ". Veja os logs para detalhes.";
  }
  if (eventosCriados > 0 || linhasComErro.length > 0) {
    SpreadsheetApp.getUi().alert(mensagem);
  } else {
    SpreadsheetApp.getUi().alert("Nenhum agendamento novo encontrado para sincronizar (verifique se o Status está exatamente 'Agendado' e se Data/Horário estão preenchidos).");
  }
}

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Automação TI')
      .addItem('Sincronizar com Agenda', 'sincronizarAgenda')
      .addToUi();
}