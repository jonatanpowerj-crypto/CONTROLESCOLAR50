// Hook del Panel del Dia - Capa de Aplicacion

import { useEffect, useState } from 'react'
import { alumnoRepositorio } from '../../datos/alumnos/AlumnoRepositorio'
import { horarioRepositorio } from '../../datos/horarios/HorarioRepositorio'
import { materiaRepositorio } from '../../datos/materias/MateriaRepositorio'
import { asistenciaRepositorio } from '../../datos/asistencia/AsistenciaRepositorio'
import { FirebaseClient } from '../../datos/firebase/firebaseClient'
import { diaDeHoy, fechaHoyISO } from '../../dominio/panel/ResumenDia'
import { Horario } from '../../dominio/horarios/Horario'
import { Alumno } from '../../dominio/alumnos/Alumno'

interface Grupo {
  id: string
  nombre: string
}
const grupoRepositorio = new FirebaseClient<Grupo>('grupos')

export interface ClaseHoy {
  horario: Horario
  materiaNombre: string
  grupoNombre: string
}

export interface AlumnoRiesgo {
  alumno: Alumno
  porcentaje: number
}

export interface EstadoPanelDia {
  totalAlumnos: number
  clasesHoy: ClaseHoy[]
  asistenciasHoy: number
  faltasHoy: number
  alumnosEnRiesgo: AlumnoRiesgo[]
  diaHoy: string | null
  cargando: boolean
  error: string | null
}

const UMBRAL_RIESGO = 80 // porcentaje de asistencia minimo aceptable

export const usePanelDia = (): EstadoPanelDia => {
  const [estado, setEstado] = useState<EstadoPanelDia>({
    totalAlumnos: 0,
    clasesHoy: [],
    asistenciasHoy: 0,
    faltasHoy: 0,
    alumnosEnRiesgo: [],
    diaHoy: diaDeHoy(),
    cargando: true,
    error: null,
  })

  useEffect(() => {
    let cancelado = false

    const cargar = async () => {
      try {
        const [alumnos, horarios, materias, grupos, asistencias] = await Promise.all([
          alumnoRepositorio.obtenerTodos(),
          horarioRepositorio.obtenerTodos(),
          materiaRepositorio.obtenerTodos(),
          grupoRepositorio.obtenerTodos(),
          asistenciaRepositorio.obtenerTodos(),
        ])

        if (cancelado) return

        const dia = diaDeHoy()
        const fechaHoy = fechaHoyISO()

        const mapaMaterias = new Map(materias.map((m) => [m.id, m.nombre]))
        const mapaGrupos = new Map(grupos.map((g) => [g.id, g.nombre]))

        const clasesHoy: ClaseHoy[] = horarios
          .filter((h) => h.dia === dia)
          .sort((a, b) => a.hi.localeCompare(b.hi))
          .map((h) => ({
            horario: h,
            materiaNombre: mapaMaterias.get(h.materiaId) ?? 'Materia',
            grupoNombre: mapaGrupos.get(h.grupoId) ?? 'Grupo',
          }))

        const asistenciasDeHoy = asistencias.filter((a) => a.fecha === fechaHoy)
        const asistenciasHoy = asistenciasDeHoy.filter((a) => a.estado !== 'ausente').length
        const faltasHoy = asistenciasDeHoy.filter((a) => a.estado === 'ausente').length

        // Asistencia global por alumno (todo el historial), para
        // detectar quienes estan por debajo del umbral de riesgo.
        const porAlumno = new Map<string, { total: number; asistio: number }>()
        asistencias.forEach((a) => {
          const acc = porAlumno.get(a.alumnoId) ?? { total: 0, asistio: 0 }
          acc.total += 1
          if (a.estado !== 'ausente') acc.asistio += 1
          porAlumno.set(a.alumnoId, acc)
        })

        const alumnosEnRiesgo: AlumnoRiesgo[] = alumnos
          .map((alumno) => {
            const datos = porAlumno.get(alumno.id)
            if (!datos || datos.total === 0) return null
            const porcentaje = Number(((datos.asistio / datos.total) * 100).toFixed(0))
            return porcentaje < UMBRAL_RIESGO ? { alumno, porcentaje } : null
          })
          .filter((x): x is AlumnoRiesgo => x !== null)
          .sort((a, b) => a.porcentaje - b.porcentaje)
          .slice(0, 6)

        setEstado({
          totalAlumnos: alumnos.length,
          clasesHoy,
          asistenciasHoy,
          faltasHoy,
          alumnosEnRiesgo,
          diaHoy: dia,
          cargando: false,
          error: null,
        })
      } catch (err) {
        console.error('usePanelDia: error al cargar', err)
        if (!cancelado) {
          setEstado((prev) => ({ ...prev, cargando: false, error: 'No se pudo cargar el panel del día.' }))
        }
      }
    }

    cargar()
    return () => {
      cancelado = true
    }
  }, [])

  return estado
}
