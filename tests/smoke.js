// Prueba rápida: carga la app con un DOM simulado y pinta todas las pantallas.
// Uso: node tests/smoke.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..');
const vals = {};
const el = (k) => ({ innerHTML: '', textContent: '', get value() { return vals[k] ?? 'x'; }, set value(v) { vals[k] = v; }, style: {}, files: [], className: '', append() {}, remove() {} });
global.document = { querySelector: (k) => el(k), createElement: () => el('t'), body: { append() {} } };
global.prompt = () => 'Nombre nuevo'; global.confirm = () => true;
global.URL = { createObjectURL: () => 'blob:x' }; global.__v = vals;
const code = ['js/seed-data.js', 'js/app.js'].map((f) => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
vm.runInThisContext(code);
vm.runInThisContext(`
const T = [];
const t = (n, f) => { try { f(); } catch (e) { T.push(n + ': ' + e.message); } };
const ok = (c, m) => { if (!c) throw new Error(m); };
const V_ = __v;

mode = 'c';
for (const p of ['home', 'members', 'progs', 'forms', 'lib']) t('entrenador ' + p, () => { V = { p }; coach(); });
for (const ct of ['prog', 'ph', 'tpl', 'ex']) t('cositas ' + ct, () => { V = { p: 'lib', ct }; coach(); lst(); });
t('miembro', () => { V = { p: 'mem', mi: 0 }; coach(); });
t('programa', () => { V = { p: 'prog', pi: 0, phi: 0 }; coach(); });
for (const vw of ['week', 'load']) t('editor ' + vw, () => { V = { p: 'ed', pi: 0, phi: 0, w: 0, d: 0, vw }; coach(); });
t('formulario ejercicio', () => { libForm(-1); tgR(); libForm(8); tgR(); chT('p', 3); chT('e', 0); chT('t', 0); saveLib(-1); });
t('anadir ejercicio a sesion', () => { V = { p: 'ed', pi: 0, phi: 0, w: 0, d: 0, vw: 'week' }; const n = P().ph[0].s[0][0].blocks[0].ex.length; setEx(0, 0, -1, 0); ok(P().ph[0].s[0][0].blocks[0].ex.length === n + 1, 'no se anade'); coach(); exModal(0, 0, n); viewSes(0, 0); });

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
