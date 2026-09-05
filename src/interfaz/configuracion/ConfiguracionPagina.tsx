// Pagina de Configuracion - Interfaz

import { FormEvent, useEffect, useState } from 'react'
import { useAuth } from '../../aplicacion/auth/useAuth'
import { useConfiguracion } from '../../aplicacion/configuracion/useConfiguracion'
import { ConfigPlantel } from '../../dominio/configuracion/ConfigPlantel'

const ETIQUETAS_RESUMEN: Record<string, string> = {
  alumnos: 'Alumnos',
  docentes: 'Docentes',
  grupos: 'Grupos',
  materias: 'Materias',
  horarios: 'Horarios registrados',
  asistencias: 'Registros de asistencia',
  calificaciones: 'Calificaciones capturadas',
}

export const ConfiguracionPagina = () => {
  const { rol } = useAuth()
  const esAdmin = rol === 'admin'
  const { plantel, resumen, cargando, guardando, vaciando, error, guardarPlantel, descargarRespaldo, vaciarSistema } =
    useConfiguracion()

  const [form, setForm] = useState<ConfigPlantel>(plantel)
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)
  const [mensajeVaciado, setMensajeVaciado] = useState<string | null>(null)

  useEffect(() => {
    setForm(plantel)
  }, [plantel])

  const manejarSubmit = async (evento: FormEvent) => {
    evento.preventDefault()
    setMensajeExito(null)
    const ok = await guardarPlantel(form)
    if (ok) {
      setMensajeExito('Configuración guardada correctamente.')
      setTimeout(() => setMensajeExito(null), 3000)
    }
  }

  const manejarVaciar = async () => {
    setMensajeVaciado(null)
    const confirmacion = window.prompt(
      'Esto borrará TODOS los alumnos, docentes, materias, grupos, horarios, ' +
        'asistencias y calificaciones. NO se puede deshacer.\n\n' +
        'Descarga un respaldo antes de continuar si no lo has hecho.\n\n' +
        'Para confirmar, escribe la palabra: BORRAR'
    )
    if (confirmacion === null) return
    if (confirmacion.trim().toUpperCase() !== 'BORRAR') {
      window.alert('Operación cancelada: no escribiste BORRAR.')
      return
    }

    const total = await vaciarSistema()
    if (total !== null) {
      setMensajeVaciado(`Sistema vaciado: se eliminaron ${total} documento(s).`)
    }
  }

  if (!esAdmin) {
    return (
      <div className="pagina">
        <header className="pagina-header">
          <h2>⚙️ Configuración</h2>
        </header>
        <div className="vacio">
          <span className="icono">🔒</span>
          <p>Solo el administrador del sistema puede ver esta sección.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pagina">
      <header className="pagina-header">
        <h2>⚙️ Configuración</h2>
      </header>

      {cargando && (
        <div className="vacio">
          <span className="icono">⏳</span>
          <p>Cargando configuración...</p>
        </div>
      )}

      {!cargando && (
        <>
          {/* ---------- Datos del plantel ---------- */}
          <div className="table-wrap" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>🏫 Datos del plantel</h3>
            <form onSubmit={manejarSubmit}>
              <div className="filtros">
                <label className="login-label" style={{ minWidth: 220 }}>
                  Nombre del plantel
                  <input
                    className="login-input"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    required
                  />
                </label>

                <label className="login-label" style={{ minWidth: 260 }}>
                  Universidad
                  <input
                    className="login-input"
                    value={form.universidad}
                    onChange={(e) => setForm({ ...form, universidad: e.target.value })}
                    required
                  />
                </label>

                <label className="login-label" style={{ minWidth: 220 }}>
                  Ciudad
                  <input
                    className="login-input"
                    value={form.ciudad}
                    onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                    required
                  />
                </label>

                <label className="login-label" style={{ minWidth: 140 }}>
                  Ciclo escolar activo
                  <input
                    className="login-input"
                    value={form.ciclo}
                    onChange={(e) => setForm({ ...form, ciclo: e.target.value })}
                    placeholder="Ej. 2026-A"
                    required
                  />
                </label>

                <label className="login-label" style={{ minWidth: 200 }}>
                  Tolerancia de retardo (minutos)
                  <input
                    type="number"
                    min={0}
                    max={60}
                    className="login-input"
                    value={form.toleranciaMin}
                    onChange={(e) => setForm({ ...form, toleranciaMin: Number(e.target.value) })}
                  />
                </label>
              </div>

              {error && <div className="login-error" style={{ marginTop: '1rem' }}>{error}</div>}
              {mensajeExito && (
                <p
                  className="login-error"
                  style={{ marginTop: '1rem', background: 'rgba(34,197,94,0.15)', color: '#86efac' }}
                >
                  {mensajeExito}
                </p>
              )}

              <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar configuración'}
              </button>
            </form>
          </div>

          {/* ---------- Resumen del sistema ---------- */}
          {resumen && (
            <div className="table-wrap" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>📊 Resumen del sistema</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                {Object.entries(resumen).map(([clave, valor]) => (
                  <div key={clave} style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--azul-marino-mas-claro)', borderRadius: 8 }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--dorado)' }}>{valor}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--texto-tenue)' }}>{ETIQUETAS_RESUMEN[clave] ?? clave}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------- Respaldo ---------- */}
          <div className="table-wrap" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>💾 Respaldo del sistema</h3>
            <p className="vacio-texto" style={{ marginBottom: '1rem' }}>
              Descarga un archivo JSON con todos los datos actuales (alumnos, docentes, grupos,
              materias, horarios, asistencias y calificaciones). Guárdalo en un lugar seguro.
            </p>
            <button type="button" className="btn btn-outline" onClick={descargarRespaldo}>
              ⬇ Descargar respaldo completo
            </button>
          </div>

          {/* ---------- Zona de peligro ---------- */}
          <div className="table-wrap" style={{ padding: '1.25rem', border: '1px solid rgba(239,68,68,0.4)' }}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem', color: '#fca5a5' }}>⚠️ Zona de peligro</h3>
            <p className="vacio-texto" style={{ marginBottom: '1rem' }}>
              Borra permanentemente todos los alumnos, docentes, materias, grupos, horarios,
              asistencias y calificaciones. Las cuentas de acceso (usuarios) y la configuración
              del plantel NO se borran. <strong>Descarga un respaldo antes de continuar.</strong>
            </p>

            {mensajeVaciado && (
              <p
                className="login-error"
                style={{ marginBottom: '1rem', background: 'rgba(34,197,94,0.15)', color: '#86efac' }}
              >
                {mensajeVaciado}
              </p>
            )}

            <button
              type="button"
              className="btn btn-outline"
              style={{ borderColor: '#ef4444', color: '#fca5a5' }}
              onClick={manejarVaciar}
              disabled={vaciando}
            >
              {vaciando ? 'Vaciando sistema...' : '🗑️ Vaciar sistema'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
