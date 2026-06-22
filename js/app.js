/* ════════════════════════════════════════════════════════════════
   SIGE Prepa 50 · UAGro — Lógica de la aplicación
   Módulos: panel, asistencia (QR + manual), calificaciones por
   rubros, docentes, materias, grupos/alumnos, horarios,
   credenciales QR, portal de consultas y reportes CSV.
   Persistencia: localStorage (clave 'sige_p50').
   ════════════════════════════════════════════════════════════════ */
'use strict';

/* ───────────────────────── 1. ALMACÉN DE DATOS ───────────────────────── */
const CLAVE = 'sige_p50';
const DIAS = ['Lunes','Martes','Miércoles','Jueves','Viernes'];
const ESTADOS = { P:'Presente', R:'Retardo', J:'Justificada', F:'Falta' };

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const hoyISO = () => new Date().toISOString().slice(0,10);

function semilla(){
  const d1=uid(), d2=uid(), d3=uid();
  const m1=uid(), m2=uid(), m3=uid(), m4=uid();
  const g1=uid(), g2=uid();
  const rubrosBase = [
    {nombre:'Examen parcial', peso:40},
    {nombre:'Tareas y trabajos', peso:25},
    {nombre:'Participación', peso:15},
    {nombre:'Proyecto', peso:20},
  ];
  const nombres = [
    ['A1001','Valeria','Hernández Ríos','María Ríos','744-111-0001'],
    ['A1002','Diego','Salgado Mora','Pedro Salgado','744-111-0002'],
    ['A1003','Ximena','Castro Luna','Luisa Luna','744-111-0003'],
    ['A1004','Emiliano','Nava Torres','Jorge Nava','744-111-0004'],
    ['A1005','Renata','Brito Solís','Carmen Solís','744-111-0005'],
    ['A1006','Santiago','Galeana Cruz','Rosa Cruz','744-111-0006'],
  ];
  const nombres2 = [
    ['B2001','Camila','Radilla Ponce','Elena Ponce','744-222-0001'],
    ['B2002','Leonardo','Abarca Vega','Raúl Abarca','744-222-0002'],
    ['B2003','Sofía','Memije Cano','Ana Cano','744-222-0003'],
    ['B2004','Mateo','Justo Adame','Iván Justo','744-222-0004'],
  ];
  return {
    plantel:{nombre:'Preparatoria No. 50', universidad:'Universidad Autónoma de Guerrero',
      ciudad:'Tlacoachistlahuaca, Gro.', ciclo:'2026-A', toleranciaMin:10},
    docentes:[
      {id:d1, nombre:'Mtra. Alejandra Bello Cisneros', email:'abello@uagro.mx', telefono:'744-555-1101', especialidad:'Matemáticas'},
      {id:d2, nombre:'Mtro. Rodrigo Pineda Salmerón', email:'rpineda@uagro.mx', telefono:'744-555-1102', especialidad:'Ciencias Sociales'},
      {id:d3, nombre:'Dra. Karina Otero Figueroa', email:'kotero@uagro.mx', telefono:'744-555-1103', especialidad:'Biología'},
    ],
    materias:[
      {id:m1, clave:'MAT-301', nombre:'Matemáticas III', semestre:3, docenteId:d1, rubros:[...rubrosBase]},
      {id:m2, clave:'HIS-301', nombre:'Historia de México', semestre:3, docenteId:d2, rubros:[...rubrosBase]},
      {id:m3, clave:'BIO-301', nombre:'Biología I', semestre:3, docenteId:d3, rubros:[...rubrosBase]},
      {id:m4, clave:'ORI-101', nombre:'Orientación Educativa', semestre:1, docenteId:d2, rubros:[{nombre:'Asistencia y actitud',peso:50},{nombre:'Actividades',peso:50}]},
    ],
    grupos:[
      {id:g1, nombre:'3° "A"', semestre:3, turno:'Matutino'},
      {id:g2, nombre:'1° "B"', semestre:1, turno:'Vespertino'},
    ],
    alumnos:[
      ...nombres.map(n=>({id:uid(), matricula:n[0], nombre:n[1], apellidos:n[2], grupoId:g1, tutor:n[3], telTutor:n[4], email:''})),
      ...nombres2.map(n=>({id:uid(), matricula:n[0], nombre:n[1], apellidos:n[2], grupoId:g2, tutor:n[3], telTutor:n[4], email:''})),
    ],
    horarios:[
      {id:uid(), materiaId:m1, grupoId:g1, dia:'Lunes',     hi:'07:00', hf:'08:40', aula:'Aula 4'},
      {id:uid(), materiaId:m2, grupoId:g1, dia:'Lunes',     hi:'08:40', hf:'10:20', aula:'Aula 4'},
      {id:uid(), materiaId:m3, grupoId:g1, dia:'Martes',    hi:'07:00', hf:'08:40', aula:'Lab. Biología'},
      {id:uid(), materiaId:m1, grupoId:g1, dia:'Miércoles', hi:'07:00', hf:'08:40', aula:'Aula 4'},
      {id:uid(), materiaId:m2, grupoId:g1, dia:'Jueves',    hi:'10:40', hf:'12:20', aula:'Aula 4'},
      {id:uid(), materiaId:m3, grupoId:g1, dia:'Viernes',   hi:'08:40', hf:'10:20', aula:'Lab. Biología'},
      {id:uid(), materiaId:m4, grupoId:g2, dia:'Lunes',     hi:'16:00', hf:'17:40', aula:'Aula 9'},
      {id:uid(), materiaId:m4, grupoId:g2, dia:'Jueves',    hi:'16:00', hf:'17:40', aula:'Aula 9'},
    ],
    asistencias:[],      // {id, fecha, materiaId, grupoId, alumnoId, estado:'P|R|J|F', metodo:'qr|manual', hora}
    calificaciones:[],   // {id, alumnoId, materiaId, parcial:1|2|3, rubro, valor}
  };
}

function estructuraVacia(){
  return { plantel:{nombre:'Preparatoria No. 50', universidad:'Universidad Autónoma de Guerrero',
      ciudad:'Tlacoachistlahuaca, Gro.', ciclo:'2026-A', toleranciaMin:10},
    docentes:[], materias:[], grupos:[], alumnos:[], horarios:[], asistencias:[], calificaciones:[] };
}
let DB = estructuraVacia();
/* En modo nube la persistencia la hace nube.js; en modo local, este navegador. */
function guardarLocal(){ if(MODO==='local') localStorage.setItem(CLAVE, JSON.stringify(DB)); }

/* Búsquedas frecuentes */
const docente = id => DB.docentes.find(d=>d.id===id);
const materia = id => DB.materias.find(m=>m.id===id);
const grupo   = id => DB.grupos.find(g=>g.id===id);
const alumno  = id => DB.alumnos.find(a=>a.id===id);
const alumnosDeGrupo = gid => DB.alumnos.filter(a=>a.grupoId===gid)
  .sort((a,b)=>(a.apellidos+a.nombre).localeCompare(b.apellidos+b.nombre));
const nombreCompleto = a => `${a.apellidos} ${a.nombre}`;

/* ── Filtrado por rol: lo que el usuario en sesión puede ver ── */
function misMaterias(){
  if(typeof esAdmin!=='function' || esAdmin()) return DB.materias;
  const ids = materiasPermitidas();
  return DB.materias.filter(m=>ids.includes(m.id));
}
function misGrupos(){
  if(typeof esAdmin!=='function' || esAdmin()) return DB.grupos;
  const ids = gruposPermitidos();
  return DB.grupos.filter(g=>ids.includes(g.id));
}
/* Aviso reutilizable cuando el docente no tiene materias asignadas */
function avisoSinAsignacion(){
  return `<div class="vacio card"><span class="icono">📭</span>
    Aún no tienes materias asignadas en el sistema.<br>
    <span class="muted">Pide al administrador que te registre como docente de tus materias en el módulo «Docentes / Materias». En cuanto lo haga, aparecerán aquí automáticamente.</span></div>`;
}

/* ───────────────────────── 2. UTILERÍAS DE INTERFAZ ───────────────────────── */
const $ = s => document.querySelector(s);
const esc = t => String(t ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

let toastTimer;
function toast(msg){
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(()=>t.hidden=true, 2600);
}

function abrirModal(titulo, html, alMontar){
  $('#modalTitle').textContent = titulo;
  $('#modalBody').innerHTML = html;
  $('#modalBackdrop').hidden = false;
  if(alMontar) alMontar($('#modalBody'));
}
function cerrarModal(){ $('#modalBackdrop').hidden = true; detenerLector(); }
$('#modalClose').addEventListener('click', cerrarModal);
$('#modalBackdrop').addEventListener('click', e=>{ if(e.target.id==='modalBackdrop') cerrarModal(); });

function opciones(arr, fmt, sel){
  return arr.map(x=>`<option value="${x.id}" ${x.id===sel?'selected':''}>${esc(fmt(x))}</option>`).join('');
}
function descargarTexto(nombre, contenido, tipo='text/csv'){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\uFEFF'+contenido], {type:tipo+';charset=utf-8'}));
  a.download = nombre; a.click(); URL.revokeObjectURL(a.href);
}

/* ───────────────────────── 3. NAVEGACIÓN ───────────────────────── */
const TITULOS = {
  dashboard:['Panel del día','Tu jornada de un vistazo'],
  asistencia:['Pase de lista','Escáner QR o registro tradicional'],
  calificaciones:['Calificaciones','Captura por rubros ponderados'],
  docentes:['Docentes','Plantilla académica del plantel'],
  materias:['Materias y rubros','Unidades de aprendizaje y criterios de evaluación'],
  grupos:['Grupos y alumnos','Matrícula por grupo'],
  horarios:['Horarios','Carga horaria semanal'],
  credenciales:['Credenciales QR','Gafetes imprimibles con código de asistencia'],
  consultas:['Portal alumnos y padres','Consulta de avance por matrícula'],
  estadisticas:['Estadísticas','Aprobación, asistencia y desempeño por rubros'],
  reportes:['Reportes','Exportación y concentrados'],
};
let vistaActual = 'dashboard';

document.querySelectorAll('.nav-item').forEach(b=>{
  b.addEventListener('click', ()=>{
    document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    vistaActual = b.dataset.view;
    $('#sidebar').classList.remove('abierta');
    render();
  });
});
$('#hamburger').addEventListener('click', ()=>$('#sidebar').classList.toggle('abierta'));

/* ── Modo táctil: objetivos más grandes para pantallas touch ── */
if(localStorage.getItem('p50_tactil')==='1') document.body.classList.add('tactil');
$('#btnTactil').addEventListener('click', ()=>{
  const activo = document.body.classList.toggle('tactil');
  localStorage.setItem('p50_tactil', activo ? '1' : '0');
  toast(activo ? 'Modo táctil activado: botones y textos más grandes.' : 'Modo táctil desactivado.');
});

function render(){
  detenerLector();
  limpiarCharts();
  aplicarPermisosMenu();
  // Si un docente cae en una vista exclusiva del admin, redirigir al panel
  const soloAdmin = ['docentes'];
  if(!esAdmin() && soloAdmin.includes(vistaActual)){
    vistaActual = 'dashboard';
    document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));
    document.querySelector('.nav-item[data-view="dashboard"]')?.classList.add('active');
  }
  const [t,s] = TITULOS[vistaActual];
  $('#viewTitle').textContent = t;
  $('#viewSubtitle').textContent = s;
  VISTAS[vistaActual]($('#content'));
}

/* Oculta del menú lateral los módulos exclusivos del administrador */
function aplicarPermisosMenu(){
  const soloAdmin = ['docentes'];
  document.querySelectorAll('.nav-item').forEach(b=>{
    b.style.display = (!esAdmin() && soloAdmin.includes(b.dataset.view)) ? 'none' : '';
  });
  // Oculta las etiquetas de sección que queden sin botones visibles
  document.querySelectorAll('.nav-label').forEach(lbl=>{
    let vis = false, n = lbl.nextElementSibling;
    while(n && n.classList.contains('nav-item')){ if(n.style.display!=='none'){ vis=true; break; } n=n.nextElementSibling; }
    lbl.style.display = vis ? '' : 'none';
  });
}

$('#topbarDate').textContent = new Date().toLocaleDateString('es-MX',
  {weekday:'long', year:'numeric', month:'long', day:'numeric'});

