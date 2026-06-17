# Lumen — Personal Command Center

App de escritorio (Electron + React + Vite + Tailwind) para Windows. Tareas, calendario, mood/diario, ideas y hábitos, con acceso real a una carpeta de imágenes y conexión a Google Calendar.

## Requisitos
- Node.js 18+ (recomendado 20) — https://nodejs.org
- Windows 10/11

## Arrancar en desarrollo
```bash
npm install
npm run dev
```
Esto levanta Vite y abre la ventana de Electron. Recarga en caliente al editar.

## Empaquetar (instalador .exe para Windows)
```bash
npm run package
```
El instalador NSIS queda en `release/`. (Para el icono, pon `build/icon.ico`.)

## Dónde se guardan tus datos
Todo (tareas, mood, ideas, hábitos, ajustes) se guarda como JSON en:
```
C:\Users\<tú>\AppData\Roaming\Lumen\lumen-data.json
```
No sale de tu equipo.

## Carpeta de imágenes (tile visual)
En el tile de imagen pulsa **Pick folder** y elige una carpeta. La app lista las imágenes y las rota. Para servirlas de forma segura usamos un protocolo propio `lumen-img://` (evita los problemas de `file://` con rutas de Windows).

## Google Calendar (setup)
La integración está preparada en el código (`src/lib/google.js`) pero requiere tus credenciales:

1. Entra en https://console.cloud.google.com y crea un proyecto.
2. **APIs y servicios → Biblioteca** → activa **Google Calendar API**.
3. **Credenciales → Crear credenciales → ID de cliente de OAuth** → tipo **App de escritorio**.
4. Descarga el client ID y secret. Crea un archivo `.env` en la raíz:
   ```
   GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=xxxx
   ```
5. El flujo OAuth vive en el **proceso main** de Electron (no en el renderer). Cuando quieras, te paso los handlers IPC (`google:connect`, `google:events`) usando `googleapis` para completar la conexión: abre el consentimiento, guarda el refresh token y trae los eventos ya normalizados al formato de la app.

Mientras no esté conectado, la app usa eventos de ejemplo.

## Estructura
```
electron/        proceso main + preload (IPC: estado en disco, carpeta de imágenes)
src/
  lib/           utils (fechas, constantes), store (persistencia), google (stub)
  components/    Header, Focal (tareas), ImageTile, Tiles (resto)
  App.jsx        layout de 3 columnas independientes
  styles/        tokens de tema claro/oscuro + Tailwind
```

## Notas de diseño
- Layout de **3 columnas independientes**: cada columna fluye sola, así que el alto de una tile no arrastra a sus vecinas (se acabó el bug de los gaps).
- Tareas: 3 estados (vacío → en curso → hecho), editar al click, arrastrar para reordenar o cambiar de categoría, menú de estado (Started/On hold/Postponed) y papelera rápida.
- Mood: calendario con vista Events/Happiness; click en cualquier día abre su detalle y permite puntuar; el tile Mood siempre es hoy.
