/* Общий движок говорящих персонажей (одна сцена, персонажи переключаются без перезагрузки).
   Требует net.js (+ mqtt.min.js) и chars.js. Страница задаёт window.TH_DEFAULT — персонаж по умолчанию. */
(function(){
const TH_VERSION='v28';
const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=(cur,target,tau,dt)=>lerp(cur,target,1-Math.exp(-dt/tau));
const load=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:v;}catch(e){return d;}};
const save=(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}};

let C=null, render=null;              // текущий персонаж и его функция анимации
const S={raw:0,level:0,talk:0,open:0,mode:'idle',prevMode:'idle',
  blinkT:-1,nextBlink:1.5,gaze:{x:0,y:0,tx:0,ty:0,next:1.5},
  demoTarget:0,demoNext:0,phraseT:3,breath:0,keyHeld:false,sig:true,floor:'none',bubT:0};
const LAST_KEY='th_last_char', ROOM_KEY='th_room';

// ---------- журнал ----------
const LOG=[]; const t0=performance.now();
function log(msg){
  const ts=((performance.now()-t0)/1000).toFixed(1).padStart(6);
  LOG.push(ts+'  '+msg); if(LOG.length>300) LOG.shift();
  const box=document.getElementById('logBox'); if(box&&!box.hidden){ const pre=box.querySelector('pre'); pre.textContent=LOG.slice(-80).join('\n'); pre.scrollTop=1e9; }
}
(function(){
  const st=document.createElement('style'); st.textContent='#logBox[hidden]{display:none!important}'; document.head.appendChild(st);
  const box=document.createElement('div'); box.id='logBox'; box.hidden=true;
  box.style.cssText='position:fixed;left:8px;right:8px;bottom:8px;max-height:45vh;background:rgba(20,20,30,.94);color:#dfe;border-radius:14px;padding:10px;font:12px/1.35 ui-monospace,Menlo,monospace;z-index:50;display:flex;flex-direction:column;gap:8px';
  box.innerHTML='<div style="display:flex;gap:8px;align-items:center"><b style="flex:1">Журнал</b><button id="logCopy" style="padding:6px 12px;font-size:12px">Копировать</button><button id="logClear" style="padding:6px 12px;font-size:12px">Очистить</button><button id="logClose" style="padding:6px 12px;font-size:12px">Закрыть</button></div><pre style="margin:0;overflow:auto;white-space:pre-wrap;flex:1"></pre>';
  document.body.appendChild(box);
  box.querySelector('#logClose').onclick=()=>{box.hidden=true;};
  box.querySelector('#logClear').onclick=()=>{LOG.length=0;box.querySelector('pre').textContent='';};
  box.querySelector('#logCopy').onclick=async()=>{
    const txt=['== '+(C?C.name:'?')+' · '+TH_VERSION+' · '+navigator.userAgent,'floor='+S.floor+' mode='+S.mode].concat(LOG).join('\n');
    try{ await navigator.clipboard.writeText(txt); showBubble('Журнал скопирован',2000); }
    catch(e){ const r=document.createRange(); r.selectNodeContents(box.querySelector('pre')); const sel=getSelection(); sel.removeAllRanges(); sel.addRange(r); showBubble('Выделено — скопируйте вручную',3000); }
  };
  const btn=document.createElement('button'); btn.id='logBtn'; btn.textContent='🐞 Лог';
  btn.onclick=()=>{ box.hidden=!box.hidden; if(!box.hidden){ box.querySelector('pre').textContent=LOG.slice(-80).join('\n'); } };
  $('.panel').appendChild(btn);
  const v=document.createElement('span'); v.textContent=TH_VERSION; v.style.cssText='font-size:11px;opacity:.5;font-weight:700'; $('.panel').appendChild(v);
})();

