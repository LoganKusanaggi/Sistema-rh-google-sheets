@echo off
REM Script Batch para Deploy - Correcoes Rodada 2
REM Executar:双击 deploy.bat ou cmd > deploy.bat

echo ==============================================
echo   DEPLOY - Correcoes Rodada 2
echo   Sistema RH Google Sheets
echo ==============================================
echo.

REM Navegar para diretorio do projeto
cd /d "c:\Users\paulo.rodrigues\Documents\Rodrigues\11. Automacao Google Sheets"

echo [1/5] Verificando Git...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo   ERRO: Git nao encontrado!
    echo   Instale em: https://git-scm.com/download/win
    pause
    exit /b 1
)
echo   Git instalado OK
echo.

echo [2/5] Verificando status do repositorio...
git status --short
echo.

echo [3/5] Adicionando arquivos modificados...
git add src/controllers/dashboardController.js
git add google-apps-script.js
git add CORRECOES-RODADA2.md
git add DEPLOY-INSTRUCOES.md
echo   Arquivos adicionados
echo.

echo [4/5] Criando commit...
git commit -m "corr: dashboard kpis com queries reais e filtros (Rodada 2)"
if %errorlevel% equ 0 (
    echo   Commit criado com sucesso!
) else (
    echo   Aviso: Pode nao haver alteracoes para commit
)
echo.

echo [5/5] Push para GitHub...
git push origin main

if %errorlevel% equ 0 (
    echo.
    echo ==============================================
    echo   DEPLOY REALIZADO COM SUCESSO!
    echo ==============================================
    echo.
    echo Proximos passos:
    echo   1. Acesse https://github.com/LoganKusanaggi/Sistema-rh-google-sheets
    echo   2. Verifique o commit
    echo   3. Acesse https://vercel.com/dashboard
    echo   4. Aguarde deploy automatico
    echo.
    echo Testar API:
    echo   curl https://sistema-rh-google-sheets.vercel.app/api/dashboard/kpis
    echo.
) else (
    echo.
    echo ==============================================
    echo   ERRO NO PUSH!
    echo ==============================================
    echo.
    echo Solucao: git push --set-upstream origin main
    echo.
)

pause
