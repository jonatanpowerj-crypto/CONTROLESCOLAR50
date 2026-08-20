// Hook de Estadisticas de Alumnos - Capa de Aplicacion
//
// IMPORTANTE: este hook NO usa dominio/alumnos/valueObjects.ts (ese
// archivo define un esquema incompatible con los datos reales que
// guardan los modulos de Asistencia y Calificaciones - estados de una
// letra 'P'/'R'/'J'/'F' en vez de 'presente'/'ausente'/'retardo', y
// exige materiaId/hora que Asistencia real no usa). Este hook calcula
// las estadisticas usando los modelos reales (dominio/asistencia y
// dominio/calificaciones) para que los numeros sean correctos.

import { useEffect, useState } from 'react'
import { asistenciaRepositorio } from '../../datos/asistencia/AsistenciaRepositorio'
import { calificacionRepositorio } from '../../datos/calificaciones/CalificacionRepositorio'
import { materiaRepositorio } from '../../datos/materias/MateriaRepositorio'
import { calcularPromedio } from '../../dominio/calificaciones/Calificacion'
import { EstadisticaAlumno, calcularEstadoAlumno } from '../../datos/alumnos/AlumnoEstadisticas'

export const useEstadisticasAlumnos = () => {
  const [mapa, setMapa] = useState<Map<string, EstadisticaAlumno>>(new Map())
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let cancelado = false

    const cargar = async () => {
      try {
        const [asistencias, calificaciones, materias] = await Promise.all([
          asistenciaRepositorio.obtenerTodos(),
          calificacionRepositorio.obtenerTodos(),
          materiaRepositorio.obtenerTodos(),
        ])

        if (cancelado) return

        const rubrosPorMateria = new Map(materias.map((m) => [m.id, m.rubros]))

        // ---------- Asistencia por alumno (todas las materias/dias) ----------
        const asistPorAlumno = new Map<string, { total: number; asistio: number }>()
        asistencias.forEach((a) => {
          const acc = asistPorAlumno.get(a.alumnoId) ?? { total: 0, asistio: 0 }
          acc.total += 1
          if (a.estado !== 'ausente') acc.asistio += 1
          asistPorAlumno.set(a.alumnoId, acc)
        })

        // ---------- Promedio por alumno (promedio de sus materias) ----------
        const califPorAlumnoYMateria = new Map<string, Map<string, typeof calificaciones>>()
        calificaciones.forEach((c) => {
          if (!califPorAlumnoYMateria.has(c.alumnoId)) {
            califPorAlumnoYMateria.set(c.alumnoId, new Map())
          }
          const porMateria = califPorAlumnoYMateria.get(c.alumnoId)!
          if (!porMateria.has(c.materiaId)) porMateria.set(c.materiaId, [])
          porMateria.get(c.materiaId)!.push(c)
        })

        const nuevoMapa = new Map<string, EstadisticaAlumno>()
        const idsConDatos = new Set([...asistPorAlumno.keys(), ...califPorAlumnoYMateria.keys()])

        idsConDatos.forEach((alumnoId) => {
          const asist = asistPorAlumno.get(alumnoId)
          const porcentajeAsistencia = asist && asist.total > 0
            ? Math.round((asist.asistio / asist.total) * 100)
            : 100

          const porMateria = califPorAlumnoYMateria.get(alumnoId)
          let promedioGeneral = 0
          let totalCalificaciones = 0

          if (porMateria) {
            const promediosMateria: number[] = []
            porMateria.forEach((califsMateria, materiaId) => {
              totalCalificaciones += califsMateria.length
              const rubros = rubrosPorMateria.get(materiaId) ?? []
              const promedio = calcularPromedio(califsMateria, rubros)
              if (promedio !== null) promediosMateria.push(promedio)
            })
            if (promediosMateria.length > 0) {
              promedioGeneral = Number(
                (promediosMateria.reduce((a, b) => a + b, 0) / promediosMateria.length / 10).toFixed(1)
              )
              // calcularPromedio devuelve escala 0-100; se normaliza a 0-10
              // para que coincida con la escala que usa la tabla (Promedio).
            }
          }

          const estadistica: EstadisticaAlumno = {
            alumnoId,
            promedioGeneral,
            porcentajeAsistencia,
            totalCalificaciones,
            totalAsistencias: asist?.total ?? 0,
            estado: 'bueno',
          }
          estadistica.estado = calcularEstadoAlumno(estadistica)
          nuevoMapa.set(alumnoId, estadistica)
        })

        setMapa(nuevoMapa)
      } catch (err) {
        console.error('useEstadisticasAlumnos: error al calcular', err)
      } finally {
        if (!cancelado) setCargando(false)
      }
    }

    cargar()
    return () => {
      cancelado = true
    }
  }, [])

  return { estadisticas: mapa, cargandoEstadisticas: cargando }
}
