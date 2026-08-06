// Formulario de Alumno - Componente de Interfaz

import { useState } from 'react'
import { Alumno, AlumnoCrear } from '../../dominio/alumnos/Alumno'

interface FormularioAlumnoProps {
  alumno?: Alumno | null
  grupoId?: string
  onGuardar: (datos: AlumnoCrear) => Promise<void>
  onCancelar: () => void
}

export const FormularioAlumno = ({
  alumno,
  grupoId,
  onGuardar,
  onCancelar,
}: FormularioAlumnoProps) => {
  const [formData, setFormData] = useState<AlumnoCrear>({
    matricula: alumno?.matricula || '',
    nombre: alumno?.nombre || '',
    apellidos: alumno?.apellidos || '',
    grupoId: alumno?.grupoId || grupoId || '',
    tutor: alumno?.tutor || '',
    telTutor: alumno?.telTutor || '',
    email: alumno?.email || '',
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.matricula.trim()) {
      setError('La matrícula es requerida')
      return
    }
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido')
      return
    }
    if (!formData.apellidos.trim()) {
      setError('Los apellidos son requeridos')
      return
    }
    if (!formData.grupoId) {
      setError('El grupo es requerido')
      return
    }

    setGuardando(true)
    try {
      await onGuardar(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form-alumno">
      <h3>{alumno ? 'Editar Alumno' : 'Nuevo Alumno'}</h3>

      {error && <div className="error-msg">{error}</div>}

      <div className="field">
        <label htmlFor="matricula">Matrícula *</label>
        <input
          type="text"
          id="matricula"
          name="matricula"
          value={formData.matricula}
          onChange={handleChange}
          placeholder="Ej: 2024-001"
          required
        />
      </div>

      <div className="field">
        <label htmlFor="nombre">Nombre(s) *</label>
        <input
          type="text"
          id="nombre"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          placeholder="Nombre del alumno"
          required
        />
      </div>

      <div className="field">
        <label htmlFor="apellidos">Apellidos *</label>
        <input
          type="text"
          id="apellidos"
          name="apellidos"
          value={formData.apellidos}
          onChange={handleChange}
          placeholder="Apellidos del alumno"
          required
        />
      </div>

      <div className="field">
        <label htmlFor="tutor">Nombre del tutor</label>
        <input
          type="text"
          id="tutor"
          name="tutor"
          value={formData.tutor}
          onChange={handleChange}
          placeholder="Nombre del padre o tutor"
        />
      </div>

      <div className="field">
        <label htmlFor="telTutor">Teléfono del tutor</label>
        <input
          type="tel"
          id="telTutor"
          name="telTutor"
          value={formData.telTutor}
          onChange={handleChange}
          placeholder="7771234567"
        />
      </div>

      <div className="field">
        <label htmlFor="email">Correo electrónico</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="correo@ejemplo.com"
        />
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-outline"
          onClick={onCancelar}
          disabled={guardando}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={guardando}
        >
          {guardando ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}
