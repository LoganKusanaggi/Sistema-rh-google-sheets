const supabase = require('../config/supabase');
const FolhaTemplate = require('../templates/folha.template');
const BeneficiosTemplate = require('../templates/beneficios.template');
const VariavelTemplate = require('../templates/variavel.template');
const ApontamentosTemplate = require('../templates/apontamentos.template');
const SegurosTemplate = require('../templates/seguros.template');
const PlanosTemplate = require('../templates/planos.template');

function calcularIdade(dataNascimento) {
    if (!dataNascimento) return 0;

    const hoje = new Date();
    const nasc = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const diferencaMes = hoje.getMonth() - nasc.getMonth();

    if (diferencaMes < 0 || (diferencaMes === 0 && hoje.getDate() < nasc.getDate())) {
        idade--;
    }

    return idade;
}

function dataParaExcel(dataStr) {
    if (!dataStr) return '';
    return dataStr;
}

class RelatorioService {

    static normalizarListaCpfs(cpfs) {
        if (!Array.isArray(cpfs)) return [];

        const vistos = new Set();
        const lista = [];

        cpfs.forEach(cpf => {
            const cpfLimpo = String(cpf || '').replace(/\D/g, '');
            if (cpfLimpo.length !== 11) return;
            if (vistos.has(cpfLimpo)) return;

            vistos.add(cpfLimpo);
            lista.push(cpfLimpo);
        });

        return lista;
    }

    static tipoExigePeriodo(tipo) {
        return ['folha', 'beneficios', 'variavel', 'apontamentos', 'planos'].includes(tipo);
    }

    static intersectarListasCpfs(listaA, listaB) {
        if (!Array.isArray(listaA) || !Array.isArray(listaB)) return [];

        const cpfsB = new Set(listaB);
        return listaA.filter(cpf => cpfsB.has(cpf));
    }

    static async buscarCpfsColaboradoresPorFiltros(filtros) {
        const departamento = filtros && filtros.departamento ? String(filtros.departamento).trim() : '';
        const status = filtros && filtros.status ? String(filtros.status).trim().toLowerCase() : '';
        const statusColaborador = ['ativo', 'inativo', 'ferias', 'afastado'].includes(status) ? status : '';

        if (!departamento && !statusColaborador) {
            return null;
        }

        let query = supabase
            .from('colaboradores')
            .select('cpf')
            .not('cpf', 'is', null);

        if (departamento) {
            query = query.eq('departamento', departamento);
        }

        if (statusColaborador) {
            query = query.eq('status', statusColaborador);
        }

        const { data, error } = await query;
        if (error) throw error;

        return this.normalizarListaCpfs((data || []).map(item => item.cpf));
    }

    static async buscarCpfsBaseRelatorio(tipo, periodo, filtros) {
        let query = null;

        if (tipo === 'folha') {
            query = supabase
                .from('folha_pagamento')
                .select('cpf')
                .not('cpf', 'is', null);

            if (periodo) {
                query = query
                    .eq('mes_referencia', periodo.mes)
                    .eq('ano_referencia', periodo.ano);
            }

            const statusPagamento = filtros.status_pagamento ||
                (['pago', 'pendente'].includes(filtros.status) ? filtros.status : '');

            if (statusPagamento) {
                query = query.eq('status_pagamento', statusPagamento);
            }
        } else if (tipo === 'beneficios') {
            query = supabase
                .from('beneficios')
                .select('cpf')
                .not('cpf', 'is', null);

            if (periodo) {
                query = query
                    .eq('mes_referencia', periodo.mes)
                    .eq('ano_referencia', periodo.ano);
            }
        } else if (tipo === 'variavel') {
            query = supabase
                .from('apuracao_variavel')
                .select('cpf')
                .not('cpf', 'is', null);

            if (periodo) {
                query = query
                    .eq('mes_referencia', periodo.mes)
                    .eq('ano_referencia', periodo.ano);
            }

            if (filtros.status) {
                query = query.eq('status_aprovacao', filtros.status);
            }
        } else if (tipo === 'apontamentos') {
            query = supabase
                .from('apontamentos')
                .select('cpf')
                .not('cpf', 'is', null);

            if (periodo) {
                query = query
                    .eq('mes_referencia', periodo.mes)
                    .eq('ano_referencia', periodo.ano);
            }

            if (filtros.status) {
                query = query.eq('status', filtros.status);
            }
        } else if (tipo === 'seguros') {
            query = supabase
                .from('seguros')
                .select('cpf')
                .not('cpf', 'is', null);

            if (filtros.status) {
                query = query.eq('status', filtros.status);
            }
        } else if (tipo === 'planos') {
            return null;
        }

        if (!query) {
            return null;
        }

        const { data, error } = await query;
        if (error) throw error;

        return this.normalizarListaCpfs((data || []).map(item => item.cpf));
    }

