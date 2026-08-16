/* ============================================================
   SIGE Prepa 50 — Capa de nube (Firebase)
   - MODO 'nube': Firestore en tiempo real + inicio de sesion.
   - MODO 'local': localStorage, como la version original.
   La aplicacion (app.js) escribe SIEMPRE a traves de persist() y
   persistDel(); esta capa decide a donde van los datos.
   ============================================================ */
'use strict';

let MODO = 'local';
let fsdb = null, authFB = null, usuarioActual = null, modoConsulta = false;
/* Perfil del usuario en sesion: rol y docente vinculado */
let PERFIL = { rol:'admin', docenteId:null, email:null };

// Respaldo de arranque UNICAMENTE: si la coleccion "usuarios" en
// Firestore todavia no tiene ningun documento con rol admin (por
// ejemplo la primera vez que se activa el sistema), este correo
// se trata como administrador para que siempre exista al menos
// una cuenta que pueda dar de alta al resto. En cuanto exista el
// documento correspondiente en usuarios/{uid}, ESE documento manda
// y este arreglo deja de tener efecto para esa cuenta.
const ADMIN_EMAILS_RESPALDO = ['jonatan33@uagro.mx'];

const COLECCIONES = ['docentes','materias','grupos','alumnos','horarios','asistencias','calificaciones','bitacora','calendario'];
let suscrito = false, renderTimer = null;

/* ¿El usuario en sesion es administrador? */
function esAdmin(){ return MODO!=='nube' || PERFIL.rol==='admin'; }

/* Identidad corta del usuario en sesion para registrar autoria.
   Devuelve el correo (o 'local' en modo sin nube). */
function autorActual(){
  if(MODO!=='nube') return 'local';
  return (usuarioActual && usuarioActual.email) || 'desconocido';
}
/* Sella un objeto con autoria: quien y cuando lo creo/modifico. */
function sellarAutoria(obj, esNuevo){
  const ahora = new Date().toISOString();
  if(esNuevo && !obj.creadoPor){ obj.creadoPor = autorActual(); obj.creadoEn = ahora; }
  obj.editadoPor = autorActual();
  obj.editadoEn = ahora;
  return obj;
}

/* IDs de las materias que el docente en sesion puede gestionar.
   Admin = todas. Docente = solo las suyas (por docenteId en cada materia). */
function materiasPermitidas(){
  if(esAdmin()) return DB.materias.map(m=>m.id);
  return DB.materias.filter(m=>m.docenteId===PERFIL.docenteId).map(m=>m.id);
}
function puedeMateria(materiaId){ return esAdmin() || materiasPermitidas().includes(materiaId); }
/* Grupos que tienen al menos una materia del docente en su horario */
function gruposPermitidos(){
  if(esAdmin()) return DB.grupos.map(g=>g.id);
  const mids = materiasPermitidas();
  return [...new Set(DB.horarios.filter(h=>mids.includes(h.materiaId)).map(h=>h.grupoId))];
}

/* Calcula el perfil consultando la coleccion "usuarios/{uid}" en
   Firestore — la misma que ya usan las reglas de seguridad del
   servidor. Esto es lo que de verdad determina el rol; el arreglo
   ADMIN_EMAILS_RESPALDO y la busqueda por correo en "docentes" solo
   se usan como respaldo si esa cuenta todavia no tiene su documento
   de rol creado (por ejemplo, antes de correr el script de
   migracion la primera vez). */
async function calcularPerfil(uid, email){
  const correo = (email||'').toLowerCase();

  if(fsdb){
    try{
      const snap = await fsdb.collection('usuarios').doc(uid).get();
      if(snap.exists){
        const datos = snap.data();
        return { rol: datos.rol || 'docente', docenteId: datos.docenteId || null, email: correo };
      }
    }catch(e){
      console.warn('No se pudo leer el perfil en "usuarios", usando respaldo.', e);
    }
  }

  // Respaldo: sin documento en "usuarios" todavia.
  if(ADMIN_EMAILS_RESPALDO.includes(correo)) return { rol:'admin', docenteId:null, email:correo };
  const doc = DB.docentes.find(d=>(d.email||'').toLowerCase()===correo);
  return { rol:'docente', docenteId: doc?doc.id:null, email:correo };
}

