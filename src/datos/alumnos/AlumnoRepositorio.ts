// Repositorio de Alumnos - Capa de Datos

import { FirebaseClient } from '../firebase/firebaseClient'
import { query, where, orderBy, writeBatch, doc } from 'firebase/firestore'
import { obtenerDb } from '../firebase/firebaseConfig'
import { Alumno, AlumnoCrear, AlumnoActualizar } from '../../dominio/alumnos/Alumno'

const COLECCION = 'alumnos'

export class AlumnoRepositorio extends FirebaseClient<Alumno> {
  constructor() {
    super(COLECCION)
  }

  async obtenerTodos(): Promise<Alumno[]> {
    return super.obtenerTodos(query(this.ref, orderBy('apellidos')))
  }

  async obtenerPorGrupo(grupoId: string): Promise<Alumno[]> {
    return super.obtenerTodos(query(this.ref, where('grupoId', '==', grupoId), orderBy('apellidos')))
  }

  async obtenerPorMatricula(matricula: string): Promise<Alumno | null> {
    const resultados = await super.obtenerTodos(query(this.ref, where('matricula', '==', matricula)))
    return resultados[0] || null
  }

  async crearAlumno(datos: AlumnoCrear, id: string): Promise<void> {
    const ahora = new Date().toISOString()
    const alumno: Alumno = {
      id,
      ...datos,
      tutor: datos.tutor || '',
      telTutor: datos.telTutor || '',
      email: datos.email || '',
      creadoEn: ahora,
      editadoEn: ahora,
    }
    return super.crear(id, alumno)
  }

  // Importacion masiva (Excel/CSV): crea varios alumnos de un jalon
  // usando un batch write, en vez de una escritura por alumno.
  async crearLote(listaDatos: { datos: AlumnoCrear; id: string }[]): Promise<void> {
    const db = obtenerDb()
    const ahora = new Date().toISOString()

    for (let i = 0; i < listaDatos.length; i += 400) {
      const lote = writeBatch(db)
      listaDatos.slice(i, i + 400).forEach(({ datos, id }) => {
        const alumno: Alumno = {
          id,
          ...datos,
          tutor: datos.tutor || '',
          telTutor: datos.telTutor || '',
          email: datos.email || '',
          creadoEn: ahora,
          editadoEn: ahora,
        }
        lote.set(doc(db, COLECCION, id), alumno)
      })
      await lote.commit()
    }
  }

  async actualizar(id: string, datos: AlumnoActualizar): Promise<void> {
    const actualizacion = {
      ...datos,
      editadoEn: new Date().toISOString(),
    }
    return super.actualizar(id, actualizacion)
  }
}

export const alumnoRepositorio = new AlumnoRepositorio()