/* ───────────────────────── 4. PANEL DEL DÍA ───────────────────────── */
function vistaDashboard(el){
  const hoy = hoyISO();
  const diaSemana = new Date().toLocaleDateString('es-MX',{weekday:'long'});
  const diaCap = diaSemana.charAt(0).toUpperCase()+diaSemana.slice(1);
  const midsVis = misMaterias().map(m=>m.id);
  const gidsVis = misGrupos().map(g=>g.id);
  const clasesHoy = DB.horarios.filter(h=>h.dia===diaCap && (esAdmin()||midsVis.includes(h.materiaId))).sort((a,b)=>a.hi.localeCompare(b.hi));
  const alumnosVis = esAdmin() ? DB.alumnos : DB.alumnos.filter(a=>gidsVis.includes(a.grupoId));
  const asisHoy = DB.asistencias.filter(a=>a.fecha===hoy && (esAdmin()||midsVis.includes(a.materiaId)));
  const presentes = asisHoy.filter(a=>a.estado==='P'||a.estado==='R').length;
  const faltas = asisHoy.filter(a=>a.estado==='F').length;

  el.innerHTML = `
  <div class="grid grid-4">
    <div class="card stat"><span class="num">${alumnosVis.length}</span><span class="lbl">${esAdmin()?'Alumnos inscritos':'Alumnos en mis grupos'}</span></div>
    <div class="card stat"><span class="num">${clasesHoy.length}</span><span class="lbl">Clases hoy (${esc(diaCap)})</span></div>
    <div class="card stat gold"><span class="num">${presentes}</span><span class="lbl">Asistencias hoy</span></div>
    <div class="card stat"><span class="num" style="color:var(--mal)">${faltas}</span><span class="lbl">Faltas hoy</span></div>
  </div>

  <div class="grid grid-2" style="margin-top:1rem">
    <div class="card">
      <h3>🗓️ Clases programadas hoy</h3>
      ${clasesHoy.length ? clasesHoy.map(h=>`
        <div class="bloque-clase">
          <strong>${esc(h.hi)}–${esc(h.hf)} · ${esc(materia(h.materiaId)?.nombre || '—')}</strong>
          <span>${esc(grupo(h.grupoId)?.nombre || '')} · ${esc(h.aula)} · ${esc(docente(materia(h.materiaId)?.docenteId)?.nombre || '')}</span>
        </div>`).join('')
      : `<div class="vacio"><span class="icono">🌤️</span>No hay clases registradas para hoy.</div>`}
      <button class="btn btn-primary btn-sm no-print" style="margin-top:.6rem" id="irPase">Iniciar pase de lista →</button>
    </div>

    <div class="card">
      <h3>⚠️ Alumnos con asistencia baja (&lt; 80 %)</h3>
      ${tablaRiesgo()}
    </div>
  </div>

  <div class="card" style="margin-top:1rem">
    <h3>📌 Accesos rápidos</h3>
    <div style="display:flex;gap:.6rem;flex-wrap:wrap">
      ${esAdmin()?'<button class="btn btn-gold" data-go="credenciales">Imprimir credenciales QR</button>':''}
      <button class="btn btn-outline" data-go="calificaciones">Capturar calificaciones</button>
      <button class="btn btn-outline" data-go="asistencia">Pase de lista</button>
      ${esAdmin()?'<button class="btn btn-outline" data-go="reportes">Exportar reportes</button>':''}
      <button class="btn btn-outline" data-go="estadisticas">Ver estadísticas</button>
    </div>
  </div>`;

  $('#irPase')?.addEventListener('click', ()=>navegarA('asistencia'));
  el.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>navegarA(b.dataset.go)));
}
function navegarA(v){
  document.querySelector(`.nav-item[data-view="${v}"]`)?.click();
}
function porcentajeAsistencia(alumnoId, materiaId=null){
  let regs = DB.asistencias.filter(a=>a.alumnoId===alumnoId);
  if(materiaId) regs = regs.filter(a=>a.materiaId===materiaId);
  if(!regs.length) return null;
  const ok = regs.filter(a=>a.estado==='P'||a.estado==='R'||a.estado==='J').length;
  return Math.round(ok/regs.length*100);
}
function tablaRiesgo(){
  const gidsVis = misGrupos().map(g=>g.id);
  const universo = esAdmin() ? DB.alumnos : DB.alumnos.filter(a=>gidsVis.includes(a.grupoId));
  const filas = universo.map(a=>({a, p:porcentajeAsistencia(a.id)}))
    .filter(x=>x.p!==null && x.p<80).sort((x,y)=>x.p-y.p).slice(0,6);
  if(!filas.length) return `<div class="vacio"><span class="icono">✅</span>Sin alumnos en riesgo por inasistencia.</div>`;
  return `<div class="table-wrap"><table><thead><tr><th>Alumno</th><th>Grupo</th><th>Asistencia</th></tr></thead><tbody>
    ${filas.map(({a,p})=>`<tr><td>${esc(nombreCompleto(a))}</td><td>${esc(grupo(a.grupoId)?.nombre||'')}</td>
    <td><span class="tag tag-mal">${p} %</span></td></tr>`).join('')}</tbody></table></div>`;
}

/* ───────────────────────── 5. PASE DE LISTA (QR + MANUAL) ───────────────────────── */
let lectorQR = null;
let sesionPase = { fecha:hoyISO(), materiaId:null, grupoId:null, modo:'manual' };

function detenerLector(){
  if(lectorQR){
    lectorQR.stop().catch(()=>{}).finally(()=>{ try{lectorQR.clear();}catch(e){} lectorQR=null; });
  }
}

function vistaAsistencia(el){
  const matsVis = misMaterias(), grusVis = misGrupos();
  if(!matsVis.length){ el.innerHTML = avisoSinAsignacion(); return; }
  if(!sesionPase.materiaId || !matsVis.some(m=>m.id===sesionPase.materiaId)) sesionPase.materiaId = matsVis[0]?.id || null;
  if(!sesionPase.grupoId || !grusVis.some(g=>g.id===sesionPase.grupoId))   sesionPase.grupoId   = grusVis[0]?.id || null;

  el.innerHTML = `
  <div class="card no-print">
    <div class="pase-head">
      <div class="field"><label>Fecha</label><input type="date" id="paseFecha" value="${sesionPase.fecha}"></div>
      <div class="field"><label>Materia</label>
        <select id="paseMateria">${opciones(matsVis, m=>`${m.clave} · ${m.nombre}`, sesionPase.materiaId)}</select></div>
      <div class="field"><label>Grupo</label>
        <select id="paseGrupo">${opciones(grusVis, g=>`${g.nombre} (${g.turno})`, sesionPase.grupoId)}</select></div>
      <div class="field"><label>Modo de registro</label>
        <div class="modo-switch">
          <button id="modoManual" class="${sesionPase.modo==='manual'?'on':''}">✍️ Tradicional</button>
          <button id="modoQR" class="${sesionPase.modo==='qr'?'on':''}">📷 Escáner QR</button>
        </div></div>
      <div class="spacer"></div>
      <button class="btn btn-outline" id="abrirKiosko" title="Pantalla fija para que los alumnos se auto-registren">🖥️ Modo kiosco</button>
      <button class="btn btn-gold" id="marcarTodosP" title="Marca presente a quien no tenga registro">Todos presentes</button>
    </div>
  </div>
  <div id="paseZona" style="margin-top:1rem"></div>`;

  const refrescar = ()=>{
    sesionPase.fecha = $('#paseFecha').value;
    sesionPase.materiaId = $('#paseMateria').value;
    sesionPase.grupoId = $('#paseGrupo').value;
    pintarZonaPase();
  };
  ['paseFecha','paseMateria','paseGrupo'].forEach(id=>$('#'+id).addEventListener('change', refrescar));
  $('#modoManual').addEventListener('click', ()=>{ sesionPase.modo='manual'; render(); });
  $('#modoQR').addEventListener('click', ()=>{ sesionPase.modo='qr'; render(); });
  $('#marcarTodosP').addEventListener('click', ()=>{
    alumnosDeGrupo(sesionPase.grupoId).forEach(a=>{
      if(!registroDe(a.id)) marcarAsistencia(a.id,'P','manual');
    });
    pintarZonaPase(); toast('Grupo marcado como presente.');
  });
  $('#abrirKiosko').addEventListener('click', abrirKiosko);

  pintarZonaPase();
  if(sesionPase.modo==='qr') iniciarLector();
}

const registroDe = alumnoId => DB.asistencias.find(a =>
  a.fecha===sesionPase.fecha && a.materiaId===sesionPase.materiaId &&
  a.grupoId===sesionPase.grupoId && a.alumnoId===alumnoId);

function marcarAsistencia(alumnoId, estado, metodo){
  let r = registroDe(alumnoId);
  const hora = new Date().toTimeString().slice(0,5);
  if(r){ r.estado=estado; r.metodo=metodo; r.hora=hora; }
  else { r = {id:uid(), fecha:sesionPase.fecha, materiaId:sesionPase.materiaId,
    grupoId:sesionPase.grupoId, alumnoId, estado, metodo, hora};
    DB.asistencias.push(r); }
  persist('asistencias', r);
}

function pintarZonaPase(){
  const zona = $('#paseZona'); if(!zona) return;
  const lista = alumnosDeGrupo(sesionPase.grupoId);

  const filaAlumno = a=>{
    const r = registroDe(a.id);
    return `<tr>
      <td class="mono">${esc(a.matricula)}</td>
      <td>${esc(nombreCompleto(a))}</td>
      <td>${r ? `<span class="tag ${r.estado==='P'?'tag-ok':r.estado==='F'?'tag-mal':r.estado==='R'?'tag-aviso':'tag-info'}">${ESTADOS[r.estado]}</span>
              ${r.metodo==='qr'?'<span class="tag tag-qr">QR</span>':''} <small class="muted">${esc(r.hora||'')}</small>` : '<span class="muted">Sin registro</span>'}</td>
      <td><div class="estado-botones">
        ${['P','R','J','F'].map(e=>`<button data-al="${a.id}" data-est="${e}"
          class="${r&&r.estado===e?'sel-'+e:''}" title="${ESTADOS[e]}">${e}</button>`).join('')}
      </div></td></tr>`;
  };

  const tabla = `<div class="card"><h3>Lista del grupo ${esc(grupo(sesionPase.grupoId)?.nombre||'')} — ${esc(materia(sesionPase.materiaId)?.nombre||'')}</h3>
    ${lista.length ? `<div class="table-wrap"><table><thead><tr><th>Matrícula</th><th>Alumno</th><th>Estado</th><th>Marcar</th></tr></thead>
    <tbody>${lista.map(filaAlumno).join('')}</tbody></table></div>`
    : '<div class="vacio"><span class="icono">🪶</span>Este grupo aún no tiene alumnos.</div>'}</div>`;

  if(sesionPase.modo==='qr'){
    zona.innerHTML = `
    <div class="lector-zona">
      <div class="card">
        <h3>📷 Escáner de credenciales</h3>
        <p class="muted" style="margin-bottom:.6rem">Apunta la cámara al QR de la credencial del alumno. El registro es automático; si llega después de la tolerancia (${DB.plantel.toleranciaMin} min) puedes cambiarlo a Retardo en la lista.</p>
        <div id="qrReader"></div>
        <p class="muted" style="margin-top:.5rem">Si la cámara no inicia, revisa los permisos del navegador o usa el modo tradicional.</p>
      </div>
      <div>${tabla}</div>
    </div>`;
  } else {
    zona.innerHTML = tabla;
  }

  zona.querySelectorAll('.estado-botones button').forEach(b=>{
    b.addEventListener('click', ()=>{
      marcarAsistencia(b.dataset.al, b.dataset.est, 'manual');
      pintarZonaPase();
    });
  });
}

let ultimoQR = {texto:'', t:0};
function iniciarLector(){
  if(typeof Html5Qrcode === 'undefined'){ toast('La librería de QR no cargó. Verifica tu conexión.'); return; }
  detenerLector();
  lectorQR = new Html5Qrcode('qrReader');
  lectorQR.start({facingMode:'environment'}, {fps:10, qrbox:{width:220,height:220}},
    texto=>{
      const ahora = Date.now();
      if(texto===ultimoQR.texto && ahora-ultimoQR.t<2500) return;  // evita lecturas dobles
      ultimoQR = {texto, t:ahora};
      procesarQR(texto);
    }, ()=>{} )
  .catch(()=>{ toast('No fue posible acceder a la cámara.'); });
}
function procesarQR(texto){
  // Formato esperado: P50|MATRICULA
  const m = /^P50\|(.+)$/.exec(texto.trim());
  if(!m){ toast('Código no reconocido por el sistema.'); return; }
  const al = DB.alumnos.find(a=>a.matricula===m[1]);
  if(!al){ toast(`Matrícula ${m[1]} no encontrada.`); return; }
  if(al.grupoId!==sesionPase.grupoId){ toast(`${nombreCompleto(al)} pertenece a otro grupo.`); return; }
  marcarAsistencia(al.id, 'P', 'qr');
  toast(`✅ ${nombreCompleto(al)} — presente`);
  pintarZonaPase();
}

/* ───────────────────────── 6. CALIFICACIONES POR RUBROS ───────────────────────── */
let sesionCal = { materiaId:null, grupoId:null, parcial:1 };

