function criarPlanilhaLancamentoFolha(cpfs, periodo, dadosMap = null) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const nomeAba = `Lançamento Folha ${meses[periodo.mes - 1]}-${periodo.ano}`;

    let sheet = ss.getSheetByName(nomeAba);
    if (!sheet) {
        sheet = ss.insertSheet(nomeAba);
    } else {
        const ui = SpreadsheetApp.getUi();
        const resp = ui.alert('Aba já existe', `A aba "${nomeAba}" já existe. Deseja limpá-la e recriar?`, ui.ButtonSet.YES_NO);
        if (resp == ui.Button.NO) {
            ss.setActiveSheet(sheet);
            return;
        }
        sheet.clear();
    }

    // MUDANÇA CRÍTICA: Buscar dados DETALHADOS (que contém o salário) em vez da listagem simples
    const dadosCompletos = buscarDadosDetalhadosEmMassa(cpfs);

    const mapDados = {};
    dadosCompletos.forEach(c => {
        const cpfLimpo = String(c.cpf).replace(/\D/g, '');
        mapDados[cpfLimpo] = c;
    });

    // Fallback: Buscar dados da aba Colaboradores (caso API falhe ou esteja incompleta)
    const sheetColab = ss.getSheetByName(CONFIG.ABAS.COLABORADORES);
    const dadosPlanilha = sheetColab.getDataRange().getValues();

    dadosPlanilha.forEach((row, i) => {
        if (i < 5) return; // Pular cabeçalhos
        const cpfLimpo = String(row[1]).replace(/\D/g, '');
        if (!mapDados[cpfLimpo]) {
            mapDados[cpfLimpo] = {};
        }
        // Preencher dados faltantes com os da planilha
        if (!mapDados[cpfLimpo].nome_completo) mapDados[cpfLimpo].nome_completo = row[2];
        // Só usa o da planilha se NÃO veio da API (API tem prioridade total agora)
        if (mapDados[cpfLimpo].salario_base === undefined || mapDados[cpfLimpo].salario_base === null) {
            mapDados[cpfLimpo].salario_base = row[5]; // Coluna F
        }
        if (!mapDados[cpfLimpo].cargo) mapDados[cpfLimpo].cargo = row[6];
        if (!mapDados[cpfLimpo].departamento) mapDados[cpfLimpo].departamento = row[7];
    });

    // LINHA 1: Cabeçalhos dos planos (opcional)
    const headerPlanos = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '8111 (AMIL 2)', '313 (AMIL 2)', '370 (AMIL ODONTO 13)', '392 (AMIL ODONTO 13)'];
    sheet.getRange(1, 1, 1, 18).setValues([headerPlanos]);
    sheet.getRange(1, 1, 1, 18).setFontSize(8).setFontColor('#666666');

    // LINHA 2: Cabeçalhos principais
    const headers = [
        'NOME', 'LOCAL', 'ADMISSÃO', 'SÓCIO', 'SALÁRIO', 'NOVO SALÁRIO',
        'CARGO', 'DEPARTAMENTO', 'CONVENIO ESCOLHIDO', 'DN', 'IDADE',
        'FAIXA ETÁRIA', 'VL 100% AMIL', 'VL EMPRESA AMIL', 'VL FUNC. AMIL',
        'AMIL SAÚDE DEP', 'ODONT. FUNC.', 'ODONT. DEP.'
    ];

    sheet.getRange(2, 1, 1, 18).setValues([headers]);
    sheet.getRange(2, 1, 1, 18)
        .setFontWeight('bold')
        .setBackground('#4a86e8')
        .setFontColor('white')
        .setHorizontalAlignment('center')
        .setVerticalAlignment('middle');

    // Montar linhas de dados
    const linhas = cpfs.map(cpf => {
        const dados = mapDados[cpf] || {};

        // Calcular idade
        let idade = '';
        let faixaEtaria = '';
        if (dados.data_nascimento) {
            const hoje = new Date();
            const nascimento = new Date(dados.data_nascimento);
            idade = hoje.getFullYear() - nascimento.getFullYear();

            // Faixa etária
            if (idade >= 0 && idade <= 18) faixaEtaria = '0-18';
            else if (idade >= 19 && idade <= 23) faixaEtaria = '19-23';
            else if (idade >= 24 && idade <= 28) faixaEtaria = '24-28';
            else if (idade >= 29 && idade <= 33) faixaEtaria = '29-33';
            else if (idade >= 34 && idade <= 38) faixaEtaria = '34-38';
            else if (idade >= 39 && idade <= 43) faixaEtaria = '39-43';
            else if (idade >= 44 && idade <= 48) faixaEtaria = '44-48';
            else if (idade >= 49 && idade <= 53) faixaEtaria = '49-53';
            else if (idade >= 54 && idade <= 58) faixaEtaria = '54-58';
            else faixaEtaria = '59+';
        }

        // Datas como número serial do Excel
        let dataAdmissaoSerial = '';
        if (dados.data_admissao) {
            const dataAdm = new Date(dados.data_admissao);
            const excelEpoch = new Date(1899, 11, 30);
            dataAdmissaoSerial = Math.floor((dataAdm - excelEpoch) / (1000 * 60 * 60 * 24));
        }

        let dataNascimentoSerial = '';
        if (dados.data_nascimento) {
            const dataNasc = new Date(dados.data_nascimento);
            const excelEpoch = new Date(1899, 11, 30);
            dataNascimentoSerial = Math.floor((dataNasc - excelEpoch) / (1000 * 60 * 60 * 24));
        }

        // Salário: Prioridade API > Planilha > 0
        let salario = 0;
        if (dados.salario_base !== undefined && dados.salario_base !== null) {
            // Tentar converter se for string monetária
            if (typeof dados.salario_base === 'string') {
                salario = parseFloat(dados.salario_base.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
            } else {
                salario = parseFloat(dados.salario_base);
            }
        }

        return [
            dados.nome_completo || 'Não encontrado',
            dados.local_trabalho || 'Matriz',
            dataAdmissaoSerial,
            '',
            salario || 0,
            '',
            dados.cargo || '',
            dados.departamento || '',
            '-',
            dataNascimentoSerial,
            idade,
            faixaEtaria,
            0, 0, 0, 0, 0, 0
        ];
    });

    // Inserir dados
    if (linhas.length > 0) {
        sheet.getRange(3, 1, linhas.length, 18).setValues(linhas);

        // Larguras
        const larguras = [200, 100, 100, 60, 100, 120, 200, 150, 150, 100, 60, 100, 100, 120, 110, 120, 110, 110];
        larguras.forEach((largura, i) => sheet.setColumnWidth(i + 1, largura));

        // Formatos
        sheet.getRange(3, 5, linhas.length, 1).setNumberFormat('#,##0.00'); // Salário
        sheet.getRange(3, 6, linhas.length, 1).setNumberFormat('#,##0.00');
        sheet.getRange(3, 13, linhas.length, 6).setNumberFormat('#,##0.00');
        sheet.getRange(3, 3, linhas.length, 1).setNumberFormat('dd/mm/yyyy');
        sheet.getRange(3, 10, linhas.length, 1).setNumberFormat('dd/mm/yyyy');

        // Bordas
        sheet.getRange(2, 1, linhas.length + 1, 18).setBorder(
            true, true, true, true, true, true,
            '#000000', SpreadsheetApp.BorderStyle.SOLID
        );

        // Zebra
        for (let i = 0; i < linhas.length; i++) {
            if (i % 2 !== 0) {
                sheet.getRange(3 + i, 1, 1, 18).setBackground('#f9f9f9');
            }
        }
    }

    sheet.setFrozenRows(2);
    ss.setActiveSheet(sheet);
    SpreadsheetApp.getUi().alert('✅ Planilha Criada!',
        `Planilha "${nomeAba}" criada conforme template.\\n\\nPreencha os valores e quando terminar, vá no menu "Lançamentos" > "Enviar Folha para Sistema".`,
        SpreadsheetApp.getUi().ButtonSet.OK);
}

