// Repositorio de Configuracion - Capa de Datos

import { doc, getDoc, setDoc, getDocs, collection, writeBatch } from 'firebase/firestore'
import { obtenerDb } from '../firebase/firebaseConfig'
import { ConfigPlantel, CONFIG_PLANTEL_DEFECTO, ResumenSistema } from '../../dominio/configuracion/ConfigPlantel'

// Mismo documento que ya usa el legacy: coleccion "config", doc "plantel"
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

// Mismo alcance que el legacy: NO borra usuarios, config, bitacora
// ni registros_docentes.
const COLECCIONES_A_VACIAR = [
  'docentes',
  'materias',
  'grupos',
  'alumnos',
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

  // Vacia el sistema: borra TODOS los documentos de las colecciones
  // operativas (mismo alcance que el legacy). Devuelve cuantos
  // documentos se borraron en total, para confirmacion visual.
  async vaciarSistema(): Promise<number> {
    const db = obtenerDb()
    let totalBorrados = 0

    for (const nombreColeccion of COLECCIONES_A_VACIAR) {
      const snap = await getDocs(collection(db, nombreColeccion))
      const ids = snap.docs.map((d) => d.id)

      for (let i = 0; i < ids.length; i += 400) {
        const lote = writeBatch(db)
        ids.slice(i, i + 400).forEach((id) => {
          lote.delete(doc(db, nombreColeccion, id))
        })
        await lote.commit()
      }
      totalBorrados += ids.length
    }

    return totalBorrados
  }
}

export const configuracionRepositorio = new ConfiguracionRepositorio()