function vistaCalificaciones(el){
  const matsVis = misMaterias(), grusVis = misGrupos();
  if(!matsVis.length){ el.innerHTML = avisoSinAsignacion(); return; }
  if(!sesionCal.materiaId || !matsVis.some(m=>m.id===sesionCal.materiaId)) sesionCal.materiaId = matsVis[0]?.id;
  if(!sesionCal.grupoId || !grusVis.some(g=>g.id===sesionCal.grupoId))   sesionCal.grupoId   = grusVis[0]?.id;

  el.innerHTML = `
  <div class="card">
    <div class="toolbar">
      <div class="field"><label>Materia</label>
        <select id="calMateria">${opciones(matsVis, m=>`${m.clave} · ${m.nombre}`, sesionCal.materiaId)}</select></div>
      <div class="field"><label>Grupo</label>
        <select id="calGrupo">${opciones(grusVis, g=>g.nombre, sesionCal.grupoId)}</select></div>
      <div class="field"><label>Parcial</label>
        <select id="calParcial">${[1,2,3].map(p=>`<option value="${p}" ${p===sesionCal.parcial?'selected':''}>Parcial ${p}</option>`).join('')}</select></div>
      <div class="spacer"></div>
      <button class="btn btn-primary" id="guardarCal">💾 Guardar captura</button>
    </div>
    <div id="calZona"></div>
  </div>`;

  const ref = ()=>{ sesionCal.materiaId=$('#calMateria').value; sesionCal.grupoId=$('#calGrupo').value;
    sesionCal.parcial=+$('#calParcial').value; pintarCal(); };
  ['calMateria','calGrupo','calParcial'].forEach(id=>$('#'+id).addEventListener('change', ref));
  $('#guardarCal').addEventListener('click', guardarCalificaciones);
  pintarCal();
}

const califDe = (alumnoId, rubro) => DB.calificaciones.find(c =>
  c.alumnoId===alumnoId && c.materiaId===sesionCal.materiaId && c.parcial===sesionCal.parcial && c.rubro===rubro);

function pintarCal(){
  const mat = materia(sesionCal.materiaId);
  const lista = alumnosDeGrupo(sesionCal.grupoId);
  const zona = $('#calZona');
  if(!mat || !lista.length){ zona.innerHTML = '<div class="vacio"><span class="icono">🧮</span>Selecciona una materia y un grupo con alumnos.</div>'; return; }
  const sumaPesos = mat.rubros.reduce((s,r)=>s+(+r.peso||0),0);

  zona.innerHTML = `
  ${sumaPesos!==100?`<p class="tag tag-aviso" style="margin-bottom:.6rem">Atención: los rubros de esta materia suman ${sumaPesos} % (deberían sumar 100 %). Ajusta los pesos en «Materias y rubros».</p>`:''}
  <div class="table-wrap"><table id="tablaCal"><thead><tr>
    <th>Alumno</th>${mat.rubros.map(r=>`<th>${esc(r.nombre)}<br><small>${r.peso} %</small></th>`).join('')}
    <th>Promedio<br><small>ponderado</small></th></tr></thead>
  <tbody>
  ${lista.map(a=>`<tr data-al="${a.id}">
    <td>${esc(nombreCompleto(a))}</td>
    ${mat.rubros.map(r=>{
      const c = califDe(a.id, r.nombre);
      return `<td><input type="number" min="0" max="10" step="0.1" data-rubro="${esc(r.nombre)}"
        value="${c?c.valor:''}" style="width:70px;padding:.3rem;border:1.5px solid var(--gris-300);border-radius:6px"></td>`;
    }).join('')}
    <td class="mono prom">—</td></tr>`).join('')}
  </tbody></table></div>`;

  const calcular = tr=>{
    let suma=0, pesos=0;
    tr.querySelectorAll('input').forEach(inp=>{
      const peso = mat.rubros.find(r=>r.nombre===inp.dataset.rubro)?.peso||0;
      if(inp.value!==''){ suma += (+inp.value)*peso; pesos += +peso; }
    });
    const celda = tr.querySelector('.prom');
    if(pesos>0){ const p=(suma/pesos); celda.textContent=p.toFixed(1);
      celda.style.color = p>=6?'var(--ok)':'var(--mal)'; celda.style.fontWeight='700'; }
    else celda.textContent='—';
  };
  zona.querySelectorAll('tbody tr').forEach(tr=>{
    calcular(tr);
    tr.querySelectorAll('input').forEach(i=>i.addEventListener('input',()=>calcular(tr)));
  });
}
function guardarCalificaciones(){
  const cambiadas = [], borradas = [];
  document.querySelectorAll('#tablaCal tbody tr').forEach(tr=>{
    const alumnoId = tr.dataset.al;
    tr.querySelectorAll('input').forEach(inp=>{
      const rubro = inp.dataset.rubro;
      const existente = califDe(alumnoId, rubro);
      if(inp.value===''){
        if(existente){ borradas.push(existente.id);
          DB.calificaciones = DB.calificaciones.filter(c=>c!==existente); }
        return;
      }
      const valor = Math.min(10, Math.max(0, +inp.value));
      if(existente){ if(existente.valor!==valor){ existente.valor = valor; cambiadas.push(existente); } }
      else { const n = {id:uid(), alumnoId, materiaId:sesionCal.materiaId, parcial:sesionCal.parcial, rubro, valor};
        DB.calificaciones.push(n); cambiadas.push(n); }
    });
  });
  if(cambiadas.length) persist('calificaciones', cambiadas);
  if(borradas.length) persistDel('calificaciones', borradas);
  if(!cambiadas.length && !borradas.length) guardarLocal();
  toast('Calificaciones guardadas.');
}

/* ───────────────────────── 7. DOCENTES ───────────────────────── */
function vistaDocentes(el){
  el.innerHTML = `
  <div class="toolbar">
    <input class="search" id="busDoc" placeholder="Buscar docente…">
    <div class="spacer"></div>
    <button class="btn btn-primary" id="nuevoDoc">＋ Registrar docente</button>
  </div>
  <div id="listaDoc"></div>`;

  const pintar = ()=>{
    const q = ($('#busDoc').value||'').toLowerCase();
    const lista = DB.docentes.filter(d=>(d.nombre+d.especialidad).toLowerCase().includes(q));
    $('#listaDoc').innerHTML = lista.length ? `<div class="table-wrap"><table>
      <thead><tr><th>Nombre</th><th>Especialidad</th><th>Correo</th><th>Teléfono</th><th>Materias</th><th></th></tr></thead><tbody>
      ${lista.map(d=>`<tr><td><strong>${esc(d.nombre)}</strong></td><td>${esc(d.especialidad)}</td>
        <td class="mono">${esc(d.email)}</td><td class="mono">${esc(d.telefono)}</td>
        <td>${DB.materias.filter(m=>m.docenteId===d.id).map(m=>`<span class="tag tag-info">${esc(m.clave)}</span>`).join(' ')||'—'}</td>
        <td><button class="btn btn-sm btn-outline" data-ed="${d.id}">Editar</button>
            <button class="btn btn-sm btn-danger" data-el="${d.id}">Baja</button></td></tr>`).join('')}
      </tbody></table></div>`
      : '<div class="vacio"><span class="icono">👩‍🏫</span>Sin docentes registrados. Usa «Registrar docente».</div>';
    $('#listaDoc').querySelectorAll('[data-ed]').forEach(b=>b.addEventListener('click',()=>formDocente(b.dataset.ed)));
    $('#listaDoc').querySelectorAll('[data-el]').forEach(b=>b.addEventListener('click',()=>{
      if(!confirm('¿Dar de baja a este docente?')) return;
      const did = b.dataset.el;
      DB.docentes = DB.docentes.filter(d=>d.id!==did);
      persistDel('docentes', did);
      const afectadas = DB.materias.filter(m=>m.docenteId===did);
      afectadas.forEach(m=>m.docenteId=null);
      if(afectadas.length) persist('materias', afectadas);
      pintar(); toast('Docente dado de baja.');
    }));
  };
  $('#busDoc').addEventListener('input', pintar);
  $('#nuevoDoc').addEventListener('click', ()=>formDocente(null));
  pintar();
}
function formDocente(id){
  const d = id ? docente(id) : {nombre:'',email:'',telefono:'',especialidad:''};
  abrirModal(id?'Editar docente':'Registrar docente', `
    <div class="form-grid">
      <div class="field full"><label>Nombre completo *</label><input id="fNombre" value="${esc(d.nombre)}"></div>
      <div class="field"><label>Especialidad</label><input id="fEsp" value="${esc(d.especialidad)}"></div>
      <div class="field"><label>Teléfono</label><input id="fTel" value="${esc(d.telefono)}"></div>
      <div class="field full"><label>Correo institucional <span class="muted">(será su acceso al sistema)</span></label><input id="fMail" type="email" value="${esc(d.email)}" placeholder="docente@uagro.mx"></div>
    </div>
    <p class="muted" style="font-size:.78rem">💡 Este correo debe coincidir con la cuenta que se le cree en Firebase para que el docente vea solo sus materias asignadas.</p>
    <div class="modal-foot"><button class="btn btn-outline" id="fCancel">Cancelar</button>
    <button class="btn btn-primary" id="fOk">Guardar docente</button></div>`,
  body=>{
    body.querySelector('#fCancel').addEventListener('click', cerrarModal);
    body.querySelector('#fOk').addEventListener('click', ()=>{
      const nombre = body.querySelector('#fNombre').value.trim();
      if(!nombre){ toast('El nombre es obligatorio.'); return; }
      const datos = {nombre, especialidad:body.querySelector('#fEsp').value.trim(),
        telefono:body.querySelector('#fTel').value.trim(), email:body.querySelector('#fMail').value.trim()};
      let obj;
      if(id){ obj = docente(id); Object.assign(obj, datos); }
      else { obj = {id:uid(), ...datos}; DB.docentes.push(obj); }
      persist('docentes', obj);
      cerrarModal(); render(); toast('Docente guardado.');
    });
  });
}

/* ───────────────────────── 8. MATERIAS Y RUBROS ───────────────────────── */
function vistaMaterias(el){
  el.innerHTML = `
  <div class="toolbar">
    <input class="search" id="busMat" placeholder="Buscar materia…">
    <div class="spacer"></div>
    <button class="btn btn-primary" id="nuevaMat">＋ Nueva materia</button>
  </div>
  <div id="listaMat" class="grid grid-2"></div>`;

  const pintar = ()=>{
    const q = ($('#busMat').value||'').toLowerCase();
    const lista = misMaterias().filter(m=>(m.nombre+m.clave).toLowerCase().includes(q));
    $('#listaMat').innerHTML = lista.length ? lista.map(m=>`
      <div class="card">
        <div style="display:flex;justify-content:space-between;gap:.5rem;align-items:start">
          <div><h3>${esc(m.nombre)}</h3>
            <p class="muted mono">${esc(m.clave)} · Semestre ${m.semestre}</p>
            <p class="muted">Docente: <strong>${esc(docente(m.docenteId)?.nombre || 'Sin asignar')}</strong></p></div>
          <div style="display:flex;gap:.3rem;flex-direction:column">
            <button class="btn btn-sm btn-outline" data-ed="${m.id}">Editar</button>
            <button class="btn btn-sm btn-danger" data-el="${m.id}">Eliminar</button></div>
        </div>
        <div style="margin-top:.6rem">
          ${m.rubros.map(r=>`<span class="tag tag-info" style="margin:.1rem">${esc(r.nombre)} · ${r.peso} %</span>`).join(' ')}
          ${m.rubros.reduce((s,r)=>s+(+r.peso||0),0)!==100?'<span class="tag tag-aviso">Pesos ≠ 100 %</span>':''}
        </div>
      </div>`).join('')
    : (typeof esAdmin==='function' && !esAdmin()
        ? avisoSinAsignacion()
        : '<div class="vacio card"><span class="icono">📚</span>Sin materias registradas.</div>');

    $('#listaMat').querySelectorAll('[data-ed]').forEach(b=>b.addEventListener('click',()=>formMateria(b.dataset.ed)));
    $('#listaMat').querySelectorAll('[data-el]').forEach(b=>b.addEventListener('click',()=>{
      if(!confirm('Eliminar la materia también elimina sus horarios. ¿Continuar?')) return;
      const mid = b.dataset.el;
      const hids = DB.horarios.filter(h=>h.materiaId===mid).map(h=>h.id);
      DB.materias = DB.materias.filter(m=>m.id!==mid);
      DB.horarios = DB.horarios.filter(h=>h.materiaId!==mid);
      persistDel('materias', mid);
      if(hids.length) persistDel('horarios', hids);
      pintar(); toast('Materia eliminada.');
    }));
  };
  $('#busMat').addEventListener('input', pintar);
  $('#nuevaMat').addEventListener('click', ()=>formMateria(null));
  pintar();
}
function formMateria(id){
  const m = id ? materia(id) : {clave:'',nombre:'',semestre:1,docenteId:'',rubros:[{nombre:'Examen parcial',peso:40},{nombre:'Tareas y trabajos',peso:30},{nombre:'Participación',peso:30}]};
  const filaRubro = (r,i)=>`<tr>
    <td><input value="${esc(r.nombre)}" data-i="${i}" data-k="nombre" style="width:100%;padding:.3rem;border:1.5px solid var(--gris-300);border-radius:6px"></td>
    <td><input type="number" min="0" max="100" value="${r.peso}" data-i="${i}" data-k="peso" style="width:80px;padding:.3rem;border:1.5px solid var(--gris-300);border-radius:6px"></td>
    <td><button class="btn btn-sm btn-danger" data-del="${i}">✕</button></td></tr>`;
  let rubros = m.rubros.map(r=>({...r}));

  abrirModal(id?'Editar materia':'Nueva materia', `
    <div class="form-grid">
      <div class="field"><label>Clave *</label><input id="fClave" value="${esc(m.clave)}" placeholder="MAT-301"></div>
      <div class="field"><label>Semestre</label>
        <select id="fSem">${[1,2,3,4,5,6].map(s=>`<option ${s===m.semestre?'selected':''}>${s}</option>`).join('')}</select></div>
      <div class="field full"><label>Nombre de la materia *</label><input id="fNom" value="${esc(m.nombre)}"></div>
      ${(typeof esAdmin==='function' && !esAdmin())
        ? `<input type="hidden" id="fDoc" value="${esc(m.docenteId || (typeof PERFIL!=='undefined'?PERFIL.docenteId:'') || '')}">`
        : `<div class="field full"><label>Docente responsable</label>
        <select id="fDoc"><option value="">Sin asignar</option>${opciones(DB.docentes, d=>d.nombre, m.docenteId)}</select></div>`}
    </div>
    <h3 style="margin:1rem 0 .4rem">Rubros de evaluación <span class="muted" id="sumaRubros"></span></h3>
    <div class="table-wrap"><table><thead><tr><th>Rubro</th><th>Peso %</th><th></th></tr></thead>
      <tbody id="tbRubros"></tbody></table></div>
    <button class="btn btn-sm btn-outline" id="addRubro" style="margin-top:.5rem">＋ Agregar rubro</button>
    <div class="modal-foot"><button class="btn btn-outline" id="fCancel">Cancelar</button>
    <button class="btn btn-primary" id="fOk">Guardar materia</button></div>`,
  body=>{
    const pintarRubros = ()=>{
      body.querySelector('#tbRubros').innerHTML = rubros.map(filaRubro).join('');
      const suma = rubros.reduce((s,r)=>s+(+r.peso||0),0);
      body.querySelector('#sumaRubros').textContent = `— suma actual: ${suma} %`;
      body.querySelectorAll('#tbRubros input').forEach(inp=>inp.addEventListener('input',()=>{
        rubros[+inp.dataset.i][inp.dataset.k] = inp.dataset.k==='peso' ? +inp.value : inp.value;
        body.querySelector('#sumaRubros').textContent = `— suma actual: ${rubros.reduce((s,r)=>s+(+r.peso||0),0)} %`;
      }));
      body.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{
        rubros.splice(+b.dataset.del,1); pintarRubros();
      }));
    };
    pintarRubros();
    body.querySelector('#addRubro').addEventListener('click',()=>{ rubros.push({nombre:'',peso:0}); pintarRubros(); });
    body.querySelector('#fCancel').addEventListener('click', cerrarModal);
    body.querySelector('#fOk').addEventListener('click', ()=>{
      const clave = body.querySelector('#fClave').value.trim();
      const nombre = body.querySelector('#fNom').value.trim();
      if(!clave || !nombre){ toast('Clave y nombre son obligatorios.'); return; }
      const esDocente = (typeof esAdmin==='function' && !esAdmin());
      const docId = body.querySelector('#fDoc').value || null;
      if(esDocente && !docId){
        toast('Tu cuenta aún no está vinculada como docente. Pide al administrador que registre tu correo en el módulo Docentes.');
        return;
      }
      rubros = rubros.filter(r=>r.nombre.trim());
      const datos = {clave, nombre, semestre:+body.querySelector('#fSem').value,
        docenteId: docId, rubros};
      let obj;
      if(id){ obj = materia(id); Object.assign(obj, datos); }
      else { obj = {id:uid(), ...datos}; DB.materias.push(obj); }
      persist('materias', obj);
      cerrarModal(); render(); toast('Materia guardada.');
    });
  });
}

