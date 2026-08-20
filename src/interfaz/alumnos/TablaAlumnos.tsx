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

const soloDigitos = (telefono: string): string => telefono.replace(/\D/g, '')

const armarLinkWhatsApp = (alumno: Alumno, stats?: EstadisticaAlumno): string | null => {
  if (!alumno.telTutor) return null
  const numero = soloDigitos(alumno.telTutor)
  if (numero.length < 10) return null

  const porcentaje = stats?.porcentajeAsistencia
  const mensaje =
    porcentaje !== undefined
      ? `Hola, le escribimos de la Preparatoria No. 50 (SIGE) para informarle que ${nombreCompleto(alumno)} tiene ${porcentaje}% de asistencia registrada hasta el momento. Quedamos atentos a cualquier duda.`
      : `Hola, le escribimos de la Preparatoria No. 50 (SIGE) respecto al alumno(a) ${nombreCompleto(alumno)}.`

  // Numero mexicano: anteponer 52 si viene con 10 digitos locales
  const numeroConLada = numero.length === 10 ? `52${numero}` : numero
  return `https://wa.me/${numeroConLada}?text=${encodeURIComponent(mensaje)}`
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
            <th>Avisar</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {alumnos.map((alumno) => {
            const stats = estadisticas?.get(alumno.id)
            const linkWhatsApp = armarLinkWhatsApp(alumno, stats)
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
                  {stats && stats.totalCalificaciones > 0 ? stats.promedioGeneral.toFixed(1) : '-'}
                </td>
                <td className="numero">
                  {stats && stats.totalAsistencias > 0 ? `${stats.porcentajeAsistencia}%` : 'Sin registros'}
                </td>
                <td>
                  {stats && (stats.totalAsistencias > 0 || stats.totalCalificaciones > 0) && (
                    <span
                      className="tag"
                      style={{ backgroundColor: ESTADO_COLORES[stats.estado] }}
                    >
                      {stats.estado}
                    </span>
                  )}
                </td>
                <td className="acciones">
                  {linkWhatsApp ? (
                    <a
                      href={linkWhatsApp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline"
                      title="Avisar al tutor por WhatsApp"
                    >
                      📲
                    </a>
                  ) : (
                    <button className="btn btn-sm btn-outline" disabled title="Sin teléfono de tutor registrado">
                      📲
                    </button>
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
