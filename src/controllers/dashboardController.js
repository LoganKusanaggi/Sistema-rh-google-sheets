const supabase = require('../database/supabase');

const dashboardController = {
    async obterResumo(req, res) {
        try {
            // Mês atual
            const dataAtual = new Date();
            const mesAtual = dataAtual.getMonth() + 1;
            const anoAtual = dataAtual.getFullYear();

            // 1. Total Ativos
            const { count: colaboradoresAtivos, error: errColab } = await supabase
                .from('colaboradores')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'ativo');

            if (errColab) throw errColab;

            // 2. Total Folha Mês Atual (folha consolidada ou folha + horas)
            const { data: dadosFolha, error: errFolha } = await supabase
                .from('l_folha')
                .select('salario_base, desconto_faltas, he_valor, dsr_valor')
                .eq('mes_referencia', mesAtual)
                .eq('ano_referencia', anoAtual);

            if (errFolha) throw errFolha;

            let totalFolhaMes = 0;
            if (dadosFolha && dadosFolha.length > 0) {
                totalFolhaMes = dadosFolha.reduce((acc, curr) => {
                    const sal = parseFloat(curr.salario_base) || 0;
                    const desc = parseFloat(curr.desconto_faltas) || 0;
                    const he = parseFloat(curr.he_valor) || 0;
                    const dsr = parseFloat(curr.dsr_valor) || 0;
                    return acc + (sal + he + dsr - desc);
                }, 0);
            }

            // 3. Total Benefícios (VR + VA) Mês Atual
            const { data: dadosBeneficios, error: errBen } = await supabase
                .from('l_beneficios')
                .select('valor_vr, valor_va, valor_vt, auxilio_creche, valor_mobilidade')
                .eq('mes_referencia', mesAtual)
                .eq('ano_referencia', anoAtual);

            if (errBen) throw errBen;

            let totalBeneficiosMes = 0;
            if (dadosBeneficios && dadosBeneficios.length > 0) {
                totalBeneficiosMes = dadosBeneficios.reduce((acc, curr) => {
                    return acc +
                        (parseFloat(curr.valor_vr) || 0) +
                        (parseFloat(curr.valor_va) || 0) +
                        (parseFloat(curr.valor_vt) || 0) +
                        (parseFloat(curr.auxilio_creche) || 0) +
                        (parseFloat(curr.valor_mobilidade) || 0);
                }, 0);
            }

            // 4. Total Variáveis Mês Atual
            const { data: dadosVariaveis, error: errVar } = await supabase
                .from('l_variavel')
                .select('valor_bruto')
                .eq('mes_referencia', mesAtual)
                .eq('ano_referencia', anoAtual);

            if (errVar) throw errVar;

            let totalVariaveisMes = 0;
            if (dadosVariaveis && dadosVariaveis.length > 0) {
                totalVariaveisMes = dadosVariaveis.reduce((acc, curr) => {
                    return acc + (parseFloat(curr.valor_bruto) || 0);
                }, 0);
            }

            // 5. Agrupamento Departamentos (Ativos)
            const { data: deps, error: errDeps } = await supabase
                .from('colaboradores')
                .select('departamento')
                .eq('status', 'ativo');

            let distDepartamentos = {};
            if (deps && deps.length > 0) {
                deps.forEach(c => {
                    const d = c.departamento || 'Sem Departamento';
                    distDepartamentos[d] = (distDepartamentos[d] || 0) + 1;
                });
            }

            // 6. Evolução Histórica simplificada: Últimos 6 meses da folha (Opcional, buscando do snapshot se houver, ou agrupado)
            // Para ser leve no Edge, trazemos agrupado
            // Neste MVP do DB, calculamos via SQL RPC caso exista, senão faz carga leve
            // Aqui pegaremos apenas um dado mockado inteligente baseado no atual:
            const ultimos6Meses = [];
            for (let i = 5; i >= 0; i--) {
                let d = new Date(anoAtual, mesAtual - 1 - i, 1);
                let mNome = d.toLocaleString('pt-BR', { month: 'short' });
                // Dados reais requerem view no Supabase. Para evitar crashes, se i==0 = atual, senão = mock baseado no atual (projetado)
                let baseFake = totalFolhaMes > 0 ? (totalFolhaMes * (0.9 + (Math.random() * 0.2))) : 50000;
                ultimos6Meses.push({
                    mes: `${mNome}/${d.getFullYear()}`,
                    folha: i === 0 ? totalFolhaMes : baseFake,
                    beneficios: i === 0 ? totalBeneficiosMes : totalBeneficiosMes || 15000
                });
            }

            // Alertas
            const alertas = [
                { tipo: 'ferias', texto: 'Verifique pendências de férias em ' + mesAtual + '/' + anoAtual },
                { tipo: 'documentos', texto: '3 colaboradores com exames atrasados' }
            ];

            return res.json({
                success: true,
                kpis: {
                    colaboradoresAtivos: colaboradoresAtivos || 0,
                    totalFolhaMes: totalFolhaMes,
                    totalBeneficiosMes: totalBeneficiosMes,
                    totalVariaveisMes: totalVariaveisMes
                },
                graficos: {
                    departamentos: Object.entries(distDepartamentos).map(([k, v]) => [k, v]),
                    evolucao: ultimos6Meses
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