/* ───────────────────────── 9. GRUPOS Y ALUMNOS ───────────────────────── */
let grupoSel = null;
function vistaGrupos(el){
  const grusVis = misGrupos();
  const admin = (typeof esAdmin==='function') ? esAdmin() : true;
  if(!admin && !grusVis.length){ el.innerHTML = avisoSinAsignacion(); return; }
  if(!grupoSel || !grusVis.some(g=>g.id===grupoSel)) grupoSel = grusVis[0]?.id || null;
  el.innerHTML = `
  ${!admin?'<p class="muted" style="margin-bottom:.8rem">Ves los grupos donde impartes clase. La inscripción y baja de alumnos la gestiona la administración del plantel; tú llevas su asistencia y calificaciones.</p>':''}
  <div class="toolbar">
    <div class="field"><label>Grupo</label>
      <select id="selGrupo">${opciones(grusVis, g=>`${g.nombre} · ${g.turno} (sem. ${g.semestre})`, grupoSel)}</select></div>
    ${admin?`<button class="btn btn-outline" id="nuevoGrupo">＋ Grupo</button>
    <button class="btn btn-danger btn-sm" id="bajaGrupo">Eliminar grupo</button>
    <div class="spacer"></div>
    <button class="btn btn-gold" id="impExcel">⬆ Importar desde Excel</button>
    <button class="btn btn-primary" id="nuevoAl">＋ Inscribir alumno</button>`:'<div class="spacer"></div>'}
  </div>
  <div id="listaAl"></div>`;

  $('#selGrupo').addEventListener('change', e=>{ grupoSel=e.target.value; pintar(); });
  if(admin){
  $('#nuevoGrupo').addEventListener('click', ()=>{
    abrirModal('Nuevo grupo', `
      <div class="form-grid">
        <div class="field"><label>Nombre *</label><input id="gNom" placeholder='2° "C"'></div>
        <div class="field"><label>Semestre</label>
          <select id="gSem">${[1,2,3,4,5,6].map(s=>`<option>${s}</option>`).join('')}</select></div>
        <div class="field full"><label>Turno</label>
          <select id="gTur"><option>Matutino</option><option>Vespertino</option></select></div>
      </div>
      <div class="modal-foot"><button class="btn btn-outline" id="gCan">Cancelar</button>
      <button class="btn btn-primary" id="gOk">Crear grupo</button></div>`,
    body=>{
      body.querySelector('#gCan').addEventListener('click', cerrarModal);
      body.querySelector('#gOk').addEventListener('click', ()=>{
        const nombre = body.querySelector('#gNom').value.trim();
        if(!nombre){ toast('Escribe el nombre del grupo.'); return; }
        const g = {id:uid(), nombre, semestre:+body.querySelector('#gSem').value, turno:body.querySelector('#gTur').value};
        DB.grupos.push(g); grupoSel = g.id;
        persist('grupos', g);
        cerrarModal(); render(); toast('Grupo creado.');
      });
    });
  });
  $('#bajaGrupo').addEventListener('click', ()=>{
    if(!grupoSel) return;
    if(alumnosDeGrupo(grupoSel).length){ toast('Primero da de baja o reasigna a sus alumnos.'); return; }
    if(!confirm('¿Eliminar este grupo y sus horarios?')) return;
    const hids = DB.horarios.filter(h=>h.grupoId===grupoSel).map(h=>h.id);
    DB.horarios = DB.horarios.filter(h=>h.grupoId!==grupoSel);
    DB.grupos = DB.grupos.filter(g=>g.id!==grupoSel);
    persistDel('grupos', grupoSel);
    if(hids.length) persistDel('horarios', hids);
    grupoSel = DB.grupos[0]?.id || null;
    render(); toast('Grupo eliminado.');
  });
  $('#nuevoAl').addEventListener('click', ()=>formAlumno(null));
  $('#impExcel').addEventListener('click', modalImportarExcel);
  } // fin if(admin)

  const pintar = ()=>{
    const lista = alumnosDeGrupo(grupoSel);
    $('#listaAl').innerHTML = lista.length ? `<div class="table-wrap"><table>
      <thead><tr><th>Matrícula</th><th>Alumno</th><th>Padre / tutor</th><th>Tel. tutor</th><th>Asistencia global</th>${admin?'<th></th>':''}</tr></thead><tbody>
      ${lista.map(a=>{
        const p = porcentajeAsistencia(a.id);
        return `<tr><td class="mono">${esc(a.matricula)}</td><td><strong>${esc(nombreCompleto(a))}</strong></td>
        <td>${esc(a.tutor||'—')}</td><td class="mono">${esc(a.telTutor||'—')}</td>
        <td>${p===null?'<span class="muted">Sin registros</span>':`<span class="tag ${p>=80?'tag-ok':'tag-mal'}">${p} %</span>`}</td>
        ${admin?`<td><button class="btn btn-sm btn-outline" data-ed="${a.id}">Editar</button>
            <button class="btn btn-sm btn-danger" data-el="${a.id}">Baja</button></td>`:''}</tr>`;}).join('')}
      </tbody></table></div>`
    : '<div class="vacio card"><span class="icono">🎓</span>Este grupo aún no tiene alumnos inscritos.</div>';

    if(admin){
    $('#listaAl').querySelectorAll('[data-ed]').forEach(b=>b.addEventListener('click',()=>formAlumno(b.dataset.ed)));
    $('#listaAl').querySelectorAll('[data-el]').forEach(b=>b.addEventListener('click',()=>{
      if(!confirm('¿Dar de baja al alumno? Se conservará su historial.')) return;
      DB.alumnos = DB.alumnos.filter(a=>a.id!==b.dataset.el);
      persistDel('alumnos', b.dataset.el);
      pintar(); toast('Alumno dado de baja.');
    }));
    }
  };
  pintar();
}
function formAlumno(id){
  const a = id ? alumno(id) : {matricula:'',nombre:'',apellidos:'',grupoId:grupoSel,tutor:'',telTutor:'',email:''};
  abrirModal(id?'Editar alumno':'Inscribir alumno', `
    <div class="form-grid">
      <div class="field"><label>Matrícula *</label><input id="aMat" class="mono" value="${esc(a.matricula)}" placeholder="A1234"></div>
      <div class="field"><label>Grupo</label>
        <select id="aGru">${opciones(DB.grupos, g=>g.nombre, a.grupoId)}</select></div>
      <div class="field"><label>Nombre(s) *</label><input id="aNom" value="${esc(a.nombre)}"></div>
      <div class="field"><label>Apellidos *</label><input id="aApe" value="${esc(a.apellidos)}"></div>
      <div class="field"><label>Padre / tutor</label><input id="aTut" value="${esc(a.tutor)}"></div>
      <div class="field"><label>Tel. del tutor</label><input id="aTelT" value="${esc(a.telTutor)}"></div>
      <div class="field full"><label>Correo (opcional)</label><input id="aMail" value="${esc(a.email)}"></div>
    </div>
    <div class="modal-foot"><button class="btn btn-outline" id="aCan">Cancelar</button>
    <button class="btn btn-primary" id="aOk">Guardar alumno</button></div>`,
  body=>{
    body.querySelector('#aCan').addEventListener('click', cerrarModal);
    body.querySelector('#aOk').addEventListener('click', ()=>{
      const matricula = body.querySelector('#aMat').value.trim().toUpperCase();
      const nombre = body.querySelector('#aNom').value.trim();
      const apellidos = body.querySelector('#aApe').value.trim();
      if(!matricula || !nombre || !apellidos){ toast('Matrícula, nombre y apellidos son obligatorios.'); return; }
      const duplicada = DB.alumnos.find(x=>x.matricula===matricula && x.id!==id);
      if(duplicada){ toast('Esa matrícula ya está registrada.'); return; }
      const datos = {matricula, nombre, apellidos, grupoId:body.querySelector('#aGru').value,
        tutor:body.querySelector('#aTut').value.trim(), telTutor:body.querySelector('#aTelT').value.trim(),
        email:body.querySelector('#aMail').value.trim()};
      let obj;
      if(id){ obj = alumno(id); Object.assign(obj, datos); }
      else { obj = {id:uid(), ...datos}; DB.alumnos.push(obj); }
      persist('alumnos', obj);
      cerrarModal(); render(); toast('Alumno guardado.');
    });
  });
}

