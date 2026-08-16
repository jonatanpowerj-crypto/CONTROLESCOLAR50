// Repositorio de Configuracion - Capa de Datos

import { doc, getDoc, setDoc, getDocs, collection } from 'firebase/firestore'
import { obtenerDb } from '../firebase/firebaseConfig'
import { ConfigPlantel, CONFIG_PLANTEL_DEFECTO, ResumenSistema } from '../../dominio/configuracion/ConfigPlantel'

// Mismo documento que ya usa el legacy: coleccion "config", doc "plantel"
// (ver js/nube.js: fsdb.collection('config').doc('plantel')). Compartir
// este documento mantiene sincronizados legacy y React.
const COLECCION = 'config'
const DOC_ID = 'plantel'

const COLECCIONES_CONTAR: (keyof ResumenSistema)[] = [
  'alumnos',
  'docentes',
  'grupos',
  'materias',
  'horarios',
  'asistencias',
  'calificaciones',
]

export class ConfiguracionRepositorio {
  async obtenerPlantel(): Promise<ConfigPlantel> {
    const db = obtenerDb()
    const ref = doc(db, COLECCION, DOC_ID)
    const snap = await getDoc(ref)
    if (!snap.exists()) return CONFIG_PLANTEL_DEFECTO
    return { ...CONFIG_PLANTEL_DEFECTO, ...(snap.data() as Partial<ConfigPlantel>) }
  }

  async guardarPlantel(datos: ConfigPlantel): Promise<void> {
    const db = obtenerDb()
    const ref = doc(db, COLECCION, DOC_ID)
    await setDoc(ref, datos, { merge: true })
  }

  async obtenerResumen(): Promise<ResumenSistema> {
    const db = obtenerDb()
    const resumen = {} as ResumenSistema

    await Promise.all(
      COLECCIONES_CONTAR.map(async (nombre) => {
        const snap = await getDocs(collection(db, nombre))
        resumen[nombre] = snap.size
      })
    )

    return resumen
  }

  // Descarga un respaldo completo: config del plantel + todas las
  // colecciones principales, como un solo archivo JSON.
  async generarRespaldo(): Promise<Record<string, unknown>> {
    const db = obtenerDb()
    const plantel = await this.obtenerPlantel()
    const respaldo: Record<string, unknown> = { plantel, generadoEn: new Date().toISOString() }

    await Promise.all(
      COLECCIONES_CONTAR.map(async (nombre) => {
        const snap = await getDocs(collection(db, nombre))
        respaldo[nombre] = snap.docs.map((d) => d.data())
      })
    )

    return respaldo
  }
}

export const configuracionRepositorio = new ConfiguracionRepositorio()
