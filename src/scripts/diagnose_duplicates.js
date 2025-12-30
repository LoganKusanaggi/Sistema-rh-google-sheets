require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_COLAB_ID = 'fe34fbf6-6aed-4dfd-9eae-5213a38edcdd'; // User reported ID

async function diagnose() {
    console.log(`--- DIAGNOSING COLLABORATOR ${TARGET_COLAB_ID} ---`);

    // 1. Fetch RAW Plans for this user
    const { data: rawPlans, error } = await supabase
        .from('colaboradores_planos')
        .select(`
            id,
            colaborador_id,
            plano_id,
            ativo,
            criado_em,
            plano:planos (
                id,
                nome,
                tipo
            )
        `)
        .eq('colaborador_id', TARGET_COLAB_ID);

    if (error) {
        console.error('Error fetching plans:', error);
        return;
    }

    console.log(`Found ${rawPlans.length} plans.`);
    console.log(JSON.stringify(rawPlans, null, 2));

    // 2. Simulate Logic for Type match
    const types = ['SAUDE', 'ODONTO', 'saude', 'odonto'];

    types.forEach(targetTipo => {
        console.log(`\n--- Simulation for Target Type: '${targetTipo}' ---`);
        const normalizedTarget = targetTipo.toLowerCase();

        const candidates = rawPlans.filter(p => {
            const pTipo = (p.plano && p.plano.tipo) ? p.plano.tipo.toLowerCase() : 'undefined_or_null';
            console.log(`   > PlanRow ${p.id.substring(0, 8)}... Type in DB: '${p.plano ? p.plano.tipo : 'NO_JOIN'}' | Normalized: '${pTipo}' | Match? ${pTipo === normalizedTarget}`);
            return pTipo === normalizedTarget;
        });

        console.log(`   > Candidates Found: ${candidates.length}`);
        if (candidates.length > 0) {
            console.log(`   > ACTION: UPDATE ${candidates[0].id} (and DELETE ${candidates.slice(1).length} others)`);
        } else {
            console.log(`   > ACTION: INSERT NEW`);
        }
    });

}

diagnose().catch(console.error);
