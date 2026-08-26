import { describe, it, expect } from 'vitest'
import { siguienteCiclo, sugerirNombreSiguienteGrupo, puedePromover } from './Grupo'

describe('siguienteCiclo', () => {
  it('pasa de ciclo A a B del mismo anio', () => {
    expect(siguienteCiclo('2026-A')).toBe('2026-B')
  })

  it('pasa de ciclo B al ciclo A del siguiente anio', () => {
    expect(siguienteCiclo('2026-B')).toBe('2027-A')
  })

  it('devuelve un ciclo valido aunque el formato de entrada sea invalido', () => {
    const resultado = siguienteCiclo('sin-formato')
    expect(resultado).toMatch(/^\d{4}-[AB]$/)
  })
})

describe('sugerirNombreSiguienteGrupo', () => {
  it('reemplaza el numero de semestre en el nombre del grupo', () => {
    expect(sugerirNombreSiguienteGrupo('3° "A"', 4)).toBe('4° "A"')
  })

  it('funciona con nombres sin comillas', () => {
    expect(sugerirNombreSiguienteGrupo('1 A', 2)).toBe('2° A')
  })
})

describe('puedePromover', () => {
  it('permite promover semestres menores a 6', () => {
    expect(puedePromover(5)).toBe(true)
  })

  it('no permite promover el semestre 6 (ultimo)', () => {
    expect(puedePromover(6)).toBe(false)
  })
})
