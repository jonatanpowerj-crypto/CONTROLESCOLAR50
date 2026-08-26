import { describe, it, expect } from 'vitest'
import { calcularPromedio, Calificacion } from './Calificacion'
import { Rubro } from '../materias/Materia'

const rubros: Rubro[] = [
  { nombre: 'Examen parcial', peso: 40 },
  { nombre: 'Tareas', peso: 25 },
  { nombre: 'Participación', peso: 15 },
  { nombre: 'Proyecto', peso: 20 },
]

const calif = (rubro: string, valor: number): Calificacion => ({
  id: '',
  alumnoId: 'a1',
  materiaId: 'm1',
  rubro,
  valor,
  registradoPor: '',
  registradoEn: '',
})

describe('calcularPromedio', () => {
  it('devuelve null si no hay calificaciones', () => {
    expect(calcularPromedio([], rubros)).toBeNull()
  })

  it('calcula el promedio ponderado completo en escala 0-10', () => {
    const calificaciones = [
      calif('Examen parcial', 8),
      calif('Tareas', 10),
      calif('Participación', 6),
      calif('Proyecto', 9),
    ]
    // 8*.40 + 10*.25 + 6*.15 + 9*.20 = 3.2+2.5+0.9+1.8 = 8.4 (ya en escala 0-10,
    // NO se multiplica por 100 al consumirlo en otras partes del sistema)
    expect(calcularPromedio(calificaciones, rubros)).toBeCloseTo(8.4, 1)
  })

  it('extrapola el promedio cuando solo hay rubros parciales capturados', () => {
    // Solo el rubro de Examen (40% de peso) capturado con la nota maxima (10)
    const calificaciones = [calif('Examen parcial', 10)]
    // suma=10*0.40=4, pesoCapturado=40 -> (4/40)*100 = 10 (extrapola: "si
    // mantiene 10 en todo, terminaria con 10 de promedio")
    expect(calcularPromedio(calificaciones, rubros)).toBeCloseTo(10, 1)
  })

  it('ignora rubros que no coinciden con los definidos en la materia', () => {
    const calificaciones = [calif('Rubro inexistente', 10)]
    expect(calcularPromedio(calificaciones, rubros)).toBeNull()
  })
})
