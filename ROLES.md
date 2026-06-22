# 👥 Guía de accesos por docente — SIGE Prepa 50

Esta versión incorpora **roles**: un administrador (tú) que ve y controla todo, y **docentes** que solo ven y gestionan **sus propias materias**, sin acceso a la información de los demás ni capacidad de alterar registros ajenos.

---

## ¿Quién es administrador?

El administrador se define por correo en el archivo `js/nube.js`, en esta línea:

```js
const ADMIN_EMAILS = ['jonatan33@uagro.mx'];   // correos con rol de administrador
```

Para sumar otro administrador (por ejemplo, la dirección), agrega su correo separado por coma:
```js
const ADMIN_EMAILS = ['jonatan33@uagro.mx', 'direccion@uagro.mx'];
```
Cualquier otro correo que inicie sesión será tratado como **docente**.

---

## Contraseña genérica de primer ingreso

Está definida en `js/nube.js`:
```js
const PASS_TEMPORAL = 'Prepa50.2026';   // contraseña genérica de primer ingreso
```
Cuando creas la cuenta de un docente en Firebase, le asignas esta contraseña. En su **primer ingreso, el sistema lo obliga a cambiarla** por una personal (mínimo 6 caracteres) que solo él conocerá. Puedes cambiarla cuando quieras editando esa línea.

> El docente también puede cambiar su contraseña en cualquier momento con el botón **🔑** de la barra superior.

---

## Cómo dar de alta a un docente (proceso completo)

Son **dos pasos** que deben coincidir en el **mismo correo**:

### Paso 1 — Registrarlo como docente en el sistema (tú, como admin)
1. Entra al sistema con tu cuenta de administrador.
2. Ve a **Docentes → Registrar docente**.
3. Llena nombre, especialidad y, **MUY IMPORTANTE**, su **correo institucional** (este es el que vincula su cuenta con sus materias).

### Paso 2 — Crear su cuenta de acceso (en Firebase)
1. Entra a `https://console.firebase.google.com/project/prepa50/authentication/users`
2. **Agregar usuario** → escribe **el mismo correo** del paso 1 → contraseña: `Prepa50.2026` (la genérica).
3. Listo. El docente ya puede entrar desde la URL del sistema con ese correo y la contraseña temporal; el sistema le pedirá crear su contraseña personal.

### Paso 3 — Asignarle materias
Tienes dos caminos:
- **Tú se las creas:** en **Materias → Nueva materia**, eliges a ese docente como responsable.
- **Él se las crea:** al entrar, el docente va a **Materias → Nueva materia**; la materia se asigna automáticamente a su nombre. Luego arma su horario en **Horarios**.

En cuanto una materia tiene su correo como docente responsable, todo lo de esa materia (pase de lista, calificaciones, credenciales, reportes, estadísticas) aparece solo para él.

---

## Qué ve y qué puede hacer cada rol

| Acción | Administrador | Docente |
|---|---|---|
| Ver todas las materias, grupos y alumnos | ✅ | ❌ (solo lo suyo) |
| Crear sus propias materias y rubros | ✅ | ✅ |
| Asignar horarios | ✅ (todos) | ✅ (de sus materias) |
| Pase de lista (QR, manual, kiosco) | ✅ | ✅ (sus grupos/materias) |
| Capturar calificaciones | ✅ | ✅ (sus materias) |
| Imprimir credenciales QR | ✅ | ✅ (sus grupos) |
| Reportes y boletas PDF | ✅ | ✅ (sus materias/grupos) |
| Estadísticas | ✅ (todo el plantel) | ✅ (sus materias) |
| Módulo **Docentes** | ✅ | ❌ (oculto) |
| Crear/eliminar grupos | ✅ | ❌ |
| Inscribir/dar de baja alumnos | ✅ | ❌ (solo los ve) |
| Vaciar el sistema / cargar demo | ✅ | ❌ (oculto) |

La **inscripción de alumnos** queda centralizada en el administrador a propósito: así un docente nunca puede borrar por error la matrícula de un grupo completo. El docente sí ve a los alumnos de sus grupos para pasar lista y calificar.

---

## Notas de seguridad importantes

- **Este control es a nivel de interfaz.** Protege el uso diario y evita errores entre colegas, que es justo lo que pediste. Para un blindaje total a nivel de base de datos (que ni siquiera por medios técnicos un docente pueda tocar datos ajenos) haría falta un paso adicional con reglas avanzadas de Firestore y un campo de propietario en cada documento; podemos implementarlo más adelante si el plantel lo requiere.
- **Cada quien con su cuenta:** insiste a los docentes en cambiar su contraseña temporal en el primer ingreso y no compartirla.
- **Respaldo:** como admin, sigue descargando el respaldo JSON cada fin de parcial.
- **El "Sin vincular":** si un docente inicia sesión y arriba aparece la etiqueta amarilla «Sin vincular», significa que su correo de Firebase no coincide con ningún correo registrado en Docentes. Revisa que ambos correos sean idénticos (sin espacios ni mayúsculas distintas).
