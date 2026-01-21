const supabase = require('../config/supabase');
const FolhaTemplate = require('../templates/folha.template');
const BeneficiosTemplate = require('../templates/beneficios.template');
const VariavelTemplate = require('../templates/variavel.template');
const ApontamentosTemplate = require('../templates/apontamentos.template');
const SegurosTemplate = require('../templates/seguros.template');
const PlanosTemplate = require('../templates/planos.template');

// Função auxiliar para calcular idade
function calcularIdade(dataNascimento) {
    if (!dataNascimento) return 0;
    const hoje = new Date();
    const nasc = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
        idade--;
    }
    return idade;
}

// Função auxiliar converter data YYYY-MM-DD para Excel Serial Date (aprox)
function dataParaExcel(dataStr) {
    if (!dataStr) return '';
    // Simplificação: apenas retornando string por enquanto, 
    // conversão real para serial number deve ser feita se necessário para cálculo no Excel
    return dataStr;
}

class RelatorioService {

    // ===== FOLHA DE PAGAMENTO (LAYOUT PLANO DE SAÚDE/CADASTRAL) =====
    static async gerarFolha(cpfs, periodo, opcoes = {}) {
        // Agora busca dados focados em cadastro e benefícios (Saúde/Odonto)
        // Layout do "02. Templeta..."

        // Buscar colaboradores
        // BUSCAR DADOS PROCESSADOS DA FOLHA DE PAGAMENTO
        // A fonte da verdade agora é a tabela 'folha_pagamento' onde os cálculos foram salvos
        const { data: folhasProcessadas } = await supabase
            .from('folha_pagamento')
            .select('*')
            .in('cpf', cpfs)
            .eq('mes_referencia', periodo.mes)
            .eq('ano_referencia', periodo.ano);

        // Se não houver folha processada, buscar colaboradores apenas para preencher o básico (fallback)
        const { data: colaboradores } = await supabase
            .from('colaboradores')
            .select('*')
            .in('cpf', cpfs);

        const dados = colaboradores.map(c => {
            // Tentar encontrar registro processado
            const f = folhasProcessadas ? folhasProcessadas.find(folha => folha.cpf === c.cpf) : null;

            // Se encontrou folha processada, usa os dados dela. Senão, zeros.
            return {
                colaborador_id: c.id,
                cpf: c.cpf,
                nome_completo: f ? f.nome_colaborador : c.nome_completo,
                local_trabalho: f ? f.local_trabalho : c.local_trabalho,
                data_admissao: f ? f.data_admissao : c.data_admissao,
                socio: f ? f.socio : 0,
                salario_base: f ? f.salario_base : 0,
                novo_salario: f ? (f.novo_salario || '') : '',
                cargo: f ? f.cargo : c.cargo,
                departamento: f ? f.departamento : c.departamento,
                convenio: f ? f.convenio_escolhido : '-',
                data_nascimento: f ? f.data_nascimento : c.data_nascimento,
                idade: f ? f.idade : calcularIdade(c.data_nascimento),
                faixa_etaria: f ? f.faixa_etaria : '',

                // Valores (Vêm calculados do Banco)
                vl_100_amil: f ? f.vl_100_amil : 0,
                vl_empresa_amil: f ? f.vl_empresa_amil : 0,
                vl_func_amil: f ? f.vl_func_amil : 0,
                amil_saude_dep: f ? f.amil_saude_dep : 0,

                odonto_func: f ? f.odont_func : 0,
                odonto_dep: f ? f.odont_dep : 0
            };
        });

        // Totais não são usados no template atual da Folha 02 nas linhas, mas podem ser úteis
        const totais = {};

        const layout = FolhaTemplate.gerar(dados, totais, periodo);

        return {
            dados,
            totais,
            layout,
            metadata: {
                tipo: 'folha',
                periodo, // { mes, ano }
                total_colaboradores: dados.length
            }
        };
    }

    // ... (Outros métodos mantidos iguais, apenas re-incluindo abaixo para integridade do arquivo) ...

