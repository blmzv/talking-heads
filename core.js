/* Общий движок говорящих персонажей. Требует tones.js.
   Страница задаёт window.CHAR = {id, name, gen, phrases, tts:{pitch,rate}, defaultVoice:'any'|'female'|'male', render(t,blink,S,dt)} */
(function(){
const TH_VERSION='v13';
const C=window.CHAR;
const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=(cur,target,tau,dt)=>lerp(cur,target,1-Math.exp(-dt/tau));
const load=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:v;}catch(e){return d;}};
const save=(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}};
// ---------- журнал ----------
const LOG=[]; const t0=performance.now();
function log(msg){
  const ts=((performance.now()-t0)/1000).toFixed(1).padStart(6);
  LOG.push(ts+'  '+msg); if(LOG.length>300) LOG.shift();
  const box=document.getElementById('logBox'); if(box&&!box.hidden){ box.querySelector('pre').textContent=LOG.slice(-80).join('\n'); box.querySelector('pre').scrollTop=1e9; }
}
(function(){
  const box=document.createElement('div'); box.id='logBox'; box.hidden=true;
  box.style.cssText='position:fixed;left:8px;right:8px;bottom:8px;max-height:45vh;background:rgba(20,20,30,.94);color:#dfe;border-radius:14px;padding:10px;font:12px/1.35 ui-monospace,Menlo,monospace;z-index:50;display:flex;flex-direction:column;gap:8px';
  box.innerHTML='<div style="display:flex;gap:8px;align-items:center"><b style="flex:1">Журнал</b><button id="logCopy" style="padding:6px 12px;font-size:12px">Копировать</button><button id="logClear" style="padding:6px 12px;font-size:12px">Очистить</button><button id="logClose" style="padding:6px 12px;font-size:12px">Закрыть</button></div><pre style="margin:0;overflow:auto;white-space:pre-wrap;flex:1"></pre>';
  const st=document.createElement('style'); st.textContent='#logBox[hidden]{display:none!important}'; document.head.appendChild(st);
  document.body.appendChild(box);
  box.querySelector('#logClose').onclick=()=>{box.hidden=true;};
  box.querySelector('#logClear').onclick=()=>{LOG.length=0;box.querySelector('pre').textContent='';};
  box.querySelector('#logCopy').onclick=async()=>{
    const txt=['== '+C.name+' · '+navigator.userAgent,'voiceGate='+voiceGate+' sig='+S.sig+' floor='+S.floor+' mode='+S.mode].concat(LOG).join('\n');
    try{ await navigator.clipboard.writeText(txt); showBubble('Журнал скопирован',2000); }
    catch(e){ const r=document.createRange(); r.selectNodeContents(box.querySelector('pre')); const sel=getSelection(); sel.removeAllRanges(); sel.addRange(r); showBubble('Выделено — скопируйте вручную',3000); }
  };
  const btn=document.createElement('button'); btn.id='logBtn'; btn.textContent='🐞 Лог';
  btn.onclick=()=>{ box.hidden=!box.hidden; if(!box.hidden){ box.querySelector('pre').textContent=LOG.slice(-80).join('\n'); } };
  document.querySelector('.panel').appendChild(btn);
})();

const S={raw:0,level:0,talk:0,open:0,mode:'idle',prevMode:'idle',
  blinkT:-1,nextBlink:1.5,gaze:{x:0,y:0,tx:0,ty:0,next:1.5},
  demoTarget:0,demoNext:0,keyHeld:false,sig:false,floor:'none',
  pitch:-1,voice:null,voiceT:-10,vm:0.5,bubT:0,gated:false};
let audio=null;
const DEV_KEY='th_dev_'+C.id, VOICE_KEY='th_voice2_'+C.id;
const SPLIT_HZ=165;           // ниже — мужской, выше — женский
let voiceGate=load(VOICE_KEY,C.defaultVoice||'any');
$('#voiceSel').value=voiceGate;
$('#voiceSel').onchange=e=>{voiceGate=e.target.value;save(VOICE_KEY,voiceGate);log('voiceGate → '+voiceGate);};
log('старт '+TH_VERSION+': voiceGate='+voiceGate);
(function(){const v=document.createElement('span');v.textContent=TH_VERSION;v.style.cssText='font-size:11px;opacity:.5;font-weight:700';document.querySelector('.panel').appendChild(v);})();


