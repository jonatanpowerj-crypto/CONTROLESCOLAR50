/* ════════════════════════════════════════════════════════════════
   SIGE Prepa 50 — Capa de nube (Firebase)
   - MODO 'nube': Firestore en tiempo real + inicio de sesión.
   - MODO 'local': localStorage, como la versión original.
   La aplicación (app.js) escribe SIEMPRE a través de persist() y
   persistDel(); esta capa decide a dónde van los datos.
   ════════════════════════════════════════════════════════════════ */
'use strict';

let MODO = 'local';
let fsdb = null, authFB = null, usuarioActual = null, modoConsulta = false;
/* Perfil del usuario en sesión: rol y docente vinculado */
let PERFIL = { rol:'admin', docenteId:null, email:null };
const ADMIN_EMAILS = ['jonatan33@uagro.mx'];  // correos con rol de administrador
const PASS_TEMPORAL = 'Prepa50.2026';          // contraseña genérica de primer ingreso
const COLECCIONES = ['docentes','materias','grupos','alumnos','horarios','asistencias','calificaciones'];
let suscrito = false, renderTimer = null;

/* ¿El usuario en sesión es administrador? */
function esAdmin(){ return MODO!=='nube' || PERFIL.rol==='admin'; }

/* IDs de las materias que el docente en sesión puede gestionar.
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

/* Calcula el perfil a partir del correo: admin por lista, o docente
   buscando su correo en el módulo Docentes (campo email). */
function calcularPerfil(email){
  const correo = (email||'').toLowerCase();
  if(ADMIN_EMAILS.includes(correo)) return { rol:'admin', docenteId:null, email:correo };
  const doc = DB.docentes.find(d=>(d.email||'').toLowerCase()===correo);
  return { rol:'docente', docenteId: doc?doc.id:null, email:correo };
}

/* ¿El docente ya pegó su configuración de Firebase? */
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
    try{ fsdb.enablePersistence({synchronizeTabs:true}); }catch(_){ /* varias pestañas: continúa sin caché */ }

    prepararLogin();
    authFB.onAuthStateChanged(u=>{
      usuarioActual = u;
      if(u){                       // docente autenticado
        modoConsulta = false;
        document.body.classList.remove('solo-portal');
        PERFIL = calcularPerfil(u.email);
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

/* ───────── Sincronización en tiempo real ───────── */
function suscribirNube(){
  if(suscrito) return; suscrito = true;
  COLECCIONES.forEach(col=>{
    fsdb.collection(col).onSnapshot(snap=>{
      DB[col] = snap.docs.map(d=>d.data());
      // Al cargar docentes/materias, refrescar el vínculo del docente en sesión
      if((col==='docentes'||col==='materias') && usuarioActual && !esAdmin()){
        PERFIL = calcularPerfil(usuarioActual.email);
      }
      programarRender();
    }, err=>{
      console.warn('Lectura de '+col, err);
      toast('No fue posible leer "'+col+'". Revisa las reglas de Firestore o tu conexión.');
    });
  });
  fsdb.collection('config').doc('plantel').onSnapshot(doc=>{
    if(doc.exists) DB.plantel = {...DB.plantel, ...doc.data()};
    programarRender();
  }, ()=>{});
}

/* Re-dibuja la vista cuando llegan datos de otros dispositivos,
   sin interrumpir al docente (no si está escribiendo, escaneando
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
    lote.commit().catch(()=>toast('Cambio guardado en este equipo; se sincronizará al recuperar conexión.'));
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
   migración de un respaldo local). No borra documentos previos. */
function subirTodoANube(){
  if(MODO!=='nube') { guardarLocal(); return; }
  persistPlantel();
  COLECCIONES.forEach(col=>persist(col, DB[col]));
  toast('Datos enviados a la nube. La sincronización puede tardar unos segundos.');
}

/* ───────── Pantalla de inicio de sesión ───────── */
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
      error(cod.includes('network') ? 'Sin conexión a internet. Intenta de nuevo.'
        : cod.includes('too-many') ? 'Demasiados intentos. Espera unos minutos.'
        : 'Correo o contraseña incorrectos. Las cuentas las crea la dirección del plantel.');
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

/* ───────── Cambio de contraseña ───────── */
function modalCambioObligatorio(){
  abrirModal('Bienvenido: crea tu contraseña', `
    <p class="muted">Por seguridad, en tu primer ingreso debes cambiar la contraseña temporal por una personal. Solo tú la conocerás.</p>
    <div class="field" style="margin-top:.8rem"><label>Nueva contraseña (mínimo 6 caracteres)</label>
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
    <div class="field"><label>Nueva contraseña (mínimo 6 caracteres)</label>
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
  if(nueva===PASS_TEMPORAL){ error('Elige una contraseña distinta a la temporal.'); return; }
  $i('cpOk').disabled = true;
  try{
    await usuarioActual.updatePassword(nueva);
    localStorage.setItem('p50_pass_ok_'+usuarioActual.uid, '1');
    document.getElementById('modalClose').style.display='';
    cerrarModal();
    toast('Contraseña actualizada. Úsala en tus próximos ingresos.');
  }catch(e){
    const cod = e && e.code || '';
    if(cod.includes('requires-recent-login')){
      error('Por seguridad, vuelve a iniciar sesión y cambia la contraseña enseguida.');
      setTimeout(()=>authFB.signOut(), 2500);
    } else error('No se pudo cambiar. Revisa tu conexión e intenta de nuevo.');
    $i('cpOk').disabled = false;
  }
}

/* ───────── Indicador de sesión en la barra superior ───────── */
function pintarSesion(){
  const z = document.getElementById('sesionInfo'); if(!z) return;
  if(MODO==='local'){
    z.innerHTML = `<span class="tag tag-info" title="Los datos se guardan solo en este navegador">💾 Modo local</span>`;
  } else if(usuarioActual){
    const insignia = esAdmin()
      ? '<span class="tag tag-qr" title="Acceso total">★ Admin</span>'
      : (PERFIL.docenteId
          ? '<span class="tag tag-info" title="Solo tus materias asignadas">Docente</span>'
          : '<span class="tag tag-aviso" title="Tu correo no está ligado a ningún docente">Sin vincular</span>');
    z.innerHTML = `${insignia}
      <span class="sesion-mail" title="Sesión iniciada">${usuarioActual.email}</span>
      <button class="btn btn-sm btn-outline" id="btnPass" title="Cambiar mi contraseña">🔑</button>
      <button class="btn btn-sm btn-outline" id="btnSalir">Cerrar sesión</button>`;
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
