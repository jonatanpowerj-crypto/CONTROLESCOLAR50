// Entidad Horario - Dominio

export const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] as const
export type Dia = (typeof DIAS)[number]

export interface Horario {
  id: string
  dia: Dia
  hi: string // hora inicio, formato "HH:MM"
  hf: string // hora fin, formato "HH:MM"
  materiaId: string
  grupoId: string
  aula: string
}

export interface HorarioCrear {
  dia: Dia
  hi: string
  hf: string
  materiaId: string
  grupoId: string
  aula: string
}

export const crearHorario = (datos: HorarioCrear, id: string): Horario => ({ id, ...datos })

// Dos intervalos [hi1,hf1) y [hi2,hf2) se traslapan si empiezan antes
// de que el otro termine. Funciona por comparacion de texto porque
// las horas vienen en formato "HH:MM" (24h, con cero a la izquierda).
const seTraslapan = (hi1: string, hf1: string, hi2: string, hf2: string): boolean =>
  hi1 < hf2 && hi2 < hf1

export interface ConflictoHorario {
  tipo: 'grupo' | 'docente' | 'aula'
  mensaje: string
}

interface ContextoConflicto {
  // id del docente responsable de cada materia, para poder cruzar
  // choques de docente aunque el horario en si no guarde docenteId.
  docentePorMateria: Record<string, string>
  nombreMateriaPorId: Record<string, string>
  nombreGrupoPorId: Record<string, string>
}

// Agrupa los horarios de un grupo por franja horaria (hi-hf) para
// renderizar la rejilla semanal: filas = franjas unicas ordenadas,
// columnas = dias. Funciona bien cuando las clases del plantel siguen
// bloques de horario consistentes entre dias (caso normal de un plantel).
export interface FranjaRejilla {
  etiqueta: string // "07:00 – 08:40"
  porDia: Partial<Record<Dia, Horario>>
}

export const construirRejillaSemanal = (horariosDelGrupo: Horario[]): FranjaRejilla[] => {
  const franjasMap = new Map<string, FranjaRejilla>()

  horariosDelGrupo.forEach((h) => {
    const clave = `${h.hi}-${h.hf}`
    if (!franjasMap.has(clave)) {
      franjasMap.set(clave, { etiqueta: `${h.hi} – ${h.hf}`, porDia: {} })
    }
    franjasMap.get(clave)!.porDia[h.dia] = h
  })

  return Array.from(franjasMap.values()).sort((a, b) => a.etiqueta.localeCompare(b.etiqueta))
}

export const detectarConflictos = (
  candidato: HorarioCrear,
  existentes: Horario[],
  contexto: ContextoConflicto,
  idAExcluir?: string
): ConflictoHorario[] => {
  const conflictos: ConflictoHorario[] = []
  const docenteCandidato = contexto.docentePorMateria[candidato.materiaId]

  for (const h of existentes) {
    if (idAExcluir && h.id === idAExcluir) continue
    if (h.dia !== candidato.dia) continue
    if (!seTraslapan(candidato.hi, candidato.hf, h.hi, h.hf)) continue

    if (h.grupoId === candidato.grupoId) {
      conflictos.push({
        tipo: 'grupo',
        mensaje: `El grupo "${contexto.nombreGrupoPorId[h.grupoId] ?? h.grupoId}" ya tiene "${contexto.nombreMateriaPorId[h.materiaId] ?? h.materiaId}" ese día y hora.`,
      })
    }

    const docenteExistente = contexto.docentePorMateria[h.materiaId]
    if (docenteCandidato && docenteExistente && docenteCandidato === docenteExistente && h.grupoId !== candidato.grupoId) {
      conflictos.push({
        tipo: 'docente',
        mensaje: `El docente ya tiene clase con el grupo "${contexto.nombreGrupoPorId[h.grupoId] ?? h.grupoId}" ese día y hora.`,
      })
    }

    if (h.aula === candidato.aula && h.grupoId !== candidato.grupoId) {
      conflictos.push({
        tipo: 'aula',
        mensaje: `El aula "${candidato.aula}" ya está ocupada por el grupo "${contexto.nombreGrupoPorId[h.grupoId] ?? h.grupoId}" ese día y hora.`,
      })
    }
  }

  return conflictos
}
