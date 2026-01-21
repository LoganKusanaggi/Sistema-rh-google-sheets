require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
    const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
    if (!dbUrl) {
        console.error('❌ Erro: DATABASE_URL não encontrada no .env. Por favor, adicione a string de conexão do banco de dados (ex: postgres://...).');
        process.exit(1);
    }

    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const migrationPath = path.join(__dirname, '../database/migrations/007_add_benefit_columns_folha.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Executando migração 007...');
        await client.query(sql);
        console.log('✅ Migração 007 aplicada com sucesso!');

    } catch (err) {
        console.error('❌ Erro ao aplicar migração:', err.message);
    } finally {
        await client.end();
    }
}

run();
