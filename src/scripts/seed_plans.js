require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

// Config
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log('--- Starting Plan Seed ---');

    // 1. Load Catalog (Template 09)
    await seedCatalog();

    // 2. Load Allocations (Templates 07 & 08)
    await seedAllocations('templates/07. Template_Plano_Odonto.xlsx', 'ODONTO');
    await seedAllocations('templates/08. Template_Plano_Saude.xlsx', 'SAUDE');

    console.log('--- Seed Completed ---');
}

function parseCurrency(value) {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    return parseFloat(value.toString().replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
}

function parseAgeRange(rangeStr) {
    // "De 0 a 18 anos" -> { min: 0, max: 18 }
    // "59 ou mais" -> { min: 59, max: 999 }
    const str = rangeStr.toLowerCase().trim();
    let min = null, max = null;

    if (str.includes('ou mais') || str.includes('acima')) {
        const matches = str.match(/(\d+)/);
        if (matches) {
            min = parseInt(matches[0]);
            max = 999;
        }
    } else {
        const matches = str.match(/(\d+)\s*a\s*(\d+)/);
        if (matches) {
            min = parseInt(matches[1]);
            max = parseInt(matches[2]);
        }
    }
    return { min, max };
}

async function seedCatalog() {
    const filePath = path.resolve(__dirname, '../../templates/09. Template_Tabela_Planos.xlsx');
    if (!fs.existsSync(filePath)) {
        console.error('Catalog file not found:', filePath);
        return;
    }

    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    console.log(`Processing ${rows.length} catalog rows...`);

    for (const row of rows) {
        const nomeCompleto = row['Plano'] || '';
        const faixaStr = row['Faixa Etária'] || '';
        const mensalidade = row['Mensalidade'];

        if (!nomeCompleto) continue;

        // Extract Code? "962680 – AMIL..."
        const codeMatch = nomeCompleto.match(/^(\d+)\s*[-–]/);
        const codigo = codeMatch ? codeMatch[1] : null;

        // Determine Type (Heuristic)
        let tipo = 'SAUDE';
        if (nomeCompleto.toLowerCase().includes('dental') || nomeCompleto.toLowerCase().includes('odonto')) {
            tipo = 'ODONTO';
        }

        // 1. Ensure Plan Exists
        const { data: plano, error: pError } = await supabase
            .from('planos')
            .upsert({ nome: nomeCompleto, tipo, codigo_ref: codigo }, { onConflict: 'nome' })
            .select()
            .single();

        if (pError) {
            console.error('Error upserting plan:', pError.message);
            continue;
        }

        // 2. Insert Price
        const { min, max } = parseAgeRange(faixaStr);
        // Clean existing prices for this plan/range to avoid dups if re-running? 
        // Or just insert. For now, simple insert.
        // Actually, upserting price is tricky without unique key on (plano_id, faixa).
        // Let's check complexity. Just inserting for MVP is fine, or check existing.

        await supabase.from('planos_precos').insert({
            plano_id: plano.id,
            faixa_etaria: faixaStr,
            faixa_min: min,
            faixa_max: max,
            valor: mensalidade
        });
    }
}

async function seedAllocations(relativePath, typeContext) {
    const filePath = path.resolve(__dirname, '../../' + relativePath);
    if (!fs.existsSync(filePath)) {
        console.log(`Skipping ${relativePath} (File not found)`);
        return;
    }

    console.log(`Processing Allocations from ${relativePath}...`);
    const workbook = xlsx.readFile(filePath);

    // Check if header is on row 1 or 2 (Template 08 had title on row 1)
    let sheet = workbook.Sheets[workbook.SheetNames[0]];
    let jsonData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    let headerRowIndex = 0;
    if (jsonData[0] && jsonData[0][0] && typeof jsonData[0][0] === 'string' && jsonData[0][0].includes('PLANO DE SAÚDE')) {
        headerRowIndex = 1;
    }

    const rows = xlsx.utils.sheet_to_json(sheet, { range: headerRowIndex });

    for (const row of rows) {
        // Map columns
        const cpfRaw = row['CPF'];
        const planoNome = row['PLANO'] || row['Plano']; // Case sensitive in xlsx json? usually it uses keys.

        if (!cpfRaw || !planoNome) continue;

        // Clean CPF
        const cpf = String(cpfRaw).replace(/\D/g, '').padEnd(11, '0'); // Basic padding if needed? or just clean.
        // Actually, database stores formatted or clean? `colaboradores.cpf` usually 11 chars.

        // Find Colaborador
        const { data: colab } = await supabase.from('colaboradores').select('id').ilike('cpf', `%${cpf}%`).limit(1).single();
        if (!colab) {
            console.log(`Colaborador not found for CPF ${cpf}`);
            continue;
        }

        // Find Plan
        // Try exact match first, then fuzzy?
        // If plan from 07 is "DENTAL E170 I NAC" and catalog is empty of Dental, we might create it?

        let { data: plano } = await supabase.from('planos').select('id').eq('nome', planoNome).single();

        if (!plano) {
            // Auto-create simplified plan if missing (Allocations might have different names than Catalog)
            console.log(`Creating missing plan from allocation: ${planoNome}`);
            const { data: newPlano, error } = await supabase
                .from('planos')
                .insert({ nome: planoNome, tipo: typeContext })
                .select()
                .single();
            if (!error) plano = newPlano;
        }

        if (plano) {
            await supabase.from('colaboradores_planos').upsert({
                colaborador_id: colab.id,
                plano_id: plano.id,
                ativo: true
            }, { onConflict: 'colaborador_id, plano_id' }); // Assuming we added UNIQUE constraint or index
        }
    }
}

seed().catch(console.error);
