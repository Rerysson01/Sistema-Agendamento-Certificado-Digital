# 📅 Sincronização de Agendamentos: Google Planilhas → Google Agenda

Script em **Google Apps Script** que lê uma planilha de agendamentos de clientes e cria automaticamente os eventos correspondentes no **Google Agenda**, com lembretes e sem duplicar registros.

Desenvolvido originalmente para controlar atendimentos de **emissão de Certificado Digital**, mas pode ser adaptado para qualquer rotina de agendamento.

---

## ✨ Funcionalidades

- Adiciona o menu **Automação TI → Sincronizar com Agenda** na planilha.
- Lê os agendamentos da aba `Agendamentos` a partir da linha 3.
- Cria um evento no Google Agenda para cada linha com status **Agendado**.
- Define duração padrão de **1 hora** por evento.
- Adiciona dois lembretes por pop-up: **24 horas** e **1 hora** antes.
- Grava o **ID do evento** na planilha (coluna G), evitando duplicidade em novas execuções.
- Exibe um resumo ao final: quantos eventos foram criados e quais linhas falharam.
- Registra erros detalhados no log do Apps Script (`Logger`).

---

## 📋 Estrutura esperada da planilha

**Nome da aba:** `Agendamentos` (exatamente assim, sem espaços extras)

| Linha | Conteúdo |
|-------|----------|
| 1 | Título (célula mesclada) |
| 2 | Cabeçalho das colunas |
| 3 em diante | Dados dos agendamentos |

**Colunas utilizadas (A a G):**

| Coluna | Campo | Tipo | Descrição |
|:------:|-------|------|-----------|
| A | Cliente | Texto | Nome do cliente. Linhas com essa coluna vazia são ignoradas. |
| B | CPF/CNPJ | Texto | Vai para a descrição do evento. |
| C | Data | Data | Precisa ser um valor de data válido (formato de data do Sheets). |
| D | Horário | Hora | Precisa ser um valor de hora válido (formato de hora do Sheets). |
| E | Status | Texto | Deve ser exatamente `Agendado` para a linha ser processada. |
| F | Observação | Texto | Vai para a descrição do evento. |
| G | ID do Evento | Texto | Preenchida **automaticamente** pelo script. Deixe vazia em novos agendamentos. |

> 💡 Os nomes das colunas acima foram deduzidos a partir do código. Só a **posição** das colunas importa, então o texto do cabeçalho pode ser diferente.

---

## ⚙️ Regras de processamento

Uma linha só gera evento se **todas** as condições forem verdadeiras:

1. A coluna **Cliente** (A) está preenchida.
2. O **Status** (E) é exatamente `Agendado` (espaços nas pontas são ignorados, mas maiúsculas/minúsculas importam).
3. A coluna **ID do Evento** (G) está vazia.
4. **Data** (C) e **Horário** (D) são valores de data/hora válidos, e não texto.

### Evento criado

| Propriedade | Valor |
|-------------|-------|
| Título | `Certificado Digital: <Cliente>` |
| Início | Data (C) + Horário (D) |
| Término | Início + 1 hora |
| Descrição | Cliente, CPF/CNPJ e Observação |
| Lembretes | Pop-up 24 h e 1 h antes |
| Agenda | Agenda padrão da conta que executa o script |

---

## 🚀 Instalação

1. Abra a planilha no Google Planilhas.
2. Vá em **Extensões → Apps Script**.
3. Apague o conteúdo do arquivo `Código.gs` e cole o código do script.
4. Salve o projeto (`Ctrl + S`).
5. Volte à planilha e **recarregue a página** (F5). O menu **Automação TI** aparecerá na barra superior.

### Primeira execução (autorização)

1. Clique em **Automação TI → Sincronizar com Agenda**.
2. O Google pedirá autorização. Clique em **Revisar permissões**, escolha sua conta e em **Avançado → Acessar (nome do projeto)** → **Permitir**.
3. Execute o menu novamente após autorizar.

**Permissões solicitadas:**
- Ver e editar as planilhas do Google (para ler os dados e gravar o ID do evento).
- Ver, editar, compartilhar e excluir agendas (para criar os eventos).

