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

rem O app le o endereco da API de src\Markaki\.env (EXPO_PUBLIC_API_URL).
rem Na primeira vez o .env e criado com o IP desta maquina na rede, que e o que
rem o celular fisico consegue alcancar (no celular, localhost e o proprio celular).
if exist "%APP%\.env" goto env_pronto

echo Criando src\Markaki\.env (endereco da API usado pelo app)...
set "LAN_IP="
for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "$r = Get-NetRoute -DestinationPrefix 0.0.0.0/0 -ErrorAction SilentlyContinue | Sort-Object RouteMetric | Select-Object -First 1; if ($r) { (Get-NetIPAddress -InterfaceIndex $r.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue | Select-Object -First 1).IPAddress }"`) do set "LAN_IP=%%i"
if not defined LAN_IP goto env_sem_ip
> "%APP%\.env" echo EXPO_PUBLIC_API_URL=http://%LAN_IP%:%API_PORT%/api
echo   Gravado: EXPO_PUBLIC_API_URL=http://%LAN_IP%:%API_PORT%/api
echo   (IP desta maquina na rede; serve para o celular na mesma rede Wi-Fi)
goto env_aviso

:env_sem_ip
copy "%APP%\.env.example" "%APP%\.env" > nul
echo   Nao consegui descobrir o IP desta maquina: o .env ficou com localhost,
echo   que so funciona no navegador ou no emulador iOS desta maquina.

:env_aviso
echo.
echo   ATENCAO: o celular fisico NAO alcanca "localhost". Ele precisa do IP do
echo   computador na mesma rede Wi-Fi (veja com "ipconfig", linha IPv4).
echo   No emulador Android use http://10.0.2.2:%API_PORT%/api
echo   Confira e, se precisar, edite agora o arquivo:
echo     %APP%\.env
echo   Depois pressione uma tecla para abrir a API e o Expo.
pause
echo.

:env_pronto
for /f "usebackq tokens=1,* delims==" %%a in (`findstr /b "EXPO_PUBLIC_API_URL=" "%APP%\.env"`) do echo Endereco da API usado pelo app: %%b
echo.

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
