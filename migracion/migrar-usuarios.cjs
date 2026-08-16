/**
 * ============================================================
 * Migracion: crear coleccion usuarios/{uid} con rol para cada
 * docente y para el/los administrador(es), cruzando Firebase
 * Authentication (por correo) con la coleccion Firestore "docentes".
 * ============================================================
 *
 * MODO SEGURO POR DEFECTO: solo muestra un reporte, no escribe nada.
 * Para escribir de verdad, corre con la bandera --confirmar
 *
 * Uso:
 *   node migracion/migrar-usuarios.cjs              (dry-run, solo reporte)
 *   node migracion/migrar-usuarios.cjs --confirmar   (escribe de verdad)
 *
 * Requiere: migracion/service-account.json (clave de servicio de Firebase)
 */

const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { getAuth } = require('firebase-admin/auth')
const path = require('path')

// -----------------------------------------------------------
// CONFIGURACION - ajusta esta lista si tienes mas de un admin
// -----------------------------------------------------------
const ADMIN_EMAILS = ['jonatan33@uagro.mx']

const CONFIRMAR = process.argv.includes('--confirmar')

// -----------------------------------------------------------
// Inicializar Firebase Admin
// -----------------------------------------------------------
const serviceAccountPath = path.join(__dirname, 'service-account.json')
let serviceAccount
try {
  serviceAccount = require(serviceAccountPath)
} catch (e) {
  console.error('ERROR: no se encontro migracion/service-account.json')
  console.error('Descargalo desde Firebase Console > Configuracion del proyecto > Cuentas de servicio')
  process.exit(1)
}

const app = initializeApp({
  credential: cert(serviceAccount),
})

const db = getFirestore(app)
const auth = getAuth(app)

async function main() {
  console.log('============================================================')
  console.log(CONFIRMAR ? 'MODO: ESCRITURA REAL (--confirmar activo)' : 'MODO: SOLO REPORTE (dry-run, no se escribira nada)')
  console.log('============================================================\n')

  // 1. Traer todos los usuarios de Authentication
  const listaAuth = []
  let pageToken
  do {
    const resultado = await auth.listUsers(1000, pageToken)
    listaAuth.push(...resultado.users)
    pageToken = resultado.pageToken
  } while (pageToken)

  console.log(`Usuarios en Authentication: ${listaAuth.length}`)

  // 2. Traer la coleccion docentes de Firestore
  const docentesSnap = await db.collection('docentes').get()
  const docentes = docentesSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
  console.log(`Documentos en coleccion "docentes": ${docentes.length}\n`)

  // 3. Traer usuarios ya existentes en la coleccion usuarios (para no duplicar)
  const usuariosExistentesSnap = await db.collection('usuarios').get()
  const uidsExistentes = new Set(usuariosExistentesSnap.docs.map((d) => d.id))
  if (uidsExistentes.size > 0) {
    console.log(`Ya existen ${uidsExistentes.size} documento(s) en "usuarios" (no se van a duplicar/sobrescribir):`)
    usuariosExistentesSnap.docs.forEach((d) => console.log(`  - ${d.id} (${d.data().email}, rol: ${d.data().rol})`))
    console.log('')
  }

  const porCrear = []
  const authSinCoincidencia = []

  for (const usuarioAuth of listaAuth) {
    if (!usuarioAuth.email) continue
    if (uidsExistentes.has(usuarioAuth.uid)) continue // ya existe, no tocar

    const correo = usuarioAuth.email.toLowerCase()

    if (ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(correo)) {
      porCrear.push({
        uid: usuarioAuth.uid,
        email: usuarioAuth.email,
        rol: 'admin',
        docenteId: null,
      })
      continue
    }

    const docenteMatch = docentes.find(
      (d) => (d.email || '').toLowerCase() === correo
    )

    if (docenteMatch) {
      porCrear.push({
        uid: usuarioAuth.uid,
        email: usuarioAuth.email,
        rol: 'docente',
        docenteId: docenteMatch.id,
      })
    } else {
      authSinCoincidencia.push(usuarioAuth.email)
    }
  }

  console.log('------------------------------------------------------------')
  console.log(`Documentos a crear en "usuarios": ${porCrear.length}`)
  console.log('------------------------------------------------------------')
  porCrear.forEach((u) => {
    console.log(`  usuarios/${u.uid}  ->  email: ${u.email}, rol: ${u.rol}, docenteId: ${u.docenteId}`)
  })

  if (authSinCoincidencia.length > 0) {
    console.log('\n------------------------------------------------------------')
    console.log('AVISO: estas cuentas de Authentication NO tienen coincidencia')
    console.log('en la coleccion "docentes" ni estan en ADMIN_EMAILS.')
    console.log('NO se les creara documento en "usuarios" (quedarian sin rol,')
    console.log('bloqueadas de escribir cuando se publiquen las reglas nuevas).')
    console.log('Revisalas manualmente:')
    console.log('------------------------------------------------------------')
    authSinCoincidencia.forEach((email) => console.log(`  - ${email}`))
  }

  if (!CONFIRMAR) {
    console.log('\n============================================================')
    console.log('Esto fue solo un reporte. Nada se escribio en Firestore.')
    console.log('Si todo se ve correcto arriba, corre de nuevo asi:')
    console.log('  node migracion/migrar-usuarios.cjs --confirmar')
    console.log('============================================================')
    return
  }

  console.log('\nEscribiendo en Firestore...')
  let lote = db.batch()
  let contador = 0

  for (const u of porCrear) {
    const ref = db.collection('usuarios').doc(u.uid)
    lote.set(ref, {
      email: u.email,
      rol: u.rol,
      docenteId: u.docenteId,
    })
    contador++
    if (contador % 400 === 0) {
      await lote.commit()
      lote = db.batch()
    }
  }
  await lote.commit()

  console.log(`\nListo. Se crearon ${porCrear.length} documento(s) en "usuarios".`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('ERROR durante la migracion:', err)
    process.exit(1)
  })
