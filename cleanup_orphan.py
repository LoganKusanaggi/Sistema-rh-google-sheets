"""
Removes the orphaned CSS/HTML block left in CODIGO_FINAL_CORRETO.js
after the listarHistoricoModal refactor.

The orphan starts right after '}' closing the new listarHistoricoModal function
and ends just before '// HELPERS CRITICOS' section.
"""

import re

filename = 'CODIGO_FINAL_CORRETO.js'

with open(filename, 'r', encoding='utf-8') as f:
    content = f.read()

# The orphaned block is CSS/HTML content that starts with a bare CSS rule
# after the new function closing brace and before the helper functions.
# Pattern: everything between '}' (end of listarHistoricoModal new version)
# and '// =====================\n// HELPERS' (HELPERS comment section)
#
# Marker unique to the orphan: '.badge - folha' (CSS with spaces around dash, artifact of old code)
marker_start = '.badge - folha'
marker_end = '// =====================================================\r\n// HELPERS CR'

if marker_start not in content:
    # Try without CRLF
    marker_end = '// =====================================================\n// HELPERS CR'

if marker_start in content:
    # Find the position of the orphan start
    # The orphan starts a bit before '.badge - folha'
    # Actually it starts at '// ====...\n      .badge - folha'
    # Find the comment right before the orphan
    idx = content.find(marker_start)
    # Go back to find the start of the block (the // === line before the orphan)
    block_start = content.rfind('//', 0, idx)
    block_start = content.rfind('\n', 0, block_start) + 1  # go to line start
    
    # Find the end: the next '// =====================' that starts a legit section  
    idx_end = content.find('// HELPERS CR', idx)
    if idx_end == -1:
        idx_end = content.find('// =====================', idx + 100)
    
    if idx_end != -1:
        orphan = content[block_start:idx_end]
        print(f'Orphan block found ({len(orphan)} chars):')
        print(repr(orphan[:200]))
        print('...')
        
        new_content = content[:block_start] + content[idx_end:]
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        lines_before = content.count('\n')
        lines_after = new_content.count('\n')
        print(f'\nRemoved {lines_before - lines_after} lines')
        print(f'New total: {lines_after} lines')
    else:
        print('Could not find end marker')
else:
    print(f'Marker not found: {marker_start!r}')
    # Show context around line 3017
    lines = content.split('\n')
    for i, l in enumerate(lines[3014:3025], start=3015):
        print(i, repr(l[:100]))