function enviarFolhaParaAPI() {
    const sheet = SpreadsheetApp.getActiveSheet();
    const nomeAba = sheet.getName();

    if (!nomeAba.includes('Lançamento Folha')) {
        SpreadsheetApp.getUi().alert('⚠️ Aba Incorreta', 'Você deve estar na aba "Lançamento Folha ..." para enviar os dados.', SpreadsheetApp.getUi().ButtonSet.OK);
        return;
    }

    const ui = SpreadsheetApp.getUi();
    const resp = ui.alert('Confirmar Envio', 'Deseja enviar os dados desta planilha para o sistema?', ui.ButtonSet.YES_NO);
    if (resp == ui.Button.NO) return;

    const data = sheet.getDataRange().getValues();
    if (data.length < 3) {
        ui.alert('⚠️ Sem dados', 'A planilha está vazia.', ui.ButtonSet.OK);
        return;
    }

    // Extrair período
    const match = nomeAba.match(/([A-Z][a-z]{2})-(\\d{4})/);
    let mes = 0, ano = 0;
    if (match) {
        const meses = {
            'Jan': 1, 'Fev': 2, 'Mar': 3, 'Abr': 4, 'Mai': 5, 'Jun': 6,
            'Jul': 7, 'Ago': 8, 'Set': 9, 'Out': 10, 'Nov': 11, 'Dez': 12
        };
        mes = meses[match[1]];
        ano = parseInt(match[2]);
    }

    const folhas = [];

    for (let i = 2; i < data.length; i++) {
        const row = data[i];
        const nome = String(row[0]);
        if (!nome || nome === 'Não encontrado') continue;

        // Converter datas
        let dataAdmissao = null;
        if (row[2] && typeof row[2] === 'number') {
            const excelEpoch = new Date(1899, 11, 30);
            const dataAdm = new Date(excelEpoch.getTime() + row[2] * 24 * 60 * 60 * 1000);
            dataAdmissao = Utilities.formatDate(dataAdm, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        }

        let dataNascimento = null;
        if (row[9] && typeof row[9] === 'number') {
            const excelEpoch = new Date(1899, 11, 30);
            const dataNasc = new Date(excelEpoch.getTime() + row[9] * 24 * 60 * 60 * 1000);
            dataNascimento = Utilities.formatDate(dataNasc, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        }

        folhas.push({
            nome_colaborador: nome,
            local_trabalho: row[1] || '',
            data_admissao: dataAdmissao,
            socio: row[3] || '',
            salario_base: row[4] || 0,
            novo_salario: row[5] || null,
            cargo: row[6] || '',
            departamento: row[7] || '',
            convenio_escolhido: row[8] || '',
            data_nascimento: dataNascimento,
            idade: row[10] || null,
            faixa_etaria: row[11] || '',
            vl_100_amil: row[12] || 0,
            vl_empresa_amil: row[13] || 0,
            vl_func_amil: row[14] || 0,
            amil_saude_dep: row[15] || 0,
            odont_func: row[16] || 0,
            odont_dep: row[17] || 0,
            mes_referencia: mes,
            ano_referencia: ano
        });
    }

    if (folhas.length === 0) {
        ui.alert('⚠️ Nenhum dado válido', 'Não há dados válidos para enviar.', ui.ButtonSet.OK);
        return;
    }

    try {
        const url = CONFIG.API_URL + '/folha/batch';
        const options = {
            'method': 'post',
            'contentType': 'application/json',
            'payload': JSON.stringify({ folhas: folhas }),
            'muteHttpExceptions': true
        };

        const response = UrlFetchApp.fetch(url, options);
        const resultado = JSON.parse(response.getContentText());

        if (resultado.success) {
            ui.alert('✅ Sucesso!', resultado.message || 'Folhas enviadas com sucesso.', ui.ButtonSet.OK);
        } else {
            throw new Error(resultado.error);
        }
    } catch (erro) {
        ui.alert('❌ Erro', 'Erro ao enviar folhas: ' + erro.message, ui.ButtonSet.OK);
    }
}

// =====================================================
// NOVA FUNÇÃO DE BUSCA DETALHADA (PARALELA)
// =====================================================
function buscarDadosDetalhadosEmMassa(cpfs) {
    if (!cpfs || cpfs.length === 0) return [];

    // Limpar CPFs
    const cpfsLimpos = cpfs.map(c => String(c).replace(/\D/g, ''));

    // Criar requests para o endpoint de DETALHE (que traz o salário correto)
    const requests = cpfsLimpos.map(cpf => ({
        url: CONFIG.API_URL + '/colaboradores/' + cpf,
        method: 'get',
        muteHttpExceptions: true
    }));

    try {
        // Fetch paralelo (muito mais rápido que loop)
        const responses = UrlFetchApp.fetchAll(requests);

        const resultados = responses.map(res => {
            try {
                const json = JSON.parse(res.getContentText());
                // O endpoint de detalhe retorna { success: true, data: { ... } }
                if (json.success && json.data) {
                    return json.data;
                }
                return null;
            } catch (e) {
                return null;
            }
        }).filter(item => item !== null);

        return resultados;
    } catch (e) {
        Logger.log('Erro no fetchAll: ' + e);
        return [];
    }
}