---

## ▶️ Como usar

1. Preencha uma nova linha na aba `Agendamentos` com Cliente, CPF/CNPJ, Data, Horário, Status = `Agendado` e, se quiser, Observação.
2. Clique em **Automação TI → Sincronizar com Agenda**.
3. Aguarde a mensagem de confirmação.
4. Confira o ID gerado na coluna **G** e o evento no Google Agenda.

### Mensagens possíveis

| Mensagem | Significado |
|----------|-------------|
| `X novos agendamentos sincronizados com sucesso...` | X eventos foram criados. |
| `Falha nas linhas: ...` | Algumas linhas deram erro; veja os detalhes nos logs. |
| `Nenhum agendamento novo encontrado...` | Nenhuma linha atendeu às regras de processamento. |
| `Aba 'Agendamentos' não encontrada...` | O nome da aba está diferente do configurado. |
| `Nenhum dado encontrado a partir da linha 3.` | A planilha não tem dados abaixo do cabeçalho. |
| `Não foi possível acessar o Google Agenda...` | Falta de autorização ou problema de acesso à agenda. |

---

## 🔧 Configuração e personalização

Os principais parâmetros estão no início da função `sincronizarAgenda()`:

| O que alterar | Onde |
|---------------|------|
| Nome da aba | `const abaNome = "Agendamentos";` |
| Primeira linha de dados | `const primeiraLinhaDados = 3;` |
| Duração do evento | `dataHoraFim.setHours(dataHoraInicio.getHours() + 1);` |
| Título do evento | `let tituloEvento = "Certificado Digital: " + cliente;` |
| Lembretes | `evento.addPopupReminder(1440);` e `evento.addPopupReminder(60);` (valores em minutos) |
| Texto do status | `const statusOk = status === "Agendado";` |
| Nome do menu | `ui.createMenu('Automação TI')` na função `onOpen()` |
| Usar outra agenda | Trocar `CalendarApp.getDefaultCalendar()` por `CalendarApp.getCalendarById("id@group.calendar.google.com")` |

---

## 🛠️ Solução de problemas

**O menu "Automação TI" não aparece**
Recarregue a planilha. Se persistir, execute `onOpen` manualmente uma vez pelo editor do Apps Script.

**"Aba não encontrada"**
Confira se o nome da aba é exatamente `Agendamentos`, sem espaços antes ou depois, ou ajuste a constante `abaNome`.

**"Nenhum agendamento novo encontrado" mesmo com dados preenchidos**
Verifique se:
- O Status é exatamente `Agendado`.
- A coluna G está vazia.
- Data e Horário estão formatados como data/hora e não como texto (células alinhadas à esquerda geralmente indicam texto).

**Evento criado no horário errado**
O script usa o fuso horário do projeto. Verifique em **Apps Script → Configurações do projeto → Fuso horário** e também o fuso da planilha em **Arquivo → Configurações**.

**Ver os logs de erro**
No editor do Apps Script, abra **Execuções** (menu lateral) e clique na execução com falha.

---

## ⚠️ Limitações conhecidas

- O script **apenas cria** eventos. Alterar ou cancelar uma linha na planilha **não** atualiza nem exclui o evento já criado. Para reagendar, apague o evento manualmente no Google Agenda, limpe a coluna G e execute a sincronização novamente.
- Os alertas usam `SpreadsheetApp.getUi()`, portanto o script deve ser executado **pela interface da planilha**. Para rodar via gatilho automático (por tempo, por exemplo), substitua os `alert` por `Logger.log`.
- O título do evento está fixo como "Certificado Digital".
- Os eventos são criados na agenda padrão de quem executa o script.

---

## 📁 Estrutura do código

| Função | Descrição |
|--------|-----------|
| `onOpen()` | Executada ao abrir a planilha; cria o menu personalizado. |
| `sincronizarAgenda()` | Lê a aba, valida cada linha, cria os eventos, grava os IDs e exibe o resumo. |

---

## 📄 Licença

Uso livre para fins internos e educacionais. Adapte conforme a necessidade da sua operação.
