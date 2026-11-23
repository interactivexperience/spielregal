'use strict';
if(window.top!==window.self){document.documentElement.textContent='';throw new Error('framed')}
/* Kinder-Journal – alles lokal, alles verschlüsselt (AES-256-GCM), keine Netzwerkzugriffe.
   Aufbau: Helfer · Krypto · Datenbank · Zustand · Tor (Einrichtung/Sperre) · Editor · Ansichten · ZIP · Backup · Aktionen */

/* ============ Helfer ============ */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LS={get(k,d){try{const v=localStorage.getItem('kj:'+k);return v==null?d:JSON.parse(v)}catch{return d}},set(k,v){try{localStorage.setItem('kj:'+k,JSON.stringify(v))}catch{}},del(k){try{localStorage.removeItem('kj:'+k)}catch{}}};
const WD=['So','Mo','Di','Mi','Do','Fr','Sa'],WDL=['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
const MON=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parseD=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const today=()=>ymd(new Date());
const DATE_RE=/^\d{4}-\d{2}-\d{2}$/,ID_RE=/^[\w-]{8,64}$/;
const uid=()=>crypto.randomUUID();
const fmtSize=b=>b<1024?b+' B':b<1048576?(b/1024).toFixed(0)+' KB':b<1073741824?(b/1048576).toFixed(1)+' MB':(b/1073741824).toFixed(2)+' GB';
const fmtNum=v=>Number(v).toLocaleString('de-DE',{maximumFractionDigits:1});
const RM=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function dismiss(el,ms=340){if(!el||!el.isConnected)return;if(RM()){el.remove();return}el.classList.add('out');setTimeout(()=>el.remove(),ms)}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const b64e=u8=>{let s='';u8.forEach(b=>s+=String.fromCharCode(b));return btoa(s)};
const b64d=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const extOf=m=>m.type==='video'?'mp4':'jpg';
const cmpDesc=(a,b)=>a.date<b.date?1:a.date>b.date?-1:(b.created||0)-(a.created||0);
const TAGS_DEFAULT=['Erstes Mal','Sprache','Laufen','Essen','Schlaf','Gesundheit','Arzt','Lustiges','Ausflug','Familie','Kita','Schule'];
const METRICS=[['h','Größe','cm',20,250],['w','Gewicht','kg',.5,200],['hd','Kopfumfang','cm',20,70]];
function ageAt(birth,date){
 const b=parseD(birth),d=parseD(date);if(d<b)return 'vor der Geburt';
 const days=Math.round((d-b)/864e5);
 if(days<14)return days===0?'Geburtstag':days===1?'1 Tag':days+' Tage';
 if(days<84)return Math.floor(days/7)+' Wochen';
 let m=(d.getFullYear()-b.getFullYear())*12+d.getMonth()-b.getMonth();if(d.getDate()<b.getDate())m--;
 if(m<24)return m===1?'1 Monat':m+' Monate';
 const y=Math.floor(m/12),r=m%12;return r?`${y} J. ${r} M.`:`${y} Jahre`}
const ageMonths=(birth,date)=>(parseD(date)-parseD(birth))/864e5/30.4375;

/* ============ Krypto ============ */
const enc=new TextEncoder(),dec=new TextDecoder(),CH=1<<20,ITER=600000;
const VAULT={key:null,meta:null};
const rand=n=>crypto.getRandomValues(new Uint8Array(n));
const aad=(s,id,x='')=>enc.encode(`kj1|${s}|${id}|${x}`);
async function deriveKEK(pass,salt,iter){
 const k=await crypto.subtle.importKey('raw',enc.encode(pass.normalize('NFKC')),'PBKDF2',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:iter,hash:'SHA-256'},k,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function wrapDEK(pass,rawDek){
 const salt=rand(16),iv=rand(12),kek=await deriveKEK(pass,salt,ITER);
 const w=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:enc.encode('kj1|vault')},kek,rawDek);
 return{id:'main',v:1,kdf:'PBKDF2-SHA256',iter:ITER,salt:b64e(salt),iv:b64e(iv),wrapped:b64e(new Uint8Array(w))}}
async function unwrapRaw(pass,meta){
 const kek=await deriveKEK(pass,b64d(meta.salt),meta.iter);
 return crypto.subtle.decrypt({name:'AES-GCM',iv:b64d(meta.iv),additionalData:enc.encode('kj1|vault')},kek,b64d(meta.wrapped))}
const importDEK=raw=>crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['encrypt','decrypt']);
async function vaultCreate(pass){
 const raw=crypto.getRandomValues(new Uint8Array(32)),meta=await wrapDEK(pass,raw);
 await dbPut('vault',meta);VAULT.key=await importDEK(raw);VAULT.meta=meta;raw.fill(0)}
async function vaultOpen(pass,meta){const raw=await unwrapRaw(pass,meta);const k=await importDEK(raw);new Uint8Array(raw).fill(0);return k}
async function sealJSON(store,obj,key=VAULT.key){
 const iv=rand(12);const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad(store,obj.id)},key,enc.encode(JSON.stringify(obj)));
 return{id:obj.id,iv,ct}}
async function openJSON(store,rec,key=VAULT.key){
 const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:rec.iv,additionalData:aad(store,rec.id)},key,rec.ct);
 return JSON.parse(dec.decode(pt))}
/* Medien: in 1-MiB-Blöcken, jeder Block mit eigener IV; Blocknummer und -anzahl sind authentifiziert (kein Umsortieren/Abschneiden) */
async function sealBlob(store,id,blob,key=VAULT.key){
 const parts=[],total=Math.max(1,Math.ceil(blob.size/CH));
 for(let i=0;i<total;i++){
  const pt=await blob.slice(i*CH,(i+1)*CH).arrayBuffer(),iv=rand(12);
  const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad(store,id,i+'/'+total)},key,pt);
  const hd=new DataView(new ArrayBuffer(4));hd.setUint32(0,ct.byteLength);parts.push(hd.buffer,iv,ct)}
 return new Blob(parts)}
async function openBlob(store,id,blob,mime,key=VAULT.key){
 const frames=[];let off=0;
 while(off<blob.size){const l=new DataView(await blob.slice(off,off+4).arrayBuffer()).getUint32(0);if(l<16||off+16+l>blob.size)throw new Error('Datei beschädigt');frames.push([off+16,l]);off+=16+l}
 const out=[];
 for(let i=0;i<frames.length;i++){const[o,l]=frames[i];
  const buf=await blob.slice(o-12,o+l).arrayBuffer();
  out.push(await crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(buf,0,12),additionalData:aad(store,id,i+'/'+frames.length)},key,buf.slice(12)))}
 return new Blob(out,{type:mime})}
function validVault(v){
 try{return !!v&&v.v===1&&v.kdf==='PBKDF2-SHA256'&&Number.isInteger(v.iter)&&v.iter>=ITER&&v.iter<=5e6
  &&b64d(v.salt).length===16&&b64d(v.iv).length===12&&b64d(v.wrapped).length===48}catch{return false}}
function strength(p){
 const n=p.length,u=new Set(p).size,cls=[/[a-z]/,/[A-Z]/,/\d/,/[^A-Za-z0-9]/].filter(r=>r.test(p)).length;
 if(n<12||u<6)return 0;
 if(n>=20||(n>=14&&cls>=3)||(n>=16&&cls>=2))return 3;
 return n>=14||cls>=3?2:1}
function suggestPass(){const A='abcdefghijkmnpqrstuvwxyz23456789',r=rand(16);let s='';for(let i=0;i<16;i++){s+=A[r[i]&31];if(i%4===3&&i<15)s+='-'}return s}

/* ============ Datenbank (IndexedDB, alle Inhalte verschlüsselt) ============ */
let db;
const rq=r=>new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
const txd=(st,mode='readonly')=>db.transaction(st,mode);
const dbAll=s=>rq(txd(s).objectStore(s).getAll());
const dbGet=(s,k)=>rq(txd(s).objectStore(s).get(k));
const dbPut=async(s,v)=>{const t=txd(s,'readwrite');t.objectStore(s).put(v);await txDone(t)};
const txDone=t=>new Promise((res,rej)=>{t.oncomplete=res;t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error||new Error('abgebrochen'))});
const STORES=['vault','kids','entries','media','thumbs'];
function dbOpen(){return new Promise((res,rej)=>{const r=indexedDB.open('kinderjournal',1);
 r.onupgradeneeded=()=>{STORES.forEach(s=>r.result.createObjectStore(s,{keyPath:'id'}))};
 r.onsuccess=()=>{db=r.result;res()};r.onerror=()=>rej(r.error)})}
