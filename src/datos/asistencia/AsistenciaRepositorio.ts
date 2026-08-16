// Repositorio de Asistencia - Capa de Datos

import { FirebaseClient, query, where } from '../firebase/firebaseClient'
import { writeBatch, doc } from 'firebase/firestore'
import { obtenerDb } from '../firebase/firebaseConfig'
import { Asistencia, AsistenciaCrear, crearAsistencia } from '../../dominio/asistencia/Asistencia'

const COLECCION = 'asistencias'

export class AsistenciaRepositorio extends FirebaseClient<Asistencia> {
  constructor() {
    super(COLECCION)
  }

  async obtenerPorGrupoYFecha(grupoId: string, fecha: string): Promise<Asistencia[]> {
    return super.obtenerTodos(
      query(this.ref, where('grupoId', '==', grupoId), where('fecha', '==', fecha))
    )
  }

  // Guardado en lote: usado por el pase de lista manual, donde el
  // docente marca a todo el grupo y guarda todo junto al final.
  async guardarLote(registros: AsistenciaCrear[]): Promise<void> {
    const db = obtenerDb()
    const lote = writeBatch(db)

    registros.forEach((datos) => {
      const asistencia = crearAsistencia(datos)
      const docRef = doc(db, COLECCION, asistencia.id)
      lote.set(docRef, asistencia)
    })

    await lote.commit()
  }

  // Guardado individual e inmediato: usado por el escaner QR, donde
  // cada alumno se registra al instante conforme va llegando, no en
  // un lote al final.
  async guardarUno(datos: AsistenciaCrear): Promise<Asistencia> {
    const asistencia = crearAsistencia(datos)
    await this.crear(asistencia.id, asistencia)
    return asistencia
  }
}

export const asistenciaRepositorio = new AsistenciaRepositorio()
