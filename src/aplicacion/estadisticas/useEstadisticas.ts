// Hook de Estadisticas - Capa de Aplicacion

import { useEffect, useState } from 'react'
import { alumnoRepositorio } from '../../datos/alumnos/AlumnoRepositorio'
import { asistenciaRepositorio } from '../../datos/asistencia/AsistenciaRepositorio'
import { calificacionRepositorio } from '../../datos/calificaciones/CalificacionRepositorio'
import { materiaRepositorio } from '../../datos/materias/MateriaRepositorio'
import { calcularPromedio } from '../../dominio/calificaciones/Calificacion'
import { Asistencia } from '../../dominio/asistencia/Asistencia'

export interface PuntoTendencia {
  fecha: string
  porcentaje: number
}

export interface EstadoEstadisticas {
  cargando: boolean
  error: string | null
  totalAlumnos: number
  asistenciaPeriodo: number | null // porcentaje 0-100
  aprobacion: number | null // porcentaje 0-100 de alumnos con promedio >= 6
  promedioGeneral: number | null // 0-10
  conteoPorEstado: { presente: number; ausente: number; retardo: number }
  tendencia: PuntoTendencia[]
}

export const useEstadisticas = (
  grupoId: string,
  materiaId: string,
  desde: string,
  hasta: string
): EstadoEstadisticas => {
  const [estado, setEstado] = useState<EstadoEstadisticas>({
    cargando: false,
    error: null,
    totalAlumnos: 0,
    asistenciaPeriodo: null,
    aprobacion: null,
    promedioGeneral: null,
    conteoPorEstado: { presente: 0, ausente: 0, retardo: 0 },
    tendencia: [],
  })

  useEffect(() => {
    if (!grupoId || !desde || !hasta) return

    let cancelado = false
    setEstado((prev) => ({ ...prev, cargando: true, error: null }))

    const cargar = async () => {
      try {
        const [alumnos, asistencias, materias] = await Promise.all([
          alumnoRepositorio.obtenerPorGrupo(grupoId),
          asistenciaRepositorio.obtenerPorGrupoYRango(grupoId, desde, hasta),
          materiaRepositorio.obtenerTodos(),
        ])

        if (cancelado) return

        // ---------- Asistencia del periodo ----------
        const conteoPorEstado = { presente: 0, ausente: 0, retardo: 0 }
        asistencias.forEach((a: Asistencia) => {
          conteoPorEstado[a.estado] += 1
        })
        const totalRegistros = asistencias.length
        const asistieron = conteoPorEstado.presente + conteoPorEstado.retardo
        const asistenciaPeriodo = totalRegistros > 0 ? Math.round((asistieron / totalRegistros) * 100) : null

        // ---------- Tendencia por dia ----------
        const porDia = new Map<string, { total: number; asistio: number }>()
        asistencias.forEach((a) => {
          const acc = porDia.get(a.fecha) ?? { total: 0, asistio: 0 }
          acc.total += 1
          if (a.estado !== 'ausente') acc.asistio += 1
          porDia.set(a.fecha, acc)
        })
        const tendencia: PuntoTendencia[] = Array.from(porDia.entries())
          .map(([fecha, v]) => ({ fecha, porcentaje: Math.round((v.asistio / v.total) * 100) }))
          .sort((a, b) => a.fecha.localeCompare(b.fecha))

        // ---------- Calificaciones: aprobacion y promedio general ----------
        const idsAlumnos = new Set(alumnos.map((a) => a.id))
        const materiasAConsiderar = materiaId ? materias.filter((m) => m.id === materiaId) : materias

        const calificacionesPorMateria = await Promise.all(
          materiasAConsiderar.map((m) => calificacionRepositorio.obtenerPorMateria(m.id))
        )

        // promedio por alumno (promedio de sus materias consideradas)
        const promediosPorAlumno = new Map<string, number[]>()
        materiasAConsiderar.forEach((materia, i) => {
          const califsMateria = calificacionesPorMateria[i].filter((c) => idsAlumnos.has(c.alumnoId))
          const porAlumno = new Map<string, typeof califsMateria>()
          califsMateria.forEach((c) => {
            if (!porAlumno.has(c.alumnoId)) porAlumno.set(c.alumnoId, [])
            porAlumno.get(c.alumnoId)!.push(c)
          })
          porAlumno.forEach((calfs, alumnoId) => {
            const promedio = calcularPromedio(calfs, materia.rubros)
            if (promedio !== null) {
              if (!promediosPorAlumno.has(alumnoId)) promediosPorAlumno.set(alumnoId, [])
              promediosPorAlumno.get(alumnoId)!.push(promedio / 10) // a escala 0-10
            }
          })
        })

        const promediosFinales: number[] = []
        promediosPorAlumno.forEach((lista) => {
          promediosFinales.push(lista.reduce((a, b) => a + b, 0) / lista.length)
        })

        const promedioGeneral =
          promediosFinales.length > 0
            ? Number((promediosFinales.reduce((a, b) => a + b, 0) / promediosFinales.length).toFixed(1))
            : null

        const aprobacion =
          promediosFinales.length > 0
            ? Math.round((promediosFinales.filter((p) => p >= 6).length / promediosFinales.length) * 100)
            : null

        setEstado({
          cargando: false,
          error: null,
          totalAlumnos: alumnos.length,
          asistenciaPeriodo,
          aprobacion,
          promedioGeneral,
          conteoPorEstado,
          tendencia,
        })
      } catch (err) {
        console.error('useEstadisticas: error al cargar', err)
        if (!cancelado) {
          setEstado((prev) => ({ ...prev, cargando: false, error: 'No se pudieron cargar las estadísticas.' }))
        }
      }
    }

    cargar()
    return () => {
      cancelado = true
    }
  }, [grupoId, materiaId, desde, hasta])

  return estado
}