async function saveEntry(e,newMedia,removed){
 const rec=await sealJSON('entries',e),mrec=[];   // erst verschlüsseln, dann in EINER Transaktion schreiben
 for(const m of newMedia){mrec.push({m:{id:m.id,blob:await sealBlob('media',m.id,m.blob)},t:m.thumb?{id:m.id,blob:await sealBlob('thumbs',m.id,m.thumb)}:null})}
 const t=txd(['entries','media','thumbs'],'readwrite');
 t.objectStore('entries').put(rec);
 for(const x of mrec){t.objectStore('media').put(x.m);if(x.t)t.objectStore('thumbs').put(x.t)}
 for(const id of removed){t.objectStore('media').delete(id);t.objectStore('thumbs').delete(id)}
 await txDone(t)}
async function deleteEntry(e){const t=txd(['entries','media','thumbs'],'readwrite');t.objectStore('entries').delete(e.id);for(const m of e.media||[]){t.objectStore('media').delete(m.id);t.objectStore('thumbs').delete(m.id)}await txDone(t)}
async function saveKid(k){await dbPut('kids',await sealJSON('kids',k))}
async function dbClearAll(){const t=txd(STORES,'readwrite');STORES.forEach(s=>t.objectStore(s).clear());await txDone(t)}

/* ============ Zustand ============ */
const S={kids:[],entries:[],tab:'list',q:'',tag:'',kid:'',mil:false,gk:'',cal:(()=>{const n=new Date();return{y:n.getFullYear(),m:n.getMonth()}})(),day:today()};
const kidById=id=>S.kids.find(k=>k.id===id);
const thumbCache=new Map();
async function thumbURL(id){
 if(thumbCache.has(id))return thumbCache.get(id);
 let u=null;try{const r=await dbGet('thumbs',id);if(r&&VAULT.key)u=URL.createObjectURL(await openBlob('thumbs',id,r.blob,'image/jpeg'))}catch{}
 thumbCache.set(id,u);return u}
function freeThumbs(){thumbCache.forEach(u=>u&&URL.revokeObjectURL(u));thumbCache.clear()}
async function hydrate(root=document){for(const img of $$('img[data-th]',root)){const u=await thumbURL(img.dataset.th);if(u)img.src=u;else img.remove()}}
function cleanKid(o){if(!o||!ID_RE.test(o.id))return null;const c=Math.min(6,Math.max(1,parseInt(o.c)||1));return{id:o.id,name:String(o.name||'').slice(0,60),birth:DATE_RE.test(o.birth)?o.birth:today(),c,order:+o.order||0}}
function cleanEntry(o){
 if(!o||!ID_RE.test(o.id))return null;
 const num=(v,lo,hi)=>{v=parseFloat(v);return isFinite(v)&&v>=lo&&v<=hi?v:null};
 return{id:o.id,date:DATE_RE.test(o.date)?o.date:today(),created:+o.created||Date.now(),updated:+o.updated||Date.now(),
  kids:(Array.isArray(o.kids)?o.kids:[]).filter(x=>typeof x==='string'&&ID_RE.test(x)),ms:!!o.ms,text:String(o.text||''),
  tags:(Array.isArray(o.tags)?o.tags:[]).map(t=>String(t).slice(0,40)).slice(0,30),
  h:num(o.h,20,250),w:num(o.w,.5,200),hd:num(o.hd,20,70),
  media:(Array.isArray(o.media)?o.media:[]).filter(m=>m&&ID_RE.test(m.id)).map(m=>({id:m.id,type:m.type==='video'?'video':'image',mime:String(m.mime||'').slice(0,60),name:String(m.name||'').slice(0,120),size:+m.size||0}))}}
async function loadAll(){
 let bad=0;const dec1=async(s,r,cl)=>{try{const o=await openJSON(s,r);if(o.id!==r.id)throw 0;const v=cl(o);if(!v)throw 0;return v}catch{bad++;return null}};
 S.kids=(await Promise.all((await dbAll('kids')).map(r=>dec1('kids',r,cleanKid)))).filter(Boolean).sort((a,b)=>a.order-b.order);
 S.entries=(await Promise.all((await dbAll('entries')).map(r=>dec1('entries',r,cleanEntry)))).filter(Boolean).sort(cmpDesc);
 if(bad)toast(`${bad} Datensatz/Datensätze nicht lesbar – Backup einspielen?`,5000)}

/* ============ UI-Bausteine ============ */
function toast(msg,ms=2200){$$('.toast').forEach(t=>t.remove());const t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.append(t);if(ms)setTimeout(()=>t.remove(),ms);return t}
function modal(html){const o=document.createElement('div');o.className='mo';o.innerHTML=`<div class="mb">${html}</div>`;o.addEventListener('click',e=>{if(e.target===o)dismiss(o)});document.body.append(o);return o}
function ask(title,text,okLabel='OK',danger=false){return new Promise(res=>{
 const o=modal(`<h3>${esc(title)}</h3><p>${esc(text)}</p><div class="bt"><button class="${danger?'x':'p'}" data-r="1">${esc(okLabel)}</button><button data-r="0">Abbrechen</button></div>`);
 o.addEventListener('click',e=>{const b=e.target.closest('[data-r]');if(b){dismiss(o);res(b.dataset.r==='1')}else if(e.target===o)res(false)})})}
function askPass(title,text){return new Promise(res=>{
 const o=modal(`<h3>${esc(title)}</h3><p>${esc(text)}</p><input class="inp" type="password" id="apw" autocomplete="current-password" autocapitalize="none"><div class="msg" id="amsg"></div><div class="bt"><button class="p" data-r="1">OK</button><button data-r="0">Abbrechen</button></div>`);
 const inp=$('#apw',o);setTimeout(()=>inp.focus(),50);
 const ok=()=>{const v=inp.value;if(!v)return;dismiss(o);res(v)};
 inp.addEventListener('keydown',e=>{if(e.key==='Enter')ok()});
 o.addEventListener('click',e=>{const b=e.target.closest('[data-r]');if(b){b.dataset.r==='1'?ok():(dismiss(o),res(null))}else if(e.target===o)res(null)})})}
async function checkPass(pass){try{await vaultOpen(pass,VAULT.meta);return true}catch{return false}}

/* ============ Tor: Einrichtung und Sperre ============ */
function gate(html){let g=$('.gate');if(!g){g=document.createElement('div');g.className='gate';document.body.append(g)}g.innerHTML=`<div class="gbox">${html}</div>`;document.body.dataset.s='gate';return g}
function showSetup(){
 const g=gate(`<h1><small>Privat · verschlüsselt · nur auf diesem Gerät</small>Kinder-Journal</h1>
 <p>Lege ein Passwort fest. Damit werden alle Einträge, Fotos und Videos verschlüsselt – auf dem iPhone und in jedem Backup.</p>
 <input class="inp" type="password" id="p1" placeholder="Passwort (mind. 12 Zeichen)" autocomplete="new-password" autocapitalize="none">
 <div class="meter"><i id="mt"></i></div>
 <input class="inp" type="password" id="p2" placeholder="Passwort wiederholen" autocomplete="new-password" autocapitalize="none">
 <button class="lnk" data-a="suggest">Sicheres Passwort vorschlagen</button>
 <div class="msg" id="gm"></div>
 <label class="chk"><input type="checkbox" id="ack"><span>Mir ist klar: Wer das Passwort vergisst, kommt nicht mehr an die Daten – auch nicht über ein Backup. Niemand kann es zurücksetzen.</span></label>
 <button class="pill" id="go" data-a="setup" disabled>Tresor anlegen</button>
 <button class="lnk" data-a="restore">Backup wiederherstellen …</button><input type="file" id="rsF" accept=".zip,application/zip" hidden>`);
 const upd=()=>{const s=strength($('#p1',g).value);$('#mt',g).className='l'+s;
  const ok=s>0&&$('#p1',g).value===$('#p2',g).value&&$('#ack',g).checked;$('#go',g).disabled=!ok;
  $('#gm',g).textContent=$('#p1',g).value&&s===0?'Zu kurz oder zu einfach – mindestens 12 Zeichen, nicht nur Wiederholungen.':($('#p2',g).value&&$('#p1',g).value!==$('#p2',g).value?'Die Passwörter stimmen nicht überein.':'')};
 ['p1','p2','ack'].forEach(i=>$('#'+i,g).addEventListener('input',upd));upd()}
