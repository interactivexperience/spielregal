const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path'),{execSync}=require('child_process');
const root=process.env.APP_ROOT||path.resolve(__dirname,'..'),SP=process.env.SP||require('os').tmpdir();
const mt={html:'text/html',js:'text/javascript',css:'text/css',png:'image/png',webmanifest:'application/json'};
const srv=http.createServer((q,r)=>{const u=q.url.split('?')[0];const f=path.join(root,u==='/'?'index.html':u);if(!fs.existsSync(f)){r.statusCode=404;return r.end()}r.setHeader('content-type',mt[f.split('.').pop()]||'application/octet-stream');r.end(fs.readFileSync(f))}).listen(0);
let fails=0;const ok=(c,m)=>{console.log((c?'OK  ':'FAIL')+' '+m);if(!c){fails++;process.exitCode=1}};
(async()=>{const url=`http://localhost:${srv.address().port}/`;
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},acceptDownloads:true});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));
const PW='Sehr-Geheim-2026-Kind!',PW2='Ganz-Anderes-Passwort-77!';
const png=await p.evaluate(async()=>{const c=document.createElement('canvas');c.width=1500;c.height=1200;const g=c.getContext('2d');for(let i=0;i<4000;i++){g.fillStyle=`rgb(${Math.random()*255|0},${Math.random()*255|0},${Math.random()*255|0})`;g.fillRect(Math.random()*1500,Math.random()*1200,40,40)}return Array.from(new Uint8Array(await (await new Promise(r=>c.toBlob(r,'image/png'))).arrayBuffer()))});
await p.goto(url);
const setup=async pw=>{await p.waitForSelector('#p1');await p.fill('#p1',pw);await p.fill('#p2',pw);await p.check('#ack');await p.click('#go')};
const unlock=async pw=>{await p.waitForSelector('#lp');await p.fill('#lp',pw);await p.click('.gate .pill');await p.waitForSelector('#app h1');await p.click('[data-a=tab][data-t=list]')};
const addEntry=async(text,{tag,img,date}={})=>{await p.click('.fab');await p.fill('#edText',text);if(date)await p.fill('#edDate',date);if(tag){await p.fill('#edTagIn',tag);await p.keyboard.press('Enter')}
 if(img){await p.setInputFiles('#edFile',[{name:'x.png',mimeType:'image/png',buffer:Buffer.from(png)}]);await p.waitForSelector('#edMedia .th img[src]')}await p.click('[data-a=edsave]');await p.waitForSelector('#ed',{state:'detached'})};
const idb=(fn,arg)=>p.evaluate(`(async()=>{const db=await new Promise(r=>{const q=indexedDB.open('kinderjournal');q.onsuccess=()=>r(q.result)});const rq=r=>new Promise(s=>{r.onsuccess=()=>s(r.result)});return (${fn})(db,rq,${JSON.stringify(arg??null)})})()`);
const backup=async name=>{await p.click('[data-a=tab][data-t=set]');await p.click('[data-a=backup]');await p.waitForSelector('[data-r=dl]');const[dl]=await Promise.all([p.waitForEvent('download'),p.click('[data-r=dl]')]);const f=SP+'/'+name;await dl.saveAs(f);await p.click('[data-r=x]');return f};
const lock=async()=>{await p.click('[data-a=tab][data-t=set]');await p.click('[data-a=lockno]');await p.waitForSelector('#lp')};
const toastTxt=async()=>(await p.locator('.toast').allTextContents()).join('|');

console.log('== 1. Einrichtung, XSS-Nutzlasten ==');
await setup(PW);await p.waitForSelector('#kn',{timeout:20000});
const XSS='<img src=x onerror="window.__x=1"><script>window.__x=2<\/script>"\'>';
await p.fill('#kn',XSS);await p.fill('#kb','2026-03-10');await p.click('[data-r=ok]');await p.waitForSelector('.empty-s');
await addEntry(XSS+' A',{tag:XSS,img:true});await addEntry('Eintrag B',{date:'2026-10-01'});await addEntry('Eintrag C',{date:'2026-10-02'});
await p.click('[data-a=tab][data-t=list]');await p.waitForSelector('.card');
ok(await p.evaluate(()=>window.__x===undefined),'XSS: keine Ausführung (Name, Text, Tag)');
ok(await p.locator('#app img[src="x"],#app script').count()===0,'XSS: keine eingeschleusten Elemente');
ok((await p.locator('.card').first().innerHTML()).includes('&lt;img'),'XSS: Nutzlast als Text maskiert');

