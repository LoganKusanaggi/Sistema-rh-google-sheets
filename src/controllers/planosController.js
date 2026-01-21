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

            // 1. Fetch ALL plans of this type (Active or not)
            const { data: existingPlans, error: eError } = await supabase
                .from('colaboradores_planos')
                .select('id, plano_id, plano:planos(tipo)')
                .eq('colaborador_id', id);

            if (eError) throw eError;

            // Robust type comparison
            const targetTipo = (planoInfo.tipo || '').toLowerCase();

            // Filter for same type
            const sameTypePlans = existingPlans.filter(p => {
                const pTipo = (p.plano && p.plano.tipo) ? p.plano.tipo.toLowerCase() : '';
                return pTipo === targetTipo;
            });

            console.log(`[Atribuir Plano] Encontrados ${sameTypePlans.length} planos do tipo ${targetTipo}`);

            const pid = parseInt(plano_id, 10);

            // STRATEGY: 
            // 1. Exact Match: If (user, plan) exists, update it + delete others.
            // 2. Recycle: If (user, plan) NOT exists, but (user, other_plan_of_type) exists, update OTHER to CURRENT.
            // 3. Insert: If nothing exists.

            const exactMatch = sameTypePlans.find(p => p.plano_id === pid);
            let activeRecordId = null;

            if (exactMatch) {
                // Scenario A: Plan already exists in history. Reactivate it.
                console.log(`[Atribuir Plano] Encontrado registro exato (ID: ${exactMatch.id}). Atualizando...`);

                const { data: updated, error: uError } = await supabase
                    .from('colaboradores_planos')
                    .update({
                        matricula: matricula || null,
                        dependentes: depsCount || 0,
                        ativo: true
                    })
                    .eq('id', exactMatch.id)
                    .select()
                    .single();

                if (uError) throw uError;
                activeRecordId = exactMatch.id;

            } else if (sameTypePlans.length > 0) {
                // Scenario B: Recycle the first available slot of same type
                const slotToReuse = sameTypePlans[0];
                console.log(`[Atribuir Plano] Reciclando slot (ID: ${slotToReuse.id}) para novo plano ${pid}`);

                const { data: updated, error: uError } = await supabase
                    .from('colaboradores_planos')
                    .update({
                        plano_id: pid, // Change product
                        matricula: matricula || null,
                        dependentes: depsCount || 0,
                        ativo: true
                    })
                    .eq('id', slotToReuse.id)
                    .select()
                    .single();

                if (uError) throw uError;
                activeRecordId = slotToReuse.id;

            } else {
                // Scenario C: Insert new
                console.log(`[Atribuir Plano] Inserindo novo registro...`);

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
                activeRecordId = inserted.id;
            }

            // CLEANUP: Delete any other plans of SAME TYPE that lead to duplicates or obsolete history
            // preventing future unique constraint issues if we swizzle ids around
            if (activeRecordId) {
                const trash = sameTypePlans.filter(p => p.id !== activeRecordId);
                if (trash.length > 0) {
                    const idsToDelete = trash.map(t => t.id);
                    await supabase.from('colaboradores_planos').delete().in('id', idsToDelete);
                    console.log(`[Atribuir Plano] Limpeza: Removidos ${idsToDelete.length} registros obsoletos.`);
                }
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
