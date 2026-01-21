const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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
                .eq('ativo', true);

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

            // 2. Upsert the target plan
            const { data: existing, error: findError } = await supabase
                .from('colaboradores_planos')
                .select('id')
                .eq('colaborador_id', id)
                .eq('plano_id', pid)
                .maybeSingle();

            if (findError) throw findError;

            let data;
            if (existing) {
                // Update existing
                const { data: updated, error: uError } = await supabase
                    .from('colaboradores_planos')
                    .update({
                        matricula: matricula || null,
                        dependentes: depsCount || 0,
                        ativo: true
                    })
                    .eq('id', existing.id)
                    .select()
                    .single();
                if (uError) throw uError;
                data = updated;
            } else {
                // Insert new
                const { data: inserted, error: iError } = await supabase
                    .from('colaboradores_planos')
                    .insert({
                        colaborador_id: id,
                        plano_id: pid,
                        matricula: matricula || null,
                        dependentes: depsCount || 0,
                        ativo: true
                    })
                    .select()
                    .single();
                if (iError) throw iError;
                data = inserted;
            }

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
    }
};
