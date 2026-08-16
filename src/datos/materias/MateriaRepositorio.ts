// Repositorio de Materias - Capa de Datos

import { FirebaseClient, query, orderBy, where } from '../firebase/firebaseClient'
import { Materia, MateriaCrear, MateriaActualizar, crearMateria } from '../../dominio/materias/Materia'

const COLECCION = 'materias'

export class MateriaRepositorio extends FirebaseClient<Materia> {
  constructor() {
    super(COLECCION)
  }

  async obtenerTodos(): Promise<Materia[]> {
    return super.obtenerTodos(query(this.ref, orderBy('nombre')))
  }

  // Filtro simple de un solo campo - no requiere indice compuesto.
  async obtenerPorDocente(docenteId: string): Promise<Materia[]> {
    return super.obtenerTodos(query(this.ref, where('docenteId', '==', docenteId)))
  }

  async crearMateria(datos: MateriaCrear, id: string): Promise<void> {
    return super.crear(id, crearMateria(datos, id))
  }

  async actualizar(id: string, datos: MateriaActualizar): Promise<void> {
    return super.actualizar(id, datos)
  }
}

export const materiaRepositorio = new MateriaRepositorio()
