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

            // 1. Fetch active plans of same type
            // Changed: Fetch ALL plans of this type to find a slot to recycle (cleaner than Deactivate+Upsert)
            const { data: existingPlans, error: eError } = await supabase
                .from('colaboradores_planos')
                .select('id, plano:planos(tipo)')
                .eq('colaborador_id', id);

            if (eError) throw eError;

            // Robust type comparison
            const targetTipo = (planoInfo.tipo || '').toLowerCase();

            const candidates = existingPlans.filter(p => {
                const pTipo = (p.plano && p.plano.tipo) ? p.plano.tipo.toLowerCase() : '';
                return pTipo === targetTipo;
            });

            console.log(`[Atribuir Plano] Encontrados ${candidates.length} slots para o tipo ${targetTipo}`);

            const pid = parseInt(plano_id, 10);
            let operacao = 'insert';
            let data = null;

            if (candidates.length > 0) {
                // RECYCLE STRATEGY: Update the first available slot and delete the rest
                // This satisfies "Update if exists" and cleans up duplicates at the same time
                operacao = 'update';
                const slotToReuse = candidates[0];
                const trash = candidates.slice(1);

                // Update the chosen slot
                const { data: updated, error: uError } = await supabase
                    .from('colaboradores_planos')
                    .update({
                        plano_id: pid,
                        matricula: matricula || null,
                        ativo: true,
                        updated_at: new Date()
                    })
                    .eq('id', slotToReuse.id) // Update by PK
                    .select()
                    .single();

                if (uError) throw uError;
                data = updated;

                // Delete duplicates/history to enforce 1:1 per type if desired
                if (trash.length > 0) {
                    const idsToDelete = trash.map(t => t.id);
                    // Safe delete
                    await supabase.from('colaboradores_planos').delete().in('id', idsToDelete);
                    console.log(`[Atribuir Plano] Limpeza: Removidos ${idsToDelete.length} registros duplicados/antigos.`);
                }
            } else {
                // INSERT STRATEGY: No slot exists, valid insert
                const { data: inserted, error: iError } = await supabase
                    .from('colaboradores_planos')
                    .insert({
                        colaborador_id: id,
                        plano_id: pid,
                        matricula: matricula || null,
                        ativo: true
                    })
                    .select()
                    .single();

                if (iError) throw iError;
                data = inserted;
            }

            res.json({ success: true, data, message: `Plano ${operacao === 'update' ? 'atualizado' : 'atribuído'} com sucesso.` });

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
