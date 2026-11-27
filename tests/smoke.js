// Prueba rápida: carga la app con un DOM simulado y pinta todas las pantallas.
// Uso: node tests/smoke.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..');
const vals = {};
const el = (k) => ({ innerHTML: '', textContent: '', get value() { return vals[k] ?? 'x'; }, set value(v) { vals[k] = v; }, style: {}, files: [], className: '', append() {}, remove() {} });
global.CLOUD_CFG = undefined; global.location = { href: 'http://localhost/' }; global.document = { querySelector: (k) => el(k), createElement: () => el('t'), body: { append() {} } };
global.prompt = () => 'Nombre nuevo'; global.confirm = () => true;
global.URL = { createObjectURL: () => 'blob:x' }; global.__v = vals;
const store = {}; global.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } }; global.__store = store;
const code = ['js/seed-data.js', 'js/app.js', 'js/auth.js', 'js/cloud.js'].map((f) => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
vm.runInThisContext(code);
vm.runInThisContext(`
const T = [];
const t = (n, f) => { try { f(); } catch (e) { T.push(n + ': ' + e.message); } };
const ok = (c, m) => { if (!c) throw new Error(m); };
const V_ = __v;

const S_ = __store;
t('arranca sin datos de ejemplo', () => { ok(PROG.length === 0 && MEM.length === 0 && ACT.length === 0, 'hay datos de ejemplo'); ok(LIB.length === 430 && LIB.filter((x) => x.v).length === 425, 'biblioteca: ' + LIB.length); });
t('pantallas vacias', () => { for (const p of ['home', 'members', 'progs', 'forms', 'lib']) { V = { p }; coach(); } mode = 'a'; for (const x of ['home', 'prog', 'perfil']) { A.t = x == 'perfil' ? 'perfil' : 'hoy'; A.s = x; athlete(); } });
t('registro entrenador', () => { mode = 'r'; R = { role: 'c', st: 1, d: { name: 'Ana Gómez', email: 'Ana.Gomez@Gmail.com', pass: 'clave1234', club: 'Club', sport: 'Fútbol', terms: true } }; ok(!emailTaken(R.d.email), 'ya existe'); sendC(); ok(ME === 'ana.gomez@gmail.com' && emailTaken('ANA.gomez@gmail.com'), 'no crea la cuenta'); ok(PF.n === 'Ana Gómez', 'perfil'); });
t('crear programa y miembro', () => { go('home'); V_['#pn'] = 'Mi programa'; V_['#po'] = '0'; V_['#pt'] = ''; mkProg(); ok(PROG.length === 1, 'programa'); V_['#mn'] = 'Alumno Uno'; V_['#me'] = 'alumno@gmail.com'; saveMem(); ok(MEM.length === 1, 'miembro'); PROG[0].as.push('Alumno Uno'); LIB[0].t = ['Fuerza']; PROG[0].ph[0].s[0][0].blocks[0].ex.push({ e: 0, p: ['reps', 'peso'], sets: [{ reps: 8, peso: 20 }] }); PF.a = '30'; render(); });
t('memoria: cerrar sesion y volver', () => { const n = PROG.length; logout(); ok(ME === null && PROG.length === 0, 'logout'); V_['#l_e'] = 'ana.gomez@gmail.com'; V_['#l_p'] = 'mala'; doLogin(); ok(ME === null, 'acepta clave mala'); V_['#l_p'] = 'clave1234'; doLogin(); ok(ME === 'ana.gomez@gmail.com' && PROG.length === n && PROG[0].n === 'Mi programa' && MEM[0].n === 'Alumno Uno' && PF.a === '30' && LIB[0].t[0] === 'Fuerza', 'no recuerda los datos'); });
t('cuentas separadas', () => { logout(); mode = 'r'; R = { role: 'c', st: 1, d: { name: 'Otra', email: 'otra@gmail.com', pass: 'clave1234', club: 'C', sport: 'Rugby', terms: true } }; sendC(); ok(PROG.length === 0 && MEM.length === 0, 'comparte datos'); logout(); V_['#l_e'] = 'ana.gomez@gmail.com'; V_['#l_p'] = 'clave1234'; doLogin(); ok(PROG.length === 1, 'pierde datos'); });
t('registro atleta', () => { logout(); AV = 'reg'; mode = 'r'; R = { role: 'a', st: 4, d: { name: 'Pepe Ruiz', email: 'pepe@gmail.com', pass: 'clave1234', terms: true } }; mkAcct('a'); ok(ME === 'pepe@gmail.com' && mode === 'a' && PF.n === 'Pepe Ruiz', 'atleta'); athlete(); logout(); V_['#l_e'] = 'ana.gomez@gmail.com'; V_['#l_p'] = 'clave1234'; doLogin(); });
t('arranque con sesion guardada', () => { ok(S_['solo.data.ana.gomez@gmail.com'].length > 1000 && JSON.parse(S_['solo.data.ana.gomez@gmail.com']).PROG.length === 1, 'sin datos guardados'); });
mode = 'c';
for (const p of ['home', 'members', 'progs', 'forms', 'lib']) t('entrenador ' + p, () => { V = { p }; coach(); });
for (const ct of ['prog', 'ph', 'tpl', 'ex']) t('cositas ' + ct, () => { V = { p: 'lib', ct }; coach(); lst(); });
t('renombrar y eliminar fase', () => { const n = PROG[0].ph.length; addPh(); V_['#fn'] = 'Fase extra'; V_['#fo'] = '0'; V_['#ft'] = ''; mkPh(); const m = PROG[0].ph.length; renPh(0); V_['#phn'] = 'Nov3'; savePhN(0); ok(PROG[0].ph[0].n === 'Nov3', 'no renombra'); global.confirm = () => true; V.phi = m - 1; delPh(m - 1); ok(m === n + 1 && PROG[0].ph.length === m - 1, 'no elimina'); if (PROG[0].ph.length === 1) { delPh(0); ok(PROG[0].ph.length === 1, 'borró la última fase'); } });
t('bloques: añadir, renombrar, ejercicios, borrar', () => { V = { p: 'ed', pi: 0, phi: 0, w: 0, d: 0, vw: 'week' }; const s0 = () => PROG[0].ph[0].s[0][0]; global.confirm = () => true; coach(); const n = s0().blocks.length; addBlk(0, 0); ok(s0().blocks.length === n + 1, 'no añade'); rnBlk(0, 0, n, 'Calentamiento'); ok(s0().blocks[n].n === 'Calentamiento', 'no renombra'); pick(0, 0, n, -1); setEx(0, 0, n, -1, 3); ok(s0().blocks[n].ex.length === 1, 'ejercicio en bloque'); exModal(0, 0, n, 0); tp(0, 0, n, 0, 'rpe'); coach(); mode = 'a'; A.s = 'prev'; A.ses = 0; athlete(); A.s = 'run'; athlete(); A.s = 'ex'; A.ex = nx(s0()) - 1; athlete(); viewSes(0, 0); mode = 'c'; rmEx(0, 0, n, 0); ok(s0().blocks[n].ex.length === 0, 'no quita ejercicio'); delBlk(0, 0, n); ok(s0().blocks.length === n, 'no borra bloque'); while (s0().blocks.length > 1) delBlk(0, 0, 0); delBlk(0, 0, 0); ok(s0().blocks.length === 1, 'borró el último bloque'); });
t('previsualizar ejercicio', () => { libView(0); libView(8); libForm(0); });
t('miembro', () => { V = { p: 'mem', mi: 0 }; coach(); });
t('programa', () => { V = { p: 'prog', pi: 0, phi: 0 }; coach(); });
for (const vw of ['week', 'load']) t('editor ' + vw, () => { V = { p: 'ed', pi: 0, phi: 0, w: 0, d: 0, vw }; coach(); });
t('formulario ejercicio', () => { libForm(-1); tgR(); libForm(8); tgR(); chT('p', 3); chT('e', 0); chT('t', 0); saveLib(-1); });
t('anadir ejercicio a sesion', () => { V = { p: 'ed', pi: 0, phi: 0, w: 0, d: 0, vw: 'week' }; const n = P().ph[0].s[0][0].blocks[0].ex.length; setEx(0, 0, 0, -1, 0); ok(P().ph[0].s[0][0].blocks[0].ex.length === n + 1, 'no se anade'); coach(); exModal(0, 0, 0, n); viewSes(0, 0); });

// visibilidad de semanas: el atleta solo ve las semanas visibles
t('visibilidad', () => {
  V = { p: 'ed', pi: 0, phi: 0, w: 1, d: 0, vw: 'week' };
  const a = sessList().length; tgVis(0, 1); const b = sessList().length; tgVis(0, 1);
  ok(b < a && sessList().length === a, 'ocultar/mostrar semana: ' + [a, b, sessList().length]);
});

// plantillas
t('plantilla de fase', () => { V = { p: 'prog', pi: 0, phi: 0 }; tplDlg('ph', 0); V_['#tn'] = 'Mi fase'; saveTpl(); ok(TPL.some((x) => x.k === 'ph' && x.n === 'Mi fase'), 'no guardada'); });
t('crear desde plantilla', () => { const n = PROG.length; const i = TPL.findIndex((x) => x.n === 'Mi fase'); newProg(i); V_['#pn'] = 'Nuevo'; V_['#po'] = '2'; V_['#pt'] = String(i); mkProg(); ok(PROG.length === n + 1 && PROG[0].ph[0].hv.every((x) => x === true), 'no oculta'); });

// copiar semana a otro programa
t('copiar semana', () => { V = { p: 'prog', pi: 1, phi: 0 }; const n = PROG[0].ph[0].w; V_['#cpp'] = '0'; V_['#cph'] = '0'; cpDlg('wk', 0, 0, 0, 'o'); doCp(); ok(PROG[0].ph[0].w >= n, 'copia'); });

mode = 'a';
for (const x of [['hoy', 'home'], ['hoy', 'prog'], ['hoy', 'prev'], ['hoy', 'run'], ['hoy', 'ex'], ['hoy', 'rpe'], ['chat', 'chat'], ['perfil', 'perfil']])
  t('atleta ' + x[1], () => { A.t = x[0]; A.s = x[1]; A.ses = 0; A.ex = 0; athlete(); });

mode = 'r';
for (const role of ['c', 'a']) for (const st of [1, 2, 3, 4]) t('registro ' + role + st, () => { R.role = role; R.st = st; reg(); });

console.log(T.length ? T : 'TODO OK');
if (T.length) process.exitCode = 1;
`);
