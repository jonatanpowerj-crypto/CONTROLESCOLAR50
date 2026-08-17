import { ComponentType } from 'react'
import { isFeatureEnabled, FeatureFlagKey } from '../../config/featureFlags'

// Tipo compatible con React.lazy()
export type GetComponent = () => Promise<{ default: ComponentType<unknown> }>

export interface Caracteristica {
  id: string
  nombre: string
  ruta: string
  icono: string
  componente: GetComponent
  descripcion: string
  modulo: 'alumnos' | 'docentes' | 'configuracion'
  flagKey?: FeatureFlagKey
}

export const CARACTERISTICAS: Caracteristica[] = [
  {
    id: 'panel',
    nombre: 'Panel del día',
    ruta: '/panel',
    icono: '🏠',
    modulo: 'alumnos',
    descripcion: 'Panel principal con resumen del día',
    componente: () => import('../panel/PanelDelDiaPagina').then((mod) => ({ default: mod.PanelDelDiaPagina as ComponentType<unknown> })),
  },
  {
    id: 'alumnos',
    nombre: 'Alumnos',
    ruta: '/alumnos',
    icono: '🎓',
    modulo: 'alumnos',
    descripcion: 'Gestión de alumnos SIGE50',
    componente: () => import('../../modulos/alumnos/AlumnosPagina').then((mod) => ({ default: mod.AlumnosPagina as ComponentType<unknown> })),
    flagKey: 'USE_NEW_ALUMNOS',
  },
  {
    id: 'asistencia',
    nombre: 'Asistencia',
    ruta: '/asistencia',
    icono: '📋',
    modulo: 'alumnos',
    descripcion: 'Control de asistencia',
    componente: () => import('../asistencia/PaseDeListaPagina').then((mod) => ({ default: mod.PaseDeListaPagina as ComponentType<unknown> })),
    flagKey: 'USE_NEW_ASISTENCIA',
  },
  {
    id: 'calificaciones',
    nombre: 'Calificaciones',
    ruta: '/calificaciones',
    icono: '📊',
    modulo: 'alumnos',
    descripcion: 'Gestión de calificaciones',
    componente: () => import('../calificaciones/CalificacionesPagina').then((mod) => ({ default: mod.CalificacionesPagina as ComponentType<unknown> })),
    flagKey: 'USE_NEW_CALIFICACIONES',
  },
  {
    id: 'credenciales',
    nombre: 'Credenciales QR',
    ruta: '/credenciales',
    icono: '🪪',
    modulo: 'alumnos',
    descripcion: 'Generador e impresión de credenciales QR',
    componente: () => import('../credenciales/CredencialesPagina').then((mod) => ({ default: mod.CredencialesPagina as ComponentType<unknown> })),
  },
  {
    id: 'reportes',
    nombre: 'Reportes',
    ruta: '/reportes',
    icono: '📈',
    modulo: 'alumnos',
    descripcion: 'Exportación de reportes CSV',
    componente: () => import('../reportes/ReportesPagina').then((mod) => ({ default: mod.ReportesPagina as ComponentType<unknown> })),
  },
  {
    id: 'docentes',
    nombre: 'Docentes',
    ruta: '/docentes',
    icono: '🧑‍🏫',
    modulo: 'docentes',
    descripcion: 'Gestión de docentes',
    componente: () => import('../docentes/DocentesPagina').then((mod) => ({ default: mod.DocentesPagina as ComponentType<unknown> })),
    flagKey: 'USE_NEW_DOCENTES',
  },
  {
    id: 'materias',
    nombre: 'Materias',
    ruta: '/materias',
    icono: '📚',
    modulo: 'docentes',
    descripcion: 'Catálogo de materias',
    componente: () => import('../materias/MateriasPagina').then((mod) => ({ default: mod.MateriasPagina as ComponentType<unknown> })),
    flagKey: 'USE_NEW_MATERIAS',
  },
  {
    id: 'grupos',
    nombre: 'Grupos',
    ruta: '/grupos',
    icono: '👥',
    modulo: 'docentes',
    descripcion: 'Gestión de grupos',
    componente: () => import('../grupos/GruposPagina').then((mod) => ({ default: mod.GruposPagina as ComponentType<unknown> })),
    flagKey: 'USE_NEW_GRUPOS',
  },
  {
    id: 'horarios',
    nombre: 'Horarios',
    ruta: '/horarios',
    icono: '🗓️',
    modulo: 'docentes',
    descripcion: 'Configuración de horarios',
    componente: () => import('../horarios/HorariosPagina').then((mod) => ({ default: mod.HorariosPagina as ComponentType<unknown> })),
    flagKey: 'USE_NEW_HORARIOS',
  },
  {
    id: 'configuracion',
    nombre: 'Configuración',
    ruta: '/configuracion',
    icono: '⚙️',
    modulo: 'configuracion',
    descripcion: 'Configuración del sistema',
    componente: () => import('../configuracion/ConfiguracionPagina').then((mod) => ({ default: mod.ConfiguracionPagina as ComponentType<unknown> })),
    flagKey: 'USE_NEW_CONFIGURACION',
  },
]

// Filtrar caracteristicas activas (con flag habilitada)
// Si no hay ninguna activa, mantener todas como fallback para desarrollo
export const CARACTERISTICAS_ACTIVAS: Caracteristica[] = (() => {
  const activas = CARACTERISTICAS.filter((c) => !c.flagKey || isFeatureEnabled(c.flagKey))
  // Fallback: si no hay modulos activos, devolver todos (modo desarrollo)
  return activas.length > 0 ? activas : CARACTERISTICAS
})()

export const obtenerCaracteristica = (id: string): Caracteristica | undefined =>
  CARACTERISTICAS.find((c) => c.id === id)

export const obtenerCaracteristicasPorModulo = (modulo: Caracteristica['modulo']): Caracteristica[] =>
  CARACTERISTICAS.filter((c) => c.modulo === modulo)
