// Pagina de Materias - Interfaz

import { FormEvent, useEffect, useState } from 'react'
import { FirebaseClient } from '../../datos/firebase/firebaseClient'
import { useMaterias } from '../../aplicacion/materias/useMaterias'
import { Materia, Rubro, sumaPesos, pesosValidos } from '../../dominio/materias/Materia'

interface Docente {
  id: string
  nombre?: string
  email?: string
}

const docenteRepositorio = new FirebaseClient<Docente>('docentes')

const rubroVacio = (): Rubro => ({ nombre: '', peso: 0 })

export const MateriasPagina = () => {
  const { materias, cargando, error, crear, actualizar, eliminar } = useMaterias()
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState<Materia | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState<string | null>(null)

  const [nombre, setNombre] = useState('')
  const [clave, setClave] = useState('')
  const [semestre, setSemestre] = useState(1)
  const [docenteId, setDocenteId] = useState('')
  const [rubros, setRubros] = useState<Rubro[]>([rubroVacio()])

  useEffect(() => {
    docenteRepositorio.obtenerTodos().then(setDocentes)
  }, [])

  const abrirNuevo = () => {
    setEditando(null)
    setNombre('')
    setClave('')
    setSemestre(1)
    setDocenteId(docentes[0]?.id ?? '')
    setRubros([rubroVacio()])
    setErrorForm(null)
    setMostrarForm(true)
  }

  const abrirEditar = (materia: Materia) => {
    setEditando(materia)
    setNombre(materia.nombre)
    setClave(materia.clave)
    setSemestre(materia.semestre)
    setDocenteId(materia.docenteId)
    setRubros(materia.rubros.length > 0 ? materia.rubros : [rubroVacio()])
    setErrorForm(null)
    setMostrarForm(true)
  }

  const actualizarRubro = (indice: number, campo: keyof Rubro, valor: string | number) => {
    setRubros((prev) =>
      prev.map((r, i) => (i === indice ? { ...r, [campo]: valor } : r))
    )
  }

  const agregarRubro = () => setRubros((prev) => [...prev, rubroVacio()])

  const quitarRubro = (indice: number) => {
    setRubros((prev) => prev.filter((_, i) => i !== indice))
  }

  const suma = sumaPesos(rubros)
  const sumaOk = pesosValidos(rubros)

  const manejarSubmit = async (evento: FormEvent) => {
    evento.preventDefault()
    setErrorForm(null)

    const rubrosLimpios = rubros
      .map((r) => ({ nombre: r.nombre.trim(), peso: Number(r.peso) }))
      .filter((r) => r.nombre.length > 0)

    if (rubrosLimpios.length === 0) {
      setErrorForm('Agrega al menos un rubro de evaluación.')
      return
    }
    if (!pesosValidos(rubrosLimpios)) {
      setErrorForm(`Los pesos deben sumar 100%. Actualmente suman ${sumaPesos(rubrosLimpios)}%.`)
      return
    }
    if (!docenteId) {
      setErrorForm('Selecciona un docente responsable.')
      return
    }

    setGuardando(true)
    const datos = {
      nombre: nombre.trim(),
      clave: clave.trim(),
      semestre,
      docenteId,
      rubros: rubrosLimpios,
    }

    const ok = editando ? await actualizar(editando.id, datos) : await crear(datos)
    setGuardando(false)
    if (ok) setMostrarForm(false)
  }

  const manejarEliminar = async (materia: Materia) => {
    if (!window.confirm(`¿Eliminar la materia "${materia.nombre}"? Esta acción no se puede deshacer.`)) {
      return
    }
    await eliminar(materia.id)
  }

  const nombreDocente = (id: string): string => {
    const d = docentes.find((doc) => doc.id === id)
    return d?.nombre || d?.email || '—'
  }

  return (
    <div className="pagina">
      <header className="pagina-header">
        <h2>📚 Materias</h2>
        <button type="button" className="btn btn-primary" onClick={abrirNuevo}>
          + Nueva Materia
        </button>
      </header>

      {error && <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {mostrarForm && (
        <form onSubmit={manejarSubmit} className="table-wrap" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
          <div className="filtros">
            <label className="login-label" style={{ minWidth: 200 }}>
              Nombre
              <input
                className="login-input"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Matemáticas III"
                required
              />
            </label>

            <label className="login-label" style={{ minWidth: 130 }}>
              Clave
              <input
                className="login-input"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                placeholder="Ej. MAT-301"
                required
              />
            </label>

            <label className="login-label" style={{ minWidth: 110 }}>
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

            <label className="login-label" style={{ minWidth: 200 }}>
              Docente responsable
              <select className="login-input" value={docenteId} onChange={(e) => setDocenteId(e.target.value)}>
                <option value="">Selecciona...</option>
                {docentes.map((d) => (
                  <option key={d.id} value={d.id}>{d.nombre || d.email}</option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <strong style={{ fontSize: '0.9rem' }}>Plan de evaluación (rubros)</strong>
              <span
                className="tag"
                style={{
                  background: sumaOk ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                  color: sumaOk ? '#86efac' : '#fca5a5',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 6,
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                Suma: {suma}% {sumaOk ? '✓' : '(debe ser 100%)'}
              </span>
            </div>

            {rubros.map((rubro, indice) => (
              <div key={indice} className="filtros" style={{ marginBottom: '0.5rem', alignItems: 'flex-end' }}>
                <label className="login-label" style={{ minWidth: 220, flex: 1 }}>
                  {indice === 0 && 'Nombre del rubro'}
                  <input
                    className="login-input"
                    value={rubro.nombre}
                    onChange={(e) => actualizarRubro(indice, 'nombre', e.target.value)}
                    placeholder="Ej. Examen parcial"
                  />
                </label>
                <label className="login-label" style={{ minWidth: 100 }}>
                  {indice === 0 && 'Peso (%)'}
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="login-input"
                    value={rubro.peso}
                    onChange={(e) => actualizarRubro(indice, 'peso', Number(e.target.value))}
                  />
                </label>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => quitarRubro(indice)}
                  disabled={rubros.length === 1}
                >
                  🗑️
                </button>
              </div>
            ))}

            <button type="button" className="btn btn-sm btn-outline" onClick={agregarRubro} style={{ marginTop: '0.4rem' }}>
              + Agregar rubro
            </button>
          </div>

          {errorForm && <div className="login-error" style={{ marginTop: '1rem' }}>{errorForm}</div>}

          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.25rem' }}>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear materia'}
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
          <p>Cargando materias...</p>
        </div>
      )}

      {!cargando && materias.length === 0 && (
        <div className="vacio">
          <span className="icono">📚</span>
          <p>No hay materias registradas todavía.</p>
        </div>
      )}

      {!cargando && materias.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Clave</th>
                <th>Nombre</th>
                <th>Semestre</th>
                <th>Docente</th>
                <th>Rubros</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {materias.map((materia) => (
                <tr key={materia.id}>
                  <td className="mono">{materia.clave}</td>
                  <td>{materia.nombre}</td>
                  <td className="numero">{materia.semestre}</td>
                  <td>{nombreDocente(materia.docenteId)}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--texto-tenue)' }}>
                    {materia.rubros.map((r) => `${r.nombre} (${r.peso}%)`).join(' · ')}
                  </td>
                  <td className="acciones">
                    <button className="btn btn-sm btn-outline" onClick={() => abrirEditar(materia)}>
                      ✏️
                    </button>
                    <button className="btn btn-sm btn-outline" onClick={() => manejarEliminar(materia)}>
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
