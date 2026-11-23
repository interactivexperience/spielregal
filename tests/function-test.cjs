const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=process.env.APP_ROOT||path.resolve(__dirname,'..'),SP=process.env.SP||require('os').tmpdir();
const mt={html:'text/html',js:'text/javascript',css:'text/css',png:'image/png',webmanifest:'application/json'};
const srv=http.createServer((q,r)=>{const u=q.url.split('?')[0];const f=path.join(root,u==='/'?'index.html':u);if(!fs.existsSync(f)){r.statusCode=404;return r.end()}r.setHeader('content-type',mt[f.split('.').pop()]||'application/octet-stream');r.end(fs.readFileSync(f))}).listen(0);
(async()=>{const url=`http://localhost:${srv.address().port}/`;
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,acceptDownloads:true});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push('PE '+e.message));p.on('console',m=>m.type()==='error'&&errs.push('CE '+m.text()));
const ok=(c,m)=>{console.log((c?'OK  ':'FAIL')+' '+m);if(!c)process.exitCode=1};
const PW='Sehr-Geheim-2026-Kind!';
await p.goto(url);await p.waitForSelector('#p1');
ok(await p.locator('#go').isDisabled(),'Setup: Button gesperrt');
await p.fill('#p1','kurz');ok(await p.locator('#go').isDisabled(),'Setup: zu kurzes Passwort abgelehnt');
await p.fill('#p1',PW);await p.fill('#p2',PW);await p.check('#ack');ok(!(await p.locator('#go').isDisabled()),'Setup: gültig');
await p.screenshot({path:SP+'/j_setup.png'});
await p.click('#go');await p.waitForSelector('#kn',{timeout:20000});
await p.fill('#kn','Mia');await p.fill('#kb','2026-03-10');await p.click('[data-r=ok]');await p.waitForSelector('.empty-s');ok(true,'Kind angelegt, App offen');
// Eintrag
const png=await p.evaluate(async()=>{const c=document.createElement('canvas');c.width=800;c.height=600;const g=c.getContext('2d');g.fillStyle='#4a8';g.fillRect(0,0,800,600);g.fillStyle='#fc3';g.fillRect(100,100,300,200);return Array.from(new Uint8Array(await (await new Promise(r=>c.toBlob(r,'image/png'))).arrayBuffer()))});
await p.click('.fab');await p.fill('#edText','Mias erstes Lächeln GEHEIMTEXT123');
ok((await p.locator('#edKids .chip.on').textContent()).includes('Mia'),'Kind vorgewählt (+Alter)');
await p.click('#edMs');await p.fill('#edTagIn','Erstes Mal');await p.keyboard.press('Enter');
await p.fill('#m_h','62,5');await p.fill('#m_w','6,1');
await p.setInputFiles('#edFile',[{name:'a.png',mimeType:'image/png',buffer:Buffer.from(png)}]);await p.waitForSelector('#edMedia .th img[src]');
await p.screenshot({path:SP+'/j_ed.png'});
await p.click('[data-a=edsave]');await p.waitForSelector('.card');await p.waitForSelector('.card img[src]');
ok(true,'Eintrag mit Foto gespeichert');await p.screenshot({path:SP+'/j_list.png'});
// Zweiter Eintrag für Chart
await p.click('.fab');await p.fill('#edText','Zweiter');await p.fill('#edDate','2026-09-10');await p.fill('#m_h','68');await p.click('[data-a=edsave]');await p.waitForSelector('.card >> nth=1');
// Wachstum
await p.click('[data-a=tab][data-t=grow]');await p.waitForSelector('.ch');ok(true,'Wachstumsdiagramm');await p.screenshot({path:SP+'/j_grow.png'});
// Klartext in IndexedDB?
const raw=await p.evaluate(()=>new Promise(res=>{const r=indexedDB.open('kinderjournal');r.onsuccess=()=>{const t=r.result.transaction(['entries','kids'],'readonly');const out=[];let n=2;for(const s of['entries','kids'])t.objectStore(s).getAll().onsuccess=e=>{out.push(...e.target.result.map(x=>Object.keys(x).sort().join()+'|'+JSON.stringify(x).includes('Mia')+JSON.stringify(Array.from(new Uint8Array(x.ct)).length>0)));if(!--n)res(out)}}}));
console.log(raw);ok(raw.every(x=>x.startsWith('ct,id,iv|false')),'IndexedDB: keine Klartextfelder');
// Sperre
await p.click('[data-a=tab][data-t=set]');await p.click('[data-a=lockno]');await p.waitForSelector('#lp');
ok((await p.locator('#app').innerHTML())==='','gesperrt: DOM leer');
await p.fill('#lp','falsch-falsch-falsch');await p.click('.gate .pill');await p.waitForFunction(()=>document.querySelector('#gm').textContent.includes('Falsch'));ok(true,'falsches Passwort abgewiesen');
await p.fill('#lp',PW);await p.click('.gate .pill');await p.waitForSelector('[data-a=tab][data-t=list]');await p.click('[data-a=tab][data-t=list]');await p.waitForSelector('.card');ok(true,'Entsperren');
// Reload -> gesperrt
await p.reload();await p.waitForSelector('#lp');ok(true,'Reload: Sperre');await p.fill('#lp',PW);await p.keyboard.press('Enter');await p.waitForSelector('#app h1');await p.click('[data-a=tab][data-t=list]');await p.waitForSelector('.card');
// Backup
await p.click('[data-a=tab][data-t=set]');await p.click('[data-a=backup]');await p.waitForSelector('[data-r=dl]');
const [dl]=await Promise.all([p.waitForEvent('download'),p.click('[data-r=dl]')]);const zp=SP+'/jb.zip';await dl.saveAs(zp);
const zb=fs.readFileSync(zp);ok(!zb.includes('GEHEIMTEXT123')&&!zb.includes('Mia'),'Backup enthält keinen Klartext');
const {execSync}=require('child_process');const lst=execSync(`python3 -c "import zipfile;z=zipfile.ZipFile('${zp}');print(z.testzip());print(len(z.namelist()))"`).toString().trim();console.log(lst);ok(lst.startsWith('None'),'ZIP gültig');
await p.click('[data-r=x]');
// Alles löschen -> Setup -> Restore
await p.click('[data-a=wipe]');await p.click('.mo:not(.out) [data-r="1"]');await p.fill('.mo:not(.out) #apw',PW);await p.click('.mo:not(.out) [data-r="1"]');await p.waitForSelector('#p1');ok(true,'gelöscht, Einrichtung wieder da');
await p.setInputFiles('#rsF',zp);await p.waitForSelector('#lp',{timeout:15000});ok(true,'Restore: Sperrbildschirm');
await p.fill('#lp',PW);await p.click('.gate .pill');await p.waitForSelector('#app h1');await p.click('[data-a=tab][data-t=list]');await p.waitForSelector('.card');await p.waitForSelector('.card img[src]');
ok((await p.locator('.card').count())===2,'Restore: 2 Einträge');ok((await p.locator('.card').first().textContent()).includes('Mia'),'Restore: Kind+Alter');
// Foto ansehen
await p.locator('.card',{hasText:'GEHEIMTEXT'}).click();await p.click('#edMedia .th');await p.waitForSelector('.lb img');ok(true,'Foto entschlüsselt anzeigbar');await p.click('.lb button');await p.click('[data-a=edcancel]');
// Dark
await p.emulateMedia({colorScheme:'dark'});await p.screenshot({path:SP+'/j_dark.png'});
console.log('Fehler:',errs);ok(errs.length===0,'keine JS-/CSP-Fehler');
await b.close();srv.close()})().catch(e=>{console.error(e);process.exit(1)});