// ---------- переключатель персонажей (без перезагрузки) ----------
const NAV=[['rusalochka','🧜‍♀️ Русалочка'],['belosnezhka','🍎 Белоснежка'],['prince','👑 Принц']];
const nav=document.createElement('nav');
nav.style.cssText='display:flex;gap:6px;flex-wrap:wrap;justify-content:center;padding:10px 16px 0';
NAV.forEach(([id,label])=>{
  const a=document.createElement('a'); a.href='#'+id; a.dataset.id=id; a.textContent=label;
  a.onclick=e=>{e.preventDefault(); setCharacter(id);};
  nav.appendChild(a);
});
const pl=document.createElement('a'); pl.href='pult.html'; pl.textContent='🔔 Пульт'; nav.appendChild(pl);
function styleNav(){
  nav.querySelectorAll('a').forEach(a=>{
    const cur=a.dataset.id===(C&&C.id);
    a.style.cssText='text-decoration:none;font-size:13px;font-weight:700;padding:6px 12px;border-radius:999px;color:inherit;background:rgba(255,255,255,.45);opacity:.85;cursor:pointer'+(cur?';background:var(--accent);color:#fff;opacity:1;pointer-events:none':'');
  });
}
{ const h=$('header'); h.parentNode.insertBefore(nav,h.nextSibling); }

function setCharacter(id){
  const ch=TH_CHARS[id]; if(!ch) return;
  C=ch; save(LAST_KEY,id);
  const th=ch.theme, r=document.documentElement.style;
  for(const k in th) r.setProperty('--'+k,th[k]);
  document.title=ch.name; $('h1').firstChild.textContent=ch.name+' '; $('h1 small').textContent=ch.subtitle;
  $('.stage').innerHTML=ch.svg;
  render=ch.mount($('#char'));
  try{ history.replaceState(null,'','#'+id); }catch(e){}
  styleNav(); log('персонаж: '+ch.name); if(net) net.setName(ch.name,{char:ch.id}); applyFloorKey(S.floorKey);
}

// ---------- синтетическая речь ----------
// слоги 70–220 мс, короткие паузы между словами, каждые 2–5 с пауза на вдох 0.4–0.9 с
function demoLevel(dt){
  S.demoNext-=dt; S.phraseT-=dt;
  if(S.phraseT<=0&&S.breath<=0){ S.breath=0.4+Math.random()*0.5; }
  if(S.breath>0){ S.breath-=dt; if(S.breath<=0){ S.phraseT=2+Math.random()*3; } S.demoTarget=0; return 0; }
  if(S.demoNext<=0){
    if(Math.random()<0.16){S.demoTarget=0;S.demoNext=0.15+Math.random()*0.3;}
    else{S.demoTarget=0.35+Math.random()*0.65;S.demoNext=0.07+Math.random()*0.15;}
  }
  return S.demoTarget;
}
function setMode(m){ if(m!==S.mode) S.prevMode=S.mode; S.mode=m; }

// ---------- реплики ----------
function showBubble(t,ms=3500){const b=$('#bubble');b.textContent=t;b.classList.add('show');clearTimeout(b._t);b._t=setTimeout(()=>b.classList.remove('show'),ms);}
function say(){
  const text=C.phrases[Math.floor(Math.random()*C.phrases.length)];
  showBubble(text,5000);
  const back=S.mode==='speak'?S.prevMode:S.mode;
  if('speechSynthesis' in window){
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text); u.lang='ru-RU'; u.pitch=C.tts.pitch; u.rate=C.tts.rate;
    const v=speechSynthesis.getVoices().find(v=>v.lang.startsWith('ru')); if(v) u.voice=v;
    u.onstart=()=>setMode('speak');
    u.onend=u.onerror=()=>{ if(S.mode==='speak'){S.mode=back;} };
    setMode('speak'); speechSynthesis.speak(u);
    setTimeout(()=>{ if(S.mode==='speak'&&!speechSynthesis.speaking){S.mode=back;} },2500);
  }else{ setMode('speak'); setTimeout(()=>{S.mode=back;},3000); }
}

