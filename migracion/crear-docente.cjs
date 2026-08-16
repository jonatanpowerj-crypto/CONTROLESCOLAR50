/**
 * ============================================================
 * Crear cuenta de acceso para un docente, SIN contraseña compartida.
 * ============================================================
 * En vez de inventar una contraseña temporal y compartirla, este
 * script crea la cuenta en Firebase Authentication y genera un
 * LINK de "establece tu contraseña" que solo el docente puede usar
 * una vez. Tu le compartes el link (por correo o WhatsApp), nunca
 * una contraseña.
 *
 * Uso:
 *   node migracion/crear-docente.cjs correo@uagro.mx "Nombre Completo"
 *
 * Requiere: migracion/service-account.json
 */

const { initializeApp, cert } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore } = require('firebase-admin/firestore')
const path = require('path')
const crypto = require('crypto')

const [, , correo, nombreCompleto] = process.argv

if (!correo) {
  console.error('Uso: node migracion/crear-docente.cjs correo@uagro.mx "Nombre Completo"')
  process.exit(1)
}

const serviceAccountPath = path.join(__dirname, 'service-account.json')
let serviceAccount
try {
  serviceAccount = require(serviceAccountPath)
} catch (e) {
  console.error('ERROR: no se encontro migracion/service-account.json')
  process.exit(1)
}

const app = initializeApp({ credential: cert(serviceAccount) })
const auth = getAuth(app)
const db = getFirestore(app)

async function main() {
  console.log(`Creando cuenta para: ${correo}`)

  // Contraseña inicial aleatoria - nadie la usa nunca, solo existe
  // para satisfacer el requisito de Firebase Auth al crear la cuenta.
  const passwordInicialAleatoria = crypto.randomBytes(24).toString('base64')

  let usuario
  try {
    usuario = await auth.createUser({
      email: correo,
      password: passwordInicialAleatoria,
      displayName: nombreCompleto || undefined,
    })
    console.log(`Cuenta creada. UID: ${usuario.uid}`)
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      usuario = await auth.getUserByEmail(correo)
      console.log(`La cuenta ya existia. UID: ${usuario.uid}`)
    } else {
      throw err
    }
  }

  // Buscar si ya existe un documento de docente con este correo,
  // para vincular docenteId automaticamente.
  const docentesSnap = await db.collection('docentes').get()
  const docenteMatch = docentesSnap.docs.find(
    (d) => (d.data().email || '').toLowerCase() === correo.toLowerCase()
  )

  await db.collection('usuarios').doc(usuario.uid).set({
    email: correo,
    rol: 'docente',
    docenteId: docenteMatch ? docenteMatch.id : null,
  })

  console.log(
    docenteMatch
      ? `Vinculado al docente existente: ${docenteMatch.id}`
      : 'AVISO: no se encontro un documento de docente con este correo. docenteId quedo en null.'
  )

  // Link de un solo uso para que el propio docente elija su contraseña.
  const link = await auth.generatePasswordResetLink(correo)

  console.log('\n============================================================')
  console.log('Comparte este link con el docente (por correo, no por chat')
  console.log('publico). Es de un solo uso y expira en unas horas.')
  console.log('============================================================')
  console.log(link)
  console.log('============================================================')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('ERROR:', err)
    process.exit(1)
  })
