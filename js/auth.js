/* ---------- CUENTAS Y MEMORIA ----------
   Cada email (Gmail u otro) tiene su cuenta y sus datos guardados en este navegador (localStorage).
   Los vídeos subidos desde el ordenador se guardan en IndexedDB.
   Es la versión de prueba para un entorno controlado: sin servidor, los datos no viajan entre dispositivos. */
const LS={g:(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},s:(k,v)=>{try{localStorage.setItem(k,v===undefined?'':JSON.stringify(v));return true}catch(e){return false}},d:k=>{try{localStorage.removeItem(k)}catch(e){}}};
const hs=s=>{let a=0xdeadbeef,b=0x41c6ce57;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);a=Math.imul(a^c,2654435761);b=Math.imul(b^c,1597334677)}a=Math.imul(a^a>>>16,2246822507)^Math.imul(b^b>>>13,3266489909);b=Math.imul(b^b>>>16,2246822507)^Math.imul(a^a>>>13,3266489909);return(4294967296*(2097151&b)+(a>>>0)).toString(36)};
const uk=e=>String(e||'').trim().toLowerCase();
function emailTaken(e){return !!LS.g('solo.users',{})[uk(e)]}
const TAGS0=[...TAGS],FORMS0=JSON.parse(JSON.stringify(FORMS)),PF0={n:'',e:'',a:'',h:'',w:'',f:''};
let ME=LS.g('solo.session',null),AV='login',warned=0;
const BM={};let IDBP=null;
const idb=()=>IDBP||(IDBP=new Promise((ok,no)=>{try{const q=indexedDB.open('solo',1);q.onupgradeneeded=()=>q.result.createObjectStore('v');q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error)}catch(e){no(e)}}));
function upBlob(f){const u=URL.createObjectURL(f),k=(ME||'x')+'/'+Date.now()+'-'+Math.random().toString(36).slice(2,7);BM[u]=k;idb().then(d=>d.transaction('v','readwrite').objectStore('v').put(f,k)).catch(()=>{});return u}
function restoreBlobs(){LIB.forEach(x=>{if(typeof x.v=='string'&&x.v.startsWith('idb:')){const k=x.v.slice(4);x.v='';idb().then(d=>new Promise((ok,no)=>{const r=d.transaction('v').objectStore('v').get(k);r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})).then(f=>{if(f){const u=URL.createObjectURL(f);BM[u]=k;x.v=u;render()}}).catch(()=>{})}})}
const snap=()=>({PROG,MEM,LIB,TAGS,TPL,FORMS,ACT,COM,PF,done:A.done,tick:A.tick});
function save(){if(!ME)return;let j;try{j=JSON.stringify(snap(),(k,v)=>typeof v=='string'&&BM[v]?'idb:'+BM[v]:v)}catch(e){return}try{localStorage.setItem('solo.data.'+ME,j)}catch(e){if(!warned){warned=1;say('Memoria del navegador llena: quita imágenes grandes')}}}
function setAll(d){d=d||{};const put=(a,s)=>{a.length=0;a.push(...(s||[]))};
put(PROG,d.PROG);put(MEM,d.MEM);put(LIB,d.LIB||SEED_LIB.map(x=>({...x})));put(TAGS,d.TAGS||TAGS0);put(TPL,d.TPL);put(FORMS,d.FORMS||JSON.parse(JSON.stringify(FORMS0)));put(ACT,d.ACT);put(COM,d.COM);
LIB.forEach(x=>x.t=x.t||[]);Object.keys(PF).forEach(k=>delete PF[k]);Object.assign(PF,PF0,d.PF||{});A.done=d.done||{};A.tick=d.tick||{};A.s='home';A.t='hoy';A.ses=0;A.ex=0;V={p:'home'};restoreBlobs()}
function enter(e){ME=e;LS.s('solo.session',e);const u=LS.g('solo.users',{})[e];setAll(LS.g('solo.data.'+e,null));if(!PF.n)PF.n=u.name;if(!PF.e)PF.e=u.email;mode=u.role=='a'?'a':'c'}
function mkAcct(role){const d=R.d,e=uk(d.email),U=LS.g('solo.users',{});if(U[e])return;
U[e]={name:d.name,email:e,h:hs(e+'|'+d.pass),role,club:d.club||'',sport:d.sport||'',alta:Date.now()};LS.s('solo.users',U);
LS.s('solo.data.'+e,{PF:{...PF0,n:d.name,e:d.email,h:d.h||'',w:d.w||''}});enter(e);if(role=='c')mode='r';else setMode('a')}
function doLogin(){const e=uk($('#l_e').value),u=LS.g('solo.users',{})[e];if(!u||u.h!=hs(e+'|'+$('#l_p').value))return $('#rerr').textContent='Email o contraseña incorrectos';enter(e);render()}
function logout(){save();ME=null;LS.d('solo.session');setAll(null);AV='login';render()}
function loginView(){return`<div class="rg"><div class="rc"><h2 style="text-align:center;margin:0 0 6px">Inicia sesión</h2><p class="mu" style="text-align:center;margin:0 0 16px">Entra con tu email y recuperarás tus programas, miembros y ejercicios.</p><div class="f"><label>Email<input id="l_e" type="email" autocomplete="email" placeholder="tu@gmail.com"></label><label>Contraseña<input id="l_p" type="password" autocomplete="current-password" onkeydown="if(event.key=='Enter')doLogin()"></label><div class="err" id="rerr"></div><button class="btn" style="padding:11px" onclick="doLogin()">Entrar</button><p class="mu" style="text-align:center;margin:4px 0 0">¿No tienes cuenta? <span class="lk" onclick="AV='reg';R={role:'c',st:1,d:{}};render()">Crear cuenta</span></p></div></div></div>`}
const _render=render;
render=function(){const sw=$('.sw');if(sw)sw.style.display=ME?'':'none';
if(!ME){$('#app').innerHTML=AV=='boot'?'<p class="mu" style="text-align:center;margin-top:80px">Cargando…</p>':AV=='reg'?`<p class="mu" style="text-align:center;margin:14px 0 0"><span class="lk" onclick="AV='login';render()">‹ Volver a iniciar sesión</span></p>`+reg():loginView();return}
const u=LS.g('solo.users',{})[ME];if(u&&u.role=='a'&&mode!='a')mode='a';
const bc=$('#bc');if(bc)bc.style.display=u&&u.role=='a'?'none':'';const br=$('#br');if(br)br.textContent='Salir · '+ME;
save();_render()};
if(typeof addEventListener=='function'){addEventListener('input',()=>{clearTimeout(render.t);render.t=setTimeout(save,400)});addEventListener('beforeunload',save)}
if(typeof CLOUD_CFG!='undefined'&&typeof supabase!='undefined'){ME=null;AV='boot';render()}
else{if(ME&&!LS.g('solo.users',{})[ME])ME=null;
if(ME)enter(ME);
render()}
