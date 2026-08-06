// Tabla de Alumnos - Componente de Interfaz

import { Alumno, nombreCompleto } from '../../dominio/alumnos/Alumno'
import { EstadisticaAlumno } from '../../datos/alumnos/AlumnoEstadisticas'

interface TablaAlumnosProps {
  alumnos: Alumno[]
  estadisticas?: Map<string, EstadisticaAlumno>
  onEditar?: (alumno: Alumno) => void
  onEliminar?: (alumno: Alumno) => void
  onVerDetalle?: (alumno: Alumno) => void
}

const ESTADO_COLORES = {
  excelente: '#22c55e',
  bueno: '#3b82f6',
  riesgo: '#eab308',
  critico: '#ef4444',
}

export const TablaAlumnos = ({
  alumnos,
  estadisticas,
  onEditar,
  onEliminar,
  onVerDetalle,
}: TablaAlumnosProps) => {
  if (alumnos.length === 0) {
    return (
      <div className="vacio">
        <span className="icono">🎓</span>
        <p>No hay alumnos registrados</p>
      </div>
    )
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Matrícula</th>
            <th>Nombre</th>
            <th>Tutor</th>
            <th>Tel. Tutor</th>
            <th>Promedio</th>
            <th>Asistencia</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {alumnos.map((alumno) => {
            const stats = estadisticas?.get(alumno.id)
            return (
              <tr key={alumno.id}>
                <td className="mono">{alumno.matricula}</td>
                <td>
                  <button
                    className="link-btn"
                    onClick={() => onVerDetalle?.(alumno)}
                  >
                    {nombreCompleto(alumno)}
                  </button>
                </td>
                <td>{alumno.tutor || '-'}</td>
                <td>{alumno.telTutor || '-'}</td>
                <td className="numero">
                  {stats ? stats.promedioGeneral.toFixed(1) : '-'}
                </td>
                <td className="numero">
                  {stats ? `${stats.porcentajeAsistencia}%` : '-'}
                </td>
                <td>
                  {stats && (
                    <span
                      className="tag"
                      style={{ backgroundColor: ESTADO_COLORES[stats.estado] }}
                    >
                      {stats.estado}
                    </span>
                  )}
                </td>
                <td className="acciones">
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => onEditar?.(alumno)}
                  >
                    ✏️
                  </button>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => onEliminar?.(alumno)}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
