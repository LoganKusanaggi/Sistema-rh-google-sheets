"""
Inserts server-side planos pre-load code in mostrarModalEdicao function,
right before 'const html = HtmlService.createHtmlOutput(' line.
"""

target_line = "    const html = HtmlService.createHtmlOutput(`"

inject_before = """    // FIX EDGE PERMISSION_DENIED: Pre-carrega planos no servidor antes de montar o modal.
    // Elimina google.script.run para o carregamento inicial dos dropdowns.
    var planosResult = null;
    try { planosResult = listarPlanosAPI(); } catch(e) { planosResult = { success: false, error: e.message }; }
    var planosTag = '<script type="application/json" id="srvplanos">' + JSON.stringify(planosResult) + '<\\/script>';
"""

new_target = "    const html = HtmlService.createHtmlOutput(planosTag + `"

filename = 'CODIGO_FINAL_CORRETO.js'
with open(filename, 'r', encoding='utf-8') as f:
    content = f.read()
    lines = content.split('\n')

# Find the line in mostrarModalEdicao context (around line 2075-2082)
found_idx = None
for i, line in enumerate(lines):
    # Look for the FIRST occurrence of createHtmlOutput with template literal
    # that's inside mostrarModalEdicao (around line 2076)
    if target_line in line and 2070 <= i+1 <= 2090:
        found_idx = i
        break

if found_idx is None:
    print("Target line not found in expected range. Searching entire file...")
    for i, line in enumerate(lines):
        if target_line in line:
            print(f"Found at line {i+1}: {repr(line[:100])}")
else:
    print(f"Found target at line {found_idx+1}")
    # Replace the line
    lines[found_idx] = inject_before + new_target
    new_content = '\n'.join(lines)
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Done. Lines around change:")
    for j in range(max(0, found_idx-1), min(len(lines), found_idx+7)):
        print(f"{j+1}: {lines[j][:100]}")
