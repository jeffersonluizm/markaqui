@echo off
setlocal EnableDelayedExpansion
title Markaqui - Iniciador
cd /d "%~dp0"

set "APP=%~dp0src\Markaki"
set "API=%~dp0src\Markaki\backend"
rem Portas (podem ser trocadas antes de chamar: set API_PORT=3100).
if not defined API_PORT set "API_PORT=3000"
if not defined EXPO_PORT set "EXPO_PORT=8081"
rem Celular na mesma rede: rode "set LAN=1" antes (a API fica visivel na rede local).
set "API_HOST=127.0.0.1"
if "%LAN%"=="1" set "API_HOST=0.0.0.0"

echo ============================================
echo   Markaqui - preparando a demonstracao local
echo ============================================
echo.

rem 1. Pre-requisito: Node.js 22 ou mais novo.
where node > nul 2>&1
if errorlevel 1 (
    echo [erro] Node.js nao encontrado. Instale o Node.js LTS: https://nodejs.org/
    echo        Depois feche esta janela e rode o iniciar.bat de novo.
    pause
    exit /b 1
)
for /f "tokens=1 delims=." %%v in ('node -p "process.versions.node"') do set "NODE_MAIOR=%%v"
if %NODE_MAIOR% LSS 22 (
    echo [erro] Node.js %NODE_MAIOR% e antigo demais. Instale o Node.js 22 ou mais novo: https://nodejs.org/
    pause
    exit /b 1
)
echo [ok] Node.js encontrado.

rem 2. Dependencias (so na primeira vez).
if not exist "%API%\node_modules" (
    echo [..] Instalando as dependencias da API, so na primeira vez...
    call npm --prefix "%API%" ci --no-audit --no-fund
    if errorlevel 1 ( echo [erro] Falha ao instalar as dependencias da API. & pause & exit /b 1 )
)
if not exist "%APP%\node_modules" (
    echo [..] Instalando as dependencias do app, so na primeira vez. Pode levar alguns minutos...
    call npm --prefix "%APP%" ci --no-audit --no-fund
    if errorlevel 1 ( echo [erro] Falha ao instalar as dependencias do app. & pause & exit /b 1 )
)
echo [ok] Dependencias instaladas.

rem 3. Configuracao da API (src\Markaki\backend\.env): segredo aleatorio e modo
rem    demonstracao ligado (entrar como paciente ou clinica, sem senha).
if not exist "%API%\.env" (
    for /f "usebackq delims=" %%s in (`node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`) do set "JWT=%%s"
    > "%API%\.env" echo # Criado pelo iniciar.bat. Nao vai para o Git. Modelo: .env.example
    >> "%API%\.env" echo JWT_SECRET=!JWT!
    >> "%API%\.env" echo PORT=%API_PORT%
    >> "%API%\.env" echo # So esta maquina. Para o celular na mesma rede, o iniciar.bat com LAN=1 usa 0.0.0.0.
    >> "%API%\.env" echo HOST=127.0.0.1
    >> "%API%\.env" echo CORS_ORIGENS=http://localhost:%EXPO_PORT%
    >> "%API%\.env" echo DEMO_ENABLED=true
    echo [ok] Criado src\Markaki\backend\.env com um segredo aleatorio.
)

rem 4. Configuracao do app (src\Markaki\.env): endereco da API.
if not exist "%APP%\.env" (
    > "%APP%\.env" echo EXPO_PUBLIC_API_URL=http://localhost:%API_PORT%/api
    echo [ok] Criado src\Markaki\.env apontando para http://localhost:%API_PORT%/api
)

rem 5. Banco SQLite com os dados de demonstracao (so se estiver vazio).
pushd "%API%"
call npm run --silent semear
if errorlevel 1 ( popd & echo [erro] Falha ao preparar o banco. & pause & exit /b 1 )
popd

rem 6. API numa janela propria e espera ela responder.
netstat -ano | findstr /R /C:":%API_PORT% .*LISTENING" > nul
if errorlevel 1 (
    start "Markaqui - API" /D "%API%" cmd /k "title Markaqui API && set HOST=%API_HOST%&& npm start"
) else (
    echo [aviso] Ja existe algo na porta %API_PORT%; usando a API que esta rodando.
)
echo [..] Esperando a API responder...
powershell -NoProfile -Command "$fim=(Get-Date).AddSeconds(60); while((Get-Date) -lt $fim){ try { Invoke-RestMethod http://127.0.0.1:%API_PORT%/api/saude -TimeoutSec 2 | Out-Null; exit 0 } catch { Start-Sleep -Milliseconds 500 } }; exit 1"
if errorlevel 1 (
    echo [erro] A API nao respondeu em 60 s. Veja a janela "Markaqui - API".
    pause
    exit /b 1
)
echo [ok] API no ar.

rem 7. App pelo Expo: abre no navegador (w) e mostra o QR code para o Expo Go.
netstat -ano | findstr /R /C:":%EXPO_PORT% .*LISTENING" > nul
if errorlevel 1 (
    start "Markaqui - App (Expo)" /D "%APP%" cmd /k "title Markaqui App && npx expo start --web --port %EXPO_PORT%"
) else (
    echo [aviso] Ja existe algo na porta %EXPO_PORT%; abra http://localhost:%EXPO_PORT% no navegador.
)

echo.
echo ============================================
echo   Pronto. O navegador abre sozinho em alguns segundos:
echo     http://localhost:%EXPO_PORT%
echo   Na tela inicial, use "Explore a demonstracao" e entre como
echo   paciente ou como clinica com um clique.
echo.
echo   API: http://localhost:%API_PORT%/api/saude
echo   Celular: feche as janelas, rode "set LAN=1" e o iniciar.bat de novo;
echo     troque localhost em src\Markaki\.env pelo IP deste computador
echo     (ipconfig, linha IPv4) e leia o QR code com o Expo Go.
echo     Com LAN=1 a API e as contas demo ficam visiveis na rede local.
echo   Para parar: feche as janelas "Markaqui - API" e "Markaqui - App".
echo ============================================
echo.
pause
