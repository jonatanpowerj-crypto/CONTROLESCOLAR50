// src/aplicacion/auth/RutaProtegida.tsx
import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './useAuth'
import { AppLayout } from '../../interfaz/layout/AppLayout'

interface RutaProtegidaProps {
  children: ReactNode
}

export const RutaProtegida = ({ children }: RutaProtegidaProps) => {
  const { usuario, rol, cargando, error } = useAuth()

  if (cargando) {
    return (
      <div className="auth-cargando">
        <p>Cargando sesión...</p>
      </div>
    )
  }

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  if (error) {
    return (
      <div className="auth-cargando">
        <p>{error}</p>
      </div>
    )
  }

  if (!rol) {
    return (
      <div className="auth-cargando">
        <p>
          Tu cuenta no tiene un rol asignado todavía. Contacta al
          administrador del sistema.
        </p>
      </div>
    )
  }

  return <AppLayout>{children}</AppLayout>
}