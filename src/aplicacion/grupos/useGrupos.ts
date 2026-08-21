// Hook de Grupos - Capa de Aplicacion

import { useCallback, useEffect, useState } from 'react'
import { Grupo, GrupoCrear, GrupoActualizar } from '../../dominio/grupos/Grupo'
import { grupoRepositorio } from '../../datos/grupos/GrupoRepositorio'

export interface EstadoGrupos {
  grupos: Grupo[]
  cargando: boolean
  error: string | null
  recargar: () => void
  crear: (datos: GrupoCrear) => Promise<boolean>
  actualizar: (id: string, datos: GrupoActualizar) => Promise<boolean>
  eliminar: (id: string) => Promise<boolean>
  promover: (nuevoGrupo: Grupo, idsAlumnos: string[]) => Promise<boolean>
}

const generarId = (): string =>
  `g${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

export const useGrupos = (): EstadoGrupos => {
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const lista = await grupoRepositorio.obtenerTodos()
      setGrupos(lista)
    } catch (err) {
      console.error('useGrupos: error al cargar', err)
      setError('No se pudieron cargar los grupos.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const crear = useCallback(
    async (datos: GrupoCrear): Promise<boolean> => {
      try {
        await grupoRepositorio.crearGrupo(datos, generarId())
        await cargar()
        return true
      } catch (err) {
        console.error('useGrupos: error al crear', err)
        setError('No se pudo crear el grupo.')
        return false
      }
    },
    [cargar]
  )

  const actualizar = useCallback(
    async (id: string, datos: GrupoActualizar): Promise<boolean> => {
      try {
        await grupoRepositorio.actualizar(id, datos)
        await cargar()
        return true
      } catch (err) {
        console.error('useGrupos: error al actualizar', err)
        setError('No se pudo actualizar el grupo.')
        return false
      }
    },
    [cargar]
  )

  const eliminar = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await grupoRepositorio.eliminar(id)
        await cargar()
        return true
      } catch (err) {
        console.error('useGrupos: error al eliminar', err)
        setError('No se pudo eliminar el grupo.')
        return false
      }
    },
    [cargar]
  )

  const promover = useCallback(
    async (nuevoGrupo: Grupo, idsAlumnos: string[]): Promise<boolean> => {
      try {
        await grupoRepositorio.promoverGrupo(nuevoGrupo, idsAlumnos)
        await cargar()
        return true
      } catch (err) {
        console.error('useGrupos: error al promover', err)
        setError('No se pudo promover el grupo.')
        return false
      }
    },
    [cargar]
  )

  return { grupos, cargando, error, recargar: cargar, crear, actualizar, eliminar, promover }
}
