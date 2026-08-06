// Hooks de React para Alumnos - Capa de Aplicación

import { useState, useEffect, useCallback } from 'react'
import { Alumno, AlumnoCrear, AlumnoActualizar } from '../../dominio/alumnos/Alumno'
import { alumnoServicio } from './AlumnoServicio'

export const useAlumnos = () => {
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    try {
      setCargando(true)
      setError(null)
      const datos = await alumnoServicio.obtenerTodos()
      setAlumnos(datos)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar alumnos')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const crear = async (datos: AlumnoCrear): Promise<Alumno> => {
    const nuevo = await alumnoServicio.crear(datos)
    setAlumnos((prev) => [...prev, nuevo])
    return nuevo
  }

  const actualizar = async (id: string, datos: AlumnoActualizar): Promise<void> => {
    await alumnoServicio.actualizar(id, datos)
    setAlumnos((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...datos } : a))
    )
  }

  const eliminar = async (id: string): Promise<void> => {
    await alumnoServicio.eliminar(id)
    setAlumnos((prev) => prev.filter((a) => a.id !== id))
  }

  return {
    alumnos,
    cargando,
    error,
    recargar: cargar,
    crear,
    actualizar,
    eliminar,
  }
}

export const useAlumnosPorGrupo = (grupoId: string) => {
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!grupoId) {
      setAlumnos([])
      setCargando(false)
      return
    }

    setCargando(true)
    alumnoServicio.obtenerPorGrupo(grupoId)
      .then(setAlumnos)
      .finally(() => setCargando(false))
  }, [grupoId])

  return { alumnos, cargando }
}
