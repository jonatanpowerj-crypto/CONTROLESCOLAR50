// src/interfaz/layout/AppLayout.tsx
import { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { obtenerAuth } from '../../datos/firebase/firebaseConfig'
import { useAuth } from '../../aplicacion/auth/useAuth'

interface ItemNav {
  ruta: string
  nombre: string
  icono: string
  soloAdmin?: boolean
}

const ITEMS_NAV: ItemNav[] = [
  { ruta: '/panel', nombre: 'Panel del día', icono: '🏠' },
  { ruta: '/alumnos', nombre: 'Alumnos', icono: '🎓' },
  { ruta: '/asistencia', nombre: 'Asistencia', icono: '📋' },
  { ruta: '/calificaciones', nombre: 'Calificaciones', icono: '📊' },
  { ruta: '/credenciales', nombre: 'Credenciales QR', icono: '🪪' },
  { ruta: '/reportes', nombre: 'Reportes', icono: '📈' },
  { ruta: '/docentes', nombre: 'Docentes', icono: '🧑\u200d🏫', soloAdmin: true },
  { ruta: '/materias', nombre: 'Materias', icono: '📚', soloAdmin: true },
  { ruta: '/grupos', nombre: 'Grupos', icono: '👥', soloAdmin: true },
  { ruta: '/horarios', nombre: 'Horarios', icono: '🗓️', soloAdmin: true },
  { ruta: '/configuracion', nombre: 'Configuración', icono: '⚙️', soloAdmin: true },
]

interface AppLayoutProps {
  children: ReactNode
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { usuario, rol } = useAuth()

  const itemsVisibles = ITEMS_NAV.filter((item) => !item.soloAdmin || rol === 'admin')

  const cerrarSesion = async () => {
    await signOut(obtenerAuth())
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar__marca">
          <div className="app-sidebar__logo">P50</div>
          <div>
            <div className="app-sidebar__titulo">SIGE Prepa 50</div>
            <div className="app-sidebar__subtitulo">UAGro · Tlacoachistlahuaca</div>
          </div>
        </div>

        <ul className="app-sidebar__nav">
          {itemsVisibles.map((item) => (
            <li key={item.ruta}>
              <NavLink
                to={item.ruta}
                className={({ isActive }) =>
                  isActive ? 'app-sidebar__link app-sidebar__link--activo' : 'app-sidebar__link'
                }
              >
                <span>{item.icono}</span>
                <span>{item.nombre}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </aside>

      <div className="app-main">
        <header className="app-header">
          <div className="app-header__usuario">
            <div className="app-header__email">{usuario?.email}</div>
            <span className="app-header__rol">{rol}</span>
          </div>
          <button className="btn btn-outline btn-sm" onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </header>

        <main className="app-content">{children}</main>
      </div>
    </div>
  )
}
