// Entidad Solicitud de Registro de Docente - Dominio
// Usa la coleccion "registros_docentes" (bandeja publica de
// auto-registro): cualquiera puede crear una solicitud sin cuenta;
// solo el admin puede incorporarla o descartarla.

export interface MateriaSolicitud {
  clave: string
  nombre: string
  semestre: number
  grupos?: string // texto libre, ej. "3A, 3B"
  sesionesSemana?: number
}

export interface DatosDocenteSolicitud {
  nombre: string
  email: string
  telefono?: string
  especialidad?: string
}

export interface Solicitud {
  id: string
  docente: DatosDocenteSolicitud
  materias: MateriaSolicitud[]
  estado: 'pendiente' | 'incorporado'
  actualizado: string
}

export interface SolicitudCrear {
  docente: DatosDocenteSolicitud
  materias: MateriaSolicitud[]
}

const generarId = (): string =>
  `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

export const crearSolicitud = (datos: SolicitudCrear): Solicitud => ({
  id: generarId(),
  ...datos,
  estado: 'pendiente',
  actualizado: new Date().toISOString(),
})

export const materiaVacia = (): MateriaSolicitud => ({
  clave: '',
  nombre: '',
  semestre: 1,
  grupos: '',
  sesionesSemana: 0,
})
