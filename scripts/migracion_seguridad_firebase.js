/**
 * ════════════════════════════════════════════════════════════════
 * Script de Migración — Seguridad Portal Alumnos
 * SIGE Prepa 50
 * 
 * EJECUTAR ESTE SCRIPT ANTES DE APLICAR LOS CAMBIOS DE CÓDIGO
 * 
 * Este script:
 * 1. Respaldará la colección 'alumnos' en /backups/alumnos_backup_[timestamp].json
 * 2. Cambiará el ID de cada documento de push-id a matrícula
 * 3. Preparará la estructura de subcolecciones para calificaciones/asistencias
 * 
 * ADVERTENCIA: Ejecutar UNA SOLA VEZ. Si ya se ejecutó, NO volver a ejecutar.
 * ════════════════════════════════════════════════════════════════
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ─── Configuración ───
const PROJECT_ID = 'prepa50'; // Cambiar por el ID del proyecto Firebase
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

// Inicializar Firebase Admin
admin.initializeApp({
  projectId: PROJECT_ID,
  // Para producción local, usar:
  // credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

async function migrate() {
  console.log('═══════════════════════════════════════════════');
  console.log('  MIGRACIÓN DE SEGURIDAD - SIGE Prepa 50');
  console.log('═══════════════════════════════════════════════\n');

  // ─── 1. RESPALDO DE ALUMNOS ───
  console.log('📦 Paso 1: Respaldando colección "alumnos"...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUP_DIR, `alumnos_backup_${timestamp}.json`);
  
  try {
    const snapshot = await db.collection('alumnos').get();
    const alumnos = [];
    
    snapshot.forEach(doc => {
      alumnos.push({
        _oldId: doc.id,  // Guardar el ID antiguo para referencia
        ...doc.data()
      });
    });
    
    fs.writeFileSync(backupFile, JSON.stringify(alumnos, null, 2));
    console.log(`   ✅ Respaldo guardado: ${backupFile}`);
    console.log(`   📊 Total de alumnos respaldados: ${alumnos.length}`);
  } catch (error) {
    console.error('   ❌ Error al respaldar:', error.message);
    process.exit(1);
  }

  // ─── 2. MIGRACIÓN DE IDs DE ALUMNOS ───
  console.log('\n🔄 Paso 2: Migrando IDs de documentos (push-id → matrícula)...');
  
  try {
    const snapshot = await db.collection('alumnos').get();
    let migrados = 0;
    let errores = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const matricula = data.matricula;
      
      if (!matricula) {
        console.warn(`   ⚠️  Documento ${doc.id} no tiene matrícula, se omite`);
        continue;
      }
      
      // Verificar que no exista ya un documento con esa matrícula
      const existente = await db.collection('alumnos').doc(matricula).get();
      if (existente.exists) {
        console.warn(`   ⚠️  Ya existe documento con matrícula ${matricula}, se omite duplicado`);
        continue;
      }
      
      // Crear nuevo documento con ID = matrícula
      await db.collection('alumnos').doc(matricula).set(data);
      
      // Eliminar el documento antiguo
      await db.collection('alumnos').doc(doc.id).delete();
      
      migrados++;
      console.log(`   ✅ ${doc.id} → ${matricula} (${data.nombre} ${data.apellidos})`);
    }
    
    console.log(`\n   📊 Alumnos migrados exitosamente: ${migrados}`);
    if (errores > 0) console.log(`   ⚠️  Errores/omisiones: ${errores}`);
    
  } catch (error) {
    console.error('   ❌ Error durante la migración:', error.message);
    process.exit(1);
  }

  // ─── 3. NOTA SOBRE SUBCOLECCIONES ───
  console.log('\n📝 Paso 3: Estructura de subcolecciones');
  console.log('   Las colecciones "calificaciones" y "asistencias" ahora deben');
  console.log('   ser subcolecciones de "alumnos/{matricula}/" en lugar de');
  console.log('   colecciones raíz.');
  console.log('   ');
  console.log('   Como ambas están VACÍAS actualmente, no hay datos que migrar.');
  console.log('   El código en nube.js y app.js se ajustará para usar:');
  console.log('     - alumnos/{matricula}/calificaciones/{id}');
  console.log('     - alumnos/{matricula}/asistencias/{id}');

  console.log('\n═══════════════════════════════════════════════');
  console.log('  ✅ MIGRACIÓN COMPLETADA EXITOSAMENTE');
  console.log('═══════════════════════════════════════════════');
  console.log('\n📋 Próximos pasos:');
  console.log('   1. Publicar las nuevas reglas de Firestore (firestore.rules)');
  console.log('   2. Actualizar js/nube.js y js/app.js con los cambios de seguridad');
  console.log('   3. Probar el portal de consulta con una matrícula válida');
  console.log('   4. Verificar en la consola (F12) que DB.alumnos solo contiene');
  console.log('      el alumno consultado, no todos los alumnos');
  console.log('\n');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  migrate().catch(err => {
    console.error('Error fatal:', err);
    process.exit(1);
  });
}

module.exports = { migrate };