/* ¿El docente ya pego su configuracion de Firebase? */
function nubeConfigurada(){
  try{
    return typeof firebase !== 'undefined' && typeof FIREBASE_CONFIG !== 'undefined' &&
      FIREBASE_CONFIG.apiKey && !/PEGA_AQUI/.test(FIREBASE_CONFIG.apiKey + FIREBASE_CONFIG.projectId);
  }catch(_){ return false; }
}

/* ───────── Arranque del sistema (lo llama app.js al final) ───────── */
function iniciarSistema(){
  if(nubeConfigurada()){
    MODO = 'nube';
    firebase.initializeApp(FIREBASE_CONFIG);
    authFB = firebase.auth();
    fsdb = firebase.firestore();
    try{ fsdb.enablePersistence({synchronizeTabs:true}); }catch(_){ /* varias pestanas: continua sin cache */ }

    prepararLogin();
    authFB.onAuthStateChanged(async u=>{
      usuarioActual = u;
      if(u){                       // docente autenticado
        modoConsulta = false;
        document.body.classList.remove('solo-portal');
        PERFIL = await calcularPerfil(u.uid, u.email);
        ocultarLogin(); suscribirNube(); pintarSesion();
        // ¿Primer ingreso? (lo marcamos por dispositivo al cambiar contraseña)
        if(!localStorage.getItem('p50_pass_ok_'+u.uid) && !esAdmin()){
          setTimeout(()=>modalCambioObligatorio(), 600);
        }
        render();
      } else if(modoConsulta){     // padres/alumnos sin cuenta
        pintarSesion();
      } else {
        mostrarLogin(); pintarSesion();
      }
    });
  } else {
    MODO = 'local';
    DB = JSON.parse(localStorage.getItem(CLAVE) || 'null') || semilla();
    if(!DB.plantel.ciudad) DB.plantel.ciudad = 'Tlacoachistlahuaca, Gro.';
    guardarLocal();
    pintarSesion();
    render();
  }
}

/* ───────── Sincronizacion en tiempo real ───────── */
function suscribirNube(){
  if(suscrito) return; suscrito = true;
  COLECCIONES.forEach(col=>{
    fsdb.collection(col).onSnapshot(async snap=>{
      DB[col] = snap.docs.map(d=>d.data());
      // Al cargar docentes/materias, refrescar el vinculo del docente en sesion
      if((col==='docentes'||col==='materias') && usuarioActual && !esAdmin()){
        PERFIL = await calcularPerfil(usuarioActual.uid, usuarioActual.email);
      }
      programarRender();
    }, err=>{
      console.warn('Lectura de '+col, err);
      toast('No fue posible leer "'+col+'". Revisa las reglas de Firestore o tu conexion.');
    });
  });
  fsdb.collection('config').doc('plantel').onSnapshot(doc=>{
    if(doc.exists) DB.plantel = {...DB.plantel, ...doc.data()};
    programarRender();
  }, ()=>{});
}

/* Re-dibuja la vista cuando llegan datos de otros dispositivos,
   sin interrumpir al docente (no si esta escribiendo, escaneando
   o con un formulario abierto). */
function programarRender(){
  clearTimeout(renderTimer);
  renderTimer = setTimeout(()=>{
    const ae = document.activeElement;
    const escribiendo = ae && ['INPUT','TEXTAREA','SELECT'].includes(ae.tagName);
    const modalAbierto = !document.getElementById('modalBackdrop').hidden;
    const escaneando = (typeof lectorQR!=='undefined' && lectorQR) ||
                       (typeof lectorKiosko!=='undefined' && lectorKiosko);
    if(escribiendo || modalAbierto || escaneando) return;
    render();
  }, 250);
}

