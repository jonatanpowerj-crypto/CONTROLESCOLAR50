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

/* ── Malla horaria oficial · Preparatoria No. 50 (turno vespertino) ──
   8 franjas de 40 min; la de 17:40–18:15 es RECESO (no se programan clases). */
const BLOQUES_P50 = [
  {hi:'15:00', hf:'15:40'},
  {hi:'15:40', hf:'16:20'},
  {hi:'16:20', hf:'17:00'},
  {hi:'17:00', hf:'17:40'},
  {hi:'17:40', hf:'18:15', receso:true},   // RECESO
  {hi:'18:15', hf:'18:55'},
  {hi:'18:55', hf:'19:35'},
  {hi:'19:35', hf:'20:15'},
];

/* ── Catálogo oficial · Plan de Estudios del Bachillerato General 2023 (MCCEMS) ──
   Permite crear materias con la clave y semestre oficiales sin teclear. */
const PLAN_2023 = [
  {sem:1, clave:'23B04101', nombre:'La Materia y sus Interacciones'},
  {sem:1, clave:'23B04102', nombre:'Humanidades I'},
  {sem:1, clave:'23B04103', nombre:'Ciencias Sociales I'},
  {sem:1, clave:'23B04104', nombre:'Laboratorio de Investigación I'},
  {sem:1, clave:'23B04105', nombre:'Lengua y Comunicación I'},
  {sem:1, clave:'23B04106', nombre:'Inglés I'},
  {sem:1, clave:'23B04107', nombre:'Pensamiento Matemático I'},
  {sem:1, clave:'23B04108', nombre:'Cultura Digital I'},
  {sem:1, clave:'23B04109', nombre:'Actividades Físico-Deportivas I'},
  {sem:1, clave:'23B04151', nombre:'Tutorías I'},
  {sem:2, clave:'23B04211', nombre:'Conservación de la Energía y sus Interacciones con la Materia'},
  {sem:2, clave:'23B04212', nombre:'Temas Selectos de Ciencias Naturales I'},
  {sem:2, clave:'23B04213', nombre:'Humanidades II'},
  {sem:2, clave:'23B04214', nombre:'Ciencias Sociales II'},
  {sem:2, clave:'23B04215', nombre:'Lengua y Comunicación II'},
  {sem:2, clave:'23B04216', nombre:'Inglés II'},
  {sem:2, clave:'23B04217', nombre:'Pensamiento Matemático II'},
  {sem:2, clave:'23B04218', nombre:'Cultura Digital II'},
  {sem:2, clave:'23B04219', nombre:'Actividades Físico-Deportivas II'},
  {sem:2, clave:'23B04252', nombre:'Tutorías II'},
  {sem:3, clave:'23B04320', nombre:'Temas Selectos de Ciencias Naturales II'},
  {sem:3, clave:'23B04323', nombre:'Conciencia Histórica I'},
  {sem:3, clave:'23B04324', nombre:'Lengua y Comunicación III'},
  {sem:3, clave:'23B04325', nombre:'Inglés III'},
  {sem:3, clave:'23B04326', nombre:'Pensamiento Matemático III'},
  {sem:3, clave:'23B04327', nombre:'Actividades Artísticas y Culturales I'},
  {sem:3, clave:'23B04328', nombre:'Desarrollo Emocional'},
  {sem:3, clave:'23B04353', nombre:'Tutorías III'},
  {sem:4, clave:'23B04429', nombre:'Reacciones Químicas: Conservación de la Materia y Formación de Nuevas Sustancias'},
  {sem:4, clave:'23B04431', nombre:'Conciencia Histórica II'},
  {sem:4, clave:'23B04432', nombre:'Pensamiento Literario I'},
  {sem:4, clave:'23B04433', nombre:'Inglés IV'},
  {sem:4, clave:'23B04434', nombre:'Pensamiento Matemático IV'},
  {sem:4, clave:'23B04435', nombre:'Temas Selectos de Matemáticas I'},
  {sem:4, clave:'23B04436', nombre:'Actividades Artísticas y Culturales II'},
  {sem:4, clave:'23B04454', nombre:'Tutorías IV'},
  {sem:4, clave:'23B04457', nombre:'Temas Selectos de Ciencias Naturales III'},
  {sem:4, clave:'23B04460', nombre:'Humanidades III'},
  {sem:5, clave:'23B04537', nombre:'Organismos, Estructuras y Procesos. Herencia y Evolución Biológica'},
  {sem:5, clave:'23B04538', nombre:'La Energía en los Procesos de la Vida Diaria'},
  {sem:5, clave:'23B04539', nombre:'Ciencias Sociales III'},
  {sem:5, clave:'23B04540', nombre:'Pensamiento Literario II'},
  {sem:5, clave:'23B04541', nombre:'Temas Selectos de Matemáticas II'},
  {sem:5, clave:'23B04542', nombre:'Actividades Artísticas y Culturales III'},
  {sem:5, clave:'23B04543', nombre:'Educación Integral en Salud'},
  {sem:5, clave:'23B04555', nombre:'Tutorías V'},
  {sem:6, clave:'23B04644', nombre:'Ecosistemas: Interacciones, Energía y Dinámica'},
  {sem:6, clave:'23B04645', nombre:'La Realidad Económica de México'},
  {sem:6, clave:'23B04646', nombre:'Geografía'},
  {sem:6, clave:'23B04647', nombre:'Construcción Colectiva de lo Social'},
  {sem:6, clave:'23B04648', nombre:'Laboratorio de Investigación II'},
  {sem:6, clave:'23B04649', nombre:'Temas Selectos de Matemáticas III'},
  {sem:6, clave:'23B04650', nombre:'Práctica y Colaboración Ciudadana'},
  {sem:6, clave:'23B04656', nombre:'Tutorías VI'},
];
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
    bitacora:[],         // {id, fecha, materiaId, grupoId, campo, tema, actividades, tarea, observaciones}
    calendario:[],       // {id, fecha, fechaFin, titulo, tipo, nota}
  };
}

/* ── Ciclo escolar UAGro: Agosto–Enero = A (impar) · Febrero–Julio = B (par) ── */
/* ── Ciclo escolar UAGro ──────────────────────────────────────────────
   Semestre impar (A): agosto-enero   (ej. 2026-A: ago2026 – ene2027)
   Semestre par   (B): febrero-julio  (ej. 2026-B: feb2026 – jul2026)
   El "año" del ciclo es el año en que INICIA el período.
   ─────────────────────────────────────────────────────────────────── */
function cicloActualAuto(fecha = new Date()){
  const mes = fecha.getMonth()+1, anio = fecha.getFullYear();
  if(mes>=8) return `${anio}-A`;
  if(mes===1) return `${anio-1}-A`;
  return `${anio}-B`;
}
function siguienteCiclo(ciclo){
  const m = /^(\d{4})-([AB])$/.exec(ciclo||'');
  if(!m) return cicloActualAuto();
  const [,anio,letra] = m;
  return letra==='A' ? `${anio}-B` : `${+anio+1}-A`;
}
function etiquetaCiclo(ciclo){
  const m = /^(\d{4})-([AB])$/.exec(ciclo||'');
  if(!m) return ciclo||'Sin ciclo';
  const [,anio,letra] = m;
  return letra==='A' ? `${anio}-A (ago ${anio} – ene ${+anio+1})` : `${anio}-B (feb ${anio} – jul ${anio})`;
}
function listaCiclos(n=8){
  const actual = cicloActualAuto();
  const parse = c=>{ const m=/^(\d{4})-([AB])$/.exec(c); return m?[+m[1],m[2]]:null; };
  const out = new Set(); const [a0,l0] = parse(actual)||[new Date().getFullYear(),'A'];
  for(let i=-(n>>1);i<=(n>>1);i++){
    let a=a0, l=l0, p=i;
    while(p>0){ l=l==='A'?'B':'A'; if(l==='A') a++; p--; }
    while(p<0){ if(l==='A') a--; l=l==='B'?'A':'B'; p++; }
    out.add(`${a}-${l}`);
  }
  return [...out].sort();
}

function estructuraVacia(){
  return { plantel:{nombre:'Preparatoria No. 50', universidad:'Universidad Autónoma de Guerrero',
      ciudad:'Tlacoachistlahuaca, Gro.', ciclo:cicloActualAuto(), toleranciaMin:10},
    docentes:[], materias:[], grupos:[], alumnos:[], horarios:[], asistencias:[], calificaciones:[],
    bitacora:[], calendario:[] };
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
  bitacora:['Bitácora y planeación','Registro de clase alineado a la NEM'],
  docentes:['Docentes','Plantilla académica del plantel'],
  materias:['Materias y rubros','Unidades de aprendizaje y criterios de evaluación'],
  grupos:['Grupos y alumnos','Matrícula por grupo'],
  horarios:['Horarios','Carga horaria semanal'],
  vistaplantel:['Vista general del plantel','Horario completo de todos los grupos y semestres'],
  auditor:['Auditor de horarios','Detección de duplicados, choques y conflictos'],
  calendario:['Calendario escolar','Parciales, periodos y eventos del ciclo'],
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

/* ── Instalación de la app (PWA) ── */
let promptInstalar = null;
window.addEventListener('beforeinstallprompt', e=>{
  e.preventDefault();
  promptInstalar = e;
  const b = $('#btnInstalar'); if(b) b.hidden = false;
});
$('#btnInstalar')?.addEventListener('click', async ()=>{
  if(!promptInstalar) return;
  promptInstalar.prompt();
  const res = await promptInstalar.userChoice;
  promptInstalar = null;
  $('#btnInstalar').hidden = true;
  if(res.outcome==='accepted') toast('¡App instalada! Búscala en tu pantalla de inicio.');
});
window.addEventListener('appinstalled', ()=>{ const b=$('#btnInstalar'); if(b) b.hidden=true; });

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
function bandaProximoEvento(){
  const hoy = hoyISO();
  const prox = [...DB.calendario].filter(e=>(e.fechaFin||e.fecha)>=hoy)
    .sort((a,b)=>a.fecha.localeCompare(b.fecha))[0];
  if(!prox) return '';
  const dias = Math.round((new Date(prox.fecha+'T12:00') - new Date(hoy+'T12:00'))/86400000);
  const cuando = dias<=0 ? 'En curso' : dias===1 ? 'Mañana' : `En ${dias} días`;
  const t = TIPOS_EVENTO[prox.tipo]||TIPOS_EVENTO.evento;
  return `<div class="card" style="margin-bottom:1rem;border-left:5px solid ${t.color};display:flex;align-items:center;gap:.8rem;flex-wrap:wrap">
    <span style="font-size:1.4rem">📅</span>
    <div style="flex:1"><strong>${esc(prox.titulo)}</strong> <span class="tag tag-info">${esc(t.label)}</span><br>
      <span class="muted">${esc(new Date(prox.fecha+'T12:00').toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long'}))}</span></div>
    <span class="tag ${dias<=3?'tag-aviso':'tag-info'}">${cuando}</span>
  </div>`;
}
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
  ${bandaProximoEvento()}
  <div class="grid grid-4">
    <div class="card stat"><span class="num">${alumnosVis.length}</span><span class="lbl">${esAdmin()?'Alumnos inscritos':'Alumnos en mis grupos'}</span></div>
    <div class="card stat"><span class="num">${clasesHoy.length}</span><span class="lbl">Clases hoy (${esc(diaCap)})</span></div>
    <div class="card stat gold"><span class="num">${presentes}</span><span class="lbl">Asistencias hoy</span></div>
    <div class="card stat"><span class="num" style="color:var(--mal)">${faltas}</span><span class="lbl">Faltas hoy</span></div>
  </div>

  <div class="grid grid-2" style="margin-top:1rem">
    <div class="card">
      <h3>🗓️ Clases programadas hoy</h3>
      ${clasesHoy.length ? clasesHoy.map(h=>{
        const ahora = new Date().toTimeString().slice(0,5);
        const enCurso = h.hi<=ahora && ahora<h.hf;
        const proxima = h.hi>ahora;
        return `<div class="bloque-clase" style="${enCurso?'border-left-color:var(--ok);background:var(--ok-bg)':proxima?'border-left-color:var(--oro-500)':'opacity:.6'}">
          <strong>${esc(h.hi)}–${esc(h.hf)} · ${esc(materia(h.materiaId)?.nombre || '—')} ${enCurso?'<span class="tag tag-ok">Ahora</span>':''}</strong>
          <span>${esc(grupo(h.grupoId)?.nombre || '')} · ${esc(h.aula)} · ${esc(docente(materia(h.materiaId)?.docenteId)?.nombre || '')}</span>
        </div>`;}).join('')
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
  el.querySelectorAll('[data-wa]').forEach(b=>b.addEventListener('click',()=>avisarTutor(b.dataset.wa)));
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
  return `<div class="table-wrap"><table><thead><tr><th>Alumno</th><th>Grupo</th><th>Asistencia</th><th>Avisar</th></tr></thead><tbody>
    ${filas.map(({a,p})=>`<tr><td>${esc(nombreCompleto(a))}</td><td>${esc(grupo(a.grupoId)?.nombre||'')}</td>
    <td><span class="tag tag-mal">${p} %</span></td>
    <td>${a.telTutor ? `<button class="btn btn-sm btn-gold no-print" data-wa="${a.id}" title="Enviar aviso al tutor por WhatsApp">📲 Tutor</button>` : '<span class="muted">Sin tel.</span>'}</td></tr>`).join('')}</tbody></table></div>`;
}

/* Genera el aviso al tutor y abre WhatsApp con el mensaje listo */
function avisarTutor(alumnoId){
  const a = alumno(alumnoId); if(!a) return;
  if(!a.telTutor){ toast('Este alumno no tiene teléfono de tutor registrado.'); return; }
  const p = porcentajeAsistencia(a.id);
  const faltas = DB.asistencias.filter(x=>x.alumnoId===a.id && x.estado==='F').length;
  const g = grupo(a.grupoId);
  const tel = a.telTutor.replace(/[^\d]/g,'');
  const telFull = tel.length===10 ? '52'+tel : tel;  // México: anteponer 52 si son 10 dígitos
  const msg =
`Estimado(a) ${a.tutor||'tutor(a)'}:

Le saluda la Preparatoria No. 50 de la UAGro (Tlacoachistlahuaca, Gro.).

Le informamos sobre la asistencia de su hijo(a) *${nombreCompleto(a)}* (matrícula ${a.matricula}), del grupo ${g?.nombre||''}:

• Asistencia actual: ${p}%
• Faltas acumuladas: ${faltas}

Le solicitamos atentamente comunicarse con el plantel para dar seguimiento. Su apoyo es fundamental para el desempeño del estudiante.

Atentamente,
${autorActual()==='local'?'Docente':autorActual()}`;
  const url = `https://wa.me/${telFull}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
  toast('Abriendo WhatsApp con el aviso listo para enviar.');
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
  if(r){ r.estado=estado; r.metodo=metodo; r.hora=hora; sellarAutoria(r, false); }
  else { r = {id:uid(), fecha:sesionPase.fecha, materiaId:sesionPase.materiaId,
    grupoId:sesionPase.grupoId, alumnoId, estado, metodo, hora};
    sellarAutoria(r, true);
    DB.asistencias.push(r); }
  persist('asistencias', r);
}

function pintarZonaPase(){
  const zona = $('#paseZona'); if(!zona) return;
  const lista = alumnosDeGrupo(sesionPase.grupoId);

  const filaAlumno = a=>{
    const r = registroDe(a.id);
    const autoria = r && r.editadoPor && r.editadoPor!=='local'
      ? ` title="Registró: ${esc(r.editadoPor)}${r.editadoEn?' · '+new Date(r.editadoEn).toLocaleString('es-MX'):''}"` : '';
    return `<tr>
      <td class="mono">${esc(a.matricula)}</td>
      <td>${esc(nombreCompleto(a))}</td>
      <td${autoria}>${r ? `<span class="tag ${r.estado==='P'?'tag-ok':r.estado==='F'?'tag-mal':r.estado==='R'?'tag-aviso':'tag-info'}">${ESTADOS[r.estado]}</span>
              ${r.metodo==='qr'?'<span class="tag tag-qr">QR</span>':''} <small class="muted">${esc(r.hora||'')}</small>${r&&r.editadoPor&&r.editadoPor!=='local'?' <small class="muted">👤</small>':''}` : '<span class="muted">Sin registro</span>'}</td>
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
      if(existente){ if(existente.valor!==valor){ existente.valor = valor; sellarAutoria(existente, false); cambiadas.push(existente); } }
      else { const n = {id:uid(), alumnoId, materiaId:sesionCal.materiaId, parcial:sesionCal.parcial, rubro, valor};
        sellarAutoria(n, true); DB.calificaciones.push(n); cambiadas.push(n); }
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
    <button class="btn btn-gold" id="solicitudesNube">☁️ Solicitudes en línea</button>
    <button class="btn btn-outline" id="impRegistro">📥 Importar archivo</button>
    <input type="file" id="fileRegistro" accept=".json" hidden>
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
  $('#impRegistro').addEventListener('click', ()=>$('#fileRegistro').click());
  $('#solicitudesNube').addEventListener('click', ()=>modalSolicitudesNube());
  $('#fileRegistro').addEventListener('change', e=>{
    const f = e.target.files[0]; if(!f) return;
    const r = new FileReader();
    r.onload = ()=>{ try{ importarRegistroDocente(JSON.parse(r.result)); }
      catch(_){ toast('El archivo no es un registro válido.'); } };
    r.readAsText(f); e.target.value='';
  });
  pintar();
}
/* Lee la bandeja de registros en línea (colección registros_docentes) */
function modalSolicitudesNube(){
  if(typeof MODO==='undefined' || MODO!=='nube' || typeof fsdb==='undefined' || !fsdb){
    toast('Las solicitudes en línea requieren el modo nube activo.'); return;
  }
  abrirModal('☁️ Solicitudes de registro en línea', '<p class="muted">Cargando solicitudes…</p>', body=>{
    fsdb.collection('registros_docentes').get().then(snap=>{
      const regs = snap.docs.map(d=>d.data()).sort((a,b)=>(b.actualizado||'').localeCompare(a.actualizado||''));
      if(!regs.length){ body.innerHTML = '<div class="vacio"><span class="icono">📭</span>No hay solicitudes en línea por ahora. Cuando un docente guarde su registro desde la app, aparecerá aquí.</div>'; return; }
      body.innerHTML = `<p class="muted">${regs.length} solicitud(es) recibida(s). Revisa cada una y pulsa «Incorporar» para registrar al docente y sus materias.</p>
        <div id="solLista" style="margin-top:.6rem"></div>`;
      const pintar = ()=>{
        body.querySelector('#solLista').innerHTML = regs.map((r,idx)=>{
          const totalHoras = (r.materias||[]).reduce((a,m)=>a+(+m.horasSemana||0),0);
          return `<div class="config-card" data-idx="${idx}">
            <div style="display:flex;justify-content:space-between;gap:.5rem;align-items:start">
              <div><h4>${esc(r.docente?.nombre||'(sin nombre)')}</h4>
                <span class="clave">${esc(r.docente?.email||'')} · ${(r.materias||[]).length} materia(s) · ${totalHoras} h/sem</span></div>
              <span class="tag ${r.estado==='incorporado'?'tag-ok':'tag-aviso'}">${r.estado==='incorporado'?'Incorporado':'Pendiente'}</span>
            </div>
            <div style="margin-top:.5rem">${(r.materias||[]).map(m=>`<span class="tag tag-info" style="margin:.1rem">${esc(m.clave)} · ${esc(m.nombre)}${m.grupos?' ('+esc(m.grupos)+')':''}</span>`).join(' ')}</div>
            <div style="display:flex;gap:.4rem;margin-top:.6rem">
              <button class="btn btn-sm btn-primary" data-inc="${idx}">✓ Incorporar al sistema</button>
              <button class="btn btn-sm btn-danger" data-del="${idx}">🗑 Descartar</button>
            </div>
          </div>`;
        }).join('');
        body.querySelectorAll('[data-inc]').forEach(b=>b.addEventListener('click',()=>{
          const r = regs[+b.dataset.inc];
          aplicarRegistro(r);
          // marcar como incorporado en la nube
          fsdb.collection('registros_docentes').doc(r.id).set({...r, estado:'incorporado'}).catch(()=>{});
          r.estado='incorporado'; pintar();
          toast(`Incorporado: ${r.docente?.nombre}`);
        }));
        body.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{
          const r = regs[+b.dataset.del];
          if(!confirm(`¿Descartar la solicitud de ${r.docente?.nombre}? Esto no elimina nada del sistema, solo quita la solicitud de la bandeja.`)) return;
          fsdb.collection('registros_docentes').doc(r.id).delete().catch(()=>{});
          regs.splice(+b.dataset.del,1); pintar();
          toast('Solicitud descartada.');
        }));
      };
      pintar();
    }).catch(e=>{ console.error(e); body.innerHTML='<p class="tag tag-mal">No se pudieron leer las solicitudes. Revisa las reglas de Firestore.</p>'; });
  });
}