function showLock(msg=''){
 const g=gate(`<h1><small>Gesperrt</small>Kinder-Journal</h1><p>Passwort eingeben, um zu entsperren.</p>
 <input class="inp" type="password" id="lp" placeholder="Passwort" autocomplete="current-password" autocapitalize="none">
 <div class="msg" id="gm">${esc(msg)}</div><button class="pill" data-a="unlock">Entsperren</button>`);
 const inp=$('#lp',g);inp.addEventListener('keydown',e=>{if(e.key==='Enter')A.unlock()});setTimeout(()=>inp.focus(),80)}
function wipeScreen(){E=null;document.body.style.overflow='';$('#app').innerHTML='';$$('.sheet,.dim,.mo,.lb,.toast').forEach(x=>x.remove());freeThumbs();S.kids=[];S.entries=[]}
function lockNow(){if(!VAULT.key)return;VAULT.key=null;wipeScreen();showLock()}
let hiddenAt=0;
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){hiddenAt=Date.now();document.body.classList.add('veil')}
 else{document.body.classList.remove('veil');if(VAULT.key&&Date.now()-hiddenAt>=LS.get('grace',60)*1000)lockNow()}});
window.addEventListener('pagehide',()=>document.body.classList.add('veil'));
window.addEventListener('pageshow',()=>{if(!document.hidden)document.body.classList.remove('veil')});

/* ============ Medien ============ */
const toBlob=(c,t,q)=>new Promise(r=>c.toBlob(r,t,q));
function loadImg(file){return new Promise((res,rej)=>{const u=URL.createObjectURL(file),i=new Image();i.onload=()=>{URL.revokeObjectURL(u);res(i)};i.onerror=()=>{URL.revokeObjectURL(u);rej(new Error('Bild nicht lesbar'))};i.src=u})}
async function scaled(src,w,h,max,type,q){const sc=Math.min(1,max/Math.max(w,h)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*sc));c.height=Math.max(1,Math.round(h*sc));c.getContext('2d').drawImage(src,0,0,c.width,c.height);return toBlob(c,type,q)}
async function processImage(file){
 try{const i=await loadImg(file),w=i.naturalWidth,h=i.naturalHeight;
  const blob=await scaled(i,w,h,2400,'image/jpeg',.87),thumb=await scaled(i,w,h,960,'image/jpeg',.8);
  return{blob:blob||file,thumb,mime:blob?'image/jpeg':file.type}}
 catch{return{blob:file,thumb:null,mime:file.type||'image/jpeg'}}}
function videoThumb(file){return new Promise(res=>{
 const v=document.createElement('video');v.muted=true;v.playsInline=true;v.preload='auto';const u=URL.createObjectURL(file);let fin=false;
 const end=b=>{if(fin)return;fin=true;URL.revokeObjectURL(u);res(b)};
 v.onloadeddata=()=>{try{v.currentTime=Math.min(.5,(v.duration||1)/2)}catch{end(null)}};
 v.onseeked=async()=>{try{end(await scaled(v,v.videoWidth,v.videoHeight,960,'image/jpeg',.8))}catch{end(null)}};
 v.onerror=()=>end(null);setTimeout(()=>end(null),7000);v.src=u})}
async function processVideo(file){return{blob:file,thumb:await videoThumb(file),mime:file.type||'video/mp4'}}

/* ============ Editor ============ */
let E=null;
const normTag=t=>t.trim().replace(/^#+/,'').replace(/\s+/g,' ').slice(0,40);
function allTags(){const m=new Map();for(const e of S.entries)for(const t of e.tags||[]){const k=t.toLowerCase(),o=m.get(k)||{t,n:0};o.n++;m.set(k,o)}return[...m.values()].sort((a,b)=>b.n-a.n||a.t.localeCompare(b.t))}
function openEditor(entry,date){
 const defKids=S.kid?[S.kid]:S.kids.length===1?[S.kids[0].id]:[];
 E=entry?{id:entry.id,created:entry.created,isNew:false,date:entry.date,kids:[...entry.kids],ms:entry.ms,text:entry.text,tags:[...entry.tags],h:entry.h,w:entry.w,hd:entry.hd,media:entry.media.map(m=>({...m})),removed:[],dirty:false}
  :{id:uid(),created:Date.now(),isNew:true,date:date||today(),kids:defKids,ms:false,text:'',tags:[],h:null,w:null,hd:null,media:[],removed:[],dirty:false};
 const dim=document.createElement('div');dim.className='dim';dim.id='dim';document.body.append(dim);
 const o=document.createElement('div');o.className='sheet';o.id='ed';
 o.innerHTML=`<div class="bar"><button class="lnk" data-a="edcancel">Abbrechen</button><b>${E.isNew?'Neuer Eintrag':'Eintrag'}</b><button class="pill" data-a="edsave">Fertig</button></div>
 <div class="edin"><div class="row"><input type="date" id="edDate" value="${E.date}"><button class="mst" id="edMs" data-a="ms"></button></div>
 <div class="chips" id="edKids"></div>
 <textarea id="edText" placeholder="Was ist heute passiert?" enterkeyhint="enter"></textarea>
 <div class="tagbox"><div class="tg" id="edTags"></div><input id="edTagIn" placeholder="Tag hinzufügen …" enterkeyhint="done" autocapitalize="none" autocomplete="off"><div id="edSug"></div></div>
 <div class="meas" id="edMeas"></div>
 <div class="media"><div id="edMedia"></div><button class="addm" data-a="addmedia">＋ Foto oder Video</button><input type="file" id="edFile" accept="image/*,video/*" multiple hidden></div>
 ${E.isNew?'':'<button class="danger" data-a="eddel">Eintrag löschen</button>'}</div>`;
 document.body.append(o);document.body.style.overflow='hidden';
 const ta=$('#edText');ta.value=E.text;
 const grow=()=>{ta.style.height='auto';ta.style.height=Math.max(ta.scrollHeight,window.innerHeight*.22)+'px'};grow();
 ta.addEventListener('input',()=>{E.text=ta.value;E.dirty=true;grow()});
 $('#edDate').addEventListener('change',e=>{if(e.target.value){E.date=e.target.value;E.dirty=true}});
 const ti=$('#edTagIn');
 ti.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===','){e.preventDefault();commitTag()}else if(e.key==='Backspace'&&!ti.value&&E.tags.length){E.tags.pop();E.dirty=true;drawTags()}});
 ti.addEventListener('input',()=>{if(/,$/.test(ti.value))commitTag();else drawSug()});
 $('#edFile').addEventListener('change',e=>addFiles([...e.target.files]).then(()=>e.target.value=''));
 drawKids();drawMs();drawTags();drawMeas();drawMedia();
 if(E.isNew)setTimeout(()=>ta.focus(),60)}
function drawKids(){
 $('#edKids').innerHTML=S.kids.length?S.kids.map(k=>`<button class="chip k${k.c} ${E.kids.includes(k.id)?'on':''}" data-a="edkid" data-id="${k.id}">${esc(k.name)}${E.kids.includes(k.id)?' · '+ageAt(k.birth,E.date):''}</button>`).join(''):'<span class="note">Lege unter Einstellungen ein Kind an, dann erscheint hier das Alter.</span>'}
function drawMs(){const b=$('#edMs');b.classList.toggle('on',E.ms);b.textContent=E.ms?'★ Meilenstein':'☆ Meilenstein'}
function drawMeas(){
 const box=$('#edMeas');
 if(E.kids.length!==1){box.innerHTML='<div class="note n0">Messwerte (Größe, Gewicht, Kopfumfang) gibt es, wenn genau ein Kind gewählt ist.</div>';return}
 box.innerHTML=`<h4>Messwerte (optional)</h4><div class="g">${METRICS.map(([k,l,u])=>`<div><label for="m_${k}">${l} (${u})</label><input id="m_${k}" inputmode="decimal" autocomplete="off" value="${E[k]!=null?String(E[k]).replace('.',','):''}"></div>`).join('')}</div>`;
 METRICS.forEach(([k])=>$('#m_'+k).addEventListener('input',e=>{E['_'+k]=e.target.value;E.dirty=true}))}
function commitTag(){const ti=$('#edTagIn');if(!ti)return;for(const part of ti.value.split(',')){const t=normTag(part);if(t&&!E.tags.some(x=>x.toLowerCase()===t.toLowerCase())){E.tags.push(t);E.dirty=true}}ti.value='';drawTags()}
function drawTags(){$('#edTags').innerHTML=E.tags.map((t,i)=>`<i>#${esc(t)}<u data-a="deltag" data-i="${i}" role="button" aria-label="Tag entfernen">✕</u></i>`).join('');drawSug()}
function drawSug(){
 const v=($('#edTagIn')?.value||'').toLowerCase(),have=new Set(E.tags.map(t=>t.toLowerCase()));
 const used=allTags().map(x=>x.t),pool=[...used,...TAGS_DEFAULT.filter(t=>!used.some(u=>u.toLowerCase()===t.toLowerCase()))];
 $('#edSug').innerHTML=pool.filter(t=>!have.has(t.toLowerCase())&&(!v||t.toLowerCase().includes(v))).slice(0,10).map(t=>`<button class="chip" data-a="addtag" data-t="${esc(t)}">#${esc(t)}</button>`).join('')}