/* ───────── Escritura unificada (la usa toda la app) ───────── */
function persist(col, objs){
  guardarLocal();
  if(MODO!=='nube' || !fsdb) return;
  const lista = (Array.isArray(objs)?objs:[objs]).filter(Boolean);
  for(let i=0;i<lista.length;i+=400){
    const lote = fsdb.batch();
    lista.slice(i,i+400).forEach(o=>
      lote.set(fsdb.collection(col).doc(String(o.id)), JSON.parse(JSON.stringify(o))));
    lote.commit().catch(()=>toast('Cambio guardado en este equipo; se sincronizara al recuperar conexion.'));
  }
}
function persistDel(col, ids){
  guardarLocal();
  if(MODO!=='nube' || !fsdb) return;
  const lista = (Array.isArray(ids)?ids:[ids]).filter(Boolean);
  for(let i=0;i<lista.length;i+=400){
    const lote = fsdb.batch();
    lista.slice(i,i+400).forEach(id=>lote.delete(fsdb.collection(col).doc(String(id))));
    lote.commit().catch(()=>{});
  }
}
function persistPlantel(){
  guardarLocal();
  if(MODO==='nube' && fsdb)
    fsdb.collection('config').doc('plantel').set(JSON.parse(JSON.stringify(DB.plantel))).catch(()=>{});
}
/* Sube TODO el contenido de DB a Firestore (siembra inicial o
   migracion de un respaldo local). No borra documentos previos. */
function subirTodoANube(){
  if(MODO!=='nube') { guardarLocal(); return; }
  persistPlantel();
  COLECCIONES.forEach(col=>persist(col, DB[col]));
  toast('Datos enviados a la nube. La sincronizacion puede tardar unos segundos.');
}

/* ───────── Pantalla de inicio de sesion ───────── */
function mostrarLogin(){ const l=document.getElementById('loginOverlay'); if(l) l.hidden=false; }
function ocultarLogin(){ const l=document.getElementById('loginOverlay'); if(l) l.hidden=true; }

function prepararLogin(){
  const $i = id=>document.getElementById(id);
  const error = msg=>{ const e=$i('logError'); e.textContent=msg; e.hidden=false; };

  $i('logEntrar').addEventListener('click', async ()=>{
    const mail = $i('logMail').value.trim(), pass = $i('logPass').value;
    if(!mail || !pass){ error('Escribe tu correo y tu contraseña.'); return; }
    $i('logEntrar').disabled = true; $i('logError').hidden = true;
    try{
      await authFB.signInWithEmailAndPassword(mail, pass);
    }catch(e){
      const cod = e && e.code || '';
      error(cod.includes('network') ? 'Sin conexion a internet. Intenta de nuevo.'
        : cod.includes('too-many') ? 'Demasiados intentos. Espera unos minutos.'
        : 'Correo o contraseña incorrectos. Las cuentas las crea la direccion del plantel.');
    }
    $i('logEntrar').disabled = false;
  });
  $i('logPass').addEventListener('keydown', e=>{ if(e.key==='Enter') $i('logEntrar').click(); });

  $i('logPortal').addEventListener('click', ()=>{
    modoConsulta = true;
    document.body.classList.add('solo-portal');
    ocultarLogin(); suscribirNube(); pintarSesion();
    vistaActual = 'consultas';
    document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));
    render();
  });
}

/* ───────── Cambio de contraseña ─────────
   Nota de seguridad: ya NO existe una contraseña temporal fija
   compartida por todos los docentes. Cada cuenta nueva se crea con
   una contraseña aleatoria distinta (ver migracion/crear-docente.cjs),
   asi que no hay nada "adivinable" que comparar aqui — solo se pide
   que la nueva contraseña tenga al menos 6 caracteres y que las dos
   capturas coincidan. */