/* Aplica un registro (de archivo o de la nube) al sistema: docente + materias */
function aplicarRegistro(data){
  if(!data || !data.docente || !Array.isArray(data.materias)) return;
  const d = data.docente;
  let doc = DB.docentes.find(x=>(x.email||'').toLowerCase()===(d.email||'').toLowerCase() && d.email);
  if(!doc){ doc = {id:uid(), nombre:d.nombre, email:d.email||'', telefono:d.telefono||'', especialidad:d.especialidad||''};
    DB.docentes.push(doc); persist('docentes', doc); }
  const cambios = [];
  data.materias.forEach(m=>{
    // Buscar por clave Y semestre (evita mezclar con una materia homónima de otro semestre)
    let mat = DB.materias.find(x=>x.clave===m.clave && x.semestre===m.semestre);
    const rubros = (m.rubros&&m.rubros.length)?m.rubros:[{nombre:'Examen',peso:40},{nombre:'Trabajos',peso:35},{nombre:'Participación',peso:25}];
    if(mat){ mat.docenteId=doc.id; if(m.horasSemana)mat.horasSemana=m.horasSemana; if(m.sesionesSemana)mat.sesionesSemana=m.sesionesSemana; cambios.push(mat); }
    else { mat={id:uid(), clave:m.clave, nombre:m.nombre, semestre:m.semestre,
      horasSemana:m.horasSemana||0, sesionesSemana:m.sesionesSemana||0, docenteId:doc.id, rubros};
      DB.materias.push(mat); cambios.push(mat); }
  });
  persist('materias', cambios);
  render();
}

