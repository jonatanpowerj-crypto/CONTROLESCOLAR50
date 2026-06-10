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
const COLECCIONES = ['docentes','materias','grupos','alumnos','horarios','asistencias','calificaciones'];
let suscrito = false, renderTimer = null;

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
        ocultarLogin(); suscribirNube(); pintarSesion(); render();
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

/* ───────── Indicador de sesión en la barra superior ───────── */
function pintarSesion(){
  const z = document.getElementById('sesionInfo'); if(!z) return;
  if(MODO==='local'){
    z.innerHTML = `<span class="tag tag-info" title="Los datos se guardan solo en este navegador">💾 Modo local</span>`;
  } else if(usuarioActual){
    z.innerHTML = `<span class="sesion-mail" title="Sesión iniciada">👤 ${usuarioActual.email}</span>
      <button class="btn btn-sm btn-outline" id="btnSalir">Cerrar sesión</button>`;
    document.getElementById('btnSalir').addEventListener('click', ()=>authFB.signOut());
  } else if(modoConsulta){
    z.innerHTML = `<span class="tag tag-info">🔎 Modo consulta</span>
      <button class="btn btn-sm btn-outline" id="btnSalirPortal">Salir</button>`;
    document.getElementById('btnSalirPortal').addEventListener('click', ()=>{
      modoConsulta=false; document.body.classList.remove('solo-portal'); mostrarLogin(); pintarSesion();
    });
  } else z.innerHTML = '';
}
