// Pagina de Estadisticas - Interfaz

import { useEffect, useState } from 'react'
import { FirebaseClient } from '../../datos/firebase/firebaseClient'
import { materiaRepositorio } from '../../datos/materias/MateriaRepositorio'
import { useEstadisticas } from '../../aplicacion/estadisticas/useEstadisticas'
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

export const EstadisticasPagina = () => {
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [materias, setMaterias] = useState<Materia[]>([])
  const [grupoId, setGrupoId] = useState('')
  const [materiaId, setMateriaId] = useState('') // '' = todas las materias del grupo
  const [desde, setDesde] = useState(hace30DiasISO())
  const [hasta, setHasta] = useState(hoyISO())

  const { cargando, error, totalAlumnos, asistenciaPeriodo, aprobacion, promedioGeneral, conteoPorEstado, tendencia } =
    useEstadisticas(grupoId, materiaId, desde, hasta)

  useEffect(() => {
    grupoRepositorio.obtenerTodos().then((lista) => {
      setGrupos(lista)
      if (lista.length > 0) setGrupoId(lista[0].id)
    })
    materiaRepositorio.obtenerTodos().then(setMaterias)
  }, [])

  const totalEstados = conteoPorEstado.presente + conteoPorEstado.ausente + conteoPorEstado.retardo

  return (
    <div className="pagina">
      <header className="pagina-header">
        <h2>📊 Estadísticas</h2>
      </header>

      <div className="filtros">
        <label className="login-label" style={{ minWidth: 180 }}>
          Grupo
          <select className="login-input" value={grupoId} onChange={(e) => setGrupoId(e.target.value)}>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>{g.nombre}</option>
            ))}
          </select>
        </label>

        <label className="login-label" style={{ minWidth: 200 }}>
          Materia
          <select className="login-input" value={materiaId} onChange={(e) => setMateriaId(e.target.value)}>
            <option value="">Todas las del grupo</option>
            {materias.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        </label>

        <label className="login-label" style={{ minWidth: 140 }}>
          Asistencia desde
          <input type="date" className="login-input" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </label>

        <label className="login-label" style={{ minWidth: 140 }}>
          Hasta
          <input type="date" className="login-input" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </label>
      </div>

      {error && <div className="login-error" style={{ margin: '1rem 0' }}>{error}</div>}

      {cargando ? (
        <div className="vacio">
          <span className="icono">⏳</span>
          <p>Calculando...</p>
        </div>
      ) : (
        <>
          {/* ---------- Tarjetas de resumen ---------- */}
          <div className="panel-stats">
            <div className="stat-card">
              <div className="stat-valor" style={{ color: 'var(--dorado)' }}>{totalAlumnos}</div>
              <div className="stat-etiqueta">Alumnos en el grupo</div>
            </div>
            <div className="stat-card">
              <div className="stat-valor">{asistenciaPeriodo !== null ? `${asistenciaPeriodo}%` : '—'}</div>
              <div className="stat-etiqueta">Asistencia del periodo</div>
            </div>
            <div className="stat-card">
              <div className="stat-valor" style={{ color: '#22c55e' }}>{aprobacion !== null ? `${aprobacion}%` : '—'}</div>
              <div className="stat-etiqueta">Aprobación (≥6.0)</div>
            </div>
            <div className="stat-card">
              <div className="stat-valor" style={{ color: '#3b82f6' }}>{promedioGeneral !== null ? promedioGeneral.toFixed(1) : '—'}</div>
              <div className="stat-etiqueta">Promedio general capturado</div>
            </div>
          </div>

          <div className="panel-columnas">
            {/* ---------- Asistencia por estado (barras horizontales) ---------- */}
            <div className="table-wrap" style={{ padding: '1.25rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>📋 Asistencia por estado</h3>
              {totalEstados === 0 ? (
                <p className="vacio-texto">Sin registros de asistencia en este periodo.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    { etiqueta: 'Presente', valor: conteoPorEstado.presente, color: '#22c55e' },
                    { etiqueta: 'Retardo', valor: conteoPorEstado.retardo, color: '#eab308' },
                    { etiqueta: 'Ausente', valor: conteoPorEstado.ausente, color: '#ef4444' },
                  ].map((item) => {
                    const porcentaje = Math.round((item.valor / totalEstados) * 100)
                    return (
                      <div key={item.etiqueta}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                          <span>{item.etiqueta}</span>
                          <span>{item.valor} ({porcentaje}%)</span>
                        </div>
                        <div style={{ background: 'var(--azul-marino)', borderRadius: 6, height: 10, overflow: 'hidden' }}>
                          <div style={{ width: `${porcentaje}%`, background: item.color, height: '100%' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ---------- Tendencia de asistencia por dia ---------- */}
            <div className="table-wrap" style={{ padding: '1.25rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>📈 Tendencia de asistencia (% por día)</h3>
              {tendencia.length === 0 ? (
                <p className="vacio-texto">Sin datos suficientes para graficar.</p>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: 160, overflowX: 'auto', paddingTop: '1rem' }}>
                  {tendencia.map((punto) => (
                    <div key={punto.fecha} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 36 }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--texto-tenue)', marginBottom: '0.25rem' }}>{punto.porcentaje}%</span>
                      <div
                        style={{
                          width: 20,
                          height: `${Math.max(punto.porcentaje, 4)}px`,
                          background: punto.porcentaje >= 80 ? '#22c55e' : punto.porcentaje >= 60 ? '#eab308' : '#ef4444',
                          borderRadius: '4px 4px 0 0',
                        }}
                      />
                      <span style={{ fontSize: '0.65rem', color: 'var(--texto-tenue)', marginTop: '0.3rem', writingMode: 'vertical-rl' }}>
                        {punto.fecha.slice(5)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
