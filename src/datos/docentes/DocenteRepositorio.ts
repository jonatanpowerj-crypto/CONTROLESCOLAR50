// Repositorio de Docentes - Capa de Datos

import { FirebaseClient, query, orderBy } from '../firebase/firebaseClient'
import { Docente, DocenteCrear, DocenteActualizar, crearDocente } from '../../dominio/docentes/Docente'

const COLECCION = 'docentes'

export class DocenteRepositorio extends FirebaseClient<Docente> {
  constructor() {
    super(COLECCION)
  }

  async obtenerTodos(): Promise<Docente[]> {
    return super.obtenerTodos(query(this.ref, orderBy('nombre')))
  }

  async crearDocente(datos: DocenteCrear, id: string): Promise<void> {
    return super.crear(id, crearDocente(datos, id))
  }

  async actualizar(id: string, datos: DocenteActualizar): Promise<void> {
    return super.actualizar(id, datos)
  }
}

export const docenteRepositorio = new DocenteRepositorio()

// Lectura minima de "usuarios" - solo para cruzar que docentes ya
// tienen cuenta de acceso vinculada (docenteId) y cuales no.
export interface UsuarioAcceso {
  email: string
  rol: string
  docenteId: string | null
}

export class UsuarioRepositorioLectura extends FirebaseClient<UsuarioAcceso> {
  constructor() {
    super('usuarios')
  }
}

export const usuarioRepositorioLectura = new UsuarioRepositorioLectura()
