// Hook de Materias - Capa de Aplicacion

import { useCallback, useEffect, useState } from 'react'
import { Materia, MateriaCrear, MateriaActualizar } from '../../dominio/materias/Materia'
import { materiaRepositorio } from '../../datos/materias/MateriaRepositorio'

export interface EstadoMaterias {
  materias: Materia[]
  cargando: boolean
  error: string | null
  recargar: () => void
  crear: (datos: MateriaCrear) => Promise<boolean>
  actualizar: (id: string, datos: MateriaActualizar) => Promise<boolean>
  eliminar: (id: string) => Promise<boolean>
}

const generarId = (): string =>
  `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

export const useMaterias = (): EstadoMaterias => {
  const [materias, setMaterias] = useState<Materia[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const lista = await materiaRepositorio.obtenerTodos()
      setMaterias(lista)
    } catch (err) {
      console.error('useMaterias: error al cargar', err)
      setError('No se pudieron cargar las materias.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const crear = useCallback(
    async (datos: MateriaCrear): Promise<boolean> => {
      try {
        await materiaRepositorio.crearMateria(datos, generarId())
        await cargar()
        return true
      } catch (err) {
        console.error('useMaterias: error al crear', err)
        setError('No se pudo crear la materia.')
        return false
      }
    },
    [cargar]
  )

  const actualizar = useCallback(
    async (id: string, datos: MateriaActualizar): Promise<boolean> => {
      try {
        await materiaRepositorio.actualizar(id, datos)
        await cargar()
        return true
      } catch (err) {
        console.error('useMaterias: error al actualizar', err)
        setError('No se pudo actualizar la materia.')
        return false
      }
    },
    [cargar]
  )

  const eliminar = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await materiaRepositorio.eliminar(id)
        await cargar()
        return true
      } catch (err) {
        console.error('useMaterias: error al eliminar', err)
        setError('No se pudo eliminar la materia.')
        return false
      }
    },
    [cargar]
  )

  return { materias, cargando, error, recargar: cargar, crear, actualizar, eliminar }
}