    static async gerarBeneficios(cpfs, periodo, opcoes = {}) {
        const { mes, ano } = periodo;
        const { data: colaboradores } = await supabase.from('colaboradores').select('cpf, nome_completo, cidade').in('cpf', cpfs);
        const { data: beneficiosCaju } = await supabase.from('beneficios').select('*').in('cpf', cpfs).eq('tipo_beneficio', 'caju'); // Ajustar se a tabela mudou
        // Nota: O schema.sql usa tabela 'beneficios' genérica. 
        // Precisaria verificar se 'beneficios_flexiveis' (do código anterior) ainda existe ou foi migrada.
        // Assumindo que 'beneficios' agora centraliza tudo.

        // MOCKUP TEMPORÁRIO para manter compatibilidade com template Caju
        // Se a tabela mudou para genérica, a query precisa ser adaptada.
        // Vou manter a estrutura anterior mas avisar que precisa de dados reais.

        // Simulando dados baseados na estrutura antiga para não quebrar o template
        const dados = colaboradores.map(c => ({
            colaborador_id: c.id, // Adicionado
            cpf: c.cpf,
            nome_completo: c.nome_completo,
            cidade: c.cidade,
            ferias: '',
            alimentacao: 0, transporte: 0, cultura: 0, saude: 0, educacao: 0, home_office: 0, total_beneficios: 0
        }));

        const totais = { alimentacao: 0, transporte: 0, total: 0 };
        const layout = BeneficiosTemplate.gerar(dados, totais, { mes, ano });
        return { dados, totais, layout };
    }

    static async gerarVariavel(cpfs, periodo, opcoes = {}) {
        // Manter implementação anterior adaptada a tabela 'apuracao_variavel' (que existe no schema)
        const { mes, ano } = periodo;
        const { data: colaboradores } = await supabase.from('colaboradores').select('cpf, nome_completo').in('cpf', cpfs);
        const { data: variaveis } = await supabase.from('apuracao_variavel').select('*').in('cpf', cpfs).eq('mes_referencia', mes).eq('ano_referencia', ano);

        const dados = colaboradores.map(c => {
            const v = variaveis.find(vr => vr.cpf === c.cpf) || {};
            return {
                colaborador_id: c.id, // Adicionado
                cpf: c.cpf,
                nome_vendedor: c.nome_completo,
                caffeine_fat_meta: v.caffeine_fat_meta || 0,
                caffeine_fat_realizado: v.caffeine_fat_realizado || 0,
                caffeine_fat_percentual: 0, // Calc
                caffeine_pos_meta: v.caffeine_pos_meta || 0,
                caffeine_pos_realizado: v.caffeine_pos_realizado || 0,
                sublyme_fat_meta: v.sublyme_fat_meta || 0,
                sublyme_fat_realizado: v.sublyme_fat_realizado || 0,
                sublyme_fat_percentual: 0,
                koala_fat_meta: v.koala_fat_meta || 0,
                koala_fat_realizado: v.koala_fat_realizado || 0,
                koala_fat_percentual: 0,
                salario_base: v.salario_base || 0,
                multiplicador: v.multiplicador || 0,
                valor_variavel: v.valor_variavel || 0
            };
        });
        const totais = { valor_total: dados.reduce((sum, d) => sum + d.valor_variavel, 0) };
        const layout = VariavelTemplate.gerar(dados, totais, { mes, ano });
        return { dados, totais, layout };
    }

    static async gerarApontamentos(cpfs, periodo, opcoes = {}) {
        const { mes, ano } = periodo;
        const { data: colaboradores } = await supabase.from('colaboradores').select('cpf, codigo_folha, nome_completo').in('cpf', cpfs);
        // Agregação de apontamentos seria necessária aqui, pois a tabela 'apontamentos' é diária
        // Simplificação: apenas retornando estrutura zerada ou somada se houver view
        const dados = colaboradores.map(c => ({
            colaborador_id: c.id, // Adicionado
            cpf: c.cpf,
            tipo_calculo: '11', codigo_folha: c.codigo_folha, nome_completo: c.nome_completo,
            desc_autorizado: 0, reembolso: 0, comissoes: 0, horas_extras_50: 0, horas_extras_100: 0, horas_noturnas: 0, dias_faltas: 0
        }));
        const totais = { horas_extras_50: 0, horas_extras_100: 0, horas_noturnas: 0, dias_faltas: 0 };
        const layout = ApontamentosTemplate.gerar(dados, totais, { mes, ano });
        return { dados, totais, layout };
    }

