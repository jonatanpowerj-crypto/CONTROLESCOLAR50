# 🎓 SIGE Prepa 50 — Sistema Integral de Gestión Escolar

**Preparatoria No. 50 · Universidad Autónoma de Guerrero (UAGro) · Tlacoachistlahuaca, Gro.**

Aplicación web para que los docentes de nivel bachillerato tengan el **control total de su labor diaria**: pase de lista automatizado con **códigos QR generados por el propio sistema** (o de forma tradicional), administración de materias con **rubros de evaluación ponderados**, horarios, docentes, grupos, alumnos, y un **portal de consulta para alumnos y padres de familia**.

> Funciona en **dos modos**: **local** (sin servidor, datos en el navegador, ideal para probar) y **nube** (Firebase: inicio de sesión para docentes, datos sincronizados en tiempo real entre todos los dispositivos, modo sin conexión y portal de padres desde casa). Cambiar de modo solo requiere pegar tu configuración en `js/config.js`. **Guía completa en [INSTALACION.md](INSTALACION.md)**. Incluye **modo táctil** para pantallas touch.

---

## 📌 Análisis profundo del problema

### Contexto
En la Preparatoria No. 50 de la UAGro, en Tlacoachistlahuaca, el docente concentra muchas tareas administrativas: pasar lista en papel, vaciar asistencias a concentrados, calcular promedios con ponderaciones distintas por materia, atender dudas de padres sobre el avance de sus hijos y cuadrar horarios. Estas tareas consumen tiempo de clase y son propensas a errores de captura.

### Actores y necesidades detectadas

| Actor | Necesidad principal | Cómo la resuelve el sistema |
|---|---|---|
| **Docente** | Pasar lista rápido y sin errores; capturar calificaciones por rubros | Escáner QR con cámara (≈2 s por alumno) o lista tradicional P/R/J/F; matriz de captura con promedio ponderado automático |
| **Administración** | Controlar plantilla docente, materias, grupos y horarios sin choques | Módulos CRUD completos con validación de empalmes de horario y matrículas duplicadas |
| **Alumno** | Conocer su asistencia, calificaciones y horario | Portal de consulta por matrícula |
| **Padre / tutor** | Dar seguimiento sin acudir al plantel | Mismo portal: % de asistencia por materia, promedios por parcial y próximas clases |
| **Dirección** | Detectar riesgo y generar evidencia | Panel con alumnos < 80 % de asistencia y reportes CSV exportables a Excel |

### Rubros que maneja el sistema
Cada materia define sus propios **rubros de evaluación con peso porcentual** (p. ej. *Examen parcial 40 %, Tareas 25 %, Participación 15 %, Proyecto 20 %*). El sistema:
- Valida que los pesos sumen 100 % y avisa si no es así.
- Calcula en tiempo real el **promedio ponderado** por alumno, materia y parcial (1, 2 y 3).
- Marca en rojo los promedios reprobatorios (< 6.0).

### Decisiones de diseño
1. **Asistencia con doble modalidad.** El QR acelera grupos numerosos; el modo tradicional garantiza operación sin cámara, sin internet en el aula o cuando un alumno olvida su credencial. Ambos métodos escriben en el mismo registro (se distingue el método `qr`/`manual`).
2. **QR generado por el sistema.** Cada alumno recibe una **credencial imprimible** con QR en formato `P50|MATRÍCULA`. El docente escanea desde su teléfono o laptop; el registro guarda fecha, hora y método. El escáner rechaza códigos ajenos al plantel y alumnos de otro grupo.
3. **Cuatro estados de asistencia** alineados a la práctica escolar mexicana: **P**resente, **R**etardo, **J**ustificada, **F**alta. Para el % de asistencia, P, R y J cuentan a favor.
4. **Sin servidor (offline-first).** Los datos viven en `localStorage` con **respaldo/restauración en JSON**, lo que permite usarla de inmediato y migrar después a un backend (ver hoja de ruta).
5. **Alertas tempranas.** El panel destaca alumnos con asistencia menor a 80 %, umbral común para derecho a examen ordinario.

---

## 🧩 Módulos

| Módulo | Funciones |
|---|---|
| 🏠 **Panel del día** | Clases de hoy según horario, asistencias/faltas del día, alumnos en riesgo, accesos rápidos |
| 📋 **Pase de lista** | Escáner QR con cámara (html5-qrcode) **o** lista tradicional; botón "Todos presentes"; anti-lectura doble; tolerancia configurable |
| 🧮 **Calificaciones** | Captura por rubros y parciales; promedio ponderado en vivo; guardado por grupo/materia |
| 👩‍🏫 **Docentes** | Alta, edición y baja; materias asignadas visibles; buscador |
| 📚 **Materias y rubros** | CRUD de materias con clave, semestre, docente responsable y editor de rubros con validación de pesos |
| 🎓 **Grupos y alumnos** | CRUD de grupos (turno/semestre) y alumnos (matrícula única, datos del tutor); % de asistencia global; **importación masiva desde Excel/CSV** con plantilla descargable, detección de duplicados y vista previa |
| 🗓️ **Horarios** | Vista semanal Lunes–Viernes por grupo; **detección de choques de horario**; aulas |
| 🪪 **Credenciales QR** | Gafete institucional por alumno con QR generado por el sistema; **impresión por grupo** lista para plastificar |
| 🔎 **Portal alumnos y padres** | Consulta por matrícula: asistencia global y por materia, promedios por parcial, próximas clases, datos del docente |
| 📊 **Estadísticas** | Gráficas interactivas (Chart.js): asistencia por estado, tendencia diaria de asistencia, % de aprobación por parcial y desempeño por rubro o por materia, con tarjetas resumen |
| 🖥️ **Modo kiosco** | Pantalla fija de auto-registro: el alumno acerca su credencial QR a la cámara y el sistema lo registra solo, con reloj en vivo, confirmación visual y sonora, contador de registros y **retardo automático** si pasa la tolerancia respecto a la hora de inicio de la clase |
| 📈 **Reportes** | CSV y **PDF de asistencia** (por grupo, materia y rango de fechas); concentrado de calificaciones CSV; **boletas en PDF** por alumno o de todo el grupo, con espacio para firmas; respaldo/restauración JSON |