// ---------- переключатель персонажей ----------
(function(){
  const pages=[['rusalochka','🧜‍♀️ Русалочка','rusalochka.html'],['belosnezhka','🍎 Белоснежка','belosnezhka.html'],['prince','👑 Принц','prince.html'],['pult','🔔 Пульт','pult.html']];
  const nav=document.createElement('nav');
  nav.style.cssText='display:flex;gap:6px;flex-wrap:wrap;justify-content:center;padding:10px 16px 0';
  pages.forEach(([id,label,href])=>{
    const a=document.createElement('a'); a.href=href; a.textContent=label;
    const cur=id===C.id;
    a.style.cssText='text-decoration:none;font-size:13px;font-weight:700;padding:6px 12px;border-radius:999px;color:inherit;background:rgba(255,255,255,.45);opacity:.85'+(cur?';background:var(--accent);color:#fff;opacity:1;pointer-events:none':'');
    nav.appendChild(a);
  });
  const h=document.querySelector('header'); h.parentNode.insertBefore(nav,h.nextSibling);
})();

// ---------- аудио ----------
function savedDevice(){ return load(DEV_KEY,''); }
async function listDevices(){
  try{
    const devs=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='audioinput');
    const sel=$('#devSel'); const cur=audio?audio.stream.getAudioTracks()[0].getSettings().deviceId:savedDevice();
    sel.innerHTML='';
    devs.forEach((d,i)=>{const o=document.createElement('option');o.value=d.deviceId;o.textContent=d.label||('Микрофон '+(i+1));if(d.deviceId===cur)o.selected=true;sel.appendChild(o);});
    sel.hidden=devs.length<2;
  }catch(e){console.warn(e);}
}
async function startMic(deviceId){
  try{
    deviceId=deviceId||savedDevice();
    const audioC={echoCancellation:false,noiseSuppression:false,autoGainControl:false};
    if(deviceId) audioC.deviceId={exact:deviceId};
    let stream;
    try{ stream=await navigator.mediaDevices.getUserMedia({audio:audioC}); }
    catch(e){ if(deviceId){delete audioC.deviceId; stream=await navigator.mediaDevices.getUserMedia({audio:audioC});} else throw e; }
    if(audio){ audio.stream.getTracks().forEach(t=>t.stop()); audio.ctx.close(); audio=null; }
    const ctx=new (window.AudioContext||window.webkitAudioContext)();
    const src=ctx.createMediaStreamSource(stream);
    const analyser=ctx.createAnalyser(); analyser.fftSize=4096; analyser.smoothingTimeConstant=0;
    src.connect(analyser);
    audio={ctx,stream,analyser,data:new Float32Array(analyser.fftSize),ds:new Float32Array(1024)};
    audio.det=new ThToneDetector(analyser,ctx.sampleRate,onTone);
    if(ctx.state==='suspended') await ctx.resume();
    setMode('mic'); $('#micBtn').classList.add('on'); $('#micBtn').textContent='⏹ Выключить микрофон';
    const used=stream.getAudioTracks()[0]; save(DEV_KEY,used.getSettings().deviceId||'');
    await listDevices();
    showBubble('Слушаю: '+(used.label||'микрофон'),2500);
    log('микрофон: '+(used.label||'?')+' sr='+ctx.sampleRate+' state='+ctx.state+' settings='+JSON.stringify(used.getSettings()));
  }catch(e){
    console.error(e); log('микрофон ОШИБКА: '+e.name+' '+e.message);
    $('#status').textContent='Нет доступа к микрофону';
    showBubble('Микрофон не дали… Нажмите «Демо» или держите пробел');
  }
}
function stopMic(){
  if(audio){ audio.stream.getTracks().forEach(t=>t.stop()); audio.ctx.close(); audio=null; }
  $('#micBtn').classList.remove('on'); $('#micBtn').textContent='🎙 Включить микрофон';
  if(S.mode==='mic') setMode('idle');
}
// RMS + основной тон (автокорреляция на сигнале, прореженном вдвое)
function readMic(){
  const {analyser,data,ds,ctx}=audio; analyser.getFloatTimeDomainData(data);
  let sum=0; for(let i=0;i<data.length;i++) sum+=data[i]*data[i];
  const rms=Math.sqrt(sum/data.length);
  S.pitch=-1;
  if(rms>0.008){
    const N=ds.length; for(let i=0;i<N;i++) ds[i]=(data[2*i]+data[2*i+1])*0.5;   // первые 2048 отсчётов → 1024 при sr/2
    S.pitch=detectPitch(ds,ctx.sampleRate/2);
  }
  return rms;
}
function detectPitch(buf,sr){
  const N=buf.length, minLag=Math.floor(sr/400), maxLag=Math.min(Math.floor(sr/70),N-1);
  const corr=new Float32Array(maxLag+1); let best=0,bestLag=-1;
  for(let lag=minLag;lag<=maxLag;lag++){
    let c=0,e1=0,e2=0;
    for(let i=0;i<N-lag;i++){const a=buf[i],b=buf[i+lag];c+=a*b;e1+=a*a;e2+=b*b;}
    const n=c/Math.sqrt(e1*e2+1e-12); corr[lag]=n;
    if(n>best){best=n;bestLag=lag;}
  }
  if(best<0.55) return -1;                       // шум или глухой согласный
  for(let lag=minLag;lag<bestLag;lag++){          // защита от октавной ошибки вниз
    if(corr[lag]>=best*0.9 && corr[lag]>corr[lag-1]&&corr[lag]>=corr[lag+1]){bestLag=lag;break;}
  }
  return sr/bestLag;
}
function micTarget(rms){
  const sens=parseFloat($('#sens').value);
  const thr=0.003+(1-sens)*0.03, range=0.05+(1-sens)*0.3;
  return clamp((rms-thr)/range,0,1);
}
function demoLevel(dt){
  S.demoNext-=dt;
  if(S.demoNext<=0){
    if(Math.random()<0.16){S.demoTarget=0;S.demoNext=0.3+Math.random()*0.5;}
    else{S.demoTarget=0.35+Math.random()*0.65;S.demoNext=0.07+Math.random()*0.15;}
  }
  return S.demoTarget;
}
function setMode(m){ if(m!==S.mode) S.prevMode=S.mode; S.mode=m; $('#demoBtn').classList.toggle('on',m==='demo'); }

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
    u.onend=u.onerror=()=>{ if(S.mode==='speak'){S.mode=back;$('#demoBtn').classList.toggle('on',back==='demo');} };
    setMode('speak'); speechSynthesis.speak(u);
    setTimeout(()=>{ if(S.mode==='speak'&&!speechSynthesis.speaking){S.mode=back;} },2500);
  }else{ setMode('speak'); setTimeout(()=>{S.mode=back;},3000); }
}

