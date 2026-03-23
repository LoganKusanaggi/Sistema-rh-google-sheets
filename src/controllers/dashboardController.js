const supabase = require('../config/supabase');

// ════════════════════════════════════════════════════════════════════════════
// HELPER: Construir query base com filtro de departamento
// ════════════════════════════════════════════════════════════════════════════
function aplicarFiltroDepartamento(query, departamento) {
    return departamento ? query.eq('departamento', departamento) : query;
}

// ════════════════════════════════════════════════════════════════════════════
// HELPER: Buscar último mês anterior com dados
// ════════════════════════════════════════════════════════════════════════════
function getMesAnterior(mes, ano) {
    const mesAnt = mes === 1 ? 12 : mes - 1;
    const anoAnt = mes === 1 ? ano - 1 : ano;
    return { mesAnt, anoAnt };
}

// ════════════════════════════════════════════════════════════════════════════
// HELPER: Calcular variação percentual
// ════════════════════════════════════════════════════════════════════════════
function calcVariacao(atual, anterior) {
    if (!anterior || anterior === 0) return 0;
    return parseFloat((((atual - anterior) / anterior) * 100).toFixed(2));
}

// ════════════════════════════════════════════════════════════════════════════
// HELPER: Sparkline de 6 meses anteriores para qualquer tabela/campo
// ════════════════════════════════════════════════════════════════════════════
async function getSparklineMensal(tabela, campo, mesRef, anoRef, dpto) {
    const valores = [];
    let m = mesRef, a = anoRef;
    for (let i = 0; i < 6; i++) {
        m--; if (m < 1) { m = 12; a--; }
        let q = supabase.from(tabela).select(campo).eq('mes_referencia', m).eq('ano_referencia', a);
        if (dpto) q = q.eq('departamento', dpto);
        const { data } = await q;
        const soma = (data || []).reduce((s, r) => s + (parseFloat(r[campo]) || 0), 0);
        valores.unshift(soma);
    }
    return valores; // array de 6 elementos, do mais antigo para o mais recente
}

