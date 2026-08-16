// src/interfaz/router/router.tsx
import { Suspense, lazy, ComponentType } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { CARACTERISTICAS_ACTIVAS, Caracteristica } from './caracteristicas'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { RutaProtegida } from '../../aplicacion/auth/RutaProtegida'
import { LoginPagina } from '../../aplicacion/auth/LoginPagina'

const Cargando = () => (
  <div className="cargando">
    <span className="spinner"></span>
    <p>Cargando módulo...</p>
  </div>
)

// Tipo para componente lazy
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

// Fuerza un remount completo del arbol al cambiar de ruta, usando el
// pathname como key. Sin esto, React puede reutilizar la instancia
// montada de RutaProtegida/PaginaDinamica entre rutas hermanas que
// comparten la misma forma de arbol, dejando visible el contenido
// de la ruta anterior aunque la URL ya haya cambiado.
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
          <Route path="/" element={<Navigate to="/alumnos" replace />} />

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
