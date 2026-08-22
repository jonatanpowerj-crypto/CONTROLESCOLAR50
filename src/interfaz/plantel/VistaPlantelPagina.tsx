// Pagina Vista General del Plantel - Interfaz

import { useEffect, useMemo, useState } from 'react'
import { FirebaseClient } from '../../datos/firebase/firebaseClient'
import { horarioRepositorio } from '../../datos/horarios/HorarioRepositorio'
import { materiaRepositorio } from '../../datos/materias/MateriaRepositorio'
import { docenteRepositorio } from '../../datos/docentes/DocenteRepositorio'
import { Grupo } from '../../dominio/grupos/Grupo'
import { Horario, DIAS, construirRejillaSemanal } from '../../dominio/horarios/Horario'
import { Materia } from '../../dominio/materias/Materia'

const grupoRepositorio = new FirebaseClient<Grupo>('grupos')

export const VistaPlantelPagina = () => {
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [materias, setMaterias] = useState<Materia[]>([])
  const [docentes, setDocentes] = useState<{ id: string; nombre: string }[]>([])
  const [cargando, setCargando] = useState(true)

  const [ciclo, setCiclo] = useState('')
  const [semestre, setSemestre] = useState('')
  const [docenteId, setDocenteId] = useState('')

  useEffect(() => {
    Promise.all([
      grupoRepositorio.obtenerTodos(),
      horarioRepositorio.obtenerTodos(),
      materiaRepositorio.obtenerTodos(),
      docenteRepositorio.obtenerTodos(),
    ]).then(([g, h, m, d]) => {
      setGrupos(g)
      setHorarios(h)
      setMaterias(m)
      setDocentes(d)
      setCargando(false)

      const ciclos = [...new Set(g.map((x) => x.ciclo).filter(Boolean))] as string[]
      if (ciclos.length > 0) setCiclo(ciclos[0])
    })
  }, [])

  const ciclosDisponibles = useMemo(
    () => [...new Set(grupos.map((g) => g.ciclo).filter(Boolean))] as string[],
    [grupos]
  )

  const mapaMaterias = useMemo(() => new Map(materias.map((m) => [m.id, m])), [materias])

  const gruposFiltrados = useMemo(() => {
    return grupos
      .filter((g) => !ciclo || g.ciclo === ciclo || (!g.ciclo && ciclosDisponibles.length === 0))
      .filter((g) => !semestre || g.semestre === Number(semestre))
      .sort((a, b) => a.semestre - b.semestre || a.nombre.localeCompare(b.nombre))
  }, [grupos, ciclo, semestre, ciclosDisponibles])

  const exportarPDF = () => window.print()

  return (
    <div className="pagina">
      <header className="pagina-header no-imprimir">
        <h2>🏫 Vista General del Plantel</h2>
        <button type="button" className="btn btn-outline btn-sm" onClick={exportarPDF} disabled={gruposFiltrados.length === 0}>
          🖨️ Exportar PDF
        </button>
      </header>

      <div className="filtros no-imprimir">
        <label className="login-label" style={{ minWidth: 140 }}>
          Ciclo
          <select className="login-input" value={ciclo} onChange={(e) => setCiclo(e.target.value)}>
            {ciclosDisponibles.length === 0 && <option value="">Sin ciclo</option>}
            {ciclosDisponibles.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        <label className="login-label" style={{ minWidth: 160 }}>
          Semestre
          <select className="login-input" value={semestre} onChange={(e) => setSemestre(e.target.value)}>
            <option value="">Todos</option>
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <option key={s} value={s}>{s}° semestre</option>
            ))}
          </select>
        </label>

        <label className="login-label" style={{ minWidth: 220 }}>
          Docente
          <select className="login-input" value={docenteId} onChange={(e) => setDocenteId(e.target.value)}>
            <option value="">Todos</option>
            {docentes.map((d) => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </select>
        </label>
      </div>

      {cargando && (
        <div className="vacio">
          <span className="icono">⏳</span>
          <p>Cargando plantel...</p>
        </div>
      )}

      {!cargando && gruposFiltrados.length === 0 && (
        <div className="vacio">
          <span className="icono">🗓️</span>
          <p>No hay grupos registrados para este filtro.</p>
        </div>
      )}

      {!cargando &&
        gruposFiltrados.map((grupo) => {
          let clasesDelGrupo = horarios.filter((h) => h.grupoId === grupo.id)
          if (docenteId) {
            clasesDelGrupo = clasesDelGrupo.filter(
              (h) => mapaMaterias.get(h.materiaId)?.docenteId === docenteId
            )
          }
          const rejilla = construirRejillaSemanal(clasesDelGrupo)

          return (
            <div key={grupo.id} className="table-wrap" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                {grupo.nombre}{' '}
                <span style={{ color: 'var(--texto-tenue)', fontWeight: 400, fontSize: '0.82rem' }}>
                  · {grupo.semestre}° sem. · {grupo.turno} · Ciclo {grupo.ciclo || ciclo || '—'} · {clasesDelGrupo.length} clase(s)
                </span>
              </h3>

              {rejilla.length === 0 ? (
                <p className="vacio-texto">Sin horario registrado.</p>
              ) : (
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
                          const materiaDoc = h ? mapaMaterias.get(h.materiaId) : null
                          return (
                            <td key={d}>
                              {h ? (
                                <div className="rejilla-celda">
                                  <strong>{materiaDoc?.nombre ?? '—'}</strong>
                                  <span>{h.aula}</span>
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
              )}
            </div>
          )
        })}
    </div>
  )
}
