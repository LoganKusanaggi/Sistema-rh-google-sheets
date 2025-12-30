require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_COLAB_ID = 'fe34fbf6-6aed-4dfd-9eae-5213a38edcdd'; // User reported ID

async function fixDuplicates() {
    console.log(`--- FIXING DUPLICATES FOR ${TARGET_COLAB_ID} ---`);

    // 1. Fetch ALL plans of type SAUDE (simulating the logic)
    const { data: plans, error } = await supabase
        .from('colaboradores_planos')
        .select('id, plano:planos(tipo), ativo, criado_em')
        .eq('colaborador_id', TARGET_COLAB_ID);

    if (error) { console.error(error); return; }

    const targetTipo = 'saude';
    const candidates = plans.filter(p => (p.plano && p.plano.tipo.toLowerCase()) === targetTipo);

    console.log(`Found ${candidates.length} candidates.`);

    if (candidates.length > 1) {
        // Sort by created_at desc (newest first) or preference? 
        // User wants the *active* one kept or the slot reused?
        // Logic: Keep first, delete rest.
        // Let's sort to keep the ACTIVE one if possible, or newest.
        candidates.sort((a, b) => (b.ativo === true ? 1 : -1) - (a.ativo === true ? 1 : -1)); // Sort Active to top?
        // Actually candidates[0] is reused.

        const slotToKeep = candidates.find(c => c.ativo) || candidates[0];
        const others = candidates.filter(c => c.id !== slotToKeep.id);

        console.log(`Keeping ${slotToKeep.id} (Active: ${slotToKeep.ativo}). Deleting ${others.length} others.`);

        // Delete others
        const idsToDelete = others.map(o => o.id);
        if (idsToDelete.length > 0) {
            await supabase.from('colaboradores_planos').delete().in('id', idsToDelete);
            console.log('Deleted duplicates.');
        }

        // Ensure kept is active (The update logic would normally do this)
        if (!slotToKeep.ativo) {
            await supabase.from('colaboradores_planos').update({ ativo: true }).eq('id', slotToKeep.id);
            console.log('Re-activated preserved slot.');
        }

        console.log('Fix complete.');
    } else {
        console.log('No duplicates to fix.');
    }
}

fixDuplicates().catch(console.error);
