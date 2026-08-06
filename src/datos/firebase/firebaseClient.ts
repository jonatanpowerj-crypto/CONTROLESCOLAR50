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
  QueryConstraint,
  Unsubscribe,
} from 'firebase/firestore'

export class FirebaseClient<T extends DocumentData> {
  private nombreColeccion: string

  constructor(nombreColeccion: string) {
    this.nombreColeccion = nombreColeccion
  }

  private get ref() {
    return collection(obtenerDb(), this.nombreColeccion)
  }

  async obtenerPorId(id: string): Promise<T | null> {
    const docRef = doc(obtenerDb(), this.nombreColeccion, id)
    const snap = await getDoc(docRef)
    return snap.exists() ? (snap.data() as T) : null
  }

  async obtenerTodos(...constraints: QueryConstraint[]): Promise<T[]> {
    const q = query(this.ref, ...constraints)
    const snap = await getDocs(q)
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

  escucharCambios(
    callback: (datos: T[]) => void,
    ...constraints: QueryConstraint[]
  ): Unsubscribe {
    const q = query(this.ref, ...constraints)
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => d.data() as T))
    })
  }
}

export { collection, doc, query, where, orderBy }
