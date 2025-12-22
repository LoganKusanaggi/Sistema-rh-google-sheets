const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, 'templates');
const files = fs.readdirSync(templatesDir);

files.forEach(file => {
  console.log(`\n==================================================`);
  console.log(`FILE: ${file}`);
  console.log(`==================================================`);
  
  try {
    const workbook = XLSX.readFile(path.join(templatesDir, file));
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to JSON (header: 1 means array of arrays)
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0, defval: '' });
    
    // Print first 10 rows to identify headers
    const rowsToShow = data.slice(0, 15); 
    rowsToShow.forEach((row, index) => {
        // Filter out empty cells for cleaner output, but keep structure somewhat
        // Actually showing exact row is better
        const hasContent = row.some(c => c !== '' && c !== null && c !== undefined);
        if (hasContent) {
           console.log(`Row ${index + 1}: ${JSON.stringify(row)}`);
        }
    });

  } catch (error) {
    console.error(`Error reading ${file}:`, error.message);
  }
});