// ---------- слово по пульту (через комнату в сети) ----------
let otherGen='', net=null;
const HINT_DEFAULT='Слово передаёт пульт. Тап по персонажу — взять слово себе на всех экранах';
function setFloor(f,who){
  if(f!==S.floor) log('слово: '+S.floor+' → '+f+(who?' ('+who+')':''));
  S.floor=f; if(who) otherGen=who;
  const b=$('#floor'); b.hidden=!S.sig; b.classList.toggle('me',f==='me');
  b.textContent= f==='me'?'Слово у '+C.gen:f==='other'?'Слово у '+otherGen:'Слово свободно';
}
function applyFloorKey(key){
  S.floorKey=key;
  if(key===C.id) setFloor('me');
  else if(key==='silence'||!key) setFloor('none');
  else setFloor('other',(TH_NAMES[key]||{}).gen||key);
}
function onNetFloor(key,m){ log('пульт: '+key+(m&&m.name?' от '+m.name:'')); applyFloorKey(key); }
function takeFloor(){ applyFloorKey(C.id); if(!(net&&net.publishFloor(C.id))) showBubble('Нет связи с комнатой — слово только на этом экране',2500); }
function netStatus(state){
  const el=$('#netDot'); if(!el) return;
  el.textContent=state==='online'?'● комната '+net.room:state==='connecting'?'◌ подключение…':'○ нет связи';
  el.style.color=state==='online'?'#0a7d2a':state==='connecting'?'#b58900':'#b00020';
}
function startNet(){
  const room=load(ROOM_KEY,'skazka'); $('#roomInp').value=room;
  net=new ThNet({room,role:'screen',name:C?C.name:'экран',log,
    onFloor:onNetFloor,onState:netStatus,
    onPresence:()=>{}});
}

// ---------- чистый экран ----------
const UI_KEY='th_ui';
function setUI(on){
  document.body.classList.toggle('clean',!on); save(UI_KEY,on?'1':'0');
  $('#gear').textContent=on?'✕':'⚙';
}
(function(){
  const g=document.createElement('button'); g.id='gear'; g.title='Настройки';
  g.style.cssText='position:fixed;top:calc(10px + env(safe-area-inset-top));right:12px;z-index:70;width:38px;height:38px;border-radius:50%;padding:0;font-size:18px;line-height:38px;text-align:center;background:rgba(0,0,0,.18);color:#fff;opacity:.55;box-shadow:none';
  g.onclick=()=>setUI(document.body.classList.contains('clean'));
  document.body.appendChild(g);
  const st=document.createElement('style'); st.textContent='#logBox[hidden]{display:none!important}'; document.head.appendChild(st);
  const box=document.createElement('div'); box.id='logBox'; box.hidden=true;
  box.style.cssText='position:fixed;left:8px;right:8px;bottom:8px;max-height:45vh;background:rgba(20,20,30,.94);color:#dfe;border-radius:14px;padding:10px;font:12px/1.35 ui-monospace,Menlo,monospace;z-index:50;display:flex;flex-direction:column;gap:8px';
  box.innerHTML='<div style="display:flex;gap:8px;align-items:center"><b style="flex:1">Журнал</b><button id="logCopy" style="padding:6px 12px;font-size:12px">Копировать</button><button id="logClear" style="padding:6px 12px;font-size:12px">Очистить</button><button id="logClose" style="padding:6px 12px;font-size:12px">Закрыть</button></div><pre style="margin:0;overflow:auto;white-space:pre-wrap;flex:1"></pre>';
  document.body.appendChild(box);
  box.querySelector('#logClose').onclick=()=>{box.hidden=true;};
  box.querySelector('#logClear').onclick=()=>{LOG.length=0;box.querySelector('pre').textContent='';};
  box.querySelector('#logCopy').onclick=async()=>{
    const txt=['== '+(C?C.name:'?')+' · '+TH_VERSION+' · '+navigator.userAgent,'floor='+S.floor+' mode='+S.mode].concat(LOG).join('\n');
    try{ await navigator.clipboard.writeText(txt); showBubble('Журнал скопирован',2000); }
    catch(e){ const r=document.createRange(); r.selectNodeContents(box.querySelector('pre')); const sel=getSelection(); sel.removeAllRanges(); sel.addRange(r); showBubble('Выделено — скопируйте вручную',3000); }
  };
  const btn=document.createElement('button'); btn.id='logBtn'; btn.textContent='🐞 Лог';
  btn.onclick=()=>{ box.hidden=!box.hidden; if(!box.hidden){ box.querySelector('pre').textContent=LOG.slice(-80).join('\n'); } };
  $('.panel').appendChild(btn);
  const v=document.createElement('span'); v.textContent=TH_VERSION; v.style.cssText='font-size:11px;opacity:.5;font-weight:700'; $('.panel').appendChild(v);
})();

