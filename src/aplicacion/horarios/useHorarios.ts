// Hook de Horarios - Capa de Aplicacion

import { useCallback, useEffect, useState } from 'react'
import { Horario, HorarioCrear, ConflictoHorario, detectarConflictos } from '../../dominio/horarios/Horario'
import { Materia } from '../../dominio/materias/Materia'
import { horarioRepositorio } from '../../datos/horarios/HorarioRepositorio'
import { materiaRepositorio } from '../../datos/materias/MateriaRepositorio'

interface Grupo {
  id: string
  nombre: string
}

export interface EstadoHorarios {
  horarios: Horario[]
  materias: Materia[]
  cargando: boolean
  error: string | null
  recargar: () => void
  // Devuelve la lista de conflictos SIN guardar - para mostrar
  // el aviso antes de que el usuario confirme.
  validar: (datos: HorarioCrear, idAExcluir?: string) => ConflictoHorario[]
  // Intenta guardar; si hay conflictos, no guarda y los devuelve.
  crear: (datos: HorarioCrear) => Promise<ConflictoHorario[]>
  eliminar: (id: string) => Promise<boolean>
  nombreMateria: (materiaId: string) => string
}

const generarId = (): string =>
  `h${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

export const useHorarios = (grupos: Grupo[]): EstadoHorarios => {
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [materias, setMaterias] = useState<Materia[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [listaHorarios, listaMaterias] = await Promise.all([
        horarioRepositorio.obtenerTodos(),
        materiaRepositorio.obtenerTodos(),
      ])
      setHorarios(listaHorarios)
      setMaterias(listaMaterias)
    } catch (err) {
      console.error('useHorarios: error al cargar', err)
      setError('No se pudieron cargar los horarios.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const construirContexto = useCallback(() => {
    const docentePorMateria: Record<string, string> = {}
    const nombreMateriaPorId: Record<string, string> = {}
    materias.forEach((m) => {
      docentePorMateria[m.id] = m.docenteId
      nombreMateriaPorId[m.id] = m.nombre
    })
    const nombreGrupoPorId: Record<string, string> = {}
    grupos.forEach((g) => {
      nombreGrupoPorId[g.id] = g.nombre
    })
    return { docentePorMateria, nombreMateriaPorId, nombreGrupoPorId }
  }, [materias, grupos])

  const validar = useCallback(
    (datos: HorarioCrear, idAExcluir?: string): ConflictoHorario[] => {
      return detectarConflictos(datos, horarios, construirContexto(), idAExcluir)
    },
    [horarios, construirContexto]
  )

  const crear = useCallback(
    async (datos: HorarioCrear): Promise<ConflictoHorario[]> => {
      const conflictos = validar(datos)
      if (conflictos.length > 0) return conflictos

      try {
        await horarioRepositorio.crearHorario(datos, generarId())
        await cargar()
        return []
      } catch (err) {
        console.error('useHorarios: error al crear', err)
        setError('No se pudo guardar el horario.')
        return []
      }
    },
    [validar, cargar]
  )

  const eliminar = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await horarioRepositorio.eliminar(id)
        await cargar()
        return true
      } catch (err) {
        console.error('useHorarios: error al eliminar', err)
        setError('No se pudo eliminar el horario.')
        return false
      }
    },
    [cargar]
  )

  const nombreMateria = useCallback(
    (materiaId: string): string => materias.find((m) => m.id === materiaId)?.nombre ?? materiaId,
    [materias]
  )

  return { horarios, materias, cargando, error, recargar: cargar, validar, crear, eliminar, nombreMateria }
}
