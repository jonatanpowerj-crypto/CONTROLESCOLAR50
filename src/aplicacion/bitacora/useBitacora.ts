// Hook de Bitacora - Capa de Aplicacion

import { useCallback, useEffect, useState } from 'react'
import { SesionBitacora, SesionBitacoraCrear } from '../../dominio/bitacora/Bitacora'
import { bitacoraRepositorio } from '../../datos/bitacora/BitacoraRepositorio'

export interface EstadoBitacora {
  sesiones: SesionBitacora[]
  cargando: boolean
  error: string | null
  guardando: boolean
  crear: (datos: SesionBitacoraCrear) => Promise<boolean>
  actualizar: (id: string, datos: Partial<SesionBitacoraCrear>) => Promise<boolean>
  eliminar: (id: string) => Promise<boolean>
}

export const useBitacora = (materiaId: string, grupoId: string): EstadoBitacora => {
  const [sesiones, setSesiones] = useState<SesionBitacora[]>([])
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    if (!materiaId || !grupoId) {
      setSesiones([])
      return
    }
    setCargando(true)
    setError(null)
    try {
      const todas = await bitacoraRepositorio.obtenerPorMateria(materiaId)
      const filtradas = todas
        .filter((s) => s.grupoId === grupoId)
        .sort((a, b) => b.fecha.localeCompare(a.fecha))
      setSesiones(filtradas)
    } catch (err) {
      console.error('useBitacora: error al cargar', err)
      setError('No se pudieron cargar las sesiones de la bitácora.')
    } finally {
      setCargando(false)
    }
  }, [materiaId, grupoId])

  useEffect(() => {
    cargar()
  }, [cargar])

  const crear = useCallback(
    async (datos: SesionBitacoraCrear): Promise<boolean> => {
      setGuardando(true)
      try {
        await bitacoraRepositorio.crearSesion(datos)
        await cargar()
        return true
      } catch (err) {
        console.error('useBitacora: error al crear', err)
        setError('No se pudo guardar la sesión.')
        return false
      } finally {
        setGuardando(false)
      }
    },
    [cargar]
  )

  const actualizar = useCallback(
    async (id: string, datos: Partial<SesionBitacoraCrear>): Promise<boolean> => {
      setGuardando(true)
      try {
        await bitacoraRepositorio.actualizarSesion(id, datos)
        await cargar()
        return true
      } catch (err) {
        console.error('useBitacora: error al actualizar', err)
        setError('No se pudo actualizar la sesión.')
        return false
      } finally {
        setGuardando(false)
      }
    },
    [cargar]
  )

  const eliminar = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await bitacoraRepositorio.eliminar(id)
        await cargar()
        return true
      } catch (err) {
        console.error('useBitacora: error al eliminar', err)
        setError('No se pudo eliminar la sesión.')
        return false
      }
    },
    [cargar]
  )

  return { sesiones, cargando, error, guardando, crear, actualizar, eliminar }
}
