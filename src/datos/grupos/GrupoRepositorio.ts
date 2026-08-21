// Repositorio de Grupos - Capa de Datos

import { FirebaseClient, query, orderBy } from '../firebase/firebaseClient'
import { writeBatch, doc } from 'firebase/firestore'
import { obtenerDb } from '../firebase/firebaseConfig'
import { Grupo, GrupoCrear, GrupoActualizar } from '../../dominio/grupos/Grupo'

const COLECCION = 'grupos'

export class GrupoRepositorio extends FirebaseClient<Grupo> {
  constructor() {
    super(COLECCION)
  }

  async obtenerTodos(): Promise<Grupo[]> {
    return super.obtenerTodos(query(this.ref, orderBy('nombre')))
  }

  async crearGrupo(datos: GrupoCrear, id: string): Promise<void> {
    const grupo: Grupo = { id, ...datos }
    return super.crear(id, grupo)
  }

  async actualizar(id: string, datos: GrupoActualizar): Promise<void> {
    return super.actualizar(id, datos)
  }

  // Promueve un grupo al siguiente ciclo: crea un grupo NUEVO y
  // traslada a el a los alumnos indicados (cambia su grupoId). El
  // grupo actual se conserva intacto, con su historial de
  // asistencias/calificaciones, para consulta futura.
  async promoverGrupo(
    nuevoGrupo: Grupo,
    idsAlumnos: string[]
  ): Promise<void> {
    const db = obtenerDb()

    // Crea el grupo nuevo primero.
    await this.crearGrupo(nuevoGrupo, nuevoGrupo.id)

    // Traslada a los alumnos en lotes de hasta 400 (limite de Firestore).
    for (let i = 0; i < idsAlumnos.length; i += 400) {
      const lote = writeBatch(db)
      idsAlumnos.slice(i, i + 400).forEach((alumnoId) => {
        lote.update(doc(db, 'alumnos', alumnoId), { grupoId: nuevoGrupo.id })
      })
      await lote.commit()
    }
  }
}

export const grupoRepositorio = new GrupoRepositorio()
