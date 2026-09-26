/* Общий движок говорящих персонажей.
   Страница задаёт window.CHAR = {id, name, gen, roots:{me, others:[{root,gen}], release:[]},
   phrases, tts:{pitch,rate}, defaultVoice:'any'|'female'|'male', codeword:bool, render(t,blink,S,dt)} */
(function(){
const C=window.CHAR;
const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=(cur,target,tau,dt)=>lerp(cur,target,1-Math.exp(-dt/tau));
const load=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:v;}catch(e){return d;}};
const save=(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}};

const S={raw:0,level:0,talk:0,open:0,mode:'idle',prevMode:'idle',
  blinkT:-1,nextBlink:1.5,gaze:{x:0,y:0,tx:0,ty:0,next:1.5},
  demoTarget:0,demoNext:0,keyHeld:false,cw:false,floor:'none',
  pitch:-1,voice:null,voiceT:-10,vm:0.5,bubT:0,gated:false};
let audio=null;
const DEV_KEY='th_dev_'+C.id, VOICE_KEY='th_voice_'+C.id;
const SPLIT_HZ=165;           // ниже — мужской, выше — женский
let voiceGate=load(VOICE_KEY,C.defaultVoice||'any');
$('#voiceSel').value=voiceGate;
$('#voiceSel').onchange=e=>{voiceGate=e.target.value;save(VOICE_KEY,voiceGate);};

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
    const audioC={echoCancellation:true,noiseSuppression:true,autoGainControl:false};
    if(deviceId) audioC.deviceId={exact:deviceId};
    let stream;
    try{ stream=await navigator.mediaDevices.getUserMedia({audio:audioC}); }
    catch(e){ if(deviceId){delete audioC.deviceId; stream=await navigator.mediaDevices.getUserMedia({audio:audioC});} else throw e; }
    if(audio){ audio.stream.getTracks().forEach(t=>t.stop()); audio.ctx.close(); audio=null; }
    const ctx=new (window.AudioContext||window.webkitAudioContext)();
    const src=ctx.createMediaStreamSource(stream);
    const analyser=ctx.createAnalyser(); analyser.fftSize=2048; analyser.smoothingTimeConstant=0;
    src.connect(analyser);
    audio={ctx,stream,analyser,data:new Float32Array(analyser.fftSize),ds:new Float32Array(analyser.fftSize/2)};
    if(ctx.state==='suspended') await ctx.resume();
    setMode('mic'); $('#micBtn').classList.add('on'); $('#micBtn').textContent='⏹ Выключить микрофон';
    const used=stream.getAudioTracks()[0]; save(DEV_KEY,used.getSettings().deviceId||'');
    await listDevices();
    showBubble('Слушаю: '+(used.label||'микрофон'),2500);
  }catch(e){
    console.error(e);
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
    const N=ds.length; for(let i=0;i<N;i++) ds[i]=(data[2*i]+data[2*i+1])*0.5;
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

// ---------- кодовое слово ----------
let rec=null, recSeen='', recRestartT=null, otherGen='';
const norm=t=>t.toLowerCase().replace(/ё/g,'е');
const HINT_DEFAULT='Держите пробел или палец на персонаже — «заговорит» без микрофона';
function setFloor(f,who){
  S.floor=f; if(who) otherGen=who;
  $('#char').classList.toggle('muted',S.cw&&f!=='me');
  const b=$('#floor'); b.hidden=!S.cw; b.classList.toggle('me',f==='me');
  b.textContent= f==='me'?'Слово у '+C.gen:f==='other'?'Слово у '+otherGen:'Слово свободно';
}
function handleTranscript(tr,isFinal){
  const t=norm(tr);
  const fresh=t.startsWith(recSeen)?t.slice(recSeen.length):t;
  recSeen=isFinal?'':t;
  let bestIdx=-1, action=null;
  const consider=(root,act)=>{const i=fresh.lastIndexOf(root); if(i>bestIdx){bestIdx=i;action=act;}};
  consider(C.roots.me,()=>setFloor('me'));
  (C.roots.others||[]).forEach(o=>consider(o.root,()=>setFloor('other',o.gen)));
  (C.roots.release||[]).forEach(r=>consider(r,()=>setFloor('none')));
  if(action) action();
}
function runRec(){
  if(!S.cw) return;
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  rec=new SR(); rec.lang='ru-RU'; rec.continuous=true; rec.interimResults=true; rec.maxAlternatives=1;
  rec.onresult=e=>{ for(let i=e.resultIndex;i<e.results.length;i++){ const r=e.results[i]; handleTranscript(r[0].transcript,r.isFinal); } };
  rec.onerror=e=>{
    if(e.error==='not-allowed'||e.error==='service-not-allowed'){ stopCW(); showBubble('Распознавание речи запрещено в браузере'); }
    else if(e.error==='network'){ showBubble('Распознаванию нужен интернет',2500); }
  };
  rec.onend=()=>{ recSeen=''; if(S.cw){ clearTimeout(recRestartT); recRestartT=setTimeout(runRec,250); } };
  try{ rec.start(); }catch(err){ console.warn(err); }
}
function startCW(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){ showBubble('В этом браузере нет распознавания речи. Попробуйте Safari или Chrome.'); return; }
  S.cw=true; $('#cwBtn').classList.add('on'); setFloor('none');
  $('#hint').textContent='Скажите имя персонажа — слово перейдёт к нему. Тап по персонажу тоже передаёт слово.';
  if(!audio) startMic();
  runRec();
  const names=[C.name].concat((C.roots.others||[]).map(o=>o.name)).map(n=>'«'+n+'»').join(', ');
  showBubble('Жду имена: '+names,3000);
}
function stopCW(){
  S.cw=false; $('#cwBtn').classList.remove('on'); clearTimeout(recRestartT);
  if(rec){ try{rec.onend=null; rec.stop();}catch(e){} rec=null; }
  setFloor('none');
  $('#hint').textContent=HINT_DEFAULT;
}