/* ───────────────────────── 10. HORARIOS ───────────────────────── */
let horGrupo = null;
function vistaHorarios(el){
  const grusVis = misGrupos(), matsVis = misMaterias();
  if(typeof esAdmin==='function' && !esAdmin() && !matsVis.length){ el.innerHTML = avisoSinAsignacion(); return; }
  if(!horGrupo || !grusVis.some(g=>g.id===horGrupo)) horGrupo = grusVis[0]?.id || null;
  el.innerHTML = `
  <div class="toolbar">
    <div class="field"><label>Grupo</label>
      <select id="horSel">${opciones(grusVis, g=>`${g.nombre} · ${g.turno}`, horGrupo)}</select></div>
    <div class="spacer"></div>
    <button class="btn btn-primary" id="nuevoHor">＋ Agregar clase</button>
  </div>
  <div id="horZona"></div>`;

  $('#horSel').addEventListener('change', e=>{ horGrupo=e.target.value; pintar(); });
  $('#nuevoHor').addEventListener('click', ()=>{
    abrirModal('Agregar clase al horario', `
      <div class="form-grid">
        <div class="field full"><label>Materia</label>
          <select id="hMat">${opciones(misMaterias(), m=>`${m.clave} · ${m.nombre}`)}</select></div>
        <div class="field"><label>Día</label>
          <select id="hDia">${DIAS.map(d=>`<option>${d}</option>`).join('')}</select></div>
        <div class="field"><label>Aula</label><input id="hAula" placeholder="Aula 4"></div>
        <div class="field"><label>Hora inicio</label><input type="time" id="hIni" value="07:00"></div>
        <div class="field"><label>Hora fin</label><input type="time" id="hFin" value="08:40"></div>
      </div>
      <div class="modal-foot"><button class="btn btn-outline" id="hCan">Cancelar</button>
      <button class="btn btn-primary" id="hOk">Agregar al horario</button></div>`,
    body=>{
      body.querySelector('#hCan').addEventListener('click', cerrarModal);
      body.querySelector('#hOk').addEventListener('click', ()=>{
        const hi = body.querySelector('#hIni').value, hf = body.querySelector('#hFin').value;
        const dia = body.querySelector('#hDia').value;
        if(hf<=hi){ toast('La hora de fin debe ser posterior a la de inicio.'); return; }
        const choque = DB.horarios.find(h=>h.grupoId===horGrupo && h.dia===dia && hi<h.hf && hf>h.hi);
        if(choque){ toast(`Choque de horario con ${materia(choque.materiaId)?.nombre} (${choque.hi}–${choque.hf}).`); return; }
        const nh = {id:uid(), materiaId:body.querySelector('#hMat').value, grupoId:horGrupo,
          dia, hi, hf, aula:body.querySelector('#hAula').value.trim()||'—'};
        DB.horarios.push(nh);
        persist('horarios', nh);
        cerrarModal(); render(); toast('Clase agregada al horario.');
      });
    });
  });

  const pintar = ()=>{
    const clases = DB.horarios.filter(h=>h.grupoId===horGrupo);
    const horas = [...new Set(clases.map(c=>c.hi))].sort();
    $('#horZona').innerHTML = clases.length ? `<div class="table-wrap"><table class="horario-tabla">
      <thead><tr><th>Hora</th>${DIAS.map(d=>`<th>${d}</th>`).join('')}</tr></thead><tbody>
      ${horas.map(h=>`<tr><td class="mono"><strong>${h}</strong></td>
        ${DIAS.map(d=>{
          const c = clases.filter(x=>x.dia===d && x.hi===h);
          return `<td>${c.map(x=>`<div class="bloque-clase">
            <strong>${esc(materia(x.materiaId)?.nombre||'—')}</strong>
            <span>${x.hi}–${x.hf} · ${esc(x.aula)}</span>
            <button class="btn btn-sm btn-danger no-print" data-del="${x.id}" style="margin-top:.2rem">Quitar</button>
          </div>`).join('')}</td>`;
        }).join('')}</tr>`).join('')}
      </tbody></table></div>`
    : '<div class="vacio card"><span class="icono">🗓️</span>Este grupo aún no tiene horario. Agrega su primera clase.</div>';

    $('#horZona').querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{
      DB.horarios = DB.horarios.filter(h=>h.id!==b.dataset.del);
      persistDel('horarios', b.dataset.del);
      pintar(); toast('Clase retirada del horario.');
    }));
  };
  pintar();
}

/* ───────────────────────── 11. CREDENCIALES QR ───────────────────────── */
function vistaCredenciales(el){
  const grusVis = misGrupos();
  if(!grusVis.length){ el.innerHTML = avisoSinAsignacion(); return; }
  const gid = grupoSel && grusVis.some(g=>g.id===grupoSel) ? grupoSel : grusVis[0]?.id;
  el.innerHTML = `
  <div class="toolbar no-print">
    <div class="field"><label>Grupo</label>
      <select id="credGrupo">${opciones(grusVis, g=>g.nombre, gid)}</select></div>
    <div class="spacer"></div>
    <button class="btn btn-gold" id="imprimirCred">🖨️ Imprimir credenciales</button>
  </div>
  <p class="muted no-print" style="margin-bottom:1rem">Cada credencial lleva un QR con la matrícula del alumno (formato <span class="mono">P50|MATRÍCULA</span>). El docente las escanea desde «Pase de lista» para registrar asistencia al instante.</p>
  <div class="cred-grid" id="credZona"></div>`;

  const pintar = ()=>{
    const g = $('#credGrupo').value;
    const lista = alumnosDeGrupo(g);
    const zona = $('#credZona');
    zona.innerHTML = lista.length ? lista.map(a=>`
      <div class="credencial">
        <div class="cred-franja"><strong>PREPARATORIA No. 50 · UAGro</strong><span>${esc(DB.plantel.ciclo)}</span></div>
        <div class="cred-cuerpo">
          <div class="cred-qr" id="qr_${a.id}"></div>
          <div class="cred-datos">
            <h4>${esc(nombreCompleto(a))}</h4>
            <p class="mono">${esc(a.matricula)}</p>
            <p class="muted">${esc(grupo(a.grupoId)?.nombre||'')} · ${esc(grupo(a.grupoId)?.turno||'')}</p>
          </div>
        </div>
        <div class="cred-pie"></div>
      </div>`).join('')
    : '<div class="vacio card" style="width:100%"><span class="icono">🪪</span>El grupo no tiene alumnos.</div>';

    if(typeof QRCode !== 'undefined'){
      lista.forEach(a=>{
        new QRCode(document.getElementById('qr_'+a.id),
          {text:`P50|${a.matricula}`, width:96, height:96, correctLevel:QRCode.CorrectLevel.M});
      });
    } else {
      toast('La librería QR no cargó: revisa tu conexión a internet.');
    }
  };
  $('#credGrupo').addEventListener('change', pintar);
  $('#imprimirCred').addEventListener('click', ()=>window.print());
  pintar();
}

/* ───────────────────────── 12. PORTAL ALUMNOS Y PADRES ───────────────────────── */
function vistaConsultas(el){
  el.innerHTML = `
  <div class="portal-hero">
    <h2>Consulta tu avance académico</h2>
    <p>Madres, padres de familia y alumnado de la Preparatoria No. 50 pueden consultar asistencias, calificaciones y horario escribiendo la matrícula que aparece en la credencial.</p>
    <div class="portal-buscador">
      <input id="busMatricula" placeholder="Escribe la matrícula, ej. A1001" autocomplete="off">
      <button class="btn btn-gold" id="btnConsultar">Consultar</button>
    </div>
  </div>
  <div id="resConsulta"></div>`;

  const consultar = ()=>{
    const mat = $('#busMatricula').value.trim().toUpperCase();
    const a = DB.alumnos.find(x=>x.matricula===mat);
    const res = $('#resConsulta');
    if(!a){ res.innerHTML = `<div class="vacio card"><span class="icono">🔎</span>No se encontró la matrícula <strong class="mono">${esc(mat)}</strong>. Verifica que esté escrita igual que en la credencial.</div>`; return; }

    const g = grupo(a.grupoId);
    const materiasGrupo = [...new Set(DB.horarios.filter(h=>h.grupoId===a.grupoId).map(h=>h.materiaId))]
      .map(id=>materia(id)).filter(Boolean);
    const pGlobal = porcentajeAsistencia(a.id);

    const filaMateria = m=>{
      const p = porcentajeAsistencia(a.id, m.id);
      const proms = [1,2,3].map(par=>{
        const cs = DB.calificaciones.filter(c=>c.alumnoId===a.id && c.materiaId===m.id && c.parcial===par);
        if(!cs.length) return '—';
        let suma=0, pesos=0;
        cs.forEach(c=>{ const peso = m.rubros.find(r=>r.nombre===c.rubro)?.peso||0; suma+=c.valor*peso; pesos+=peso; });
        return pesos? (suma/pesos).toFixed(1) : '—';
      });
      return `<tr><td><strong>${esc(m.nombre)}</strong><br><small class="muted">${esc(docente(m.docenteId)?.nombre||'')}</small></td>
        <td>${p===null?'<span class="muted">—</span>':`<span class="tag ${p>=80?'tag-ok':'tag-mal'}">${p} %</span>`}</td>
        ${proms.map(x=>`<td class="mono" style="${x!=='—'&&+x<6?'color:var(--mal);font-weight:700':''}">${x}</td>`).join('')}</tr>`;
    };

    res.innerHTML = `
    <div class="grid grid-3">
      <div class="card"><h3>👤 Alumno</h3>
        <p><strong>${esc(nombreCompleto(a))}</strong></p>
        <p class="mono">${esc(a.matricula)}</p>
        <p class="muted">${esc(g?.nombre||'')} · ${esc(g?.turno||'')} · Semestre ${g?.semestre||''}</p>
        <p class="muted">Tutor: ${esc(a.tutor||'No registrado')}</p></div>
      <div class="card"><h3>📋 Asistencia global</h3>
        <p style="font-family:var(--display);font-size:2rem;font-weight:800;color:${pGlobal===null?'var(--gris-600)':pGlobal>=80?'var(--ok)':'var(--mal)'}">${pGlobal===null?'—':pGlobal+' %'}</p>
        <div class="barra-asistencia"><div style="width:${pGlobal||0}%"></div></div>
        <p class="muted" style="margin-top:.4rem">Se considera asistencia: presente, retardo y falta justificada.</p></div>
      <div class="card"><h3>🗓️ Próximas clases</h3>
        ${DB.horarios.filter(h=>h.grupoId===a.grupoId).sort((x,y)=>DIAS.indexOf(x.dia)-DIAS.indexOf(y.dia)||x.hi.localeCompare(y.hi))
          .slice(0,4).map(h=>`<div class="bloque-clase"><strong>${esc(h.dia)} ${h.hi}</strong><span>${esc(materia(h.materiaId)?.nombre||'')} · ${esc(h.aula)}</span></div>`).join('')||'<p class="muted">Sin horario registrado.</p>'}</div>
    </div>
    <div class="card" style="margin-top:1rem">
      <h3>📚 Materias del grupo: asistencia y calificaciones</h3>
      ${materiasGrupo.length?`<div class="table-wrap"><table><thead><tr><th>Materia</th><th>Asistencia</th><th>Parcial 1</th><th>Parcial 2</th><th>Parcial 3</th></tr></thead>
      <tbody>${materiasGrupo.map(filaMateria).join('')}</tbody></table></div>`
      :'<p class="muted">El grupo aún no tiene materias en su horario.</p>'}
      <p class="muted" style="margin-top:.6rem">Calificación mínima aprobatoria: 6.0. Si tienes dudas, acude con el docente de la materia o a la dirección del plantel.</p>
    </div>`;
  };
  $('#btnConsultar').addEventListener('click', consultar);
  $('#busMatricula').addEventListener('keydown', e=>{ if(e.key==='Enter') consultar(); });
}

