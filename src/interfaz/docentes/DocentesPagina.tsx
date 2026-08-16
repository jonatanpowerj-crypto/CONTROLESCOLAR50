// Pagina de Docentes - Interfaz

import { FormEvent, useState } from 'react'
import { useDocentes, DocenteConAcceso } from '../../aplicacion/docentes/useDocentes'
import { Docente } from '../../dominio/docentes/Docente'

export const DocentesPagina = () => {
  const { docentes, cargando, error, crear, actualizar, eliminar } = useDocentes()
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState<Docente | null>(null)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [especialidad, setEspecialidad] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [comandoCopiado, setComandoCopiado] = useState<string | null>(null)

  const abrirNuevo = () => {
    setEditando(null)
    setNombre('')
    setEmail('')
    setTelefono('')
    setEspecialidad('')
    setMostrarForm(true)
  }

  const abrirEditar = (docente: Docente) => {
    setEditando(docente)
    setNombre(docente.nombre)
    setEmail(docente.email)
    setTelefono(docente.telefono ?? '')
    setEspecialidad(docente.especialidad ?? '')
    setMostrarForm(true)
  }

  const manejarSubmit = async (evento: FormEvent) => {
    evento.preventDefault()
    setGuardando(true)

    const datos = {
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      telefono: telefono.trim() || undefined,
      especialidad: especialidad.trim() || undefined,
    }

    const ok = editando ? await actualizar(editando.id, datos) : await crear(datos)
    setGuardando(false)
    if (ok) setMostrarForm(false)
  }

  const manejarEliminar = async (docente: Docente) => {
    if (!window.confirm(`¿Eliminar a "${docente.nombre}"? Esta acción no se puede deshacer.`)) {
      return
    }
    await eliminar(docente.id)
  }

  const copiarComando = (docente: Docente) => {
    const comando = `node migracion\\crear-docente.cjs ${docente.email} "${docente.nombre}"`
    navigator.clipboard?.writeText(comando).catch(() => {})
    setComandoCopiado(docente.id)
    setTimeout(() => setComandoCopiado(null), 2500)
  }

  const conCuenta = docentes.filter((d) => d.tieneCuenta).length
  const sinCuenta = docentes.length - conCuenta

  return (
    <div className="pagina">
      <header className="pagina-header">
        <h2>🧑‍🏫 Docentes</h2>
        <button type="button" className="btn btn-primary" onClick={abrirNuevo}>
          + Nuevo Docente
        </button>
      </header>

      {!cargando && docentes.length > 0 && (
        <p className="vacio-texto" style={{ marginBottom: '1rem' }}>
          {conCuenta} de {docentes.length} docentes tienen cuenta de acceso vinculada
          {sinCuenta > 0 && (
            <span style={{ color: '#fca5a5' }}> — {sinCuenta} pendiente{sinCuenta !== 1 ? 's' : ''}</span>
          )}
          .
        </p>
      )}

      {error && <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {mostrarForm && (
        <form onSubmit={manejarSubmit} className="table-wrap" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
          <div className="filtros">
            <label className="login-label" style={{ minWidth: 220 }}>
              Nombre completo
              <input
                className="login-input"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Mtra. Alejandra Bello Cisneros"
                required
              />
            </label>

            <label className="login-label" style={{ minWidth: 200 }}>
              Correo institucional
              <input
                type="email"
                className="login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="docente@uagro.mx"
                required
              />
            </label>

            <label className="login-label" style={{ minWidth: 160 }}>
              Teléfono
              <input
                className="login-input"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="744-000-0000"
              />
            </label>

            <label className="login-label" style={{ minWidth: 180 }}>
              Especialidad
              <input
                className="login-input"
                value={especialidad}
                onChange={(e) => setEspecialidad(e.target.value)}
                placeholder="Ej. Matemáticas"
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear docente'}
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
          <p>Cargando docentes...</p>
        </div>
      )}

      {!cargando && docentes.length === 0 && (
        <div className="vacio">
          <span className="icono">🧑‍🏫</span>
          <p>No hay docentes registrados todavía.</p>
        </div>
      )}

      {!cargando && docentes.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Especialidad</th>
                <th>Teléfono</th>
                <th>Acceso al sistema</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {docentes.map((docente: DocenteConAcceso) => (
                <tr key={docente.id}>
                  <td>{docente.nombre}</td>
                  <td>{docente.email}</td>
                  <td>{docente.especialidad || '-'}</td>
                  <td>{docente.telefono || '-'}</td>
                  <td>
                    {docente.tieneCuenta ? (
                      <span
                        className="tag"
                        style={{ background: 'rgba(34,197,94,0.15)', color: '#86efac', padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.8rem' }}
                      >
                        ✓ Vinculado
                      </span>
                    ) : (
                      <div>
                        <span
                          className="tag"
                          style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.8rem' }}
                        >
                          ⚠️ Sin cuenta
                        </span>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}
                          onClick={() => copiarComando(docente)}
                          title="Copiar comando para crear su cuenta de acceso"
                        >
                          {comandoCopiado === docente.id ? '✓ Copiado' : '📋 Copiar comando'}
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="acciones">
                    <button className="btn btn-sm btn-outline" onClick={() => abrirEditar(docente)}>
                      ✏️
                    </button>
                    <button className="btn btn-sm btn-outline" onClick={() => manejarEliminar(docente)}>
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
