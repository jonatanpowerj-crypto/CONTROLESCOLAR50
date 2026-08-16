// Entidad Materia - Dominio
// Fuente unica de verdad para Materia y Rubro (Calificaciones importa
// estos tipos desde aqui, no los redefine).

export interface Rubro {
  nombre: string
  peso: number // porcentaje, ej. 40 significa 40%
}

export interface Materia {
  id: string
  nombre: string
  clave: string
  semestre: number
  docenteId: string
  rubros: Rubro[]
}

export interface MateriaCrear {
  nombre: string
  clave: string
  semestre: number
  docenteId: string
  rubros: Rubro[]
}

export interface MateriaActualizar {
  nombre?: string
  clave?: string
  semestre?: number
  docenteId?: string
  rubros?: Rubro[]
}

export const crearMateria = (datos: MateriaCrear, id: string): Materia => ({
  id,
  ...datos,
})

// Un plan de evaluacion valido debe sumar exactamente 100%.
// Se permite un margen de 0.01 por errores de punto flotante.
export const sumaPesos = (rubros: Rubro[]): number =>
  Number(rubros.reduce((acc, r) => acc + (Number.isFinite(r.peso) ? r.peso : 0), 0).toFixed(2))

export const pesosValidos = (rubros: Rubro[]): boolean => {
  if (rubros.length === 0) return false
  return Math.abs(sumaPesos(rubros) - 100) < 0.01
}