// ---------- UI ----------
$('#micBtn').onclick=()=>audio?stopMic():startMic();
$('#devSel').onchange=e=>{ save(DEV_KEY,e.target.value); startMic(e.target.value); };
if(navigator.mediaDevices&&navigator.mediaDevices.addEventListener) navigator.mediaDevices.addEventListener('devicechange',listDevices);
$('#demoBtn').onclick=()=>{ if(S.mode==='demo'){setMode(audio?'mic':'idle');} else setMode('demo'); };
$('#sayBtn').onclick=say;
if(C.codeword){ $('#cwBtn').onclick=()=>S.cw?stopCW():startCW(); } else { $('#cwBtn').hidden=true; }
addEventListener('keydown',e=>{ if(e.code==='Space'){e.preventDefault();S.keyHeld=true;} });
addEventListener('keyup',e=>{ if(e.code==='Space')S.keyHeld=false; });
const svgEl=$('#char'); svgEl.style.touchAction='none';
svgEl.addEventListener('pointerdown',e=>{e.preventDefault(); if(S.cw){setFloor(S.floor==='me'?'none':'me');} else S.keyHeld=true;});
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
    if(S.cw&&S.floor!=='me') target=0;
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

  C.render(t,blink,S,dt);

  meter.style.width=(S.level*100).toFixed(0)+'%';
  pitchEl.textContent=(S.mode==='mic'&&S.pitch>0&&rawTarget>0.05)?(Math.round(S.pitch)+' Гц '+(S.voice==='male'?'♂':S.voice==='female'?'♀':'')):'';
  let st;
  if(S.mode==='mic'){
    if(S.gated) st='Не мой голос';
    else if(S.cw) st= S.floor==='me'?(S.talk>0.5?'Говорит 🗣':'Слово у меня'):S.floor==='other'?'Слово у '+otherGen:'Ждём имя…';
    else st= S.talk>0.5?'Говорит 🗣':'Слушаю…';
  } else st= S.mode==='demo'?'Демо-режим':S.mode==='speak'?'Говорит сам(а) 🗣':(S.keyHeld?'Говорит (удержание)':'Микрофон выключен');
  status.textContent=st;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__TH={S,handleTranscript,setFloor,detectPitch};
})();