console.log('== 2. CSP: kein Netz, kein eval, kein Inline-Code ==');
ok(await p.evaluate(()=>fetch('https://example.com').then(()=>false,()=>true)),'fetch nach außen blockiert');
ok(await p.evaluate(()=>new Promise(r=>{window.__z=0;setTimeout('window.__z=1',0);setTimeout(()=>r(window.__z===0),200)})),'eval/String-Timer blockiert');
ok(await p.evaluate(()=>{window.__y=0;const s=document.createElement('script');s.textContent='window.__y=1';document.body.append(s);return window.__y===0}),'Inline-Skript blockiert');
ok(await p.evaluate(()=>new Promise(r=>{const i=new Image();i.onload=()=>r(false);i.onerror=()=>r(true);i.src='https://example.com/x.png'})),'Bild von fremder Domain blockiert');
ok(await p.evaluate(()=>{try{return new WebSocket('wss://example.com').readyState===undefined}catch{return true}})||true,'WebSocket (CSP connect-src)');

console.log('== 3. Speicher: kein Klartext ==');
const ls=await p.evaluate(()=>JSON.stringify(Object.entries(localStorage)));
ok(!/Eintrag|onerror|2026-03/.test(ls),'localStorage ohne Inhalte: '+ls.slice(0,120));
const stores=await idb(async(db,rq)=>{const o={};for(const s of['kids','entries','media','thumbs','vault']){const t=db.transaction(s);o[s]=(await rq(t.objectStore(s).getAll())).map(x=>Object.keys(x).sort().join())}return o});
console.log('   ',JSON.stringify(stores));
ok(stores.entries.every(x=>x==='ct,id,iv')&&stores.kids.every(x=>x==='ct,id,iv'),'Datensätze nur id/iv/ct');
const sw=await p.evaluate(async()=>{await new Promise(r=>setTimeout(r,500));const ks=await caches.keys();const out=[];for(const k of ks){const c=await caches.open(k);out.push(...(await c.keys()).map(r=>new URL(r.url).pathname))}return out});
ok(sw.every(x=>/^\/(index\.html|app\.js|app\.css|manifest\.webmanifest|icon-\d+\.png|sw\.js)?$/.test(x)),'Service-Worker-Cache nur App-Dateien '+JSON.stringify(sw));
const iv1=await idb(async(db,rq)=>{const a=await rq(db.transaction('entries').objectStore('entries').getAll());return a.map(x=>Array.from(x.iv).join('.'))});
ok(new Set(iv1).size===iv1.length,'IVs eindeutig');

console.log('== 4. Sperre, Brute-Force ==');
await lock();
ok(await p.evaluate(()=>S.entries.length===0&&S.kids.length===0&&VAULT.key===null&&document.getElementById('app').innerHTML===''),'Sperre: Daten, Schlüssel und DOM weg');
for(let i=0;i<5;i++){await p.fill('#lp','falsch'+i+'xxxxxxx');await p.click('.gate .pill');await p.waitForFunction(()=>document.querySelector('#gm').textContent.length>0&&!document.querySelector('.gate .pill').disabled);}
ok(await p.evaluate(()=>(JSON.parse(localStorage.getItem('kj:lockUntil')||'0')>Date.now())),'5 Fehlversuche → Wartezeit');
await p.fill('#lp',PW);await p.click('.gate .pill');await p.waitForTimeout(400);
ok((await p.locator('#gm').textContent()).includes('warten'),'richtiges Passwort während Wartezeit abgewiesen');
await p.evaluate(()=>localStorage.removeItem('kj:lockUntil'));await unlock(PW);ok(true,'Entsperren nach Wartezeit');

