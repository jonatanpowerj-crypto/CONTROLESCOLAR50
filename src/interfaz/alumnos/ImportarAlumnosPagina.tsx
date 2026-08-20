// Pagina de Importacion de Alumnos - Interfaz

import { useEffect, useRef, useState } from 'react'
import { FirebaseClient } from '../../datos/firebase/firebaseClient'
import { useImportarAlumnos, descargarPlantillaExcel } from '../../aplicacion/alumnos/useImportarAlumnos'

interface Grupo {
  id: string
  nombre: string
}
const grupoRepositorio = new FirebaseClient<Grupo>('grupos')

const ETIQUETA_ESTADO: Record<string, { texto: string; color: string; fondo: string }> = {
  nuevo: { texto: 'Nuevo', color: '#86efac', fondo: 'rgba(34,197,94,0.15)' },
  duplicado: { texto: 'Duplicado', color: '#fcd34d', fondo: 'rgba(234,179,8,0.15)' },
  incompleto: { texto: 'Incompleto', color: '#fca5a5', fondo: 'rgba(239,68,68,0.15)' },
}

export const ImportarAlumnosPagina = () => {
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [grupoId, setGrupoId] = useState('')
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { candidatos, procesandoArchivo, importando, error, procesarArchivo, importarValidos, limpiar } =
    useImportarAlumnos()

  useEffect(() => {
    grupoRepositorio.obtenerTodos().then((lista) => {
      setGrupos(lista)
      if (lista.length > 0) setGrupoId(lista[0].id)
    })
  }, [])

  const manejarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    if (!archivo || !grupoId) return
    procesarArchivo(archivo, grupoId)
  }

  const manejarImportar = async () => {
    const cantidad = await importarValidos()
    if (cantidad > 0) {
      setMensajeExito(`Se importaron ${cantidad} alumno(s) correctamente.`)
      if (inputRef.current) inputRef.current.value = ''
      setTimeout(() => setMensajeExito(null), 4000)
    }
  }

  const nuevos = candidatos.filter((c) => c.estado === 'nuevo').length

  return (
    <div className="pagina">
      <header className="pagina-header">
        <h2>📥 Importar Alumnos desde Excel</h2>
      </header>

      <div className="table-wrap" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
        <p className="vacio-texto" style={{ marginBottom: '0.75rem' }}>
          Sube un archivo <strong>.xlsx, .xls o .csv</strong> con una fila por alumno. Columnas
          reconocidas: <span className="mono">matricula, nombre, apellidos, tutor, telefono_tutor, correo</span>
          {' '}(las tres primeras son obligatorias; el orden no importa y se aceptan acentos).
        </p>

        <button type="button" className="btn btn-sm btn-outline" onClick={descargarPlantillaExcel} style={{ marginBottom: '1rem' }}>
          ⬇ Descargar plantilla de ejemplo (.xlsx)
        </button>

        <div className="filtros">
          <label className="login-label" style={{ minWidth: 220 }}>
            Grupo destino
            <select className="login-input" value={grupoId} onChange={(e) => setGrupoId(e.target.value)}>
              {grupos.map((g) => (
                <option key={g.id} value={g.id}>{g.nombre}</option>
              ))}
            </select>
          </label>

          <label className="login-label" style={{ minWidth: 240 }}>
            Archivo
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="login-input"
              onChange={manejarArchivo}
              disabled={!grupoId}
            />
          </label>
        </div>

        {procesandoArchivo && <p className="vacio-texto" style={{ marginTop: '1rem' }}>⏳ Leyendo archivo...</p>}
        {error && <div className="login-error" style={{ marginTop: '1rem' }}>{error}</div>}
        {mensajeExito && (
          <p className="login-error" style={{ marginTop: '1rem', background: 'rgba(34,197,94,0.15)', color: '#86efac' }}>
            {mensajeExito}
          </p>
        )}
      </div>

      {candidatos.length > 0 && (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fila</th>
                  <th>Matrícula</th>
                  <th>Nombre</th>
                  <th>Apellidos</th>
                  <th>Tutor</th>
                  <th>Estado</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {candidatos.map((c) => {
                  const et = ETIQUETA_ESTADO[c.estado]
                  return (
                    <tr key={c.fila}>
                      <td className="numero">{c.fila}</td>
                      <td className="mono">{c.datos.matricula || '—'}</td>
                      <td>{c.datos.nombre || '—'}</td>
                      <td>{c.datos.apellidos || '—'}</td>
                      <td>{c.datos.tutor || '-'}</td>
                      <td>
                        <span className="tag" style={{ background: et.fondo, color: et.color, padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.78rem' }}>
                          {et.texto}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--texto-tenue)' }}>{c.motivo}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.25rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={importando || nuevos === 0}
              onClick={manejarImportar}
            >
              {importando ? 'Importando...' : `Importar ${nuevos} alumno${nuevos === 1 ? '' : 's'}`}
            </button>
            <button type="button" className="btn btn-outline" onClick={limpiar}>
              Cancelar
            </button>
          </div>
        </>
      )}
    </div>
  )
}
