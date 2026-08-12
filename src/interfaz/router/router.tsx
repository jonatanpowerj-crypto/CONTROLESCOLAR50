/* eslint-disable @typescript-eslint/no-explicit-any */
import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CARACTERISTICAS_ACTIVAS, Caracteristica } from './caracteristicas'

const Cargando = () => (
  <div className="cargando">
    <span className="spinner"></span>
    <p>Cargando módulo...</p>
  </div>
)

const PaginaDinamica = ({ getComponente }: { getComponente: () => Promise<any> }) => {
  const Componente = lazy(getComponente)
  return (
    <Suspense fallback={<Cargando />}>
      <Componente />
    </Suspense>
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
