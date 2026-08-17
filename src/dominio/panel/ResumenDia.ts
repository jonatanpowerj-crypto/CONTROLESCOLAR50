// Helpers de fecha para el Panel del dia - Dominio

import { Dia } from '../horarios/Horario'

// Mapea Date.getDay() (0=domingo...6=sabado) al nombre de dia en
// espanol usado en Horario. Sabado/domingo devuelven null (sin clases).
export const diaDeHoy = (): Dia | null => {
  const dias: (Dia | null)[] = [null, 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', null]
  return dias[new Date().getDay()]
}

export const fechaHoyISO = (): string => new Date().toISOString().slice(0, 10)

export const nombreDiaLegible = (): string => {
  const nombres = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  return nombres[new Date().getDay()]
}
