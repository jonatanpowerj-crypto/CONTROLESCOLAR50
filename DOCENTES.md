# 👥 Cuentas de docentes y roles — SIGE Prepa 50

A partir de esta versión, el sistema distingue **dos tipos de usuario**:

| Rol | Quién | Qué puede hacer |
|---|---|---|
| **★ Administrador** | Tú / la dirección | Ve y edita **todo**: docentes, materias, grupos, horarios, alumnos, credenciales, reportes y vaciar el sistema. |
| **Docente** | Cada maestro | Ve y edita **solo sus materias asignadas**: su pase de lista, sus calificaciones y sus estadísticas. No ve los catálogos de administración ni los datos de otros docentes. |

El sistema sabe quién es administrador por el **correo**. Los correos admin están en el archivo `js/nube.js`, en la línea:
```js
const ADMIN_EMAILS = ['jonatan33@uagro.mx'];
```
Si la dirección quiere más administradores, agrega sus correos ahí, separados por coma:
```js
const ADMIN_EMAILS = ['jonatan33@uagro.mx', 'direccion@uagro.mx'];
```

---

## Cómo dar de alta a un nuevo docente (3 pasos)

### 1. Regístralo en el módulo «Docentes» (como administrador)
- Entra al sistema, ve a **Docentes → ＋ Registrar docente**.
- Llena su nombre y, **muy importante**, su **correo institucional** (ej. `mlopez@uagro.mx`). Ese correo es lo que vincula su cuenta con sus materias.

### 2. Asígnale sus materias
- Ve a **Materias y rubros**, abre cada materia que impartirá y selecciónalo como **Docente responsable**.
- (Solo verá en su sesión las materias donde aparezca como responsable, y los grupos donde esas materias tengan horario.)

### 3. Créale su cuenta de acceso en Firebase
- Entra a `https://console.firebase.google.com/project/prepa50/authentication/users`
- Pulsa **Agregar usuario**.
- **Correo:** el mismo que pusiste en el módulo Docentes (debe coincidir exactamente).
- **Contraseña temporal:** `Prepa50.2026` (la genérica para todos).
- Pulsa **Agregar usuario**.

¡Listo! Dale al docente su correo y la contraseña temporal `Prepa50.2026`.

---

## Primer ingreso del docente
1. Entra a la dirección del sistema e inicia sesión con su correo y `Prepa50.2026`.
2. El sistema le pedirá **crear su propia contraseña** (obligatorio, mínimo 6 caracteres). Solo él la conocerá.
3. A partir de ahí verá únicamente su Panel, su Pase de lista, sus Calificaciones y sus Estadísticas.

> Si un docente quiere cambiar su contraseña después, pulsa el botón **🔑** junto a su correo (arriba a la derecha).

---

## Preguntas frecuentes

**Un docente ve la etiqueta «Sin vincular».**
Su correo de acceso no coincide con ningún correo del módulo Docentes. Revisa que sean idénticos (sin espacios, mismas mayúsculas/minúsculas) y que tenga al menos una materia asignada.

**¿Qué tan separados están los datos?**
La interfaz oculta y filtra todo lo que no le corresponde a cada docente: es una separación sólida para el uso normal. La separación "a prueba de balas" a nivel base de datos requiere el plan Blaze de Firebase (con tarjeta); está documentada en `firestore.rules` para cuando el plantel lo decida.

**Olvidó su contraseña.**
La dirección la restablece en Firebase → Authentication → Users → ⋮ → *Restablecer contraseña*, o le asigna de nuevo la temporal.

**Quitar a un docente.**
Bórralo en Firebase → Authentication → Users (deja de tener acceso) y, si ya no dará clases, en el módulo Docentes del sistema.
