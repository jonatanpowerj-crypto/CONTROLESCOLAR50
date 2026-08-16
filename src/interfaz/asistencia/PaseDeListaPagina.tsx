// Pagina de Pase de Lista - Interfaz
// Soporta dos modos: manual (marcar botones por alumno) y QR
// (escanear credenciales, registro inmediato conforme llegan).

import { useEffect, useState } from 'react'
import { FirebaseClient } from '../../datos/firebase/firebaseClient'
import { useAuth } from '../../aplicacion/auth/useAuth'
import { useAsistencia } from '../../aplicacion/asistencia/useAsistencia'
import { nombreCompleto } from '../../dominio/alumnos/Alumno'
import { EstadoAsistencia, extraerMatriculaDeQR } from '../../dominio/asistencia/Asistencia'
import { EscanerQR } from './EscanerQR'

interface Grupo {
  id: string
  nombre: string
}

interface EscaneoReciente {
  id: string
  mensaje: string
  ok: boolean
  hora: string
}

const grupoRepositorio = new FirebaseClient<Grupo>('grupos')

const hoyISO = (): string => new Date().toISOString().slice(0, 10)

const ETIQUETAS: Record<EstadoAsistencia, string> = {
  presente: 'Presente',
  ausente: 'Ausente',
  retardo: 'Retardo',
}

const COLORES: Record<EstadoAsistencia, string> = {
  presente: '#22c55e',
  ausente: '#ef4444',
  retardo: '#eab308',
}

export const PaseDeListaPagina = () => {
  const { usuario } = useAuth()
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [grupoId, setGrupoId] = useState('')
  const [fecha, setFecha] = useState(hoyISO())
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [modo, setModo] = useState<'manual' | 'qr'>('manual')
  const [escaneos, setEscaneos] = useState<EscaneoReciente[]>([])

  const { alumnos, valores, cargando, guardando, error, marcarEstado, guardar, marcarPorQR } =
    useAsistencia(grupoId, fecha)

  useEffect(() => {
    grupoRepositorio.obtenerTodos().then((lista) => {
      setGrupos(lista)
      if (lista.length > 0 && !grupoId) {
        setGrupoId(lista[0].id)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const manejarGuardar = async () => {
    setMensajeExito(null)
    const ok = await guardar(usuario?.uid ?? 'desconocido')
    if (ok) {
      setMensajeExito('Asistencia guardada correctamente.')
      setTimeout(() => setMensajeExito(null), 3000)
    }
  }

  const manejarLecturaQR = async (textoDecodificado: string) => {
    const matricula = extraerMatriculaDeQR(textoDecodificado)

    if (!matricula) {
      agregarEscaneo('Código no reconocido (no es una credencial válida).', false)
      return
    }

    const resultado = await marcarPorQR(matricula, usuario?.uid ?? 'desconocido')
    const nombre = resultado.alumno ? nombreCompleto(resultado.alumno) : matricula
    agregarEscaneo(
      resultado.ok ? `✅ ${nombre} — asistencia registrada.` : `⚠️ ${resultado.mensaje}`,
      resultado.ok
    )
  }

  const agregarEscaneo = (mensaje: string, ok: boolean) => {
    const nuevo: EscaneoReciente = {
      id: `${Date.now()}-${Math.random()}`,
      mensaje,
      ok,
      hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    }
    setEscaneos((prev) => [nuevo, ...prev].slice(0, 8))
  }

  return (
    <div className="pagina">
      <header className="pagina-header">
        <h2>📋 Pase de Lista</h2>
        <div className="modo-toggle">
          <button
            type="button"
            className={`btn btn-sm ${modo === 'manual' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setModo('manual')}
          >
            ✍️ Manual
          </button>
          <button
            type="button"
            className={`btn btn-sm ${modo === 'qr' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setModo('qr')}
          >
            📷 Escáner QR
          </button>
        </div>
      </header>

      <div className="filtros">
        <label className="login-label" style={{ minWidth: 180 }}>
          Grupo
          <select
            className="login-input"
            value={grupoId}
            onChange={(e) => setGrupoId(e.target.value)}
          >
            {grupos.length === 0 && <option value="">Sin grupos disponibles</option>}
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="login-label" style={{ minWidth: 160 }}>
          Fecha
          <input
            type="date"
            className="login-input"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </label>
      </div>

      {!cargando && error && (
        <div className="login-error" style={{ marginBottom: '1.25rem' }}>
          <strong>Error al cargar:</strong> {error}
          <br />
          <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>
            Revisa la consola del navegador (F12) para más detalle técnico.
          </span>
        </div>
      )}

      {cargando && (
        <div className="vacio">
          <span className="icono">⏳</span>
          <p>Cargando alumnos...</p>
        </div>
      )}

      {!cargando && !error && grupoId && alumnos.length === 0 && (
        <div className="vacio">
          <span className="icono">🎓</span>
          <p>Este grupo no tiene alumnos registrados todavía.</p>
        </div>
      )}

      {/* ---------- Modo QR ---------- */}
      {!cargando && modo === 'qr' && alumnos.length > 0 && (
        <div className="qr-panel">
          <EscanerQR activo={modo === 'qr'} onLectura={manejarLecturaQR} />

          <div className="qr-escaneos">
            <h3>Últimos registros</h3>
            {escaneos.length === 0 && (
              <p className="vacio-texto">Todavía no se ha escaneado ninguna credencial.</p>
            )}
            <ul className="qr-lista">
              {escaneos.map((e) => (
                <li key={e.id} className={e.ok ? 'qr-item-ok' : 'qr-item-error'}>
                  <span className="qr-hora">{e.hora}</span> {e.mensaje}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ---------- Modo manual ---------- */}
      {!cargando && modo === 'manual' && alumnos.length > 0 && (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Matrícula</th>
                  <th>Nombre</th>
                  <th>Asistencia</th>
                </tr>
              </thead>
              <tbody>
                {alumnos.map((alumno) => (
                  <tr key={alumno.id}>
                    <td className="mono">{alumno.matricula}</td>
                    <td>{nombreCompleto(alumno)}</td>
                    <td>
                      <div className="asistencia-botones">
                        {(['presente', 'retardo', 'ausente'] as EstadoAsistencia[]).map(
                          (estado) => {
                            const activo = valores[alumno.id] === estado
                            return (
                              <button
                                key={estado}
                                type="button"
                                className="btn btn-sm asistencia-boton"
                                style={{
                                  background: activo ? COLORES[estado] : 'transparent',
                                  borderColor: COLORES[estado],
                                  color: activo ? '#1a1a1a' : COLORES[estado],
                                }}
                                onClick={() => marcarEstado(alumno.id, estado)}
                              >
                                {ETIQUETAS[estado]}
                              </button>
                            )
                          }
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {mensajeExito && (
            <p
              className="login-error"
              style={{ marginTop: '1rem', background: 'rgba(34,197,94,0.15)', color: '#86efac' }}
            >
              {mensajeExito}
            </p>
          )}

          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: '1.25rem' }}
            onClick={manejarGuardar}
            disabled={guardando}
          >
            {guardando ? 'Guardando...' : 'Guardar asistencia'}
          </button>
        </>
      )}
    </div>
  )
}