// ---------- переключатель персонажей (без перезагрузки) ----------
const NAV=[['rusalochka','🧜‍♀️ Русалочка'],['belosnezhka','🍎 Белоснежка'],['prince','👑 Принц']];
const nav=document.createElement('nav');
nav.style.cssText='display:flex;gap:6px;flex-wrap:wrap;justify-content:center;padding:10px 16px 0';
NAV.forEach(([id,label])=>{
  const a=document.createElement('a'); a.href='#'+id; a.dataset.id=id; a.textContent=label;
  a.onclick=e=>{e.preventDefault(); setCharacter(id);};
  nav.appendChild(a);
});
const pl=document.createElement('a'); pl.href='pult.html'; pl.textContent='🔔 Пульт'; nav.appendChild(pl);
function styleNav(){
  nav.querySelectorAll('a').forEach(a=>{
    const cur=a.dataset.id===(C&&C.id);
    a.style.cssText='text-decoration:none;font-size:13px;font-weight:700;padding:6px 12px;border-radius:999px;color:inherit;background:rgba(255,255,255,.45);opacity:.85;cursor:pointer'+(cur?';background:var(--accent);color:#fff;opacity:1;pointer-events:none':'');
  });
}
{ const h=$('header'); h.parentNode.insertBefore(nav,h.nextSibling); }

function setCharacter(id){
  const ch=TH_CHARS[id]; if(!ch) return;
  C=ch; save(LAST_KEY,id);
  const th=ch.theme, r=document.documentElement.style;
  for(const k in th) r.setProperty('--'+k,th[k]);
  document.title=ch.name; $('h1').firstChild.textContent=ch.name+' '; $('h1 small').textContent=ch.subtitle;
  $('.stage').innerHTML=ch.svg;
  render=ch.mount($('#char'));
  try{ history.replaceState(null,'','#'+id); }catch(e){}
  styleNav(); log('персонаж: '+ch.name); if(net) net.setName(ch.name,{char:ch.id}); applyFloorKey(S.floorKey);
}

// ---------- синтетическая речь ----------
// слоги 70–220 мс, короткие паузы между словами, каждые 2–5 с пауза на вдох 0.4–0.9 с
function demoLevel(dt){
  S.demoNext-=dt; S.phraseT-=dt;
  if(S.phraseT<=0&&S.breath<=0){ S.breath=0.4+Math.random()*0.5; }
  if(S.breath>0){ S.breath-=dt; if(S.breath<=0){ S.phraseT=2+Math.random()*3; } S.demoTarget=0; return 0; }
  if(S.demoNext<=0){
    if(Math.random()<0.16){S.demoTarget=0;S.demoNext=0.15+Math.random()*0.3;}
    else{S.demoTarget=0.35+Math.random()*0.65;S.demoNext=0.07+Math.random()*0.15;}
  }
  return S.demoTarget;
}
function setMode(m){ if(m!==S.mode) S.prevMode=S.mode; S.mode=m; }