/* ───────────────────────── 13. REPORTES Y EXPORTACIÓN ───────────────────────── */
function vistaReportes(el){
  el.innerHTML = `
  <div class="grid grid-2">
    <div class="card">
      <h3>📋 Reporte de asistencia (CSV)</h3>
      <p class="muted">Exporta el detalle de asistencias por grupo y materia en un rango de fechas, listo para Excel.</p>
      <div class="form-grid" style="margin-top:.7rem">
        <div class="field"><label>Grupo</label><select id="repGrupo">${opciones(misGrupos(), g=>g.nombre)}</select></div>
        <div class="field"><label>Materia</label><select id="repMateria"><option value="">Todas</option>${opciones(misMaterias(), m=>m.nombre)}</select></div>
        <div class="field"><label>Desde</label><input type="date" id="repDesde" value="${hoyISO().slice(0,8)}01"></div>
        <div class="field"><label>Hasta</label><input type="date" id="repHasta" value="${hoyISO()}"></div>
      </div>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.8rem">
        <button class="btn btn-primary" id="expAsis">⬇ CSV de asistencia</button>
        <button class="btn btn-gold" id="expAsisPDF">🧾 PDF de asistencia</button>
      </div>
    </div>
    <div class="card">
      <h3>🧮 Concentrado de calificaciones (CSV)</h3>
      <p class="muted">Promedios ponderados por alumno, materia y parcial, con el desglose por rubro.</p>
      <div class="form-grid" style="margin-top:.7rem">
        <div class="field"><label>Grupo</label><select id="repCalGrupo">${opciones(misGrupos(), g=>g.nombre)}</select></div>
        <div class="field"><label>Materia</label><select id="repCalMateria">${opciones(misMaterias(), m=>m.nombre)}</select></div>
      </div>
      <button class="btn btn-primary" id="expCal" style="margin-top:.8rem">⬇ Descargar CSV de calificaciones</button>
    </div>
    <div class="card">
      <h3>🧾 Boletas de calificaciones en PDF</h3>
      <p class="muted">Boleta institucional por alumno o de todo el grupo: promedios por parcial, promedio final y % de asistencia por materia.</p>
      <div class="form-grid" style="margin-top:.7rem">
        <div class="field"><label>Grupo</label><select id="bolGrupo">${opciones(misGrupos(), g=>g.nombre)}</select></div>
        <div class="field"><label>Alumno</label><select id="bolAlumno"></select></div>
      </div>
      <button class="btn btn-gold" id="expBoleta" style="margin-top:.8rem">🧾 Generar boleta(s) en PDF</button>
    </div>
  </div>
  ${(typeof esAdmin!=='function' || esAdmin()) ? `<div class="card" style="margin-top:1rem">
    <h3>🧰 Datos del sistema</h3>
    <p class="muted">Genera un respaldo completo (JSON) desde la barra lateral, reinicia con datos de demostración, o vacía todo para iniciar de cero con datos reales.</p>
    <div style="display:flex;gap:.6rem;flex-wrap:wrap;margin-top:.6rem">
      <button class="btn btn-outline" id="reiniciar">Cargar datos de demostración</button>
      <button class="btn btn-danger" id="vaciarTodo">🧹 Vaciar todo el sistema (iniciar de cero)</button>
    </div>
  </div>`:''}`;

  if(typeof esAdmin==='function' && !esAdmin()){
    // Docente: sin herramientas destructivas
  } else {
  $('#vaciarTodo').addEventListener('click', ()=>{
    const conf = prompt('⚠️ Esta acción ELIMINA PERMANENTEMENTE todos los datos del sistema' +
      (MODO==='nube' ? ' EN LA NUBE (todos los dispositivos quedarán vacíos)' : '') +
      ': alumnos, asistencias, calificaciones, materias, grupos, horarios y docentes.\n\n' +
      'Sugerencia: descarga antes un Respaldo desde la barra lateral.\n\n' +
      'Para confirmar, escribe la palabra: BORRAR');
    if(conf===null) return;
    if(conf.trim().toUpperCase()!=='BORRAR'){ toast('Operación cancelada: no escribiste BORRAR.'); return; }
    ['docentes','materias','grupos','alumnos','horarios','asistencias','calificaciones'].forEach(col=>{
      const ids = DB[col].map(x=>x.id);
      DB[col] = [];
      if(ids.length) persistDel(col, ids);
    });
    grupoSel = null; horGrupo = null;
    sesionPase = { fecha:hoyISO(), materiaId:null, grupoId:null, modo:'manual' };
    sesionCal = { materiaId:null, grupoId:null, parcial:1 };
    guardarLocal();
    render(); toast('Sistema vaciado por completo. Listo para capturar los datos reales del plantel.');
  });

  // ── Boletas PDF: llenar selector de alumnos según el grupo ──
  const llenarBolAlumnos = ()=>{
    const lista = alumnosDeGrupo($('#bolGrupo').value);
    $('#bolAlumno').innerHTML = `<option value="*">Todo el grupo (${lista.length} boletas)</option>` +
      lista.map(a=>`<option value="${a.id}">${esc(nombreCompleto(a))} · ${esc(a.matricula)}</option>`).join('');
  };
  llenarBolAlumnos();
  $('#bolGrupo').addEventListener('change', llenarBolAlumnos);
  $('#expBoleta').addEventListener('click', ()=>{
    const sel = $('#bolAlumno').value;
    const lista = sel==='*' ? alumnosDeGrupo($('#bolGrupo').value) : [alumno(sel)].filter(Boolean);
    if(!lista.length){ toast('El grupo no tiene alumnos.'); return; }
    generarBoletasPDF(lista);
  });
  $('#expAsisPDF').addEventListener('click', ()=>{
    const g=$('#repGrupo').value, m=$('#repMateria').value, d=$('#repDesde').value, h=$('#repHasta').value;
    generarAsistenciaPDF(g, m, d, h);
  });

  $('#expAsis').addEventListener('click', ()=>{
    const g=$('#repGrupo').value, m=$('#repMateria').value, d=$('#repDesde').value, h=$('#repHasta').value;
    const regs = DB.asistencias.filter(a=>a.grupoId===g && (!m||a.materiaId===m) && a.fecha>=d && a.fecha<=h)
      .sort((x,y)=>x.fecha.localeCompare(y.fecha));
    if(!regs.length){ toast('No hay registros en ese rango.'); return; }
    const filas = [['Fecha','Hora','Matrícula','Alumno','Grupo','Materia','Estado','Método'].join(',')];
    regs.forEach(r=>{
      const a=alumno(r.alumnoId);
      filas.push([r.fecha, r.hora||'', a?.matricula||'', `"${a?nombreCompleto(a):''}"`,
        `"${grupo(r.grupoId)?.nombre||''}"`, `"${materia(r.materiaId)?.nombre||''}"`,
        ESTADOS[r.estado], r.metodo].join(','));
    });
    descargarTexto(`asistencia_${grupo(g)?.nombre.replace(/[^\w]/g,'')}_${d}_a_${h}.csv`, filas.join('\n'));
    toast('Reporte de asistencia descargado.');
  });

  $('#expCal').addEventListener('click', ()=>{
    const g=$('#repCalGrupo').value, mid=$('#repCalMateria').value;
    const mat = materia(mid); const lista = alumnosDeGrupo(g);
    if(!mat || !lista.length){ toast('Selecciona materia y un grupo con alumnos.'); return; }
    const filas = [['Matrícula','Alumno','Parcial',...mat.rubros.map(r=>`"${r.nombre} (${r.peso}%)"`),'Promedio ponderado'].join(',')];
    let hay=false;
    lista.forEach(a=>[1,2,3].forEach(par=>{
      const cs = DB.calificaciones.filter(c=>c.alumnoId===a.id && c.materiaId===mid && c.parcial===par);
      if(!cs.length) return; hay=true;
      let suma=0,pesos=0;
      const valores = mat.rubros.map(r=>{
        const c=cs.find(x=>x.rubro===r.nombre);
        if(c){ suma+=c.valor*r.peso; pesos+=+r.peso; return c.valor; } return '';
      });
      filas.push([a.matricula, `"${nombreCompleto(a)}"`, par, ...valores, pesos?(suma/pesos).toFixed(2):''].join(','));
    }));
    if(!hay){ toast('Aún no hay calificaciones capturadas para esa materia.'); return; }
    descargarTexto(`calificaciones_${mat.clave}_${grupo(g)?.nombre.replace(/[^\w]/g,'')}.csv`, filas.join('\n'));
    toast('Concentrado de calificaciones descargado.');
  });

  $('#reiniciar').addEventListener('click', ()=>{
    const aviso = MODO==='nube'
      ? 'Esto carga los datos de demostración y los SUBE a la nube (no borra lo ya existente en la nube). ¿Continuar?'
      : 'Esto borra TODOS los datos actuales y carga los de demostración. ¿Continuar?';
    if(!confirm(aviso)) return;
    DB = semilla();
    if(MODO==='nube') subirTodoANube(); else guardarLocal();
    render(); toast('Datos de demostración cargados.');
  });
  } // fin bloque admin (datos del sistema)
}

/* ───────────────────────── 14. RESPALDO / RESTAURACIÓN ───────────────────────── */
$('#btnRespaldo').addEventListener('click', ()=>{
  descargarTexto(`respaldo_sige_p50_${hoyISO()}.json`, JSON.stringify(DB,null,2), 'application/json');
  toast('Respaldo descargado.');
});
$('#btnRestaurar').addEventListener('click', ()=>$('#fileRestaurar').click());
$('#fileRestaurar').addEventListener('change', e=>{
  const f = e.target.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = ()=>{
    try{
      const datos = JSON.parse(r.result);
      if(!datos.alumnos || !datos.materias) throw 0;
      DB = datos;
      if(!DB.plantel.ciudad) DB.plantel.ciudad = 'Tlacoachistlahuaca, Gro.';
      if(MODO==='nube'){ subirTodoANube(); }
      else guardarLocal();
      render(); toast(MODO==='nube' ? 'Respaldo restaurado y subido a la nube.' : 'Respaldo restaurado correctamente.');
    }catch(_){ toast('El archivo no es un respaldo válido del sistema.'); }
  };
  r.readAsText(f);
  e.target.value='';
});

/* ───────────────────────── 15. REPORTES EN PDF ───────────────────────── */
function promedioParcialDe(alumnoId, m, parcial){
  const cs = DB.calificaciones.filter(c=>c.alumnoId===alumnoId && c.materiaId===m.id && c.parcial===parcial);
  if(!cs.length) return null;
  let suma=0, pesos=0;
  cs.forEach(c=>{ const p = m.rubros.find(r=>r.nombre===c.rubro)?.peso||0; suma+=c.valor*p; pesos+=p; });
  return pesos ? suma/pesos : null;
}
function hayPDF(){
  if(!window.jspdf || !window.jspdf.jsPDF){ toast('La librería de PDF no cargó: revisa tu conexión.'); return false; }
  return true;
}
function encabezadoPDF(doc, subtitulo){
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(11,35,66); doc.rect(0,0,W,24,'F');         // franja azul
  doc.setFillColor(201,155,47); doc.rect(0,24,W,2.5,'F');     // línea oro
  doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(13);
  doc.text('PREPARATORIA No. 50 · UAGro', 14, 11);
  doc.setFontSize(8.5); doc.setFont('helvetica','normal');
  doc.text(DB.plantel.universidad + ' · ' + (DB.plantel.ciudad || 'Tlacoachistlahuaca, Gro.'), 14, 17);
  doc.setTextColor(232,196,92);
  doc.text(`Ciclo ${DB.plantel.ciclo}`, W-14, 11, {align:'right'});
  doc.setTextColor(255,255,255);
  doc.text(subtitulo, W-14, 17, {align:'right'});
}
function piePDF(doc){
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
  const total = doc.internal.getNumberOfPages();
  for(let i=1;i<=total;i++){
    doc.setPage(i);
    doc.setFontSize(7.5); doc.setTextColor(91,107,130);
    doc.text(`Generado con SIGE Prepa 50 · ${new Date().toLocaleString('es-MX')}`, 14, H-8);
    doc.text(`Página ${i} de ${total}`, W-14, H-8, {align:'right'});
  }
}

function generarBoletasPDF(lista){
  if(!hayPDF()) return;
  const doc = new window.jspdf.jsPDF();
  lista.forEach((a, idx)=>{
    if(idx>0) doc.addPage();
    const g = grupo(a.grupoId);
    encabezadoPDF(doc, 'BOLETA DE CALIFICACIONES');

    // Datos del alumno
    doc.setTextColor(22,35,58); doc.setFont('helvetica','bold'); doc.setFontSize(12);
    doc.text(nombreCompleto(a), 14, 38);
    doc.setFont('helvetica','normal'); doc.setFontSize(9.5);
    doc.text(`Matrícula: ${a.matricula}    Grupo: ${g?.nombre||'—'} (${g?.turno||''})    Semestre: ${g?.semestre||'—'}`, 14, 45);
    doc.text(`Padre o tutor: ${a.tutor||'No registrado'}`, 14, 51);
    const pGlobal = porcentajeAsistencia(a.id);
    doc.setFont('helvetica','bold');
    doc.text(`Asistencia global: ${pGlobal===null?'Sin registros':pGlobal+' %'}`, 14, 57);

    // Tabla de materias
    const materiasGrupo = [...new Set(DB.horarios.filter(h=>h.grupoId===a.grupoId).map(h=>h.materiaId))]
      .map(id=>materia(id)).filter(Boolean);
    const fmt = v => v===null ? '—' : v.toFixed(1);
    const cuerpo = materiasGrupo.map(m=>{
      const ps = [1,2,3].map(p=>promedioParcialDe(a.id, m, p));
      const conNota = ps.filter(x=>x!==null);
      const final = conNota.length ? conNota.reduce((s,x)=>s+x,0)/conNota.length : null;
      const asis = porcentajeAsistencia(a.id, m.id);
      return [m.nombre, docente(m.docenteId)?.nombre||'—', asis===null?'—':asis+' %',
              fmt(ps[0]), fmt(ps[1]), fmt(ps[2]), final===null?'—':final.toFixed(1)];
    });
    doc.autoTable({
      startY:63,
      head:[['Materia','Docente','Asist.','Parcial 1','Parcial 2','Parcial 3','Final']],
      body: cuerpo.length?cuerpo:[['El grupo aún no tiene materias en su horario.','','','','','','']],
      styles:{fontSize:8.5, cellPadding:2.5},
      headStyles:{fillColor:[29,78,158], textColor:255, fontStyle:'bold'},
      alternateRowStyles:{fillColor:[243,247,252]},
      didParseCell(d){ // promedios reprobatorios en rojo
        if(d.section==='body' && d.column.index>=3){
          const v = parseFloat(d.cell.raw);
          if(!isNaN(v) && v<6){ d.cell.styles.textColor=[200,68,44]; d.cell.styles.fontStyle='bold'; }
        }
      }
    });

    // Promedio general y firmas
    const finales = cuerpo.map(f=>parseFloat(f[6])).filter(v=>!isNaN(v));
    let y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(11,35,66);
    doc.text(`Promedio general: ${finales.length?(finales.reduce((s,v)=>s+v,0)/finales.length).toFixed(1):'—'}`, 14, y);
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(91,107,130);
    doc.text('Calificación mínima aprobatoria: 6.0 · El % de asistencia considera presente, retardo y falta justificada.', 14, y+6);
    y += 30;
    doc.setDrawColor(150); doc.line(20,y,85,y); doc.line(120,y,185,y);
    doc.setFontSize(8); doc.setTextColor(22,35,58);
    doc.text('Docente / Tutor de grupo', 52.5, y+5, {align:'center'});
    doc.text('Padre o tutor', 152.5, y+5, {align:'center'});
  });
  piePDF(doc);
  const nombre = lista.length===1
    ? `boleta_${lista[0].matricula}.pdf`
    : `boletas_${grupo(lista[0].grupoId)?.nombre.replace(/[^\w]/g,'')||'grupo'}.pdf`;
  doc.save(nombre);
  toast(`${lista.length===1?'Boleta generada':lista.length+' boletas generadas'} en PDF.`);
}

