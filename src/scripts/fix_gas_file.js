const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../../google-apps-script.js');
const appendPath = path.join(__dirname, 'restore_history_modal.js');

try {
    // Read the corrupted file as string first (trying utf8)
    // If it fails, read as buffer
    let content = fs.readFileSync(targetPath, 'utf8');

    // Find the end of onEdit
    const marker = "function onEdit(e) {";
    const startIdx = content.lastIndexOf(marker);

    if (startIdx === -1) {
        console.error("Critical: Could not find onEdit function.");
        process.exit(1);
    }

    // Find the closing brace of onEdit
    // We know onEdit ends with "}" and usually has some whitespace/newlines
    // Let's identify the exact closing of the function we wrote previously
    // "e.source.toast(isChecked ? '✅ Todos selecionados' : '⬜ Seleção limpa');\n  }\n}"

    // Simpler: Split by the marker, take the first part + the clean onEdit code, then append the new code.
    // The previous onEdit code (clean) is:

    const cleanOnEdit = `function onEdit(e) {
  // FAST EXIT: Se nao for na aba Colaboradores ou nao for Coluna 1 (A)
  if (!e) return; // Execucao manual
  
  const sheet = e.source.getActiveSheet();
  if (sheet.getName() !== CONFIG.ABAS.COLABORADORES) return;
  
  const range = e.range;
  const row = range.getRow();
  const col = range.getColumn();
  
  // LOGICA CHECKBOX "SELECIONAR TUDO"
  // Funciona para o checkbox da linha 3 (Filtro) ou linha 5 (Cabecalho)
  if (col === 1 && (row === 3 || row === 5)) {
      const isChecked = range.getValue();
      
      // Valida se eh booleano para evitar disparos falsos
      if (typeof isChecked !== 'boolean' && isChecked !== 'TRUE' && isChecked !== 'FALSE') return;
      
      const lastRow = sheet.getLastRow();
      if (lastRow < 6) return; // Sem dados
      
      // Aplica a todos os checkboxes de dados (A6 em diante)
      // Otimizado: setValue unico para o range inteiro
      const numRows = lastRow - 5;
      sheet.getRange(6, 1, numRows, 1).setValue(isChecked);
      
      // Feedback visual opcional (Toast)
      e.source.toast(isChecked ? '✅ Todos selecionados' : '⬜ Seleção limpa');
  }
}
`;

    // Truncate file at marker
    const preContent = content.substring(0, startIdx);

    // Read the new append content
    const appendContent = fs.readFileSync(appendPath, 'utf8');

    // Combine
    const finalContent = preContent + cleanOnEdit + '\n\n' + appendContent;

    // Write back
    fs.writeFileSync(targetPath, finalContent, 'utf8');
    console.log("File fixed successfully!");

} catch (e) {
    console.error("Error fixing file:", e);
}
