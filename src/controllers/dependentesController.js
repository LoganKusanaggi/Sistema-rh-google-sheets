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

            res.json({ success: true, data, message: 'Dependente adicionado com sucesso.' });
        } catch (error) {
            console.error('Erro ao adicionar dependente:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Remover dependente
    async remover(req, res) {
        try {
            const { id } = req.params;

            const { error } = await supabase
                .from('dependentes')
                .delete()
                .eq('id', id);

            if (error) throw error;

            res.json({ success: true, message: 'Dependente removido com sucesso.' });
        } catch (error) {
            console.error('Erro ao remover dependente:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
};
