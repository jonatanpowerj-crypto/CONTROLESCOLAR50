// Repositorio de Calificaciones - Capa de Datos

import { FirebaseClient, query, where } from '../firebase/firebaseClient'
import { writeBatch, doc } from 'firebase/firestore'
import { obtenerDb } from '../firebase/firebaseConfig'
import { Calificacion, CalificacionCrear, crearCalificacion } from '../../dominio/calificaciones/Calificacion'

const COLECCION = 'calificaciones'

export class CalificacionRepositorio extends FirebaseClient<Calificacion> {
  constructor() {
    super(COLECCION)
  }

  // Filtro simple de un solo campo - no requiere indice compuesto.
  async obtenerPorMateria(materiaId: string): Promise<Calificacion[]> {
    return super.obtenerTodos(query(this.ref, where('materiaId', '==', materiaId)))
  }

  async guardarLote(registros: CalificacionCrear[]): Promise<void> {
    const db = obtenerDb()
    const lote = writeBatch(db)

    registros.forEach((datos) => {
      const calificacion = crearCalificacion(datos)
      const docRef = doc(db, COLECCION, calificacion.id)
      lote.set(docRef, calificacion)
    })

    await lote.commit()
  }
}

export const calificacionRepositorio = new CalificacionRepositorio()