function drawMedia(){
 $('#edMedia').innerHTML=E.media.map((m,i)=>`<div class="th" data-a="viewmedia" data-i="${i}"><img ${m.thumbUrl?`src="${m.thumbUrl}"`:`data-th="${m.id}"`} alt="">${m.type==='video'?'<b>▶</b>':''}<u data-a="delmedia" data-i="${i}" role="button" aria-label="Entfernen">✕</u></div>`).join('');
 hydrate($('#edMedia'))}
async function addFiles(files){
 const t=toast('Verarbeite …',0);let n=0;
 for(const f of files){n++;t.textContent=`Verarbeite ${n}/${files.length} …`;
  try{const isV=f.type.startsWith('video/'),p=isV?await processVideo(f):await processImage(f);
   E.media.push({id:uid(),type:isV?'video':'image',mime:p.mime,name:f.name||'',blob:p.blob,thumb:p.thumb,thumbUrl:p.thumb?URL.createObjectURL(p.thumb):null,size:p.blob.size});E.dirty=true;drawMedia()}
  catch{toast('Datei übersprungen: '+(f.name||''))}}
 t.remove()}
async function viewMedia(m){
 let blob=m.blob;
 if(!blob){try{const r=await dbGet('media',m.id);blob=r&&await openBlob('media',m.id,r.blob,m.mime||(m.type==='video'?'video/mp4':'image/jpeg'))}catch{}}
 if(!blob){toast('Datei nicht lesbar');return}
 const u=URL.createObjectURL(blob),o=document.createElement('div');o.className='lb';
 o.innerHTML=(m.type==='video'?`<video src="${u}" controls playsinline autoplay></video>`:`<img src="${u}" alt="">`)+'<button aria-label="Schließen">✕</button>';
 $('button',o).onclick=()=>{dismiss(o);URL.revokeObjectURL(u)};document.body.append(o)}
function closeEditor(){E?.media.forEach(m=>m.thumbUrl&&URL.revokeObjectURL(m.thumbUrl));dismiss($('#ed'));dismiss($('#dim'));document.body.style.overflow='';E=null}
async function saveEditor(){
 commitTag();
 const text=E.text.trim();
 if(!text&&!E.media.length&&!E.tags.length&&!E.ms){toast('Leerer Eintrag – schreib etwas oder tippe auf Abbrechen');return}
 const vals={};
 for(const[k,l,,lo,hi]of METRICS){
  if(E.kids.length!==1){vals[k]=null;continue}
  const raw=E['_'+k]!==undefined?E['_'+k]:(E[k]!=null?String(E[k]):'');
  if(!String(raw).trim()){vals[k]=null;continue}
  const v=parseFloat(String(raw).replace(',','.'));
  if(!isFinite(v)||v<lo||v>hi){toast(`${l}: Wert prüfen`);return}vals[k]=v}
 const e={id:E.id,date:E.date,created:E.created,updated:Date.now(),kids:E.kids,ms:E.ms,text,tags:E.tags,...vals,
  media:E.media.map(m=>({id:m.id,type:m.type,mime:m.mime,name:m.name,size:m.size}))};
 try{await saveEntry(e,E.media.filter(m=>m.blob),E.removed)}catch{toast('Speichern fehlgeschlagen (Speicher voll?)',4000);return}
 const i=S.entries.findIndex(x=>x.id===e.id);if(i>=0)S.entries[i]=e;else S.entries.push(e);S.entries.sort(cmpDesc);
 S.day=e.date;closeEditor();render();toast('Gespeichert – verschlüsselt auf dem Gerät')}

/* ============ Ansichten ============ */
function filtered(){const q=S.q.trim().toLowerCase();
 return S.entries.filter(e=>(!S.kid||e.kids.includes(S.kid))&&(!S.mil||e.ms)&&(!S.tag||e.tags.some(t=>t.toLowerCase()===S.tag))&&(!q||e.text.toLowerCase().includes(q)||e.tags.some(t=>t.toLowerCase().includes(q))))}
function kidBadges(e){return e.kids.map(id=>kidById(id)).filter(Boolean).map(k=>`<span class="kb k${k.c}">${esc(k.name)} · ${ageAt(k.birth,e.date)}</span>`).join('')}
function measLine(e){const p=METRICS.filter(([k])=>e[k]!=null).map(([k,,u])=>`${fmtNum(e[k])} ${u}`);return p.length?`<div class="ms">${p.join(' · ')}</div>`:''}
const BOOKMARK='<svg class="bm" viewBox="0 0 15 20" aria-label="Meilenstein"><path d="M1.5 0h12A1.5 1.5 0 0 1 15 1.5V20l-7.5-5L0 20V1.5A1.5 1.5 0 0 1 1.5 0z"/></svg>';
function card(e,cls=''){
 const d=parseD(e.date),ms=e.media,badges=kidBadges(e),first=ms[0];
 const dl=d.toLocaleDateString('de-DE',{weekday:'short',day:'numeric',month:'short'}).toUpperCase();
 const nl=e.text.indexOf('\n'),multi=nl>0&&e.text.slice(nl).trim().length>0;
 const title=multi?e.text.slice(0,nl).trim():'',body=multi?e.text.slice(nl).trim():e.text;
 return `<article class="card ${cls}" data-a="open" data-id="${e.id}">
 ${first?`<div class="hero"><img data-th="${first.id}" alt="">${first.type==='video'?'<span class="play">▶ Video</span>':''}${ms.length>1?`<span class="cnt">${ms.length} Medien</span>`:''}</div>`:''}
 <div class="cb"><div class="cd"><span>${esc(dl)}</span>${e.ms?BOOKMARK:''}</div>
 ${badges?`<div class="kbs">${badges}</div>`:''}
 ${title?`<div class="tt">${esc(title)}</div>`:''}
 <div class="ex ${body?'':'empty'}">${body?esc(body):(title?'':'Kein Text')}</div>${measLine(e)}
 ${e.tags.length?`<div class="tg">${e.tags.map(t=>`<i>#${esc(t)}</i>`).join('')}</div>`:''}</div></article>`}
function daysSinceBackup(){const b=LS.get('lastBackup',0);return b?Math.floor((Date.now()-b)/864e5):null}
function listBody(){
 const es=filtered();
 if(!S.entries.length)return `<div class="empty-s"><big>📖</big>Noch kein Eintrag.<br>Tippe auf „+“ für den ersten Moment.</div>`;
 if(!es.length)return `<div class="empty-s"><big>🔎</big>Nichts gefunden.</div>`;
 let out='',cur='';for(const e of es){const d=parseD(e.date),k=`${MON[d.getMonth()]} ${d.getFullYear()}`;if(k!==cur){cur=k;out+=`<div class="mon">${k}</div>`}out+=card(e)}return out}
function renderList(){
 const tags=allTags().slice(0,14),t0=today(),ds=daysSinceBackup();
 const mem=S.entries.filter(e=>e.date.slice(5)===t0.slice(5)&&e.date.slice(0,4)<t0.slice(0,4)).slice(0,2);
 let ban='';
 if(S.entries.length>=3&&(ds===null||ds>=14))ban+=`<div class="banner"><span>${ds===null?'Noch kein Backup erstellt.':`Letztes Backup vor ${ds} Tagen.`}</span><button data-a="tab" data-t="set">Sichern</button></div>`;
 const now=new Date();
 $('#app').innerHTML=`<h1><small>${WDL[now.getDay()]}, ${now.getDate()}. ${MON[now.getMonth()]}</small>Journal</h1>${ban}
 ${mem.length?`<div class="mon m0">An diesem Tag</div>${mem.map(e=>card(e,'mem')).join('')}`:''}
 <div class="srchw"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input class="srch" id="q" type="search" placeholder="Suchen" value="${esc(S.q)}" enterkeyhint="search"></div>
 <div class="chips"><button class="chip ${!S.kid&&!S.mil?'on':''}" data-a="kidf" data-id="">Alle</button>${S.kids.map(k=>`<button class="chip k${k.c} ${S.kid===k.id?'on':''}" data-a="kidf" data-id="${k.id}">${esc(k.name)}</button>`).join('')}<button class="chip ${S.mil?'on':''}" data-a="milf">★ Meilensteine</button></div>
 ${tags.length?`<div class="chips">${tags.map(x=>`<button class="chip ${S.tag===x.t.toLowerCase()?'on':''}" data-a="tagf" data-t="${esc(x.t.toLowerCase())}">#${esc(x.t)}</button>`).join('')}</div>`:''}
 <div id="lb">${listBody()}</div>`;
 $('#q').addEventListener('input',e=>{S.q=e.target.value;$('#lb').innerHTML=listBody();hydrate($('#lb'))});
 hydrate()}
