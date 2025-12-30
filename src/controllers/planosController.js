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

            // 1. Fetch active plans of same type
            const { data: existingPlans, error: eError } = await supabase
                .from('colaboradores_planos')
                .select('id, plano:planos(tipo)')
                .eq('colaborador_id', id)
                .eq('ativo', true);

            if (eError) throw eError;

            // Robust type comparison
            const targetTipo = (planoInfo.tipo || '').toLowerCase();

            const activePlansOfType = existingPlans.filter(p => {
                const pTipo = (p.plano && p.plano.tipo) ? p.plano.tipo.toLowerCase() : '';
                return pTipo === targetTipo;
            });

            console.log(`[Atribuir Plano] Desativando ${activePlansOfType.length} planos antigos do tipo ${targetTipo}`);

            // 2. Deactivate ALL active plans of this type
            for (const p of activePlansOfType) {
                await supabase.from('colaboradores_planos').update({ ativo: false }).eq('id', p.id);
            }

            const pid = parseInt(plano_id, 10);

            // 3. Check if specific assignment already exists (Active or Inactive)
            const { data: existingAssignment } = await supabase
                .from('colaboradores_planos')
                .select('id')
                .eq('colaborador_id', id)
                .eq('plano_id', pid)
                .single();

            let data;

            if (existingAssignment) {
                // Reactivate / Update existing record
                const { data: updated, error: uError } = await supabase
                    .from('colaboradores_planos')
                    .update({
                        matricula: matricula || null,
                        ativo: true,
                        updated_at: new Date()
                    })
                    .eq('id', existingAssignment.id)
                    .select()
                    .single();

                if (uError) throw uError;
                data = updated;
            } else {
                // Try Insert. If unique constraint fails, it means it exists (race condition or select missed it), so we Update.
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

                if (iError) {
                    console.log('[Atribuir Plano] Insert falhou. Tentando Update de recuperação...', iError.message);

                    // Fallback to Update unconditionally
                    const { data: recovered, error: rError } = await supabase
                        .from('colaboradores_planos')
                        .update({
                            matricula: matricula || null,
                            ativo: true,
                            updated_at: new Date()
                        })
                        .eq('colaborador_id', id)
                        .eq('plano_id', pid)
                        .select()
                        .single();

                    if (rError) {
                        console.error('[Atribuir Plano] Update de recuperação também falhou:', rError.message);
                        // Throw original error as it is likely the root cause (or recovery failed)
                        throw iError;
                    }
                    data = recovered;
                } else {
                    data = inserted;
                }
            }

            res.json({ success: true, data, message: 'Plano atribuído/atualizado com sucesso.' });

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
