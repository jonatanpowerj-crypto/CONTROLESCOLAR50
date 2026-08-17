// Pagina de Credenciales QR - Interfaz

import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { FirebaseClient } from '../../datos/firebase/firebaseClient'
import { alumnoRepositorio } from '../../datos/alumnos/AlumnoRepositorio'
import { configuracionRepositorio } from '../../datos/configuracion/ConfiguracionRepositorio'
import { nombreCompleto, Alumno } from '../../dominio/alumnos/Alumno'
import { PREFIJO_CREDENCIAL } from '../../dominio/asistencia/Asistencia'

interface Grupo {
  id: string
  nombre: string
}
const grupoRepositorio = new FirebaseClient<Grupo>('grupos')

export const CredencialesPagina = () => {
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [grupoId, setGrupoId] = useState('')
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [ciclo, setCiclo] = useState('')
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    grupoRepositorio.obtenerTodos().then((lista) => {
      setGrupos(lista)
      if (lista.length > 0 && !grupoId) setGrupoId(lista[0].id)
    })
    configuracionRepositorio.obtenerPlantel().then((p) => setCiclo(p.ciclo))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!grupoId) {
      setAlumnos([])
      return
    }
    setCargando(true)
    alumnoRepositorio
      .obtenerPorGrupo(grupoId)
      .then(setAlumnos)
      .finally(() => setCargando(false))
  }, [grupoId])

  const imprimir = () => window.print()

  return (
    <div className="pagina">
      <header className="pagina-header no-imprimir">
        <h2>🪪 Credenciales QR</h2>
        <button className="btn btn-primary" onClick={imprimir} disabled={alumnos.length === 0}>
          🖨️ Imprimir credenciales
        </button>
      </header>

      <div className="filtros no-imprimir">
        <label className="login-label" style={{ minWidth: 200 }}>
          Grupo
          <select className="login-input" value={grupoId} onChange={(e) => setGrupoId(e.target.value)}>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>{g.nombre}</option>
            ))}
          </select>
        </label>
      </div>

      <p className="vacio-texto no-imprimir" style={{ marginBottom: '1.25rem' }}>
        Cada credencial lleva un QR con la matrícula del alumno (formato {PREFIJO_CREDENCIAL}MATRÍCULA).
        El docente la escanea desde «Asistencia → Escáner QR» para registrar asistencia al instante.
        El botón «Imprimir» abre el diálogo de impresión del navegador — desde ahí también puedes
        elegir «Guardar como PDF» si no vas a imprimir de inmediato.
      </p>

      {cargando && (
        <div className="vacio no-imprimir">
          <span className="icono">⏳</span>
          <p>Cargando alumnos...</p>
        </div>
      )}

      {!cargando && alumnos.length === 0 && (
        <div className="vacio no-imprimir">
          <span className="icono">🪪</span>
          <p>Este grupo no tiene alumnos registrados todavía.</p>
        </div>
      )}

      <div id="credenciales-imprimir" className="credenciales-grid">
        {alumnos.map((a) => (
          <div key={a.id} className="credencial-tarjeta">
            <div className="credencial-franja">
              <strong>PREPARATORIA No. 50 · UAGro</strong>
              <span>{ciclo}</span>
            </div>
            <div className="credencial-cuerpo">
              <QRCodeSVG value={`${PREFIJO_CREDENCIAL}${a.matricula}`} size={92} />
              <div>
                <div className="credencial-nombre">{nombreCompleto(a)}</div>
                <div className="credencial-matricula mono">{a.matricula}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