function renderCal(){
 const{y,m}=S.cal,lead=(new Date(y,m,1).getDay()+6)%7,dim=new Date(y,m+1,0).getDate(),byDay={};
 for(const e of S.entries)(byDay[e.date]=byDay[e.date]||[]).push(e);
 let cells='';for(let i=0;i<lead;i++)cells+='<span class="e"></span>';
 for(let d=1;d<=dim;d++){const k=`${y}-${pad(m+1)}-${pad(d)}`,es=byDay[k]||[];
  const kd=es.map(e=>kidById(e.kids[0])).find(Boolean);
  cells+=`<button data-a="day" data-d="${k}" class="${k===today()?'td':''} ${k===S.day?'sel':''}" aria-label="${d}. ${MON[m]}${es.length?', '+es.length+' Einträge':''}">${d}<i class="dot ${kd?'k'+kd.c:es.length?'n':''}"></i></button>`}
 const sel=byDay[S.day]||[],sd=parseD(S.day);
 $('#app').innerHTML=`<h1><small>${S.entries.length} Einträge</small>Kalender</h1>
 <div class="calh"><button data-a="calp" aria-label="Voriger Monat">‹</button><b>${MON[m]} ${y}</b><button data-a="caln" aria-label="Nächster Monat">›</button></div>
 <div class="cal">${['Mo','Di','Mi','Do','Fr','Sa','So'].map(w=>`<div class="wd">${w}</div>`).join('')}${cells}</div>
 <div class="mon">${WDL[sd.getDay()]}, ${sd.getDate()}. ${MON[sd.getMonth()]} ${sd.getFullYear()}</div>
 ${sel.map(e=>card(e)).join('')||'<div class="note">Kein Eintrag an diesem Tag.</div>'}
 <button class="pill mt8" data-a="newday">＋ Eintrag für diesen Tag</button>`;
 hydrate()}
function chartSVG(pts,unit){
 const W=320,H=150,L=34,R=10,T=10,B=24;
 const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);let x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
 if(x1-x0<1){x0-=.5;x1+=.5}if(y1-y0<.01){y0-=1;y1+=1}const pyd=(y1-y0)*.12;y0-=pyd;y1+=pyd;
 const X=v=>L+(v-x0)/(x1-x0)*(W-L-R),Y=v=>T+(1-(v-y0)/(y1-y0))*(H-T-B);
 const line=pts.map((p,i)=>`${i?'L':'M'}${X(p.x).toFixed(1)} ${Y(p.y).toFixed(1)}`).join(' ');
 const lab=m=>m<24?Math.round(m)+' M':(m/12).toFixed(1).replace('.',',')+' J';
 return `<svg class="ch" viewBox="0 0 ${W} ${H}" role="img" aria-label="Verlauf ${esc(unit)}"><path class="ax" d="M${L} ${T}V${H-B}H${W-R}"/>
 <text x="${L-4}" y="${T+8}" text-anchor="end">${fmtNum(y1)}</text><text x="${L-4}" y="${H-B}" text-anchor="end">${fmtNum(y0)}</text>
 <text x="${L}" y="${H-8}">${lab(x0)}</text><text x="${W-R}" y="${H-8}" text-anchor="end">${lab(x1)}</text>
 <path class="ln" d="${line}"/>${pts.map(p=>`<circle class="pt" cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="3.5"/>`).join('')}</svg>`}
function renderGrow(){
 if(!S.kids.length){$('#app').innerHTML=`<h1><small>Größe · Gewicht · Kopfumfang</small>Wachstum</h1><div class="empty-s"><big>📏</big>Lege zuerst unter Einstellungen ein Kind an.</div>`;return}
 if(!kidById(S.gk))S.gk=S.kids[0].id;const k=kidById(S.gk);
 const blocks=METRICS.map(([key,label,unit])=>{
  const rows=S.entries.filter(e=>e.kids.length===1&&e.kids[0]===k.id&&e[key]!=null).sort((a,b)=>a.date<b.date?-1:1);
  if(!rows.length)return '';
  const last=rows[rows.length-1];
  return `<div class="gc"><h3>${label}</h3><div class="last">zuletzt ${fmtNum(last[key])} ${unit} · ${ageAt(k.birth,last.date)}</div>
  ${rows.length>1?chartSVG(rows.map(r=>({x:ageMonths(k.birth,r.date),y:r[key]})),unit):''}
  <div class="gl">${[...rows].reverse().map(r=>`<div data-a="open" data-id="${r.id}"><span>${parseD(r.date).toLocaleDateString('de-DE',{day:'numeric',month:'short',year:'numeric'})} · ${ageAt(k.birth,r.date)}</span><b>${fmtNum(r[key])} ${unit}</b></div>`).join('')}</div></div>`}).join('');
 $('#app').innerHTML=`<h1><small>Größe · Gewicht · Kopfumfang</small>Wachstum</h1>
 ${S.kids.length>1?`<div class="chips">${S.kids.map(x=>`<button class="chip k${x.c} ${x.id===k.id?'on':''}" data-a="gk" data-id="${x.id}">${esc(x.name)}</button>`).join('')}</div>`:''}
 ${blocks||`<div class="empty-s"><big>📏</big>Noch keine Messwerte für ${esc(k.name)}.<br>Trage sie in einem Eintrag ein.</div>`}
 <div class="note">Nur eine Dokumentation – keine medizinische Bewertung. Perzentilen und Vorsorge-Fragen bitte mit der Kinderarztpraxis besprechen.</div>`}
function streak(){const set=new Set(S.entries.map(e=>e.date));const d=new Date();if(!set.has(ymd(d)))d.setDate(d.getDate()-1);let n=0;while(set.has(ymd(d))){n++;d.setDate(d.getDate()-1)}return n}
async function renderSet(){
 const media=S.entries.reduce((a,e)=>a+e.media.length,0);
 let est='';try{est=fmtSize((await navigator.storage.estimate()).usage||0)}catch{}
 let persisted=null;try{persisted=await navigator.storage.persisted()}catch{}
 const lb=LS.get('lastBackup',0);
 if(S.tab!=='set')return;
 $('#app').innerHTML=`<h1><small>Verschlüsselt · nur auf diesem Gerät</small>Einstellungen</h1>
 <div class="stats"><div><b>${S.entries.length}</b><span>Einträge</span></div><div><b>${S.entries.filter(e=>e.ms).length}</b><span>Meilensteine</span></div><div><b>${media}</b><span>Fotos/Videos</span></div></div>
 <h2>Kinder</h2><div class="set">${S.kids.map(k=>`<button data-a="editkid" data-id="${k.id}"><span class="kn"><i class="sw k${k.c}"></i><span>${esc(k.name)}<small>geboren ${parseD(k.birth).toLocaleDateString('de-DE',{day:'numeric',month:'long',year:'numeric'})} · ${ageAt(k.birth,today())}</small></span></span><span class="a">Ändern</span></button>`).join('')}
  <button data-a="addkid"><span class="a">＋ Kind hinzufügen</span></button></div>
 <h2>Sicherheit</h2><div class="set">
  <button data-a="pass"><span>Passwort ändern<small>Daten bleiben verschlüsselt, alte Backups behalten das alte Passwort</small></span><span class="a">Ändern</span></button>
  <label><span>Automatisch sperren<small>nach Zeit im Hintergrund</small></span><select data-a="grace">${[[0,'sofort'],[60,'1 Min.'],[300,'5 Min.']].map(([v,l])=>`<option value="${v}" ${LS.get('grace',60)===v?'selected':''}>${l}</option>`).join('')}</select></label>
  <button data-a="lockno"><span>Jetzt sperren</span><span class="a">Sperren</span></button>
  <button data-a="privacy"><span>Datenschutz &amp; Sicherheit<small>Was gespeichert wird und was nicht</small></span><span class="a">Lesen</span></button>
 </div>
 <h2>Backup (verschlüsselt)</h2><div class="set">
  <button data-a="backup"><span>Backup erstellen<small>Fotos, Videos, Text – bleibt verschlüsselt · Teilen → „In Dateien sichern“ → pCloud</small></span><span class="a">Erstellen</span></button>
  <button data-a="import"><span>Backup einlesen<small>ZIP aus dieser App</small></span><span class="a">Wählen</span></button>
  <button data-a="mdexp"><span>Text als Markdown (unverschlüsselt)<small>Nur bewusst nutzen – z. B. zum Ausdrucken</small></span><span class="a">Export</span></button>
  <div><span>Letztes Backup</span><span class="v">${lb?new Date(lb).toLocaleString('de-DE',{dateStyle:'medium',timeStyle:'short'}):'noch nie'}</span></div>
 </div><input type="file" id="impF" accept=".zip,application/zip" hidden>
 <div class="note">Ohne Backup sind die Einträge weg, wenn das iPhone verloren geht oder die App gelöscht wird. Das Backup ist ohne dein Passwort nicht lesbar – auch nicht für pCloud.</div>
 <h2>Speicher</h2><div class="set"><div><span>Belegt</span><span class="v">${est||'–'}</span></div><div><span>Dauerhafter Speicher</span><span class="v">${persisted===null?'unbekannt':persisted?'aktiv':'nicht garantiert'}</span></div><div><span>Tage in Folge</span><span class="v">${streak()}</span></div></div>
 <h2>Gefahrenzone</h2><div class="set"><button data-a="wipe"><span class="d">Alles löschen (Daten und Schlüssel)</span></button></div>`}
