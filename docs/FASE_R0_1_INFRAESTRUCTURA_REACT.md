# FASE R0.1 — Infraestructura React + Vite

## Descripción
Esta fase establece la infraestructura base para el módulo React del sistema SIGE50.

---

## Arquitectura Creada

```
CONTROLESCOLAR50/
├── src/
│   ├── main.tsx          # Punto de entrada React
│   ├── App.tsx           # Componente raíz
│   ├── index.css         # Estilos base React
│   ├── vite-env.d.ts     # Tipos Vite
│   │
│   ├── dominio/          # Entidades y lógica de negocio
│   │   └── index.ts
│   │
│   ├── aplicacion/       # Casos de uso y servicios
│   │   └── index.ts
│   │
│   ├── datos/            # Repositorios y acceso a datos
│   │   └── index.ts
│   │
│   └── interfaz/        # Componentes UI
│       └── index.ts
│
├── index-react.html      # Entrada independiente React
├── package.json
├── tsconfig.json
├── vite.config.ts
└── docs/
    └── FASE_R0_1_INFRAESTRUCTURA_REACT.md
```

---

## Archivos Nuevos

| Archivo | Descripción |
|---------|-------------|
| `package.json` | Dependencias React + Vite + TypeScript |
| `tsconfig.json` | Configuración TypeScript para React |
| `vite.config.ts` | Configuración Vite con plugin React |
| `index-react.html` | Punto de entrada HTML independiente |
| `src/main.tsx` | Punto de entrada React |
| `src/App.tsx` | Componente raíz |
| `src/index.css` | Estilos base |
| `src/vite-env.d.ts` | Tipos ambiente Vite |
| `src/dominio/index.ts` | Módulo dominio |
| `src/aplicacion/index.ts` | Módulo aplicación |
| `src/datos/index.ts` | Módulo datos |
| `src/interfaz/index.ts` | Módulo interfaz |

---

## Archivos Legacy Protegidos

Los siguientes archivos **NO fueron modificados**:

| Archivo | Estado |
|---------|--------|
| `index.html` | ✅ Intacto (legado vanilla JS) |
| `js/app.js` | ✅ Intacto |
| `js/config.js` | ✅ Intacto |
| `js/nube.js` | ✅ Intacto |
| `css/styles.css` | ✅ Intacto |

---

## Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build producción
npm run build

# Preview build
npm run preview

# Tests
npm run test
```

---

## Estructura Modular DDD

- **dominio/**: Entidades, value objects, reglas de negocio
- **aplicacion/**: Casos de uso, servicios de aplicación
- **datos/**: Repositorios, acceso a datos (Firebase, etc.)
- **interfaz/**: Componentes React, páginas, UI

---

## Build Output

El build genera archivos en `dist-react/` (carpeta separada del legado).

---

## Próximos Pasos

1. Implementar módulo Alumnos en `src/dominio/`
2. Crear servicios en `src/aplicacion/`
3. Configurar acceso a Firestore en `src/datos/`
4. Desarrollar componentes UI en `src/interfaz/`
