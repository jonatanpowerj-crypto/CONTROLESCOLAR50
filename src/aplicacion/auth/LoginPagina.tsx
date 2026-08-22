// src/aplicacion/auth/LoginPagina.tsx
import { FormEvent, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { obtenerAuth } from '../../datos/firebase/firebaseConfig'
import { useAuth } from './useAuth'

const mensajeError = (codigo: string): string => {
  switch (codigo) {
    case 'auth/invalid-email':
      return 'El correo no tiene un formato válido.'
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'Correo o contraseña incorrectos.'
    case 'auth/wrong-password':
      return 'Correo o contraseña incorrectos.'
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Espera unos minutos e intenta de nuevo.'
    default:
      return 'No se pudo iniciar sesión. Intenta de nuevo.'
  }
}

export const LoginPagina = () => {
  const { usuario, cargando: cargandoAuth } = useAuth()
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Si ya hay sesion activa (login exitoso, o el usuario ya estaba
  // logueado de antes), sacarlo de /login y mandarlo a la app.
  if (!cargandoAuth && usuario) {
    return <Navigate to="/panel" replace />
  }

  const manejarSubmit = async (evento: FormEvent) => {
    evento.preventDefault()
    setError(null)
    setCargando(true)

    try {
      const auth = obtenerAuth()
      await signInWithEmailAndPassword(auth, correo.trim(), contrasena)
      // La redireccion ocurre arriba, en el siguiente render, cuando
      // useAuth() detecte el nuevo estado de sesion.
    } catch (err: unknown) {
      const codigo = (err as { code?: string })?.code ?? ''
      setError(mensajeError(codigo))
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="login-pantalla">
      <div className="login-tarjeta">
        <div className="login-logo">P50</div>
        <h1 className="login-titulo">SIGE Prepa 50</h1>
        <p className="login-subtitulo">
          Preparatoria No. 50 · UAGro
          <br />
          Tlacoachistlahuaca, Gro.
        </p>

        <form onSubmit={manejarSubmit} className="login-form">
          <label className="login-label">
            Correo del docente
            <input
              type="email"
              className="login-input"
              placeholder="docente@uagro.mx"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="login-label">
            Contraseña
            <input
              type="password"
              className="login-input"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-boton" disabled={cargando}>
            {cargando ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <span style={{ color: 'var(--texto-tenue)', fontSize: '0.85rem' }}>— o —</span>
        </div>
        <Link
          to="/portal"
          className="btn btn-outline"
          style={{ marginTop: '0.75rem', display: 'block', textAlign: 'center' }}
        >
          🔎 Consultar como padre o alumno
        </Link>
      </div>
    </div>
  )
}