function generarAsistenciaPDF(g, m, d, h){
  if(!hayPDF()) return;
  const regs = DB.asistencias.filter(a=>a.grupoId===g && (!m||a.materiaId===m) && a.fecha>=d && a.fecha<=h)
    .sort((x,y)=>x.fecha.localeCompare(y.fecha) || (x.hora||'').localeCompare(y.hora||''));
  if(!regs.length){ toast('No hay registros de asistencia en ese rango.'); return; }
  const doc = new window.jspdf.jsPDF();
  encabezadoPDF(doc, 'REPORTE DE ASISTENCIA');
  doc.setTextColor(22,35,58); doc.setFontSize(10); doc.setFont('helvetica','bold');
  doc.text(`Grupo: ${grupo(g)?.nombre||'—'}   Materia: ${m?materia(m)?.nombre:'Todas'}   Periodo: ${d} a ${h}`, 14, 36);
  const cuenta = e => regs.filter(r=>r.estado===e).length;
  doc.setFont('helvetica','normal'); doc.setFontSize(9);
  doc.text(`Presentes: ${cuenta('P')}   Retardos: ${cuenta('R')}   Justificadas: ${cuenta('J')}   Faltas: ${cuenta('F')}   Total de registros: ${regs.length}`, 14, 42);
  doc.autoTable({
    startY:47,
    head:[['Fecha','Hora','Matrícula','Alumno','Materia','Estado','Método']],
    body: regs.map(r=>{
      const a=alumno(r.alumnoId);
      return [r.fecha, r.hora||'—', a?.matricula||'—', a?nombreCompleto(a):'(baja)',
              materia(r.materiaId)?.nombre||'—', ESTADOS[r.estado], r.metodo==='qr'?'QR':'Manual'];
    }),
    styles:{fontSize:8, cellPadding:2},
    headStyles:{fillColor:[29,78,158], textColor:255, fontStyle:'bold'},
    alternateRowStyles:{fillColor:[243,247,252]},
    didParseCell(dd){
      if(dd.section==='body' && dd.column.index===5){
        if(dd.cell.raw==='Falta'){ dd.cell.styles.textColor=[200,68,44]; dd.cell.styles.fontStyle='bold'; }
        if(dd.cell.raw==='Retardo'){ dd.cell.styles.textColor=[176,122,18]; }
      }
    }
  });
  piePDF(doc);
  doc.save(`asistencia_${grupo(g)?.nombre.replace(/[^\w]/g,'')}_${d}_a_${h}.pdf`);
  toast('Reporte de asistencia en PDF descargado.');
}

