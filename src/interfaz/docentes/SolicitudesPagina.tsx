// Pagina de Solicitudes en Linea - Interfaz (solo admin)

import { useSolicitudes } from '../../aplicacion/docentes/useSolicitudes'

export const SolicitudesPagina = () => {
  const { pendientes, cargando, procesando, error, incorporar, descartar } = useSolicitudes()

  const manejarIncorporar = async (id: string) => {
    const solicitud = pendientes.find((s) => s.id === id)
    if (!solicitud) return
    if (!window.confirm(`¿Incorporar a ${solicitud.docente.nombre} como docente, con ${solicitud.materias.length} materia(s)?`)) {
      return
    }
    await incorporar(solicitud)
  }

  const manejarDescartar = async (id: string) => {
    if (!window.confirm('¿Descartar esta solicitud? No se puede deshacer.')) return
    await descartar(id)
  }

  return (
    <div className="pagina">
      <header className="pagina-header">
        <h2>📥 Solicitudes en línea</h2>
      </header>
      <p className="vacio-texto" style={{ marginBottom: '1rem' }}>
        Bandeja de auto-registro de docentes. Comparte el link público{' '}
        <code className="mono">/solicitud-docente</code> con los aspirantes.
      </p>

      {error && <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {cargando && (
        <div className="vacio">
          <span className="icono">⏳</span>
          <p>Cargando solicitudes...</p>
        </div>
      )}

      {!cargando && pendientes.length === 0 && (
        <div className="vacio">
          <span className="icono">📥</span>
          <p>No hay solicitudes pendientes por revisar.</p>
        </div>
      )}

      {!cargando &&
        pendientes.map((s) => (
          <div key={s.id} className="table-wrap" style={{ padding: '1.1rem', marginBottom: '0.9rem', borderLeft: '4px solid var(--dorado)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.6rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.2rem' }}>{s.docente.nombre}</h3>
                <p style={{ color: 'var(--texto-tenue)', fontSize: '0.85rem' }}>
                  {s.docente.email} {s.docente.telefono && `· ${s.docente.telefono}`}
                  {s.docente.especialidad && ` · ${s.docente.especialidad}`}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button className="btn btn-sm btn-primary" onClick={() => manejarIncorporar(s.id)} disabled={procesando}>
                  ✓ Incorporar
                </button>
                <button className="btn btn-sm btn-outline" onClick={() => manejarDescartar(s.id)} disabled={procesando}>
                  Descartar
                </button>
              </div>
            </div>

            {s.materias.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <strong style={{ fontSize: '0.82rem', color: 'var(--texto-tenue)' }}>Materias solicitadas:</strong>
                <ul style={{ marginTop: '0.4rem', paddingLeft: '1.2rem', fontSize: '0.85rem' }}>
                  {s.materias.map((m, i) => (
                    <li key={i}>
                      {m.clave} · {m.nombre} · {m.semestre}° sem.{m.grupos ? ` · Grupos: ${m.grupos}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
    </div>
  )
}
