// Entidad Bitacora - Dominio

export const CAMPOS_NEM = [
  'Lenguajes',
  'Saberes y Pensamiento Científico',
  'Ética, Naturaleza y Sociedades',
  'De lo Humano y lo Comunitario',
] as const

export type CampoNEM = (typeof CAMPOS_NEM)[number]

export interface SesionBitacora {
  id: string
  fecha: string
  materiaId: string
  grupoId: string
  campo: string // uno de CAMPOS_NEM, o vacio si no se selecciono
  tema: string
  actividades: string
  tarea: string
  observaciones: string
  registradoPor: string
  registradoEn: string
}

export interface SesionBitacoraCrear {
  fecha: string
  materiaId: string
  grupoId: string
  campo: string
  tema: string
  actividades: string
  tarea: string
  observaciones: string
  registradoPor: string
}

const generarId = (): string =>
  `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

export const crearSesionBitacora = (datos: SesionBitacoraCrear): SesionBitacora => ({
  id: generarId(),
  ...datos,
  registradoEn: new Date().toISOString(),
})