function modalCambioObligatorio(){
  abrirModal('Bienvenido: crea tu contraseña', `
    <p class="muted">Por seguridad, en tu primer ingreso debes cambiar la contraseña temporal por una personal. Solo tu la conoceras.</p>
    <div class="field" style="margin-top:.8rem"><label>Nueva contraseña (minimo 6 caracteres)</label>
      <input id="cpNueva" type="password" autocomplete="new-password"></div>
    <div class="field" style="margin-top:.6rem"><label>Repite la nueva contraseña</label>
      <input id="cpRepite" type="password" autocomplete="new-password"></div>
    <p id="cpError" class="login-error" hidden></p>
    <div class="modal-foot"><button class="btn btn-gold" id="cpOk" style="width:100%">Guardar mi contraseña</button></div>`,
  body=>{
    // Cierre del modal deshabilitado para forzar el cambio
    document.getElementById('modalClose').style.display='none';
    body.querySelector('#cpOk').addEventListener('click', ()=>cambiarPassword(true));
  });
}
function modalCambioVoluntario(){
  abrirModal('Cambiar mi contraseña', `
    <div class="field"><label>Nueva contraseña (minimo 6 caracteres)</label>
      <input id="cpNueva" type="password" autocomplete="new-password"></div>
    <div class="field" style="margin-top:.6rem"><label>Repite la nueva contraseña</label>
      <input id="cpRepite" type="password" autocomplete="new-password"></div>
    <p id="cpError" class="login-error" hidden></p>
    <div class="modal-foot"><button class="btn btn-outline" id="cpCan">Cancelar</button>
      <button class="btn btn-primary" id="cpOk">Cambiar contraseña</button></div>`,
  body=>{
    body.querySelector('#cpCan').addEventListener('click', cerrarModal);
    body.querySelector('#cpOk').addEventListener('click', ()=>cambiarPassword(false));
  });
}
async function cambiarPassword(obligatorio){
  const $i = id=>document.getElementById(id);
  const nueva = $i('cpNueva').value, rep = $i('cpRepite').value;
  const error = m=>{ const e=$i('cpError'); e.textContent=m; e.hidden=false; };
  if(nueva.length<6){ error('La contraseña debe tener al menos 6 caracteres.'); return; }
  if(nueva!==rep){ error('Las dos contraseñas no coinciden.'); return; }
  $i('cpOk').disabled = true;
  try{
    await usuarioActual.updatePassword(nueva);
    localStorage.setItem('p50_pass_ok_'+usuarioActual.uid, '1');
    document.getElementById('modalClose').style.display='';
    cerrarModal();
    toast('Contraseña actualizada. Usala en tus proximos ingresos.');
  }catch(e){
    const cod = e && e.code || '';
    if(cod.includes('requires-recent-login')){
      error('Por seguridad, vuelve a iniciar sesion y cambia la contraseña enseguida.');
      setTimeout(()=>authFB.signOut(), 2500);
    } else error('No se pudo cambiar. Revisa tu conexion e intenta de nuevo.');
    $i('cpOk').disabled = false;
  }
}

/* ───────── Indicador de sesion en la barra superior ───────── */
function pintarSesion(){
  const z = document.getElementById('sesionInfo'); if(!z) return;
  if(MODO==='local'){
    z.innerHTML = `<span class="tag tag-info" title="Los datos se guardan solo en este navegador">💾 Modo local</span>`;
  } else if(usuarioActual){
    const insignia = esAdmin()
      ? '<span class="tag tag-qr" title="Acceso total">★ Admin</span>'
      : (PERFIL.docenteId
          ? '<span class="tag tag-info" title="Solo tus materias asignadas">Docente</span>'
          : '<span class="tag tag-aviso" title="Tu correo no esta ligado a ningun docente">Sin vincular</span>');
    z.innerHTML = `${insignia}
      <span class="sesion-mail" title="Sesion iniciada">${usuarioActual.email}</span>
      <button class="btn btn-sm btn-outline" id="btnPass" title="Cambiar mi contraseña">🔑</button>
      <button class="btn btn-sm btn-outline" id="btnSalir">Cerrar sesion</button>`;
    document.getElementById('btnPass').addEventListener('click', modalCambioVoluntario);
    document.getElementById('btnSalir').addEventListener('click', ()=>authFB.signOut());
  } else if(modoConsulta){
    z.innerHTML = `<span class="tag tag-info">🔎 Modo consulta</span>
      <button class="btn btn-sm btn-outline" id="btnSalirPortal">Salir</button>`;
    document.getElementById('btnSalirPortal').addEventListener('click', ()=>{
      modoConsulta=false; document.body.classList.remove('solo-portal'); mostrarLogin(); pintarSesion();
    });
  } else z.innerHTML = '';
}
