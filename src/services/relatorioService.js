const supabase = require('../config/supabase');
const FolhaTemplate = require('../templates/folha.template');
const BeneficiosTemplate = require('../templates/beneficios.template');
const VariavelTemplate = require('../templates/variavel.template');
const ApontamentosTemplate = require('../templates/apontamentos.template');
const SegurosTemplate = require('../templates/seguros.template');

class RelatorioService {

    // ===== FOLHA DE PAGAMENTO =====
    static async gerarFolha(cpfs, periodo, opcoes = {}) {
        const { mes, ano } = periodo;

        // Buscar colaboradores
        const { data: colaboradores } = await supabase
            .from('colaboradores')
            .select('*')
            .in('cpf', cpfs);

        // Buscar folhas do período
        const { data: folhas } = await supabase
            .from('folha_pagamento')
            .select('*')
            .in('cpf', cpfs)
            .eq('mes_referencia', mes)
            .eq('ano_referencia', ano);

        // Combinar dados
        const dados = colaboradores.map(c => {
            const folha = folhas.find(f => f.cpf === c.cpf) || {};
            return {
                tipo_calculo: '11',
                codigo_folha: c.codigo_folha,
                nome_completo: c.nome_completo,
                salario_base: folha.salario_base || 0,
                horas_extras: (folha.horas_extras_50 || 0) + (folha.horas_extras_100 || 0),
                horas_extras_50: folha.horas_extras_50 || 0,
                horas_extras_100: folha.horas_extras_100 || 0,
                horas_noturnas: folha.horas_noturnas || 0,
                inss: folha.inss || 0,
                irrf: folha.irrf || 0,
                vale_transporte: folha.vale_transporte || 0,
                outros_descontos: folha.outros_descontos || 0,
                total_proventos: folha.total_proventos || 0,
                total_descontos: folha.total_descontos || 0,
                salario_liquido: folha.salario_liquido || 0
            };
        });

        // Calcular totais
        const totais = {
            salario_base: dados.reduce((sum, d) => sum + d.salario_base, 0),
            horas_extras: dados.reduce((sum, d) => sum + d.horas_extras, 0),
            inss: dados.reduce((sum, d) => sum + d.inss, 0),
            irrf: dados.reduce((sum, d) => sum + d.irrf, 0),
            total_proventos: dados.reduce((sum, d) => sum + d.total_proventos, 0),
            total_descontos: dados.reduce((sum, d) => sum + d.total_descontos, 0),
            liquido: dados.reduce((sum, d) => sum + d.salario_liquido, 0)
        };

        // Aplicar template
        const layout = FolhaTemplate.gerar(dados, totais, { mes, ano, ...opcoes });

        return {
            dados,
            totais,
            layout,
            metadata: {
                tipo: 'folha',
                periodo: { mes, ano },
                total_colaboradores: dados.length
            }
        };
    }

    // ===== BENEFÍCIOS CAJU =====
    static async gerarBeneficios(cpfs, periodo, opcoes = {}) {
        const { mes, ano } = periodo;

        const { data: colaboradores } = await supabase
            .from('colaboradores')
            .select('cpf, nome_completo, cidade')
            .in('cpf', cpfs);

        const { data: beneficios } = await supabase
            .from('beneficios_flexiveis')
            .select('*')
            .in('cpf', cpfs)
            .eq('mes_referencia', mes)
            .eq('ano_referencia', ano);

        const dados = colaboradores.map(c => {
            const ben = beneficios.find(b => b.cpf === c.cpf) || {};
            return {
                nome_completo: c.nome_completo,
                cidade: c.cidade,
                ferias: ben.ferias ? 'Sim' : 'Não',
                alimentacao: ben.alimentacao || 0,
                transporte: ben.transporte || 0,
                cultura: ben.cultura || 0,
                saude: ben.saude || 0,
                educacao: ben.educacao || 0,
                home_office: ben.home_office || 0,
                total_beneficios: ben.total_beneficios || 0
            };
        });

        const totais = {
            alimentacao: dados.reduce((sum, d) => sum + d.alimentacao, 0),
            transporte: dados.reduce((sum, d) => sum + d.transporte, 0),
            total: dados.reduce((sum, d) => sum + d.total_beneficios, 0)
        };

        const layout = BeneficiosTemplate.gerar(dados, totais, { mes, ano, ...opcoes });

        return { dados, totais, layout };
    }

