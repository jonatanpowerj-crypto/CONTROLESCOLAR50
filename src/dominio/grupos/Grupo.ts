// Entidad Grupo - Dominio

export interface Grupo {
  id: string
  nombre: string
  semestre: number
  turno: string
  ciclo?: string
  grupoAnteriorId?: string // vincula un grupo promovido con su origen
}

export interface GrupoCrear {
  nombre: string
  semestre: number
  turno: string
  ciclo?: string
  grupoAnteriorId?: string
}

export interface GrupoActualizar {
  nombre?: string
  semestre?: number
  turno?: string
  ciclo?: string
}

export const crearGrupo = (datos: GrupoCrear, id: string): Grupo => ({
  id,
  ...datos,
})

// ---------- Logica de promocion a siguiente ciclo ----------

const cicloActualAuto = (): string => {
  const ahora = new Date()
  const mes = ahora.getMonth() + 1 // 1-12
  const anio = ahora.getFullYear()
  return mes >= 2 && mes <= 7 ? `${anio}-B` : `${anio}-A`
}

export const siguienteCiclo = (ciclo?: string): string => {
  const m = /^(\d{4})-([AB])$/.exec(ciclo || '')
  if (!m) return cicloActualAuto()
  const [, anio, letra] = m
  return letra === 'A' ? `${anio}-B` : `${Number(anio) + 1}-A`
}

export const sugerirNombreSiguienteGrupo = (nombreActual: string, siguienteSemestre: number): string =>
  nombreActual.replace(/\d+°?/, `${siguienteSemestre}°`)

export const puedePromover = (semestre: number): boolean => semestre < 6
