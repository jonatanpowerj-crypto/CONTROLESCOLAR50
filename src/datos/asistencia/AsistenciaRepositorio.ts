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

  // Para reportes: todo un grupo en un rango de fechas. Es probable
  // que Firestore pida crear un indice compuesto nuevo (grupoId + fecha)
  // la primera vez que se use - si aparece el error con el link de
  // "crear indice", es el mismo patron que ya resolvimos antes.
  async obtenerPorGrupoYRango(grupoId: string, desde: string, hasta: string): Promise<Asistencia[]> {
    return super.obtenerTodos(
      query(
        this.ref,
        where('grupoId', '==', grupoId),
        where('fecha', '>=', desde),
        where('fecha', '<=', hasta)
      )
    )
  }

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

  async guardarUno(datos: AsistenciaCrear): Promise<Asistencia> {
    const asistencia = crearAsistencia(datos)
    await this.crear(asistencia.id, asistencia)
    return asistencia
  }
}

export const asistenciaRepositorio = new AsistenciaRepositorio()
