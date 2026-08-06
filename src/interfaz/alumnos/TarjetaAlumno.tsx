// Tarjeta de Alumno - Componente de Interfaz

import { Alumno, nombreCompleto } from '../../dominio/alumnos/Alumno'
import { EstadisticaAlumno } from '../../datos/alumnos/AlumnoEstadisticas'

interface TarjetaAlumnoProps {
  alumno: Alumno
  estadistica?: EstadisticaAlumno
  seleccionado?: boolean
  onClick?: () => void
  onEditar?: () => void
}

const ESTADO_COLORES = {
  excelente: { bg: '#22c55e', label: 'Excelente' },
  bueno: { bg: '#3b82f6', label: 'Bueno' },
  riesgo: { bg: '#eab308', label: 'En riesgo' },
  critico: { bg: '#ef4444', label: 'Crítico' },
}

export const TarjetaAlumno = ({
  alumno,
  estadistica,
  seleccionado,
  onClick,
  onEditar,
}: TarjetaAlumnoProps) => {
  const estado = estadistica?.estado
  const estadoInfo = estado ? ESTADO_COLORES[estado] : null

  return (
    <div
      className={`tarjeta-alumno ${seleccionado ? 'seleccionado' : ''}`}
      onClick={onClick}
    >
      <div className="tarjeta-header">
        <span className="matricula">{alumno.matricula}</span>
        {estadoInfo && (
          <span
            className="estado-badge"
            style={{ backgroundColor: estadoInfo.bg }}
          >
            {estadoInfo.label}
          </span>
        )}
      </div>

      <div className="tarjeta-body">
        <h4>{nombreCompleto(alumno)}</h4>
        {alumno.tutor && <p className="tutor">Tutor: {alumno.tutor}</p>}
      </div>

      <div className="tarjeta-stats">
        {estadistica && (
          <>
            <div className="stat">
              <span className="stat-value">
                {estadistica.promedioGeneral.toFixed(1)}
              </span>
              <span className="stat-label">Promedio</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {estadistica.porcentajeAsistencia}%
              </span>
              <span className="stat-label">Asistencia</span>
            </div>
          </>
        )}
      </div>

      {onEditar && (
        <button className="btn btn-sm btn-outline editar-btn" onClick={onEditar}>
          ✏️ Editar
        </button>
      )}
    </div>
  )
}
