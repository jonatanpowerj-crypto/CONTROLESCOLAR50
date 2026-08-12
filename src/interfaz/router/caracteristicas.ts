/* eslint-disable @typescript-eslint/no-explicit-any */
import { isFeatureEnabled } from '../../config/featureFlags'

export interface Caracteristica {
  id: string
  nombre: string
  ruta: string
  icono: string
  componente: () => Promise<any>
  descripcion: string
  modulo: 'alumnos' | 'docentes' | 'configuracion'
  flagKey?: string
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
    flagKey: 'USE_NEW_ALUMNOS',
  },
  {
    id: 'asistencia',
    nombre: 'Asistencia',
    ruta: '/asistencia',
    icono: '📋',
    modulo: 'alumnos',
    descripcion: 'Control de asistencia',
    componente: () => import('../../modulos/alumnos/AsistenciaPagina'),
    flagKey: 'USE_NEW_ASISTENCIA',
  },
  {
    id: 'calificaciones',
    nombre: 'Calificaciones',
    ruta: '/calificaciones',
    icono: '📊',
    modulo: 'alumnos',
    descripcion: 'Gestión de calificaciones',
    componente: () => import('../../modulos/alumnos/CalificacionesPagina'),
    flagKey: 'USE_NEW_CALIFICACIONES',
  },
  {
    id: 'docentes',
    nombre: 'Docentes',
    ruta: '/docentes',
    icono: '👨‍🏫',
    modulo: 'docentes',
    descripcion: 'Gestión de docentes',
    componente: () => import('../../modulos/docentes/DocentesPagina'),
    flagKey: 'USE_NEW_DOCENTES',
  },
  {
    id: 'materias',
    nombre: 'Materias',
    ruta: '/materias',
    icono: '📚',
    modulo: 'docentes',
    descripcion: 'Catálogo de materias',
    componente: () => import('../../modulos/docentes/MateriasPagina'),
    flagKey: 'USE_NEW_MATERIAS',
  },
  {
    id: 'grupos',
    nombre: 'Grupos',
    ruta: '/grupos',
    icono: '👥',
    modulo: 'docentes',
    descripcion: 'Gestión de grupos',
    componente: () => import('../../modulos/docentes/GruposPagina'),
    flagKey: 'USE_NEW_GRUPOS',
  },
  {
    id: 'horarios',
    nombre: 'Horarios',
    ruta: '/horarios',
    icono: '🕐',
    modulo: 'docentes',
    descripcion: 'Configuración de horarios',
    componente: () => import('../../modulos/docentes/HorariosPagina'),
    flagKey: 'USE_NEW_HORARIOS',
  },
  {
    id: 'configuracion',
    nombre: 'Configuración',
    ruta: '/configuracion',
    icono: '⚙️',
    modulo: 'configuracion',
    descripcion: 'Configuración del sistema',
    componente: () => import('../../modulos/configuracion/ConfiguracionPagina'),
    flagKey: 'USE_NEW_CONFIGURACION',
  },
]

export const CARACTERISTICAS_ACTIVAS = CARACTERISTICAS.filter(
  (c) => !c.flagKey || isFeatureEnabled(c.flagKey as any)
)

export const obtenerCaracteristica = (id: string): Caracteristica | undefined =>
  CARACTERISTICAS.find((c) => c.id === id)

export const obtenerCaracteristicasPorModulo = (modulo: Caracteristica['modulo']): Caracteristica[] =>
  CARACTERISTICAS.filter((c) => c.modulo === modulo)
