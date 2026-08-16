// Hook de Docentes - Capa de Aplicacion

import { useCallback, useEffect, useState } from 'react'
import { Docente, DocenteCrear, DocenteActualizar } from '../../dominio/docentes/Docente'
import { docenteRepositorio, usuarioRepositorioLectura } from '../../datos/docentes/DocenteRepositorio'

export interface DocenteConAcceso extends Docente {
  tieneCuenta: boolean
}

export interface EstadoDocentes {
  docentes: DocenteConAcceso[]
  cargando: boolean
  error: string | null
  recargar: () => void
  crear: (datos: DocenteCrear) => Promise<boolean>
  actualizar: (id: string, datos: DocenteActualizar) => Promise<boolean>
  eliminar: (id: string) => Promise<boolean>
}

const generarId = (): string =>
  `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

export const useDocentes = (): EstadoDocentes => {
  const [docentes, setDocentes] = useState<DocenteConAcceso[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [listaDocentes, listaUsuarios] = await Promise.all([
        docenteRepositorio.obtenerTodos(),
        usuarioRepositorioLectura.obtenerTodos(),
      ])

      const idsConCuenta = new Set(
        listaUsuarios.filter((u) => u.docenteId).map((u) => u.docenteId)
      )

      const combinados: DocenteConAcceso[] = listaDocentes.map((d) => ({
        ...d,
        tieneCuenta: idsConCuenta.has(d.id),
      }))

      setDocentes(combinados)
    } catch (err) {
      console.error('useDocentes: error al cargar', err)
      setError('No se pudieron cargar los docentes.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const crear = useCallback(
    async (datos: DocenteCrear): Promise<boolean> => {
      try {
        await docenteRepositorio.crearDocente(datos, generarId())
        await cargar()
        return true
      } catch (err) {
        console.error('useDocentes: error al crear', err)
        setError('No se pudo crear el docente.')
        return false
      }
    },
    [cargar]
  )

  const actualizar = useCallback(
    async (id: string, datos: DocenteActualizar): Promise<boolean> => {
      try {
        await docenteRepositorio.actualizar(id, datos)
        await cargar()
        return true
      } catch (err) {
        console.error('useDocentes: error al actualizar', err)
        setError('No se pudo actualizar el docente.')
        return false
      }
    },
    [cargar]
  )

  const eliminar = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await docenteRepositorio.eliminar(id)
        await cargar()
        return true
      } catch (err) {
        console.error('useDocentes: error al eliminar', err)
        setError('No se pudo eliminar el docente.')
        return false
      }
    },
    [cargar]
  )

  return { docentes, cargando, error, recargar: cargar, crear, actualizar, eliminar }
}
