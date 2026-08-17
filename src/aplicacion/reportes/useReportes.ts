// Hook de Reportes - Capa de Aplicacion

import { useCallback, useState } from 'react'
import { alumnoRepositorio } from '../../datos/alumnos/AlumnoRepositorio'
import { asistenciaRepositorio } from '../../datos/asistencia/AsistenciaRepositorio'
import { calificacionRepositorio } from '../../datos/calificaciones/CalificacionRepositorio'
import { materiaRepositorio } from '../../datos/materias/MateriaRepositorio'
import { nombreCompleto } from '../../dominio/alumnos/Alumno'
import { generarCSV, descargarCSV } from '../../dominio/reportes/GeneradorCSV'

export interface EstadoReportes {
  generando: boolean
  error: string | null
  descargarAsistenciaCSV: (grupoId: string, grupoNombre: string, desde: string, hasta: string) => Promise<void>
  descargarCalificacionesCSV: (grupoId: string, grupoNombre: string, materiaId: string) => Promise<void>
}

const ETIQUETAS_ESTADO: Record<string, string> = {
  presente: 'Presente',
  ausente: 'Ausente',
  retardo: 'Retardo',
}

export const useReportes = (): EstadoReportes => {
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const descargarAsistenciaCSV = useCallback(
    async (grupoId: string, grupoNombre: string, desde: string, hasta: string) => {
      if (!grupoId || !desde || !hasta) {
        setError('Selecciona grupo y rango de fechas.')
        return
      }
      if (desde > hasta) {
        setError('La fecha "Desde" debe ser anterior a "Hasta".')
        return
      }

      setGenerando(true)
      setError(null)
      try {
        const [alumnos, registros] = await Promise.all([
          alumnoRepositorio.obtenerPorGrupo(grupoId),
          asistenciaRepositorio.obtenerPorGrupoYRango(grupoId, desde, hasta),
        ])

        const mapaAlumnos = new Map(alumnos.map((a) => [a.id, a]))

        const filas = registros
          .slice()
          .sort((a, b) => a.fecha.localeCompare(b.fecha))
          .map((r) => {
            const alumno = mapaAlumnos.get(r.alumnoId)
            return [
              alumno?.matricula ?? r.alumnoId,
              alumno ? nombreCompleto(alumno) : '(alumno no encontrado)',
              r.fecha,
              ETIQUETAS_ESTADO[r.estado] ?? r.estado,
              r.metodo === 'qr' ? 'QR' : 'Manual',
            ]
          })

        const csv = generarCSV(['Matrícula', 'Nombre', 'Fecha', 'Estado', 'Método'], filas)
        descargarCSV(`asistencia_${grupoNombre.replace(/[^a-z0-9]/gi, '_')}_${desde}_a_${hasta}.csv`, csv)
      } catch (err) {
        console.error('useReportes: error al generar CSV de asistencia', err)
        setError('No se pudo generar el reporte de asistencia.')
      } finally {
        setGenerando(false)
      }
    },
    []
  )

  const descargarCalificacionesCSV = useCallback(
    async (grupoId: string, grupoNombre: string, materiaId: string) => {
      if (!grupoId || !materiaId) {
        setError('Selecciona grupo y materia.')
        return
      }

      setGenerando(true)
      setError(null)
      try {
        const [alumnos, materia, calificaciones] = await Promise.all([
          alumnoRepositorio.obtenerPorGrupo(grupoId),
          materiaRepositorio.obtenerPorId(materiaId),
          calificacionRepositorio.obtenerPorMateria(materiaId),
        ])

        if (!materia) {
          setError('No se encontró la materia seleccionada.')
          return
        }

        const encabezados = [
          'Matrícula',
          'Nombre',
          ...materia.rubros.map((r) => `${r.nombre} (${r.peso}%)`),
          'Promedio',
        ]

        const filas = alumnos.map((alumno) => {
          const calificacionesAlumno = calificaciones.filter((c) => c.alumnoId === alumno.id)
          let suma = 0
          let pesoCapturado = 0

          const valoresPorRubro = materia.rubros.map((rubro) => {
            const c = calificacionesAlumno.find((c) => c.rubro === rubro.nombre)
            if (c) {
              suma += c.valor * (rubro.peso / 100)
              pesoCapturado += rubro.peso
              return c.valor
            }
            return ''
          })

          const promedio = pesoCapturado > 0 ? ((suma / pesoCapturado) * 100).toFixed(1) : ''

          return [alumno.matricula, nombreCompleto(alumno), ...valoresPorRubro, promedio]
        })

        const csv = generarCSV(encabezados, filas)
        descargarCSV(
          `calificaciones_${grupoNombre.replace(/[^a-z0-9]/gi, '_')}_${materia.clave}.csv`,
          csv
        )
      } catch (err) {
        console.error('useReportes: error al generar CSV de calificaciones', err)
        setError('No se pudo generar el reporte de calificaciones.')
      } finally {
        setGenerando(false)
      }
    },
    []
  )

  return { generando, error, descargarAsistenciaCSV, descargarCalificacionesCSV }
}
