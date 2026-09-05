// Hook de Solicitudes de Registro de Docente - Capa de Aplicacion

import { useCallback, useEffect, useState } from 'react'
import { Solicitud } from '../../dominio/docentes/Solicitud'
import { solicitudRepositorio } from '../../datos/docentes/SolicitudRepositorio'
import { docenteRepositorio } from '../../datos/docentes/DocenteRepositorio'
import { materiaRepositorio } from '../../datos/materias/MateriaRepositorio'

export interface EstadoSolicitudes {
  pendientes: Solicitud[]
  cargando: boolean
  procesando: boolean
  error: string | null
  recargar: () => void
  incorporar: (solicitud: Solicitud) => Promise<boolean>
  descartar: (id: string) => Promise<boolean>
}

const generarIdDocente = (): string =>
  `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
const generarIdMateria = (): string =>
  `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

export const useSolicitudes = (): EstadoSolicitudes => {
  const [pendientes, setPendientes] = useState<Solicitud[]>([])
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const todas = await solicitudRepositorio.obtenerTodos()
      setPendientes(todas.filter((s) => s.estado === 'pendiente'))
    } catch (err) {
      console.error('useSolicitudes: error al cargar', err)
      setError('No se pudieron cargar las solicitudes.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const incorporar = useCallback(
    async (solicitud: Solicitud): Promise<boolean> => {
      setProcesando(true)
      setError(null)
      try {
        // 1. Docente: buscar por correo, actualizar si existe o crear si no.
        const docentesActuales = await docenteRepositorio.obtenerTodos()
        const correo = solicitud.docente.email.trim().toLowerCase()
        const docenteExistente = docentesActuales.find((d) => d.email.toLowerCase() === correo)

        let docenteId: string
        if (docenteExistente) {
          docenteId = docenteExistente.id
          await docenteRepositorio.actualizar(docenteId, {
            nombre: solicitud.docente.nombre,
            telefono: solicitud.docente.telefono,
            especialidad: solicitud.docente.especialidad,
          })
        } else {
          docenteId = generarIdDocente()
          await docenteRepositorio.crearDocente(
            {
              nombre: solicitud.docente.nombre,
              email: correo,
              telefono: solicitud.docente.telefono,
              especialidad: solicitud.docente.especialidad,
            },
            docenteId
          )
        }

        // 2. Materias: buscar por clave, actualizar docenteId si existe
        //    o crear con un plan de evaluacion por defecto si no.
        const materiasActuales = await materiaRepositorio.obtenerTodos()
        for (const m of solicitud.materias) {
          if (!m.clave.trim() || !m.nombre.trim()) continue
          const existente = materiasActuales.find(
            (x) => x.clave.toLowerCase() === m.clave.trim().toLowerCase()
          )
          if (existente) {
            await materiaRepositorio.actualizar(existente.id, { docenteId })
          } else {
            await materiaRepositorio.crearMateria(
              {
                nombre: m.nombre.trim(),
                clave: m.clave.trim(),
                semestre: m.semestre || 1,
                docenteId,
                // Plan de evaluacion por defecto - el admin lo puede
                // ajustar despues desde Materias si no le sirve.
                rubros: [
                  { nombre: 'Examen parcial', peso: 40 },
                  { nombre: 'Tareas y trabajos', peso: 25 },
                  { nombre: 'Participación', peso: 15 },
                  { nombre: 'Proyecto', peso: 20 },
                ],
              },
              generarIdMateria()
            )
          }
        }

        // 3. Marcar la solicitud como incorporada (no se borra, queda
        //    de registro historico, igual que en el legacy).
        await solicitudRepositorio.marcarIncorporada(solicitud.id)
        await cargar()
        return true
      } catch (err) {
        console.error('useSolicitudes: error al incorporar', err)
        setError('No se pudo incorporar la solicitud. Intenta de nuevo.')
        return false
      } finally {
        setProcesando(false)
      }
    },
    [cargar]
  )

  const descartar = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await solicitudRepositorio.descartar(id)
        await cargar()
        return true
      } catch (err) {
        console.error('useSolicitudes: error al descartar', err)
        setError('No se pudo descartar la solicitud.')
        return false
      }
    },
    [cargar]
  )

  return { pendientes, cargando, procesando, error, recargar: cargar, incorporar, descartar }
}
