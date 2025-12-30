
# Script de Teste Automatizado para Duplicidade de Planos
$API = "https://sistema-rh-google-sheets.vercel.app/api"
$SUFFIX = Get-Random -Minimum 10000 -Maximum 99999
$CPF_TESTE = "999888$SUFFIX"

Write-Host "--- INICIANDO TESTE DE DUPLICIDADE (CPF $CPF_TESTE) ---" -ForegroundColor Cyan

# 1. DELETE USER IF EXISTS
try {
    Write-Host "1. Limpando usuario de teste..."
    # Buscar ID
    $check = Invoke-RestMethod -Uri "$API/colaboradores?cpf=$CPF_TESTE" -Method Get
    if ($check.data.Count -gt 0) {
        $id = $check.data[0].id
        # Delete (Assuming endpoint exists or just reuse)
        # Se nao tiver delete, vamos apenas reusing
        Write-Host "Usuario encontrado: $id. Reutilizando."
    }
    else {
        # Create
        Write-Host "Criando usuario..."
        $body = @{
            cpf           = $CPF_TESTE
            nome_completo = "Usuario Teste Dedupe"
            email         = "teste@dedupe.com"
            cargo         = "Tester"
            departamento  = "TI"
            status        = "ativo"
            salario_base  = 5000
        } | ConvertTo-Json
       
        $new = Invoke-RestMethod -Uri "$API/colaboradores" -Method Post -Body $body -ContentType "application/json"
        $id = $new.data.id
        Write-Host "Usuario criado: $id"
    }
}
catch {
    Write-Error "Erro ao preparar usuario: $_"
    exit
}

# 2. ASSIGN PLAN A (ID 1)
try {
    Write-Host "2. Atribuindo Plano A (ID 1)..."
    $assignA = @{ plano_id = 1; matricula = "MAT01" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$API/colaboradores/$id/planos" -Method Post -Body $assignA -ContentType "application/json" | Out-Null
    Write-Host "Plano A atribuido."
}
catch {
    Write-Error "Erro ao atribuir Plano A: $_"
}

# 3. VERIFY PLANS (Should be 1)
$plans1 = Invoke-RestMethod -Uri "$API/colaboradores/$id/planos" -Method Get
Write-Host "Raw Plans Response:"
$plans1.data | ConvertTo-Json -Depth 5 | Write-Host

$active1 = $plans1.data | Where-Object { $_.ativo -eq $true -and $_.plano.tipo -eq 'SAUDE' }
Write-Host "Planos Ativos Apos A: $($active1.Count)"
if ($active1.Count -ne 1) { Write-Error "ERRO: Deveria ter 1 plano ativo." }

# 4. ASSIGN PLAN B (ID 11)
try {
    Write-Host "4. Atribuindo Plano B (ID 11)..."
    $assignB = @{ plano_id = 11; matricula = "MAT02" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$API/colaboradores/$id/planos" -Method Post -Body $assignB -ContentType "application/json" | Out-Null
    Write-Host "Plano B atribuido."
}
catch {
    Write-Error "Erro ao atribuir Plano B: $_"
}

# 5. VERIFY DEDUPLICATION
$plans2 = Invoke-RestMethod -Uri "$API/colaboradores/$id/planos" -Method Get
$active2 = $plans2.data | Where-Object { $_.ativo -eq $true -and $_.plano.tipo -eq 'SAUDE' }

Write-Host "Planos REALMENTE ATIVOS: $($active2.Count)"

if ($active2.Count -eq 1) {
    Write-Host "SUCESSO: Apenas 1 plano ativo." -ForegroundColor Green
}
else {
    Write-Error "FALHA: Existem $($active2.Count) planos ativos."
    $active2 | Format-Table id, matricula, ativo
}

# Check if ID was reused or duplicates deleted
$historyTotal = $plans2.data.Count
Write-Host "Total Registros na Tabela (Para este user): $historyTotal"
if ($historyTotal -eq 1) {
    Write-Host "SUCESSO PERFEITO: Slot reutilizado/limpo. Tabela limpa (1 registro)." -ForegroundColor Green
}
else {
    Write-Host "OK: Multiplos registros historicos ($historyTotal), mas apenas 1 ativo." -ForegroundColor Yellow
}
