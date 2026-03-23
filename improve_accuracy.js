const fs = require('fs');
let content = fs.readFileSync('src/controllers/dashboardController.js', 'utf8');

// 1. Better Turnover and History logic
// We need to declare demissoesMesAnterior
content = content.replace(
`            let colInativosAnterior = 0;
            let demissoesMesAtual = 0;
            let distDepartamentos = {};`,
`            let colInativosAnterior = 0;
            let demissoesMesAtual = 0;
            let demissoesMesAnterior = 0;
            let demissoesPorMes = {};
            let distDepartamentos = {};`
);

// 2. Track demissoes for each month in hist6Meses
content = content.replace(
`                    if (dtDem && dtDem.getMonth() + 1 === mesAtual && dtDem.getFullYear() === anoAtual) {
                        demissoesMesAtual++;
                    }`,
`                    if (dtDem) {
                        const chaveDem = \`\${dtDem.getFullYear()}-\${dtDem.getMonth() + 1}\`;
                        if (dtDem.getMonth() + 1 === mesAtual && dtDem.getFullYear() === anoAtual) demissoesMesAtual++;
                        if (dtDem.getMonth() + 1 === mesAnterior && dtDem.getFullYear() === anoAnterior) demissoesMesAnterior++;
                        demissoesPorMes[chaveDem] = (demissoesPorMes[chaveDem] || 0) + 1;
                    }`
);

// 3. Improve KPIs Calculation (Turnover Anterior and Sparklines)
content = content.replace(
`            const turnoverAtual = colAtivosAtual > 0 ? (demissoesMesAtual / colAtivosAtual) * 100 : 0;
            // Mockação de turnover do mês passado para KPI renderizar (sempre bom ter)
            const turnoverAnterior = colAtivosAnterior > 0 ? (Math.random() * 2) : 0;`,
`            const turnoverAtual = colAtivosAtual > 0 ? (demissoesMesAtual / colAtivosAtual) * 100 : 0;
            const turnoverAnterior = colAtivosAnterior > 0 ? (demissoesMesAnterior / colAtivosAnterior) * 100 : 0;

            // Histórico Real de Ativos e Turnover para Sparklines
            const histAtivos = hist6Meses.map(m => {
                let count = 0;
                if (cols) {
                    cols.forEach(c => {
                        const dAdm = c.data_admissao ? new Date(c.data_admissao) : null;
                        const dDem = c.data_demissao ? new Date(c.data_demissao) : null;
                        const eraAtivo = dAdm && (dAdm.getFullYear() < m.ano || (dAdm.getFullYear() === m.ano && dAdm.getMonth() + 1 <= m.mes)) &&
                                        (!dDem || (dDem.getFullYear() > m.ano || (dDem.getFullYear() === m.ano && dDem.getMonth() + 1 > m.mes)));
                        if (eraAtivo) count++;
                    });
                }
                return count;
            });

            const histTurnover = hist6Meses.map((m, i) => {
                const ativosNaqueleMes = histAtivos[i];
                const demissoesNaqueleMes = demissoesPorMes[\`\${m.ano}-\${m.mes}\`] || 0;
                return ativosNaqueleMes > 0 ? (demissoesNaqueleMes / ativosNaqueleMes) * 100 : 0;
            });`
);

// 4. Update the KPIs response with real history
content = content.replace(
`                ativos: {
                    valor: colAtivosAtual,
                    variacao: calcularMoM(colAtivosAtual, colAtivosAnterior),
                    sparkline: hist6Meses.map(m => colAtivosAtual + Math.floor(Math.random() * 5 - 2)) // Mock visual para ativos
                },`,
`                ativos: {
                    valor: colAtivosAtual,
                    variacao: calcularMoM(colAtivosAtual, colAtivosAnterior),
                    sparkline: histAtivos
                },`
);

content = content.replace(
`                turnover: {
                    valor: turnoverAtual,
                    variacao: turnoverAtual - turnoverAnterior, // variação absoluta
                    sparkline: hist6Meses.map(m => Math.random() * 5)
                },`,
`                turnover: {
                    valor: turnoverAtual,
                    variacao: turnoverAtual - turnoverAnterior, // variação absoluta
                    sparkline: histTurnover
                },`
);

fs.writeFileSync('src/controllers/dashboardController.js', content, 'utf8');
console.log('Backend accuracy improved!');
