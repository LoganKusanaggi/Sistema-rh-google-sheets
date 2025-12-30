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
            const { plano_id, matricula } = req.body; // Removed dependente_qtd (deprecated in favor of table)

            // Check if plan exists and get its type
            const { data: planoInfo, error: pError } = await supabase
                .from('planos')
                .select('tipo')
                .eq('id', plano_id)
                .single();

            if (pError || !planoInfo) throw new Error('Plano não encontrado');

            // 1. Deactivate existing plans of same type
            const { data: existingPlans } = await supabase
                .from('colaboradores_planos')
                .select('id, plano:planos(tipo)')
                .eq('colaborador_id', id)
                .eq('ativo', true);

            // Robust comparison (Case Insensitive + Optional Chaining)
            const targetTipo = (planoInfo.tipo || '').toLowerCase();

            const plansToDeactivate = existingPlans.filter(p => {
                const pTipo = (p.plano && p.plano.tipo) ? p.plano.tipo.toLowerCase() : '';
                return pTipo === targetTipo;
            });

            console.log(`[Atribuir Plano] Desativando ${plansToDeactivate.length} planos antigos do tipo ${targetTipo}`);

            for (const p of plansToDeactivate) {
                if (p.id) {
                    await supabase.from('colaboradores_planos').update({ ativo: false }).eq('id', p.id);
                }
            }

            // 2. Insert new plan assignment
            // Note: dependentes count is no longer stored here as a raw number effectively
            // But we keep it if the legacy field exists, or use default 0.
            // The table dependentes will be the source of truth for quantity.
            const { data, error } = await supabase
                .from('colaboradores_planos')
                .insert({
                    colaborador_id: id,
                    plano_id: plano_id,
                    matricula: matricula || null, // Saving Titular Matricula
                    ativo: true
                })
                .select()
                .single();

            if (error) throw error;

            res.json({ success: true, data, message: 'Plano atribuído com sucesso.' });

        } catch (error) {
            console.error('Erro ao atribuir plano:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Remover (Desativar) plano
    async remover(req, res) {
        try {
            const { id, planoId } = req.params; // User ID, Plan Assignment ID? 
            // Or User ID + Plan ID in body?
            // Let's assume URL: /colaboradores/:id/planos/:assignmentId ?
            // Or just /colaboradores/:id/planos with body?

            // Implementation decision: DELETE /colaboradores/:id/planos/:plano_id (The plan product ID)
            // To deactivate that plan for that user.

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
