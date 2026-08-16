// src/aplicacion/auth/useAuth.ts
// Hook de autenticacion - envuelve Firebase Auth y expone el rol
// del usuario leyendo su documento en la coleccion "usuarios"

import { useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { obtenerAuth, obtenerDb } from '../../datos/firebase/firebaseConfig'

export type Rol = 'admin' | 'docente' | null

export interface EstadoAuth {
  usuario: User | null
  rol: Rol
  docenteId: string | null
  cargando: boolean
  error: string | null
}

export const useAuth = (): EstadoAuth => {
  const [usuario, setUsuario] = useState<User | null>(null)
  const [rol, setRol] = useState<Rol>(null)
  const [docenteId, setDocenteId] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const auth = obtenerAuth()

    const cancelarSuscripcion = onAuthStateChanged(auth, async (usuarioFirebase) => {
      setError(null)

      if (!usuarioFirebase) {
        setUsuario(null)
        setRol(null)
        setDocenteId(null)
        setCargando(false)
        return
      }

      setUsuario(usuarioFirebase)

      try {
        const db = obtenerDb()
        const perfilRef = doc(db, 'usuarios', usuarioFirebase.uid)
        const perfilSnap = await getDoc(perfilRef)

        if (perfilSnap.exists()) {
          const datos = perfilSnap.data()
          setRol((datos.rol as Rol) ?? null)
          setDocenteId((datos.docenteId as string | null) ?? null)
        } else {
          // Usuario autenticado pero sin perfil en "usuarios" todavia.
          // No es un error fatal: simplemente no tiene rol asignado.
          setRol(null)
          setDocenteId(null)
        }
      } catch (err) {
        console.error('useAuth: error al leer el perfil del usuario', err)
        setError('No se pudo cargar tu perfil. Intenta recargar la pagina.')
        setRol(null)
        setDocenteId(null)
      } finally {
        setCargando(false)
      }
    })

    return () => cancelarSuscripcion()
  }, [])

  return { usuario, rol, docenteId, cargando, error }
}