const dashboardController = {
    async obterResumo(req, res) {
        try {
            // ════════════════════════════════════════════════════════════════════
            // LEITURA DOS FILTROS OPCIONAIS (QUERY PARAMS)
            // ════════════════════════════════════════════════════════════════════
            const mes = req.query.mes ? parseInt(req.query.mes) : new Date().getMonth() + 1;
            const ano = req.query.ano ? parseInt(req.query.ano) : new Date().getFullYear();
            const departamento = req.query.departamento || null;

            const { mesAnt, anoAnt } = getMesAnterior(mes, ano);
            const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

            // ════════════════════════════════════════════════════════════════════
            // 1. COLABORADORES ATIVOS / INATIVOS
            // ════════════════════════════════════════════════════════════════════
            let qAtivos = supabase.from('colaboradores').select('id', { count: 'exact', head: true }).eq('status', 'ativo');
            let qInativos = supabase.from('colaboradores').select('id', { count: 'exact', head: true }).eq('status', 'inativo');

            if (departamento) {
                qAtivos = qAtivos.eq('departamento', departamento);
                qInativos = qInativos.eq('departamento', departamento);
            }

            const [{ count: totalAtivos }, { count: totalInativos }] = await Promise.all([qAtivos, qInativos]);

            // ════════════════════════════════════════════════════════════════════
            // 2. FOLHA BRUTA
            // Tabela: folha_pagamento | Campos: salario_base, mes_referencia, ano_referencia, departamento
            // ════════════════════════════════════════════════════════════════════
            let qFolhaAtual = supabase
                .from('folha_pagamento')
                .select('salario_base')
                .eq('mes_referencia', mes)
                .eq('ano_referencia', ano);

            if (departamento) qFolhaAtual = qFolhaAtual.eq('departamento', departamento);

            const { data: folhaAtualRows, error: eFolha } = await qFolhaAtual;

            if (eFolha) throw new Error('Folha: ' + eFolha.message);
            const folhaAtual = (folhaAtualRows || []).reduce((s, r) => s + (parseFloat(r.salario_base) || 0), 0);

            let qFolhaAnt = supabase
                .from('folha_pagamento')
                .select('salario_base')
                .eq('mes_referencia', mesAnt)
                .eq('ano_referencia', anoAnt);

            if (departamento) qFolhaAnt = qFolhaAnt.eq('departamento', departamento);

            const { data: folhaAntRows } = await qFolhaAnt;
            const folhaAnt = (folhaAntRows || []).reduce((s, r) => s + (parseFloat(r.salario_base) || 0), 0);

            const sparklineFolha = await getSparklineMensal('folha_pagamento', 'salario_base', mes, ano, departamento);

            // ════════════════════════════════════════════════════════════════════
            // 3. BENEFÍCIOS TOTAIS
            // Tabela: beneficios | Campos: valor_total, mes_referencia, ano_referencia
            // ════════════════════════════════════════════════════════════════════
            let qBenAtual = supabase
                .from('beneficios')
                .select('valor_total')
                .eq('mes_referencia', mes)
                .eq('ano_referencia', ano);

            if (departamento) qBenAtual = qBenAtual.eq('departamento', departamento);

            const { data: benAtualRows, error: eBen } = await qBenAtual;

            if (eBen) throw new Error('Benefícios: ' + eBen.message);
            const benAtual = (benAtualRows || []).reduce((s, r) => s + (parseFloat(r.valor_total) || 0), 0);

            let qBenAnt = supabase
                .from('beneficios')
                .select('valor_total')
                .eq('mes_referencia', mesAnt)
                .eq('ano_referencia', anoAnt);

            if (departamento) qBenAnt = qBenAnt.eq('departamento', departamento);

            const { data: benAntRows } = await qBenAnt;
            const benAnt = (benAntRows || []).reduce((s, r) => s + (parseFloat(r.valor_total) || 0), 0);

            const sparklineBen = await getSparklineMensal('beneficios', 'valor_total', mes, ano, departamento);

            // ════════════════════════════════════════════════════════════════════
            // 4. VARIÁVEL / BÔNUS
            // Tabela: variavel | Campos: valor, mes_referencia, ano_referencia
            // ════════════════════════════════════════════════════════════════════
            let qVarAtual = supabase
                .from('variavel')
                .select('valor')
                .eq('mes_referencia', mes)
                .eq('ano_referencia', ano);

            if (departamento) qVarAtual = qVarAtual.eq('departamento', departamento);

            const { data: varAtualRows, error: eVar } = await qVarAtual;

            if (eVar) throw new Error('Variável: ' + eVar.message);
            const varAtual = (varAtualRows || []).reduce((s, r) => s + (parseFloat(r.valor) || 0), 0);

            let qVarAnt = supabase
                .from('variavel')
                .select('valor')
                .eq('mes_referencia', mesAnt)
                .eq('ano_referencia', anoAnt);

            if (departamento) qVarAnt = qVarAnt.eq('departamento', departamento);

            const { data: varAntRows } = await qVarAnt;
            const varAnt = (varAntRows || []).reduce((s, r) => s + (parseFloat(r.valor) || 0), 0);

            const sparklineVar = await getSparklineMensal('variavel', 'valor', mes, ano, departamento);

            // ════════════════════════════════════════════════════════════════════
            // 5. TURNOVER
            // Fórmula: (desligados_no_mes / media_headcount) * 100
            // Desligados = colaboradores com data_demissao dentro do mês filtrado
            // ════════════════════════════════════════════════════════════════════
            const inicioMes = `${ano}-${String(mes).padStart(2, '0')}-01`;
            const fimMes = new Date(ano, mes, 0).toISOString().split('T')[0]; // último dia do mês

            let qDeslig = supabase
                .from('colaboradores')
                .select('id', { count: 'exact', head: true })
                .gte('data_demissao', inicioMes)
                .lte('data_demissao', fimMes);

            if (departamento) qDeslig = qDeslig.eq('departamento', departamento);

            const { count: desligados } = await qDeslig;

            const mediaHeadcount = ((totalAtivos || 0) + (desligados || 0)) / 2 || 1;
            const turnoverAtual = parseFloat(((desligados / mediaHeadcount) * 100).toFixed(2));

            // ════════════════════════════════════════════════════════════════════
            // 6. VAGAS ABERTAS
            // Se tabela não existir, retornar 0 explicitamente
            // ════════════════════════════════════════════════════════════════════
            let vagasAbertas = 0;
            try {
                const { count: cntVagas } = await supabase
                    .from('vagas')
                    .select('id', { count: 'exact', head: true })
                    .eq('status', 'aberta');
                vagasAbertas = cntVagas || 0;
            } catch (eVagas) {
                // Tabela não existe → retornar 0 sem quebrar o endpoint
                vagasAbertas = 0;
                console.warn('Tabela vagas não encontrada:', eVagas.message);
            }

            // ════════════════════════════════════════════════════════════════════
            // 7. TICKET MÉDIO (folha total / colaboradores ativos)
            // ════════════════════════════════════════════════════════════════════
            const ticketMedio = totalAtivos > 0 ? parseFloat((folhaAtual / totalAtivos).toFixed(2)) : 0;

            // ════════════════════════════════════════════════════════════════════
            // 8. GRÁFICOS
            // ════════════════════════════════════════════════════════════════════

            // ── Distribuição por Departamento ──────────────────────────────────
            let qDeptos = supabase
                .from('colaboradores')
                .select('departamento, status')
                .eq('status', 'ativo');

            if (departamento) qDeptos = qDeptos.eq('departamento', departamento);

            const { data: deptosData } = await qDeptos;

            const distDepartamentos = {};
            (deptosData || []).forEach(c => {
                const dpt = c.departamento || 'N/A';
                distDepartamentos[dpt] = (distDepartamentos[dpt] || 0) + 1;
            });

            const graficoDepartamentos = Object.entries(distDepartamentos).map(([k, v]) => [k, v]);

            // ── Evolução da Folha + Benefícios (6 meses) ───────────────────────
            const hist6Meses = [];
            for (let i = 5; i >= 0; i--) {
                let m = mes - i;
                let a = ano;
                if (m < 1) { m += 12; a--; }
                hist6Meses.push({ mes: meses[m - 1] + '/' + a.toString().substr(2), mesNum: m, ano: a });
            }

            const graficoEvolucao = [];
            for (const m of hist6Meses) {
                let qF = supabase.from('folha_pagamento').select('salario_base').eq('mes_referencia', m.mesNum).eq('ano_referencia', m.ano);
                let qB = supabase.from('beneficios').select('valor_total').eq('mes_referencia', m.mesNum).eq('ano_referencia', m.ano);
                if (departamento) { qF = qF.eq('departamento', departamento); qB = qB.eq('departamento', departamento); }

                const [{ data: dF }, { data: dB }] = await Promise.all([qF, qB]);
                const fVal = (dF || []).reduce((s, r) => s + (parseFloat(r.salario_base) || 0), 0);
                const bVal = (dB || []).reduce((s, r) => s + (parseFloat(r.valor_total) || 0), 0);
                graficoEvolucao.push({ mes: m.mes, folha: fVal, beneficios: bVal });
            }

            // ── Top Performers (Variável / Bônus) ──────────────────────────────
            let qPerformers = supabase
                .from('variavel')
                .select('cpf, valor, nome_colaborador')
                .eq('mes_referencia', mes)
                .eq('ano_referencia', ano);

            if (departamento) qPerformers = qPerformers.eq('departamento', departamento);

            const { data: perfRows } = await qPerformers;

            // Agrupar por CPF e somar valores
            const mapPerf = {};
            (perfRows || []).forEach(r => {
                const cpf = r.cpf;
                if (!mapPerf[cpf]) mapPerf[cpf] = { nome: r.nome_colaborador || cpf, valor: 0 };
                mapPerf[cpf].valor += parseFloat(r.valor) || 0;
            });

            // Se a tabela variavel não tiver nome_colaborador, buscar nomes separadamente
            const cpfsPerf = Object.keys(mapPerf);
            if (cpfsPerf.length > 0) {
                const { data: collabs } = await supabase
                    .from('colaboradores')
                    .select('cpf, nome_completo')
                    .in('cpf', cpfsPerf);

                (collabs || []).forEach(c => {
                    if (mapPerf[c.cpf]) mapPerf[c.cpf].nome = c.nome_completo;
                });
            }

            const performers = Object.values(mapPerf)
                .sort((a, b) => b.valor - a.valor)
                .slice(0, 8)
                .map(p => ({
                    nome: p.nome.split(' ').slice(0, 2).join(' '), // Primeiro + segundo nome
                    valor: parseFloat(p.valor.toFixed(2))
                }));

            // ── Histórico de Admissões (12 meses) ──────────────────────────────
            const hist12Meses = [];
            for (let i = 11; i >= 0; i--) {
                let m = mes - i;
                let a = ano;
                if (m < 1) { m += 12; a--; }
                hist12Meses.push({ mes: meses[m - 1] + '/' + a.toString().substr(2), mesNum: m, ano: a });
            }

            const graficoAdmissoes = [];
            for (const m of hist12Meses) {
                const inicioM = `${m.ano}-${String(m.mesNum).padStart(2, '0')}-01`;
                const fimM = new Date(m.ano, m.mesNum, 0).toISOString().split('T')[0];

                let qAdm = supabase
                    .from('colaboradores')
                    .select('id', { count: 'exact', head: true })
                    .gte('data_admissao', inicioM)
                    .lte('data_admissao', fimM);

                if (departamento) qAdm = qAdm.eq('departamento', departamento);

                const { count } = await qAdm;
                graficoAdmissoes.push({ mes: m.mes, valor: count || 0 });
            }

            // ════════════════════════════════════════════════════════════════════
            // 9. ALERTAS (Letreiro)
            // ════════════════════════════════════════════════════════════════════

            // ── Aniversariantes do Mês ──────────────────────────────────────────
            const { data: colabsAniversario } = await supabase
                .from('colaboradores')
                .select('nome_completo, data_nascimento')
                .eq('status', 'ativo');

            const aniversariantesDoMes = (colabsAniversario || []).filter(c => {
                if (!c.data_nascimento) return false;
                const nascMes = parseInt(c.data_nascimento.split('-')[1]);
                return nascMes === mes;
            }).map(c => {
                const dia = c.data_nascimento.split('-')[2];
                const primeiroNome = c.nome_completo.split(' ')[0];
                return `🎂 Aniversário: ${primeiroNome} (dia ${dia})`;
            });

            // ── Resumos para o Ticker ───────────────────────────────────────────
            const resumoAtivos = `👥 Ativos: ${totalAtivos || 0} | Inativos: ${totalInativos || 0}`;
            const resumoFolha = folhaAtual > 0 ? `💰 Folha ${meses[mes - 1]}/${ano}: R$ ${folhaAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null;
            const resumoTicket = ticketMedio > 0 ? `🎯 Ticket Médio: R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null;
            const resumoTurnover = `🔄 Turnover ${meses[mes - 1]}: ${turnoverAtual.toFixed(1)}%`;

            // ── Montar Array de Alertas ────────────────────────────────────────
            const alertas = [];

            // Sempre exibir no letreiro:
            alertas.push({ mensagem: resumoAtivos });
            if (resumoFolha) alertas.push({ mensagem: resumoFolha });
            if (resumoTicket) alertas.push({ mensagem: resumoTicket });
            alertas.push({ mensagem: resumoTurnover });

            // Aniversariantes (um item por pessoa):
            aniversariantesDoMes.forEach(msg => alertas.push({ mensagem: msg }));

            // Fallback se não houver aniversariantes:
            if (aniversariantesDoMes.length === 0) {
                alertas.push({ mensagem: `🎂 Sem aniversariantes em ${meses[mes - 1]}` });
            }

            // ════════════════════════════════════════════════════════════════════
            // MONTAR RESPOSTA FINAL
            // ════════════════════════════════════════════════════════════════════
            return res.status(200).json({
                success: true,
                kpis: {
                    ativos: { valor: totalAtivos || 0, variacao: 0, sparkline: [] },
                    inativos: { valor: totalInativos || 0, variacao: 0, sparkline: [] },
                    folha: { valor: folhaAtual, variacao: calcVariacao(folhaAtual, folhaAnt), sparkline: sparklineFolha },
                    beneficios: { valor: benAtual, variacao: calcVariacao(benAtual, benAnt), sparkline: sparklineBen },
                    variavel: { valor: varAtual, variacao: calcVariacao(varAtual, varAnt), sparkline: sparklineVar },
                    turnover: { valor: turnoverAtual, variacao: 0, sparkline: [0, 0, 0, 0, 0, 0] },
                    vagas: { valor: vagasAbertas, variacao: 0, sparkline: [0, 0, 0, 0, 0, 0] },
                    ticketMedio: { valor: ticketMedio, variacao: 0, sparkline: [] }
                },
                graficos: {
                    departamentos: graficoDepartamentos,
                    evolucao: graficoEvolucao,
                    performers: performers,
                    contratacoes: graficoAdmissoes
                },
                alertas: alertas
            });

        } catch (error) {
            console.error('Erro ao buscar dashboard KPIs:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
};

module.exports = dashboardController;
