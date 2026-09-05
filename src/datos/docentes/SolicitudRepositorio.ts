// Repositorio de Solicitudes de Registro de Docente - Capa de Datos

import { FirebaseClient } from '../firebase/firebaseClient'
import { Solicitud, SolicitudCrear, crearSolicitud } from '../../dominio/docentes/Solicitud'

const COLECCION = 'registros_docentes'

export class SolicitudRepositorio extends FirebaseClient<Solicitud> {
  constructor() {
    super(COLECCION)
  }

  // Publico: cualquiera puede crear una solicitud (reglas de Firestore
  // ya lo permiten sin sesion, igual que en el legacy).
  async enviarSolicitud(datos: SolicitudCrear): Promise<void> {
    const solicitud = crearSolicitud(datos)
    await this.crear(solicitud.id, solicitud)
  }

  async marcarIncorporada(id: string): Promise<void> {
    await this.actualizar(id, { estado: 'incorporado', actualizado: new Date().toISOString() })
  }

  async descartar(id: string): Promise<void> {
    await this.eliminar(id)
  }
}

export const solicitudRepositorio = new SolicitudRepositorio()
