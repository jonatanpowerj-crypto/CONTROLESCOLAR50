// Entidad Docente - Dominio

export interface Docente {
  id: string
  nombre: string
  email: string
  telefono?: string
  especialidad?: string
}

export interface DocenteCrear {
  nombre: string
  email: string
  telefono?: string
  especialidad?: string
}

export interface DocenteActualizar {
  nombre?: string
  email?: string
  telefono?: string
  especialidad?: string
}

export const crearDocente = (datos: DocenteCrear, id: string): Docente => ({
  id,
  ...datos,
})
