// Hook de Configuracion - Capa de Aplicacion

import { useCallback, useEffect, useState } from 'react'
import { ConfigPlantel, ResumenSistema, CONFIG_PLANTEL_DEFECTO } from '../../dominio/configuracion/ConfigPlantel'
import { configuracionRepositorio } from '../../datos/configuracion/ConfiguracionRepositorio'

export interface EstadoConfiguracion {
  plantel: ConfigPlantel
  resumen: ResumenSistema | null
  cargando: boolean
  guardando: boolean
  error: string | null
  guardarPlantel: (datos: ConfigPlantel) => Promise<boolean>
  descargarRespaldo: () => Promise<void>
}

export const useConfiguracion = (): EstadoConfiguracion => {
  const [plantel, setPlantel] = useState<ConfigPlantel>(CONFIG_PLANTEL_DEFECTO)
  const [resumen, setResumen] = useState<ResumenSistema | null>(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    setCargando(true)
    Promise.all([configuracionRepositorio.obtenerPlantel(), configuracionRepositorio.obtenerResumen()])
      .then(([p, r]) => {
        if (cancelado) return
        setPlantel(p)
        setResumen(r)
      })
      .catch((err) => {
        console.error('useConfiguracion: error al cargar', err)
        if (!cancelado) setError('No se pudo cargar la configuración del sistema.')
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  const guardarPlantel = useCallback(async (datos: ConfigPlantel): Promise<boolean> => {
    setGuardando(true)
    setError(null)
    try {
      await configuracionRepositorio.guardarPlantel(datos)
      setPlantel(datos)
      return true
    } catch (err) {
      console.error('useConfiguracion: error al guardar', err)
      setError('No se pudo guardar la configuración.')
      return false
    } finally {
      setGuardando(false)
    }
  }, [])

  const descargarRespaldo = useCallback(async () => {
    try {
      const respaldo = await configuracionRepositorio.generarRespaldo()
      const contenido = JSON.stringify(respaldo, null, 2)
      const blob = new Blob([contenido], { type: 'application/json;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const fecha = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `respaldo_sige_p50_${fecha}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('useConfiguracion: error al generar respaldo', err)
      setError('No se pudo generar el respaldo.')
    }
  }, [])

  return { plantel, resumen, cargando, guardando, error, guardarPlantel, descargarRespaldo }
}
