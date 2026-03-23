const fs = require('fs');
let content = fs.readFileSync('src/controllers/dashboardController.js', 'utf8');

content = content.replace(
`    async obterResumo(req, res) {
        try {
            const dataAtual = new Date();
            const mesAtual = dataAtual.getMonth() + 1;
            const anoAtual = dataAtual.getFullYear();`,
`    async obterResumo(req, res) {
        try {
            const dataAtual = new Date();
            const mesAtual = req.query.mes ? parseInt(req.query.mes) : (dataAtual.getMonth() + 1);
            const anoAtual = req.query.ano ? parseInt(req.query.ano) : dataAtual.getFullYear();
            const depFiltro = req.query.departamento || null;`
);

content = content.replace(
`            // ============================================
            // 1. COLABORADORES (Ativos, Inativos, Turnover, Departamentos, Contratações)
            // ============================================
            const { data: cols, error: errColab } = await supabase
                .from('colaboradores')
                .select('id, status, departamento, data_admissao, data_demissao, data_nascimento');`,
`            // ============================================
            // 1. COLABORADORES (Ativos, Inativos, Turnover, Departamentos, Contratações)
            // ============================================
            let queryCols = supabase
                .from('colaboradores')
                .select('id, cpf, status, departamento, data_admissao, data_demissao, data_nascimento');
            
            if (depFiltro) {
                queryCols = queryCols.eq('departamento', depFiltro);
            }
            
            const { data: cols, error: errColab } = await queryCols;`
);

content = content.replace(
`            const { data: folhas, error: errFolhas } = await supabase
                .from('folha_pagamento')
                .select('*')
                .gte('ano_referencia', anoFiltro);`,
`            let qFolha = supabase
                .from('folha_pagamento')
                .select('*')
                .gte('ano_referencia', anoFiltro);
            if (depFiltro && cols && cols.length > 0) {
                const cpfs = cols.filter(c => c.cpf).map(c => c.cpf);
                if (cpfs.length > 0) {
                    qFolha = qFolha.in('cpf', cpfs);
                }
            } else if (depFiltro) {
                qFolha = qFolha.eq('id', '00000000-0000-0000-0000-000000000000'); // Force empty
            }
            const { data: folhas, error: errFolhas } = await qFolha;`
);

content = content.replace(
`            const { data: bens, error: errBens } = await supabase
                .from('beneficios')
                .select('*')
                .gte('ano_referencia', anoFiltro);`,
`            let qBens = supabase
                .from('beneficios')
                .select('*')
                .gte('ano_referencia', anoFiltro);
            if (depFiltro && cols && cols.length > 0) {
                const cpfs = cols.filter(c => c.cpf).map(c => c.cpf);
                if (cpfs.length > 0) {
                    qBens = qBens.in('cpf', cpfs);
                }
            } else if (depFiltro) {
                qBens = qBens.eq('id', '00000000-0000-0000-0000-000000000000'); // Force empty
            }
            const { data: bens, error: errBens } = await qBens;`
);

content = content.replace(
`            const { data: vars, error: errVar } = await supabase
                .from('apuracao_variavel')
                .select('*')
                .gte('ano_referencia', anoFiltro);`,
`            let qVars = supabase
                .from('apuracao_variavel')
                .select('*')
                .gte('ano_referencia', anoFiltro);
            if (depFiltro && cols && cols.length > 0) {
                const cpfs = cols.filter(c => c.cpf).map(c => c.cpf);
                if (cpfs.length > 0) {
                    qVars = qVars.in('cpf', cpfs);
                }
            } else if (depFiltro) {
                qVars = qVars.eq('id', '00000000-0000-0000-0000-000000000000'); // Force empty
            }
            const { data: vars, error: errVar } = await qVars;`
);

fs.writeFileSync('src/controllers/dashboardController.js', content, 'utf8');
console.log('Updated backend controller!');
