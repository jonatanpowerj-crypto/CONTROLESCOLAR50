// Importacion de Alumnos desde Excel/CSV - Dominio

import { Alumno, AlumnoCrear } from './Alumno'

export type EstadoImportacion = 'nuevo' | 'duplicado' | 'incompleto'

export interface CandidatoImportacion {
  fila: number
  datos: AlumnoCrear
  estado: EstadoImportacion
  motivo: string
}

// Alias de encabezados aceptados por columna - mismo criterio que el
// legacy: acepta variantes con/sin acentos, mayusculas, guiones bajos.
const ALIAS_COLUMNAS: Record<string, string[]> = {
  matricula: ['matricula', 'no control', 'numero de control', 'no. control'],
  nombre: ['nombre', 'nombres'],
  apellidos: ['apellidos', 'apellido'],
  tutor: ['tutor', 'padre', 'madre', 'padre/tutor', 'padre o tutor'],
  telTutor: ['telefono_tutor', 'telefono tutor', 'tel tutor', 'telefono', 'tel'],
  email: ['correo', 'email', 'correo electronico', 'e-mail'],
}

const normaliza = (texto: string): string =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita acentos
    .trim()

export const detectaCampo = (encabezado: string): string | null => {
  const e = normaliza(encabezado)
  for (const campo in ALIAS_COLUMNAS) {
    if (ALIAS_COLUMNAS[campo].includes(e)) return campo
  }
  return null
}

export const mapearEncabezados = (encabezadosArchivo: string[]): Record<string, string> => {
  const mapa: Record<string, string> = {}
  encabezadosArchivo.forEach((enc) => {
    const campo = detectaCampo(enc)
    if (campo && !mapa[campo]) mapa[campo] = enc
  })
  return mapa
}

export const parsearFilas = (
  filas: Record<string, unknown>[],
  mapa: Record<string, string>,
  grupoId: string,
  alumnosExistentes: Alumno[]
): CandidatoImportacion[] => {
  const matriculasExistentes = new Set(alumnosExistentes.map((a) => a.matricula.toUpperCase()))
  const vistasEnArchivo = new Set<string>()

  return filas.map((fila, i) => {
    const obtener = (campo: string): string => {
      const encabezado = mapa[campo]
      if (!encabezado) return ''
      return String(fila[encabezado] ?? '').trim()
    }

    const datos: AlumnoCrear = {
      matricula: obtener('matricula').toUpperCase(),
      nombre: obtener('nombre'),
      apellidos: obtener('apellidos'),
      grupoId,
      tutor: obtener('tutor') || undefined,
      telTutor: obtener('telTutor') || undefined,
      email: obtener('email') || undefined,
    }

    let estado: EstadoImportacion = 'nuevo'
    let motivo = 'Listo para importar'

    if (!datos.matricula || !datos.nombre || !datos.apellidos) {
      estado = 'incompleto'
      motivo = 'Faltan datos obligatorios (matrícula, nombre o apellidos)'
    } else if (matriculasExistentes.has(datos.matricula)) {
      estado = 'duplicado'
      motivo = 'La matrícula ya existe en el sistema'
    } else if (vistasEnArchivo.has(datos.matricula)) {
      estado = 'duplicado'
      motivo = 'Matrícula repetida en el archivo'
    }

    if (datos.matricula) vistasEnArchivo.add(datos.matricula)

    return { fila: i + 2, datos, estado, motivo } // +2: fila 1 es encabezado
  })
}
