// Entidad Alumno - Dominio

export interface Alumno {
  id: string
  matricula: string
  nombre: string
  apellidos: string
  grupoId: string
  tutor: string
  telTutor: string
  email: string
  creadoPor?: string
  creadoEn?: string
  editadoPor?: string
  editadoEn?: string
}

export interface AlumnoCrear {
  matricula: string
  nombre: string
  apellidos: string
  grupoId: string
  tutor?: string
  telTutor?: string
  email?: string
}

export interface AlumnoActualizar {
  matricula?: string
  nombre?: string
  apellidos?: string
  grupoId?: string
  tutor?: string
  telTutor?: string
  email?: string
}

export const crearAlumno = (datos: AlumnoCrear, id: string): Alumno => ({
  id,
  ...datos,
  tutor: datos.tutor || '',
  telTutor: datos.telTutor || '',
  email: datos.email || '',
})

export const nombreCompleto = (alumno: Alumno): string =>
  `${alumno.nombre} ${alumno.apellidos}`.trim()
