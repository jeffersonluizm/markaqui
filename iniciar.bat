@echo off
title Markaki - Iniciador
cd /d "%~dp0"

set "APP=%~dp0src\Markaki"
set "API_PORT=3000"
set "EXPO_PORT=8081"

echo ============================================
echo        Markaki - Iniciando tudo...
echo ============================================
echo.

where node > nul 2>&1
if errorlevel 1 (
    echo Node.js nao encontrado. Instale o Node.js LTS e rode de novo.
    goto fim
)

if not exist "%APP%\.env" (
    echo Criando src\Markaki\.env a partir do .env.example...
    copy "%APP%\.env.example" "%APP%\.env" > nul
    echo Ajuste EXPO_PUBLIC_API_URL no .env se for usar celular ou emulador Android.
    echo.
)

echo Abrindo a API e o Expo em janelas separadas.
echo Na primeira vez cada janela instala as dependencias (npm install).
echo.

netstat -ano | findstr /R /C:":%API_PORT% .*LISTENING" > nul
if errorlevel 1 (
    start "Markaki - API" cmd /k "title Markaki API && cd /d ""%APP%\backend"" && ((if not exist node_modules npm install) & npm start)"
) else (
    echo API ja esta rodando na porta %API_PORT%.
)

netstat -ano | findstr /R /C:":%EXPO_PORT% .*LISTENING" > nul
if errorlevel 1 (
    start "Markaki - App (Expo)" cmd /k "title Markaki App Expo && cd /d ""%APP%"" && ((if not exist node_modules npm install) & npx expo start --port %EXPO_PORT%)"
) else (
    echo Expo ja esta rodando na porta %EXPO_PORT%.
)

echo.
echo ============================================
echo   API     : http://localhost:%API_PORT%/api/medicos
echo   App     : escaneie o QR code na janela do Expo (Expo Go)
echo             ou tecle "a" nela para abrir no emulador Android
echo   Endereco da API usado pelo app: src\Markaki\.env
echo   Para parar: feche as janelas "Markaki - API" e "Markaki - App (Expo)"
echo ============================================

:fim
echo.
pause
