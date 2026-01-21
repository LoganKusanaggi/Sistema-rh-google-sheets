const benefitCalculator = {
    // Calcular idade em anos
    calcularIdade(dataNascimento) {
        if (!dataNascimento) return 0;
        const hoje = new Date();
        const nasc = new Date(dataNascimento);
        let idade = hoje.getFullYear() - nasc.getFullYear();
        const m = hoje.getMonth() - nasc.getMonth();
        if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
            idade--;
        }
        return idade;
    },

    // Encontrar preço na tabela baseado na idade
    encontrarPreco(precos, idade) {
        if (!precos || precos.length === 0) return 0;

        // Tenta encontrar faixa exata ou compatível
        const precoEncontrado = precos.find(p => {
            // Se tiver min/max definidos
            if (p.faixa_min !== undefined && p.faixa_max !== undefined) {
                return idade >= p.faixa_min && idade <= p.faixa_max;
            }
            // Fallback: Parsing da string "0 a 18 anos" ou "59 ou mais"
            const faixa = p.faixa_etaria.toLowerCase();
            if (faixa.includes('ou mais')) {
                const min = parseInt(faixa.match(/\d+/)[0]);
                return idade >= min;
            }
            if (faixa.includes('a')) {
                const parts = faixa.split('a').map(s => parseInt(s.replace(/\D/g, '')));
                return idade >= parts[0] && idade <= parts[1];
            }
            return false;
        });

        return precoEncontrado ? parseFloat(precoEncontrado.valor) : 0;
    },

    // Calcular custos do plano de saúde (Titular)
    calcularSaudeTitular(precoCheio) {
        return {
            valor_total: precoCheio,
            parte_empresa: precoCheio * 0.8, // 80%
            parte_funcionario: precoCheio * 0.2 // 20%
        };
    },

    // Calcular custos de dependentes (Saúde ou Odonto)
    // Dependentes pagam 100% do valor de sua faixa (Saúde) ou Fixo (Odonto)
    async calcularDependentes(supabase, colaboradorId, planoId, tipoPlano, precosPlano) {
        let custoTotal = 0;

        // Buscar dependentes deste colaborador
        const { data: dependentes } = await supabase
            .from('dependentes')
            .select('*')
            .eq('colaborador_id', colaboradorId);

        if (!dependentes || dependentes.length === 0) return 0;

        for (const dep of dependentes) {
            // Verificar se dependente deve ter o plano (Assumindo que se o titular tem, dependentes tem?)
            // Normalmente haveria uma tabela 'dependentes_planos', mas simplificando conforme structure atual:
            // Vamos assumir que TODOS os dependentes cadastrados entram no plano se o titular tiver.

            if (tipoPlano === 'ODONTO') {
                // Odonto geralmente é preço fixo por vida, não por idade?
                // Se tabela de preços tiver apenas 1 registro ou lógica específica.
                // O usuário disse: "A lógica do plano odontológico é parecido... porém não tem a questão da faixa etária"
                // Então pegamos o primeiro preço da lista.
                const preco = precosPlano.length > 0 ? parseFloat(precosPlano[0].valor) : 0;
                custoTotal += preco;
            } else {
                // SAUDE: Preço por idade
                const idade = this.calcularIdade(dep.data_nasc);
                const preco = this.encontrarPreco(precosPlano, idade);
                custoTotal += preco;
            }
        }

        return custoTotal;
    }
};

module.exports = benefitCalculator;
