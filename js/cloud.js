/* ---------- MODO SERVIDOR (Supabase) ----------
   Entrenador y atletas comparten datos reales: cuentas, miembros, programas, progreso, actividad y chat.
   Si falta la configuración o la librería, la web sigue en modo local (auth.js). */
(function () {
  if (typeof CLOUD_CFG === 'undefined' || typeof supabase === 'undefined') return;
  const sb = supabase.createClient(CLOUD_CFG.url, CLOUD_CFG.key);
  window.SB = sb;
  let UID = null, PROFILE = null, timer = 0, busy = false, again = false, rt = null;
  const pushed = { cd: '', m: {}, p: {}, pf: '', pr: {} };
  const PD = {};          // progreso del atleta por programa
  const PROGRESS = [];    // progreso de todos los atletas (vista entrenador)
  const put = (a, s) => { a.length = 0; a.push(...(s || [])); };
  const J = (x) => JSON.stringify(x);
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = Math.random() * 16 | 0; return (c == 'x' ? r : (r & 3 | 8)).toString(16); }));
  const vurl = (u) => (typeof u == 'string' && u.startsWith('vid:') ? CLOUD_CFG.url + '/storage/v1/object/public/videos/' + encodeURIComponent(u.slice(4)) : u);
  const clean = (x) => ({ ...x, v: typeof x.v == 'string' && x.v.startsWith('blob') ? '' : x.v });
  const ES = { 'Invalid login credentials': 'Email o contraseña incorrectos', 'User already registered': 'Ese email ya tiene cuenta. Inicia sesión.', 'Email not confirmed': 'Falta confirmar el email', 'Password should be at least 6 characters.': 'La contraseña es demasiado corta' };
  const tr = (m) => ES[m] || m;
  const ck = (r) => { if (r && r.error) throw r.error; return r; };
  const typing = () => { const a = document.activeElement; return !!a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName); };

  /* ---------- carga ---------- */
  const mapMem = (r) => ({ n: r.name, e: r.email, l: r.last_seen, st: r.status, _id: r.id });
  const mapCom = (r) => ({ n: r.author_name, t: r.data.t || '', x: r.data.x || '', f: r.data.f || '', _id: r.id, aid: r.athlete_id });
  const mapAct = (r) => ({ n: r.athlete_name, ...r.data, _id: r.id });
  const mapProg = (r) => ({ ...r.data, _id: r.id, as: r.data.as || [] });

  async function pullMembers() {
    const [m, pr] = await Promise.all([sb.from('members').select('*').order('created_at', { ascending: false }), sb.from('profiles').select('id,email').eq('role', 'athlete')]);
    ck(m); ck(pr);
    const aid = {}; (pr.data || []).forEach((x) => { aid[x.email] = x.id; });
    put(MEM, m.data.map((r) => ({ ...mapMem(r), aid: aid[r.email] })));
    pushed.m = {}; MEM.forEach((x) => { pushed.m[x._id] = J(rowM(x)); });
  }
  async function pullPrograms() {
    const r = ck(await sb.from('programs').select('*'));
    const list = r.data.map(mapProg).sort((a, b) => (b.ts || 0) - (a.ts || 0));
    put(PROG, list);
    pushed.p = {}; PROG.forEach((x) => { pushed.p[x._id] = J(rowP(x)); });
  }
  async function pullFeed() {
    const [a, c] = await Promise.all([sb.from('activity').select('*').order('created_at', { ascending: false }).limit(40), sb.from('comments').select('*').order('created_at', { ascending: false }).limit(300)]);
    ck(a); ck(c);
    put(ACT, a.data.map(mapAct)); put(COM, c.data.map(mapCom));
  }
  async function pullProgress() {
    const r = ck(await sb.from('progress').select('*'));
    if (PROFILE.role === 'athlete') {
      Object.keys(PD).forEach((k) => delete PD[k]);
      r.data.forEach((x) => { PD[x.program_id] = { done: x.done || {}, tick: x.tick || {} }; pushed.pr[x.program_id] = J(PD[x.program_id]); });
      bindProgress();
    } else put(PROGRESS, r.data);
  }
  function bindProgress() {
    const ap = AP();
    if (ap && ap._id) { PD[ap._id] = PD[ap._id] || { done: {}, tick: {} }; A.done = PD[ap._id].done; A.tick = PD[ap._id].tick; }
  }
  async function load(user) {
    UID = user.id;
    const p = ck(await sb.from('profiles').select('*').eq('id', UID).single()).data;
    PROFILE = p; ME = p.email;
    const U = {}; U[ME] = { role: p.role === 'athlete' ? 'a' : 'c', name: p.name, email: p.email }; LS.s('solo.users', U); LS.s('solo.session', ME);
    setAll(null);
    Object.keys(PF).forEach((k) => delete PF[k]); Object.assign(PF, PF0, p.extra || {}, { n: p.name, e: p.email });
    pushed.pf = J({ n: PF.n, x: extraOf() });
    const coachId = p.role === 'coach' ? UID : p.coach_id;
    let cd = null;
    if (coachId) cd = (await sb.from('coach_data').select('*').eq('coach_id', coachId).maybeSingle()).data;
    if (p.role === 'coach' && !cd) {
      cd = { lib: SEED_LIB.map((x) => ({ ...x })), tags: TAGS0, tpl: [], forms: FORMS0 };
      ck(await sb.from('coach_data').insert({ coach_id: UID, ...cd }));
    }
    if (cd) {
      put(LIB, (cd.lib || []).map((x) => ({ ...x, v: vurl(x.v), t: x.t || [] })));
      put(TAGS, cd.tags && cd.tags.length ? cd.tags : TAGS0); put(TPL, cd.tpl); put(FORMS, cd.forms && cd.forms.length ? cd.forms : FORMS0);
      pushed.cd = J(cdOf());
    }
    if (p.role === 'coach') await pullMembers();
    await pullPrograms(); await pullFeed(); await pullProgress();
    mode = p.role === 'athlete' ? 'a' : 'c'; V = { p: 'home' };
    subscribe();
  }
  const extraOf = () => ({ a: PF.a || '', h: PF.h || '', w: PF.w || '', f: PF.f || '' });
  const cdOf = () => ({ lib: LIB.map(clean), tags: TAGS, tpl: TPL, forms: FORMS });

  /* ---------- guardado (con retardo) ---------- */
  const rowM = (m) => ({ id: m._id, coach_id: UID, name: m.n, email: String(m.e).trim().toLowerCase(), status: m.st, last_seen: m.l });
  const emailOf = (n) => { const m = MEM.find((x) => x.n == n); return m ? String(m.e).trim().toLowerCase() : null; };
  const rowP = (p) => { const { _id, ...d } = p; return { id: _id, coach_id: UID, data: d, assigned_emails: (p.as || []).map(emailOf).filter(Boolean) }; };

  window.save = function () { if (!UID) return; clearTimeout(timer); timer = setTimeout(push, 700); };
  async function push() {
    if (!UID) return;
    if (busy) { again = true; return; }
    busy = true;
    try {
      if (PROFILE.role === 'coach') {
        const cd = cdOf(), j = J(cd);
        if (j !== pushed.cd) { ck(await sb.from('coach_data').upsert({ coach_id: UID, ...cd, updated_at: new Date().toISOString() })); pushed.cd = j; }
        MEM.forEach((m) => { if (!m._id) m._id = uuid(); });
        const newM = [], chM = [];
        MEM.forEach((m) => { const row = rowM(m), j2 = J(row); if (pushed.m[m._id] === undefined) newM.push(row); else if (pushed.m[m._id] !== j2) chM.push(row); pushed.m[m._id] = j2; });
        const goneM = Object.keys(pushed.m).filter((id) => !MEM.some((m) => m._id == id));
        if (newM.length || chM.length) ck(await sb.from('members').upsert([...newM, ...chM]));
        for (const row of newM) await sb.rpc('link_member', { p_email: row.email });
        if (goneM.length) { ck(await sb.from('members').delete().in('id', goneM)); goneM.forEach((id) => delete pushed.m[id]); }
        PROG.forEach((p) => { if (!p._id) { p._id = uuid(); p.ts = p.ts || Date.now(); } p.ts = p.ts || Date.now(); });
        const chP = [];
        PROG.forEach((p) => { const row = rowP(p), j2 = J(row); if (pushed.p[p._id] !== j2) { chP.push({ ...row, updated_at: new Date().toISOString() }); pushed.p[p._id] = j2; } });
        const goneP = Object.keys(pushed.p).filter((id) => !PROG.some((p) => p._id == id));
        if (chP.length) ck(await sb.from('programs').upsert(chP));
        if (goneP.length) { ck(await sb.from('programs').delete().in('id', goneP)); goneP.forEach((id) => delete pushed.p[id]); }
        const pf = J({ n: PF.n, x: extraOf() });
        if (pf !== pushed.pf) { ck(await sb.from('profiles').update({ name: PF.n, extra: extraOf() }).eq('id', UID)); pushed.pf = pf; }
      } else {
        const pf = J({ n: PF.n, x: extraOf() });
        if (pf !== pushed.pf) { ck(await sb.from('profiles').update({ name: PF.n, extra: extraOf() }).eq('id', UID)); pushed.pf = pf; }
        for (const id of Object.keys(PD)) {
          const j2 = J(PD[id]);
          if (pushed.pr[id] !== j2) { ck(await sb.from('progress').upsert({ athlete_id: UID, program_id: id, done: PD[id].done, tick: PD[id].tick, updated_at: new Date().toISOString() })); pushed.pr[id] = j2; }
        }
      }
    } catch (e) { say('No se pudo guardar en el servidor: ' + (e.message || e)); }
    busy = false;
    if (again) { again = false; push(); }
  }
  window.addEventListener('beforeunload', () => { if (UID && timer) push(); });

  /* ---------- tiempo real ---------- */
  const deb = {};
  function later(k, fn) { clearTimeout(deb[k]); deb[k] = setTimeout(async () => { try { await fn(); if (UID && !typing()) render(); } catch (e) { /* sin conexión: se reintentará con el siguiente evento */ } }, 400); }
  function subscribe() {
    if (rt) sb.removeChannel(rt);
    rt = sb.channel('solo-' + UID)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => later('f', pullFeed))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity' }, () => later('f', pullFeed))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'progress' }, () => later('pr', pullProgress));
    if (PROFILE.role === 'athlete') rt.on('postgres_changes', { event: '*', schema: 'public', table: 'programs' }, () => later('p', async () => { await pullPrograms(); bindProgress(); }));
    else rt.on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => later('m', mergeMembers));
    rt.subscribe();
  }
  async function mergeMembers() {
    const [m, pr] = await Promise.all([sb.from('members').select('*'), sb.from('profiles').select('id,email').eq('role', 'athlete')]);
    ck(m); ck(pr);
    const aid = {}; (pr.data || []).forEach((x) => { aid[x.email] = x.id; });
    m.data.forEach((r) => { const l = MEM.find((x) => x._id == r.id); if (l) { l.st = r.status; l.aid = aid[r.email]; pushed.m[r.id] = J(rowM(l)); } else { const n = { ...mapMem(r), aid: aid[r.email] }; MEM.push(n); pushed.m[r.id] = J(rowM(n)); } });
  }

  /* ---------- cuentas ---------- */
  window.emailTaken = () => false;
  window.doLogin = async function () {
    const e = uk($('#l_e').value), pw = $('#l_p').value;
    const { data, error } = await sb.auth.signInWithPassword({ email: e, password: pw });
    if (error) return ($('#rerr').textContent = tr(error.message));
    try { await load(data.user); render(); } catch (x) { $('#rerr').textContent = 'No se pudo cargar tu cuenta: ' + (x.message || x); }
  };
  window.mkAcct = async function (role) {
    const d = R.d;
    const { data, error } = await sb.auth.signUp({ email: uk(d.email), password: d.pass, options: { data: { name: d.name, role: role == 'a' ? 'athlete' : 'coach', extra: { h: d.h || '', w: d.w || '' } } } });
    if (error) { say(tr(error.message)); R.st = role == 'a' ? 2 : 1; render(); return false; }
    if (!data.session) { say('Revisa tu email para confirmar la cuenta y luego inicia sesión'); AV = 'login'; render(); return false; }
    await load(data.user);
    if (role == 'a') setMode('a'); else { mode = 'r'; render(); }
    return true;
  };
  window.sendC = async function () {
    const e = chk([['name', 'nombre'], ['email', 'email'], ['pass', 'contraseña'], ['club', 'club o centro'], ['sport', 'deporte']]);
    if (e) return ($('#rerr').textContent = e);
    const ok = await mkAcct('c');
    if (ok !== false) { R.st = 2; render(); }
  };
  window.logout = async function () {
    clearTimeout(timer); if (UID) { try { await push(); } catch (e) { /* ignorar */ } }
    if (rt) { sb.removeChannel(rt); rt = null; }
    await sb.auth.signOut(); UID = null; PROFILE = null; ME = null; LS.d('solo.session'); setAll(null); AV = 'login'; render();
  };

  /* ---------- acciones con datos compartidos ---------- */
  window.doneOf = (m, p) => {
    if (PROFILE && PROFILE.role === 'athlete') return p == AP() ? Object.keys(A.done).length : 0;
    const x = PROGRESS.find((r) => r.program_id == p._id && r.athlete_id == m.aid);
    return x ? Object.keys(x.done || {}).length : 0;
  };
  const _fin = window.fin;
  window.fin = function () {
    if (!PROFILE || PROFILE.role !== 'athlete') return _fin();
    _fin();
    const a = ACT[0];
    if (a && PROFILE.coach_id) { const { n, _id, ...data } = a; sb.from('activity').insert({ coach_id: PROFILE.coach_id, athlete_id: UID, athlete_name: PF.n || 'Atleta', data }).then((r) => { if (r.error) say('No se pudo avisar a tu entrenador: ' + r.error.message); }); }
    save();
  };
  const _sendCm = window.sendCm;
  window.sendCm = function (x) {
    if (!PROFILE || PROFILE.role !== 'athlete') return _sendCm(x);
    if (!PROFILE.coach_id) return say('Aún no tienes entrenador: pídele que te añada como miembro con tu email');
    const n = COM.length; _sendCm(x);
    if (COM.length > n) { const c = COM[0]; sb.from('comments').insert({ coach_id: PROFILE.coach_id, athlete_id: UID, author_id: UID, author_name: PF.n || 'Atleta', data: { t: c.t, x: c.x, f: c.f } }).then((r) => { if (r.error) say('No se pudo enviar: ' + r.error.message); }); }
  };
  window.replyCm = async function () {
    const m = MEM[V.mi], t = ($('#cr') || {}).value;
    if (!m || !m.aid) return say('Este miembro aún no se ha registrado');
    if (!t || !t.trim()) return say('Escribe un mensaje');
    const r = await sb.from('comments').insert({ coach_id: UID, athlete_id: m.aid, author_id: UID, author_name: PF.n || 'Entrenador', data: { t: t.trim() } });
    if (r.error) return say('No se pudo enviar: ' + r.error.message);
    COM.unshift({ n: PF.n || 'Entrenador', t: t.trim(), aid: m.aid }); say('Mensaje enviado'); render();
  };

  /* ---------- vídeos subidos desde el ordenador ---------- */
  function makeThumb(f) {
    return new Promise((res) => {
      const v = document.createElement('video'), u = URL.createObjectURL(f);
      const done = (b) => { URL.revokeObjectURL(u); res(b); };
      v.muted = true; v.preload = 'metadata'; v.playsInline = true; v.src = u;
      v.onerror = () => done(null);
      v.onloadedmetadata = () => { v.currentTime = Math.min(0.6, (v.duration || 1) / 2); };
      v.onseeked = () => { try { const w = 192, h = Math.round(w * v.videoHeight / v.videoWidth) || 108, c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(v, 0, 0, w, h); c.toBlob((x) => done(x), 'image/jpeg', 0.7); } catch (e) { done(null); } };
      setTimeout(() => done(null), 15000);
    });
  }
  window.upBlob = function (f) {
    const u = URL.createObjectURL(f), k = UID + '/' + Date.now() + '-' + f.name.normalize('NFD').replace(/[^\w.-]+/g, '-');
    sb.storage.from('videos').upload(k, f, { contentType: f.type || 'video/mp4' }).then((r) => {
      if (r.error) return say('No se pudo subir el vídeo: ' + r.error.message);
      const pub = sb.storage.from('videos').getPublicUrl(k).data.publicUrl;
      LIB.forEach((x) => { if (x.v === u) x.v = pub; });
      say('Vídeo subido'); save(); if (!typing()) render();
      makeThumb(f).then((t) => { if (t) sb.storage.from('videos').upload('thumbs/' + k.replace(/\.[^.]+$/, '.jpg'), t, { contentType: 'image/jpeg', upsert: true }).then(() => { if (!typing()) render(); }); });
    });
    return u;
  };

  /* ---------- arranque ---------- */
  (async () => {
    try {
      const { data } = await sb.auth.getSession();
      if (data.session) await load(data.session.user); else { ME = null; AV = 'login'; }
    } catch (e) { ME = null; AV = 'login'; }
    render();
  })();
})();
