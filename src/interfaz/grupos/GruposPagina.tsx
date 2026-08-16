// Pagina de Grupos - Interfaz

import { FormEvent, useState } from 'react'
import { useGrupos } from '../../aplicacion/grupos/useGrupos'
import { Grupo } from '../../dominio/grupos/Grupo'

const TURNOS = ['Matutino', 'Vespertino']

export const GruposPagina = () => {
  const { grupos, cargando, error, crear, actualizar, eliminar } = useGrupos()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState<Grupo | null>(null)
  const [nombre, setNombre] = useState('')
  const [semestre, setSemestre] = useState(1)
  const [turno, setTurno] = useState(TURNOS[0])
  const [ciclo, setCiclo] = useState('')
  const [guardando, setGuardando] = useState(false)

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

  return (
    <div className="pagina">
      <header className="pagina-header">
        <h2>👥 Grupos</h2>
        <button type="button" className="btn btn-primary" onClick={abrirNuevo}>
          + Nuevo Grupo
        </button>
      </header>

      {error && <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>}

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
