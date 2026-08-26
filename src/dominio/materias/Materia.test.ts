import { describe, it, expect } from 'vitest'
import { sumaPesos, pesosValidos, Rubro } from './Materia'

describe('sumaPesos / pesosValidos', () => {
  it('suma correctamente los pesos de varios rubros', () => {
    const rubros: Rubro[] = [{ nombre: 'A', peso: 40 }, { nombre: 'B', peso: 60 }]
    expect(sumaPesos(rubros)).toBe(100)
  })

  it('considera validos los rubros que suman exactamente 100', () => {
    const rubros: Rubro[] = [{ nombre: 'A', peso: 50 }, { nombre: 'B', peso: 50 }]
    expect(pesosValidos(rubros)).toBe(true)
  })

  it('rechaza rubros que no suman 100', () => {
    const rubros: Rubro[] = [{ nombre: 'A', peso: 50 }, { nombre: 'B', peso: 40 }]
    expect(pesosValidos(rubros)).toBe(false)
  })

  it('rechaza una lista vacia de rubros', () => {
    expect(pesosValidos([])).toBe(false)
  })

  it('tolera pequenos errores de punto flotante (99.99999...)', () => {
    const rubros: Rubro[] = [{ nombre: 'A', peso: 33.33 }, { nombre: 'B', peso: 33.33 }, { nombre: 'C', peso: 33.34 }]
    expect(pesosValidos(rubros)).toBe(true)
  })
})
