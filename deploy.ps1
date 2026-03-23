# Script PowerShell para Deploy - Correções Rodada 2
# Executar no PowerShell: .\deploy.ps1

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  DEPLOY - Correcoes Rodada 2" -ForegroundColor Cyan
Write-Host "  Sistema RH Google Sheets" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Navegar para diretorio do projeto
$projectDir = "c:\Users\paulo.rodrigues\Documents\Rodrigues\11. Automação Google Sheets"
Set-Location $projectDir

Write-Host "[1/5] Verificando Git..." -ForegroundColor Yellow
try {
    $gitVersion = git --version 2>&1
    Write-Host "  Git instalado: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "  ERRO: Git nao encontrado!" -ForegroundColor Red
    Write-Host "  Instale o Git em: https://git-scm.com/download/win" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/5] Verificando status do repositorio..." -ForegroundColor Yellow
git status

Write-Host ""
Write-Host "[3/5] Adicionando arquivos modificados..." -ForegroundColor Yellow
git add src/controllers/dashboardController.js
git add google-apps-script.js
git add CORRECOES-RODADA2.md
git add DEPLOY-INSTRUCOES.md
Write-Host "  Arquivos adicionados ao staging" -ForegroundColor Green

Write-Host ""
Write-Host "[4/5] Criando commit..." -ForegroundColor Yellow
$commitMessage = @"
corr: dashboard kpis com queries reais e filtros (Rodada 2)

- dashboardController.js: queries reais para folha, beneficios, variavel, turnover
- dashboardController.js: suporte a filtros mes/ano/depto via query params
- dashboardController.js: top performers com dados da tabela variavel
- dashboardController.js: alertas com aniversariantes do mes
- dashboardController.js: vagas abertas retorna count real ou 0
- google-apps-script.js: funcao popularDepartamentos()
- google-apps-script.js: funcao limparFiltros()
- google-apps-script.js: aplicarFiltros() com status visual
- google-apps-script.js: botao Limpar na barra de filtros

Resolucao dos problemas:
- PROBLEMA 1: Filtros do dashboard nao funcionavam
- PROBLEMA 2: KPIs zerados (Folha, Beneficios, Variavel, Turnover, Ticket Medio)
- PROBLEMA 3: Grafico Top Performers em branco
- PROBLEMA 4: Letreiro com conteudo inutil
- PROBLEMA 5: Vagas Abertas hardcoded (valor 7)
- PROBLEMA 6: Submenu Relatorios (orientacao de deploy)
"@

git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Commit criado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "  Aviso: Pode nao haver alteracoes para commit" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[5/5] Push para GitHub..." -ForegroundColor Yellow
Write-Host "  Branch: main" -ForegroundColor Cyan

git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==============================================" -ForegroundColor Green
    Write-Host "  DEPLOY REALIZADO COM SUCESSO!" -ForegroundColor Green
    Write-Host "==============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Proximos passos:" -ForegroundColor Cyan
    Write-Host "  1. Acesse https://github.com/LoganKusanaggi/Sistema-rh-google-sheets" -ForegroundColor White
    Write-Host "  2. Verifique se o commit apareceu" -ForegroundColor White
    Write-Host "  3. Acesse https://vercel.com/dashboard" -ForegroundColor White
    Write-Host "  4. Aguarde o deploy automatico (2-3 minutos)" -ForegroundColor White
    Write-Host ""
    Write-Host "Testar API:" -ForegroundColor Cyan
    Write-Host "  curl https://sistema-rh-google-sheets.vercel.app/api/dashboard/kpis" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "==============================================" -ForegroundColor Red
    Write-Host "  ERRO NO PUSH!" -ForegroundColor Red
    Write-Host "==============================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possiveis causas:" -ForegroundColor Yellow
    Write-Host "  - Autenticacao GitHub necessaria" -ForegroundColor White
    Write-Host "  - Branch nao existe no remoto" -ForegroundColor White
    Write-Host "  - Conflitos de merge" -ForegroundColor White
    Write-Host ""
    Write-Host "Solucao:" -ForegroundColor Yellow
    Write-Host "  git push --set-upstream origin main" -ForegroundColor White
    Write-Host ""
}

Write-Host "Pressione qualquer tecla para sair..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
