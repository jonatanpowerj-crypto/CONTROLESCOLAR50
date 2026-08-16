// Repositorio de Horarios - Capa de Datos

import { FirebaseClient, query, where } from '../firebase/firebaseClient'
import { Horario, HorarioCrear, crearHorario } from '../../dominio/horarios/Horario'

const COLECCION = 'horarios'

export class HorarioRepositorio extends FirebaseClient<Horario> {
  constructor() {
    super(COLECCION)
  }

  // La coleccion completa se usa para deteccion de conflictos
  // (cruza grupos y docentes), es pequena, no requiere paginacion.
  async obtenerTodos(): Promise<Horario[]> {
    return super.obtenerTodos()
  }

  // Filtro simple de un solo campo - no requiere indice compuesto.
  async obtenerPorGrupo(grupoId: string): Promise<Horario[]> {
    return super.obtenerTodos(query(this.ref, where('grupoId', '==', grupoId)))
  }

  async crearHorario(datos: HorarioCrear, id: string): Promise<void> {
    return super.crear(id, crearHorario(datos, id))
  }
}

export const horarioRepositorio = new HorarioRepositorio()
