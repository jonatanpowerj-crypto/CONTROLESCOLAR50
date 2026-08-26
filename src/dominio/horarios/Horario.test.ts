import { describe, it, expect } from 'vitest'
import { detectarConflictos, HorarioCrear, Horario } from './Horario'

const contexto = {
  docentePorMateria: { mat1: 'doc1', mat2: 'doc2' },
  nombreMateriaPorId: { mat1: 'Matemáticas', mat2: 'Biología' },
  nombreGrupoPorId: { g1: '3° A', g2: '1° B' },
}

const horarioBase: Horario = {
  id: 'h1',
  dia: 'Lunes',
  hi: '08:40',
  hf: '10:20',
  materiaId: 'mat1',
  grupoId: 'g1',
  aula: 'Aula 4',
}

describe('detectarConflictos', () => {
  it('no reporta conflicto si el dia es distinto', () => {
    const candidato: HorarioCrear = { ...horarioBase, dia: 'Martes' }
    expect(detectarConflictos(candidato, [horarioBase], contexto)).toHaveLength(0)
  })

  it('no reporta conflicto si el horario no se traslapa (termina justo cuando empieza el otro)', () => {
    const candidato: HorarioCrear = { ...horarioBase, hi: '10:20', hf: '12:00', grupoId: 'g1' }
    expect(detectarConflictos(candidato, [horarioBase], contexto)).toHaveLength(0)
  })

  it('detecta choque de grupo cuando el mismo grupo ya tiene clase esa hora', () => {
    const candidato: HorarioCrear = { ...horarioBase, materiaId: 'mat2', hi: '09:00', hf: '09:40' }
    const conflictos = detectarConflictos(candidato, [horarioBase], contexto)
    expect(conflictos.some((c) => c.tipo === 'grupo')).toBe(true)
  })

  it('detecta choque de docente cuando el mismo docente da clase a otro grupo esa hora', () => {
    const candidato: HorarioCrear = { ...horarioBase, grupoId: 'g2', hi: '09:00', hf: '09:40' }
    const conflictos = detectarConflictos(candidato, [horarioBase], contexto)
    expect(conflictos.some((c) => c.tipo === 'docente')).toBe(true)
  })

  it('detecta choque de aula cuando otro grupo ya usa la misma aula esa hora', () => {
    const candidato: HorarioCrear = { ...horarioBase, grupoId: 'g2', materiaId: 'mat2', hi: '09:00', hf: '09:40' }
    const conflictos = detectarConflictos(candidato, [horarioBase], contexto)
    expect(conflictos.some((c) => c.tipo === 'aula')).toBe(true)
  })

  it('ignora el propio horario al editar (idAExcluir)', () => {
    const candidato: HorarioCrear = { ...horarioBase }
    const conflictos = detectarConflictos(candidato, [horarioBase], contexto, horarioBase.id)
    expect(conflictos).toHaveLength(0)
  })
})