---

## 🚀 Cómo usarla

### Opción A — Abrir localmente
1. Descarga o clona este repositorio.
2. Abre `index.html` en tu navegador (Chrome/Edge/Firefox).
   - ⚠️ Para que la **cámara del escáner QR** funcione se requiere `https://` o `localhost`. Local rápido: `python -m http.server 8000` y abre `http://localhost:8000`.

### Opción B — Publicarla gratis en GitHub Pages (recomendado)
1. Crea un repositorio en GitHub y sube estos archivos.
2. Ve a **Settings → Pages → Source: Deploy from a branch → main / (root)**.
3. Tu sistema quedará en `https://TU-USUARIO.github.io/TU-REPO/` con HTTPS, por lo que **el escáner QR funcionará desde cualquier celular**.

```bash
git init
git add .
git commit -m "SIGE Prepa 50: sistema escolar con asistencia QR"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/prepa50-sistema-escolar.git
git push -u origin main
```

### Flujo diario sugerido para el docente
1. **Una sola vez:** registra materias (con sus rubros), grupos, alumnos y horario. Imprime las credenciales QR del grupo.
2. **Cada clase:** entra a *Pase de lista*, elige materia y grupo, activa el **escáner QR** y los alumnos muestran su credencial al pasar. Ajusta retardos o justifica faltas con un clic.
3. **Cada parcial:** captura calificaciones por rubro; el promedio se calcula solo.
4. **Cuando lo pidan:** exporta el CSV de asistencia o calificaciones, o dirige a los padres al portal de consultas.

---

## 🗂️ Estructura del proyecto

```
prepa50-sistema-escolar/
├── index.html        # Estructura de la aplicación (SPA)
├── css/styles.css    # Identidad visual UAGro (azul y oro), responsiva e imprimible
├── js/app.js         # Lógica completa: datos, vistas, QR, reportes
├── README.md
└── LICENSE
```

**Tecnologías:** HTML5, CSS3, JavaScript puro (sin frameworks), [qrcodejs](https://cdnjs.com/libraries/qrcodejs) para generar QR, [html5-qrcode](https://cdnjs.com/libraries/html5-qrcode) para leerlos con la cámara, [jsPDF + AutoTable](https://cdnjs.com/libraries/jspdf) para boletas y reportes en PDF, [SheetJS (xlsx)](https://cdnjs.com/libraries/xlsx) para importar alumnos desde Excel/CSV, y [Chart.js](https://cdnjs.com/libraries/Chart.js) para las gráficas estadísticas. Persistencia en `localStorage`.

### Modelo de datos (localStorage, clave `sige_p50`)
```js
{
  plantel:        { nombre, universidad, ciclo, toleranciaMin },
  docentes:       [{ id, nombre, email, telefono, especialidad }],
  materias:       [{ id, clave, nombre, semestre, docenteId, rubros:[{nombre, peso}] }],
  grupos:         [{ id, nombre, semestre, turno }],
  alumnos:        [{ id, matricula, nombre, apellidos, grupoId, tutor, telTutor, email }],
  horarios:       [{ id, materiaId, grupoId, dia, hi, hf, aula }],
  asistencias:    [{ id, fecha, materiaId, grupoId, alumnoId, estado:'P|R|J|F', metodo:'qr|manual', hora }],
  calificaciones: [{ id, alumnoId, materiaId, parcial, rubro, valor }]
}
```

---

## 🛣️ Hoja de ruta (contribuciones bienvenidas)

- [x] Backend en la nube (Firebase) con inicio de sesión para docentes, sincronización en tiempo real entre dispositivos, funcionamiento sin conexión y portal de padres a distancia. ✅ (ver INSTALACION.md)
- [ ] Notificaciones automáticas al tutor (WhatsApp/correo) al acumular faltas.
- [x] Boletas en PDF por alumno y por grupo. ✅
- [x] Importación masiva de alumnos desde CSV/Excel. ✅
- [x] Modo kiosco: pantalla fija donde el alumno se auto-registra con su QR. ✅
- [x] Estadísticas por materia/parcial (gráficas de aprobación e inasistencia). ✅
- [ ] PWA instalable con funcionamiento sin conexión total.

## 🤝 Contribuir
1. Haz *fork* del repositorio y crea una rama: `git checkout -b mejora/mi-funcion`.
2. Realiza tus cambios y haz *commit* con mensajes claros.
3. Abre un *Pull Request* describiendo el cambio y cómo probarlo.

## 📄 Licencia
MIT — úsala, modifícala y compártela libremente citando el proyecto.

---
*Hecho para la comunidad docente de la Preparatoria No. 50 de la UAGro. Los datos de demostración incluidos son ficticios.*
