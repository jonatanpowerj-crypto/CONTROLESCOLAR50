// Pagina de Horarios - Interfaz

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { FirebaseClient } from '../../datos/firebase/firebaseClient'
import { useHorarios } from '../../aplicacion/horarios/useHorarios'
import {
  DIAS,
  Dia,
  HorarioCrear,
  ConflictoHorario,
  construirRejillaSemanal,
} from '../../dominio/horarios/Horario'

interface Grupo {
  id: string
  nombre: string
}

const grupoRepositorio = new FirebaseClient<Grupo>('grupos')

type Vista = 'lista' | 'rejilla'

export const HorariosPagina = () => {
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [grupoFiltro, setGrupoFiltro] = useState('')
  const [vista, setVista] = useState<Vista>('rejilla')

  const { horarios, materias, cargando, error, validar, crear, eliminar, nombreMateria } =
    useHorarios(grupos)

  const [mostrarForm, setMostrarForm] = useState(false)
  const [dia, setDia] = useState<Dia>('Lunes')
  const [hi, setHi] = useState('07:00')
  const [hf, setHf] = useState('07:40')
  const [materiaId, setMateriaId] = useState('')
  const [grupoId, setGrupoId] = useState('')
  const [aula, setAula] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [conflictosVista, setConflictosVista] = useState<ConflictoHorario[]>([])

  useEffect(() => {
    grupoRepositorio.obtenerTodos().then((lista) => {
      setGrupos(lista)
      if (lista.length > 0 && !grupoFiltro) setGrupoFiltro(lista[0].id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const abrirNuevo = () => {
    setDia('Lunes')
    setHi('07:00')
    setHf('07:40')
    setMateriaId(materias[0]?.id ?? '')
    setGrupoId(grupoFiltro || grupos[0]?.id || '')
    setAula('')
    setConflictosVista([])
    setMostrarForm(true)
  }

  const candidato = useMemo<HorarioCrear>(
    () => ({ dia, hi, hf, materiaId, grupoId, aula: aula.trim() }),
    [dia, hi, hf, materiaId, grupoId, aula]
  )

  useEffect(() => {
    if (!mostrarForm || !materiaId || !grupoId) {
      setConflictosVista([])
      return
    }
    setConflictosVista(validar(candidato))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidato, mostrarForm])

  const manejarSubmit = async (evento: FormEvent) => {
    evento.preventDefault()
    if (hi >= hf) {
      setConflictosVista([{ tipo: 'grupo', mensaje: 'La hora de inicio debe ser antes que la hora de fin.' }])
      return
    }

    setGuardando(true)
    const conflictos = await crear(candidato)
    setGuardando(false)

    if (conflictos.length > 0) {
      setConflictosVista(conflictos)
      return
    }
    setMostrarForm(false)
  }

  const manejarEliminar = async (id: string) => {
    if (!window.confirm('¿Eliminar este horario? Esta acción no se puede deshacer.')) return
    await eliminar(id)
  }

  const exportarPDF = () => window.print()

  const horariosDelGrupo = horarios
    .filter((h) => !grupoFiltro || h.grupoId === grupoFiltro)
    .sort((a, b) => (a.dia === b.dia ? a.hi.localeCompare(b.hi) : DIAS.indexOf(a.dia) - DIAS.indexOf(b.dia)))

  const rejilla = useMemo(
    () => construirRejillaSemanal(horarios.filter((h) => h.grupoId === grupoFiltro)),
    [horarios, grupoFiltro]
  )

  const nombreGrupoActual = grupos.find((g) => g.id === grupoFiltro)?.nombre ?? ''

  return (
    <div className="pagina">
      <header className="pagina-header no-imprimir">
        <h2>🗓️ Horarios</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className={`btn btn-sm ${vista === 'rejilla' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setVista('rejilla')}
          >
            📅 Rejilla semanal
          </button>
          <button
            type="button"
            className={`btn btn-sm ${vista === 'lista' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setVista('lista')}
          >
            📋 Lista
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={exportarPDF} disabled={!grupoFiltro}>
            🖨️ Exportar PDF
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={abrirNuevo}>
            + Nuevo Horario
          </button>
        </div>
      </header>

      <div className="filtros no-imprimir">
        <label className="login-label" style={{ minWidth: 200 }}>
          Grupo
          <select className="login-input" value={grupoFiltro} onChange={(e) => setGrupoFiltro(e.target.value)}>
            <option value="">Todos los grupos</option>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>{g.nombre}</option>
            ))}
          </select>
        </label>
      </div>

      {error && <div className="login-error no-imprimir" style={{ marginBottom: '1rem' }}>{error}</div>}

      {mostrarForm && (
        <form onSubmit={manejarSubmit} className="table-wrap no-imprimir" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
          <div className="filtros">
            <label className="login-label" style={{ minWidth: 130 }}>
              Día
              <select className="login-input" value={dia} onChange={(e) => setDia(e.target.value as Dia)}>
                {DIAS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </label>

            <label className="login-label" style={{ minWidth: 110 }}>
              Hora inicio
              <input type="time" className="login-input" value={hi} onChange={(e) => setHi(e.target.value)} />
            </label>

            <label className="login-label" style={{ minWidth: 110 }}>
              Hora fin
              <input type="time" className="login-input" value={hf} onChange={(e) => setHf(e.target.value)} />
            </label>

            <label className="login-label" style={{ minWidth: 220 }}>
              Materia
              <select className="login-input" value={materiaId} onChange={(e) => setMateriaId(e.target.value)}>
                <option value="">Selecciona...</option>
                {materias.map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre} ({m.clave})</option>
                ))}
              </select>
            </label>

            <label className="login-label" style={{ minWidth: 180 }}>
              Grupo
              <select className="login-input" value={grupoId} onChange={(e) => setGrupoId(e.target.value)}>
                <option value="">Selecciona...</option>
                {grupos.map((g) => (
                  <option key={g.id} value={g.id}>{g.nombre}</option>
                ))}
              </select>
            </label>

            <label className="login-label" style={{ minWidth: 140 }}>
              Aula
              <input
                className="login-input"
                value={aula}
                onChange={(e) => setAula(e.target.value)}
                placeholder="Ej. Aula 4"
              />
            </label>
          </div>

          {conflictosVista.length > 0 && (
            <div className="login-error" style={{ marginTop: '1rem' }}>
              <strong>⚠️ Conflicto de horario:</strong>
              <ul style={{ marginTop: '0.4rem', paddingLeft: '1.2rem' }}>
                {conflictosVista.map((c, i) => (
                  <li key={i}>{c.mensaje}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.25rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={guardando || conflictosVista.length > 0 || !materiaId || !grupoId || !aula.trim()}
            >
              {guardando ? 'Guardando...' : 'Crear horario'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setMostrarForm(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {cargando && (
        <div className="vacio">
          <span className="icono">⏳</span>
          <p>Cargando horarios...</p>
        </div>
      )}

      {/* ---------- Vista de rejilla semanal ---------- */}
      {!cargando && vista === 'rejilla' && (
        <div id="horario-imprimir">
          <h3 className="solo-imprimir" style={{ marginBottom: '0.75rem' }}>
            Horario semanal — {nombreGrupoActual || 'Todos los grupos'}
          </h3>

          {!grupoFiltro && (
            <div className="vacio no-imprimir">
              <span className="icono">🗓️</span>
              <p>Selecciona un grupo para ver su rejilla semanal.</p>
            </div>
          )}

          {grupoFiltro && rejilla.length === 0 && (
            <div className="vacio">
              <span className="icono">🗓️</span>
              <p>Este grupo no tiene horario registrado todavía.</p>
            </div>
          )}

          {grupoFiltro && rejilla.length > 0 && (
            <div className="table-wrap">
              <table className="rejilla-semanal">
                <thead>
                  <tr>
                    <th>Hora</th>
                    {DIAS.map((d) => (
                      <th key={d}>{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rejilla.map((franja) => (
                    <tr key={franja.etiqueta}>
                      <td className="mono">{franja.etiqueta}</td>
                      {DIAS.map((d) => {
                        const h = franja.porDia[d]
                        return (
                          <td key={d}>
                            {h ? (
                              <div className="rejilla-celda">
                                <strong>{nombreMateria(h.materiaId)}</strong>
                                <span>{h.aula}</span>
                                <button
                                  className="btn btn-sm btn-outline no-imprimir"
                                  style={{ marginTop: '0.3rem' }}
                                  onClick={() => manejarEliminar(h.id)}
                                >
                                  🗑️
                                </button>
                              </div>
                            ) : (
                              '—'
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---------- Vista de lista (la original) ---------- */}
      {!cargando && vista === 'lista' && (
        <>
          {horariosDelGrupo.length === 0 && (
            <div className="vacio">
              <span className="icono">🗓️</span>
              <p>No hay horarios registrados para este filtro.</p>
            </div>
          )}

          {horariosDelGrupo.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Día</th>
                    <th>Hora</th>
                    <th>Materia</th>
                    {!grupoFiltro && <th>Grupo</th>}
                    <th>Aula</th>
                    <th className="no-imprimir">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {horariosDelGrupo.map((h) => (
                    <tr key={h.id}>
                      <td>{h.dia}</td>
                      <td className="mono">{h.hi} – {h.hf}</td>
                      <td>{nombreMateria(h.materiaId)}</td>
                      {!grupoFiltro && <td>{grupos.find((g) => g.id === h.grupoId)?.nombre ?? h.grupoId}</td>}
                      <td>{h.aula}</td>
                      <td className="acciones no-imprimir">
                        <button className="btn btn-sm btn-outline" onClick={() => manejarEliminar(h.id)}>
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