function render(){
 $('#app').classList.toggle('ani',!!S.anim);$('#app').classList.toggle('fade',!S.anim&&!!S.fade);S.anim=false;S.fade=false;
 $$('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===S.tab));
 $('.fab').style.display=S.tab==='set'||S.tab==='grow'?'none':'';
 if(S.tab==='list')renderList();else if(S.tab==='cal')renderCal();else if(S.tab==='grow')renderGrow();else renderSet();
 navTitle()}
function navTitle(){const h=$('#app h1');$('#navt').textContent=h?[...h.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(''):''}
addEventListener('scroll',()=>document.body.classList.toggle('scrolled',scrollY>44),{passive:true});

/* ============ ZIP (ohne Kompression) ============ */
const CRCT=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(u8){let c=-1;for(let i=0;i<u8.length;i++)c=CRCT[(c^u8[i])&255]^(c>>>8);return(c^-1)>>>0}
async function makeZip(files,onProg){
 const parts=[],cen=[];let off=0;
 for(let i=0;i<files.length;i++){const f=files[i];onProg&&onProg(i+1,files.length);
  const crc=crc32(new Uint8Array(await f.blob.arrayBuffer())),nm=enc.encode(f.name),sz=f.blob.size;
  if(sz>4e9||off>4e9)throw new Error('Backup zu groß für ein ZIP (4 GB)');
  const lh=new DataView(new ArrayBuffer(30));lh.setUint32(0,0x04034b50,true);lh.setUint16(4,20,true);lh.setUint16(6,0x0800,true);lh.setUint16(12,0x21,true);lh.setUint32(14,crc,true);lh.setUint32(18,sz,true);lh.setUint32(22,sz,true);lh.setUint16(26,nm.length,true);
  parts.push(lh.buffer,nm,f.blob);
  const ch=new DataView(new ArrayBuffer(46));ch.setUint32(0,0x02014b50,true);ch.setUint16(4,20,true);ch.setUint16(6,20,true);ch.setUint16(8,0x0800,true);ch.setUint16(14,0x21,true);ch.setUint32(16,crc,true);ch.setUint32(20,sz,true);ch.setUint32(24,sz,true);ch.setUint16(28,nm.length,true);ch.setUint32(42,off,true);
  cen.push(ch.buffer,nm);off+=30+nm.length+sz}
 const cdSize=cen.reduce((a,p)=>a+(p.byteLength??p.size),0),end=new DataView(new ArrayBuffer(22));
 end.setUint32(0,0x06054b50,true);end.setUint16(8,files.length,true);end.setUint16(10,files.length,true);end.setUint32(12,cdSize,true);end.setUint32(16,off,true);
 return new Blob([...parts,...cen,end.buffer],{type:'application/zip'})}
async function readZip(file){
 const size=file.size,tail=new DataView(await file.slice(Math.max(0,size-65557),size).arrayBuffer());
 let i=tail.byteLength-22;while(i>=0&&tail.getUint32(i,true)!==0x06054b50)i--;
 if(i<0)throw new Error('Kein gültiges ZIP');
 const n=tail.getUint16(i+10,true),cdSize=tail.getUint32(i+12,true),cdOff=tail.getUint32(i+16,true);
 if(cdOff+cdSize>size)throw new Error('ZIP beschädigt');
 const cd=new DataView(await file.slice(cdOff,cdOff+cdSize).arrayBuffer()),out=new Map();let p=0;
 for(let k=0;k<n;k++){
  if(p+46>cd.byteLength||cd.getUint32(p,true)!==0x02014b50)throw new Error('ZIP beschädigt');
  const method=cd.getUint16(p+10,true),csize=cd.getUint32(p+20,true),nl=cd.getUint16(p+28,true),el=cd.getUint16(p+30,true),cl=cd.getUint16(p+32,true),lo=cd.getUint32(p+42,true);
  const name=dec.decode(new Uint8Array(cd.buffer,p+46,nl));p+=46+nl+el+cl;
  if(method!==0)throw new Error('Nur Backups aus dieser App werden unterstützt');
  const lh=new DataView(await file.slice(lo,lo+30).arrayBuffer()),st=lo+30+lh.getUint16(26,true)+lh.getUint16(28,true);
  if(st+csize>size)throw new Error('ZIP beschädigt');
  out.set(name,file.slice(st,st+csize))}
 return out}

/* ============ Backup / Export / Import ============ */
function saveSheet(blob,name,type,title,enc1){
 const file=new File([blob],name,{type});
 const o=modal(`<h3>${esc(title)}</h3><p>${esc(name)} · ${fmtSize(blob.size)}</p><div class="bt"><button class="p" data-r="share">In Dateien / pCloud sichern</button><button data-r="dl">Als Download speichern</button><button data-r="x">Schließen</button></div>
 <p class="fine">${enc1?'Die Datei ist verschlüsselt und ohne dein Passwort nicht lesbar. ':'<b>Achtung: unverschlüsselt.</b> Nach Gebrauch löschen. '}Im Teilen-Menü „In Dateien sichern“ wählen und den pCloud-Ordner antippen (pCloud muss in der Dateien-App aktiviert sein).</p>`);
 const mark=()=>{if(enc1){LS.set('lastBackup',Date.now());if(S.tab==='set')render()}};
 o.addEventListener('click',async e=>{const b=e.target.closest('[data-r]');if(!b)return;const r=b.dataset.r;
  if(r==='x')dismiss(o);
  else if(r==='share'){try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file]});mark();dismiss(o)}else toast('Teilen nicht möglich – bitte „Als Download“ nutzen',3500)}catch(err){if(err.name!=='AbortError')toast('Teilen fehlgeschlagen: '+err.message,3500)}}
  else if(r==='dl'){const u=URL.createObjectURL(file),a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),60000);mark()}})}
async function doBackup(){
 const t=toast('Backup wird erstellt …',0);
 try{const files=[],hdr={app:'kinderjournal',v:1,created:new Date().toISOString(),vault:VAULT.meta,counts:{}};
  for(const s of['kids','entries']){const recs=await dbAll(s);hdr.counts[s]=recs.length;for(const r of recs)files.push({name:`${s}/${r.id}`,blob:new Blob([r.iv,r.ct])})}
  for(const s of['media','thumbs']){const recs=await dbAll(s);hdr.counts[s]=recs.length;for(const r of recs)files.push({name:`${s}/${r.id}`,blob:r.blob})}
  files.unshift({name:'header.json',blob:new Blob([JSON.stringify(hdr)])});
  const zip=await makeZip(files,(i,n)=>t.textContent=`Backup ${i}/${n} …`);t.remove();
  saveSheet(zip,`Journal-Backup-${today()}.zip`,'application/zip','Verschlüsseltes Backup bereit',true)}
 catch(e){t.remove();toast('Backup fehlgeschlagen: '+e.message,4500)}}
function toMarkdown(es){
 const s=[...es].sort((a,b)=>-cmpDesc(a,b));let o='# Kinder-Journal\n\n';
 for(const e of s){const d=parseD(e.date),ks=e.kids.map(kidById).filter(Boolean);
  o+=`## ${e.date} · ${WDL[d.getDay()]}${e.ms?' · ★ Meilenstein':''}\n\n`;
  if(ks.length)o+=ks.map(k=>`**${k.name}** (${ageAt(k.birth,e.date)})`).join(', ')+'\n\n';
  if(e.text)o+=e.text.trim()+'\n\n';
  const m=METRICS.filter(([k])=>e[k]!=null).map(([k,l,u])=>`${l}: ${fmtNum(e[k])} ${u}`);if(m.length)o+=m.join(' · ')+'\n\n';
  if(e.tags.length)o+=e.tags.map(t=>'#'+t.replace(/\s+/g,'_')).join(' ')+'\n\n';
  if(e.media.length)o+=`(${e.media.length} Foto/Video-Anhänge nur im verschlüsselten Backup)\n\n`;
  o+='---\n\n'}
 return o}