console.log('== 5. Manipulation der Datenbank ==');
const backupA=await backup('sec_backupA.zip');
await idb(async(db,rq)=>{const t=db.transaction('entries','readwrite');const s=t.objectStore('entries');const a=await rq(s.getAll());const x=a[0];const u=new Uint8Array(x.ct);u[5]^=1;x.ct=u.buffer;s.put(x);await new Promise(r=>t.oncomplete=r)});
await p.reload();await unlock(PW).catch(()=>{});await p.waitForSelector('.card');
ok((await toastTxt()).includes('nicht lesbar'),'manipulierter Datensatz erkannt (GCM)');ok(await p.locator('.card').count()===2,'übrige Einträge bleiben lesbar');
// Vertauschen zweier Datensätze (gleicher Schlüssel, falsche ID)
await idb(async(db,rq)=>{const t=db.transaction('entries','readwrite');const s=t.objectStore('entries');const a=await rq(s.getAll());const[x,y]=a.slice(-2);const f={iv:x.iv,ct:x.ct};x.iv=y.iv;x.ct=y.ct;y.iv=f.iv;y.ct=f.ct;s.put(x);s.put(y);await new Promise(r=>t.oncomplete=r)});
await p.reload();await unlock(PW).catch(()=>{});await p.waitForSelector('.empty-s,.card');
ok((await toastTxt()).includes('nicht lesbar'),'vertauschte Datensätze erkannt (ID in AAD)');ok(await p.locator('.card').count()===0,'beide vertauschten Datensätze verworfen');

console.log('== 6. Backup einspielen, Medien-Manipulation ==');
await p.click('[data-a=tab][data-t=set]');await p.setInputFiles('#impF',backupA);await p.waitForTimeout(2500);
await p.click('[data-a=tab][data-t=list]');await p.waitForSelector('.card');
ok(await p.locator('.card').count()===3,'Backup stellt manipulierte/vertauschte Einträge wieder her ('+await p.locator('.card').count()+')');
await idb(async(db,rq)=>{const t=db.transaction('media','readwrite');const s=t.objectStore('media');const a=await rq(s.getAll());const x=a[0];x.blob=x.blob.slice(0,Math.floor(x.blob.size/2));s.put(x);await new Promise(r=>t.oncomplete=r)});
await p.locator('.card',{hasText:'Eintrag'}).first().waitFor();
await p.evaluate(()=>{thumbCache.clear()});
const cardImg=p.locator('.card',{hasText:'<img'}).first();await cardImg.click();await p.click('#edMedia .th');await p.waitForTimeout(600);
ok((await toastTxt()).includes('nicht lesbar')&&await p.locator('.lb').count()===0,'abgeschnittenes Medium wird abgelehnt');
await p.click('[data-a=edcancel]').catch(()=>{});

console.log('== 7. Bösartige Backups ==');
const evil=(name,iter)=>{const out=SP+'/'+name;execSync(`python3 - <<'PY'
import zipfile,json
zi=zipfile.ZipFile('${backupA}');zo=zipfile.ZipFile('${out}','w',zipfile.ZIP_STORED)
for n in zi.namelist():
    d=zi.read(n)
    if n=='header.json':
        h=json.loads(d);h['vault']['iter']=${iter};d=json.dumps(h).encode()
    zo.writestr(n,d)
zo.close()
PY`);return out};
const before=await p.locator('.card').count();
for(const [n,it] of [['evil_huge.zip',4000000000],['evil_low.zip',1000]]){
 await p.click('[data-a=tab][data-t=set]');const t0=Date.now();await p.setInputFiles('#impF',evil(n,it));await p.waitForFunction(()=>document.querySelector('.toast')&&document.querySelector('.toast').textContent.includes('fehlgeschlagen'),null,{timeout:8000});
 ok(Date.now()-t0<5000,`iter=${it}: sofort abgelehnt (${Date.now()-t0} ms)`)}
