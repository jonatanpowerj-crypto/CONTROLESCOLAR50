// Pagina del Portal de Alumnos y Padres - Interfaz
// IMPORTANTE: esta pagina es PUBLICA (no requiere sesion). Se apoya
// en que las reglas de Firestore ya permiten lectura publica de
// alumnos, asistencias, calificaciones, materias y horarios.
//
// NOTA (corregido): calcularPromedio() ya devuelve escala 0-10, NO
// 0-100. La version anterior dividia entre 10 de mas, mostrando el
// promedio por materia 10 veces menor al real (bug detectado por
// las pruebas automatizadas de Calificacion.test.ts).

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { FirebaseClient } from '../../datos/firebase/firebaseClient'
import { alumnoRepositorio } from '../../datos/alumnos/AlumnoRepositorio'
import { asistenciaRepositorio } from '../../datos/asistencia/AsistenciaRepositorio'
import { calificacionRepositorio } from '../../datos/calificaciones/CalificacionRepositorio'
import { materiaRepositorio } from '../../datos/materias/MateriaRepositorio'
import { horarioRepositorio } from '../../datos/horarios/HorarioRepositorio'
import { docenteRepositorio } from '../../datos/docentes/DocenteRepositorio'
import { Alumno, nombreCompleto } from '../../dominio/alumnos/Alumno'
import { Materia } from '../../dominio/materias/Materia'
import { calcularPromedio } from '../../dominio/calificaciones/Calificacion'
import { Horario, DIAS } from '../../dominio/horarios/Horario'
import { PREFIJO_CREDENCIAL } from '../../dominio/asistencia/Asistencia'

interface Grupo {
  id: string
  nombre: string
  turno: string
  semestre: number
}
const grupoRepositorio = new FirebaseClient<Grupo>('grupos')

interface FilaMateria {
  materia: Materia
  docenteNombre: string
  promedio: number | null
}

interface Resultado {
  alumno: Alumno
  grupo: Grupo | null
  asistenciaGlobal: number | null
  proximasClases: Horario[]
  filasMaterias: FilaMateria[]
}