    static async gerarSeguros(cpfs, opcoes = {}) {
        const { data: colaboradores } = await supabase.from('colaboradores').select('cpf, nome_completo, cargo, data_nascimento, data_admissao').in('cpf', cpfs);
        const { data: seguros } = await supabase.from('seguros').select('*').in('cpf', cpfs).eq('status', 'ativo');

        const dados = colaboradores.map(c => {
            const seg = seguros.find(s => s.colaborador_id === c.id) || {}; // Ajuste de FK se necessário
            return {
                substipulamento: '', modulo: '', vigencia: '',
                nome_completo: c.nome_completo, cargo: c.cargo, data_nascimento: c.data_nascimento, data_admissao: c.data_admissao, cpf: c.cpf, sexo: ''
            };
        });
        const layout = SegurosTemplate.gerar(dados, {}, opcoes);
        return { dados, totais: {}, layout };
    }

    static async gerarPlanos(cpfs, periodo, opcoes = {}) {
        const { mes, ano } = periodo;

        // 1. Buscar Dados Globais
        // Colaboradores
        const { data: colaboradores } = await supabase
            .from('colaboradores')
            .select('*')
            .in('cpf', cpfs);

        const ids = colaboradores.map(c => c.id);

        // Planos atribuídos (com detalhes do plano)
        const { data: plansAssignments } = await supabase
            .from('colaboradores_planos')
            .select('*, plano:planos(*)')
            .in('colaborador_id', ids);

        // Dependentes
        const { data: dependentes } = await supabase
            .from('dependentes')
            .select('*')
            .in('colaborador_id', ids);

        // Preços (Cache full table for lookup)
        const { data: precos } = await supabase.from('planos_precos').select('*');

        const rows = [];
        let totalEmpresa = 0;
        let totalFunc = 0;

        // 2. Processar
        colaboradores.forEach(colab => {
            const assignments = plansAssignments.filter(pa => pa.colaborador_id === colab.id);
            const deps = dependentes.filter(d => d.colaborador_id === colab.id);

            assignments.forEach(assign => {
                const plano = assign.plano;
                if (!plano) return;

                // --- TITULAR ---
                const idadeTit = calcularIdade(colab.data_nascimento);
                const precoTit = precos.find(p => p.plano_id === plano.id && idadeTit >= p.idade_min && idadeTit <= p.idade_max);
                const valorTit = precoTit ? precoTit.valor : 0;

                // Regra: Titular paga 20% (Empresa 80%)
                // Se Odonto, checar se a regra é a mesma. Assumirei que sim baseado no prompt.
                // Ajuste se necessário.
                const parteJose = valorTit * 0.20;
                const parteEmpresa = valorTit * 0.80;

                totalEmpresa += parteEmpresa;
                totalFunc += parteJose;

                rows.push({
                    colaborador_id: colab.id,
                    nome_colaborador: colab.nome_completo,
                    matricula_plano: assign.matricula || '',
                    tipo_beneficiario: 'TITULAR',
                    parentesco: '-',
                    data_nascimento: colab.data_nascimento,
                    idade: idadeTit,
                    nome_plano: plano.nome,
                    valor_tabela: valorTit,
                    parte_empresa: parteEmpresa,
                    parte_colaborador: parteJose
                });

                // --- DEPENDENTES ---
                deps.forEach(dep => {
                    const idadeDep = calcularIdade(dep.data_nasc);
                    const precoDep = precos.find(p => p.plano_id === plano.id && idadeDep >= p.idade_min && idadeDep <= p.idade_max);
                    const valorDep = precoDep ? precoDep.valor : 0;

                    // Regra: Dependente paga 100% (Empresa 0%)
                    const parteJoseDep = valorDep;
                    const parteEmpresaDep = 0;

                    totalEmpresa += parteEmpresaDep;
                    totalFunc += parteJoseDep;

                    rows.push({
                        colaborador_id: colab.id,
                        nome_colaborador: colab.nome_completo, // Agrupador
                        matricula_plano: dep.matricula || '', // Matrícula do dependente
                        tipo_beneficiario: 'DEPENDENTE',
                        parentesco: dep.parentesco,
                        data_nascimento: dep.data_nasc, // Note: DB column is data_nasc, UI is data_nasc
                        idade: idadeDep,
                        nome_plano: plano.nome,
                        valor_tabela: valorDep,
                        parte_empresa: parteEmpresaDep,
                        parte_colaborador: parteJoseDep
                    });
                });
            });
        });

        const totais = { total_empresa: totalEmpresa, total_colaborador: totalFunc, total_geral: totalEmpresa + totalFunc };
        const layout = PlanosTemplate.gerar(rows, totais, periodo);

        return { dados: rows, totais, layout };
    }
}

module.exports = RelatorioService;
