const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const files = [
    'templates/07. Template_Plano_Odonto.xlsx',
    'templates/08. Template_Plano_Saude.xlsx',
    'templates/09. Template_Tabela_Planos.xlsx'
];

files.forEach(file => {
    try {
        const filePath = path.resolve(__dirname, file);
        if (!fs.existsSync(filePath)) {
            console.log(`[SKIPPED] File not found: ${file}`);
            return;
        }

        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Get headers (A1:Z1)
        const jsonData = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        const headers = jsonData[0];

        // Get one example row
        const example = jsonData[1];

        console.log(`\n--- File: ${file} ---`);
        console.log("Headers:", headers);
        console.log("Example:", example);
    } catch (e) {
        console.error(`Error reading ${file}:`, e.message);
    }
});