async function putRaw(stores){const t=txd(Object.keys(stores),'readwrite');for(const[s,list]of Object.entries(stores))for(const r of list)t.objectStore(s).put(r);await txDone(t)}
async function doImport(file,fresh){
 const t=toast('Lese Backup …',0);
 try{const files=await readZip(file),hf=files.get('header.json');if(!hf)throw new Error('header.json fehlt');
  const h=JSON.parse(await hf.text());
  if(h.app!=='kinderjournal'||!validVault(h.vault))throw new Error('Unbekanntes oder unsicheres Format');
  const rec=async(name)=>{const b=await files.get(name).arrayBuffer();return{id:name.split('/')[1],iv:new Uint8Array(b,0,12),ct:b.slice(12)}};
  const names=s=>[...files.keys()].filter(n=>n.startsWith(s+'/')&&ID_RE.test(n.split('/')[1]));
  if(fresh){ // frische Installation: Tresor des Backups übernehmen, Datensätze unverändert kopieren
   const st={vault:[{...h.vault,id:'main'}],kids:[],entries:[],media:[],thumbs:[]};
   for(const n of names('kids'))st.kids.push(await rec(n));for(const n of names('entries'))st.entries.push(await rec(n));
   for(const n of names('media'))st.media.push({id:n.split('/')[1],blob:files.get(n)});for(const n of names('thumbs'))st.thumbs.push({id:n.split('/')[1],blob:files.get(n)});
   await putRaw(st);t.remove();location.reload();return}
  const same=h.vault.wrapped===VAULT.meta.wrapped&&h.vault.salt===VAULT.meta.salt;let bkey=VAULT.key;
  if(!same){t.remove();const pw=await askPass('Passwort des Backups','Dieses Backup wurde mit einem anderen Passwort angelegt.');if(!pw)return;
   const t2=toast('Prüfe Passwort …',0);try{bkey=await vaultOpen(pw,h.vault)}catch{t2.remove();toast('Passwort falsch');return}t2.remove()}
  const t3=toast('Importiere …',0);let added=0,upd=0,i=0;
  const haveK=new Set(S.kids.map(k=>k.id));
  for(const n of names('kids')){const r=await rec(n);if(haveK.has(r.id))continue;const o=await openJSON('kids',r,bkey),k=o.id===r.id&&cleanKid(o);if(!k)continue;await saveKid(k);S.kids.push(k)}
  const have=new Map(S.entries.map(e=>[e.id,e])),list=names('entries');
  for(const n of list){i++;t3.textContent=`Importiere ${i}/${list.length} …`;
   const r=await rec(n),o=await openJSON('entries',r,bkey),e=o.id===r.id&&cleanEntry(o);if(!e)continue;const old=have.get(e.id);
   if(old&&old.updated>=e.updated)continue;
   const mrec=[];
   for(const m of e.media){const mb=files.get('media/'+m.id);if(!mb)continue;const tb=files.get('thumbs/'+m.id);
    if(same)mrec.push({m:{id:m.id,blob:mb},t:tb?{id:m.id,blob:tb}:null});
    else mrec.push({m:{id:m.id,blob:await sealBlob('media',m.id,await openBlob('media',m.id,mb,'',bkey))},t:tb?{id:m.id,blob:await sealBlob('thumbs',m.id,await openBlob('thumbs',m.id,tb,'image/jpeg',bkey))}:null})}
   e.media=e.media.filter(m=>mrec.some(x=>x.m.id===m.id));
   const er=await sealJSON('entries',e),tx=txd(['entries','media','thumbs'],'readwrite');
   tx.objectStore('entries').put(er);for(const x of mrec){tx.objectStore('media').put(x.m);if(x.t)tx.objectStore('thumbs').put(x.t)}await txDone(tx);
   old?upd++:added++}
  await loadAll();freeThumbs();t3.remove();render();toast(`${added} neu, ${upd} aktualisiert`,3500)}
 catch(e){t.remove();$$('.toast').forEach(x=>x.remove());toast('Import fehlgeschlagen: '+e.message,4500)}}

/* ============ Kinder-Dialog ============ */
function kidDialog(k){
 let c=k?k.c:(S.kids.length%6)+1;
 const o=modal(`<h3>${k?'Kind bearbeiten':'Kind hinzufügen'}</h3>
 <input class="inp" id="kn" placeholder="Name oder Spitzname" maxlength="60" autocomplete="off" value="${k?esc(k.name):''}">
 <label class="note lbl" for="kb">Geburtsdatum</label><input class="inp" id="kb" type="date" value="${k?k.birth:''}">
 <div class="sws">${[1,2,3,4,5,6].map(i=>`<button data-c="${i}" class="${i===c?'on':''}" aria-label="Farbe ${i}"><i class="sw k${i}"></i></button>`).join('')}</div>
 <p class="fine2">Tipp: Ein Spitzname reicht – der Name steht nur verschlüsselt auf dem Gerät.</p>
 <div class="bt"><button class="p" data-r="ok">Sichern</button>${k?'<button class="x" data-r="del">Kind entfernen</button>':''}<button data-r="x">Abbrechen</button></div>`);
 o.addEventListener('click',async e=>{
  const sw=e.target.closest('[data-c]');if(sw){c=+sw.dataset.c;$$('.sws button',o).forEach(b=>b.classList.toggle('on',+b.dataset.c===c));return}
  const b=e.target.closest('[data-r]');if(!b)return;const r=b.dataset.r;
  if(r==='x'){dismiss(o);return}
  if(r==='del'){if(!(await ask('Kind entfernen?','Die Einträge bleiben erhalten, verlieren aber die Zuordnung zu diesem Kind.','Entfernen',true)))return;
   const t=txd('kids','readwrite');t.objectStore('kids').delete(k.id);await txDone(t);S.kids=S.kids.filter(x=>x.id!==k.id);
   for(const e2 of S.entries.filter(x=>x.kids.includes(k.id))){e2.kids=e2.kids.filter(x=>x!==k.id);e2.updated=Date.now();await saveEntry(e2,[],[])}
   if(S.kid===k.id)S.kid='';dismiss(o);render();return}
  const name=$('#kn',o).value.trim(),birth=$('#kb',o).value;
  if(!name){toast('Bitte einen Namen eintragen');return}if(!DATE_RE.test(birth)){toast('Bitte das Geburtsdatum eintragen');return}
  const kid={id:k?k.id:uid(),name,birth,c,order:k?k.order:S.kids.length};await saveKid(kid);
  if(k)Object.assign(k,kid);else S.kids.push(kid);dismiss(o);render()})}
function privacyDialog(){
 modal(`<h3>Datenschutz &amp; Sicherheit</h3>
 <ul><li><b>Nur lokal:</b> Alles liegt im Speicher dieses Geräts. Die App hat keinen Server, kein Konto, kein Tracking, keine Cookies und lädt nichts von fremden Seiten (auch keine Schriften).</li>
 <li><b>Verschlüsselt:</b> Text, Fotos, Videos, Namen und Geburtsdaten werden mit AES-256-GCM verschlüsselt gespeichert. Der Schlüssel ist durch dein Passwort geschützt (PBKDF2, 600.000 Runden) und liegt nur im Arbeitsspeicher, solange die App entsperrt ist.</li>
 <li><b>Kein Netz:</b> Eine Content-Security-Policy verbietet der App jede Netzwerkverbindung – sie könnte selbst bei einem Fehler keine Daten versenden.</li>
 <li><b>Backup:</b> Wird als verschlüsselte Datei erzeugt. pCloud oder andere Dienste sehen nur unlesbaren Chiffretext. Nur der Markdown-Export ist unverschlüsselt und warnt dich.</li>
 <li><b>Grenzen:</b> Kein System ist absolut sicher. Die Stärke hängt an deinem Passwort und an der Gerätesperre. Wer das Passwort vergisst, verliert die Daten. Ein infiziertes oder entsperrtes Gerät kann die App nicht schützen.</li>
 <li><b>Hosting:</b> Beim Laden der App-Dateien sieht der Webserver deine IP-Adresse, aber nie deine Einträge.</li>
 <li><b>Rechtliches (keine Rechtsberatung):</b> Rein private Nutzung fällt unter die Haushaltsausnahme der DSGVO (Art. 2 Abs. 2 c). Teilst du Fotos oder Texte mit anderen, denk an die Persönlichkeitsrechte deiner Kinder.</li></ul>
 <div class="bt"><button class="p" data-r="x">Schließen</button></div>`).addEventListener('click',e=>{if(e.target.closest('[data-r]'))dismiss(e.target.closest('.mo'))})}

