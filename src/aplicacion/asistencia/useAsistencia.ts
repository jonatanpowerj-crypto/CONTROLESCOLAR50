// Hook de Asistencia - Capa de Aplicacion

import { useEffect, useState, useCallback } from 'react'
import { Alumno } from '../../dominio/alumnos/Alumno'
import { AsistenciaCrear, EstadoAsistencia } from '../../dominio/asistencia/Asistencia'
import { alumnoRepositorio } from '../../datos/alumnos/AlumnoRepositorio'
import { asistenciaRepositorio } from '../../datos/asistencia/AsistenciaRepositorio'

export interface ResultadoQR {
  ok: boolean
  mensaje: string
  alumno?: Alumno
}

export interface EstadoAsistenciaHook {
  alumnos: Alumno[]
  valores: Record<string, EstadoAsistencia | null>
  cargando: boolean
  guardando: boolean
  error: string | null
  marcarEstado: (alumnoId: string, estado: EstadoAsistencia) => void
  guardar: (registradoPor: string) => Promise<boolean>
  marcarPorQR: (matricula: string, registradoPor: string) => Promise<ResultadoQR>
}

export const useAsistencia = (grupoId: string, fecha: string): EstadoAsistenciaHook => {
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [valores, setValores] = useState<Record<string, EstadoAsistencia | null>>({})
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!grupoId || !fecha) {
      setAlumnos([])
      setValores({})
      return
    }

    let cancelado = false
    setCargando(true)
    setError(null)

    const cargar = async () => {
      try {
        const [listaAlumnos, asistenciaExistente] = await Promise.all([
          alumnoRepositorio.obtenerPorGrupo(grupoId),
          asistenciaRepositorio.obtenerPorGrupoYFecha(grupoId, fecha),
        ])

        if (cancelado) return

        const mapaExistente: Record<string, EstadoAsistencia | null> = {}
        listaAlumnos.forEach((a) => {
          mapaExistente[a.id] = null
        })
        asistenciaExistente.forEach((registro) => {
          mapaExistente[registro.alumnoId] = registro.estado
        })

        setAlumnos(listaAlumnos)
        setValores(mapaExistente)
      } catch (err) {
        console.error('useAsistencia: error al cargar', err)
        if (!cancelado) setError('No se pudo cargar la lista de alumnos o la asistencia.')
      } finally {
        if (!cancelado) setCargando(false)
      }
    }

    cargar()
    return () => {
      cancelado = true
    }
  }, [grupoId, fecha])

  const marcarEstado = useCallback((alumnoId: string, estado: EstadoAsistencia) => {
    setValores((prev) => ({ ...prev, [alumnoId]: estado }))
  }, [])

  const guardar = useCallback(
    async (registradoPor: string): Promise<boolean> => {
      setGuardando(true)
      setError(null)
      try {
        const registros: AsistenciaCrear[] = alumnos
          .filter((a) => valores[a.id])
          .map((a) => ({
            alumnoId: a.id,
            grupoId,
            fecha,
            estado: valores[a.id] as EstadoAsistencia,
            registradoPor,
            metodo: 'manual' as const,
          }))

        if (registros.length === 0) {
          setError('Marca al menos un alumno antes de guardar.')
          return false
        }

        await asistenciaRepositorio.guardarLote(registros)
        return true
      } catch (err) {
        console.error('useAsistencia: error al guardar', err)
        setError('No se pudo guardar la asistencia. Intenta de nuevo.')
        return false
      } finally {
        setGuardando(false)
      }
    },
    [alumnos, valores, grupoId, fecha]
  )

  // Marca a un alumno como presente de inmediato (escritura individual,
  // no en lote), a partir de la matricula leida por el escaner QR.
  const marcarPorQR = useCallback(
    async (matricula: string, registradoPor: string): Promise<ResultadoQR> => {
      const alumno = alumnos.find(
        (a) => a.matricula.toLowerCase() === matricula.toLowerCase()
      )

      if (!alumno) {
        return {
          ok: false,
          mensaje: `La matrícula ${matricula} no pertenece a este grupo o no existe.`,
        }
      }

      try {
        await asistenciaRepositorio.guardarUno({
          alumnoId: alumno.id,
          grupoId,
          fecha,
          estado: 'presente',
          registradoPor,
          metodo: 'qr',
        })
        setValores((prev) => ({ ...prev, [alumno.id]: 'presente' }))
        return { ok: true, mensaje: 'Registrado correctamente.', alumno }
      } catch (err) {
        console.error('useAsistencia: error al marcar por QR', err)
        return { ok: false, mensaje: 'No se pudo guardar el registro. Intenta de nuevo.' }
      }
    },
    [alumnos, grupoId, fecha]
  )

  return { alumnos, valores, cargando, guardando, error, marcarEstado, guardar, marcarPorQR }
}
