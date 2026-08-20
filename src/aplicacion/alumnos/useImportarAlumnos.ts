// Hook de Importacion de Alumnos - Capa de Aplicacion

import { useCallback, useState } from 'react'
import * as XLSX from 'xlsx'
import { alumnoRepositorio } from '../../datos/alumnos/AlumnoRepositorio'
import {
  CandidatoImportacion,
  mapearEncabezados,
  parsearFilas,
} from '../../dominio/alumnos/ImportacionAlumnos'

const generarId = (): string =>
  `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

export interface EstadoImportarAlumnos {
  candidatos: CandidatoImportacion[]
  procesandoArchivo: boolean
  importando: boolean
  error: string | null
  procesarArchivo: (archivo: File, grupoId: string) => Promise<void>
  importarValidos: () => Promise<number>
  limpiar: () => void
}

export const useImportarAlumnos = (): EstadoImportarAlumnos => {
  const [candidatos, setCandidatos] = useState<CandidatoImportacion[]>([])
  const [procesandoArchivo, setProcesandoArchivo] = useState(false)
  const [importando, setImportando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const procesarArchivo = useCallback(async (archivo: File, grupoId: string) => {
    setProcesandoArchivo(true)
    setError(null)
    setCandidatos([])

    try {
      const buffer = await archivo.arrayBuffer()
      const libro = XLSX.read(buffer, { type: 'array' })
      const hoja = libro.Sheets[libro.SheetNames[0]]
      const filas = XLSX.utils.sheet_to_json<Record<string, unknown>>(hoja, { defval: '', raw: false })

      if (filas.length === 0) {
        setError('El archivo no tiene filas de datos.')
        return
      }

      const encabezados = Object.keys(filas[0])
      const mapa = mapearEncabezados(encabezados)

      if (!mapa.matricula || !mapa.nombre || !mapa.apellidos) {
        setError(
          'No se encontraron las columnas obligatorias (matrícula, nombre, apellidos). Descarga la plantilla de ejemplo y compara los encabezados.'
        )
        return
      }

      const alumnosExistentes = await alumnoRepositorio.obtenerTodos()
      const resultado = parsearFilas(filas, mapa, grupoId, alumnosExistentes)
      setCandidatos(resultado)
    } catch (err) {
      console.error('useImportarAlumnos: error al leer archivo', err)
      setError('No se pudo leer el archivo. Verifica que sea un Excel (.xlsx, .xls) o CSV válido.')
    } finally {
      setProcesandoArchivo(false)
    }
  }, [])

  const importarValidos = useCallback(async (): Promise<number> => {
    const validos = candidatos.filter((c) => c.estado === 'nuevo')
    if (validos.length === 0) return 0

    setImportando(true)
    setError(null)
    try {
      await alumnoRepositorio.crearLote(validos.map((c) => ({ datos: c.datos, id: generarId() })))
      setCandidatos([])
      return validos.length
    } catch (err) {
      console.error('useImportarAlumnos: error al importar', err)
      setError('No se pudo completar la importación. Intenta de nuevo.')
      return 0
    } finally {
      setImportando(false)
    }
  }, [candidatos])

  const limpiar = useCallback(() => {
    setCandidatos([])
    setError(null)
  }, [])

  return { candidatos, procesandoArchivo, importando, error, procesarArchivo, importarValidos, limpiar }
}

// Genera y descarga una plantilla de ejemplo en formato .xlsx
export const descargarPlantillaExcel = (): void => {
  const datos = [
    ['matricula', 'nombre', 'apellidos', 'tutor', 'telefono_tutor', 'correo'],
    ['A1050', 'Lucía', 'Pérez Gómez', 'Marta Gómez', '744-000-0000', 'lucia@example.com'],
    ['A1051', 'Hugo', 'Ramírez Cruz', 'José Ramírez', '744-000-0001', ''],
  ]
  const hoja = XLSX.utils.aoa_to_sheet(datos)
  hoja['!cols'] = [{ wch: 10 }, { wch: 14 }, { wch: 20 }, { wch: 18 }, { wch: 14 }, { wch: 24 }]
  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, 'Alumnos')
  XLSX.writeFile(libro, 'plantilla_alumnos_p50.xlsx')
}
