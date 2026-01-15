@echo off
setlocal
echo ===================================================
echo       INICIANDO ECOSISTEMA OMAGGY
echo ===================================================
echo.

:: 1. Iniciar Ollama (Modelo de IA Local)
echo [1/4] Iniciando Ollama...
start "" powershell -WindowStyle Minimized -Command "ollama serve"

:: 2. Iniciar API Brain (Cerebro Python)
echo [2/4] Iniciando API Brain (Python Microservice)...
:: Navegamos a la carpeta del servicio, activamos venv y corremos uvicorn en segundo plano
start "" powershell -WindowStyle Minimized -Command "cd 'C:\Users\Admin\Documents\.atomLogic\ai-core-service'; .\.venv\Scripts\Activate.ps1; cd ai-brain; uvicorn app.main:app --reload"

:: 3. Iniciar Servidor Web (Frontend)
echo [3/4] Iniciando Servidor Web (Next.js)...
echo       Nota: Ejecutando en modo desarrollo (pnpm dev --filter web).
start "" powershell -WindowStyle Minimized -Command "cd 'C:\Users\Admin\Documents\.atomLogic\Omaggy'; pnpm dev --filter web"

echo.
echo [4/4] Esperando a que los servicios esten listos...
echo.

:WAIT_LOOP_WEB
:: Comprobacion puerto 3000 (Web) - Metodo silencioso TCP
powershell -Command "$client = New-Object System.Net.Sockets.TcpClient; try { $client.Connect('127.0.0.1', 3000); exit 0 } catch { exit 1 } finally { if ($client.Connected) { $client.Close() } }"
if %ERRORLEVEL% NEQ 0 (
    echo    - Esperando Web en localhost:3000...
    timeout /t 2 /nobreak >nul
    goto :WAIT_LOOP_WEB
)
echo    + Web (3000) LISTO.

:WAIT_LOOP_API
:: Comprobacion puerto 8000 (API) - Metodo silencioso TCP
powershell -Command "$client = New-Object System.Net.Sockets.TcpClient; try { $client.Connect('127.0.0.1', 8000); exit 0 } catch { exit 1 } finally { if ($client.Connected) { $client.Close() } }"
if %ERRORLEVEL% NEQ 0 (
    echo    - Esperando API Brain en localhost:8000...
    timeout /t 2 /nobreak >nul
    goto :WAIT_LOOP_API
)
echo    + API Brain (8000) LISTO.

:ALL_READY
echo.
echo ===================================================
echo       TODOS LOS SERVICIOS INICIADOS
echo       Lanzando Aplicacion de Escritorio...
echo ===================================================
echo.

:: Lanzar Electron y esperar a que se cierre
start /wait electron\dist-alt\Omaggy-win32-x64\Omaggy.exe

echo.
echo ===================================================
echo       APLICACION CERRADA - DETENIENDO SERVICIOS
echo ===================================================
echo.

:: Limpieza de procesos
echo Deteniendo Servidor Web (Puerto 3000)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo Deteniendo API Brain (Puerto 8000)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo Deteniendo Ollama...
taskkill /f /im ollama.exe >nul 2>&1
taskkill /f /im ollama_app_v2.exe >nul 2>&1

echo.
echo Limpieza completada. Hasta luego!
timeout /t 3 >nul
