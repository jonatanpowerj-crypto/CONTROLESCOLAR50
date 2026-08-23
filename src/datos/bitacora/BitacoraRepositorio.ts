// Repositorio de Bitacora - Capa de Datos

import { FirebaseClient, query, where } from '../firebase/firebaseClient'
import { SesionBitacora, SesionBitacoraCrear, crearSesionBitacora } from '../../dominio/bitacora/Bitacora'

const COLECCION = 'bitacora'

export class BitacoraRepositorio extends FirebaseClient<SesionBitacora> {
  constructor() {
    super(COLECCION)
  }

  // Filtro simple de un solo campo - no requiere indice compuesto.
  // El filtro por grupo se hace en cliente para no necesitar un
  // indice compuesto (materiaId + grupoId) para un modulo secundario.
  async obtenerPorMateria(materiaId: string): Promise<SesionBitacora[]> {
    return super.obtenerTodos(query(this.ref, where('materiaId', '==', materiaId)))
  }

  async crearSesion(datos: SesionBitacoraCrear): Promise<SesionBitacora> {
    const sesion = crearSesionBitacora(datos)
    await this.crear(sesion.id, sesion)
    return sesion
  }

  async actualizarSesion(id: string, datos: Partial<SesionBitacoraCrear>): Promise<void> {
    return super.actualizar(id, datos)
  }
}

export const bitacoraRepositorio = new BitacoraRepositorio()
