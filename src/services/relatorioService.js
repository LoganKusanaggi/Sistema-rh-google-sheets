const supabase = require('../config/supabase');
const FolhaTemplate = require('../templates/folha.template');
const BeneficiosTemplate = require('../templates/beneficios.template');
const VariavelTemplate = require('../templates/variavel.template');
const ApontamentosTemplate = require('../templates/apontamentos.template');
const SegurosTemplate = require('../templates/seguros.template');

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
        const { data: colaboradores } = await supabase
            .from('colaboradores')
            .select('*')
            .in('cpf', cpfs);

        // Buscar Benefícios (filtrando saúde/odonto)
        const { data: beneficios } = await supabase
            .from('beneficios')
            .select('*')
            .in('cpf', cpfs)
            .in('tipo_beneficio', ['plano_saude', 'plano_odontologico']);

        const dados = colaboradores.map(c => {
            // Encontrar benefícios deste colaborador
            const saude = beneficios.find(b => b.cpf === c.cpf && b.tipo_beneficio === 'plano_saude');
            const odonto = beneficios.find(b => b.cpf === c.cpf && b.tipo_beneficio === 'plano_odontologico');

            // Calcular idade
            const idade = calcularIdade(c.data_nascimento);

            return {
                nome_completo: c.nome_completo,
                local_trabalho: c.local_trabalho,
                data_admissao: c.data_admissao,
                socio: '', // Campo não mapeado no banco ainda
                salario_base: 0, // Precisa buscar salário atual (talvez na folha?)
                novo_salario: '',
                cargo: c.cargo,
                departamento: c.departamento,
                convenio: saude ? saude.descricao : '-', // Ex: "AMIL 2"
                data_nascimento: c.data_nascimento,
                idade: idade,
                faixa_etaria: '', // Lógica de faixa etária a implementar

                // Valores - Assumindo que o banco guarda o valor total e descontos
                // A lógica de divisão (empresa vs func) pode estar no banco ou ser regra de negócio fixa
                vl_100_amil: saude ? saude.valor_total : 0,
                vl_empresa_amil: saude ? (saude.valor_total - (saude.valor || 0)) : 0, // Total - Desconto
                vl_func_amil: saude ? saude.valor : 0, // Valor descontado
                amil_saude_dep: 0, // Dependentes não mapeados explicitamente no schema atual

                odonto_func: odonto ? odonto.valor : 0,
                odonto_dep: 0
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
}

module.exports = RelatorioService;