    // ===== VARIÁVEL =====
    static async gerarVariavel(cpfs, periodo, opcoes = {}) {
        const { mes, ano } = periodo;

        const { data: colaboradores } = await supabase
            .from('colaboradores')
            .select('cpf, nome_completo')
            .in('cpf', cpfs);

        const { data: variaveis } = await supabase
            .from('apuracao_variavel')
            .select('*')
            .in('cpf', cpfs)
            .eq('mes_referencia', mes)
            .eq('ano_referencia', ano);

        const dados = colaboradores.map(c => {
            const v = variaveis.find(vr => vr.cpf === c.cpf) || {};
            return {
                nome_vendedor: c.nome_completo,
                // Caffeine
                caffeine_fat_meta: v.caffeine_fat_meta || 0,
                caffeine_fat_realizado: v.caffeine_fat_realizado || 0,
                caffeine_fat_percentual: v.caffeine_fat_percentual || 0,
                caffeine_pos_meta: v.caffeine_pos_meta || 0,
                caffeine_pos_realizado: v.caffeine_pos_realizado || 0,
                // Sublyme
                sublyme_fat_meta: v.sublyme_fat_meta || 0,
                sublyme_fat_realizado: v.sublyme_fat_realizado || 0,
                sublyme_fat_percentual: v.sublyme_fat_percentual || 0,
                // Koala
                koala_fat_meta: v.koala_fat_meta || 0,
                koala_fat_realizado: v.koala_fat_realizado || 0,
                koala_fat_percentual: v.koala_fat_percentual || 0,
                // Totais
                salario_base: v.salario_base || 0,
                multiplicador: v.multiplicador || 0,
                valor_variavel: v.valor_variavel || 0
            };
        });

        const totais = {
            valor_total: dados.reduce((sum, d) => sum + d.valor_variavel, 0)
        };

        const layout = VariavelTemplate.gerar(dados, totais, { mes, ano, ...opcoes });

        return { dados, totais, layout };
    }

    // ===== APONTAMENTOS =====
    static async gerarApontamentos(cpfs, periodo, opcoes = {}) {
        const { mes, ano } = periodo;

        const { data: colaboradores } = await supabase
            .from('colaboradores')
            .select('cpf, codigo_folha, nome_completo')
            .in('cpf', cpfs);

        const { data: apontamentos } = await supabase
            .from('apontamentos')
            .select('*')
            .in('cpf', cpfs)
            .eq('mes_referencia', mes)
            .eq('ano_referencia', ano);

        const dados = colaboradores.map(c => {
            const apt = apontamentos.find(a => a.cpf === c.cpf) || {};
            return {
                tipo_calculo: apt.tipo_calculo || '11',
                codigo_folha: c.codigo_folha,
                nome_completo: c.nome_completo,
                desc_autorizado: apt.desc_autorizado || 0,
                reembolso: apt.reembolso || 0,
                comissoes: apt.comissoes || 0,
                horas_extras_50: apt.horas_extras_50 || 0,
                horas_extras_100: apt.horas_extras_100 || 0,
                horas_noturnas: apt.horas_noturnas || 0,
                dias_faltas: apt.dias_faltas || 0
            };
        });

        const totais = {
            horas_extras_50: dados.reduce((sum, d) => sum + d.horas_extras_50, 0),
            horas_extras_100: dados.reduce((sum, d) => sum + d.horas_extras_100, 0),
            horas_noturnas: dados.reduce((sum, d) => sum + d.horas_noturnas, 0),
            dias_faltas: dados.reduce((sum, d) => sum + d.dias_faltas, 0)
        };

        const layout = ApontamentosTemplate.gerar(dados, totais, { mes, ano, ...opcoes });

        return { dados, totais, layout };
    }

    // ===== SEGUROS =====
    static async gerarSeguros(cpfs, opcoes = {}) {
        const { data: colaboradores } = await supabase
            .from('colaboradores')
            .select('cpf, nome_completo, cargo, data_nascimento, data_admissao')
            .in('cpf', cpfs);

        const { data: seguros } = await supabase
            .from('seguros_vida')
            .select('*')
            .in('cpf', cpfs)
            .eq('status', 'ativo');

        const dados = colaboradores.map(c => {
            const seg = seguros.find(s => s.cpf === c.cpf) || {};
            return {
                substipulamento: seg.substipulamento || '',
                modulo: seg.modulo || '',
                vigencia: seg.vigencia || '',
                nome_completo: c.nome_completo,
                cargo: c.cargo,
                data_nascimento: c.data_nascimento,
                data_admissao: c.data_admissao,
                cpf: c.cpf,
                sexo: seg.sexo || '',
                valor_segurado: seg.valor_segurado || 0
            };
        });

        const layout = SegurosTemplate.gerar(dados, {}, opcoes);

        return { dados, totais: {}, layout };
    }

    // ===== FICHA COMPLETA =====
    static async gerarFichaCompleta(cpfs) {
        // Buscar TODOS os dados de um colaborador
        const promises = cpfs.map(async (cpf) => {
            const { data: colaborador } = await supabase
                .from('vw_colaborador_completo')
                .select('*')
                .eq('cpf', cpf)
                .single();

            return colaborador;
        });

        const dados = await Promise.all(promises);

        return {
            dados,
            totais: {},
            layout: 'ficha_completa'
        };
    }

}

module.exports = RelatorioService;
