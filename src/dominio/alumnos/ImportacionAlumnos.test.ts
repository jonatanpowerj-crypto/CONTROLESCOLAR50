import { describe, it, expect } from 'vitest'
import { detectaCampo, mapearEncabezados, parsearFilas } from './ImportacionAlumnos'
import { Alumno } from './Alumno'

describe('detectaCampo', () => {
  it('reconoce variantes con acentos y mayusculas', () => {
    expect(detectaCampo('Matrícula')).toBe('matricula')
    expect(detectaCampo('MATRICULA')).toBe('matricula')
  })

  it('reconoce alias de tutor', () => {
    expect(detectaCampo('Padre/Tutor')).toBe('tutor')
  })

  it('devuelve null para encabezados no reconocidos', () => {
    expect(detectaCampo('columna_rara')).toBeNull()
  })
})

describe('mapearEncabezados', () => {
  it('mapea multiples encabezados de archivo a campos internos', () => {
    const mapa = mapearEncabezados(['matricula', 'nombre', 'apellidos', 'correo'])
    expect(mapa).toEqual({ matricula: 'matricula', nombre: 'nombre', apellidos: 'apellidos', email: 'correo' })
  })
})

describe('parsearFilas', () => {
  const mapa = { matricula: 'matricula', nombre: 'nombre', apellidos: 'apellidos' }
  const alumnoExistente: Alumno = {
    id: 'x1',
    matricula: 'A1001',
    nombre: 'Valeria',
    apellidos: 'Hernández',
    grupoId: 'g1',
    tutor: '',
    telTutor: '',
    email: '',
  }

  it('marca como nuevo un alumno con datos completos y matricula no repetida', () => {
    const filas = [{ matricula: 'A9999', nombre: 'Ana', apellidos: 'López' }]
    const resultado = parsearFilas(filas, mapa, 'g1', [alumnoExistente])
    expect(resultado[0].estado).toBe('nuevo')
  })

  it('marca como duplicado si la matricula ya existe en el sistema', () => {
    const filas = [{ matricula: 'A1001', nombre: 'Valeria', apellidos: 'Hernández' }]
    const resultado = parsearFilas(filas, mapa, 'g1', [alumnoExistente])
    expect(resultado[0].estado).toBe('duplicado')
  })

  it('marca como duplicado si la matricula se repite dentro del mismo archivo', () => {
    const filas = [
      { matricula: 'A5000', nombre: 'Ana', apellidos: 'López' },
      { matricula: 'A5000', nombre: 'Otra', apellidos: 'Persona' },
    ]
    const resultado = parsearFilas(filas, mapa, 'g1', [])
    expect(resultado[0].estado).toBe('nuevo')
    expect(resultado[1].estado).toBe('duplicado')
  })

  it('marca como incompleto si falta un campo obligatorio', () => {
    const filas = [{ matricula: 'A5001', nombre: '', apellidos: 'López' }]
    const resultado = parsearFilas(filas, mapa, 'g1', [])
    expect(resultado[0].estado).toBe('incompleto')
  })
})
