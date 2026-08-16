// Pagina de Calificaciones - Interfaz

import { useEffect, useState } from 'react'
import { FirebaseClient } from '../../datos/firebase/firebaseClient'
import { materiaRepositorio } from '../../datos/materias/MateriaRepositorio'
import { useAuth } from '../../aplicacion/auth/useAuth'
import { useCalificaciones } from '../../aplicacion/calificaciones/useCalificaciones'
import { nombreCompleto } from '../../dominio/alumnos/Alumno'
import { Materia } from '../../dominio/materias/Materia'
import { calcularPromedio, Calificacion } from '../../dominio/calificaciones/Calificacion'

interface Grupo {
  id: string
  nombre: string
}

const grupoRepositorio = new FirebaseClient<Grupo>('grupos')

export const CalificacionesPagina = () => {
  const { usuario } = useAuth()
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [materias, setMaterias] = useState<Materia[]>([])
  const [grupoId, setGrupoId] = useState('')
  const [materiaId, setMateriaId] = useState('')
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)

  const { alumnos, materia, valores, cargando, guardando, error, marcarValor, guardar } =
    useCalificaciones(grupoId, materiaId)

  useEffect(() => {
    grupoRepositorio.obtenerTodos().then((lista) => {
      setGrupos(lista)
      if (lista.length > 0 && !grupoId) setGrupoId(lista[0].id)
    })
    materiaRepositorio.obtenerTodos().then((lista) => {
      setMaterias(lista)
      if (lista.length > 0 && !materiaId) setMateriaId(lista[0].id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const manejarGuardar = async () => {
    setMensajeExito(null)
    const ok = await guardar(usuario?.uid ?? 'desconocido')
    if (ok) {
      setMensajeExito('Calificaciones guardadas correctamente.')
      setTimeout(() => setMensajeExito(null), 3000)
    }
  }

  const promedioDe = (alumnoId: string): number | null => {
    if (!materia) return null
    const calificacionesAlumno: Calificacion[] = materia.rubros
      .map((r) => {
        const v = valores[alumnoId]?.[r.nombre]
        if (v === '' || v === undefined) return null
        return {
          id: '',
          alumnoId,
          materiaId: materia.id,
          rubro: r.nombre,
          valor: Number(v),
          registradoPor: '',
          registradoEn: '',
        }
      })
      .filter((c): c is Calificacion => c !== null)
    return calcularPromedio(calificacionesAlumno, materia.rubros)
  }

  return (
    <div className="pagina">
      <header className="pagina-header">
        <h2>📊 Calificaciones</h2>
      </header>

      <div className="filtros">
        <label className="login-label" style={{ minWidth: 180 }}>
          Grupo
          <select className="login-input" value={grupoId} onChange={(e) => setGrupoId(e.target.value)}>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>{g.nombre}</option>
            ))}
          </select>
        </label>

        <label className="login-label" style={{ minWidth: 220 }}>
          Materia
          <select className="login-input" value={materiaId} onChange={(e) => setMateriaId(e.target.value)}>
            {materias.map((m) => (
              <option key={m.id} value={m.id}>{m.nombre} ({m.clave})</option>
            ))}
          </select>
        </label>
      </div>

      {materia && (
        <p className="vacio-texto" style={{ marginBottom: '1rem' }}>
          Rubros: {materia.rubros.map((r) => `${r.nombre} (${r.peso}%)`).join(' · ')}
        </p>
      )}

      {!cargando && error && (
        <div className="login-error" style={{ marginBottom: '1.25rem' }}>{error}</div>
      )}

      {cargando && (
        <div className="vacio">
          <span className="icono">⏳</span>
          <p>Cargando...</p>
        </div>
      )}

      {!cargando && !error && grupoId && alumnos.length === 0 && (
        <div className="vacio">
          <span className="icono">🎓</span>
          <p>Este grupo no tiene alumnos registrados todavía.</p>
        </div>
      )}

      {!cargando && materia && alumnos.length > 0 && (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Alumno</th>
                  {materia.rubros.map((r) => (
                    <th key={r.nombre}>{r.nombre} ({r.peso}%)</th>
                  ))}
                  <th>Promedio</th>
                </tr>
              </thead>
              <tbody>
                {alumnos.map((alumno) => {
                  const promedio = promedioDe(alumno.id)
                  return (
                    <tr key={alumno.id}>
                      <td>{nombreCompleto(alumno)}</td>
                      {materia.rubros.map((r) => (
                        <td key={r.nombre}>
                          <input
                            type="number"
                            min={0}
                            max={10}
                            step={0.1}
                            className="login-input calificacion-input"
                            value={valores[alumno.id]?.[r.nombre] ?? ''}
                            onChange={(e) => {
                              const v = e.target.value
                              marcarValor(alumno.id, r.nombre, v === '' ? '' : Number(v))
                            }}
                          />
                        </td>
                      ))}
                      <td className="numero">
                        <strong>{promedio !== null ? promedio.toFixed(1) : '-'}</strong>
                      </td>
                    </tr>
                  )
                })}
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
            {guardando ? 'Guardando...' : 'Guardar calificaciones'}
          </button>
        </>
      )}
    </div>
  )
}
