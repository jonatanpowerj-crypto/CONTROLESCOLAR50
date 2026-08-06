// Datos - Repositorios y acceso a datos
export { FirebaseClient, collection, doc, query, where, orderBy } from './firebase/firebaseClient'
export {
  inicializarFirebase,
  obtenerDb,
  obtenerAuth,
  firebaseConfig,
} from './firebase/firebaseConfig'
