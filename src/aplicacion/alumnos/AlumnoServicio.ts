// Servicio de Alumnos - Capa de Aplicación

import { Alumno, AlumnoCrear, AlumnoActualizar } from '../../dominio/alumnos/Alumno'
import { alumnoRepositorio } from '../../datos/alumnos/AlumnoRepositorio'
import { EstadisticaAlumno, generarEstadistica } from '../../datos/alumnos/AlumnoEstadisticas'
import { Calificacion, Asistencia } from '../../dominio/alumnos/valueObjects'

export class AlumnoServicio {
  async obtenerTodos(): Promise<Alumno[]> {
    return alumnoRepositorio.obtenerTodos()
  }

  async obtenerPorId(id: string): Promise<Alumno | null> {
    return alumnoRepositorio.obtenerPorId(id)
  }

  async obtenerPorGrupo(grupoId: string): Promise<Alumno[]> {
    return alumnoRepositorio.obtenerPorGrupo(grupoId)
  }

  async buscarPorMatricula(matricula: string): Promise<Alumno | null> {
    return alumnoRepositorio.obtenerPorMatricula(matricula)
  }

  async crear(datos: AlumnoCrear): Promise<Alumno> {
    // Validar matrícula única
    const existente = await this.buscarPorMatricula(datos.matricula)
    if (existente) {
      throw new Error(`Ya existe un alumno con la matrícula ${datos.matricula}`)
    }

    // Generar ID único
    const id = crypto.randomUUID()
    await alumnoRepositorio.crearAlumno(datos, id)

    return { id, ...datos, tutor: datos.tutor || '', telTutor: datos.telTutor || '', email: datos.email || '' }
  }

  async actualizar(id: string, datos: AlumnoActualizar): Promise<void> {
    // Validar matrícula única si cambia
    if (datos.matricula) {
      const existente = await this.buscarPorMatricula(datos.matricula)
      if (existente && existente.id !== id) {
        throw new Error(`Ya existe un alumno con la matrícula ${datos.matricula}`)
      }
    }

    await alumnoRepositorio.actualizar(id, datos)
  }

  async eliminar(id: string): Promise<void> {
    await alumnoRepositorio.eliminar(id)
  }

  obtenerEstadistica(
    alumnoId: string,
    calificaciones: Calificacion[],
    respuestas: Asistencia[]
  ): EstadisticaAlumno {
    return generarEstadistica(alumnoId, calificaciones, respuestas)
  }
}

export const alumnoServicio = new AlumnoServicio()
