// Pagina publica de Solicitud de Registro de Docente - Interfaz
// PUBLICA (no requiere sesion) - un aspirante a docente llena sus
// datos y las materias que impartira, sin necesidad de cuenta.

import { FormEvent, useState } from 'react'
import { solicitudRepositorio } from '../../datos/docentes/SolicitudRepositorio'
import { MateriaSolicitud, materiaVacia } from '../../dominio/docentes/Solicitud'

export const SolicitarRegistroPagina = () => {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [especialidad, setEspecialidad] = useState('')
  const [materias, setMaterias] = useState<MateriaSolicitud[]>([materiaVacia()])
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const actualizarMateria = (i: number, campo: keyof MateriaSolicitud, valor: string | number) => {
    setMaterias((prev) => prev.map((m, idx) => (idx === i ? { ...m, [campo]: valor } : m)))
  }
  const agregarMateria = () => setMaterias((prev) => [...prev, materiaVacia()])
  const quitarMateria = (i: number) => setMaterias((prev) => prev.filter((_, idx) => idx !== i))

  const manejarSubmit = async (evento: FormEvent) => {
    evento.preventDefault()
    setError(null)

    if (!nombre.trim() || !email.trim()) {
      setError('Escribe al menos tu nombre y correo.')
      return
    }

    setEnviando(true)
    try {
      await solicitudRepositorio.enviarSolicitud({
        docente: {
          nombre: nombre.trim(),
          email: email.trim().toLowerCase(),
          telefono: telefono.trim() || undefined,
          especialidad: especialidad.trim() || undefined,
        },
        materias: materias.filter((m) => m.clave.trim() && m.nombre.trim()),
      })
      setEnviado(true)
    } catch (err) {
      console.error('SolicitarRegistroPagina: error al enviar', err)
      setError('No se pudo enviar la solicitud. Intenta de nuevo o contacta a la dirección del plantel.')
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return (
      <div className="login-pantalla">
        <div className="login-tarjeta" style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '2.5rem' }}>✅</span>
          <h1 className="login-titulo">Solicitud enviada</h1>
          <p className="login-subtitulo">
            La dirección del plantel revisará tu solicitud y te contactará para darte de alta con
            tu cuenta de acceso.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="login-pantalla">
      <div style={{ width: '100%', maxWidth: 640 }}>
        <div className="login-tarjeta" style={{ maxWidth: '100%', textAlign: 'left' }}>
          <h1 className="login-titulo" style={{ textAlign: 'center' }}>Solicitud de registro de docente</h1>
          <p className="login-subtitulo" style={{ textAlign: 'center' }}>
            Preparatoria No. 50 · UAGro. Completa tus datos; la dirección revisará tu solicitud.
          </p>

          <form onSubmit={manejarSubmit} style={{ marginTop: '1rem' }}>
            <label className="login-label">
              Nombre completo *
              <input className="login-input" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </label>
            <label className="login-label" style={{ marginTop: '0.75rem' }}>
              Correo *
              <input type="email" className="login-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <div className="filtros" style={{ marginTop: '0.75rem' }}>
              <label className="login-label" style={{ flex: 1 }}>
                Teléfono
                <input className="login-input" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
              </label>
              <label className="login-label" style={{ flex: 1 }}>
                Especialidad
                <input className="login-input" value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} />
              </label>
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <strong style={{ fontSize: '0.9rem' }}>Materias que impartirás</strong>
              {materias.map((m, i) => (
                <div key={i} className="filtros" style={{ marginTop: '0.5rem', alignItems: 'flex-end' }}>
                  <label className="login-label" style={{ minWidth: 100 }}>
                    {i === 0 && 'Clave'}
                    <input className="login-input" value={m.clave} onChange={(e) => actualizarMateria(i, 'clave', e.target.value)} placeholder="MAT-301" />
                  </label>
                  <label className="login-label" style={{ minWidth: 180, flex: 1 }}>
                    {i === 0 && 'Nombre de la materia'}
                    <input className="login-input" value={m.nombre} onChange={(e) => actualizarMateria(i, 'nombre', e.target.value)} placeholder="Matemáticas III" />
                  </label>
                  <label className="login-label" style={{ minWidth: 90 }}>
                    {i === 0 && 'Semestre'}
                    <input type="number" min={1} max={6} className="login-input" value={m.semestre} onChange={(e) => actualizarMateria(i, 'semestre', Number(e.target.value))} />
                  </label>
                  <label className="login-label" style={{ minWidth: 110 }}>
                    {i === 0 && 'Grupos'}
                    <input className="login-input" value={m.grupos} onChange={(e) => actualizarMateria(i, 'grupos', e.target.value)} placeholder="3A, 3B" />
                  </label>
                  <button type="button" className="btn btn-sm btn-outline" onClick={() => quitarMateria(i)} disabled={materias.length === 1}>
                    🗑️
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn-sm btn-outline" onClick={agregarMateria} style={{ marginTop: '0.5rem' }}>
                + Agregar materia
              </button>
            </div>

            {error && <div className="login-error" style={{ marginTop: '1rem' }}>{error}</div>}

            <button type="submit" className="login-boton" style={{ marginTop: '1.25rem' }} disabled={enviando}>
              {enviando ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