/* Importa el archivo generado por la app externa de registro de docentes */
function importarRegistroDocente(data){
  if(!data || !data.docente || !Array.isArray(data.materias)){ toast('El archivo no tiene el formato esperado.'); return; }
  const d = data.docente;
  const previa = data.materias.map(m=>{
    const existe = DB.materias.some(x=>x.clave===m.clave && x.semestre===m.semestre);
    return `<tr><td class="mono">${esc(m.clave)}</td><td>${esc(m.nombre)}</td>
      <td style="text-align:center">${m.semestre}</td><td style="text-align:center">${esc(m.grupos||'—')}</td>
      <td style="text-align:center">${m.sesionesSemana||0}</td>
      <td>${existe?'<span class="tag tag-aviso">Ya existe</span>':'<span class="tag tag-ok">Nueva</span>'}</td></tr>`;
  }).join('');

  abrirModal('📥 Importar registro de docente', `
    <p><strong>${esc(d.nombre)}</strong> · ${esc(d.email||'sin correo')}</p>
    <p class="muted">Especialidad: ${esc(d.especialidad||'—')} · Tel: ${esc(d.telefono||'—')}</p>
    <p class="muted" style="margin:.6rem 0">Se registrará al docente (si no existe) y se crearán sus materias. Las materias que ya existen se vincularán a este docente.</p>
    <div class="table-wrap" style="max-height:300px;overflow-y:auto"><table>
      <thead><tr><th>Clave</th><th>Materia</th><th>Sem.</th><th>Grupo</th><th>Ses.</th><th>Estado</th></tr></thead>
      <tbody>${previa}</tbody></table></div>
    <div class="modal-foot"><button class="btn btn-outline" id="riCan">Cancelar</button>
    <button class="btn btn-primary" id="riOk">Importar ${data.materias.length} materia(s)</button></div>`,
  body=>{
    body.querySelector('#riCan').addEventListener('click', cerrarModal);
    body.querySelector('#riOk').addEventListener('click', ()=>{
      // 1) Docente: buscar por correo o crear
      let doc = DB.docentes.find(x=>(x.email||'').toLowerCase()===(d.email||'').toLowerCase() && d.email);
      if(!doc){ doc = {id:uid(), nombre:d.nombre, email:d.email||'', telefono:d.telefono||'', especialidad:d.especialidad||''};
        DB.docentes.push(doc); persist('docentes', doc); }
      // 2) Materias: crear nuevas o vincular existentes
      const cambios = [];
      data.materias.forEach(m=>{
        let mat = DB.materias.find(x=>x.clave===m.clave && x.semestre===m.semestre);
        const rubros = (m.rubros&&m.rubros.length)?m.rubros:[{nombre:'Examen',peso:40},{nombre:'Trabajos',peso:35},{nombre:'Participación',peso:25}];
        if(mat){ mat.docenteId=doc.id; if(m.horasSemana)mat.horasSemana=m.horasSemana; if(m.sesionesSemana)mat.sesionesSemana=m.sesionesSemana; cambios.push(mat); }
        else { mat={id:uid(), clave:m.clave, nombre:m.nombre, semestre:m.semestre,
          horasSemana:m.horasSemana||0, sesionesSemana:m.sesionesSemana||0, docenteId:doc.id, rubros};
          DB.materias.push(mat); cambios.push(mat); }
      });
      persist('materias', cambios);
      cerrarModal(); render();
      toast(`Importado: ${d.nombre} con ${data.materias.length} materia(s).`);
    });
  });
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
    ${esAdmin()?'<button class="btn btn-gold" id="planOficial">📋 Cargar del plan oficial 2023</button>':''}
    <button class="btn btn-primary" id="nuevaMat">＋ Nueva materia</button>
  </div>
  <div id="listaMat" class="grid grid-2"></div>`;

  if(esAdmin()) $('#planOficial').addEventListener('click', ()=>modalPlanOficial());

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
/* Modal: cargar materias desde el catálogo oficial del Plan 2023 */
function modalPlanOficial(){
  let semSel = 1;
  const yaExiste = clave => DB.materias.some(m=>m.clave===clave);

  abrirModal('📋 Plan de Estudios · Bachillerato General 2023', `
    <p class="muted">Selecciona el semestre y marca las materias a crear. Se generan con su clave oficial; las que ya existen aparecen deshabilitadas. Después podrás asignarles docente, horas y rubros.</p>
    <div class="field" style="margin:.7rem 0"><label>Semestre</label>
      <select id="poSem">${[1,2,3,4,5,6].map(s=>`<option value="${s}">${['Primero','Segundo','Tercero','Cuarto','Quinto','Sexto'][s-1]} semestre</option>`).join('')}</select></div>
    <div style="margin-bottom:.5rem"><button class="btn btn-sm btn-outline" id="poTodas">Marcar todas</button></div>
    <div id="poLista" style="max-height:320px;overflow-y:auto"></div>
    <div class="modal-foot"><button class="btn btn-outline" id="poCan">Cancelar</button>
    <button class="btn btn-primary" id="poOk">Crear materias seleccionadas</button></div>`,
  body=>{
    const pintarLista = ()=>{
      const mats = PLAN_2023.filter(m=>m.sem===semSel);
      body.querySelector('#poLista').innerHTML = `<div class="table-wrap"><table><tbody>
        ${mats.map((m,i)=>{
          const existe = yaExiste(m.clave);
          return `<tr>
            <td style="width:38px"><input type="checkbox" data-i="${i}" ${existe?'disabled':''} style="width:18px;height:18px"></td>
            <td class="mono" style="white-space:nowrap">${esc(m.clave)}</td>
            <td>${esc(m.nombre)}</td>
            <td>${existe?'<span class="tag tag-ok">Ya existe</span>':''}</td></tr>`;
        }).join('')}</tbody></table></div>`;
    };
    pintarLista();
    body.querySelector('#poSem').addEventListener('change', e=>{ semSel=+e.target.value; pintarLista(); });
    body.querySelector('#poTodas').addEventListener('click', ()=>{
      body.querySelectorAll('#poLista input[type=checkbox]:not(:disabled)').forEach(c=>c.checked=true);
    });
    body.querySelector('#poCan').addEventListener('click', cerrarModal);
    body.querySelector('#poOk').addEventListener('click', ()=>{
      const mats = PLAN_2023.filter(m=>m.sem===semSel);
      const elegidas = [...body.querySelectorAll('#poLista input[type=checkbox]:checked')].map(c=>mats[+c.dataset.i]);
      if(!elegidas.length){ toast('Marca al menos una materia.'); return; }
      const rubrosDefault = [
        {nombre:'Examen', peso:40},
        {nombre:'Productos y trabajos', peso:35},
        {nombre:'Participación y actitud', peso:25},
      ];
      const nuevas = elegidas.map(m=>({id:uid(), clave:m.clave, nombre:m.nombre, semestre:m.sem,
        horasSemana:0, sesionesSemana:0, docenteId:null, rubros:rubrosDefault.map(r=>({...r}))}));
      nuevas.forEach(n=>DB.materias.push(n));
      persist('materias', nuevas);
      cerrarModal(); render(); toast(`${nuevas.length} materia(s) creada(s) desde el plan oficial.`);
    });
  });
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
      <div class="field"><label>Horas por semana</label>
        <input type="number" id="fHoras" min="0" max="20" value="${m.horasSemana||0}" placeholder="Ej. 4"></div>
      <div class="field"><label>Sesiones por semana</label>
        <input type="number" id="fSes" min="0" max="5" value="${m.sesionesSemana||0}" placeholder="Ej. 2"></div>
      <div class="field full"><label style="display:flex;align-items:center;gap:.5rem;cursor:pointer">
        <input type="checkbox" id="fPrioridad" ${m.prioridadTemprana?'checked':''} style="width:18px;height:18px">
        ⭐ Priorizar en las primeras horas de la semana</label>
        <span class="muted" style="font-size:.74rem">Útil para materias que requieren mayor concentración (matemáticas, ciencias).</span></div>
      ${(typeof esAdmin==='function' && !esAdmin())
        ? `<input type="hidden" id="fDoc" value="${esc(m.docenteId || (typeof PERFIL!=='undefined'?PERFIL.docenteId:'') || '')}">`
        : `<div class="field full"><label>Docente responsable</label>
        <select id="fDoc"><option value="">Sin asignar</option>${opciones(DB.docentes, d=>d.nombre, m.docenteId)}</select></div>`}
    </div>
    <p class="muted" style="font-size:.78rem;margin-top:.3rem">💡 Estos datos los usa el constructor automático de horarios. Para <strong>Cultura Digital</strong>, el sistema reparte las sesiones en días separados (2 o 3 días) automáticamente.</p>
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
        horasSemana:+body.querySelector('#fHoras').value||0,
        sesionesSemana:+body.querySelector('#fSes').value||0,
        prioridadTemprana:body.querySelector('#fPrioridad')?.checked||false,
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
      <select id="selGrupo">${opciones(grusVis, g=>`${g.nombre} · ${g.turno} (sem. ${g.semestre}) · ${g.ciclo||'sin ciclo'}`, grupoSel)}</select></div>
    ${admin?`<button class="btn btn-outline" id="nuevoGrupo">＋ Grupo</button>
    <button class="btn btn-gold" id="promoverGrupo">⬆ Promover a siguiente ciclo</button>
    <button class="btn btn-danger btn-sm" id="bajaGrupo">Eliminar grupo</button>
    <div class="spacer"></div>
    <button class="btn btn-gold" id="impExcel">⬆ Importar desde Excel</button>
    <button class="btn btn-primary" id="nuevoAl">＋ Inscribir alumno</button>`:'<div class="spacer"></div>'}
  </div>
  <div id="listaAl"></div>`;

  $('#selGrupo').addEventListener('change', e=>{ grupoSel=e.target.value; pintar(); });
  if(admin){
  $('#promoverGrupo').addEventListener('click', ()=>modalPromoverGrupo());
  $('#nuevoGrupo').addEventListener('click', ()=>{
    abrirModal('Nuevo grupo', `
      <div class="form-grid">
        <div class="field"><label>Nombre *</label><input id="gNom" placeholder='2° "C"'></div>
        <div class="field"><label>Semestre</label>
          <select id="gSem">${[1,2,3,4,5,6].map(s=>`<option>${s}</option>`).join('')}</select></div>
        <div class="field"><label>Turno</label>
          <select id="gTur"><option>Matutino</option><option>Vespertino</option></select></div>
        <div class="field"><label>Ciclo escolar</label>
          <select id="gCiclo">${listaCiclos().map(c=>`<option ${c===DB.plantel.ciclo?'selected':''}>${c}</option>`).join('')}</select></div>
      </div>
      <p class="muted" style="font-size:.78rem;margin-top:.4rem">💡 UAGro: semestre impar (A) agosto–enero, semestre par (B) febrero–julio.</p>
      <div class="modal-foot"><button class="btn btn-outline" id="gCan">Cancelar</button>
      <button class="btn btn-primary" id="gOk">Crear grupo</button></div>`,
    body=>{
      body.querySelector('#gCan').addEventListener('click', cerrarModal);
      body.querySelector('#gOk').addEventListener('click', ()=>{
        const nombre = body.querySelector('#gNom').value.trim();
        if(!nombre){ toast('Escribe el nombre del grupo.'); return; }
        const g = {id:uid(), nombre, semestre:+body.querySelector('#gSem').value,
          turno:body.querySelector('#gTur').value, ciclo:body.querySelector('#gCiclo').value};
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
      <thead><tr><th>Matrícula</th><th>Alumno</th><th>Padre / tutor</th><th>Tel. tutor</th><th>Asistencia global</th><th>Avisar</th>${admin?'<th></th>':''}</tr></thead><tbody>
      ${lista.map(a=>{
        const p = porcentajeAsistencia(a.id);
        return `<tr><td class="mono">${esc(a.matricula)}</td><td><strong>${esc(nombreCompleto(a))}</strong></td>
        <td>${esc(a.tutor||'—')}</td><td class="mono">${esc(a.telTutor||'—')}</td>
        <td>${p===null?'<span class="muted">Sin registros</span>':`<span class="tag ${p>=80?'tag-ok':'tag-mal'}">${p} %</span>`}</td>
        <td>${a.telTutor?`<button class="btn btn-sm btn-gold no-print" data-wa="${a.id}" title="Avisar al tutor por WhatsApp">📲</button>`:'<span class="muted">—</span>'}</td>
        ${admin?`<td><button class="btn btn-sm btn-outline" data-ed="${a.id}">Editar</button>
            <button class="btn btn-sm btn-danger" data-el="${a.id}">Baja</button></td>`:''}</tr>`;}).join('')}
      </tbody></table></div>`
    : '<div class="vacio card"><span class="icono">🎓</span>Este grupo aún no tiene alumnos inscritos.</div>';

    $('#listaAl').querySelectorAll('[data-wa]').forEach(b=>b.addEventListener('click',()=>avisarTutor(b.dataset.wa)));
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
    ${!esAdmin()?'<button class="btn btn-outline" id="miHorario">📅 Mi horario semanal</button>':''}
    <button class="btn btn-outline" id="horPDF">🧾 Exportar PDF</button>
    ${esAdmin()?`<button class="btn btn-gold" id="armarHorario">🪄 Armar este grupo</button>
    <button class="btn btn-danger" id="armarPlantel" style="background:var(--azul-900)">🏫 Armar TODO el plantel</button>
    <button class="btn btn-danger" id="borrarPlantel">🗑️ Borrar horario completo</button>`:''}
    <button class="btn btn-primary" id="nuevoHor">＋ Agregar clase</button>
  </div>
  <div id="horZona"></div>`;

  $('#horSel').addEventListener('change', e=>{ horGrupo=e.target.value; pintar(); });
  if(esAdmin()) $('#armarHorario').addEventListener('click', ()=>modalArmarHorario());
  if(esAdmin()) $('#armarPlantel')?.addEventListener('click', ()=>modalArmarPlantel());
  if(esAdmin()) $('#borrarPlantel')?.addEventListener('click', ()=>modalBorrarHorarioCompleto());
  if(!esAdmin()) $('#miHorario')?.addEventListener('click', ()=>modalMiHorario());
  $('#horPDF').addEventListener('click', ()=>exportarHorarioPDF(esAdmin()?horGrupo:null));
  $('#nuevoHor').addEventListener('click', ()=>{
    abrirModal('Agregar clase al horario', `
      <div class="form-grid">
        <div class="field full"><label>Materia</label>
          <select id="hMat">${opciones(misMaterias(), m=>`${m.clave} · ${m.nombre}`)}</select></div>
        <div class="field full"><label>Bloque horario</label>
          <select id="hBloque">${BLOQUES_P50.filter(b=>!b.receso).map(b=>`<option value="${b.hi}|${b.hf}">${b.hi} – ${b.hf}</option>`).join('')}</select></div>
        <div class="field"><label>Día</label>
          <select id="hDia">${DIAS.map(d=>`<option>${d}</option>`).join('')}</select></div>
        <div class="field"><label>Aula</label><input id="hAula" placeholder="Aula 4"></div>
      </div>
      <div class="modal-foot"><button class="btn btn-outline" id="hCan">Cancelar</button>
      <button class="btn btn-primary" id="hOk">Agregar al horario</button></div>`,
    body=>{
      body.querySelector('#hCan').addEventListener('click', cerrarModal);
      body.querySelector('#hOk').addEventListener('click', ()=>{
        const [hi, hf] = body.querySelector('#hBloque').value.split('|');
        const dia = body.querySelector('#hDia').value;
        const matId = body.querySelector('#hMat').value;
        const choque = DB.horarios.find(h=>h.grupoId===horGrupo && h.dia===dia && hi<h.hf && hf>h.hi);
        if(choque){ toast(`Choque de horario con ${materia(choque.materiaId)?.nombre} (${choque.hi}–${choque.hf}).`); return; }
        // Choque del docente: ya tiene clase a esa hora en otro grupo
        const docId = materia(matId)?.docenteId;
        if(docId){
          const choqueDoc = DB.horarios.find(h=>h.dia===dia && hi<h.hf && hf>h.hi && materia(h.materiaId)?.docenteId===docId);
          if(choqueDoc){ const gc=grupo(choqueDoc.grupoId);
            if(!confirm(`Atención: ${docente(docId)?.nombre||'el docente'} ya tiene clase ${dia} ${choqueDoc.hi}–${choqueDoc.hf} con el grupo ${gc?.nombre||''}. ¿Agregar de todas formas?`)) return; }
        }
        const nh = {id:uid(), materiaId:matId, grupoId:horGrupo,
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

/* ───────────────────────── 10B. CONSTRUCTOR AUTOMÁTICO DE HORARIOS ─────────────────────────
   Turno vespertino: 15:00 a 20:15, lunes a viernes.
   Bloques de 50 min separados por descanso a media tarde.
   Reparte las sesiones de cada materia del grupo en días distintos,
   priorizando "Cultura Digital" para que caiga en 2 o 3 días. */

/* Genera los bloques horarios del turno a partir de hora inicio/fin y duración */
function generarBloques(hInicio, hFin, durMin, recesoTrasBloque, recesoMin){
  const aMin = h => { const [H,M]=h.split(':').map(Number); return H*60+M; };
  const aHHMM = m => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
  const bloques = []; let t = aMin(hInicio); const fin = aMin(hFin); let n = 0;
  while(t + durMin <= fin){
    bloques.push({hi:aHHMM(t), hf:aHHMM(t+durMin)});
    t += durMin; n++;
    if(recesoTrasBloque && n===recesoTrasBloque){ t += recesoMin; }
  }
  return bloques;
}

/* ═══════════════════════════════════════════════════════════════════
   CONSTRUCTOR DE HORARIO · TODO EL PLANTEL
   Arma el horario de TODOS los grupos a la vez, reservando en cada
   bloque tanto el GRUPO como el DOCENTE simultáneamente. Así, un
   maestro que da clase en 2 o 3 semestres nunca queda agendado en
   dos grupos al mismo tiempo, sin importar cuántos grupos existan.
   ═══════════════════════════════════════════════════════════════════ */
function modalArmarPlantel(){
  const ciclosConGrupos = [...new Set(DB.grupos.map(g=>g.ciclo).filter(Boolean))];
  const cicloDefault = ciclosConGrupos.includes(DB.plantel.ciclo) ? DB.plantel.ciclo : (ciclosConGrupos[0]||DB.plantel.ciclo);
  if(!DB.grupos.length){ toast('Registra al menos un grupo antes de armar el horario.'); return; }

  abrirModal('🏫 Armar horario de TODO el plantel', `
    <p class="muted">El sistema acomodará los grupos del ciclo elegido a la vez, en la malla oficial (3:00–8:15 PM, receso 5:40–6:15). Si un docente imparte clase en varios grupos o semestres, el sistema <strong>nunca lo agendará dos veces a la misma hora</strong>. Cultura Digital se prioriza en 2–3 días por grupo.</p>
    <div class="field" style="margin-top:.7rem"><label>Ciclo escolar a armar</label>
      <select id="hpCiclo">${listaCiclos().map(c=>`<option ${c===cicloDefault?'selected':''}>${c} ${DB.grupos.filter(g=>g.ciclo===c).length?'· '+DB.grupos.filter(g=>g.ciclo===c).length+' grupo(s)':'· sin grupos'}</option>`).join('')}</select></div>
    <div class="field full" style="margin-top:.6rem"><label style="display:flex;align-items:center;gap:.5rem;cursor:pointer">
      <input type="checkbox" id="hpReiniciar" checked style="width:18px;height:18px">
      🔄 Reiniciar horario: borrar TODAS las clases actuales de estos grupos antes de armar</label>
      <span class="muted" style="font-size:.76rem">Recomendado. Evita duplicar sesiones si ya armaste antes. Desmárcalo solo si quieres conservar clases agregadas a mano y sumar el resto.</span></div>
    <div id="hpAvisoExistente" style="margin-top:.5rem"></div>
    <div id="hpPreview" style="margin-top:.9rem"></div>
    <div class="modal-foot">
      <button class="btn btn-outline" id="hpCan">Cancelar</button>
      <button class="btn btn-gold" id="hpVista">👁 Previsualizar</button>
      <button class="btn btn-primary" id="hpOk" disabled>Aplicar al plantel</button>
    </div>`,
  body=>{
    let propuestaGlobal = [];
    let grupos = DB.grupos.filter(g=>g.ciclo===cicloDefault || !g.ciclo);
    const mostrarAvisoExistente = ()=>{
      const gids = new Set(grupos.map(g=>g.id));
      const n = DB.horarios.filter(h=>gids.has(h.grupoId)).length;
      body.querySelector('#hpAvisoExistente').innerHTML = n
        ? `<p class="tag tag-aviso">Estos grupos ya tienen ${n} clase(s) en el horario actual.</p>` : '';
    };
    mostrarAvisoExistente();
    body.querySelector('#hpCiclo').addEventListener('change', e=>{
      grupos = DB.grupos.filter(g=>g.ciclo===e.target.value);
      body.querySelector('#hpPreview').innerHTML=''; body.querySelector('#hpOk').disabled=true;
      mostrarAvisoExistente();
    });
    body.querySelector('#hpCan').addEventListener('click', cerrarModal);

    const previsualizar = ()=>{
      const bloques = BLOQUES_P50.filter(b=>!b.receso);
      const esCultura = m => /cultura\s*digital/i.test(m.nombre);

      // Matrices de ocupación GLOBALES: por grupo y por docente, [dia][bloque]
      const ocupGrupo = {};   // ocupGrupo[grupoId][dia][bloque] = materiaId | 'previo'
      const ocupDoc = {};     // ocupDoc[docenteId][dia][bloque] = grupoId (para saber dónde está)
      grupos.forEach(g=>{ ocupGrupo[g.id] = DIAS.map(()=>bloques.map(()=>null)); });

      // Precargar TODO lo que ya existe en TODOS los grupos (grupo y docente)
      DB.horarios.forEach(h=>{
        const di = DIAS.indexOf(h.dia);
        if(di<0 || !ocupGrupo[h.grupoId]) return;
        const docId = materia(h.materiaId)?.docenteId;
        bloques.forEach((b,bi)=>{
          if(h.hi<b.hf && h.hf>b.hi){
            ocupGrupo[h.grupoId][di][bi] = 'previo';
            if(docId){ ocupDoc[docId] = ocupDoc[docId] || DIAS.map(()=>bloques.map(()=>null));
              ocupDoc[docId][di][bi] = h.grupoId; }
          }
        });
      });

      // Lista de "demandas": una por cada (grupo, materia) con sesionesSemana>0
      // Las materias del semestre del grupo que tengan sesiones configuradas.
      let demandas = [];
      grupos.forEach(g=>{
        const mats = DB.materias.filter(m=>m.semestre===g.semestre && (m.sesionesSemana||0)>0);
        mats.forEach(m=>demandas.push({grupo:g, materia:m}));
      });
      if(!demandas.length){
        body.querySelector('#hpPreview').innerHTML = '<p class="tag tag-aviso">Ninguna materia tiene «Sesiones por semana» configuradas. Ve a Materias y rubros y defínelas antes de continuar.</p>';
        body.querySelector('#hpOk').disabled = true; return;
      }

      propuestaGlobal = [];
      const sinLugar = [];
      const diasUsadosPorGM = {}; // clave grupo|materia -> [dias]

      // Carga total por docente (sesiones/semana) — se calcula ANTES de ordenar y asignar descanso
      const cargaTotalDoc = {};
      demandas.forEach(({materia:m})=>{ if(m.docenteId) cargaTotalDoc[m.docenteId]=(cargaTotalDoc[m.docenteId]||0)+(m.sesionesSemana||1); });
      const cargaDocente = {}; // nº de (grupo,materia) por docente
      demandas.forEach(d=>{ const did=d.materia.docenteId; if(did) cargaDocente[did]=(cargaDocente[did]||0)+1; });

      // ── DÍA DE DESCANSO PROACTIVO (con reparto equilibrado) ──
      // Cada docente cuya carga quepa en 4 días recibe 1 día libre. Para que las
      // reservas de distintos docentes no se saturen en los mismos grupos, se
      // reparten los días de descanso de forma balanceada (round-robin ponderado):
      // se cuenta cuántos docentes ya descansan cada día y se elige el menos usado.
      const NB = bloques.length;                 // 7 bloques de clase por día
      const capacidad4dias = NB * 4;             // 28
      const diaDescanso = {};                    // docId -> diaIndex prohibido
      const descansosPorDia = DIAS.map(()=>0);   // cuántos docentes descansan cada día

      // Procesar docentes de MAYOR a menor carga: los más cargados eligen primero
      const docentesOrdenados = Object.keys(cargaTotalDoc)
        .filter(d=>cargaTotalDoc[d]>0 && cargaTotalDoc[d]<=capacidad4dias)
        .sort((a,b)=>cargaTotalDoc[b]-cargaTotalDoc[a]);

      docentesOrdenados.forEach(docId=>{
        // Grupos donde este docente da clase
        const gruposDoc = new Set(demandas.filter(d=>d.materia.docenteId===docId).map(d=>d.grupo.id));
        // Elegir el día con MENOS descansos ya asignados (equilibrio del plantel)
        const orden = DIAS.map((d,di)=>({di, usados:descansosPorDia[di]})).sort((a,b)=>a.usados-b.usados);
        diaDescanso[docId] = orden[0].di;
        descansosPorDia[orden[0].di]++;
      });

      const diasDoc = {}; // docId -> Set(diaIndex) usados

      // Ordenar demandas para un armado que concentre los días de cada docente:
      // 1) Cultura Digital primero (prioridad institucional)
      // 2) AGRUPAR por docente (todas sus materias juntas, así se concentran sus días)
      // 3) dentro del docente, los de más carga primero
      demandas.sort((a,b)=>{
        if(esCultura(a.materia)!==esCultura(b.materia)) return esCultura(a.materia)?-1:1;
        const da = diaDescanso[a.materia.docenteId]!=null?1:0, db = diaDescanso[b.materia.docenteId]!=null?1:0;
        if(da!==db) return db-da;
        // Agrupar por docente: mismas materias del mismo maestro seguidas
        const docA = a.materia.docenteId||'zzz', docB = b.materia.docenteId||'zzz';
        if(docA!==docB){
          const ca = cargaTotalDoc[a.materia.docenteId]||0, cb = cargaTotalDoc[b.materia.docenteId]||0;
          if(ca!==cb) return cb-ca;             // docentes más cargados primero
          return docA.localeCompare(docB);       // desempate estable por id
        }
        return (b.materia.sesionesSemana||0)-(a.materia.sesionesSemana||0);
      });

      demandas.forEach(({grupo:g, materia:m})=>{
        const ses = m.sesionesSemana||1;
        const docId = m.docenteId;
        const claveGM = g.id+'|'+m.id;
        diasUsadosPorGM[claveGM] = diasUsadosPorGM[claveGM] || [];
        const pocaCarga = ses<=2;
        const diaLibre = (docId!=null) ? diaDescanso[docId] : undefined;

        for(let s=0; s<ses; s++){
          // Primer intento: respetando el día de descanso (excluyéndolo)
          let candidatos = construirCandidatos(true);
          // Si no hay lugar respetando el descanso, reintentar sin esa restricción
          if(!candidatos.length) candidatos = construirCandidatos(false);
          if(!candidatos.length){ sinLugar.push(`${m.nombre} (${g.nombre})`); continue; }

          candidatos.sort((a,b)=>{
            if(a.esDiaLibre!==b.esDiaLibre) return a.esDiaLibre-b.esDiaLibre; // 1) evitar día de descanso
            if(m.prioridadTemprana){ if(a.bi!==b.bi) return a.bi-b.bi; }       // 2) prioridad primeras horas
            // 3) NO repetir la MISMA materia dos veces el mismo día en el MISMO grupo
            //    (esto es a nivel grupo+materia; evita 2 clases de lo mismo seguidas)
            if(a.repetido!==b.repetido) return a.repetido-b.repetido;
            // 4) CONCENTRAR LOS DÍAS DEL DOCENTE: preferir días donde el docente YA trabaja,
            //    para que no termine dando clases los 5 días. Este es el arreglo clave.
            if(a.docTrabajaEseDia!==b.docTrabajaEseDia) return b.docTrabajaEseDia-a.docTrabajaEseDia;
            // 5) COMPACIDAD: dentro del día, minimizar huecos del docente
            if(a.huecoDoc!==b.huecoDoc) return a.huecoDoc-b.huecoDoc;
            if(a.adyacente!==b.adyacente) return b.adyacente-a.adyacente;
            // 6) balancear carga diaria del grupo
            return a.carga-b.carga;
          });

          const {di, bi} = candidatos[0];
          ocupGrupo[g.id][di][bi] = m.id;
          if(docId){
            ocupDoc[docId] = ocupDoc[docId] || DIAS.map(()=>bloques.map(()=>null));
            ocupDoc[docId][di][bi] = g.id;
            diasDoc[docId] = diasDoc[docId] || new Set();
            diasDoc[docId].add(di);
          }
          diasUsadosPorGM[claveGM].push(di);
          propuestaGlobal.push({materiaId:m.id, grupoId:g.id, dia:DIAS[di], hi:bloques[bi].hi, hf:bloques[bi].hf, aula:''});
        }

        function construirCandidatos(respetarDescanso){
          const out = [];
          DIAS.forEach((d,di)=>{
            if(respetarDescanso && diaLibre===di) return; // saltar el día de descanso
            bloques.forEach((b,bi)=>{
              if(ocupGrupo[g.id][di][bi]) return;
              if(docId && ocupDoc[docId] && ocupDoc[docId][di][bi]) return;
              const cargaGrupo = ocupGrupo[g.id][di].filter(x=>x).length;
              const repetido = diasUsadosPorGM[claveGM].includes(di);
              const esDiaLibre = (diaLibre===di) ? 1 : 0;
              // ── COMPACIDAD DEL DOCENTE ──
              // Calcular el "hueco" que este bloque generaría en el día del docente.
              // Si el docente ya tiene clases ese día, preferimos bloques contiguos.
              let huecoDoc = 0, adyacente = 0, docTrabajaEseDia = 0;
              if(docId && ocupDoc[docId]){
                const filaDoc = ocupDoc[docId][di];
                const ocupados = filaDoc.map((x,i)=>x?i:-1).filter(i=>i>=0);
                if(ocupados.length){
                  docTrabajaEseDia = 1; // el docente ya tiene clase(s) este día
                  // ¿El bloque candidato es adyacente a una clase existente?
                  if(filaDoc[bi-1] || filaDoc[bi+1]) adyacente = 1;
                  // Hueco = distancia al bloque ocupado más cercano, menos 1 (0 = pegado)
                  const distMin = Math.min(...ocupados.map(o=>Math.abs(o-bi)));
                  huecoDoc = Math.max(0, distMin-1);
                }
              }
              out.push({di, bi, carga:cargaGrupo, repetido, esDiaLibre, huecoDoc, adyacente, docTrabajaEseDia});
            });
          });
          return out;
        }
      });

      // ═══ SEGUNDA PASADA: CONSOLIDACIÓN DE DÍA DE DESCANSO ═══
      // Tras el armado, algunos docentes pueden haber quedado en 5 días aunque
      // su carga cabría en 4. Esta fase intenta vaciar su día menos cargado
      // moviendo esas clases a huecos de sus otros días (sin crear choques).
      const liberados = [];
      Object.keys(cargaTotalDoc).forEach(docId=>{
        if(!ocupDoc[docId]) return;
        if(cargaTotalDoc[docId] > capacidad4dias) return; // imposible, se salta
        let diasTrab = DIAS.map((d,di)=>di).filter(di=>ocupDoc[docId][di].some(x=>x));
        if(diasTrab.length < 5) return; // ya descansa, nada que hacer

        // Elegir el día con MENOS clases del docente como candidato a vaciar
        const cargaPorDia = diasTrab.map(di=>({di, n:ocupDoc[docId][di].filter(x=>x).length}))
          .sort((a,b)=>a.n-b.n);
        const diaVaciar = cargaPorDia[0].di;

        // Clases del docente ese día (con su grupo y bloque)
        const clasesEseDia = [];
        bloques.forEach((b,bi)=>{
          const gId = ocupDoc[docId][diaVaciar][bi];
          if(gId){ const p = propuestaGlobal.find(x=>x.grupoId===gId && DIAS.indexOf(x.dia)===diaVaciar && x.hi===b.hi
            && materia(x.materiaId)?.docenteId===docId);
            if(p) clasesEseDia.push({p, bi, gId}); }
        });

        // Intentar reubicar cada clase a otro día (no el que vaciamos), respetando grupo y docente
        const movimientos = [];
        let todasMovibles = true;
        // Copias de trabajo para simular sin dañar el estado si falla
        clasesEseDia.forEach(({p, gId})=>{
          let ubicado = null;
          for(const di of diasTrab){
            if(di===diaVaciar) continue;
            for(let bi=0; bi<bloques.length; bi++){
              if(ocupGrupo[gId][di][bi]) continue;
              if(ocupDoc[docId][di][bi]) continue;
              // evitar que dos movimientos pisen el mismo hueco
              if(movimientos.some(mv=>mv.gId===gId && mv.di===di && mv.bi===bi)) continue;
              if(movimientos.some(mv=>mv.di===di && mv.bi===bi && mv.docBloqueo)) continue;
              ubicado = {di, bi}; break;
            }
            if(ubicado) break;
          }
          if(ubicado){ movimientos.push({p, gId, di:ubicado.di, bi:ubicado.bi, docBloqueo:true,
            biOrig:bloques.findIndex(b=>b.hi===p.hi)}); }
          else todasMovibles = false;
        });

        // Solo aplicar si TODAS las clases del día pudieron reubicarse
        if(todasMovibles && movimientos.length){
          movimientos.forEach(mv=>{
            // liberar posición vieja
            ocupGrupo[mv.gId][diaVaciar][mv.biOrig] = null;
            ocupDoc[docId][diaVaciar][mv.biOrig] = null;
            // ocupar nueva
            ocupGrupo[mv.gId][mv.di][mv.bi] = mv.p.materiaId;
            ocupDoc[docId][mv.di][mv.bi] = mv.gId;
            // actualizar la propuesta
            mv.p.dia = DIAS[mv.di];
            mv.p.hi = bloques[mv.bi].hi;
            mv.p.hf = BLOQUES_P50.filter(b=>!b.receso)[mv.bi].hf;
          });
          liberados.push(docId);
        }
      });

      // ═══ TERCERA PASADA: COMPACTACIÓN (eliminar horas hueco del docente) ═══
      // Para cada docente y cada día, si tiene clases separadas por huecos,
      // intenta deslizar CUALQUIERA de sus clases de ese día hacia el hueco,
      // no solo la última — así se resuelven casos donde la última clase no
      // puede moverse pero otra sí, dejando el día realmente compacto.
      const bloquesClase = BLOQUES_P50.filter(b=>!b.receso);
      Object.keys(ocupDoc).forEach(docId=>{
        DIAS.forEach((d,di)=>{
          let intentos = 0;
          let mejora = true;
          while(mejora && intentos<bloquesClase.length*2){
            mejora = false; intentos++;
            const fila = ocupDoc[docId][di];
            const ocupados = fila.map((x,i)=>x?i:-1).filter(i=>i>=0);
            if(ocupados.length<2) break; // 0 o 1 clase: no hay huecos que cerrar
            const primero = ocupados[0], ultimo = ocupados[ocupados.length-1];
            for(let bi=primero; bi<=ultimo && !mejora; bi++){
              if(fila[bi]) continue; // ya ocupado, no es hueco
              // Hay un hueco en bi. Probar TODAS las clases posteriores al hueco
              // (de la más lejana a la más cercana, para maximizar la compactación).
              const candidatasAMover = ocupados.filter(o=>o>bi).sort((a,b)=>b-a);
              for(const origen of candidatasAMover){
                const gIdOrigen = fila[origen];
                if(!gIdOrigen) continue;
                if(ocupGrupo[gIdOrigen][di][bi]) continue; // el grupo ya ocupa ese hueco, probar otra clase
                const pMover = propuestaGlobal.find(x=>x.grupoId===gIdOrigen && DIAS.indexOf(x.dia)===di
                  && x.hi===bloquesClase[origen].hi && materia(x.materiaId)?.docenteId===docId);
                if(!pMover) continue;
                // Ejecutar el movimiento: origen → bi
                ocupGrupo[gIdOrigen][di][origen] = null;
                ocupDoc[docId][di][origen] = null;
                ocupGrupo[gIdOrigen][di][bi] = pMover.materiaId;
                ocupDoc[docId][di][bi] = gIdOrigen;
                pMover.hi = bloquesClase[bi].hi;
                pMover.hf = bloquesClase[bi].hf;
                mejora = true;
                break;
              }
            }
          }
        });
      });

      const porGrupo = {};
      propuestaGlobal.forEach(p=>{ porGrupo[p.grupoId]=(porGrupo[p.grupoId]||0)+1; });
      const filasResumen = grupos.map(g=>`<tr><td>${esc(g.nombre)}</td><td style="text-align:center">${porGrupo[g.id]||0}</td></tr>`).join('');

      let conDescanso=0, sinDescansoPosible=0;
      Object.keys(cargaTotalDoc).forEach(docId=>{
        if(!ocupDoc[docId]) return;
        const dt = DIAS.filter((d,di)=>ocupDoc[docId][di].some(x=>x)).length;
        if(dt<5) conDescanso++;
        else if(cargaTotalDoc[docId]>capacidad4dias) sinDescansoPosible++;
      });

      let html = `<div class="grid grid-2">
        <div class="card"><h3 style="font-size:.95rem">📊 Resumen por grupo</h3>
          <div class="table-wrap"><table><thead><tr><th>Grupo</th><th>Clases asignadas</th></tr></thead><tbody>${filasResumen}</tbody></table></div></div>
        <div class="card"><h3 style="font-size:.95rem">✅ Verificación</h3>
          <p style="margin-top:.4rem"><span class="tag tag-ok">0 choques de docente</span></p>
          <p style="margin-top:.5rem"><span class="tag tag-ok">${conDescanso} docente(s) con día libre</span></p>
          ${sinDescansoPosible?`<p style="margin-top:.5rem"><span class="tag tag-aviso">${sinDescansoPosible} con carga muy alta para descansar</span></p>`:''}
          <p class="muted" style="margin-top:.5rem">Total de clases: <strong>${propuestaGlobal.length}</strong></p></div>
      </div>`;
      if(sinLugar.length) html += `<p class="tag tag-aviso" style="margin-top:.7rem;display:block">No cupieron ${sinLugar.length} sesión(es): ${esc([...new Set(sinLugar)].slice(0,6).join(', '))}${sinLugar.length>6?'…':''}. Revisa la carga de ese docente: probablemente ya no tiene huecos libres en común con ese grupo.</p>`;

      body.querySelector('#hpPreview').innerHTML = html;
      body.querySelector('#hpOk').disabled = !propuestaGlobal.length;
    };

    body.querySelector('#hpVista').addEventListener('click', previsualizar);
    body.querySelector('#hpOk').addEventListener('click', ()=>{
      if(!propuestaGlobal.length) return;
      const reiniciar = body.querySelector('#hpReiniciar').checked;
      const gids = new Set(grupos.map(g=>g.id));
      const existentes = DB.horarios.filter(h=>gids.has(h.grupoId));
      const msj = reiniciar
        ? `Se borrarán las ${existentes.length} clase(s) actuales de estos grupos y se crearán ${propuestaGlobal.length} nuevas. ¿Continuar?`
        : `Se AGREGARÁN ${propuestaGlobal.length} clases nuevas, sumándose a las ${existentes.length} que ya existen (puede duplicar sesiones si ya habías armado antes). ¿Continuar?`;
      if(!confirm(msj)) return;

      if(reiniciar && existentes.length){
        const idsBorrar = new Set(existentes.map(h=>h.id));
        DB.horarios = DB.horarios.filter(h=>!idsBorrar.has(h.id));
        persistDel('horarios', [...idsBorrar]);
      }
      const nuevos = propuestaGlobal.map(p=>({id:uid(), ...p, aula:p.aula||'Por asignar'}));
      nuevos.forEach(n=>DB.horarios.push(n));
      persist('horarios', nuevos);
      cerrarModal(); render();
      toast(`Horario del plantel armado: ${nuevos.length} clases en ${grupos.length} grupos, sin choques de docente.${reiniciar&&existentes.length?` (${existentes.length} clases previas reemplazadas)`:''}`);
    });
  });
}

/* Borra TODAS las clases del horario de un ciclo, para empezar de cero */
function modalBorrarHorarioCompleto(){
  const ciclosConGrupos = [...new Set(DB.grupos.map(g=>g.ciclo).filter(Boolean))];
  const cicloDefault = DB.plantel.ciclo || ciclosConGrupos[0] || cicloActualAuto();

  abrirModal('🗑️ Borrar horario completo', `
    <p class="muted">Esta acción elimina <strong>todas las clases</strong> del horario de los grupos del ciclo seleccionado, dejándolos vacíos para volver a armarlos desde cero. No afecta docentes, materias, grupos ni alumnos — solo el horario.</p>
    <div class="field" style="margin-top:.7rem"><label>Ciclo a borrar</label>
      <select id="bhCiclo">${listaCiclos().map(c=>`<option ${c===cicloDefault?'selected':''}>${c}</option>`).join('')}</select></div>
    <div id="bhAviso" style="margin-top:.6rem"></div>
    <div class="modal-foot"><button class="btn btn-outline" id="bhCan">Cancelar</button>
    <button class="btn btn-danger" id="bhOk">Borrar horario de este ciclo</button></div>`,
  body=>{
    const actualizarAviso = ()=>{
      const ciclo = body.querySelector('#bhCiclo').value;
      const gids = new Set(DB.grupos.filter(g=>!g.ciclo||g.ciclo===ciclo).map(g=>g.id));
      const n = DB.horarios.filter(h=>gids.has(h.grupoId)).length;
      body.querySelector('#bhAviso').innerHTML = `<p class="tag ${n?'tag-mal':'tag-ok'}">${n} clase(s) serán eliminadas.</p>`;
    };
    actualizarAviso();
    body.querySelector('#bhCiclo').addEventListener('change', actualizarAviso);
    body.querySelector('#bhCan').addEventListener('click', cerrarModal);
    body.querySelector('#bhOk').addEventListener('click', ()=>{
      const ciclo = body.querySelector('#bhCiclo').value;
      const gids = new Set(DB.grupos.filter(g=>!g.ciclo||g.ciclo===ciclo).map(g=>g.id));
      const aBorrar = DB.horarios.filter(h=>gids.has(h.grupoId));
      if(!aBorrar.length){ toast('No hay clases que borrar en este ciclo.'); cerrarModal(); return; }
      if(!confirm(`Se eliminarán ${aBorrar.length} clases del ciclo ${ciclo}. Esta acción NO se puede deshacer. ¿Continuar?`)) return;
      const ids = new Set(aBorrar.map(h=>h.id));
      DB.horarios = DB.horarios.filter(h=>!ids.has(h.id));
      persistDel('horarios', [...ids]);
      cerrarModal(); render();
      toast(`${aBorrar.length} clase(s) eliminada(s). Usa «Armar TODO el plantel» para crear el horario de nuevo.`);
    });
  });
}

function modalArmarHorario(){
  const g = grupo(horGrupo);
  if(!g){ toast('Selecciona un grupo primero.'); return; }
  // Materias del grupo: las del mismo semestre del grupo, o todas si no coincide ninguna
  const materiasSem = DB.materias.filter(m=>m.semestre===g.semestre);
  const materiasUsar = materiasSem.length ? materiasSem : DB.materias;

  abrirModal('🪄 Armar horario automático', `
    <p class="muted">El sistema acomodará las materias del <strong>${esc(g.nombre)}</strong> en la malla oficial de la Prepa 50 (3:00–8:15 PM, receso 5:40–6:15), sin choques. Las sesiones de cada materia se reparten en días distintos; Cultura Digital se prioriza en 2–3 días.</p>
    <div class="form-grid" style="margin-top:.6rem">
      <div class="field full"><label>Aula por defecto</label><input id="haAula" value="Aula ${esc(g.nombre.replace(/[^\w]/g,''))}"></div>
    </div>
    <div id="haPreview" style="margin-top:.8rem"></div>
    <div class="modal-foot">
      <button class="btn btn-outline" id="haCan">Cancelar</button>
      <button class="btn btn-gold" id="haVista">👁 Previsualizar</button>
      <button class="btn btn-primary" id="haOk" disabled>Aplicar horario</button>
    </div>`,
  body=>{
    let propuesta = [];
    body.querySelector('#haCan').addEventListener('click', cerrarModal);

    const previsualizar = ()=>{
      const aula = body.querySelector('#haAula').value.trim()||'—';
      // Solo bloques de clase (excluye el receso)
      const bloques = BLOQUES_P50.filter(b=>!b.receso);

      const conConfig = materiasUsar.filter(m=>(m.sesionesSemana||0)>0);
      if(!conConfig.length){
        body.querySelector('#haPreview').innerHTML = `<p class="tag tag-aviso">Ninguna materia de este semestre tiene «Sesiones por semana» configuradas. Edita las materias y define cuántas sesiones lleva cada una.</p>`;
        body.querySelector('#haOk').disabled = true; return;
      }
      const esCultura = m => /cultura\s*digital/i.test(m.nombre);
      const orden = [...conConfig].sort((a,b)=>{
        if(esCultura(a)!==esCultura(b)) return esCultura(a)?-1:1;
        return (b.sesionesSemana||0)-(a.sesionesSemana||0);
      });

      const ocupado = DIAS.map(()=>bloques.map(()=>null));
      DB.horarios.filter(h=>h.grupoId===horGrupo).forEach(h=>{
        const di = DIAS.indexOf(h.dia);
        bloques.forEach((b,bi)=>{ if(di>=0 && h.hi<b.hf && h.hf>b.hi) ocupado[di][bi]='previo'; });
      });

      propuesta = [];
      const sinLugar = [];
      orden.forEach(m=>{
        const ses = m.sesionesSemana||1;
        const diasUsados = [];
        for(let s=0; s<ses; s++){
          const candidatos = DIAS.map((d,di)=>({di, carga:ocupado[di].filter(x=>x).length, repetido:diasUsados.includes(di)}))
            .filter(c=>c.carga<bloques.length)
            .sort((a,b)=> (a.repetido-b.repetido) || (a.carga-b.carga));
          if(!candidatos.length){ sinLugar.push(m.nombre); continue; }
          const di = candidatos[0].di;
          const bi = ocupado[di].findIndex(x=>!x);
          if(bi<0){ sinLugar.push(m.nombre); continue; }
          ocupado[di][bi] = m.id;
          diasUsados.push(di);
          propuesta.push({materiaId:m.id, grupoId:horGrupo, dia:DIAS[di], hi:bloques[bi].hi, hf:bloques[bi].hf, aula});
        }
      });

      // Render con todas las franjas, incluyendo el receso
      let html = `<div class="table-wrap"><table class="horario-tabla"><thead><tr><th>Hora</th>${DIAS.map(d=>`<th>${d.slice(0,3)}</th>`).join('')}</tr></thead><tbody>`;
      BLOQUES_P50.forEach(franja=>{
        if(franja.receso){
          html += `<tr><td class="mono">${franja.hi}</td><td colspan="${DIAS.length}" style="text-align:center;background:#FBF1D9;color:var(--oro-500);font-weight:700">☕ RECESO</td></tr>`;
          return;
        }
        const bi = bloques.findIndex(b=>b.hi===franja.hi);
        html += `<tr><td class="mono">${franja.hi}–${franja.hf}</td>`;
        DIAS.forEach((d,di)=>{
          const cell = ocupado[di][bi];
          if(cell && cell!=='previo'){ const m=materia(cell);
            html += `<td><div class="bloque-clase" style="${/cultura\s*digital/i.test(m?.nombre||'')?'border-left-color:var(--oro-500);background:#FBF1D9':''}"><strong>${esc(m?.clave||'')}</strong><span>${esc(m?.nombre||'')}</span></div></td>`;
          } else if(cell==='previo'){ html += `<td><span class="muted" style="font-size:.7rem">ocupado</span></td>`; }
          else html += '<td></td>';
        });
        html += '</tr>';
      });
      html += '</tbody></table></div>';
      if(sinLugar.length) html += `<p class="tag tag-aviso" style="margin-top:.5rem">No cupieron todas las sesiones de: ${esc([...new Set(sinLugar)].join(', '))}. El turno tiene 7 clases por día (35 a la semana); reduce sesiones o reparte en otro grupo.</p>`;
      const culturaDias = [...new Set(propuesta.filter(p=>/cultura\s*digital/i.test(materia(p.materiaId)?.nombre||'')).map(p=>p.dia))];
      if(culturaDias.length) html += `<p class="tag tag-ok" style="margin-top:.5rem">✓ Cultura Digital quedó repartida en ${culturaDias.length} día(s): ${esc(culturaDias.join(', '))}</p>`;
      body.querySelector('#haPreview').innerHTML = html;
      body.querySelector('#haOk').disabled = !propuesta.length;
    };

    body.querySelector('#haVista').addEventListener('click', previsualizar);
    body.querySelector('#haOk').addEventListener('click', ()=>{
      if(!propuesta.length) return;
      if(!confirm(`Se agregarán ${propuesta.length} clases al horario de ${g.nombre}. ¿Continuar?`)) return;
      const nuevos = propuesta.map(p=>({id:uid(), ...p}));
      nuevos.forEach(n=>DB.horarios.push(n));
      persist('horarios', nuevos);
      cerrarModal(); render(); toast(`Horario armado: ${nuevos.length} clases agregadas.`);
    });
  });
}

/* Horario semanal personal del docente: todas sus materias y grupos juntos */
function modalMiHorario(){
  const misMat = misMaterias().map(m=>m.id);
  const clases = DB.horarios.filter(h=>misMat.includes(h.materiaId));
  if(!clases.length){ toast('Aún no tienes clases asignadas en ningún horario.'); return; }
  const horas = [...new Set(clases.map(c=>c.hi))].sort();
  let html = `<p class="muted">Tu carga semanal completa, con todos tus grupos.</p>
    <div class="table-wrap" style="margin-top:.6rem"><table class="horario-tabla"><thead><tr><th>Hora</th>${DIAS.map(d=>`<th>${d.slice(0,3)}</th>`).join('')}</tr></thead><tbody>`;
  horas.forEach(h=>{
    html += `<tr><td class="mono"><strong>${h}</strong></td>`;
    DIAS.forEach(d=>{
      const c = clases.filter(x=>x.dia===d && x.hi===h);
      html += `<td>${c.map(x=>`<div class="bloque-clase"><strong>${esc(materia(x.materiaId)?.nombre||'')}</strong><span>${esc(grupo(x.grupoId)?.nombre||'')} · ${esc(x.aula)}</span></div>`).join('')}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table></div><div class="modal-foot"><button class="btn btn-primary" id="mhCerrar">Cerrar</button></div>';
  abrirModal('📅 Mi horario semanal', html, body=>{
    body.querySelector('#mhCerrar').addEventListener('click', cerrarModal);
  });
}

/* Exporta el horario a PDF. Si grupoId es null, exporta el horario personal del docente */
function exportarHorarioPDF(grupoId){
  if(!hayPDF()) return;
  let clases, titulo, subtit;
  if(grupoId){
    clases = DB.horarios.filter(h=>h.grupoId===grupoId);
    const g = grupo(grupoId);
    titulo = 'HORARIO DE CLASES';
    subtit = `${g?.nombre||''} · ${g?.turno||''} · Semestre ${g?.semestre||''}`;
  } else {
    const misMat = misMaterias().map(m=>m.id);
    clases = DB.horarios.filter(h=>misMat.includes(h.materiaId));
    titulo = 'HORARIO DEL DOCENTE';
    subtit = autorActual()==='local' ? 'Carga semanal' : autorActual();
  }
  if(!clases.length){ toast('No hay clases que exportar.'); return; }

  const doc = new window.jspdf.jsPDF({orientation:'landscape'});
  encabezadoPDF(doc, titulo);
  doc.setTextColor(22,35,58); doc.setFont('helvetica','bold'); doc.setFontSize(11);
  doc.text(subtit, 14, 38);

  const horas = [...new Set(clases.map(c=>c.hi))].sort();
  const cuerpo = horas.map(h=>{
    const fila = [h];
    DIAS.forEach(d=>{
      const c = clases.filter(x=>x.dia===d && x.hi===h);
      fila.push(c.map(x=>{
        const m = materia(x.materiaId);
        const extra = grupoId ? (m?.nombre||'') : `${m?.nombre||''}\n${grupo(x.grupoId)?.nombre||''}`;
        return `${extra}\n${x.aula||''}`;
      }).join('\n'));
    });
    return fila;
  });
  doc.autoTable({
    startY:44,
    head:[['Hora', ...DIAS]],
    body: cuerpo,
    styles:{fontSize:8, cellPadding:2.5, valign:'middle', halign:'center'},
    headStyles:{fillColor:[29,78,158], textColor:255, fontStyle:'bold', halign:'center'},
    columnStyles:{0:{fontStyle:'bold', fillColor:[227,235,247], halign:'center'}},
    alternateRowStyles:{fillColor:[248,250,253]},
  });
  piePDF(doc);
  doc.save(`horario_${(subtit||'').replace(/[^\w]/g,'_')}.pdf`);
  toast('Horario exportado a PDF.');
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
        <div class="cred-franja"><strong>PREPARATORIA No. 50 · UAGro</strong><span>${esc(grupo(a.grupoId)?.ciclo||DB.plantel.ciclo)}</span></div>
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
        <p class="muted">Tutor: ${esc(a.tutor||'No registrado')}</p>
        <button class="btn btn-gold btn-sm" id="verCredencial" style="margin-top:.6rem">🪪 Ver mi credencial QR</button></div>
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
    $('#verCredencial')?.addEventListener('click', ()=>modalCredencialDigital(a.id));
  };
  $('#btnConsultar').addEventListener('click', consultar);
  $('#busMatricula').addEventListener('keydown', e=>{ if(e.key==='Enter') consultar(); });
}

/* Credencial digital QR mostrada en el celular del alumno (sin imprimir) */
function modalCredencialDigital(alumnoId){
  const a = alumno(alumnoId); if(!a) return;
  const g = grupo(a.grupoId);
  abrirModal('Mi credencial digital', `
    <p class="muted" style="margin-bottom:.8rem">Muestra este código al docente para registrar tu asistencia. Mantén el brillo de la pantalla al máximo. No la compartas: es personal.</p>
    <div style="display:flex;justify-content:center">
      <div class="credencial" style="margin:0 auto">
        <div class="cred-franja"><strong>PREPARATORIA No. 50 · UAGro</strong><span>${esc(g?.ciclo||DB.plantel.ciclo)}</span></div>
        <div class="cred-cuerpo">
          <div class="cred-qr" id="qrDigital"></div>
          <div class="cred-datos">
            <h4>${esc(nombreCompleto(a))}</h4>
            <p class="mono">${esc(a.matricula)}</p>
            <p class="muted">${esc(g?.nombre||'')} · ${esc(g?.turno||'')}</p>
            <p class="muted" style="font-size:.7rem">${esc(DB.plantel.ciudad||'Tlacoachistlahuaca, Gro.')}</p>
          </div>
        </div>
        <div class="cred-pie"></div>
      </div>
    </div>
    <div class="modal-foot"><button class="btn btn-primary" id="cdCerrar">Cerrar</button></div>`,
  body=>{
    body.querySelector('#cdCerrar').addEventListener('click', cerrarModal);
    if(typeof QRCode!=='undefined'){
      new QRCode(body.querySelector('#qrDigital'),
        {text:`P50|${a.matricula}`, width:128, height:128, correctLevel:QRCode.CorrectLevel.M});
    } else {
      body.querySelector('#qrDigital').innerHTML = '<p class="muted" style="padding:1rem">No se pudo generar el código. Revisa tu conexión.</p>';
    }
  });
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
    const filas = [['Fecha','Hora','Matrícula','Alumno','Grupo','Materia','Estado','Método','Capturó por'].join(',')];
    regs.forEach(r=>{
      const a=alumno(r.alumnoId);
      filas.push([r.fecha, r.hora||'', a?.matricula||'', `"${a?nombreCompleto(a):''}"`,
        `"${grupo(r.grupoId)?.nombre||''}"`, `"${materia(r.materiaId)?.nombre||''}"`,
        ESTADOS[r.estado], r.metodo, `"${r.editadoPor||''}"`].join(','));
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
    // Folio y ciclo (lado derecho)
    const W0 = doc.internal.pageSize.getWidth();
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(91,107,130);
    doc.text(`Ciclo escolar: ${g?.ciclo||DB.plantel.ciclo||''}`, W0-14, 45, {align:'right'});
    doc.text(`Folio: ${a.matricula}-${(g?.ciclo||DB.plantel.ciclo||'').replace(/[^\w]/g,'')}`, W0-14, 51, {align:'right'});

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

    // Promedio general en recuadro destacado
    const finales = cuerpo.map(f=>parseFloat(f[6])).filter(v=>!isNaN(v));
    const promGral = finales.length?(finales.reduce((s,v)=>s+v,0)/finales.length):null;
    let y = doc.lastAutoTable.finalY + 8;
    const W = doc.internal.pageSize.getWidth();
    doc.setFillColor(11,35,66);
    doc.roundedRect(W-78, y, 64, 16, 2, 2, 'F');
    doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(9);
    doc.text('PROMEDIO GENERAL', W-46, y+6, {align:'center'});
    doc.setTextColor(232,196,92); doc.setFontSize(13);
    doc.text(promGral===null?'—':promGral.toFixed(1), W-46, y+13, {align:'center'});

    doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(91,107,130);
    doc.text('Calificación mínima aprobatoria: 6.0. El porcentaje de asistencia considera', 14, y+5);
    doc.text('presente, retardo y falta justificada como asistencia efectiva.', 14, y+10);
    doc.text(`Documento informativo emitido por la Preparatoria No. 50 de la UAGro.`, 14, y+15);
    doc.text(`Expedido en ${DB.plantel.ciudad||'Tlacoachistlahuaca, Gro.'} el ${new Date().toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'})}.`, 14, y+20);

    // Tres firmas
    y += 42;
    doc.setDrawColor(120);
    const fx = [30, 105, 180];
    fx.forEach(x=>doc.line(x-22, y, x+22, y));
    doc.setFontSize(7.5); doc.setTextColor(22,35,58); doc.setFont('helvetica','bold');
    doc.text('Docente', fx[0], y+5, {align:'center'});
    doc.text('Padre o tutor', fx[1], y+5, {align:'center'});
    doc.text('Dirección del plantel', fx[2], y+5, {align:'center'});
    doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(120,120,120);
    doc.text('Nombre y firma', fx[0], y+9, {align:'center'});
    doc.text('Nombre y firma', fx[1], y+9, {align:'center'});
    doc.text('Sello y firma', fx[2], y+9, {align:'center'});
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

/* Promueve un grupo al siguiente ciclo escolar y semestre, sin tocar el historial */
function modalPromoverGrupo(){
  const g = grupo(grupoSel);
  if(!g){ toast('Selecciona un grupo primero.'); return; }
  if(g.semestre>=6){ toast('Este grupo ya está en 6° semestre: es el último del plan de estudios.'); return; }
  const sigCiclo = siguienteCiclo(g.ciclo||DB.plantel.ciclo);
  const sigSem = g.semestre+1;
  const alumnos = alumnosDeGrupo(g.id);

  abrirModal('⬆ Promover grupo al siguiente ciclo', `
    <p>El grupo <strong>${esc(g.nombre)}</strong> (${g.semestre}° semestre, ciclo ${esc(g.ciclo||'—')}) pasará a:</p>
    <div class="card" style="background:var(--azul-100);border:none;margin:.7rem 0">
      <strong>${sigSem}° semestre · Ciclo ${esc(sigCiclo)}</strong>
    </div>
    <p class="muted">Se creará un <strong>grupo nuevo</strong> con sus ${alumnos.length} alumno(s) trasladados. El grupo actual <strong>se conserva intacto</strong> (no se borra) con todo su historial de asistencias, calificaciones, bitácora y horario, para consulta futura.</p>
    <div class="form-grid" style="margin-top:.7rem">
      <div class="field full"><label>Nombre del nuevo grupo</label><input id="pgNombre" value="${esc(g.nombre.replace(/\d+°?/,sigSem+'°'))}"></div>
    </div>
    <div class="modal-foot"><button class="btn btn-outline" id="pgCan">Cancelar</button>
    <button class="btn btn-primary" id="pgOk">Promover grupo</button></div>`,
  body=>{
    body.querySelector('#pgCan').addEventListener('click', cerrarModal);
    body.querySelector('#pgOk').addEventListener('click', ()=>{
      const nombre = body.querySelector('#pgNombre').value.trim();
      if(!nombre){ toast('Escribe el nombre del nuevo grupo.'); return; }
      const nuevoGrupo = {id:uid(), nombre, semestre:sigSem, turno:g.turno, ciclo:sigCiclo, grupoAnteriorId:g.id};
      DB.grupos.push(nuevoGrupo); persist('grupos', nuevoGrupo);
      const alumnosNuevos = alumnos.map(a=>({...a, grupoId:nuevoGrupo.id}));
      alumnosNuevos.forEach(a=>{ const idx=DB.alumnos.findIndex(x=>x.id===a.id); if(idx>=0) DB.alumnos[idx]=a; });
      persist('alumnos', alumnosNuevos);
      grupoSel = nuevoGrupo.id;
      cerrarModal(); render();
      toast(`Grupo promovido: ${alumnos.length} alumno(s) ahora en ${nombre} (${sigSem}° sem., ${sigCiclo}). El grupo anterior se conservó con su historial.`);
    });
  });
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

/* ───────────────────────── 19. BITÁCORA Y PLANEACIÓN (NEM) ───────────────────────── */
let sesionBit = { fecha:hoyISO(), materiaId:null, grupoId:null };
/* Campos formativos de la Nueva Escuela Mexicana */
const CAMPOS_NEM = ['Lenguajes','Saberes y Pensamiento Científico','Ética, Naturaleza y Sociedades','De lo Humano y lo Comunitario'];

function vistaBitacora(el){
  const matsVis = misMaterias(), grusVis = misGrupos();
  if(!matsVis.length){ el.innerHTML = avisoSinAsignacion(); return; }
  if(!sesionBit.materiaId || !matsVis.some(m=>m.id===sesionBit.materiaId)) sesionBit.materiaId = matsVis[0]?.id;
  if(!sesionBit.grupoId || !grusVis.some(g=>g.id===sesionBit.grupoId))   sesionBit.grupoId   = grusVis[0]?.id;

  el.innerHTML = `
  <div class="card">
    <div class="toolbar">
      <div class="field"><label>Fecha</label><input type="date" id="bitFecha" value="${sesionBit.fecha}"></div>
      <div class="field"><label>Materia</label>
        <select id="bitMateria">${opciones(matsVis, m=>`${m.clave} · ${m.nombre}`, sesionBit.materiaId)}</select></div>
      <div class="field"><label>Grupo</label>
        <select id="bitGrupo">${opciones(grusVis, g=>g.nombre, sesionBit.grupoId)}</select></div>
      <div class="spacer"></div>
      <button class="btn btn-primary" id="bitNueva">＋ Registrar sesión</button>
    </div>
    <div id="bitZona"></div>
  </div>`;

  const ref = ()=>{ sesionBit.fecha=$('#bitFecha').value; sesionBit.materiaId=$('#bitMateria').value;
    sesionBit.grupoId=$('#bitGrupo').value; pintarBit(); };
  ['bitFecha','bitMateria','bitGrupo'].forEach(id=>$('#'+id).addEventListener('change', ref));
  $('#bitNueva').addEventListener('click', ()=>formBitacora(null));
  pintarBit();
}

function pintarBit(){
  const zona = $('#bitZona'); if(!zona) return;
  const regs = DB.bitacora
    .filter(b=>b.materiaId===sesionBit.materiaId && b.grupoId===sesionBit.grupoId)
    .sort((a,b)=>b.fecha.localeCompare(a.fecha));
  if(!regs.length){ zona.innerHTML = '<div class="vacio"><span class="icono">📓</span>Aún no hay sesiones registradas para esta materia y grupo. Usa «Registrar sesión» para documentar tu clase.</div>'; return; }
  zona.innerHTML = regs.map(b=>`
    <div class="card" style="margin-bottom:.8rem;border-left:4px solid var(--azul-500)">
      <div style="display:flex;justify-content:space-between;gap:.6rem;align-items:start">
        <div>
          <h3 style="margin-bottom:.2rem">${esc(b.tema||'Sesión sin tema')}</h3>
          <p class="muted mono">${esc(new Date(b.fecha+'T12:00').toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long'}))}</p>
          ${b.campo?`<span class="tag tag-info">${esc(b.campo)}</span>`:''}
        </div>
        <div style="display:flex;gap:.3rem">
          <button class="btn btn-sm btn-outline" data-edb="${b.id}">Editar</button>
          <button class="btn btn-sm btn-danger" data-elb="${b.id}">Eliminar</button>
        </div>
      </div>
      ${b.actividades?`<p style="margin-top:.5rem"><strong>Actividades:</strong> ${esc(b.actividades)}</p>`:''}
      ${b.tarea?`<p style="margin-top:.3rem"><strong>Tarea / encargo:</strong> ${esc(b.tarea)}</p>`:''}
      ${b.observaciones?`<p style="margin-top:.3rem;color:var(--gris-600)"><strong>Observaciones:</strong> ${esc(b.observaciones)}</p>`:''}
      ${b.editadoPor&&b.editadoPor!=='local'?`<p class="muted" style="margin-top:.4rem;font-size:.74rem">👤 ${esc(b.editadoPor)}</p>`:''}
    </div>`).join('');

  zona.querySelectorAll('[data-edb]').forEach(x=>x.addEventListener('click',()=>formBitacora(x.dataset.edb)));
  zona.querySelectorAll('[data-elb]').forEach(x=>x.addEventListener('click',()=>{
    if(!confirm('¿Eliminar esta sesión de la bitácora?')) return;
    DB.bitacora = DB.bitacora.filter(b=>b.id!==x.dataset.elb);
    persistDel('bitacora', x.dataset.elb);
    pintarBit(); toast('Sesión eliminada.');
  }));
}

function formBitacora(id){
  const b = id ? DB.bitacora.find(x=>x.id===id)
    : {fecha:sesionBit.fecha, materiaId:sesionBit.materiaId, grupoId:sesionBit.grupoId,
       campo:'', tema:'', actividades:'', tarea:'', observaciones:''};
  abrirModal(id?'Editar sesión':'Registrar sesión de clase', `
    <div class="form-grid">
      <div class="field"><label>Fecha</label><input type="date" id="bFecha" value="${esc(b.fecha)}"></div>
      <div class="field"><label>Campo formativo (NEM)</label>
        <select id="bCampo"><option value="">— Selecciona —</option>
          ${CAMPOS_NEM.map(c=>`<option ${c===b.campo?'selected':''}>${esc(c)}</option>`).join('')}</select></div>
      <div class="field full"><label>Tema o contenido de la sesión *</label><input id="bTema" value="${esc(b.tema)}" placeholder="Ej. Ecuaciones de primer grado"></div>
      <div class="field full"><label>Actividades realizadas</label><textarea id="bAct" rows="3" placeholder="Describe lo que se trabajó en clase">${esc(b.actividades)}</textarea></div>
      <div class="field full"><label>Tarea o encargo</label><input id="bTarea" value="${esc(b.tarea)}" placeholder="Opcional"></div>
      <div class="field full"><label>Observaciones</label><textarea id="bObs" rows="2" placeholder="Incidencias, avances, acuerdos (opcional)">${esc(b.observaciones)}</textarea></div>
    </div>
    <div class="modal-foot"><button class="btn btn-outline" id="bCan">Cancelar</button>
    <button class="btn btn-primary" id="bOk">Guardar sesión</button></div>`,
  body=>{
    body.querySelector('#bCan').addEventListener('click', cerrarModal);
    body.querySelector('#bOk').addEventListener('click', ()=>{
      const tema = body.querySelector('#bTema').value.trim();
      if(!tema){ toast('Escribe al menos el tema de la sesión.'); return; }
      const datos = {fecha:body.querySelector('#bFecha').value, materiaId:sesionBit.materiaId, grupoId:sesionBit.grupoId,
        campo:body.querySelector('#bCampo').value, tema,
        actividades:body.querySelector('#bAct').value.trim(),
        tarea:body.querySelector('#bTarea').value.trim(),
        observaciones:body.querySelector('#bObs').value.trim()};
      let obj;
      if(id){ obj = DB.bitacora.find(x=>x.id===id); Object.assign(obj, datos); sellarAutoria(obj,false); }
      else { obj = {id:uid(), ...datos}; sellarAutoria(obj,true); DB.bitacora.push(obj); }
      persist('bitacora', obj);
      cerrarModal(); pintarBit(); toast('Sesión guardada en la bitácora.');
    });
  });
}

/* ───────────────────────── 20. CALENDARIO ESCOLAR ───────────────────────── */
const TIPOS_EVENTO = {
  parcial:{label:'Periodo de parcial', color:'var(--azul-500)'},
  evento:{label:'Evento escolar', color:'var(--oro-500)'},
  suspension:{label:'Día no laborable', color:'var(--mal)'},
  entrega:{label:'Entrega / fecha límite', color:'var(--ok)'},
};
function vistaCalendario(el){
  const admin = (typeof esAdmin==='function') ? esAdmin() : true;
  el.innerHTML = `
  ${!admin?'<p class="muted" style="margin-bottom:.8rem">Consulta el calendario del ciclo escolar. Su edición está a cargo de la administración del plantel.</p>':''}
  <div class="toolbar">
    <div class="spacer"></div>
    ${admin?'<button class="btn btn-primary" id="calNuevo">＋ Agregar al calendario</button>':''}
  </div>
  <div class="grid grid-2" id="calZona"></div>`;

  if(admin) $('#calNuevo').addEventListener('click', ()=>formCalendario(null));

  const pintar = ()=>{
    const hoy = hoyISO();
    const evs = [...DB.calendario].sort((a,b)=>a.fecha.localeCompare(b.fecha));
    const proximos = evs.filter(e=>(e.fechaFin||e.fecha)>=hoy);
    const pasados = evs.filter(e=>(e.fechaFin||e.fecha)<hoy).reverse();
    const tarjeta = e=>{
      const t = TIPOS_EVENTO[e.tipo]||TIPOS_EVENTO.evento;
      const rango = e.fechaFin && e.fechaFin!==e.fecha
        ? `${new Date(e.fecha+'T12:00').toLocaleDateString('es-MX',{day:'numeric',month:'short'})} – ${new Date(e.fechaFin+'T12:00').toLocaleDateString('es-MX',{day:'numeric',month:'short'})}`
        : new Date(e.fecha+'T12:00').toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long'});
      return `<div class="card" style="border-left:4px solid ${t.color}">
        <div style="display:flex;justify-content:space-between;gap:.5rem;align-items:start">
          <div><h3 style="margin-bottom:.2rem">${esc(e.titulo)}</h3>
            <p class="muted mono">${esc(rango)}</p>
            <span class="tag tag-info">${esc(t.label)}</span></div>
          ${admin?`<div style="display:flex;gap:.3rem;flex-direction:column">
            <button class="btn btn-sm btn-outline" data-edc="${e.id}">Editar</button>
            <button class="btn btn-sm btn-danger" data-elc="${e.id}">Quitar</button></div>`:''}
        </div>
        ${e.nota?`<p style="margin-top:.4rem;color:var(--gris-600)">${esc(e.nota)}</p>`:''}
      </div>`;
    };
    $('#calZona').innerHTML = `
      <div style="grid-column:1/-1"><h3 style="margin:.3rem 0">📌 Próximos</h3></div>
      ${proximos.length?proximos.map(tarjeta).join(''):'<div class="vacio card" style="grid-column:1/-1"><span class="icono">📅</span>Sin eventos próximos registrados.</div>'}
      ${pasados.length?`<div style="grid-column:1/-1"><h3 style="margin:.8rem 0 .3rem;color:var(--gris-600)">Anteriores</h3></div>${pasados.map(tarjeta).join('')}`:''}`;

    if(admin){
      $('#calZona').querySelectorAll('[data-edc]').forEach(b=>b.addEventListener('click',()=>formCalendario(b.dataset.edc)));
      $('#calZona').querySelectorAll('[data-elc]').forEach(b=>b.addEventListener('click',()=>{
        if(!confirm('¿Quitar este evento del calendario?')) return;
        DB.calendario = DB.calendario.filter(e=>e.id!==b.dataset.elc);
        persistDel('calendario', b.dataset.elc);
        pintar(); toast('Evento eliminado.');
      }));
    }
  };
  pintar();
}
function formCalendario(id){
  const e = id ? DB.calendario.find(x=>x.id===id)
    : {fecha:hoyISO(), fechaFin:'', titulo:'', tipo:'evento', nota:''};
  abrirModal(id?'Editar evento':'Agregar al calendario', `
    <div class="form-grid">
      <div class="field full"><label>Título *</label><input id="cTitulo" value="${esc(e.titulo)}" placeholder="Ej. Primer parcial / Suspensión por consejo técnico"></div>
      <div class="field"><label>Tipo</label>
        <select id="cTipo">${Object.entries(TIPOS_EVENTO).map(([k,v])=>`<option value="${k}" ${k===e.tipo?'selected':''}>${esc(v.label)}</option>`).join('')}</select></div>
      <div class="field"><label>Fecha</label><input type="date" id="cFecha" value="${esc(e.fecha)}"></div>
      <div class="field"><label>Fecha fin (opcional)</label><input type="date" id="cFechaFin" value="${esc(e.fechaFin||'')}"></div>
      <div class="field full"><label>Nota (opcional)</label><input id="cNota" value="${esc(e.nota||'')}"></div>
    </div>
    <div class="modal-foot"><button class="btn btn-outline" id="cCan">Cancelar</button>
    <button class="btn btn-primary" id="cOk">Guardar evento</button></div>`,
  body=>{
    body.querySelector('#cCan').addEventListener('click', cerrarModal);
    body.querySelector('#cOk').addEventListener('click', ()=>{
      const titulo = body.querySelector('#cTitulo').value.trim();
      if(!titulo){ toast('Escribe el título del evento.'); return; }
      const fecha = body.querySelector('#cFecha').value;
      const fechaFin = body.querySelector('#cFechaFin').value;
      if(fechaFin && fechaFin<fecha){ toast('La fecha fin no puede ser anterior a la de inicio.'); return; }
      const datos = {fecha, fechaFin, titulo, tipo:body.querySelector('#cTipo').value, nota:body.querySelector('#cNota').value.trim()};
      let obj;
      if(id){ obj = DB.calendario.find(x=>x.id===id); Object.assign(obj, datos); }
      else { obj = {id:uid(), ...datos}; DB.calendario.push(obj); }
      persist('calendario', obj);
      cerrarModal(); render(); toast('Evento guardado en el calendario.');
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════════
   22. VISTA GENERAL DEL PLANTEL
   Muestra el horario de TODOS los grupos por ciclo en una sola pantalla.
   Filtros: ciclo, semestre, docente. Exporta a PDF horizontal.
   ═══════════════════════════════════════════════════════════════════════ */
function vistaVistaPlantel(el){
  const cicloActivo = DB.plantel.ciclo||cicloActualAuto();
  const ciclosDisp = [...new Set(DB.grupos.map(g=>g.ciclo).filter(Boolean))];
  if(!ciclosDisp.length) ciclosDisp.push(cicloActivo);

  el.innerHTML = `
  <div class="card">
    <div class="toolbar" style="flex-wrap:wrap;gap:.5rem">
      <div class="field"><label>Ciclo</label>
        <select id="vpCiclo">${ciclosDisp.map(c=>`<option ${c===cicloActivo?'selected':''}>${c}</option>`).join('')}</select></div>
      <div class="field"><label>Filtrar por semestre</label>
        <select id="vpSem"><option value="">Todos</option>${[1,2,3,4,5,6].map(s=>`<option value="${s}">${s}° semestre</option>`).join('')}</select></div>
      <div class="field"><label>Filtrar por docente</label>
        <select id="vpDoc"><option value="">Todos</option>${DB.docentes.map(d=>`<option value="${d.id}">${esc(d.nombre)}</option>`).join('')}</select></div>
      <div class="spacer"></div>
      <button class="btn btn-outline" id="vpPDF">🧾 Exportar PDF</button>
    </div>
  </div>
  <div id="vpZona" style="margin-top:.8rem"></div>`;

  const pintar = ()=>{
    const ciclo = $('#vpCiclo').value;
    const semFiltro = +$('#vpSem').value||0;
    const docFiltro = $('#vpDoc').value;
    let grupos = DB.grupos.filter(g=>g.ciclo===ciclo||(ciclo===cicloActivo&&!g.ciclo));
    if(semFiltro) grupos = grupos.filter(g=>g.semestre===semFiltro);
    grupos = grupos.sort((a,b)=>a.semestre-b.semestre||a.nombre.localeCompare(b.nombre));
    if(!grupos.length){ $('#vpZona').innerHTML='<div class="vacio card"><span class="icono">🗓️</span>No hay grupos registrados para este ciclo. Crea grupos y asígnales el ciclo correcto.</div>'; return; }
    const bloques = BLOQUES_P50;

    let html = '';
    grupos.forEach(g=>{
      let clases = DB.horarios.filter(h=>h.grupoId===g.id);
      if(docFiltro) clases = clases.filter(h=>materia(h.materiaId)?.docenteId===docFiltro);
      html += `<div class="card" style="margin-bottom:1rem;overflow-x:auto">
        <h3 style="margin-bottom:.5rem">${esc(g.nombre)} <span class="muted" style="font-size:.8rem">· ${g.semestre}° sem. · ${esc(g.turno||'')} · Ciclo ${esc(g.ciclo||cicloActivo)}</span>
          <span class="tag tag-info">${clases.length} clase(s)</span></h3>
        <table class="horario-tabla" style="min-width:600px"><thead><tr>
          <th style="width:90px">Hora</th>${DIAS.map(d=>`<th>${d}</th>`).join('')}</tr></thead><tbody>`;
      bloques.forEach(b=>{
        if(b.receso){
          html += `<tr><td class="mono">${b.hi}</td><td colspan="5" style="text-align:center;background:#FBF1D9;color:var(--oro-500);font-weight:700;font-size:.78rem">☕ RECESO</td></tr>`;
          return;
        }
        html += `<tr><td class="mono" style="font-size:.75rem;white-space:nowrap">${b.hi}<br>${b.hf}</td>`;
        DIAS.forEach(d=>{
          const c = clases.filter(h=>h.dia===d && h.hi===b.hi);
          html += `<td style="padding:.2rem">${c.map(h=>{
            const m=materia(h.materiaId), doc=docente(m?.docenteId);
            const esCd=/cultura\s*digital/i.test(m?.nombre||'');
            return `<div class="bloque-clase" style="${esCd?'border-left-color:var(--oro-500);background:#FBF1D9':''}">
              <strong style="font-size:.72rem">${esc(m?.nombre||'—')}</strong>
              <span style="font-size:.65rem">${esc(h.aula||'')}${doc?' · '+esc(doc.nombre.split(' ').slice(-1)[0]):''}</span>
            </div>`;
          }).join('')}</td>`;
        });
        html += '</tr>';
      });
      html += '</tbody></table></div>';
    });
    $('#vpZona').innerHTML = html;
  };

  ['vpCiclo','vpSem','vpDoc'].forEach(id=>$('#'+id).addEventListener('change', pintar));
  $('#vpPDF').addEventListener('click', ()=>exportarPlantelPDF($('#vpCiclo').value));
  pintar();
}

function exportarPlantelPDF(ciclo){
  if(!hayPDF()) return;
  const grupos = DB.grupos.filter(g=>g.ciclo===ciclo||(ciclo===DB.plantel.ciclo&&!g.ciclo))
    .sort((a,b)=>a.semestre-b.semestre||a.nombre.localeCompare(b.nombre));
  if(!grupos.length){ toast('No hay grupos para exportar en este ciclo.'); return; }
  const doc = new window.jspdf.jsPDF({orientation:'landscape'});
  grupos.forEach((g,gi)=>{
    if(gi>0) doc.addPage();
    encabezadoPDF(doc, `HORARIO GENERAL · ${g.nombre}`);
    doc.setFontSize(10); doc.setTextColor(22,35,58);
    doc.text(`${g.nombre} · ${g.semestre}° semestre · ${g.turno||''} · Ciclo ${g.ciclo||ciclo}`, 14, 38);
    const bloques = BLOQUES_P50.filter(b=>!b.receso);
    const clases = DB.horarios.filter(h=>h.grupoId===g.id);
    const cuerpo = bloques.map(b=>{
      const fila = [`${b.hi}\n${b.hf}`];
      DIAS.forEach(d=>{
        const c = clases.filter(h=>h.dia===d&&h.hi===b.hi);
        fila.push(c.map(h=>{ const m=materia(h.materiaId),dc=docente(m?.docenteId);
          return `${m?.nombre||'—'}\n${dc?.nombre||''}\n${h.aula||''}`; }).join('\n'));
      });
      return fila;
    });
    doc.autoTable({ startY:44, head:[['Hora',...DIAS]], body:cuerpo,
      styles:{fontSize:7,cellPadding:2,valign:'middle'},
      headStyles:{fillColor:[29,78,158],textColor:255,fontStyle:'bold',halign:'center'},
      columnStyles:{0:{fontStyle:'bold',fillColor:[227,235,247],halign:'center'}},
    });
  });
  piePDF(doc);
  doc.save(`horario_plantel_${ciclo||'completo'}.pdf`);
  toast(`PDF del plantel generado: ${grupos.length} grupo(s).`);
}

/* ═══════════════════════════════════════════════════════════════════════
   23. AUDITOR DE HORARIOS
   Detecta en tiempo real: choques de docente entre grupos, materias
   asignadas múltiples veces en el mismo bloque, grupos sin horario,
   materias con sesiones configuradas pero sin clase asignada,
   y docentes con carga excesiva o cero horas.
   ═══════════════════════════════════════════════════════════════════════ */
function vistaAuditor(el){
  el.innerHTML = `
  <div class="card">
    <div class="toolbar">
      <div class="field"><label>Ciclo a auditar</label>
        <select id="auCiclo">${listaCiclos().map(c=>`<option ${c===(DB.plantel.ciclo||cicloActualAuto())?'selected':''}>${c}</option>`).join('')}</select></div>
      <div class="spacer"></div>
      <button class="btn btn-outline" id="auTabla">📊 Tabla de carga horaria</button>
      <button class="btn btn-outline" id="auBalance">⚖️ Balancear carga</button>
      <button class="btn btn-danger" id="auLimpiar">🧹 Quitar sesiones excedidas</button>
      <button class="btn btn-gold" id="auAjuste">🔧 Ajuste automático</button>
      <button class="btn btn-primary" id="auAuditar">🔍 Ejecutar auditoría</button>
    </div>
  </div>
  <div id="auResultados" style="margin-top:.9rem"></div>`;

  const auditar = ()=>{
    const ciclo = $('#auCiclo').value;
    const grupos = DB.grupos.filter(g=>!g.ciclo||g.ciclo===ciclo);
    const todosHorarios = DB.horarios;
    const problemas = [], avisos = [], info = [];

    // ── 0. Materias duplicadas (misma clave y semestre repetidos) ──
    const porClaveSem = {};
    DB.materias.forEach(m=>{
      if(!m.clave) return;
      const k = m.clave+'|'+m.semestre;
      (porClaveSem[k]=porClaveSem[k]||[]).push(m);
    });
    Object.values(porClaveSem).filter(lst=>lst.length>1).forEach(lst=>{
      const nombres = lst.map(m=>`${esc(docente(m.docenteId)?.nombre||'sin docente')} (${DB.horarios.filter(h=>h.materiaId===m.id).length} clases)`);
      problemas.push(`🔴 <strong>Materia duplicada:</strong> "${esc(lst[0].nombre)}" (${esc(lst[0].clave)}, ${lst[0].semestre}° sem.) existe <strong>${lst.length} veces</strong> en el sistema: ${nombres.join(' · ')}. Esto duplica sus clases en el horario. Ve a Materias y rubros y elimina las copias sobrantes.`);
    });

    // ── 1. Choques de docente entre grupos ──
    const mapaDocDia = {}; // docenteId|dia|hi → [grupoId, materiaId]
    grupos.forEach(g=>{
      const clases = todosHorarios.filter(h=>h.grupoId===g.id);
      clases.forEach(h=>{
        const did = materia(h.materiaId)?.docenteId; if(!did) return;
        const clave = `${did}|${h.dia}|${h.hi}`;
        if(!mapaDocDia[clave]) mapaDocDia[clave]=[];
        mapaDocDia[clave].push({grupoId:g.id, grupoNom:g.nombre, matNom:materia(h.materiaId)?.nombre||'?'});
      });
    });
    Object.entries(mapaDocDia).forEach(([clave,lst])=>{
      if(lst.length<2) return;
      const [did,dia,hi] = clave.split('|');
      const docNom = docente(did)?.nombre||did;
      problemas.push(`🔴 <strong>Choque de docente:</strong> ${esc(docNom)} tiene ${lst.length} clases el <em>${esc(dia)} ${esc(hi)}</em> en los grupos ${lst.map(x=>`${esc(x.grupoNom)} (${esc(x.matNom)})`).join(', ')}.`);
    });

    // ── 2. Grupos sin ninguna clase ──
    grupos.forEach(g=>{
      const n = todosHorarios.filter(h=>h.grupoId===g.id).length;
      if(n===0) avisos.push(`🟡 <strong>Sin horario:</strong> El grupo <strong>${esc(g.nombre)}</strong> (${g.semestre}° sem.) no tiene ninguna clase asignada.`);
    });

    // ── 3. Materias con sesiones configuradas pero sin clase en algún grupo ──
    grupos.forEach(g=>{
      const mats = DB.materias.filter(m=>m.semestre===g.semestre&&(m.sesionesSemana||0)>0);
      mats.forEach(m=>{
        const asig = todosHorarios.filter(h=>h.grupoId===g.id&&h.materiaId===m.id).length;
        const faltan = m.sesionesSemana - asig;
        if(faltan>0) avisos.push(`🟡 <strong>Sesiones faltantes:</strong> ${esc(m.nombre)} en ${esc(g.nombre)}: configuradas ${m.sesionesSemana}, asignadas ${asig} (faltan <strong>${faltan}</strong>).`);
        if(asig>m.sesionesSemana) problemas.push(`🟠 <strong>Sesiones excedidas:</strong> ${esc(m.nombre)} en ${esc(g.nombre)}: configuradas ${m.sesionesSemana}, asignadas ${asig} (${asig-m.sesionesSemana} de más).`);
      });
    });

    // ── 4. Docentes con carga horaria ──
    const cargaDoc = {};
    grupos.forEach(g=>{ todosHorarios.filter(h=>h.grupoId===g.id).forEach(h=>{
      const did=materia(h.materiaId)?.docenteId; if(!did) return;
      cargaDoc[did]=(cargaDoc[did]||0)+1;
    });});
    DB.docentes.forEach(d=>{
      const h = cargaDoc[d.id]||0;
      if(h===0) avisos.push(`🟡 <strong>Docente sin horas:</strong> ${esc(d.nombre)} no tiene ninguna clase en el horario de este ciclo.`);
      else if(h>35) problemas.push(`🟠 <strong>Sobrecarga:</strong> ${esc(d.nombre)} tiene ${h} horas asignadas (máx. recomendado: 35/sem). Revisa su distribución.`);
      else info.push(`✅ ${esc(d.nombre)}: <strong>${h}</strong> hora(s) semanales.`);
    });

    // ── 5. Materias sin docente asignado en el horario ──
    const matsSinDoc = new Set();
    todosHorarios.forEach(h=>{ if(!materia(h.materiaId)?.docenteId) matsSinDoc.add(h.materiaId); });
    matsSinDoc.forEach(mid=>{ const m=materia(mid); if(m) avisos.push(`🟡 <strong>Sin docente:</strong> La materia "${esc(m.nombre)}" tiene clases en el horario pero no tiene docente asignado.`); });

    // ── Render de resultados ──
    const bloque = (titulo, color, items) => items.length ? `
      <div class="card" style="border-left:4px solid ${color};margin-bottom:.9rem">
        <h3 style="margin-bottom:.6rem">${titulo} <span class="tag" style="background:${color}20;color:${color}">${items.length}</span></h3>
        ${items.map(i=>`<p style="margin-bottom:.4rem;font-size:.88rem">${i}</p>`).join('')}
      </div>` : '';

    const sin = !problemas.length && !avisos.length;
    $('#auResultados').innerHTML =
      (sin ? `<div class="card" style="border-left:4px solid var(--ok);text-align:center;padding:2rem"><span style="font-size:2.5rem">✅</span><h3 style="margin-top:.5rem">Horario limpio</h3><p class="muted">No se encontraron choques, conflictos ni materias sin asignar en el ciclo ${esc(ciclo)}.</p></div>` : '') +
      bloque('🔴 Problemas críticos (requieren corrección)', 'var(--mal)', problemas) +
      bloque('🟡 Advertencias (revisar)', 'var(--aviso)', avisos) +
      bloque('✅ Carga docente', 'var(--ok)', info);
  };

  $('#auAuditar').addEventListener('click', auditar);
  $('#auTabla').addEventListener('click', ()=>tablaCargaHoraria($('#auCiclo').value));
  $('#auBalance').addEventListener('click', ()=>modalBalanceCarga($('#auCiclo').value));
  $('#auAjuste').addEventListener('click', ()=>modalAjusteAutomatico($('#auCiclo').value));
  $('#auLimpiar').addEventListener('click', ()=>modalLimpiarExcedidas($('#auCiclo').value));
  auditar(); // ejecutar al abrir
}

/* ═══════════════════════════════════════════════════════════════════════
   TABLA MAESTRA DE CARGA HORARIA
   Todos los docentes en filas × días de la semana en columnas, con el
   total de horas y detección visual de duplicados (celdas en rojo).
   ═══════════════════════════════════════════════════════════════════════ */
function tablaCargaHoraria(ciclo){
  const grupos = DB.grupos.filter(g=>!g.ciclo||g.ciclo===ciclo);
  const gids = new Set(grupos.map(g=>g.id));
  const clasesCiclo = DB.horarios.filter(h=>gids.has(h.grupoId));
  const bloques = BLOQUES_P50.filter(b=>!b.receso);

  // Mapa docente → día → [clases]
  const bloquesIdx = BLOQUES_P50.filter(b=>!b.receso).map(b=>b.hi);
  const docentes = DB.docentes.slice().sort((a,b)=>a.nombre.localeCompare(b.nombre));
  const cargaData = docentes.map(d=>{
    const clasesDoc = clasesCiclo.filter(h=>materia(h.materiaId)?.docenteId===d.id);
    const porDia = {}; let dupl = 0; let huecos = 0;
    DIAS.forEach(dia=>{
      const cls = clasesDoc.filter(h=>h.dia===dia).sort((a,b)=>a.hi.localeCompare(b.hi));
      // Detectar duplicados: mismo docente, mismo bloque, distinto grupo
      const porBloque = {};
      cls.forEach(c=>{ porBloque[c.hi]=(porBloque[c.hi]||0)+1; if(porBloque[c.hi]>1) dupl++; });
      // Contar horas hueco: bloques vacíos entre la primera y la última clase del día
      const idxs = [...new Set(cls.map(c=>bloquesIdx.indexOf(c.hi)).filter(i=>i>=0))].sort((a,b)=>a-b);
      if(idxs.length>=2){
        const span = idxs[idxs.length-1]-idxs[0]+1;
        huecos += span - idxs.length; // espacios vacíos dentro del rango
      }
      porDia[dia] = cls;
    });
    return {docente:d, porDia, total:clasesDoc.length, duplicados:dupl, huecos,
      diasActivos:DIAS.filter(dia=>porDia[dia].length>0).length};
  });

  const html = `
    <div class="card">
      <h3 style="margin-bottom:.3rem">📊 Carga horaria por docente · Ciclo ${esc(ciclo)}</h3>
      <p class="muted" style="margin-bottom:.8rem">Las celdas <span style="background:var(--mal-bg);color:var(--mal);padding:.05rem .3rem;border-radius:4px">en rojo</span> indican que el docente tiene dos clases en el mismo horario (duplicado a corregir). Usa «Ajuste automático» para resolverlos.</p>
      <div class="table-wrap"><table style="font-size:.82rem">
        <thead><tr>
          <th style="text-align:left">Docente</th>
          ${DIAS.map(d=>`<th>${d.slice(0,3)}</th>`).join('')}
          <th>Total h/sem</th><th>Días</th><th>Huecos</th><th>Estado</th></tr></thead>
        <tbody>
        ${cargaData.map(cd=>`<tr>
          <td style="text-align:left"><a href="#" class="verDesglose" data-doc="${cd.docente.id}" style="color:var(--azul-500);text-decoration:none;font-weight:600">${esc(cd.docente.nombre)}</a></td>
          ${DIAS.map(dia=>{
            const cls = cd.porDia[dia];
            const bloqueCount = {};
            cls.forEach(c=>bloqueCount[c.hi]=(bloqueCount[c.hi]||0)+1);
            const hayDup = Object.values(bloqueCount).some(n=>n>1);
            return `<td style="${hayDup?'background:var(--mal-bg)':''}">${cls.length||'—'}</td>`;
          }).join('')}
          <td><strong>${cd.total}</strong></td>
          <td>${cd.diasActivos}/5</td>
          <td>${cd.huecos>0?`<span class="tag ${cd.huecos>=4?'tag-mal':'tag-aviso'}">${cd.huecos}h</span>`:'<span class="tag tag-ok">0</span>'}</td>
          <td>${cd.duplicados>0?`<span class="tag tag-mal">${cd.duplicados} dupl.</span>`
            : cd.total>35?`<span class="tag tag-aviso">Sobrecarga</span>`
            : cd.total===0?`<span class="muted">Sin carga</span>`
            : cd.diasActivos>=5&&cd.total>=20?`<span class="tag tag-aviso">Sin día libre</span>`
            : `<span class="tag tag-ok">OK</span>`}</td>
        </tr>`).join('')}
        </tbody>
      </table></div>
    </div>`;
  $('#auResultados').innerHTML = html;
  $('#auResultados').querySelectorAll('.verDesglose').forEach(a=>a.addEventListener('click', e=>{
    e.preventDefault(); desgloseMateriasDocente(a.dataset.doc, ciclo);
  }));
}

/* Muestra qué materias tiene asignadas un docente y cuántas clases genera cada una */
function desgloseMateriasDocente(docId, ciclo){
  const d = docente(docId);
  const grupos = DB.grupos.filter(g=>!g.ciclo||g.ciclo===ciclo);
  const gids = new Set(grupos.map(g=>g.id));
  const susMaterias = DB.materias.filter(m=>m.docenteId===docId);

  const filas = susMaterias.map(m=>{
    const clasesReales = DB.horarios.filter(h=>gids.has(h.grupoId)&&h.materiaId===m.id).length;
    const gruposConEsta = [...new Set(DB.horarios.filter(h=>gids.has(h.grupoId)&&h.materiaId===m.id).map(h=>grupo(h.grupoId)?.nombre))].filter(Boolean);
    return `<tr>
      <td class="mono">${esc(m.clave||'—')}</td>
      <td>${esc(m.nombre)}</td>
      <td style="text-align:center">${m.semestre}°</td>
      <td style="text-align:center">${m.sesionesSemana||0}</td>
      <td style="text-align:center"><strong>${clasesReales}</strong></td>
      <td style="font-size:.78rem">${esc(gruposConEsta.join(', ')||'sin horario')}</td>
    </tr>`;
  }).join('');

  const totalClases = DB.horarios.filter(h=>gids.has(h.grupoId)&&materia(h.materiaId)?.docenteId===docId).length;

  abrirModal(`📋 Materias de ${esc(d?.nombre||'')}`, `
    <p class="muted">Estas son <strong>todas</strong> las materias asignadas a este docente y las clases que generan en el horario. Si ves materias que no le corresponden, edítalas en «Materias y rubros» y cámbiales el docente.</p>
    <div class="table-wrap" style="margin-top:.7rem;max-height:340px;overflow-y:auto"><table style="font-size:.83rem">
      <thead><tr><th>Clave</th><th>Materia</th><th>Sem.</th><th>Ses/sem</th><th>Clases</th><th>Grupos</th></tr></thead>
      <tbody>${filas||'<tr><td colspan="6" class="muted" style="text-align:center;padding:1rem">Sin materias asignadas.</td></tr>'}</tbody>
      <tfoot><tr style="border-top:2px solid var(--gris-300);font-weight:700">
        <td colspan="4" style="text-align:right">Total de clases en el horario:</td>
        <td style="text-align:center">${totalClases}</td><td></td></tr></tfoot>
    </table></div>
    <div class="aviso-box" style="background:var(--azul-100);border-radius:8px;padding:.6rem .8rem;font-size:.83rem;margin-top:.7rem">💡 El «Total h/sem» de la tabla es la suma de la columna «Clases». Si es mayor de lo esperado, este desglose te muestra exactamente qué materias lo componen.</div>
    <div class="modal-foot"><button class="btn btn-primary" id="dmCerrar">Cerrar</button></div>`,
  body=>body.querySelector('#dmCerrar').addEventListener('click', cerrarModal));
}

/* ═══════════════════════════════════════════════════════════════════════
   BALANCEO DE CARGA DOCENTE
   Detecta docentes con carga > 28h (sin día libre posible) y propone pasar
   algunas de sus materias a docentes con capacidad disponible (misma
   especialidad/semestre preferentemente), para que ambos puedan descansar.
   ═══════════════════════════════════════════════════════════════════════ */
function modalBalanceCarga(ciclo){
  const grupos = DB.grupos.filter(g=>!g.ciclo||g.ciclo===ciclo);
  const gids = new Set(grupos.map(g=>g.id));
  const semestresActivos = [...new Set(grupos.map(g=>g.semestre))];
  const TOPE = 28; // máximo para tener día libre (7 bloques × 4 días)

  // Carga actual por docente (sesiones/semana de sus materias en grupos del ciclo)
  const cargaDoc = {};
  DB.materias.forEach(m=>{
    if(!m.docenteId) return;
    const nGrupos = grupos.filter(g=>g.semestre===m.semestre).length;
    // Si la materia está asignada en horario, contar sus clases reales; si no, estimar
    const clasesReales = DB.horarios.filter(h=>gids.has(h.grupoId)&&h.materiaId===m.id).length;
    cargaDoc[m.docenteId] = (cargaDoc[m.docenteId]||0) + (clasesReales||((m.sesionesSemana||0)*nGrupos));
  });

  const sobrecargados = DB.docentes.filter(d=>(cargaDoc[d.id]||0)>TOPE)
    .map(d=>({d, carga:cargaDoc[d.id]})).sort((a,b)=>b.carga-a.carga);
  const disponibles = DB.docentes.filter(d=>(cargaDoc[d.id]||0)<TOPE)
    .map(d=>({d, carga:cargaDoc[d.id]||0, espacio:TOPE-(cargaDoc[d.id]||0)}))
    .sort((a,b)=>b.espacio-a.espacio);

  if(!sobrecargados.length){
    abrirModal('⚖️ Balanceo de carga', `<div class="vacio"><span class="icono">✅</span>Ningún docente supera las ${TOPE} horas. Todos pueden tener al menos un día de descanso con la distribución actual.</div>
      <div class="modal-foot"><button class="btn btn-primary" id="blCerrar">Entendido</button></div>`,
      body=>body.querySelector('#blCerrar').addEventListener('click', cerrarModal));
    return;
  }

  // Generar sugerencias: para cada sobrecargado, qué materias pasar y a quién
  const sugerencias = [];
  const cargaSimulada = {...cargaDoc};
  sobrecargados.forEach(({d, carga})=>{
    let exceso = carga - TOPE;
    // Materias de este docente ordenadas por menor nº de sesiones (más fáciles de mover)
    const susMaterias = DB.materias.filter(m=>m.docenteId===d.id && semestresActivos.includes(m.semestre))
      .map(m=>({m, peso:(m.sesionesSemana||0)*grupos.filter(g=>g.semestre===m.semestre).length}))
      .sort((a,b)=>a.peso-b.peso);
    for(const {m, peso} of susMaterias){
      if(cargaSimulada[d.id]-TOPE<=0) break;
      // Buscar docente disponible con espacio suficiente
      const receptor = disponibles.find(r=>r.d.id!==d.id && (TOPE-(cargaSimulada[r.d.id]||0))>=peso);
      if(receptor){
        sugerencias.push({materia:m, de:d, a:receptor.d, peso});
        cargaSimulada[d.id] = (cargaSimulada[d.id]||0) - peso;
        cargaSimulada[receptor.d.id] = (cargaSimulada[receptor.d.id]||0) + peso;
      }
    }
  });

  const filasSobre = sobrecargados.map(({d,carga})=>
    `<tr><td>${esc(d.nombre)}</td><td style="text-align:center"><span class="tag tag-mal">${carga}h</span></td>
     <td style="text-align:center">${cargaSimulada[d.id]<=TOPE?`<span class="tag tag-ok">${cargaSimulada[d.id]}h ✓</span>`:`<span class="tag tag-aviso">${cargaSimulada[d.id]}h</span>`}</td></tr>`).join('');

  const filasSug = sugerencias.length ? sugerencias.map(s=>
    `<tr><td>${esc(s.materia.nombre)} <span class="muted">(${s.peso}h)</span></td>
     <td>${esc(s.de.nombre)}</td><td>→</td><td><strong>${esc(s.a.nombre)}</strong></td></tr>`).join('')
    : `<tr><td colspan="4" class="muted" style="text-align:center;padding:1rem">No hay docentes con espacio suficiente para recibir materias. Considera contratar apoyo o revisar la plantilla.</td></tr>`;

  abrirModal('⚖️ Balanceo de carga docente', `
    <p class="muted">Docentes que superan las <strong>${TOPE}h</strong> (no pueden tener día libre). El sistema sugiere redistribuir materias hacia docentes con capacidad:</p>
    <h4 style="margin:.8rem 0 .3rem">Docentes sobrecargados</h4>
    <div class="table-wrap"><table style="font-size:.85rem">
      <thead><tr><th>Docente</th><th>Carga actual</th><th>Tras balancear</th></tr></thead>
      <tbody>${filasSobre}</tbody></table></div>
    <h4 style="margin:1rem 0 .3rem">Movimientos sugeridos</h4>
    <div class="table-wrap"><table style="font-size:.85rem">
      <thead><tr><th>Materia</th><th>Quitar a</th><th></th><th>Asignar a</th></tr></thead>
      <tbody>${filasSug}</tbody></table></div>
    <div class="aviso-box" style="background:var(--aviso-bg);color:var(--aviso);border-radius:8px;padding:.6rem .8rem;font-size:.83rem;margin-top:.7rem">💡 Estas son <strong>sugerencias</strong>. Al aplicar, se reasigna el docente responsable de cada materia. Deberás rearmar el horario del plantel para reflejar los cambios. Verifica que el docente receptor tenga el perfil adecuado para la materia.</div>
    <div class="modal-foot"><button class="btn btn-outline" id="blCan">Cancelar</button>
    ${sugerencias.length?'<button class="btn btn-primary" id="blOk">Aplicar reasignaciones</button>':''}</div>`,
  body=>{
    body.querySelector('#blCan').addEventListener('click', cerrarModal);
    body.querySelector('#blOk')?.addEventListener('click', ()=>{
      if(!confirm(`Se reasignarán ${sugerencias.length} materia(s) a otros docentes. Luego deberás rearmar el horario. ¿Continuar?`)) return;
      const cambios = sugerencias.map(s=>{ s.materia.docenteId = s.a.id; return s.materia; });
      persist('materias', cambios);
      cerrarModal(); render();
      toast(`${sugerencias.length} materia(s) reasignada(s). Ahora rearma el horario del plantel.`);
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════════
   LIMPIEZA DE SESIONES EXCEDIDAS
   Cuando una materia tiene más clases asignadas de las configuradas
   (sesionesSemana), esto suele deberse a haber armado el plantel más de
   una vez sin reiniciar. Esta herramienta detecta el exceso por cada
   (grupo, materia) y elimina las clases sobrantes, dejando exactamente
   las sesiones configuradas (conserva las mejor distribuidas en la semana).
   ═══════════════════════════════════════════════════════════════════════ */
function modalLimpiarExcedidas(ciclo){
  const grupos = DB.grupos.filter(g=>!g.ciclo||g.ciclo===ciclo);
  const gids = new Set(grupos.map(g=>g.id));

  const excesos = [];
  grupos.forEach(g=>{
    const mats = DB.materias.filter(m=>m.semestre===g.semestre && (m.sesionesSemana||0)>0);
    mats.forEach(m=>{
      const clases = DB.horarios.filter(h=>h.grupoId===g.id && h.materiaId===m.id)
        .sort((a,b)=> DIAS.indexOf(a.dia)-DIAS.indexOf(b.dia) || a.hi.localeCompare(b.hi));
      if(clases.length > m.sesionesSemana){
        // Conservar las primeras (mejor repartidas por día distinto); sobrantes = el resto
        const diasVistos = new Set(); const conservar = []; const sobrantes = [];
        clases.forEach(c=>{
          if(conservar.length < m.sesionesSemana && !diasVistos.has(c.dia)){
            conservar.push(c); diasVistos.add(c.dia);
          } else sobrantes.push(c);
        });
        // Si aún faltan por recortar (varias el mismo día), completar desde el resto
        while(conservar.length < m.sesionesSemana && sobrantes.length){ conservar.push(sobrantes.shift()); }
        excesos.push({grupo:g, materia:m, configuradas:m.sesionesSemana, actuales:clases.length, sobrantes});
      }
    });
  });

  if(!excesos.length){
    abrirModal('🧹 Sesiones excedidas', `<div class="vacio"><span class="icono">✅</span>No hay materias con más clases de las configuradas en el ciclo ${esc(ciclo)}.</div>
      <div class="modal-foot"><button class="btn btn-primary" id="lxCerrar">Entendido</button></div>`,
      body=>body.querySelector('#lxCerrar').addEventListener('click', cerrarModal));
    return;
  }

  const totalSobrantes = excesos.reduce((a,e)=>a+e.sobrantes.length,0);
  const filas = excesos.map(e=>`<tr>
    <td>${esc(e.materia.nombre)}</td><td>${esc(e.grupo.nombre)}</td>
    <td style="text-align:center">${e.configuradas}</td>
    <td style="text-align:center"><span class="tag tag-mal">${e.actuales}</span></td>
    <td style="text-align:center"><strong>${e.sobrantes.length}</strong></td></tr>`).join('');

  abrirModal('🧹 Quitar sesiones excedidas', `
    <p class="muted">Se detectaron <strong>${excesos.length}</strong> materia(s) con más clases de las configuradas — normalmente por haber armado el horario del plantel más de una vez. Se eliminarán las clases sobrantes, dejando exactamente las sesiones configuradas de cada una:</p>
    <div class="table-wrap" style="max-height:300px;overflow-y:auto;margin-top:.6rem"><table style="font-size:.83rem">
      <thead><tr><th>Materia</th><th>Grupo</th><th>Config.</th><th>Actuales</th><th>A quitar</th></tr></thead>
      <tbody>${filas}</tbody></table></div>
    <div class="aviso-box" style="background:var(--aviso-bg);color:var(--aviso);border-radius:8px;padding:.6rem .8rem;font-size:.83rem;margin-top:.7rem">⚠️ Se eliminarán <strong>${totalSobrantes}</strong> clase(s) en total. Esta acción no se puede deshacer.</div>
    <div class="modal-foot"><button class="btn btn-outline" id="lxCan">Cancelar</button>
    <button class="btn btn-danger" id="lxOk">Quitar ${totalSobrantes} clase(s) sobrante(s)</button></div>`,
  body=>{
    body.querySelector('#lxCan').addEventListener('click', cerrarModal);
    body.querySelector('#lxOk').addEventListener('click', ()=>{
      const idsBorrar = new Set();
      excesos.forEach(e=>e.sobrantes.forEach(c=>idsBorrar.add(c.id)));
      DB.horarios = DB.horarios.filter(h=>!idsBorrar.has(h.id));
      persistDel('horarios', [...idsBorrar]);
      cerrarModal(); render();
      toast(`${idsBorrar.size} clase(s) sobrante(s) eliminada(s). Revisa la tabla de carga para confirmar.`);
    });
  });
}

function modalAjusteAutomatico(ciclo){
  const grupos = DB.grupos.filter(g=>!g.ciclo||g.ciclo===ciclo);
  const gids = new Set(grupos.map(g=>g.id));
  const bloques = BLOQUES_P50.filter(b=>!b.receso);

  // Detectar duplicados de docente
  const conflictos = [];
  const mapaDoc = {}; // docId|dia|hi → [horarios]
  DB.horarios.filter(h=>gids.has(h.grupoId)).forEach(h=>{
    const did = materia(h.materiaId)?.docenteId; if(!did) return;
    const k = `${did}|${h.dia}|${h.hi}`;
    (mapaDoc[k]=mapaDoc[k]||[]).push(h);
  });
  Object.entries(mapaDoc).forEach(([k,lst])=>{ if(lst.length>1){
    const [did,dia,hi]=k.split('|');
    // El primero se queda, los demás son conflictos a reubicar
    lst.slice(1).forEach(h=>conflictos.push({horario:h, docId:did, dia, hi}));
  }});

  if(!conflictos.length){
    abrirModal('🔧 Ajuste automático', `<div class="vacio"><span class="icono">✅</span>No hay duplicados de docente que corregir en el ciclo ${esc(ciclo)}. El horario está limpio.</div>
      <div class="modal-foot"><button class="btn btn-primary" id="ajCerrar">Entendido</button></div>`,
      body=>body.querySelector('#ajCerrar').addEventListener('click', cerrarModal));
    return;
  }

  // Calcular reubicaciones posibles (simulación)
  const ocupGrupo = {}, ocupDoc = {};
  grupos.forEach(g=>ocupGrupo[g.id]=DIAS.map(()=>bloques.map(()=>null)));
  DB.horarios.filter(h=>gids.has(h.grupoId)).forEach(h=>{
    const di=DIAS.indexOf(h.dia), bi=bloques.findIndex(b=>b.hi===h.hi);
    if(di<0||bi<0) return;
    if(ocupGrupo[h.grupoId]) ocupGrupo[h.grupoId][di][bi]=h.id;
    const did=materia(h.materiaId)?.docenteId;
    if(did){ ocupDoc[did]=ocupDoc[did]||DIAS.map(()=>bloques.map(()=>null)); ocupDoc[did][di][bi]=h.id; }
  });

  const plan = [];
  conflictos.forEach(cf=>{
    const h = cf.horario, did = cf.docId;
    const diOrig=DIAS.indexOf(h.dia), biOrig=bloques.findIndex(b=>b.hi===h.hi);
    // Liberar posición actual del conflicto
    if(ocupGrupo[h.grupoId]) ocupGrupo[h.grupoId][diOrig][biOrig]=null;
    if(ocupDoc[did]) ocupDoc[did][diOrig][biOrig]=null;
    // Buscar hueco libre para grupo Y docente
    let colocado=null;
    for(let di=0; di<DIAS.length && !colocado; di++){
      for(let bi=0; bi<bloques.length && !colocado; bi++){
        if(ocupGrupo[h.grupoId][di][bi]) continue;
        if(ocupDoc[did] && ocupDoc[did][di][bi]) continue;
        colocado={di,bi};
      }
    }
    if(colocado){
      ocupGrupo[h.grupoId][colocado.di][colocado.bi]=h.id;
      ocupDoc[did]=ocupDoc[did]||DIAS.map(()=>bloques.map(()=>null));
      ocupDoc[did][colocado.di][colocado.bi]=h.id;
      plan.push({horario:h, de:{dia:h.dia,hi:h.hi}, a:{dia:DIAS[colocado.di], hi:bloques[colocado.bi].hi, hf:bloques[colocado.bi].hf}});
    } else {
      plan.push({horario:h, de:{dia:h.dia,hi:h.hi}, a:null}); // sin hueco
    }
  });

  const filas = plan.map(p=>{
    const m=materia(p.horario.materiaId), g=grupo(p.horario.grupoId);
    return `<tr><td>${esc(docente(materia(p.horario.materiaId)?.docenteId)?.nombre||'')}</td>
      <td>${esc(m?.nombre||'')} · ${esc(g?.nombre||'')}</td>
      <td class="mono">${esc(p.de.dia.slice(0,3))} ${esc(p.de.hi)}</td>
      <td>${p.a?`<span class="tag tag-ok">${esc(p.a.dia.slice(0,3))} ${esc(p.a.hi)}</span>`:'<span class="tag tag-mal">Sin hueco libre</span>'}</td></tr>`;
  }).join('');

  abrirModal('🔧 Ajuste automático de duplicados', `
    <p class="muted">Se detectaron <strong>${conflictos.length}</strong> clase(s) con el docente duplicado en el mismo horario. El sistema propone reubicarlas así:</p>
    <div class="table-wrap" style="max-height:300px;overflow-y:auto;margin-top:.6rem"><table style="font-size:.83rem">
      <thead><tr><th>Docente</th><th>Materia · Grupo</th><th>Estaba en</th><th>Se mueve a</th></tr></thead>
      <tbody>${filas}</tbody></table></div>
    <div class="modal-foot"><button class="btn btn-outline" id="ajCan">Cancelar</button>
    <button class="btn btn-primary" id="ajOk">Aplicar reubicaciones</button></div>`,
  body=>{
    body.querySelector('#ajCan').addEventListener('click', cerrarModal);
    body.querySelector('#ajOk').addEventListener('click', ()=>{
      const aplicables = plan.filter(p=>p.a);
      aplicables.forEach(p=>{ p.horario.dia=p.a.dia; p.horario.hi=p.a.hi; p.horario.hf=p.a.hf; });
      persist('horarios', aplicables.map(p=>p.horario));
      cerrarModal(); render();
      const sinHueco = plan.length-aplicables.length;
      toast(`${aplicables.length} clase(s) reubicada(s).${sinHueco?` ${sinHueco} sin hueco (revisa manualmente).`:''}`);
    });
  });
}

/* ───────────────────────── 24. ARRANQUE ───────────────────────── */
const VISTAS = {
  dashboard:vistaDashboard, asistencia:vistaAsistencia, calificaciones:vistaCalificaciones,
  bitacora:vistaBitacora, docentes:vistaDocentes, materias:vistaMaterias, grupos:vistaGrupos,
  horarios:vistaHorarios, vistaplantel:vistaVistaPlantel, auditor:vistaAuditor,
  calendario:vistaCalendario, credenciales:vistaCredenciales,
  consultas:vistaConsultas, estadisticas:vistaEstadisticas, reportes:vistaReportes,
};
iniciarSistema();   // decide modo local o nube (ver js/nube.js)
