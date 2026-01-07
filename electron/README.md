# Documentación de Omaggy Desktop (Electron)

## Descripción General
Este proyecto integra una aplicación de escritorio basada en **Electron** que sirve como contenedor para la aplicación web Omaggy (Next.js).

## 🚀 Cómo Ejecutar la Aplicación

Debido a la arquitectura actual, la aplicación de escritorio funciona conectándose al servidor local de Next.js. Se requieren dos procesos simultáneos:

1.  **Iniciar el Servidor Web (Next.js)**:
    *   Abre una terminal en la raíz del proyecto o en `apps/web`.
    *   Ejecuta el servidor:
        ```bash
        cd apps/web
        npm start
        ```
    *   *Nota: Asegúrate de haber ejecutado `npm run build` en `apps/web` previamente si usas `start`, o usa `npm run dev` para desarrollo.*

2.  **Iniciar la Aplicación de Escritorio**:
    *   Abre una nueva terminal.
    *   Navega a la carpeta de Electron:
        ```bash
        cd electron
        ```
    *   Inicia la aplicación:
        ```bash
        npm start
        ```

## 📦 Exportación y Generación del Ejecutable

Para generar el instalable o ejecutable (.exe) para Windows:

1.  Asegúrate de estar en la carpeta `electron`.
2.  Ejecuta el comando de empaquetado:
    ```bash
    npm run pack
    ```
3.  **Ubicación del archivo**:
    El ejecutable se generará en la carpeta `dist`:
    `electron/dist/Omaggy-win32-x64/Omaggy.exe`

Puedes comprimir y distribuir la carpeta `Omaggy-win32-x64`.

## ⚠️ Limitaciones Técnicas y Arquitectura

Es importante entender las siguientes limitaciones actuales del ejecutable generado:

1.  **Dependencia del Servidor Local (Client-Server Model)**:
    *   El ejecutable **NO** contiene el servidor Next.js embebido de forma autónoma.
    *   Actúa como un cliente dedicado que intenta conectarse a `http://localhost:3000`.
    *   **Implicación**: Para que el `.exe` funcione en la máquina de un usuario final, el servidor web debe estar ejecutándose en esa misma máquina (o ser accesible vía red).

2.  **Por qué no es totalmente autónomo (Standalone)**:
    *   **Next.js Dinámico**: La aplicación utiliza características dinámicas (Rutas API, SSR, i18n, Autenticación) que impiden el uso de una "Exportación Estática" (`output: 'export'`).
    *   **Restricciones de Sistema**: Durante el intento de crear un build "Standalone" (que empaqueta Node.js + Next.js), se encontraron errores de permisos con enlaces simbólicos (symlinks) en el entorno Windows (`EPERM: operation not permitted`), lo que impidió empaquetar las dependencias del servidor (`node_modules`) dentro del ejecutable.

## ⚙️ Configuración

Los archivos clave para modificar el comportamiento de la aplicación de escritorio son:

*   **[main.js](main.js)**:
    *   Contiene la lógica principal de Electron.
    *   Incluye un sistema de **reintento automático**: Si el servidor (localhost:3000) no está listo al abrir la app, Electron reintentará la conexión cada segundo en lugar de mostrar una pantalla blanca de error.
    *   Configura las dimensiones de la ventana y los permisos de seguridad.

*   **[package.json](package.json)**:
    *   Define el nombre del producto (`productName: "Omaggy"`).
    *   Configura los scripts de construcción (`pack`, `dist`).
    *   Aquí puedes cambiar el icono (`icon.ico`) y los metadatos de la aplicación.