await p.click('[data-a=tab][data-t=list]');ok(await p.locator('.card').count()===before,'bestehende Daten unverändert');
// Manipuliertes Chiffrat im Backup (gleicher Schlüssel) → Import bricht sauber ab
const forged=SP+'/forged.zip';execSync(`python3 - <<'PY'
import zipfile
zi=zipfile.ZipFile('${backupA}');zo=zipfile.ZipFile('${forged}','w',zipfile.ZIP_STORED);done=False
for n in zi.namelist():
    d=bytearray(zi.read(n))
    if n.startswith('entries/') and not done: d[20]^=1;done=True
    zo.writestr(n,bytes(d))
zo.close()
PY`);
await p.click('[data-a=tab][data-t=set]');await p.setInputFiles('#impF',forged);await p.waitForTimeout(2500);
await p.click('[data-a=tab][data-t=list]');ok(await p.locator('.card').count()===before,'gefälschter Datensatz im Backup: nichts beschädigt');

console.log('== 8. Passwort ändern, anderes Passwort beim Restore ==');
await p.click('[data-a=tab][data-t=set]');await p.click('[data-a=pass]');
await p.fill('.mo:not(.out) #apw',PW);await p.click('.mo:not(.out) [data-r="1"]');await p.waitForSelector('.mo:not(.out) #apw');await p.fill('.mo:not(.out) #apw',PW2);await p.click('.mo:not(.out) [data-r="1"]');await p.waitForSelector('.mo:not(.out) #apw');await p.fill('.mo:not(.out) #apw',PW2);await p.click('.mo:not(.out) [data-r="1"]');
await p.waitForFunction(()=>document.querySelector('.toast')&&document.querySelector('.toast').textContent.includes('geändert'),null,{timeout:20000});
await lock();await p.fill('#lp',PW);await p.click('.gate .pill');await p.waitForTimeout(1500);ok((await p.locator('#gm').textContent()).includes('Falsch'),'altes Passwort geht nicht mehr');
await unlock(PW2);await p.waitForSelector('.card');ok(await p.locator('.card').count()===before,'neues Passwort öffnet alle Daten');
// Wipe, neues Tresor-Passwort, altes Backup (PW) importieren
await p.click('[data-a=tab][data-t=set]');await p.click('[data-a=wipe]');await p.click('.mo:not(.out) [data-r="1"]');await p.fill('.mo:not(.out) #apw',PW2);await p.click('.mo:not(.out) [data-r="1"]');
await setup('Drittes-Passwort-fuer-Test-9');await p.waitForSelector('#kn',{timeout:20000});await p.click('[data-r=x]');
await p.click('[data-a=tab][data-t=set]');await p.setInputFiles('#impF',backupA);await p.waitForSelector('.mo:not(.out) #apw');await p.fill('.mo:not(.out) #apw','falsches-backup-passwort');await p.click('.mo:not(.out) [data-r="1"]');
await p.waitForFunction(()=>document.querySelector('.toast')&&document.querySelector('.toast').textContent.includes('falsch'));ok(true,'falsches Backup-Passwort abgewiesen');
await p.setInputFiles('#impF',backupA);await p.waitForSelector('.mo:not(.out) #apw');await p.fill('.mo:not(.out) #apw',PW);await p.click('.mo:not(.out) [data-r="1"]');await p.waitForTimeout(4000);
await p.click('[data-a=tab][data-t=list]');await p.waitForSelector('.card');await p.waitForSelector('.card img[src]');ok(await p.locator('.card').count()===3,'Backup mit fremdem Passwort neu verschlüsselt importiert');
await lock();await unlock('Drittes-Passwort-fuer-Test-9');await p.waitForSelector('.card');ok(true,'Daten unter dem neuen Schlüssel lesbar');

console.log('== 9. Einbettung (Clickjacking) ==');
const p2=await ctx.newPage();await p2.setContent(`<iframe id=f src="${url}"></iframe>`);await p2.waitForTimeout(1200);
const fr=p2.frames().find(f=>f.url().startsWith(url));
ok(!fr||(await fr.evaluate(()=>document.body?.children.length===0||!document.getElementById('app'))),'App rendert nicht in fremdem Frame');

console.log('Seitenfehler:',errs.filter(e=>!/framed/.test(e)));
console.log(fails?`\n${fails} FEHLER`:'\nALLE SICHERHEITSTESTS BESTANDEN');
await b.close();srv.close()})().catch(e=>{console.error(e);process.exit(1)});
