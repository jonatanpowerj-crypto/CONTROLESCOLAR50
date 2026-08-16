// Hook de Calificaciones - Capa de Aplicacion

import { useEffect, useState, useCallback } from 'react'
import { Alumno } from '../../dominio/alumnos/Alumno'
import { Materia } from '../../dominio/materias/Materia'
import { CalificacionCrear } from '../../dominio/calificaciones/Calificacion'
import { alumnoRepositorio } from '../../datos/alumnos/AlumnoRepositorio'
import { calificacionRepositorio } from '../../datos/calificaciones/CalificacionRepositorio'
import { materiaRepositorio } from '../../datos/materias/MateriaRepositorio'

export interface EstadoCalificaciones {
  alumnos: Alumno[]
  materia: Materia | null
  valores: Record<string, Record<string, number | ''>>
  cargando: boolean
  guardando: boolean
  error: string | null
  marcarValor: (alumnoId: string, rubro: string, valor: number | '') => void
  guardar: (registradoPor: string) => Promise<boolean>
}

export const useCalificaciones = (grupoId: string, materiaId: string): EstadoCalificaciones => {
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [materia, setMateria] = useState<Materia | null>(null)
  const [valores, setValores] = useState<Record<string, Record<string, number | ''>>>({})
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!grupoId || !materiaId) {
      setAlumnos([])
      setMateria(null)
      setValores({})
      return
    }

    let cancelado = false
    setCargando(true)
    setError(null)

    const cargar = async () => {
      try {
        const [listaAlumnos, materiaDoc, calificacionesMateria] = await Promise.all([
          alumnoRepositorio.obtenerPorGrupo(grupoId),
          materiaRepositorio.obtenerPorId(materiaId),
          calificacionRepositorio.obtenerPorMateria(materiaId),
        ])

        if (cancelado) return

        const mapaValores: Record<string, Record<string, number | ''>> = {}
        listaAlumnos.forEach((a) => {
          mapaValores[a.id] = {}
          ;(materiaDoc?.rubros ?? []).forEach((r) => {
            mapaValores[a.id][r.nombre] = ''
          })
        })
        calificacionesMateria.forEach((c) => {
          if (mapaValores[c.alumnoId]) {
            mapaValores[c.alumnoId][c.rubro] = c.valor
          }
        })

        setAlumnos(listaAlumnos)
        setMateria(materiaDoc)
        setValores(mapaValores)
      } catch (err) {
        console.error('useCalificaciones: error al cargar', err)
        if (!cancelado) setError('No se pudieron cargar los alumnos o las calificaciones.')
      } finally {
        if (!cancelado) setCargando(false)
      }
    }

    cargar()
    return () => {
      cancelado = true
    }
  }, [grupoId, materiaId])

  const marcarValor = useCallback((alumnoId: string, rubro: string, valor: number | '') => {
    setValores((prev) => ({
      ...prev,
      [alumnoId]: { ...prev[alumnoId], [rubro]: valor },
    }))
  }, [])

  const guardar = useCallback(
    async (registradoPor: string): Promise<boolean> => {
      if (!materia) {
        setError('No se ha seleccionado una materia valida.')
        return false
      }

      setGuardando(true)
      setError(null)
      try {
        const registros: CalificacionCrear[] = []

        alumnos.forEach((alumno) => {
          materia.rubros.forEach((rubro) => {
            const valor = valores[alumno.id]?.[rubro.nombre]
            if (valor !== '' && valor !== undefined && !Number.isNaN(valor)) {
              registros.push({
                alumnoId: alumno.id,
                materiaId: materia.id,
                rubro: rubro.nombre,
                valor: Number(valor),
                registradoPor,
              })
            }
          })
        })

        if (registros.length === 0) {
          setError('Captura al menos una calificación antes de guardar.')
          return false
        }

        await calificacionRepositorio.guardarLote(registros)
        return true
      } catch (err) {
        console.error('useCalificaciones: error al guardar', err)
        setError('No se pudieron guardar las calificaciones. Intenta de nuevo.')
        return false
      } finally {
        setGuardando(false)
      }
    },
    [alumnos, materia, valores]
  )

  return { alumnos, materia, valores, cargando, guardando, error, marcarValor, guardar }
}
