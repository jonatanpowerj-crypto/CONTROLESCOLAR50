// Pagina de Grupos - Interfaz

import { FormEvent, useState } from 'react'
import { useGrupos } from '../../aplicacion/grupos/useGrupos'
import { Grupo } from '../../dominio/grupos/Grupo'
import { siguienteCiclo, sugerirNombreSiguienteGrupo, puedePromover } from '../../dominio/grupos/Grupo'
import { alumnoRepositorio } from '../../datos/alumnos/AlumnoRepositorio'

const TURNOS = ['Matutino', 'Vespertino']

const generarIdGrupo = (): string =>
  `g${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

export const GruposPagina = () => {
  const { grupos, cargando, error, crear, actualizar, eliminar, promover } = useGrupos()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState<Grupo | null>(null)
  const [nombre, setNombre] = useState('')
  const [semestre, setSemestre] = useState(1)
  const [turno, setTurno] = useState(TURNOS[0])
  const [ciclo, setCiclo] = useState('')
  const [guardando, setGuardando] = useState(false)

  // ---------- Promover a siguiente ciclo ----------
  const [grupoAPromover, setGrupoAPromover] = useState<Grupo | null>(null)
  const [nombreNuevoGrupo, setNombreNuevoGrupo] = useState('')
  const [cantidadAlumnos, setCantidadAlumnos] = useState<number | null>(null)
  const [promoviendo, setPromoviendo] = useState(false)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)

  const abrirNuevo = () => {
    setEditando(null)
    setNombre('')
    setSemestre(1)
    setTurno(TURNOS[0])
    setCiclo('')
    setMostrarForm(true)
  }

  const abrirEditar = (grupo: Grupo) => {
    setEditando(grupo)
    setNombre(grupo.nombre)
    setSemestre(grupo.semestre)
    setTurno(grupo.turno)
    setCiclo(grupo.ciclo ?? '')
    setMostrarForm(true)
  }

  const manejarSubmit = async (evento: FormEvent) => {
    evento.preventDefault()
    setGuardando(true)

    const datos = {
      nombre: nombre.trim(),
      semestre,
      turno,
      ciclo: ciclo.trim() || undefined,
    }

    const ok = editando ? await actualizar(editando.id, datos) : await crear(datos)

    setGuardando(false)
    if (ok) setMostrarForm(false)
  }

  const manejarEliminar = async (grupo: Grupo) => {
    if (!window.confirm(`¿Eliminar el grupo "${grupo.nombre}"? Esta acción no se puede deshacer.`)) {
      return
    }
    await eliminar(grupo.id)
  }

  // ---------- Flujo de promocion ----------
  const abrirPromover = (grupo: Grupo) => {
    setGrupoAPromover(grupo)
    setNombreNuevoGrupo(sugerirNombreSiguienteGrupo(grupo.nombre, grupo.semestre + 1))
    setCantidadAlumnos(null)
    alumnoRepositorio.obtenerPorGrupo(grupo.id).then((lista) => setCantidadAlumnos(lista.length))
  }

  const cerrarPromover = () => {
    setGrupoAPromover(null)
    setCantidadAlumnos(null)
  }

  const confirmarPromover = async () => {
    if (!grupoAPromover || cantidadAlumnos === null) return
    if (!nombreNuevoGrupo.trim()) return

    setPromoviendo(true)
    const alumnosDelGrupo = await alumnoRepositorio.obtenerPorGrupo(grupoAPromover.id)
    const sigCiclo = siguienteCiclo(grupoAPromover.ciclo)
    const sigSem = grupoAPromover.semestre + 1

    const nuevoGrupo: Grupo = {
      id: generarIdGrupo(),
      nombre: nombreNuevoGrupo.trim(),
      semestre: sigSem,
      turno: grupoAPromover.turno,
      ciclo: sigCiclo,
      grupoAnteriorId: grupoAPromover.id,
    }

    const ok = await promover(
      nuevoGrupo,
      alumnosDelGrupo.map((a) => a.id)
    )

    setPromoviendo(false)
    if (ok) {
      setMensajeExito(
        `Grupo promovido: ${alumnosDelGrupo.length} alumno(s) ahora en "${nuevoGrupo.nombre}" (${sigSem}° sem., ${sigCiclo}). El grupo anterior se conservó con su historial.`
      )
      cerrarPromover()
      setTimeout(() => setMensajeExito(null), 6000)
    }
  }

  return (
    <div className="pagina">
      <header className="pagina-header">
        <h2>👥 Grupos</h2>
        <button type="button" className="btn btn-primary" onClick={abrirNuevo}>
          + Nuevo Grupo
        </button>
      </header>

      {error && <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>}
      {mensajeExito && (
        <div className="login-error" style={{ marginBottom: '1rem', background: 'rgba(34,197,94,0.15)', color: '#86efac' }}>
          {mensajeExito}
        </div>
      )}

      {mostrarForm && (
        <form onSubmit={manejarSubmit} className="table-wrap" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
          <div className="filtros">
            <label className="login-label" style={{ minWidth: 160 }}>
              Nombre
              <input
                className="login-input"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder='Ej. 3° "A"'
                required
              />
            </label>

            <label className="login-label" style={{ minWidth: 120 }}>
              Semestre
              <input
                type="number"
                min={1}
                max={6}
                className="login-input"
                value={semestre}
                onChange={(e) => setSemestre(Number(e.target.value))}
                required
              />
            </label>

            <label className="login-label" style={{ minWidth: 160 }}>
              Turno
              <select className="login-input" value={turno} onChange={(e) => setTurno(e.target.value)}>
                {TURNOS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>

            <label className="login-label" style={{ minWidth: 140 }}>
              Ciclo escolar
              <input
                className="login-input"
                value={ciclo}
                onChange={(e) => setCiclo(e.target.value)}
                placeholder="Ej. 2026-A"
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear grupo'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setMostrarForm(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* ---------- Modal de promocion (inline, no overlay para mantener consistencia con el resto) ---------- */}
      {grupoAPromover && (
        <div className="table-wrap" style={{ padding: '1.25rem', marginBottom: '1.25rem', border: '1px solid var(--dorado)' }}>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>⬆ Promover grupo al siguiente ciclo</h3>
          <p className="vacio-texto" style={{ marginBottom: '0.75rem' }}>
            El grupo <strong>{grupoAPromover.nombre}</strong> ({grupoAPromover.semestre}° semestre, ciclo{' '}
            {grupoAPromover.ciclo || '—'}) pasará a{' '}
            <strong>{grupoAPromover.semestre + 1}° semestre · Ciclo {siguienteCiclo(grupoAPromover.ciclo)}</strong>.
          </p>
          <p className="vacio-texto" style={{ marginBottom: '1rem' }}>
            Se creará un <strong>grupo nuevo</strong> con {cantidadAlumnos === null ? '...' : cantidadAlumnos} alumno(s)
            trasladados. El grupo actual <strong>se conserva intacto</strong> (no se borra) con todo su
            historial de asistencias y calificaciones, para consulta futura.
          </p>

          <label className="login-label" style={{ maxWidth: 320 }}>
            Nombre del nuevo grupo
            <input
              className="login-input"
              value={nombreNuevoGrupo}
              onChange={(e) => setNombreNuevoGrupo(e.target.value)}
            />
          </label>

          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={promoviendo || cantidadAlumnos === null || !nombreNuevoGrupo.trim()}
              onClick={confirmarPromover}
            >
              {promoviendo ? 'Promoviendo...' : 'Promover grupo'}
            </button>
            <button type="button" className="btn btn-outline" onClick={cerrarPromover}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {cargando && (
        <div className="vacio">
          <span className="icono">⏳</span>
          <p>Cargando grupos...</p>
        </div>
      )}

      {!cargando && grupos.length === 0 && (
        <div className="vacio">
          <span className="icono">👥</span>
          <p>No hay grupos registrados todavía.</p>
        </div>
      )}

      {!cargando && grupos.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Semestre</th>
                <th>Turno</th>
                <th>Ciclo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {grupos.map((grupo) => (
                <tr key={grupo.id}>
                  <td>{grupo.nombre}</td>
                  <td className="numero">{grupo.semestre}</td>
                  <td>{grupo.turno}</td>
                  <td>{grupo.ciclo || '-'}</td>
                  <td className="acciones">
                    {puedePromover(grupo.semestre) && (
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => abrirPromover(grupo)}
                        title="Promover a siguiente ciclo"
                      >
                        ⬆
                      </button>
                    )}
                    <button className="btn btn-sm btn-outline" onClick={() => abrirEditar(grupo)}>
                      ✏️
                    </button>
                    <button className="btn btn-sm btn-outline" onClick={() => manejarEliminar(grupo)}>
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
