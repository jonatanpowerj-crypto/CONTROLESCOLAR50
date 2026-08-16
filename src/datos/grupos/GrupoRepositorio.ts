// Repositorio de Grupos - Capa de Datos

import { FirebaseClient, query, orderBy } from '../firebase/firebaseClient'
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
}

export const grupoRepositorio = new GrupoRepositorio()