// ---------- реплики ----------
function showBubble(t,ms=3500){const b=$('#bubble');b.textContent=t;b.classList.add('show');clearTimeout(b._t);b._t=setTimeout(()=>b.classList.remove('show'),ms);}
function say(){
  const text=C.phrases[Math.floor(Math.random()*C.phrases.length)];
  showBubble(text,5000);
  const back=S.mode==='speak'?S.prevMode:S.mode;
  if('speechSynthesis' in window){
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text); u.lang='ru-RU'; u.pitch=C.tts.pitch; u.rate=C.tts.rate;
    const v=speechSynthesis.getVoices().find(v=>v.lang.startsWith('ru')); if(v) u.voice=v;
    u.onstart=()=>setMode('speak');
    u.onend=u.onerror=()=>{ if(S.mode==='speak'){S.mode=back;} };
    setMode('speak'); speechSynthesis.speak(u);
    setTimeout(()=>{ if(S.mode==='speak'&&!speechSynthesis.speaking){S.mode=back;} },2500);
  }else{ setMode('speak'); setTimeout(()=>{S.mode=back;},3000); }
}

// ---------- слово по пульту (через комнату в сети) ----------
let otherGen='', net=null;
const HINT_DEFAULT='Слово передаёт пульт. Тап по персонажу — взять слово себе на всех экранах';
function setFloor(f,who){
  if(f!==S.floor) log('слово: '+S.floor+' → '+f+(who?' ('+who+')':''));
  S.floor=f; if(who) otherGen=who;
  const b=$('#floor'); b.hidden=!S.sig; b.classList.toggle('me',f==='me');
  b.textContent= f==='me'?'Слово у '+C.gen:f==='other'?'Слово у '+otherGen:'Слово свободно';
}
function applyFloorKey(key){
  S.floorKey=key;
  if(key===C.id) setFloor('me');
  else if(key==='silence'||!key) setFloor('none');
  else setFloor('other',(TH_NAMES[key]||{}).gen||key);
}
function onNetFloor(key,m){ log('пульт: '+key+(m&&m.name?' от '+m.name:'')); applyFloorKey(key); }
function takeFloor(){ applyFloorKey(C.id); if(!(net&&net.publishFloor(C.id))) showBubble('Нет связи с комнатой — слово только на этом экране',2500); }
function netStatus(state){
  const el=$('#netDot'); if(!el) return;
  el.textContent=state==='online'?'● комната '+net.room:state==='connecting'?'◌ подключение…':'○ нет связи';
  el.style.color=state==='online'?'#0a7d2a':state==='connecting'?'#b58900':'#b00020';
}
function startNet(){
  const room=load(ROOM_KEY,'skazka'); $('#roomInp').value=room;
  net=new ThNet({room,role:'screen',name:C?C.name:'экран',log,
    onFloor:onNetFloor,onState:netStatus,
    onPresence:()=>{}});
}

