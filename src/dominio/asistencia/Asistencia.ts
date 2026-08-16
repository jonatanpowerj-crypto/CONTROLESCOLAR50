// Entidad Asistencia - Dominio

export type EstadoAsistencia = 'presente' | 'ausente' | 'retardo'
export type MetodoAsistencia = 'manual' | 'qr'

export interface Asistencia {
  id: string
  alumnoId: string
  grupoId: string
  fecha: string // formato YYYY-MM-DD
  estado: EstadoAsistencia
  metodo: MetodoAsistencia
  registradoPor: string // uid del docente/admin que la tomo
  registradoEn: string // ISO timestamp
}

export interface AsistenciaCrear {
  alumnoId: string
  grupoId: string
  fecha: string
  estado: EstadoAsistencia
  registradoPor: string
  metodo?: MetodoAsistencia // por defecto 'manual' si no se especifica
}

export const idAsistencia = (alumnoId: string, fecha: string): string =>
  `${alumnoId}_${fecha}`

export const crearAsistencia = (datos: AsistenciaCrear): Asistencia => ({
  id: idAsistencia(datos.alumnoId, datos.fecha),
  ...datos,
  metodo: datos.metodo ?? 'manual',
  registradoEn: new Date().toISOString(),
})

// El formato de las credenciales del legacy es "P50|MATRICULA"
// (ver js/app.js, funcion procesarQR). Mantenemos el mismo formato
// para que las credenciales ya impresas sigan funcionando.
export const PREFIJO_CREDENCIAL = 'P50|'

export const extraerMatriculaDeQR = (textoEscaneado: string): string | null => {
  if (!textoEscaneado.startsWith(PREFIJO_CREDENCIAL)) return null
  const matricula = textoEscaneado.slice(PREFIJO_CREDENCIAL.length).trim()
  return matricula.length > 0 ? matricula : null
}
