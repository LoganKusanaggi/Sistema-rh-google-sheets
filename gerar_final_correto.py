import re

# Ler arquivos
try:
    with open('SISTEMA_RH_FINAL.js', 'r', encoding='utf-8') as f:
        original = f.read()

    with open('novas_funcoes_v3.js', 'r', encoding='utf-8') as f:
        novas_funcoes = f.read()
except FileNotFoundError as e:
    print(f"❌ Erro: Arquivo não encontrado: {e}")
    exit(1)

# Encontrar o início da substituição
start_marker = "function criarPlanilhaLancamentoFolha(cpfs, periodo, dadosMap = null) {"
start_idx = original.find(start_marker)

if start_idx == -1:
    print("❌ Erro: Não encontrei o início da função criarPlanilhaLancamentoFolha")
    # Tentar achar sem os argumentos para ser mais flexível
    start_marker_simple = "function criarPlanilhaLancamentoFolha"
    start_idx = original.find(start_marker_simple)
    if start_idx == -1:
        print("❌ Erro fatal: Função criarPlanilhaLancamentoFolha realmente não encontrada.")
        exit(1)

# Encontrar o fim da substituição
# Procuramos pelo próximo separador de seção após a função enviarFolhaParaAPI
enviar_marker = "function enviarFolhaParaAPI() {"
enviar_idx = original.find(enviar_marker, start_idx)

if enviar_idx == -1:
    print("❌ Erro: Não encontrei o início da função enviarFolhaParaAPI")
    exit(1)

# Procurar o separador de seção APÓS enviar_idx
# O separador é // =====================================================
# Mas pode haver variações, então vamos procurar pelo próximo bloco de comentários grande ou a próxima função
# A próxima função no arquivo original é buscarDadosColaboradores
proxima_funcao = "function buscarDadosColaboradores"
end_idx = original.find(proxima_funcao, enviar_idx)

if end_idx == -1:
    # Tentar achar o separador de utilitários
    separador = "// UTILITÁRIOS DE API"
    end_idx = original.find(separador, enviar_idx)
    
    if end_idx == -1:
        print("❌ Erro: Não encontrei o fim da seção (nem buscarDadosColaboradores nem UTILITÁRIOS DE API)")
        # Fallback: procurar o fechamento da função enviarFolhaParaAPI contando chaves (arriscado mas necessário se falhar)
        # Vamos assumir que termina antes de buscarDadosColaboradores
        print("Tentando achar o separador genérico...")
        separador_gen = "// ====================================================="
        end_idx = original.find(separador_gen, enviar_idx)
        if end_idx == -1:
             print("❌ Erro fatal: Não consegui determinar onde termina o bloco a ser substituído.")
             exit(1)

# Ajuste fino: Se achou a próxima função ou separador, queremos substituir ATÉ ANTES dele.
# Mas queremos incluir o separador no arquivo final?
# O arquivo novas_funcoes_v2.js NÃO tem o separador no final.
# Então devemos preservar o separador do arquivo original.
# end_idx aponta para o início do separador ou da próxima função.
# Então parte_posterior começa em end_idx.

# Mas espere, entre enviarFolhaParaAPI e o separador pode haver linhas em branco.
# Vamos pegar até end_idx.

parte_anterior = original[:start_idx]
parte_posterior = original[end_idx:]

# Construir o código final
# Adicionamos quebras de linha para garantir separação
codigo_final = parte_anterior + novas_funcoes + "\n\n" + parte_posterior

# Salvar o resultado
with open('CODIGO_FINAL_CORRETO.js', 'w', encoding='utf-8') as f:
    f.write(codigo_final)

print("✅ Arquivo CODIGO_FINAL_CORRETO.js gerado com sucesso!")
print(f"Substituído trecho de {start_idx} até {end_idx}")