/* ============ Aktionen ============ */
const A={
 tab(el){const same=S.tab===el.dataset.t;S.tab=el.dataset.t;S.anim=!same;S.fade=same;render();scrollTo(0,0)},
 new(){openEditor(null,S.tab==='cal'?S.day:today())},
 newday(){openEditor(null,S.day)},
 open(el){const e=S.entries.find(x=>x.id===el.dataset.id);if(e)openEditor(e)},
 kidf(el){S.kid=el.dataset.id;S.mil=false;renderList()},
 milf(){S.mil=!S.mil;if(S.mil)S.kid='';renderList()},
 tagf(el){S.tag=S.tag===el.dataset.t?'':el.dataset.t;renderList()},
 gk(el){S.gk=el.dataset.id;renderGrow()},
 day(el){S.day=el.dataset.d;renderCal()},
 calp(){S.cal.m--;if(S.cal.m<0){S.cal.m=11;S.cal.y--}renderCal()},
 caln(){S.cal.m++;if(S.cal.m>11){S.cal.m=0;S.cal.y++}renderCal()},
 async edcancel(){if(E.dirty&&!(await ask('Änderungen verwerfen?','Dieser Eintrag wurde noch nicht gesichert.','Verwerfen',true)))return;closeEditor()},
 edsave(){saveEditor()},
 ms(){E.ms=!E.ms;E.dirty=true;drawMs()},
 edkid(el){const id=el.dataset.id;E.kids=E.kids.includes(id)?E.kids.filter(x=>x!==id):[...E.kids,id];E.dirty=true;drawKids();drawMeas()},
 addtag(el){const t=el.dataset.t;if(!E.tags.some(x=>x.toLowerCase()===t.toLowerCase()))E.tags.push(t);E.dirty=true;drawTags()},
 deltag(el){E.tags.splice(+el.dataset.i,1);E.dirty=true;drawTags()},
 addmedia(){$('#edFile').click()},
 viewmedia(el){viewMedia(E.media[+el.dataset.i])},
 delmedia(el,ev){ev.stopPropagation();const[m]=E.media.splice(+el.dataset.i,1);if(m.thumbUrl)URL.revokeObjectURL(m.thumbUrl);if(!m.blob)E.removed.push(m.id);E.dirty=true;drawMedia()},
 async eddel(){if(!(await ask('Eintrag löschen?','Text, Fotos und Videos dieses Eintrags werden endgültig gelöscht.','Löschen',true)))return;
  const e=S.entries.find(x=>x.id===E.id);try{await deleteEntry(e)}catch{toast('Löschen fehlgeschlagen');return}
  S.entries=S.entries.filter(x=>x.id!==e.id);closeEditor();render();toast('Gelöscht')},
 addkid(){kidDialog(null)},
 editkid(el){kidDialog(kidById(el.dataset.id))},
 privacy(){privacyDialog()},
 async pass(){
  const cur=await askPass('Aktuelles Passwort','Zur Bestätigung eingeben.');if(!cur)return;
  let raw;try{raw=await unwrapRaw(cur,VAULT.meta)}catch{toast('Falsches Passwort');return}
  const a=await askPass('Neues Passwort','Mindestens 12 Zeichen.');if(!a)return;
  if(strength(a)===0){toast('Zu kurz oder zu einfach (mind. 12 Zeichen)',3500);return}
  const b=await askPass('Neues Passwort wiederholen','');if(b!==a){toast('Passwörter stimmen nicht überein');return}
  const t=toast('Wird geändert …',0);const meta=await wrapDEK(a,new Uint8Array(raw));new Uint8Array(raw).fill(0);
  await dbPut('vault',meta);VAULT.meta=meta;t.remove();toast('Passwort geändert. Neues Backup erstellen!',4000)},
 lockno(){lockNow()},
 grace(el){LS.set('grace',+el.value)},
 backup(){doBackup()},
 async mdexp(){if(!(await ask('Unverschlüsselter Export','Die Markdown-Datei enthält Namen, Daten und Texte im Klartext. Auf pCloud oder anderswo kann sie jeder lesen, der Zugriff hat. Fortfahren?','Trotzdem exportieren',true)))return;
  saveSheet(new Blob([toMarkdown(S.entries)],{type:'text/markdown'}),`Journal-Klartext-${today()}.md`,'text/markdown','Markdown bereit',false)},
 import(){$('#impF').click()},
 async wipe(){if(!(await ask('Alles löschen?',`Alle ${S.entries.length} Einträge samt Fotos, Videos und Schlüssel werden unwiderruflich gelöscht. Ohne Backup ist nichts wiederherzustellen.`,'Alles löschen',true)))return;
  const pw=await askPass('Zur Bestätigung','Passwort eingeben.');if(!pw)return;if(!(await checkPass(pw))){toast('Falsches Passwort');return}
  await dbClearAll();LS.del('lastBackup');VAULT.key=null;VAULT.meta=null;wipeScreen();showSetup()},
 suggest(){const s=suggestPass(),g=$('.gate');$('#p1',g).value=s;$('#p2',g).value=s;$('#p1',g).type='text';$('#p2',g).type='text';
  $('#p1',g).dispatchEvent(new Event('input'));$('#gm',g).className='msg ok';$('#gm',g).textContent='Gut sichern: in „Passwörter“ (iOS) speichern oder aufschreiben und sicher verwahren!'},
 async setup(){
  const g=$('.gate'),p=$('#p1',g).value;if(strength(p)===0||p!==$('#p2',g).value||!$('#ack',g).checked)return;
  const btn=$('#go',g);btn.disabled=true;btn.textContent='Schlüssel wird erzeugt …';await sleep(30);
  try{await vaultCreate(p)}catch(e){toast('Einrichtung fehlgeschlagen: '+e.message,4000);btn.disabled=false;btn.textContent='Tresor anlegen';return}
  try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch{}
  g.remove();document.body.dataset.s='app';await loadAll();S.anim=true;render();kidDialog(null)},
 restore(){$('#rsF').click()},
 async unlock(){
  const g=$('.gate'),inp=$('#lp',g),btn=$('.pill',g),wait=(LS.get('lockUntil',0)||0)-Date.now();
  if(wait>0){$('#gm',g).textContent=`Zu viele Versuche – bitte ${Math.ceil(wait/1000)} s warten.`;return}
  if(!inp.value)return;btn.disabled=true;btn.textContent='Prüfe …';await sleep(30);
  try{VAULT.key=await vaultOpen(inp.value,VAULT.meta)}
  catch{const f=(LS.get('fails',0)||0)+1;LS.set('fails',f);if(f>=5)LS.set('lockUntil',Date.now()+Math.min(30*2**(f-5),900)*1000);
   inp.value='';btn.disabled=false;btn.textContent='Entsperren';$('#gm',g).textContent=f>=5?'Falsches Passwort – bitte kurz warten.':'Falsches Passwort.';return}
  LS.set('fails',0);g.remove();document.body.dataset.s='app';await loadAll();S.anim=true;render()}
};
document.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(!t||t.tagName==='SELECT'||t.tagName==='OPTION')return;const f=A[t.dataset.a];if(f)f(t,e)});
document.addEventListener('change',e=>{const t=e.target;
 if(t.id==='impF'&&t.files[0]){doImport(t.files[0],false);t.value=''}
 else if(t.id==='rsF'&&t.files[0]){doImport(t.files[0],true);t.value=''}
 else if(t.tagName==='SELECT'&&t.dataset.a==='grace')A.grace(t)});

/* ============ Start ============ */
(async()=>{
 if(!window.crypto||!crypto.subtle||!window.indexedDB){document.body.insertAdjacentHTML('afterbegin','<p class="boot">Dieser Browser bietet keine sichere Verschlüsselung (https nötig). Bitte über eine https-Adresse in Safari öffnen.</p>');return}
 try{await dbOpen()}catch{document.body.insertAdjacentHTML('afterbegin','<p class="boot">Speicher nicht verfügbar. Bitte nicht im privaten Modus öffnen.</p>');return}
 if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('sw.js').catch(()=>{});
 const meta=await dbGet('vault','main');
 if(!meta)showSetup();else{VAULT.meta=meta;showLock()}})();