    static async resolverCpfsPorFiltros(tipo, periodo, filtros) {
        const filtrosNormalizados = {
            departamento: filtros && filtros.departamento ? String(filtros.departamento).trim() : '',
            status: filtros && filtros.status ? String(filtros.status).trim().toLowerCase() : '',
            status_pagamento: filtros && filtros.status_pagamento ? String(filtros.status_pagamento).trim().toLowerCase() : ''
        };

        const cpfsColaboradores = await this.buscarCpfsColaboradoresPorFiltros(filtrosNormalizados);
        const cpfsBase = await this.buscarCpfsBaseRelatorio(tipo, periodo, filtrosNormalizados);

        if (cpfsColaboradores && cpfsBase) {
            return this.intersectarListasCpfs(cpfsColaboradores, cpfsBase);
        }

        if (cpfsColaboradores) return cpfsColaboradores;
        if (cpfsBase) return cpfsBase;

        return [];
    }

    static async executarGeradorPorTipo(tipo, cpfs, periodo, opcoes) {
        switch (tipo) {
            case 'folha':
                return this.gerarFolha(cpfs, periodo, opcoes);
            case 'beneficios':
                return this.gerarBeneficios(cpfs, periodo, opcoes);
            case 'variavel':
                return this.gerarVariavel(cpfs, periodo, opcoes);
            case 'apontamentos':
                return this.gerarApontamentos(cpfs, periodo, opcoes);
            case 'seguros':
                return this.gerarSeguros(cpfs, opcoes);
            case 'planos':
                return this.gerarPlanos(cpfs, periodo, opcoes);
            default:
                return {
                    success: false,
                    error: 'Tipo de relatório não suportado: ' + tipo
                };
        }
    }

    static async gerarRelatorio(payload) {
        const entrada = payload || {};
        const tipo = String(entrada.tipo || entrada.tipoRelatorio || '').trim().toLowerCase();
        const filtros = entrada.filtros && typeof entrada.filtros === 'object' ? entrada.filtros : {};
        const cpfsInformados = this.normalizarListaCpfs(entrada.cpfs);
        const formato = entrada.formato || 'json';
        const geracaoPorFiltros = cpfsInformados.length === 0;

        let periodo = null;
        if (entrada.periodo && typeof entrada.periodo === 'object') {
            const mes = parseInt(entrada.periodo.mes, 10);
            const ano = parseInt(entrada.periodo.ano, 10);

            if (!isNaN(mes) && !isNaN(ano)) {
                periodo = { mes: mes, ano: ano };
            }
        }

        if (!tipo) {
            return { success: false, error: 'Tipo de relatório é obrigatório.' };
        }

        if (this.tipoExigePeriodo(tipo) && (!periodo || !periodo.mes || !periodo.ano)) {
            return { success: false, error: 'Competência inválida ou não informada para este relatório.' };
        }

        let cpfs = cpfsInformados;
        if (cpfs.length === 0) {
            cpfs = await this.resolverCpfsPorFiltros(tipo, periodo, filtros);
        }

        if (!cpfs || cpfs.length === 0) {
            return { success: false, error: 'Nenhum registro encontrado para os filtros informados.' };
        }

        const resultado = await this.executarGeradorPorTipo(tipo, cpfs, periodo, {
            filtros: filtros,
            formato: formato
        });

        if (!resultado || resultado.success === false) {
            return resultado || { success: false, error: 'Falha ao gerar o relatório.' };
        }

        if (geracaoPorFiltros && (!resultado.dados || resultado.dados.length === 0)) {
            return { success: false, error: 'Nenhum registro encontrado para os filtros informados.' };
        }

        return {
            success: true,
            layout: resultado.layout,
            dados: resultado.dados,
            totais: resultado.totais,
            metadata: resultado.metadata || {},
            total: Array.isArray(resultado.dados) ? resultado.dados.length : 0,
            filtros_aplicados: {
                departamento: filtros.departamento || null,
                status: filtros.status || null,
                status_pagamento: filtros.status_pagamento || null,
                periodo: periodo
            }
        };
    }

    static async gerarFolha(cpfs, periodo, opcoes = {}) {
        const { data: folhasProcessadas, error: erroFolhas } = await supabase
            .from('folha_pagamento')
            .select('*')
            .in('cpf', cpfs)
            .eq('mes_referencia', periodo.mes)
            .eq('ano_referencia', periodo.ano);

        if (erroFolhas) throw erroFolhas;

        const { data: colaboradores, error: erroColaboradores } = await supabase
            .from('colaboradores')
            .select('*')
            .in('cpf', cpfs);

        if (erroColaboradores) throw erroColaboradores;

        const dados = (colaboradores || []).map(c => {
            const f = folhasProcessadas ? folhasProcessadas.find(folha => folha.cpf === c.cpf) : null;

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
                vl_100_amil: f ? f.vl_100_amil : 0,
                vl_empresa_amil: f ? f.vl_empresa_amil : 0,
                vl_func_amil: f ? f.vl_func_amil : 0,
                amil_saude_dep: f ? f.amil_saude_dep : 0,
                odonto_func: f ? f.odont_func : 0,
                odonto_dep: f ? f.odont_dep : 0
            };
        });

