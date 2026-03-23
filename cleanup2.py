"""
Removes the orphaned old listarHistoricoModal code left after the pure-GAS-HTML rewrite.
The old code starts with '    // Carrega dados no servidor antes de criar o modal'
and ends just before '// HELPERS CRITICOS'.
"""

filename = 'CODIGO_FINAL_CORRETO.js'
with open(filename, 'r', encoding='utf-8') as f:
    content = f.read()

# Marker for start of orphaned block (the old code that was left behind)
# The new function ends at the second occurrence of 'showModalDialog(html, ...'
# The orphaned old code starts right after that

# Find the end of the new function (second showModalDialog call)
marker_new_end = "SpreadsheetApp.getUi().showModalDialog(html, '📜 Histórico de Versões');\n}"
idx_new_end = content.find(marker_new_end)
if idx_new_end == -1:
    print("Could not find new function end marker")
else:
    # Find the end of the orphaned block (start of next major section)
    orphan_start = idx_new_end + len(marker_new_end)
    # Look for the end: either '// HELPERS' or next function definition
    orphan_end = None
    for marker in ['// HELPERS CR', '// =====================\n// HELPERS']:
        idx = content.find(marker, orphan_start)
        if idx != -1:
            orphan_end = idx
            break
    
    if orphan_end is None:
        # Look for next top-level function
        import re
        m = re.search(r'\n\nfunction \w+', content[orphan_start:])
        if m:
            orphan_end = orphan_start + m.start() + 2
    
    if orphan_end:
        orphan = content[orphan_start:orphan_end]
        lines_removed = orphan.count('\n')
        print(f"Orphaned block ({lines_removed} lines):")
        print(repr(orphan[:200]))
        # Remove the orphan
        new_content = content[:orphan_start] + '\n\n' + content[orphan_end:]
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"\nDone. New total lines: {new_content.count(chr(10))}")
    else:
        print("Could not find orphan end")
        # Show context
        print(repr(content[orphan_start:orphan_start+500]))
