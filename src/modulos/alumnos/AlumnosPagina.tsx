import { useState } from 'react'
import { useAlumnos } from '../../aplicacion/alumnos/useAlumnos'
import { TablaAlumnos } from '../../interfaz/alumnos/TablaAlumnos'
import { FormularioAlumno } from '../../interfaz/alumnos/FormularioAlumno'
import { Alumno, AlumnoCrear } from '../../dominio/alumnos/Alumno'

export const AlumnosPagina = () => {
  const { alumnos, cargando, error, crear, actualizar, eliminar } = useAlumnos()
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [alumnoEditando, setAlumnoEditando] = useState<Alumno | null>(null)
  const [filtro, setFiltro] = useState('')

  const handleNuevo = () => {
    setAlumnoEditando(null)
    setMostrarFormulario(true)
  }

  const handleEditar = (alumno: Alumno) => {
    setAlumnoEditando(alumno)
    setMostrarFormulario(true)
  }

  const handleGuardar = async (datos: AlumnoCrear) => {
    if (alumnoEditando) {
      await actualizar(alumnoEditando.id, datos)
    } else {
      await crear(datos)
    }
    setMostrarFormulario(false)
    setAlumnoEditando(null)
  }

  const handleEliminar = async (alumno: Alumno) => {
    if (confirm(`¿Eliminar al alumno ${alumno.nombre} ${alumno.apellidos}?`)) {
      await eliminar(alumno.id)
    }
  }

  const handleCancelar = () => {
    setMostrarFormulario(false)
    setAlumnoEditando(null)
  }

  const alumnosFiltrados = alumnos.filter(
    (a: Alumno) =>
      a.matricula.toLowerCase().includes(filtro.toLowerCase()) ||
      a.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      a.apellidos.toLowerCase().includes(filtro.toLowerCase())
  )

  if (cargando) {
    return (
      <div className="pagina cargando">
        <span className="spinner"></span>
        <p>Cargando alumnos...</p>
      </div>
    )
  }

  return (
    <div className="pagina">
      <header className="pagina-header">
        <h2>👨‍🎓 Gestión de Alumnos</h2>
        <button className="btn btn-primary" onClick={handleNuevo}>
          ＋ Nuevo Alumno
        </button>
      </header>

      {error && <div className="error-msg">{error}</div>}

      <div className="filtros">
        <input
          type="text"
          placeholder="Buscar por matrícula, nombre o apellidos..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="input-buscar"
        />
        <span className="contador">{alumnosFiltrados.length} alumnos</span>
      </div>

      {mostrarFormulario ? (
        <div className="modal-form">
          <FormularioAlumno
            alumno={alumnoEditando}
            onGuardar={handleGuardar}
            onCancelar={handleCancelar}
          />
        </div>
      ) : (
        <TablaAlumnos
          alumnos={alumnosFiltrados}
          onEditar={handleEditar}
          onEliminar={handleEliminar}
        />
      )}
    </div>
  )
}
