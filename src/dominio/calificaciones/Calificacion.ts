// Entidad Calificacion - Dominio

import { Rubro } from '../materias/Materia'

export interface Calificacion {
  id: string
  alumnoId: string
  materiaId: string
  rubro: string // debe coincidir con Rubro.nombre de la materia
  valor: number // 0 a 10
  registradoPor: string
  registradoEn: string
}

export interface CalificacionCrear {
  alumnoId: string
  materiaId: string
  rubro: string
  valor: number
  registradoPor: string
}

export const idCalificacion = (alumnoId: string, materiaId: string, rubro: string): string =>
  `${alumnoId}_${materiaId}_${rubro.replace(/\s+/g, '-').toLowerCase()}`

export const crearCalificacion = (datos: CalificacionCrear): Calificacion => ({
  id: idCalificacion(datos.alumnoId, datos.materiaId, datos.rubro),
  ...datos,
  registradoEn: new Date().toISOString(),
})

// Calcula el promedio ponderado de un alumno en una materia, a partir
// de las calificaciones capturadas y los rubros/pesos de la materia.
// Los rubros sin capturar simplemente no suman (promedio parcial).
export const calcularPromedio = (
  calificacionesAlumno: Calificacion[],
  rubros: Rubro[]
): number | null => {
  if (calificacionesAlumno.length === 0) return null

  let suma = 0
  let pesoCapturado = 0

  rubros.forEach((rubro) => {
    const calif = calificacionesAlumno.find((c) => c.rubro === rubro.nombre)
    if (calif) {
      suma += calif.valor * (rubro.peso / 100)
      pesoCapturado += rubro.peso
    }
  })

  if (pesoCapturado === 0) return null

  return Number(((suma / pesoCapturado) * 100).toFixed(1))
}
