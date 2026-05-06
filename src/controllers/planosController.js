const supabase = require('../config/supabase');

module.exports = {
    // Listar todos os planos (Catalogo)
    async listar(req, res) {
        try {
            // Fetch plans and their prices
            const { data, error } = await supabase
                .from('planos')
                .select(`
            *,
            precos:planos_precos(*)
        `)
                .order('nome');

            if (error) throw error;

            res.json({ success: true, data });
        } catch (error) {
            console.error('Erro ao listar planos:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Obter planos de um colaborador
    async obterDoColaborador(req, res) {
        try {
            const { id } = req.params;

            const { data, error } = await supabase
                .from('colaboradores_planos')
                .select(`
            *,
            plano:planos(*)
        `)
                .eq('colaborador_id', id)
                .eq('colaborador_id', id);
            // .eq('ativo', true); // Removido para permitir carregar planos inativos no modal (e reativar ao salvar)

            if (error) throw error;

            res.json({ success: true, data });
        } catch (error) {
            console.error('Erro ao obter planos do colaborador:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Atribuir/Atualizar plano para colaborador
    async atribuir(req, res) {
        try {
            const { id } = req.params; // Colaborador ID (UUID)
            const { plano_id, matricula } = req.body;

            // Check if plan exists and get its type
            const { data: planoInfo, error: pError } = await supabase
                .from('planos')
                .select('tipo')
                .eq('id', plano_id)
                .single();

            if (pError || !planoInfo) throw new Error('Plano não encontrado');

            // 0. Get dependent count for sync
            const { count: depsCount } = await supabase
                .from('dependentes')
                .select('*', { count: 'exact', head: true })
                .eq('colaborador_id', id);

            const pid = parseInt(plano_id, 10);

            // STRATEGY: Directly UPSERT based on the constraint (colaborador_id, plano_id)
            // But wait, the constraint is on (colaborador_id, plano_id), so we can have multiple plans for different products.
            // The requirement likely is: "Only one SAUDE plan per user".
            // So we must first deactivate any OTHER plan of the same type.

            // 1. Deactivate ALL other plans of the same type
            if (planoInfo.tipo) {
                // Find IDs of plans with the same type
                const { data: plansOfType } = await supabase
                    .from('planos')
                    .select('id')
                    .eq('tipo', planoInfo.tipo);

                if (plansOfType && plansOfType.length > 0) {
                    const planIds = plansOfType.map(p => p.id);
                    await supabase
                        .from('colaboradores_planos')
                        .update({ ativo: false })
                        .eq('colaborador_id', id)
                        .in('plano_id', planIds)
                        .neq('plano_id', pid); // Do not deactivate the one we are about to save
                }
            }

            // 2. Atomic UPSERT using separate query to avoid race conditions
            // We use upsert with onConflict to handle the unique constraint gracefully
            const { data, error: upsertError } = await supabase
                .from('colaboradores_planos')
                .upsert({
                    colaborador_id: id,
                    plano_id: pid,
                    matricula: matricula || null,
                    dependentes: depsCount || 0,
                    ativo: true
                }, {
                    onConflict: 'colaborador_id,plano_id',
                    ignoreDuplicates: false // We want to update if exists
                })
                .select()
                .single();

            if (upsertError) throw upsertError;

            res.json({ success: true, message: 'Plano salvo com sucesso.' });

        } catch (error) {
            console.error('Erro ao atribuir plano:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Erro interno',
                details: error
            });
        }
    },

    // Remover (Desativar) plano
    async remover(req, res) {
        try {
            const { id, planoId } = req.params; // User ID, Plan Assignment ID? 

            const targetPlanoId = req.params.planoId; // The Plan Product ID (int)

            const { data, error } = await supabase
                .from('colaboradores_planos')
                .update({ ativo: false })
                .eq('colaborador_id', id)
                .eq('plano_id', targetPlanoId);

            if (error) throw error;

            res.json({ success: true, message: 'Plano desativado com sucesso.' });

        } catch (error) {
            console.error('Erro ao remover plano:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // === ADMIN FUNCTIONS ===

    // Listar todos os planos incluindo inativos (Admin)
    async adminListarCompleto(req, res) {
        try {
            const { data, error } = await supabase
                .from('planos')
                .select(`
                    *,
                    precos:planos_precos(*)
                `)
                .order('nome');

            if (error) throw error;
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Salvar ou Atualizar Plano (Admin)
    async adminSalvar(req, res) {
        try {
            const { id, nome, tipo, codigo_ref, ativo, precos } = req.body;

            // 1. Salvar o Plano
            const planoData = { 
                nome, 
                tipo, 
                codigo_ref, 
                ativo: ativo !== false 
            };
            
            let planoId = id;

            if (id) {
                const { error } = await supabase.from('planos').update(planoData).eq('id', id);
                if (error) throw error;
            } else {
                const { data, error } = await supabase.from('planos').insert(planoData).select('id').single();
                if (error) throw error;
                planoId = data.id;
            }

            // 2. Salvar Preços (se fornecidos)
            if (precos && Array.isArray(precos)) {
                // Preparar dados de preços
                const precosData = precos.map(p => ({
                    plano_id: planoId,
                    faixa_etaria: p.faixa_etaria,
                    valor: parseFloat(p.valor) || 0,
                    ativo: p.ativo !== false
                }));

                // UPSERT preços baseados na restrição (plano_id, faixa_etaria)
                const { error: pError } = await supabase
                    .from('planos_precos')
                    .upsert(precosData, { onConflict: 'plano_id,faixa_etaria' });
                
                if (pError) throw pError;
            }

            res.json({ success: true, message: 'Plano e preços salvos com sucesso.', id: planoId });
        } catch (error) {
            console.error('Erro ao salvar plano (admin):', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Excluir ou Inativar Plano (Admin)
    async adminExcluir(req, res) {
        try {
            const { id } = req.params;
            const { hard } = req.query; // Se 'true', exclui permanentemente

            if (hard === 'true') {
                const { error } = await supabase.from('planos').delete().eq('id', id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('planos').update({ ativo: false }).eq('id', id);
                if (error) throw error;
            }

            res.json({ success: true, message: 'Operação realizada com sucesso.' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Diagnóstico de Planos (Admin)
    async adminDiagnostico(req, res) {
        try {
            // 1. Buscar todos os preços
            const { data: todosPrecos, error: pError } = await supabase
                .from('planos_precos')
                .select('id, plano_id, faixa_etaria, valor');

            if (pError) throw pError;

            // 2. Detectar duplicatas manualmente (JS) como fallback/apoio
            const agrupado = {};
            const duplicatas = [];

            todosPrecos.forEach(p => {
                const chave = `${p.plano_id}|${p.faixa_etaria}`;
                if (!agrupado[chave]) {
                    agrupado[chave] = [];
                }
                agrupado[chave].push(p);
            });

            Object.keys(agrupado).forEach(chave => {
                if (agrupado[chave].length > 1) {
                    duplicatas.push({
                        chave,
                        items: agrupado[chave]
                    });
                }
            });

            // 3. Buscar planos sem preços
            const { data: planosSemPrecos, error: psError } = await supabase
                .from('planos')
                .select('id, nome')
                .not('id', 'in', `(${todosPrecos.map(p => p.plano_id).join(',') || 0})`);

            res.json({ 
                success: true, 
                diagnostico: {
                    total_precos: todosPrecos.length,
                    duplicatas_encontradas: duplicatas.length,
                    planos_incompletos: planosSemPrecos || [],
                    detalhes_duplicatas: duplicatas
                }
            });
        } catch (error) {
            console.error('Erro no diagnóstico:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
};
