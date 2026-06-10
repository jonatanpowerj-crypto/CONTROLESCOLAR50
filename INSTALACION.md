# 🛠️ Guía de instalación — SIGE Prepa 50 (versión profesional en la nube)
**Preparatoria No. 50 · UAGro · Tlacoachistlahuaca, Gro.**

Esta guía te lleva de cero a tener el sistema operando en internet, con base de datos
en la nube, inicio de sesión para docentes y portal de consulta para padres.
**Tiempo estimado: 30–40 minutos. Costo: $0** (planes gratuitos de GitHub y Firebase).

> 💡 Si solo quieres probar el sistema sin nube, salta a la **Parte 1** y deja el archivo
> `js/config.js` como viene: el sistema funcionará en **modo local** (datos en el navegador).

---

## PARTE 1 — Publicar el sitio en GitHub Pages (10 min)

1. Entra a [github.com](https://github.com) y crea una cuenta si no la tienes.
2. Pulsa **➕ → New repository**. Nómbralo, por ejemplo, `sige-prepa50`. Déjalo **Public** y pulsa **Create repository**.
3. En el repositorio pulsa **Add file → Upload files** y arrastra **todo el contenido descomprimido del ZIP**: `index.html`, `README.md`, `LICENSE`, `INSTALACION.md`, `firestore.rules` y las carpetas `css` y `js`. Pulsa **Commit changes**.
4. Ve a **Settings → Pages**. En *Build and deployment* elige **Deploy from a branch**, rama **main**, carpeta **/(root)** y pulsa **Save**.
5. Espera 1–2 minutos y recarga esa página: aparecerá tu dirección, algo como
   `https://TU-USUARIO.github.io/sige-prepa50/`
6. Ábrela. Verás el sistema funcionando en **modo local** (verás la etiqueta «💾 Modo local» arriba a la derecha). ✅ La mitad del trabajo está hecha.

---

## PARTE 2 — Crear el proyecto de Firebase (10 min)

Firebase es la nube gratuita de Google que dará al sistema base de datos central e inicio de sesión.

1. Entra a [console.firebase.google.com](https://console.firebase.google.com) con una cuenta de Google (puede ser la del plantel).
2. Pulsa **Crear un proyecto** (o "Agregar proyecto"). Nómbralo `sige-prepa50`. 
   - Cuando pregunte por **Google Analytics**, puedes **desactivarlo** (no se necesita). Pulsa **Crear proyecto** y espera.

### 2A. Activar el inicio de sesión de docentes
3. En el menú izquierdo: **Compilación → Authentication → Comenzar**.
4. En la pestaña **Sign-in method** elige **Correo electrónico/contraseña**, actívalo (solo el primer interruptor) y **Guarda**.
5. Ve a la pestaña **Users → Agregar usuario** y crea la cuenta de cada docente:
   correo institucional + una contraseña (mínimo 6 caracteres). 
   📌 *Aquí es donde la dirección del plantel da de alta y de baja a los docentes.*

### 2B. Crear la base de datos
6. Menú izquierdo: **Compilación → Firestore Database → Crear base de datos**.
7. Ubicación: elige una cercana, por ejemplo **us-south1 (Dallas)** o la que sugiera. 
8. Modo: elige **Comenzar en modo de producción** y pulsa **Crear**.
9. Ve a la pestaña **Reglas**, borra lo que aparece y **pega el contenido completo del archivo `firestore.rules`** que viene en el proyecto. Pulsa **Publicar**.
   - Las reglas activas permiten: *cualquiera puede consultar* (para el portal de padres) y *solo docentes con sesión pueden modificar*. El mismo archivo explica cómo hacerlo 100 % privado si el plantel lo prefiere.

### 2C. Obtener las llaves de conexión
10. Pulsa el **engrane ⚙ → Configuración del proyecto**. Baja hasta **Tus apps** y pulsa el ícono **`</>` (Web)**.
11. Ponle un apodo (ej. `sige-web`), **NO** marques Firebase Hosting, y pulsa **Registrar app**.
12. Te mostrará un bloque `const firebaseConfig = { apiKey: "...", ... }`. 
    **Copia los 6 valores** (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId). Déjalos a la mano.

---

## PARTE 3 — Conectar el sitio con la nube (5 min)

1. En tu repositorio de GitHub abre la carpeta **`js`** → archivo **`config.js`** → botón del **lápiz ✏️ (Edit)**.
2. Reemplaza cada `"PEGA_AQUI..."` con el valor correspondiente que copiaste de Firebase. Debe quedar así (con TUS valores):
   ```js
   const FIREBASE_CONFIG = {
     apiKey:            "AIzaSyB...tu_llave...",
     authDomain:        "sige-prepa50.firebaseapp.com",
     projectId:         "sige-prepa50",
     storageBucket:     "sige-prepa50.appspot.com",
     messagingSenderId: "123456789012",
     appId:             "1:123456789012:web:abc123..."
   };
   ```
3. Pulsa **Commit changes**, espera 1–2 minutos y abre tu sitio con **Ctrl + F5**.
4. ¡Ahora verás la **pantalla de inicio de sesión**! Eso confirma que el modo nube está activo.

> 🔐 ¿Es seguro que estas llaves estén públicas? **Sí**: las llaves de Firebase web son
> identificadores públicos por diseño; la seguridad real la dan las **reglas de Firestore**
> que publicaste y las cuentas de Authentication.

---

## PARTE 4 — Primer arranque y carga de datos (10 min)

1. Inicia sesión con una cuenta de docente que creaste en el paso 2A‑5.
2. El sistema estará **vacío** (es la nube nueva). Tienes 3 caminos:
   - **Empezar de cero:** registra materias, grupos, alumnos (o impórtalos desde Excel) y horarios.
   - **Probar con datos demo:** ve a **Reportes → Restablecer con datos de demostración**; los datos ficticios se subirán a la nube.
   - **Migrar tus datos de la versión local:** si ya trabajabas en modo local, abre la versión anterior, pulsa **⬇ Respaldo** (descarga el JSON) y, ya con sesión iniciada en la nube, pulsa **⬆ Restaurar** y elige ese archivo: **todo se sube automáticamente a Firestore**.
3. Prueba la sincronización: abre el sitio en tu celular, inicia sesión y pasa lista; verás el registro aparecer en la laptop **en segundos, sin recargar**. ✨
4. Prueba el **portal de padres**: en otro navegador (o ventana de incógnito) abre tu URL y pulsa **«Consultar como padre o alumno»**; escribe una matrícula. Esa misma dirección es la que compartirás a las familias.

---

## PARTE 5 — Pantallas táctiles y kiosco (2 min)

- Pulsa el botón **👆 Táctil** (arriba a la derecha) en cualquier equipo con pantalla touch: botones, celdas y campos crecen para dedos, conservando el mismo diseño. La preferencia se recuerda por dispositivo.
- Para el auto-registro en el aula: inicia sesión en la tablet/pantalla, entra a **Pase de lista**, elige materia y grupo y pulsa **🖥️ Modo kiosco**. Sugerencia: activa también el modo táctil en ese equipo.

---

## Operación diaria y buenas prácticas

| Tema | Recomendación |
|---|---|
| **Altas/bajas de docentes** | Solo desde Firebase → Authentication → Users. Sin cuenta, nadie puede modificar datos. |
| **Contraseña olvidada** | La dirección puede restablecerla desde Authentication → Users → ⋮ → Reset password. |
| **Respaldos** | Aunque la nube ya respalda, descarga el **⬇ Respaldo JSON** cada fin de parcial y guárdalo en el equipo del plantel. **No subas respaldos con datos reales al repositorio público** (son datos de menores). |
| **Sin internet en el aula** | El sistema sigue funcionando: Firestore guarda los cambios en el dispositivo y los **sincroniza solo** al volver la conexión. |
| **Límites gratuitos** | El plan Spark de Firebase incluye 50,000 lecturas y 20,000 escrituras **diarias**: de sobra para un plantel completo. GitHub Pages es gratuito para sitios públicos. |
| **Privacidad** | Con la Opción A de reglas, cualquiera con la URL puede *leer* datos. Si el plantel prefiere todo privado, aplica la Opción B del archivo `firestore.rules` y crea una cuenta genérica de consulta para padres. |

## Solución de problemas

- **Sigue apareciendo «Modo local» después de pegar la configuración** → revisa que en `config.js` no quede ningún texto `PEGA_AQUI` y recarga con Ctrl + F5.
- **«Correo o contraseña incorrectos»** → la cuenta debe existir en Authentication → Users y el proveedor Correo/contraseña debe estar habilitado.
- **«No fue posible leer…»** → no publicaste las reglas de Firestore (Parte 2B‑9) o la base aún está creándose.
- **La cámara no abre** → solo funciona con HTTPS (tu GitHub Pages ya lo es) y aceptando el permiso del navegador.
- **No se ven cambios recientes del sitio** → GitHub Pages tarda 1–2 min en publicar; recarga con **Ctrl + F5**.
