const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const templatePath = path.join(__dirname, 'templates', '02. Templeta_ 2025 FOLHA DE PAGAMENTO - SUPER INDUSTRIA & CAFFEINE ARMY.xlsx');

try {
    const workbook = XLSX.readFile(templatePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    let output = '=== ESTRUTURA DO TEMPLATE FOLHA ===\n\n';

    // Header (linha 2)
    const headers = data[1];
    output += 'COLUNAS (Total: ' + headers.length + '):\n';
    headers.forEach((h, idx) => {
        const letter = String.fromCharCode(65 + idx);
        output += `  ${letter}: ${h}\n`;
    });

    output += '\n=== EXEMPLO DE DADOS (Linha 3) ===\n';
    const exemplo = data[2];
    headers.forEach((h, idx) => {
        output += `  ${h}: ${exemplo[idx]}\n`;
    });

    fs.writeFileSync('ESTRUTURA_FOLHA.txt', output, 'utf-8');
    console.log('✅ Estrutura salva em ESTRUTURA_FOLHA.txt');

} catch (error) {
    console.error('❌ Erro:', error.message);
}
