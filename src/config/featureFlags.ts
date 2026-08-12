// Feature Flags para controlar módulos React vs Legacy
// Cambiar a 'true' para activar módulos React, 'false' para usar legacy

export const FEATURE_FLAGS = {
  USE_NEW_ALUMNOS: import.meta.env.VITE_USE_NEW_ALUMNOS === 'true',
  USE_NEW_ASISTENCIA: import.meta.env.VITE_USE_NEW_ASISTENCIA === 'true',
  USE_NEW_CALIFICACIONES: import.meta.env.VITE_USE_NEW_CALIFICACIONES === 'true',
  USE_NEW_DOCENTES: import.meta.env.VITE_USE_NEW_DOCENTES === 'true',
  USE_NEW_MATERIAS: import.meta.env.VITE_USE_NEW_MATERIAS === 'true',
  USE_NEW_GRUPOS: import.meta.env.VITE_USE_NEW_GRUPOS === 'true',
  USE_NEW_HORARIOS: import.meta.env.VITE_USE_NEW_HORARIOS === 'true',
  USE_NEW_CONFIGURACION: import.meta.env.VITE_USE_NEW_CONFIGURACION === 'true',
} as const

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS

export const isFeatureEnabled = (flag: FeatureFlagKey): boolean => FEATURE_FLAGS[flag]
