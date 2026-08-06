/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Caracteristica {
  id: string
  nombre: string
  ruta: string
  icono: string
  componente: () => Promise<any>
  descripcion: string
  modulo: 'alumnos' | 'docentes' | 'configuracion'
}

export const CARACTERISTICAS: Caracteristica[] = [
  {
    id: 'alumnos',
    nombre: 'Alumnos',
    ruta: '/alumnos',
    icono: '👨‍🎓',
    modulo: 'alumnos',
    descripcion: 'Gestión de alumnos SIGE50',
    componente: () => import('../../modulos/alumnos/AlumnosPagina'),
  },
  {
    id: 'asistencia',
    nombre: 'Asistencia',
    ruta: '/asistencia',
    icono: '📋',
    modulo: 'alumnos',
    descripcion: 'Control de asistencia',
    componente: () => import('../../modulos/alumnos/AsistenciaPagina'),
  },
  {
    id: 'calificaciones',
    nombre: 'Calificaciones',
    ruta: '/calificaciones',
    icono: '📊',
    modulo: 'alumnos',
    descripcion: 'Gestión de calificaciones',
    componente: () => import('../../modulos/alumnos/CalificacionesPagina'),
  },
  {
    id: 'docentes',
    nombre: 'Docentes',
    ruta: '/docentes',
    icono: '👨‍🏫',
    modulo: 'docentes',
    descripcion: 'Gestión de docentes',
    componente: () => import('../../modulos/docentes/DocentesPagina'),
  },
  {
    id: 'materias',
    nombre: 'Materias',
    ruta: '/materias',
    icono: '📚',
    modulo: 'docentes',
    descripcion: 'Catálogo de materias',
    componente: () => import('../../modulos/docentes/MateriasPagina'),
  },
  {
    id: 'grupos',
    nombre: 'Grupos',
    ruta: '/grupos',
    icono: '👥',
    modulo: 'docentes',
    descripcion: 'Gestión de grupos',
    componente: () => import('../../modulos/docentes/GruposPagina'),
  },
  {
    id: 'horarios',
    nombre: 'Horarios',
    ruta: '/horarios',
    icono: '🕐',
    modulo: 'docentes',
    descripcion: 'Configuración de horarios',
    componente: () => import('../../modulos/docentes/HorariosPagina'),
  },
  {
    id: 'configuracion',
    nombre: 'Configuración',
    ruta: '/configuracion',
    icono: '⚙️',
    modulo: 'configuracion',
    descripcion: 'Configuración del sistema',
    componente: () => import('../../modulos/configuracion/ConfiguracionPagina'),
  },
]

export const obtenerCaracteristica = (id: string): Caracteristica | undefined =>
  CARACTERISTICAS.find((c) => c.id === id)

export const obtenerCaracteristicasPorModulo = (modulo: Caracteristica['modulo']): Caracteristica[] =>
  CARACTERISTICAS.filter((c) => c.modulo === modulo)
