// Pagina de Reportes - Interfaz

import { useEffect, useState } from 'react'
import { FirebaseClient } from '../../datos/firebase/firebaseClient'
import { materiaRepositorio } from '../../datos/materias/MateriaRepositorio'
import { useReportes } from '../../aplicacion/reportes/useReportes'
import { Materia } from '../../dominio/materias/Materia'

interface Grupo {
  id: string
  nombre: string
}
const grupoRepositorio = new FirebaseClient<Grupo>('grupos')

const hoyISO = (): string => new Date().toISOString().slice(0, 10)
const hace30DiasISO = (): string => {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
}

export const ReportesPagina = () => {
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [materias, setMaterias] = useState<Materia[]>([])

  const [grupoAsistencia, setGrupoAsistencia] = useState('')
  const [desde, setDesde] = useState(hace30DiasISO())
  const [hasta, setHasta] = useState(hoyISO())

  const [grupoCalificaciones, setGrupoCalificaciones] = useState('')
  const [materiaCalificaciones, setMateriaCalificaciones] = useState('')

  const { generando, error, descargarAsistenciaCSV, descargarCalificacionesCSV } = useReportes()

  useEffect(() => {
    grupoRepositorio.obtenerTodos().then((lista) => {
      setGrupos(lista)
      if (lista.length > 0) {
        setGrupoAsistencia(lista[0].id)
        setGrupoCalificaciones(lista[0].id)
      }
    })
    materiaRepositorio.obtenerTodos().then((lista) => {
      setMaterias(lista)
      if (lista.length > 0) setMateriaCalificaciones(lista[0].id)
    })
  }, [])

  const nombreDe = (id: string, lista: { id: string; nombre: string }[]): string =>
    lista.find((x) => x.id === id)?.nombre ?? id

  return (
    <div className="pagina">
      <header className="pagina-header">
        <h2>📈 Reportes</h2>
      </header>

      {error && <div className="login-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

      <div className="panel-columnas">
        {/* ---------- Reporte de asistencia ---------- */}
        <div className="table-wrap" style={{ padding: '1.25rem' }}>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '0.95rem' }}>📋 Reporte de asistencia (CSV)</h3>
          <p className="vacio-texto" style={{ marginBottom: '1rem' }}>
            Exporta el detalle de asistencias de un grupo en un rango de fechas, listo para Excel.
          </p>

          <div className="filtros">
            <label className="login-label" style={{ minWidth: 180 }}>
              Grupo
              <select className="login-input" value={grupoAsistencia} onChange={(e) => setGrupoAsistencia(e.target.value)}>
                {grupos.map((g) => (
                  <option key={g.id} value={g.id}>{g.nombre}</option>
                ))}
              </select>
            </label>
            <label className="login-label" style={{ minWidth: 140 }}>
              Desde
              <input type="date" className="login-input" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </label>
            <label className="login-label" style={{ minWidth: 140 }}>
              Hasta
              <input type="date" className="login-input" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </label>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
            disabled={generando || !grupoAsistencia}
            onClick={() => descargarAsistenciaCSV(grupoAsistencia, nombreDe(grupoAsistencia, grupos), desde, hasta)}
          >
            {generando ? 'Generando...' : '⬇ CSV de asistencia'}
          </button>
        </div>

        {/* ---------- Concentrado de calificaciones ---------- */}
        <div className="table-wrap" style={{ padding: '1.25rem' }}>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '0.95rem' }}>📊 Concentrado de calificaciones (CSV)</h3>
          <p className="vacio-texto" style={{ marginBottom: '1rem' }}>
            Promedios ponderados por alumno, con el desglose por rubro.
          </p>

          <div className="filtros">
            <label className="login-label" style={{ minWidth: 180 }}>
              Grupo
              <select className="login-input" value={grupoCalificaciones} onChange={(e) => setGrupoCalificaciones(e.target.value)}>
                {grupos.map((g) => (
                  <option key={g.id} value={g.id}>{g.nombre}</option>
                ))}
              </select>
            </label>
            <label className="login-label" style={{ minWidth: 220 }}>
              Materia
              <select className="login-input" value={materiaCalificaciones} onChange={(e) => setMateriaCalificaciones(e.target.value)}>
                {materias.map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre} ({m.clave})</option>
                ))}
              </select>
            </label>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
            disabled={generando || !grupoCalificaciones || !materiaCalificaciones}
            onClick={() =>
              descargarCalificacionesCSV(grupoCalificaciones, nombreDe(grupoCalificaciones, grupos), materiaCalificaciones)
            }
          >
            {generando ? 'Generando...' : '⬇ CSV de calificaciones'}
          </button>
        </div>
      </div>
    </div>
  )
}