        const totais = {};
        const layout = FolhaTemplate.gerar(dados, totais, periodo);

        return {
            dados: dados,
            totais: totais,
            layout: layout,
            metadata: {
                tipo: 'folha',
                periodo: periodo,
                total_colaboradores: dados.length
            }
        };
    }

    static async gerarBeneficios(cpfs, periodo, opcoes = {}) {
        const mes = periodo.mes;
        const ano = periodo.ano;

        const { data: colaboradores, error: erroColaboradores } = await supabase
            .from('colaboradores')
            .select('id, cpf, nome_completo, cidade')
            .in('cpf', cpfs);

        if (erroColaboradores) throw erroColaboradores;

        const { data: beneficiosCaju, error: erroBeneficios } = await supabase
            .from('beneficios')
            .select('*')
            .in('cpf', cpfs)
            .eq('mes_referencia', mes)
            .eq('ano_referencia', ano);

        if (erroBeneficios) throw erroBeneficios;

        const dados = (colaboradores || []).map(c => {
            const registros = (beneficiosCaju || []).filter(item => item.cpf === c.cpf);
            let alimentacao = 0;
            let transporte = 0;

            registros.forEach(item => {
                if (item.tipo_beneficio === 'vale_alimentacao') {
                    alimentacao += parseFloat(item.valor_total || item.valor || 0);
                } else if (item.tipo_beneficio === 'vale_transporte') {
                    transporte += parseFloat(item.valor_total || item.valor || 0);
                }
            });

            return {
                colaborador_id: c.id,
                cpf: c.cpf,
                nome_completo: c.nome_completo,
                cidade: c.cidade,
                ferias: '',
                alimentacao: alimentacao,
                transporte: transporte,
                cultura: 0,
                saude: 0,
                educacao: 0,
                home_office: 0,
                total_beneficios: alimentacao + transporte
            };
        });

        const totais = {
            alimentacao: dados.reduce((sum, item) => sum + item.alimentacao, 0),
            transporte: dados.reduce((sum, item) => sum + item.transporte, 0),
            total: dados.reduce((sum, item) => sum + item.total_beneficios, 0)
        };

        const layout = BeneficiosTemplate.gerar(dados, totais, { mes: mes, ano: ano });
        return { dados: dados, totais: totais, layout: layout };
    }

    static async gerarVariavel(cpfs, periodo, opcoes = {}) {
        const mes = periodo.mes;
        const ano = periodo.ano;

        const { data: colaboradores, error: erroColaboradores } = await supabase
            .from('colaboradores')
            .select('id, cpf, nome_completo')
            .in('cpf', cpfs);

        if (erroColaboradores) throw erroColaboradores;

        const { data: variaveis, error: erroVariaveis } = await supabase
            .from('apuracao_variavel')
            .select('*')
            .in('cpf', cpfs)
            .eq('mes_referencia', mes)
            .eq('ano_referencia', ano);

        if (erroVariaveis) throw erroVariaveis;

        const dados = (colaboradores || []).map(c => {
            const v = (variaveis || []).find(vr => vr.cpf === c.cpf) || {};
            return {
                colaborador_id: c.id,
                cpf: c.cpf,
                nome_vendedor: c.nome_completo,
                caffeine_fat_meta: v.caffeine_fat_meta || 0,
                caffeine_fat_realizado: v.caffeine_fat_realizado || 0,
                caffeine_fat_percentual: 0,
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

        const totais = {
            valor_total: dados.reduce((sum, item) => sum + item.valor_variavel, 0)
        };

        const layout = VariavelTemplate.gerar(dados, totais, { mes: mes, ano: ano });
        return { dados: dados, totais: totais, layout: layout };
    }

    static async gerarApontamentos(cpfs, periodo, opcoes = {}) {
        const mes = periodo.mes;
        const ano = periodo.ano;

        const { data: colaboradores, error: erroColaboradores } = await supabase
            .from('colaboradores')
            .select('id, cpf, codigo_folha, nome_completo')
            .in('cpf', cpfs);

        if (erroColaboradores) throw erroColaboradores;

        const dados = (colaboradores || []).map(c => ({
            colaborador_id: c.id,
            cpf: c.cpf,
            tipo_calculo: '11',
            codigo_folha: c.codigo_folha,
            nome_completo: c.nome_completo,
            desc_autorizado: 0,
            reembolso: 0,
            comissoes: 0,
            horas_extras_50: 0,
            horas_extras_100: 0,
            horas_noturnas: 0,
            dias_faltas: 0
        }));

        const totais = {
            horas_extras_50: 0,
            horas_extras_100: 0,
            horas_noturnas: 0,
            dias_faltas: 0
        };

        const layout = ApontamentosTemplate.gerar(dados, totais, { mes: mes, ano: ano });
        return { dados: dados, totais: totais, layout: layout };
    }

    static async gerarSeguros(cpfs, opcoes = {}) {
        const { data: colaboradores, error: erroColaboradores } = await supabase
            .from('colaboradores')
            .select('id, cpf, nome_completo, cargo, data_nascimento, data_admissao')
            .in('cpf', cpfs);

        if (erroColaboradores) throw erroColaboradores;

        const { data: seguros, error: erroSeguros } = await supabase
            .from('seguros')
            .select('*')
            .in('cpf', cpfs)
            .eq('status', 'ativo');

        if (erroSeguros) throw erroSeguros;

        const dados = (colaboradores || []).map(c => {
            const seg = (seguros || []).find(item => item.colaborador_id === c.id) || {};
            return {
                substipulamento: '',
                modulo: '',
                vigencia: '',
                nome_completo: c.nome_completo,
                cargo: c.cargo,
                data_nascimento: c.data_nascimento,
                data_admissao: c.data_admissao,
                cpf: c.cpf,
                sexo: '',
                seguradora: seg.seguradora || '',
                apolice: seg.apolice || ''
            };
        });

        const layout = SegurosTemplate.gerar(dados, {}, opcoes);
        return { dados: dados, totais: {}, layout: layout };
    }

    static async gerarPlanos(cpfs, periodo, opcoes = {}) {
        const { data: colaboradores, error: erroColaboradores } = await supabase
            .from('colaboradores')
            .select('*')
            .in('cpf', cpfs);

        if (erroColaboradores) throw erroColaboradores;

        const ids = (colaboradores || []).map(c => c.id);

        const { data: plansAssignments, error: erroPlanos } = await supabase
            .from('colaboradores_planos')
            .select('*, plano:planos(*)')
            .in('colaborador_id', ids);

        if (erroPlanos) throw erroPlanos;

        const { data: dependentes, error: erroDependentes } = await supabase
            .from('dependentes')
            .select('*')
            .in('colaborador_id', ids);

        if (erroDependentes) throw erroDependentes;

        const { data: precos, error: erroPrecos } = await supabase
            .from('planos_precos')
            .select('*');

        if (erroPrecos) throw erroPrecos;

        const rows = [];
        let totalEmpresa = 0;
        let totalFunc = 0;

        (colaboradores || []).forEach(colab => {
            const assignments = (plansAssignments || []).filter(pa => pa.colaborador_id === colab.id);
            const deps = (dependentes || []).filter(d => d.colaborador_id === colab.id);

            assignments.forEach(assign => {
                const plano = assign.plano;
                if (!plano) return;

                const idadeTit = calcularIdade(colab.data_nascimento);
                const precoTit = (precos || []).find(p => p.plano_id === plano.id && idadeTit >= p.idade_min && idadeTit <= p.idade_max);
                const valorTit = precoTit ? precoTit.valor : 0;

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

                deps.forEach(dep => {
                    const idadeDep = calcularIdade(dep.data_nasc);
                    const precoDep = (precos || []).find(p => p.plano_id === plano.id && idadeDep >= p.idade_min && idadeDep <= p.idade_max);
                    const valorDep = precoDep ? precoDep.valor : 0;

                    const parteJoseDep = valorDep;
                    const parteEmpresaDep = 0;

                    totalEmpresa += parteEmpresaDep;
                    totalFunc += parteJoseDep;

                    rows.push({
                        colaborador_id: colab.id,
                        nome_colaborador: colab.nome_completo,
                        matricula_plano: dep.matricula || '',
                        tipo_beneficiario: 'DEPENDENTE',
                        parentesco: dep.parentesco,
                        data_nascimento: dep.data_nasc,
                        idade: idadeDep,
                        nome_plano: plano.nome,
                        valor_tabela: valorDep,
                        parte_empresa: parteEmpresaDep,
                        parte_colaborador: parteJoseDep
                    });
                });
            });
        });

        const totais = {
            total_empresa: totalEmpresa,
            total_colaborador: totalFunc,
            total_geral: totalEmpresa + totalFunc
        };

        const layout = PlanosTemplate.gerar(rows, totais, periodo);
        return { dados: rows, totais: totais, layout: layout };
    }
}

module.exports = RelatorioService;