export const PortalPagina = () => {
  const [matricula, setMatricula] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [noEncontrado, setNoEncontrado] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [mostrarQR, setMostrarQR] = useState(false)

  const consultar = async () => {
    const mat = matricula.trim().toUpperCase()
    if (!mat) return

    setBuscando(true)
    setNoEncontrado(false)
    setResultado(null)
    setMostrarQR(false)

    try {
      const alumno = await alumnoRepositorio.obtenerPorMatricula(mat)
      if (!alumno) {
        setNoEncontrado(true)
        return
      }

      const [grupos, horariosGrupo, asistencias, materiasTodas, docentes] = await Promise.all([
        grupoRepositorio.obtenerTodos(),
        horarioRepositorio.obtenerPorGrupo(alumno.grupoId),
        asistenciaRepositorio.obtenerPorAlumno(alumno.id),
        materiaRepositorio.obtenerTodos(),
        docenteRepositorio.obtenerTodos(),
      ])

      const grupo = grupos.find((g) => g.id === alumno.grupoId) ?? null

      const asistenciaGlobal =
        asistencias.length > 0
          ? Math.round((asistencias.filter((a) => a.estado !== 'ausente').length / asistencias.length) * 100)
          : null

      const proximasClases = horariosGrupo
        .slice()
        .sort((a, b) => (a.dia === b.dia ? a.hi.localeCompare(b.hi) : DIAS.indexOf(a.dia) - DIAS.indexOf(b.dia)))
        .slice(0, 4)

      const idsMateriasGrupo = [...new Set(horariosGrupo.map((h) => h.materiaId))]
      const materiasGrupo = idsMateriasGrupo
        .map((id) => materiasTodas.find((m) => m.id === id))
        .filter((m): m is Materia => Boolean(m))

      const filasMaterias: FilaMateria[] = await Promise.all(
        materiasGrupo.map(async (materia) => {
          const califsMateria = await calificacionRepositorio.obtenerPorMateria(materia.id)
          const califsAlumno = califsMateria.filter((c) => c.alumnoId === alumno.id)
          // calcularPromedio ya devuelve escala 0-10 - no dividir entre 10.
          const promedio = calcularPromedio(califsAlumno, materia.rubros)
          const docente = docentes.find((d) => d.id === materia.docenteId)
          return {
            materia,
            docenteNombre: docente?.nombre ?? '',
            promedio,
          }
        })
      )

      setResultado({ alumno, grupo, asistenciaGlobal, proximasClases, filasMaterias })
    } catch (err) {
      console.error('PortalPagina: error al consultar', err)
      setNoEncontrado(true)
    } finally {
      setBuscando(false)
    }
  }

  const manejarEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') consultar()
  }

  return (
    <div className="login-pantalla">
      <div style={{ width: '100%', maxWidth: 780 }}>
        <div className="login-tarjeta" style={{ maxWidth: '100%', textAlign: 'left' }}>
          <h1 className="login-titulo" style={{ textAlign: 'center' }}>Consulta tu avance académico</h1>
          <p className="login-subtitulo" style={{ textAlign: 'center' }}>
            Madres, padres de familia y alumnado de la Preparatoria No. 50 pueden consultar
            asistencias, calificaciones y horario escribiendo la matrícula que aparece en la credencial.
          </p>

          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
            <input
              className="login-input"
              placeholder="Escribe la matrícula, ej. A1001"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
              onKeyDown={manejarEnter}
            />
            <button className="login-boton" style={{ width: 'auto', padding: '0 1.5rem' }} onClick={consultar} disabled={buscando}>
              {buscando ? '...' : 'Consultar'}
            </button>
          </div>

          {noEncontrado && (
            <p className="login-error" style={{ marginTop: '1rem' }}>
              No se encontró la matrícula <strong>{matricula.trim().toUpperCase()}</strong>. Verifica
              que esté escrita igual que en la credencial.
            </p>
          )}
        </div>

        {resultado && (
          <>
            <div className="panel-columnas" style={{ marginTop: '1.25rem' }}>
              {/* ---------- Datos del alumno ---------- */}
              <div className="table-wrap" style={{ padding: '1.25rem', color: '#1a1a1a', background: '#fff' }}>
                <h3 style={{ marginBottom: '0.5rem', fontSize: '0.95rem' }}>👤 Alumno</h3>
                <p style={{ fontWeight: 700 }}>{nombreCompleto(resultado.alumno)}</p>
                <p className="mono" style={{ color: '#555' }}>{resultado.alumno.matricula}</p>
                <p style={{ color: '#555', fontSize: '0.85rem' }}>
                  {resultado.grupo?.nombre} · {resultado.grupo?.turno} · Semestre {resultado.grupo?.semestre}
                </p>
                <p style={{ color: '#555', fontSize: '0.85rem' }}>
                  Tutor: {resultado.alumno.tutor || 'No registrado'}
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: '0.6rem' }}
                  onClick={() => setMostrarQR((v) => !v)}
                >
                  🪪 {mostrarQR ? 'Ocultar' : 'Ver mi'} credencial QR
                </button>
                {mostrarQR && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'center' }}>
                    <QRCodeSVG value={`${PREFIJO_CREDENCIAL}${resultado.alumno.matricula}`} size={120} />
                  </div>
                )}
              </div>

              {/* ---------- Asistencia global ---------- */}
              <div className="table-wrap" style={{ padding: '1.25rem', color: '#1a1a1a', background: '#fff' }}>
                <h3 style={{ marginBottom: '0.5rem', fontSize: '0.95rem' }}>📋 Asistencia global</h3>
                <p style={{ fontSize: '2rem', fontWeight: 800, color: resultado.asistenciaGlobal === null ? '#999' : resultado.asistenciaGlobal >= 80 ? '#16a34a' : '#dc2626' }}>
                  {resultado.asistenciaGlobal === null ? '—' : `${resultado.asistenciaGlobal}%`}
                </p>
                <div style={{ background: '#e5e7eb', borderRadius: 6, height: 10, overflow: 'hidden' }}>
                  <div style={{ width: `${resultado.asistenciaGlobal ?? 0}%`, background: (resultado.asistenciaGlobal ?? 0) >= 80 ? '#16a34a' : '#dc2626', height: '100%' }} />
                </div>
                <p style={{ color: '#777', fontSize: '0.78rem', marginTop: '0.5rem' }}>
                  Se considera asistencia: presente y retardo.
                </p>
              </div>

              {/* ---------- Proximas clases ---------- */}
              <div className="table-wrap" style={{ padding: '1.25rem', color: '#1a1a1a', background: '#fff' }}>
                <h3 style={{ marginBottom: '0.5rem', fontSize: '0.95rem' }}>🗓️ Próximas clases</h3>
                {resultado.proximasClases.length === 0 ? (
                  <p style={{ color: '#777', fontSize: '0.85rem' }}>Sin horario registrado.</p>
                ) : (
                  resultado.proximasClases.map((h) => (
                    <div key={h.id} style={{ padding: '0.4rem 0', borderBottom: '1px solid #eee', fontSize: '0.85rem' }}>
                      <strong>{h.dia} {h.hi}</strong>
                      <br />
                      <span style={{ color: '#777' }}>{h.aula}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ---------- Materias del grupo ---------- */}
            <div className="table-wrap" style={{ padding: '1.25rem', marginTop: '1.25rem', color: '#1a1a1a', background: '#fff' }}>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>📚 Materias: asistencia y calificaciones</h3>
              {resultado.filasMaterias.length === 0 ? (
                <p style={{ color: '#777', fontSize: '0.85rem' }}>El grupo aún no tiene materias en su horario.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', fontSize: '0.78rem', color: '#777', borderBottom: '1px solid #eee' }}>
                      <th style={{ padding: '0.4rem 0' }}>Materia</th>
                      <th>Promedio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.filasMaterias.map((fila) => (
                      <tr key={fila.materia.id} style={{ borderBottom: '1px solid #f3f3f3', fontSize: '0.85rem' }}>
                        <td style={{ padding: '0.5rem 0' }}>
                          <strong>{fila.materia.nombre}</strong>
                          <br />
                          <span style={{ color: '#999', fontSize: '0.78rem' }}>{fila.docenteNombre}</span>
                        </td>
                        <td className="mono" style={{ color: fila.promedio !== null && fila.promedio < 6 ? '#dc2626' : '#1a1a1a', fontWeight: 700 }}>
                          {fila.promedio !== null ? fila.promedio.toFixed(1) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <p style={{ color: '#999', fontSize: '0.78rem', marginTop: '0.6rem' }}>
                Calificación mínima aprobatoria: 6.0. Si tienes dudas, acude con el docente de la
                materia o a la dirección del plantel.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
