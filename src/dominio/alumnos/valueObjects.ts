// Value Objects - Estados y tipos

export type EstadoAsistencia = 'P' | 'R' | 'J' | 'F'

export const ESTADOS_ASISTENCIA: Record<EstadoAsistencia, { label: string; color: string }> = {
  P: { label: 'Presente', color: '#22c55e' },
  R: { label: 'Retardo', color: '#eab308' },
  J: { label: 'Justificado', color: '#3b82f6' },
  F: { label: 'Falta', color: '#ef4444' },
}

export interface Asistencia {
  id: string
  fecha: string
  materiaId: string
  grupoId: string
  alumnoId: string
  estado: EstadoAsistencia
  metodo: 'qr' | 'manual'
  hora: string
  creadoPor?: string
  creadoEn?: string
}

export interface Calificacion {
  id: string
  alumnoId: string
  materiaId: string
  parcial: 1 | 2 | 3
  rubro: string
  valor: number
  creadoPor?: string
  creadoEn?: string
}

export const calcularPromedio = (calificaciones: Calificacion[]): number => {
  if (calificaciones.length === 0) return 0
  const suma = calificaciones.reduce((acc, c) => acc + c.valor, 0)
  return Math.round((suma / calificaciones.length) * 100) / 100
}

export const calcularPorcentajeAsistencia = (
  alumnoId: string,
  respuestas: Asistencia[]
): number => {
  const delAlumno = respuestas.filter((a: Asistencia) => a.alumnoId === alumnoId)
  if (delAlumno.length === 0) return 100
  const presentes = delAlumno.filter((a: Asistencia) => a.estado === 'P' || a.estado === 'J').length
  return Math.round((presentes / delAlumno.length) * 100)
}