/* ───────────────────────── 16. IMPORTACIÓN DESDE EXCEL ───────────────────────── */
const normaliza = t => String(t??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const ALIAS_COLUMNAS = {
  matricula:['matricula','mat','nocontrol','numerodecontrol','id','clave'],
  nombre:['nombre','nombres','alumno'],
  apellidos:['apellidos','apellido','apellidopaternoymaterno'],
  tutor:['tutor','padre','padretutor','padreotutor','madrepadretutor','nombredeltutor'],
  telTutor:['teltutor','telefonotutor','telefonodeltutor','telefono','celulartutor'],
  email:['correo','email','emailalumno','correoelectronico'],
};
function detectaCampo(encabezado){
  const e = normaliza(encabezado);
  for(const campo in ALIAS_COLUMNAS) if(ALIAS_COLUMNAS[campo].includes(e)) return campo;
  return null;
}

function modalImportarExcel(){
  if(typeof XLSX === 'undefined'){ toast('La librería de Excel no cargó: revisa tu conexión.'); return; }
  let candidatos = [];   // {fila, datos, estado:'nuevo|duplicado|incompleto', motivo}

  abrirModal('Importar alumnos desde Excel', `
    <p class="muted">Sube un archivo <strong>.xlsx, .xls o .csv</strong> con una fila por alumno. Columnas reconocidas:
    <span class="mono">matricula, nombre, apellidos, tutor, telefono_tutor, correo</span>
    (las tres primeras son obligatorias; el orden no importa y se aceptan acentos).</p>
    <button class="btn btn-sm btn-outline" id="descPlantilla" style="margin:.6rem 0">⬇ Descargar plantilla de ejemplo (.xlsx)</button>
    <div class="form-grid">
      <div class="field"><label>Grupo destino</label>
        <select id="impGrupo">${opciones(DB.grupos, g=>`${g.nombre} · ${g.turno}`, grupoSel)}</select></div>
      <div class="field"><label>Archivo</label>
        <input type="file" id="impFile" accept=".xlsx,.xls,.csv"></div>
    </div>
    <div id="impPreview" style="margin-top:.8rem"></div>
    <div class="modal-foot">
      <button class="btn btn-outline" id="impCan">Cancelar</button>
      <button class="btn btn-primary" id="impOk" disabled>Importar alumnos</button>
    </div>`,
  body=>{
    body.querySelector('#impCan').addEventListener('click', cerrarModal);

    body.querySelector('#descPlantilla').addEventListener('click', ()=>{
      const ws = XLSX.utils.aoa_to_sheet([
        ['matricula','nombre','apellidos','tutor','telefono_tutor','correo'],
        ['A1050','Lucía','Pérez Gómez','Marta Gómez','744-000-0000','lucia@example.com'],
        ['A1051','Hugo','Ramírez Cruz','José Ramírez','744-000-0001',''],
      ]);
      ws['!cols'] = [{wch:10},{wch:14},{wch:20},{wch:18},{wch:14},{wch:24}];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Alumnos');
      XLSX.writeFile(wb, 'plantilla_alumnos_p50.xlsx');
    });

    body.querySelector('#impFile').addEventListener('change', e=>{
      const f = e.target.files[0]; if(!f) return;
      const r = new FileReader();
      r.onload = ()=>{
        try{
          const wb = XLSX.read(new Uint8Array(r.result), {type:'array'});
          const hoja = wb.Sheets[wb.SheetNames[0]];
          const filas = XLSX.utils.sheet_to_json(hoja, {defval:'', raw:false});
          if(!filas.length) throw new Error('vacio');

          // Mapear encabezados → campos del sistema
          const mapa = {};
          Object.keys(filas[0]).forEach(enc=>{ const c = detectaCampo(enc); if(c && !mapa[c]) mapa[c]=enc; });
          if(!mapa.matricula || !mapa.nombre || !mapa.apellidos){
            body.querySelector('#impPreview').innerHTML =
              `<p class="tag tag-mal">No se encontraron las columnas obligatorias (matrícula, nombre y apellidos). Usa la plantilla de ejemplo.</p>`;
            candidatos=[]; actualizarBoton(); return;
          }

          const vistas = new Set();
          candidatos = filas.map((f2,i)=>{
            const datos = {
              matricula:String(f2[mapa.matricula]||'').trim().toUpperCase(),
              nombre:String(f2[mapa.nombre]||'').trim(),
              apellidos:String(f2[mapa.apellidos]||'').trim(),
              tutor:mapa.tutor?String(f2[mapa.tutor]||'').trim():'',
              telTutor:mapa.telTutor?String(f2[mapa.telTutor]||'').trim():'',
              email:mapa.email?String(f2[mapa.email]||'').trim():'',
            };
            let estado='nuevo', motivo='Listo para importar';
            if(!datos.matricula || !datos.nombre || !datos.apellidos){ estado='incompleto'; motivo='Faltan datos obligatorios'; }
            else if(DB.alumnos.some(a=>a.matricula===datos.matricula)){ estado='duplicado'; motivo='La matrícula ya existe en el sistema'; }
            else if(vistas.has(datos.matricula)){ estado='duplicado'; motivo='Matrícula repetida en el archivo'; }
            if(datos.matricula) vistas.add(datos.matricula);
            return {fila:i+2, datos, estado, motivo};
          });
          pintarVistaPrevia();
        }catch(_){
          body.querySelector('#impPreview').innerHTML =
            `<p class="tag tag-mal">No se pudo leer el archivo. Verifica que sea un Excel o CSV válido con datos.</p>`;
          candidatos=[]; actualizarBoton();
        }
      };
      r.readAsArrayBuffer(f);
    });

    const actualizarBoton = ()=>{
      const ok = candidatos.filter(c=>c.estado==='nuevo').length;
      const btn = body.querySelector('#impOk');
      btn.disabled = !ok;
      btn.textContent = ok ? `Importar ${ok} alumno${ok===1?'':'s'}` : 'Importar alumnos';
    };

    const pintarVistaPrevia = ()=>{
      const tag = c => c.estado==='nuevo' ? '<span class="tag tag-ok">Nuevo</span>'
        : c.estado==='duplicado' ? '<span class="tag tag-aviso">Duplicado</span>'
        : '<span class="tag tag-mal">Incompleto</span>';
      body.querySelector('#impPreview').innerHTML = `
        <p class="muted">${candidatos.length} fila(s) leída(s). Solo se importarán las marcadas como <strong>Nuevo</strong>.</p>
        <div class="table-wrap" style="max-height:240px;overflow-y:auto"><table>
          <thead><tr><th>Fila</th><th>Matrícula</th><th>Alumno</th><th>Tutor</th><th>Estado</th></tr></thead><tbody>
          ${candidatos.map(c=>`<tr>
            <td class="mono">${c.fila}</td><td class="mono">${esc(c.datos.matricula)||'—'}</td>
            <td>${esc(c.datos.apellidos)} ${esc(c.datos.nombre)}</td>
            <td>${esc(c.datos.tutor)||'—'}</td>
            <td>${tag(c)}<br><small class="muted">${c.motivo}</small></td></tr>`).join('')}
          </tbody></table></div>`;
      actualizarBoton();
    };

    body.querySelector('#impOk').addEventListener('click', ()=>{
      const gid = body.querySelector('#impGrupo').value;
      const nuevos = candidatos.filter(c=>c.estado==='nuevo')
        .map(c=>({id:uid(), grupoId:gid, ...c.datos}));
      nuevos.forEach(n=>DB.alumnos.push(n));
      persist('alumnos', nuevos);
      grupoSel = gid; cerrarModal(); render();
      toast(`${nuevos.length} alumno${nuevos.length===1?'':'s'} importado${nuevos.length===1?'':'s'} al grupo ${grupo(gid)?.nombre}.`);
    });
  });
}

/* ───────────────────────── 17. ESTADÍSTICAS CON GRÁFICAS ───────────────────────── */
let chartsActivos = [];
function limpiarCharts(){ chartsActivos.forEach(c=>{ try{c.destroy();}catch(_){} }); chartsActivos = []; }
const C = { azul:'#1D4E9E', azulOsc:'#0B2342', oro:'#C99B2F', ok:'#1E8E5A', mal:'#C8442C', aviso:'#B07A12', gris:'#C9D3E0' };

function vistaEstadisticas(el){
  if(typeof Chart === 'undefined'){
    el.innerHTML = '<div class="vacio card"><span class="icono">📊</span>La librería de gráficas no cargó. Revisa tu conexión a internet y recarga la página.</div>';
    return;
  }
  const matsVis = misMaterias(), grusVis = misGrupos();
  if(!matsVis.length){ el.innerHTML = avisoSinAsignacion(); return; }
  const mesInicio = hoyISO().slice(0,8)+'01';
  el.innerHTML = `
  <div class="card no-print">
    <div class="toolbar" style="margin-bottom:0">
      <div class="field"><label>Grupo</label><select id="estGrupo">${opciones(grusVis, g=>g.nombre)}</select></div>
      <div class="field"><label>Materia</label><select id="estMateria"><option value="">Todas las del grupo</option>${opciones(matsVis, m=>m.nombre)}</select></div>
      <div class="field"><label>Parcial</label><select id="estParcial">${[1,2,3].map(p=>`<option value="${p}">Parcial ${p}</option>`).join('')}</select></div>
      <div class="field"><label>Asistencia desde</label><input type="date" id="estDesde" value="${mesInicio}"></div>
      <div class="field"><label>Hasta</label><input type="date" id="estHasta" value="${hoyISO()}"></div>
    </div>
  </div>

  <div class="grid grid-3" style="margin-top:1rem" id="estTarjetas"></div>

  <div class="grid grid-2" style="margin-top:1rem">
    <div class="card chart-card"><h3>📋 Asistencia por estado</h3><canvas id="chEstados"></canvas></div>
    <div class="card chart-card"><h3>📈 Tendencia de asistencia (% por día)</h3><canvas id="chTendencia"></canvas></div>
    <div class="card chart-card"><h3>🎯 Aprobación del parcial</h3><canvas id="chAprobacion"></canvas></div>
    <div class="card chart-card"><h3>🧩 Desempeño <span id="chRubrosTitulo"></span></h3><canvas id="chRubros"></canvas></div>
  </div>`;

  const pintar = ()=>{
    limpiarCharts();
    const g = $('#estGrupo').value, mid = $('#estMateria').value, par = +$('#estParcial').value;
    const d = $('#estDesde').value, h = $('#estHasta').value;
    const alumnos = alumnosDeGrupo(g);
    const materiasGrupo = mid ? [materia(mid)].filter(Boolean)
      : [...new Set(DB.horarios.filter(x=>x.grupoId===g).map(x=>x.materiaId))]
          .map(id=>materia(id)).filter(Boolean)
          .filter(m=>esAdmin() || materiasPermitidas().includes(m.id));

    /* — Asistencia filtrada — */
    const regs = DB.asistencias.filter(a=>a.grupoId===g && (!mid||a.materiaId===mid) && a.fecha>=d && a.fecha<=h);
    const cuenta = e => regs.filter(r=>r.estado===e).length;
    const totalA = regs.length;
    const pctAsis = totalA ? Math.round((cuenta('P')+cuenta('R')+cuenta('J'))/totalA*100) : null;

    /* — Aprobación del parcial — */
    let aprobados=0, reprobados=0, sinCaptura=0, sumaProm=0, nProm=0;
    alumnos.forEach(a=>materiasGrupo.forEach(m=>{
      const p = promedioParcialDe(a.id, m, par);
      if(p===null) sinCaptura++;
      else { sumaProm+=p; nProm++; p>=6 ? aprobados++ : reprobados++; }
    }));
    const pctAprob = (aprobados+reprobados) ? Math.round(aprobados/(aprobados+reprobados)*100) : null;

    /* — Tarjetas resumen — */
    $('#estTarjetas').innerHTML = `
      <div class="card stat"><span class="num" style="color:${pctAsis===null?'var(--gris-600)':pctAsis>=80?'var(--ok)':'var(--mal)'}">${pctAsis===null?'—':pctAsis+' %'}</span><span class="lbl">Asistencia del periodo</span></div>
      <div class="card stat"><span class="num" style="color:${pctAprob===null?'var(--gris-600)':pctAprob>=70?'var(--ok)':'var(--mal)'}">${pctAprob===null?'—':pctAprob+' %'}</span><span class="lbl">Aprobación · Parcial ${par}</span></div>
      <div class="card stat gold"><span class="num">${nProm?(sumaProm/nProm).toFixed(1):'—'}</span><span class="lbl">Promedio general capturado</span></div>`;

    /* — 1) Dona de estados — */
    chartsActivos.push(new Chart($('#chEstados'), {
      type:'doughnut',
      data:{ labels:['Presente','Retardo','Justificada','Falta'],
        datasets:[{ data:[cuenta('P'),cuenta('R'),cuenta('J'),cuenta('F')],
          backgroundColor:[C.ok,C.aviso,C.azul,C.mal], borderWidth:2, borderColor:'#fff' }]},
      options:{ plugins:{legend:{position:'bottom'}}, cutout:'58%' }
    }));

    /* — 2) Tendencia por fecha — */
    const fechas = [...new Set(regs.map(r=>r.fecha))].sort();
    const serie = fechas.map(f=>{
      const dia = regs.filter(r=>r.fecha===f);
      return Math.round(dia.filter(r=>r.estado!=='F').length/dia.length*100);
    });
    chartsActivos.push(new Chart($('#chTendencia'), {
      type:'line',
      data:{ labels:fechas.map(f=>f.slice(5)), datasets:[{ label:'% asistencia', data:serie,
        borderColor:C.azul, backgroundColor:'rgba(29,78,158,.12)', fill:true, tension:.3,
        pointBackgroundColor:C.oro, pointRadius:4 }]},
      options:{ scales:{ y:{min:0,max:100,ticks:{callback:v=>v+' %'}} }, plugins:{legend:{display:false}} }
    }));

    /* — 3) Aprobación — */
    chartsActivos.push(new Chart($('#chAprobacion'), {
      type:'doughnut',
      data:{ labels:['Aprobados (≥6)','Reprobados (<6)','Sin captura'],
        datasets:[{ data:[aprobados,reprobados,sinCaptura],
          backgroundColor:[C.ok,C.mal,C.gris], borderWidth:2, borderColor:'#fff' }]},
      options:{ plugins:{legend:{position:'bottom'}}, cutout:'58%' }
    }));

    /* — 4) Desempeño: por rubro (materia específica) o por materia (todas) — */
    let etiquetas, valores, titulo;
    if(mid && materiasGrupo[0]){
      const m = materiasGrupo[0];
      titulo = `por rubro · ${m.nombre} · Parcial ${par}`;
      etiquetas = m.rubros.map(r=>`${r.nombre} (${r.peso}%)`);
      valores = m.rubros.map(r=>{
        const cs = DB.calificaciones.filter(c=>c.materiaId===m.id && c.parcial===par && c.rubro===r.nombre
          && alumnos.some(a=>a.id===c.alumnoId));
        return cs.length ? +(cs.reduce((s,c)=>s+c.valor,0)/cs.length).toFixed(2) : 0;
      });
    } else {
      titulo = `promedio por materia · Parcial ${par}`;
      etiquetas = materiasGrupo.map(m=>m.nombre);
      valores = materiasGrupo.map(m=>{
        const ps = alumnos.map(a=>promedioParcialDe(a.id,m,par)).filter(p=>p!==null);
        return ps.length ? +(ps.reduce((s,p)=>s+p,0)/ps.length).toFixed(2) : 0;
      });
    }
    $('#chRubrosTitulo').textContent = `(${titulo})`;
    chartsActivos.push(new Chart($('#chRubros'), {
      type:'bar',
      data:{ labels:etiquetas, datasets:[{ data:valores,
        backgroundColor:valores.map(v=>v>=6?C.azul:v>0?C.mal:C.gris), borderRadius:6 }]},
      options:{ scales:{ y:{min:0,max:10} }, plugins:{legend:{display:false},
        tooltip:{callbacks:{label:ctx=>`Promedio: ${ctx.raw}`}} } }
    }));
  };

  ['estGrupo','estMateria','estParcial','estDesde','estHasta'].forEach(id=>$('#'+id).addEventListener('change', pintar));
  pintar();
}

/* ───────────────────────── 18. MODO KIOSCO (AUTO-REGISTRO) ───────────────────────── */
let lectorKiosko = null, relojKiosko = null, kioskoUltimo = {texto:'', t:0};

function sumarMinutos(hhmm, min){
  const [h,m] = hhmm.split(':').map(Number);
  const t = h*60+m+min;
  return `${String(Math.floor(t/60)%24).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;
}
/* Presente o Retardo según la hora de inicio de la clase + tolerancia del plantel */
function estadoSegunHora(){
  const dia = new Date().toLocaleDateString('es-MX',{weekday:'long'});
  const diaCap = dia.charAt(0).toUpperCase()+dia.slice(1);
  const clase = DB.horarios.find(x=>x.materiaId===sesionPase.materiaId && x.grupoId===sesionPase.grupoId && x.dia===diaCap);
  if(!clase) return 'P';
  const ahora = new Date().toTimeString().slice(0,5);
  return ahora > sumarMinutos(clase.hi, DB.plantel.toleranciaMin) ? 'R' : 'P';
}
function beepKiosko(ok){
  try{
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = ok ? 880 : 220; g.gain.value = .08;
    o.start(); o.stop(ctx.currentTime + .18);
  }catch(_){}
}

function abrirKiosko(){
  if(typeof Html5Qrcode === 'undefined'){ toast('La librería de QR no cargó. Verifica tu conexión.'); return; }
  if(!sesionPase.materiaId || !sesionPase.grupoId){ toast('Primero elige materia y grupo.'); return; }
  detenerLector(); // libera la cámara del pase de lista

  const ov = document.createElement('div');
  ov.className = 'kiosko'; ov.id = 'kioskoOverlay';
  ov.innerHTML = `
    <button class="kiosko-salir" id="kioskoSalir">✕ Salir del kiosco</button>
    <div class="kiosko-head">
      <h2>Registro de asistencia</h2>
      <span class="clase">${esc(materia(sesionPase.materiaId)?.nombre||'')} · ${esc(grupo(sesionPase.grupoId)?.nombre||'')} · ${esc(sesionPase.fecha)}</span>
      <span class="kiosko-reloj" id="kioskoReloj">--:--:--</span>
    </div>
    <div id="kioskReader"></div>
    <div class="kiosko-feedback espera" id="kioskoFeedback">
      <strong>Acerca tu credencial al lector</strong>
      <span>Tolerancia para retardo: ${DB.plantel.toleranciaMin} minutos después del inicio de clase</span>
    </div>
    <div class="kiosko-contador"><b id="kioskoTotal">0</b>registros en esta clase</div>`;
  document.body.appendChild(ov);

  const tick = ()=>{ const e=$('#kioskoReloj'); if(e) e.textContent = new Date().toLocaleTimeString('es-MX'); };
  tick(); relojKiosko = setInterval(tick, 1000);
  actualizarContadorKiosko();

  $('#kioskoSalir').addEventListener('click', cerrarKiosko);

  lectorKiosko = new Html5Qrcode('kioskReader');
  lectorKiosko.start({facingMode:'environment'}, {fps:10, qrbox:{width:240,height:240}},
    texto=>{
      const ahora = Date.now();
      if(texto===kioskoUltimo.texto && ahora-kioskoUltimo.t<3000) return;
      kioskoUltimo = {texto, t:ahora};
      procesarKiosko(texto);
    }, ()=>{})
  .catch(()=>{
    $('#kioskoFeedback').className = 'kiosko-feedback err';
    $('#kioskoFeedback').innerHTML = '<strong>No fue posible acceder a la cámara</strong><span>Revisa los permisos del navegador y vuelve a intentar.</span>';
  });
}

function procesarKiosko(texto){
  const fb = $('#kioskoFeedback'); if(!fb) return;
  const muestra = (clase, titulo, sub, ok)=>{
    fb.className = 'kiosko-feedback '+clase;
    fb.innerHTML = `<strong>${titulo}</strong><span>${sub}</span>`;
    beepKiosko(ok);
    setTimeout(()=>{ if($('#kioskoFeedback') && fb.dataset.t===marca){
      fb.className='kiosko-feedback espera';
      fb.innerHTML='<strong>Acerca tu credencial al lector</strong><span>Listo para el siguiente alumno</span>';
    }}, 3200);
  };
  const marca = String(Date.now()); fb.dataset.t = marca;

  const m = /^P50\|(.+)$/.exec(texto.trim());
  if(!m){ muestra('err','Código no válido','Esta credencial no pertenece al sistema de la Prepa 50.',false); return; }
  const al = DB.alumnos.find(a=>a.matricula===m[1]);
  if(!al){ muestra('err','Matrícula no encontrada',`No existe registro de la matrícula ${esc(m[1])}.`,false); return; }
  if(al.grupoId!==sesionPase.grupoId){ muestra('err',esc(nombreCompleto(al)),'Perteneces a otro grupo: avisa a tu docente.',false); return; }

  const previo = registroDe(al.id);
  if(previo && (previo.estado==='P'||previo.estado==='R')){
    muestra('retardo', esc(nombreCompleto(al)), `Ya estabas registrado a las ${esc(previo.hora||'')} (${ESTADOS[previo.estado]}).`, true);
    return;
  }
  const estado = estadoSegunHora();
  marcarAsistencia(al.id, estado, 'qr');
  muestra(estado==='P'?'ok':'retardo', `✅ ${esc(nombreCompleto(al))}`,
    estado==='P' ? '¡Bienvenido! Asistencia registrada.' : `Registrado con retardo (después de ${DB.plantel.toleranciaMin} min de tolerancia).`, true);
  actualizarContadorKiosko();
}
function actualizarContadorKiosko(){
  const e = $('#kioskoTotal'); if(!e) return;
  e.textContent = DB.asistencias.filter(a=>a.fecha===sesionPase.fecha &&
    a.materiaId===sesionPase.materiaId && a.grupoId===sesionPase.grupoId).length;
}
function cerrarKiosko(){
  clearInterval(relojKiosko); relojKiosko = null;
  const fin = ()=>{ $('#kioskoOverlay')?.remove();
    if(vistaActual==='asistencia') render(); };
  if(lectorKiosko){
    lectorKiosko.stop().catch(()=>{}).finally(()=>{ try{lectorKiosko.clear();}catch(_){} lectorKiosko=null; fin(); });
  } else fin();
}

/* ───────────────────────── 19. ARRANQUE ───────────────────────── */
const VISTAS = {
  dashboard:vistaDashboard, asistencia:vistaAsistencia, calificaciones:vistaCalificaciones,
  docentes:vistaDocentes, materias:vistaMaterias, grupos:vistaGrupos, horarios:vistaHorarios,
  credenciales:vistaCredenciales, consultas:vistaConsultas, estadisticas:vistaEstadisticas,
  reportes:vistaReportes,
};
iniciarSistema();   // decide modo local o nube (ver js/nube.js)
