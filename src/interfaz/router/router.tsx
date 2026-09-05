// src/interfaz/router/router.tsx
import { Suspense, lazy, ComponentType } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { CARACTERISTICAS_ACTIVAS, Caracteristica } from './caracteristicas'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { RutaProtegida } from '../../aplicacion/auth/RutaProtegida'
import { LoginPagina } from '../../aplicacion/auth/LoginPagina'
import { PortalPagina } from '../portal/PortalPagina'
import { SolicitarRegistroPagina } from '../docentes/SolicitarRegistroPagina'

const Cargando = () => (
  <div className="cargando">
    <span className="spinner"></span>
    <p>Cargando módulo...</p>
  </div>
)

type ComponenteLazy = () => Promise<{ default: ComponentType<unknown> }>

const PaginaDinamica = ({ getComponente }: { getComponente: ComponenteLazy }) => {
  const Componente = lazy(getComponente)
  return (
    <ErrorBoundary>
      <Suspense fallback={<Cargando />}>
        <Componente />
      </Suspense>
    </ErrorBoundary>
  )
}

const ContenidoConKey = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation()
  return <div key={location.pathname}>{children}</div>
}

interface RouterProps {
  caracteristicas?: Caracteristica[]
}

export const Router = ({ caracteristicas = CARACTERISTICAS_ACTIVAS }: RouterProps) => {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ContenidoConKey>
        <Routes>
          <Route path="/login" element={<LoginPagina />} />
          {/* Rutas publicas: sin RutaProtegida, no requieren sesion */}
          <Route path="/portal" element={<PortalPagina />} />
          <Route path="/solicitud-docente" element={<SolicitarRegistroPagina />} />
          <Route path="/" element={<Navigate to="/panel" replace />} />

          {caracteristicas.map((carac) => (
            <Route
              key={carac.id}
              path={carac.ruta}
              element={
                <RutaProtegida>
                  <PaginaDinamica getComponente={carac.componente} />
                </RutaProtegida>
              }
            />
          ))}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ContenidoConKey>
    </BrowserRouter>
  )
}

export { CARACTERISTICAS, CARACTERISTICAS_ACTIVAS } from './caracteristicas'
export type { Caracteristica } from './caracteristicas'
