// Entidad Grupo - Dominio

export interface Grupo {
  id: string
  nombre: string
  semestre: number
  turno: string
  ciclo?: string // no todos los grupos existentes lo tienen aun
}

export interface GrupoCrear {
  nombre: string
  semestre: number
  turno: string
  ciclo?: string
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
