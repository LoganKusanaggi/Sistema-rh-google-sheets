const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = {
    // Listar dependentes de um colaborador
    async listar(req, res) {
        try {
            const { colaboradorId } = req.params;

            const { data, error } = await supabase
                .from('dependentes')
                .select('*')
                .eq('colaborador_id', colaboradorId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            res.json({ success: true, data });
        } catch (error) {
            console.error('Erro ao listar dependentes:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Adicionar dependente
    async adicionar(req, res) {
        try {
            const { colaboradorId } = req.params;
            const { nome, cpf, data_nasc, parentesco, matricula } = req.body;

            // Validação básica
            if (!nome || !data_nasc || !parentesco) {
                return res.status(400).json({ success: false, error: 'Nome, Data de Nascimento e Parentesco são obrigatórios.' });
            }

            const { data, error } = await supabase
                .from('dependentes')
                .insert({
                    colaborador_id: colaboradorId,
                    nome,
                    cpf: cpf ? cpf.replace(/\D/g, '') : null,
                    data_nasc,
                    parentesco,
                    matricula
                })
                .select()
                .single();

            if (error) throw error;

            // Sync after add
            if (data) {
                await atualizarContagemDependentes(colaboradorId);
            }

            res.json({ success: true, data, message: 'Dependente adicionado com sucesso.' });
        } catch (error) {
            console.error('Erro ao adicionar dependente:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Atualizar dependente
    async atualizar(req, res) {
        try {
            const { id } = req.params;
            const { nome, data_nasc, parentesco, matricula } = req.body;

            // Validação
            if (!nome || !data_nasc || !parentesco) {
                return res.status(400).json({ success: false, error: 'Nome, Data de Nascimento e Parentesco são obrigatórios.' });
            }

            const { data, error } = await supabase
                .from('dependentes')
                .update({
                    nome,
                    data_nasc,
                    parentesco,
                    matricula
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            res.json({ success: true, data, message: 'Dependente atualizado com sucesso.' });
        } catch (error) {
            console.error('Erro ao atualizar dependente:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Remover dependente
    async remover(req, res) {
        try {
            const { id } = req.params;

            // First get the colaborador_id before deleting
            const { data: dept } = await supabase
                .from('dependentes')
                .select('colaborador_id')
                .eq('id', id)
                .single();

            const { error } = await supabase
                .from('dependentes')
                .delete()
                .eq('id', id);

            if (error) throw error;

            if (dept) {
                await atualizarContagemDependentes(dept.colaborador_id);
            }

            res.json({ success: true, message: 'Dependente removido com sucesso.' });
        } catch (error) {
            console.error('Erro ao remover dependente:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

// Helper para sincronizar contador
async function atualizarContagemDependentes(colaboradorId) {
    try {
        const { count, error } = await supabase
            .from('dependentes')
            .select('*', { count: 'exact', head: true })
            .eq('colaborador_id', colaboradorId);

        if (error) throw error;

        console.log(`[Sync Dependentes] Colaborador ${colaboradorId} tem ${count} dependentes. Atualizando planos...`);

        const { error: uError } = await supabase
            .from('colaboradores_planos')
            .update({ dependentes: count })
            .eq('colaborador_id', colaboradorId);

        if (uError) throw uError;

    } catch (err) {
        console.error('Erro ao sincronizar dependentes:', err);
    }
}
