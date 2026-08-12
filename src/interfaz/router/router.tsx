import { Suspense, lazy, ComponentType } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CARACTERISTICAS_ACTIVAS, Caracteristica } from './caracteristicas'
import { ErrorBoundary } from '../components/ErrorBoundary'

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

interface RouterProps {
  caracteristicas?: Caracteristica[]
}

export const Router = ({ caracteristicas = CARACTERISTICAS_ACTIVAS }: RouterProps) => {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Navigate to="/alumnos" replace />} />
        
        {caracteristicas.map((carac) => (
          <Route
            key={carac.id}
            path={carac.ruta}
            element={<PaginaDinamica getComponente={carac.componente} />}
          />
        ))}
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export { CARACTERISTICAS, CARACTERISTICAS_ACTIVAS } from './caracteristicas'
export type { Caracteristica } from './caracteristicas'
