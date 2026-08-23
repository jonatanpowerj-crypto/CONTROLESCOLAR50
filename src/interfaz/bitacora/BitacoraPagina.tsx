// Pagina de Bitacora y Planeacion - Interfaz

import { FormEvent, useEffect, useState } from 'react'
import { FirebaseClient } from '../../datos/firebase/firebaseClient'
import { materiaRepositorio } from '../../datos/materias/MateriaRepositorio'
import { useAuth } from '../../aplicacion/auth/useAuth'
import { useBitacora } from '../../aplicacion/bitacora/useBitacora'
import { CAMPOS_NEM, SesionBitacora } from '../../dominio/bitacora/Bitacora'
import { Materia } from '../../dominio/materias/Materia'

interface Grupo {
  id: string
  nombre: string
}
const grupoRepositorio = new FirebaseClient<Grupo>('grupos')

const hoyISO = (): string => new Date().toISOString().slice(0, 10)

const formatearFecha = (fecha: string): string =>
  new Date(`${fecha}T12:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })

export const BitacoraPagina = () => {
  const { usuario } = useAuth()
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [materias, setMaterias] = useState<Materia[]>([])
  const [materiaId, setMateriaId] = useState('')
  const [grupoId, setGrupoId] = useState('')

  const { sesiones, cargando, error, guardando, crear, actualizar, eliminar } = useBitacora(materiaId, grupoId)

  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState<SesionBitacora | null>(null)
  const [fecha, setFecha] = useState(hoyISO())
  const [campo, setCampo] = useState('')
  const [tema, setTema] = useState('')
  const [actividades, setActividades] = useState('')
  const [tarea, setTarea] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [errorForm, setErrorForm] = useState<string | null>(null)

  useEffect(() => {
    materiaRepositorio.obtenerTodos().then((lista) => {
      setMaterias(lista)
      if (lista.length > 0) setMateriaId(lista[0].id)
    })
    grupoRepositorio.obtenerTodos().then((lista) => {
      setGrupos(lista)
      if (lista.length > 0) setGrupoId(lista[0].id)
    })
  }, [])

  const abrirNueva = () => {
    setEditando(null)
    setFecha(hoyISO())
    setCampo('')
    setTema('')
    setActividades('')
    setTarea('')
    setObservaciones('')
    setErrorForm(null)
    setMostrarForm(true)
  }

  const abrirEditar = (sesion: SesionBitacora) => {
    setEditando(sesion)
    setFecha(sesion.fecha)
    setCampo(sesion.campo)
    setTema(sesion.tema)
    setActividades(sesion.actividades)
    setTarea(sesion.tarea)
    setObservaciones(sesion.observaciones)
    setErrorForm(null)
    setMostrarForm(true)
  }

  const manejarSubmit = async (evento: FormEvent) => {
    evento.preventDefault()
    setErrorForm(null)

    if (!tema.trim()) {
      setErrorForm('Escribe al menos el tema de la sesión.')
      return
    }

    const datos = {
      fecha,
      materiaId,
      grupoId,
      campo,
      tema: tema.trim(),
      actividades: actividades.trim(),
      tarea: tarea.trim(),
      observaciones: observaciones.trim(),
      registradoPor: usuario?.uid ?? 'desconocido',
    }

    const ok = editando ? await actualizar(editando.id, datos) : await crear(datos)
    if (ok) setMostrarForm(false)
  }

  const manejarEliminar = async (sesion: SesionBitacora) => {
    if (!window.confirm('¿Eliminar esta sesión de la bitácora?')) return
    await eliminar(sesion.id)
  }

  return (
    <div className="pagina">
      <header className="pagina-header">
        <h2>📓 Bitácora y planeación</h2>
      </header>
      <p className="vacio-texto" style={{ marginBottom: '1rem' }}>Registro de clase alineado a la NEM</p>

      <div className="filtros">
        <label className="login-label" style={{ minWidth: 220 }}>
          Materia
          <select className="login-input" value={materiaId} onChange={(e) => setMateriaId(e.target.value)}>
            {materias.map((m) => (
              <option key={m.id} value={m.id}>{m.clave} · {m.nombre}</option>
            ))}
          </select>
        </label>

        <label className="login-label" style={{ minWidth: 180 }}>
          Grupo
          <select className="login-input" value={grupoId} onChange={(e) => setGrupoId(e.target.value)}>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>{g.nombre}</option>
            ))}
          </select>
        </label>

        <button type="button" className="btn btn-primary" onClick={abrirNueva} style={{ alignSelf: 'flex-end' }}>
          + Registrar sesión
        </button>
      </div>

      {error && <div className="login-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {mostrarForm && (
        <form onSubmit={manejarSubmit} className="table-wrap" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
          <div className="filtros">
            <label className="login-label" style={{ minWidth: 160 }}>
              Fecha
              <input type="date" className="login-input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </label>
            <label className="login-label" style={{ minWidth: 260 }}>
              Campo formativo (NEM)
              <select className="login-input" value={campo} onChange={(e) => setCampo(e.target.value)}>
                <option value="">— Selecciona —</option>
                {CAMPOS_NEM.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="login-label" style={{ marginTop: '0.75rem' }}>
            Tema o contenido de la sesión *
            <input
              className="login-input"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              placeholder="Ej. Ecuaciones de primer grado"
            />
          </label>

          <label className="login-label" style={{ marginTop: '0.75rem' }}>
            Actividades realizadas
            <textarea
              className="login-input"
              rows={3}
              value={actividades}
              onChange={(e) => setActividades(e.target.value)}
              placeholder="Describe lo que se trabajó en clase"
            />
          </label>

          <label className="login-label" style={{ marginTop: '0.75rem' }}>
            Tarea o encargo
            <input
              className="login-input"
              value={tarea}
              onChange={(e) => setTarea(e.target.value)}
              placeholder="Opcional"
            />
          </label>

          <label className="login-label" style={{ marginTop: '0.75rem' }}>
            Observaciones
            <textarea
              className="login-input"
              rows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Incidencias, avances, acuerdos (opcional)"
            />
          </label>

          {errorForm && <div className="login-error" style={{ marginTop: '1rem' }}>{errorForm}</div>}

          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.25rem' }}>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar sesión'}
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
          <p>Cargando sesiones...</p>
        </div>
      )}

      {!cargando && sesiones.length === 0 && (
        <div className="vacio">
          <span className="icono">📓</span>
          <p>Aún no hay sesiones registradas para esta materia y grupo. Usa «Registrar sesión» para documentar tu clase.</p>
        </div>
      )}

      {!cargando &&
        sesiones.map((s) => (
          <div key={s.id} className="table-wrap" style={{ padding: '1.1rem', marginBottom: '0.8rem', borderLeft: '4px solid var(--dorado)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ marginBottom: '0.2rem', fontSize: '1rem' }}>{s.tema || 'Sesión sin tema'}</h3>
                <p className="mono" style={{ color: 'var(--texto-tenue)', fontSize: '0.8rem', textTransform: 'capitalize' }}>
                  {formatearFecha(s.fecha)}
                </p>
                {s.campo && (
                  <span className="tag" style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd', padding: '0.15rem 0.5rem', borderRadius: 6, fontSize: '0.75rem' }}>
                    {s.campo}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button className="btn btn-sm btn-outline" onClick={() => abrirEditar(s)}>Editar</button>
                <button className="btn btn-sm btn-outline" onClick={() => manejarEliminar(s)}>Eliminar</button>
              </div>
            </div>
            {s.actividades && <p style={{ marginTop: '0.5rem', fontSize: '0.88rem' }}><strong>Actividades:</strong> {s.actividades}</p>}
            {s.tarea && <p style={{ marginTop: '0.3rem', fontSize: '0.88rem' }}><strong>Tarea / encargo:</strong> {s.tarea}</p>}
            {s.observaciones && (
              <p style={{ marginTop: '0.3rem', fontSize: '0.85rem', color: 'var(--texto-tenue)' }}>
                <strong>Observaciones:</strong> {s.observaciones}
              </p>
            )}
          </div>
        ))}
    </div>
  )
}