// ---------- сигналы (передача слова перезвоном) ----------
let otherGen='';
const HINT_DEFAULT='Тап по персонажу — его перезвон: слово переходит к нему на всех устройствах';
const HINT_OFF='Держите пробел или палец на персонаже — «заговорит» без микрофона';
const SIG_KEY='th_sig_'+C.id;
function setFloor(f,who){
  if(f!==S.floor) log('слово: '+S.floor+' → '+f+(who?' ('+who+')':''));
  S.floor=f; if(who) otherGen=who;
  $('#char').classList.toggle('muted',S.sig&&f!=='me');
  const b=$('#floor'); b.hidden=!S.sig; b.classList.toggle('me',f==='me');
  b.textContent= f==='me'?'Слово у '+C.gen:f==='other'?'Слово у '+otherGen:'Слово свободно';
}
function onTone(key,score){
  log('сигнал: '+key+' ('+score.toFixed(0)+' дБ, dom '+(audio&&audio.det?audio.det.lastDom.toFixed(0):'?')+')');
  if(!S.sig) return;
  if(key===C.id) setFloor('me');
  else if(key==='silence') setFloor('none');
  else setFloor('other',(TH_TONES[key]||{}).gen||key);
}
function setSig(on){
  S.sig=!!on; save(SIG_KEY,S.sig?'1':'0');
  $('#sigBtn').classList.toggle('on',S.sig);
  $('#hint').textContent=S.sig?HINT_DEFAULT:HINT_OFF;
  log('слово по сигналу: '+(S.sig?'ВКЛ':'ВЫКЛ'));
  setFloor('none');
}
function chimeMe(){ thPlayTone(C.id); setFloor('me'); }