// ---------- чистый экран ----------
const UI_KEY='th_ui';
function setUI(on){
  document.body.classList.toggle('clean',!on); save(UI_KEY,on?'1':'0');
  $('#gear').textContent=on?'✕':'⚙';
}
(function(){
  const g=document.createElement('button'); g.id='gear'; g.title='Настройки';
  g.style.cssText='position:fixed;top:calc(10px + env(safe-area-inset-top));right:12px;z-index:70;width:38px;height:38px;border-radius:50%;padding:0;font-size:18px;line-height:38px;text-align:center;background:rgba(0,0,0,.18);color:#fff;opacity:.55;box-shadow:none';
  g.onclick=()=>setUI(document.body.classList.contains('clean'));
  document.body.appendChild(g);
  const o=document.createElement('button'); o.id='micOverlay'; o.textContent='🎙 Включить микрофон';
  o.style.cssText='position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:65;font-size:22px;padding:18px 28px;border-radius:999px;box-shadow:0 12px 32px rgba(0,0,0,.3)';
  o.hidden=true; o.onclick=()=>{ if(audio&&S.needTap) wakeAudio(); else startMic(); };
  document.body.appendChild(o);
  const st=document.createElement('style');
  st.textContent='body.clean header,body.clean nav,body.clean .panel,body.clean .hint{display:none!important} body.clean .stage{max-width:none;padding:8px} body.clean svg{max-height:92vh} #logBox{z-index:80}';
  document.head.appendChild(st);
  setUI(load(UI_KEY,'0')==='1');
})();
// ---------- UI ----------
$('#sayBtn').onclick=say;
$('#roomInp').onchange=e=>{ const r=e.target.value.trim()||'skazka'; save(ROOM_KEY,r); e.target.value=r; if(net) net.setRoom(r); };
addEventListener('pagehide',()=>{ if(net) net.close(); });
addEventListener('keydown',e=>{ if(e.code==='Space'){e.preventDefault();S.keyHeld=true;} });
addEventListener('keyup',e=>{ if(e.code==='Space')S.keyHeld=false; });
const stage=$('.stage'); stage.style.touchAction='none';
stage.addEventListener('pointerdown',e=>{ if(!e.target.closest('svg')) return; e.preventDefault(); log('тап по персонажу'); takeFloor(); });
stage.addEventListener('contextmenu',e=>e.preventDefault());
if('speechSynthesis' in window) speechSynthesis.getVoices();

// ---------- старт ----------
const startId=(location.hash||'').slice(1);
setCharacter(TH_CHARS[startId]?startId:(window.TH_DEFAULT||load(LAST_KEY,'rusalochka')));
addEventListener('hashchange',()=>{ const id=location.hash.slice(1); if(TH_CHARS[id]&&(!C||C.id!==id)) setCharacter(id); });
$('#hint').textContent=HINT_DEFAULT;
log('старт '+TH_VERSION);
startNet(); if(net&&C) net.name=C.name; applyFloorKey(null);

// ---------- главный цикл ----------
const status=$('#status');
let last=performance.now();
function frame(now){
  const dt=Math.min(0.05,(now-last)/1000); last=now; const t=now/1000;
  // единственное правило: говорит тот, кого выбрал пульт
  let target=0;
  if(S.floor==='me'||S.mode==='speak') target=demoLevel(dt);
  if(S.keyHeld) target=Math.max(target,demoLevel(dt));

  S.level=smooth(S.level,target,target>S.level?0.025:0.09,dt);
  S.talk=smooth(S.talk,S.level>0.08?1:0,0.25,dt);
  const flutter=0.82+0.18*Math.sin(t*23)*Math.sin(t*7.3);
  S.open=smooth(S.open,S.level*flutter,0.03,dt);

  S.nextBlink-=dt;
  if(S.nextBlink<=0){S.blinkT=0;S.nextBlink=Math.random()<0.25?0.35:2+Math.random()*4;}
  let blink=0;
  if(S.blinkT>=0){S.blinkT+=dt;const p=S.blinkT/0.18;blink=p>=1?0:Math.sin(Math.PI*p);if(p>=1)S.blinkT=-1;}
  S.gaze.next-=dt;
  if(S.gaze.next<=0){S.gaze.tx=(Math.random()*2-1);S.gaze.ty=(Math.random()*2-1)*0.6;S.gaze.next=1.2+Math.random()*3;}
  S.gaze.x=smooth(S.gaze.x,S.gaze.tx,0.25,dt); S.gaze.y=smooth(S.gaze.y,S.gaze.ty,0.25,dt);

  if(render) render(t,blink,S,dt);
  status.textContent= S.mode==='speak'?'Реплика 🗣':S.floor==='me'?(S.talk>0.5?'Говорит 🗣':'Слово у меня'):S.floor==='other'?'Слово у '+otherGen:'Тишина';
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__TH={S,setFloor,applyFloorKey,setCharacter,get net(){return net;},get C(){return C;}};
})();
