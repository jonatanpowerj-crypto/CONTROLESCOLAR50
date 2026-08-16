// Entidad Configuracion del Plantel - Dominio

export interface ConfigPlantel {
  nombre: string
  universidad: string
  ciudad: string
  ciclo: string
  toleranciaMin: number
}

export const CONFIG_PLANTEL_DEFECTO: ConfigPlantel = {
  nombre: 'Preparatoria No. 50',
  universidad: 'Universidad Autónoma de Guerrero',
  ciudad: 'Tlacoachistlahuaca, Gro.',
  ciclo: '2026-A',
  toleranciaMin: 10,
}

export interface ResumenSistema {
  alumnos: number
  docentes: number
  grupos: number
  materias: number
  horarios: number
  asistencias: number
  calificaciones: number
}