// ---------- UI ----------
$('#micBtn').onclick=()=>audio?stopMic():startMic();
$('#devSel').onchange=e=>{ save(DEV_KEY,e.target.value); startMic(e.target.value); };
if(navigator.mediaDevices&&navigator.mediaDevices.addEventListener) navigator.mediaDevices.addEventListener('devicechange',listDevices);
$('#demoBtn').onclick=()=>{ if(S.mode==='demo'){setMode(audio?'mic':'idle');} else setMode('demo'); };
$('#sayBtn').onclick=say;
$('#sigBtn').onclick=()=>setSig(!S.sig);
setSig(load(SIG_KEY,'1')==='1');
addEventListener('keydown',e=>{ if(e.code==='Space'){e.preventDefault();S.keyHeld=true;} });
addEventListener('keyup',e=>{ if(e.code==='Space')S.keyHeld=false; });
const svgEl=$('#char'); svgEl.style.touchAction='none';
svgEl.addEventListener('pointerdown',e=>{e.preventDefault(); log('тап по персонажу'); if(S.sig){chimeMe();} else S.keyHeld=true;});
['pointerup','pointercancel','pointerleave'].forEach(ev=>svgEl.addEventListener(ev,()=>{S.keyHeld=false;}));
svgEl.addEventListener('contextmenu',e=>e.preventDefault());
if('speechSynthesis' in window) speechSynthesis.getVoices();

// ---------- главный цикл ----------
const meter=$('#meter'), status=$('#status'), pitchEl=$('#pitch');
let last=performance.now();
function frame(now){
  const dt=Math.min(0.05,(now-last)/1000); last=now; const t=now/1000;
  let target=0, rawTarget=0; S.gated=false;
  if(S.mode==='mic'&&audio){
    S.raw=readMic(); rawTarget=target=micTarget(S.raw);
    // голос: мужской / женский
    if(S.pitch>0&&rawTarget>0.05){ S.vm=smooth(S.vm,S.pitch<SPLIT_HZ?1:0,0.06,dt); S.voiceT=t; S.voice=S.vm>0.5?'male':'female'; }
    if(t-S.voiceT>0.6){ S.voice=null; S.vm=0.5; }
    if(voiceGate!=='any'&&S.voice!==voiceGate){ target=0; S.gated=rawTarget>0.1; }
    audio.det.tick(t);
    if(S.sig&&S.floor!=='me') target=0;
  }
  else if(S.mode==='demo'||S.mode==='speak'){ target=demoLevel(dt); }
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

  if(S.mode==='mic'){
    S._acc=S._acc||{n:0,p:[],lvl:0,g:0,t:0}; const A=S._acc; A.t+=dt;
    if(rawTarget>0.05){A.n++;A.lvl=Math.max(A.lvl,rawTarget);if(S.pitch>0)A.p.push(Math.round(S.pitch));if(S.gated)A.g++;}
    if(A.t>=0.5){ if(A.n>0){ const med=A.p.length?A.p.sort((a,b)=>a-b)[A.p.length>>1]:'-';
        log('звук: пик='+A.lvl.toFixed(2)+' тон≈'+med+'Гц голос='+(S.voice||'?')+' voiced='+A.p.length+'/'+A.n+(A.g?' ОТСЕЧЕНО':'')+(S.sig?' слово='+S.floor:'')+(audio.det&&audio.det.lastScore>3?' тон='+audio.det.lastKey+':'+audio.det.lastScore.toFixed(0):'')+' open='+S.open.toFixed(2)); }
      S._acc={n:0,p:[],lvl:0,g:0,t:0}; }
  }
  C.render(t,blink,S,dt);

  meter.style.width=(S.level*100).toFixed(0)+'%';
  if(S.mode==='mic'&&audio&&audio.det&&audio.det.lastScore>=4){ const d=audio.det; pitchEl.textContent='🎵 '+(TH_TONES[d.lastKey]||{}).chord+' '+d.lastScore.toFixed(0)+' дБ'; pitchEl.style.color=d.lastScore>=d.minProm?'#0a7d2a':''; }
  else { pitchEl.style.color=''; pitchEl.textContent=(S.mode==='mic'&&S.pitch>0&&rawTarget>0.05)?(Math.round(S.pitch)+' Гц '+(S.voice==='male'?'♂':S.voice==='female'?'♀':'')):''; }
  let st;
  if(S.mode==='mic'){
    if(S.gated) st='Не мой голос';
    else if(S.sig) st= S.floor==='me'?(S.talk>0.5?'Говорит 🗣':'Слово у меня'):S.floor==='other'?'Слово у '+otherGen:'Ждём сигнал…';
    else st= S.talk>0.5?'Говорит 🗣':'Слушаю…';
  } else st= S.mode==='demo'?'Демо-режим':S.mode==='speak'?'Говорит сам(а) 🗣':(S.keyHeld?'Говорит (удержание)':'Микрофон выключен');
  status.textContent=st;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__TH={S,setFloor,detectPitch,onTone,get audio(){return audio;}};
})();
