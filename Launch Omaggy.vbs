Set WshShell = CreateObject("WScript.Shell")

' Obtener el directorio actual
strCurDir = WshShell.CurrentDirectory

' Ruta al servidor web y comando de inicio
strWebDir = strCurDir & "\apps\web"
strWebCmd = "cmd /c cd /d """ & strWebDir & """ && npm start"

' Ruta al ejecutable de Electron
strElectronApp = strCurDir & "\electron\dist_v2\Omaggy-win32-x64\Omaggy.exe"

' 1. Iniciar el servidor Next.js en modo oculto (0 = oculto, false = no esperar a que termine)
WshShell.Run strWebCmd, 0, false

' Esperar 5 segundos para dar tiempo al servidor a iniciar
WScript.Sleep 5000

' 2. Iniciar la aplicación de escritorio y ESPERAR a que termine (true)
WshShell.Run """" & strElectronApp & """", 1, true

' 3. Limpieza: Matar el proceso que escucha en el puerto 3000
strKillCmd = "cmd /c for /f ""tokens=5"" %a in ('netstat -aon ^| find "":3000"" ^| find ""LISTENING""') do taskkill /f /pid %a"
WshShell.Run strKillCmd, 0, true
