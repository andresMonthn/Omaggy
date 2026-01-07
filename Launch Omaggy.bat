@echo off
echo Iniciando servidor Omaggy...
start /min cmd /c "cd apps\web && npm start"

echo Esperando al servidor...
timeout /t 5

echo Iniciando aplicacion de escritorio...
start /wait electron\dist_v2\Omaggy-win32-x64\Omaggy.exe

echo Aplicacion cerrada. Deteniendo servidor...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do taskkill /f /pid %%a

echo Limpieza completada.