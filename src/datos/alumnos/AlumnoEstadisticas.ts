// Estadísticas de Alumnos - Capa de Datos

import { Asistencia, Calificacion, calcularPromedio, calcularPorcentajeAsistencia } from '../../dominio/alumnos/valueObjects'

export interface EstadisticaAlumno {
  alumnoId: string
  promedioGeneral: number
  porcentajeAsistencia: number
  totalCalificaciones: number
  totalAsistencias: number
  estado: 'excelente' | 'bueno' | 'riesgo' | 'critico'
}

export const calcularEstadoAlumno = (estadistica: EstadisticaAlumno): EstadisticaAlumno['estado'] => {
  const { promedioGeneral, porcentajeAsistencia } = estadistica

  if (promedioGeneral >= 8 && porcentajeAsistencia >= 90) return 'excelente'
  if (promedioGeneral >= 6 && porcentajeAsistencia >= 75) return 'bueno'
  if (porcentajeAsistencia >= 50) return 'riesgo'
  return 'critico'
}

export const generarEstadistica = (
  alumnoId: string,
  calificaciones: Calificacion[],
  respuestas: Asistencia[]
): EstadisticaAlumno => {
  const delAlumno = respuestas.filter((a) => a.alumnoId === alumnoId)
  const califs = calificaciones.filter((c) => c.alumnoId === alumnoId)

  const estadistica: EstadisticaAlumno = {
    alumnoId,
    promedioGeneral: calcularPromedio(califs),
    porcentajeAsistencia: calcularPorcentajeAsistencia(alumnoId, respuestas),
    totalCalificaciones: califs.length,
    totalAsistencias: delAlumno.length,
    estado: 'bueno',
  }

  estadistica.estado = calcularEstadoAlumno(estadistica)
  return estadistica
}
