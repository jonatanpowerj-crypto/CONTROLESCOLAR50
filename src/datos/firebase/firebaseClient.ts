import { obtenerDb } from './firebaseConfig'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  DocumentData,
  Query,
  Unsubscribe,
} from 'firebase/firestore'

export class FirebaseClient<T extends DocumentData> {
  protected nombreColeccion: string

  constructor(nombreColeccion: string) {
    this.nombreColeccion = nombreColeccion
  }

  protected get ref() {
    return collection(obtenerDb(), this.nombreColeccion)
  }

  async obtenerPorId(id: string): Promise<T | null> {
    const docRef = doc(obtenerDb(), this.nombreColeccion, id)
    const snap = await getDoc(docRef)
    return snap.exists() ? (snap.data() as T) : null
  }

  async obtenerTodos(q?: Query<DocumentData>): Promise<T[]> {
    const snap = await getDocs(q || this.ref)
    return snap.docs.map((d) => d.data() as T)
  }

  async crear(id: string, datos: T): Promise<void> {
    const docRef = doc(obtenerDb(), this.nombreColeccion, id)
    await setDoc(docRef, datos)
  }

  async actualizar(id: string, datos: Partial<T>): Promise<void> {
    const docRef = doc(obtenerDb(), this.nombreColeccion, id)
    await updateDoc(docRef, datos as DocumentData)
  }

  async eliminar(id: string): Promise<void> {
    const docRef = doc(obtenerDb(), this.nombreColeccion, id)
    await deleteDoc(docRef)
  }

  escucharCambios(callback: (datos: T[]) => void, q?: Query<DocumentData>): Unsubscribe {
    return onSnapshot(q || this.ref, (snap) => {
      callback(snap.docs.map((d) => d.data() as T))
    })
  }
}

export { collection, doc, query, where, orderBy }
