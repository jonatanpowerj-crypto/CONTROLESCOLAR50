// Pagina del Panel del Dia - Interfaz

import { Link } from 'react-router-dom'
import { usePanelDia } from '../../aplicacion/panel/usePanelDia'
import { nombreCompleto } from '../../dominio/alumnos/Alumno'

export const PanelDelDiaPagina = () => {
  const { totalAlumnos, clasesHoy, asistenciasHoy, faltasHoy, alumnosEnRiesgo, diaHoy, cargando, error } =
    usePanelDia()

  return (
    <div className="pagina">
      <header className="pagina-header">
        <h2>🏠 Panel del día</h2>
      </header>

      {error && <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {cargando ? (
        <div className="vacio">
          <span className="icono">⏳</span>
          <p>Cargando panel...</p>
        </div>
      ) : (
        <>
          {/* ---------- Tarjetas de conteo ---------- */}
          <div className="panel-stats">
            <div className="stat-card">
              <div className="stat-valor" style={{ color: 'var(--dorado)' }}>{totalAlumnos}</div>
              <div className="stat-etiqueta">Alumnos inscritos</div>
            </div>
            <div className="stat-card">
              <div className="stat-valor">{clasesHoy.length}</div>
              <div className="stat-etiqueta">Clases hoy{diaHoy ? ` (${diaHoy})` : ''}</div>
            </div>
            <div className="stat-card">
              <div className="stat-valor" style={{ color: '#eab308' }}>{asistenciasHoy}</div>
              <div className="stat-etiqueta">Asistencias hoy</div>
            </div>
            <div className="stat-card">
              <div className="stat-valor" style={{ color: '#ef4444' }}>{faltasHoy}</div>
              <div className="stat-etiqueta">Faltas hoy</div>
            </div>
          </div>

          {/* ---------- Clases de hoy + Riesgo ---------- */}
          <div className="panel-columnas">
            <div className="table-wrap" style={{ padding: '1.25rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>📅 Clases programadas hoy</h3>
              {!diaHoy && <p className="vacio-texto">Hoy es fin de semana, no hay clases registradas.</p>}
              {diaHoy && clasesHoy.length === 0 && (
                <p className="vacio-texto">No hay clases registradas para hoy.</p>
              )}
              {clasesHoy.length > 0 && (
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {clasesHoy.map((c, i) => (
                    <li
                      key={i}
                      style={{
                        background: 'var(--azul-marino-mas-claro)',
                        borderRadius: 8,
                        padding: '0.6rem 0.8rem',
                        fontSize: '0.88rem',
                      }}
                    >
                      <strong className="mono">{c.horario.hi}–{c.horario.hf}</strong> · {c.materiaNombre}
                      <br />
                      <span style={{ color: 'var(--texto-tenue)' }}>{c.grupoNombre}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/asistencia" className="btn btn-primary btn-sm" style={{ marginTop: '1rem', display: 'inline-block' }}>
                Iniciar pase de lista →
              </Link>
            </div>

            <div className="table-wrap" style={{ padding: '1.25rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>⚠️ Alumnos con asistencia baja (&lt;80%)</h3>
              {alumnosEnRiesgo.length === 0 && (
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <span style={{ fontSize: '2rem' }}>✅</span>
                  <p className="vacio-texto" style={{ marginTop: '0.5rem' }}>Sin alumnos en riesgo por inasistencia.</p>
                </div>
              )}
              {alumnosEnRiesgo.length > 0 && (
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {alumnosEnRiesgo.map((r) => (
                    <li
                      key={r.alumno.id}
                      style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}
                    >
                      <span>{nombreCompleto(r.alumno)}</span>
                      <strong style={{ color: '#fca5a5' }}>{r.porcentaje}%</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ---------- Accesos rapidos ---------- */}
          <div className="table-wrap" style={{ padding: '1.25rem', marginTop: '1.25rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>📌 Accesos rápidos</h3>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <Link to="/credenciales" className="btn btn-primary">🪪 Imprimir credenciales QR</Link>
              <Link to="/calificaciones" className="btn btn-outline">🧮 Capturar calificaciones</Link>
              <Link to="/asistencia" className="btn btn-outline">📋 Pase de lista</Link>
              <button className="btn btn-outline" disabled title="Disponible en una próxima fase">
                📈 Exportar reportes
              </button>
              <button className="btn btn-outline" disabled title="Disponible en una próxima fase">
                📊 Ver estadísticas
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
