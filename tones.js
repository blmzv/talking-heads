/* Звуковые сигналы передачи слова: пара частот на персонажа (как в тоновом наборе).
   Общий для страниц персонажей и пульта. */
window.TH_TONES={
  silence:    {f:[1400,2100], name:'Тишина',     gen:null,        color:'#6b7280'},
  rusalochka: {f:[1700,2550], name:'Русалочка',  gen:'Русалочки', color:'#e63a2e'},
  belosnezhka:{f:[2350,3525], name:'Белоснежка', gen:'Белоснежки',color:'#d62839'},
  prince:     {f:[3000,4500], name:'Принц',      gen:'Принца',    color:'#d4a017'}
};
window.TH_TONE_MS=450;

let _toneCtx=null;
window.thToneContext=function(){
  if(!_toneCtx) _toneCtx=new (window.AudioContext||window.webkitAudioContext)();
  if(_toneCtx.state==='suspended') _toneCtx.resume();
  return _toneCtx;
};
/* Проигрывает перезвон: две синусоиды с мягкой огибающей. Возвращает длительность в мс. */
window.thPlayTone=function(key,volume){
  const T=TH_TONES[key]; if(!T) return 0;
  const ctx=thToneContext(), now=ctx.currentTime, dur=TH_TONE_MS/1000, v=(volume==null?0.42:volume);
  const master=ctx.createGain(); master.gain.value=1; master.connect(ctx.destination);
  T.f.forEach((f,i)=>{
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.type='sine'; o.frequency.value=f;
    g.gain.setValueAtTime(0,now); g.gain.linearRampToValueAtTime(v,now+0.02);
    g.gain.setValueAtTime(v,now+dur-0.08); g.gain.linearRampToValueAtTime(0,now+dur);
    o.connect(g); g.connect(master); o.start(now); o.stop(now+dur+0.02);
  });
  // маленькая «искорка» после сигнала — только для красоты, детектор её не ждёт
  const s=ctx.createOscillator(), sg=ctx.createGain(); s.type='triangle';
  s.frequency.setValueAtTime(5200,now+dur); s.frequency.exponentialRampToValueAtTime(7800,now+dur+0.12);
  sg.gain.setValueAtTime(0.0001,now+dur); sg.gain.exponentialRampToValueAtTime(0.12,now+dur+0.02); sg.gain.exponentialRampToValueAtTime(0.0001,now+dur+0.14);
  s.connect(sg); sg.connect(master); s.start(now+dur); s.stop(now+dur+0.16);
  return TH_TONE_MS+160;
};

/* Детектор: ищет одновременно оба пика сигнала в спектре несколько кадров подряд. */
window.ThToneDetector=class{
  constructor(analyser,sampleRate,onDetect,opts){
    this.an=analyser; this.sr=sampleRate; this.on=onDetect;
    this.spec=new Float32Array(analyser.frequencyBinCount);
    this.binHz=sampleRate/analyser.fftSize;
    this.minProm=(opts&&opts.minProm)||11;   // дБ над окрестностью
    this.needFrames=(opts&&opts.needFrames)||3;
    this.refractory=(opts&&opts.refractory)||0.7;
    this.cand=null; this.count=0; this.lastT=-10; this.lastScore=0;
  }
  peak(idx){ const s=this.spec; let m=-Infinity; for(let i=idx-1;i<=idx+1;i++) if(s[i]>m) m=s[i]; return m; }
  base(idx){ const s=this.spec; let sum=0,n=0;
    for(let i=idx-12;i<=idx-4;i++){ if(i>=0){sum+=s[i];n++;} }
    for(let i=idx+4;i<=idx+12;i++){ if(i<s.length){sum+=s[i];n++;} }
    return n?sum/n:-100; }
  tick(t){
    this.an.getFloatFrequencyData(this.spec);
    let best=null,bestScore=0;
    for(const key in TH_TONES){
      const fs=TH_TONES[key].f; let score=Infinity;
      for(const f of fs){ const idx=Math.round(f/this.binHz); const pk=this.peak(idx);
        if(pk<-85){score=-1;break;} score=Math.min(score,pk-this.base(idx)); }
      if(score>bestScore){bestScore=score;best=key;}
    }
    this.lastScore=bestScore; this.lastKey=best;
    if(best&&bestScore>=this.minProm){
      if(best===this.cand) this.count++; else {this.cand=best;this.count=1;}
      if(this.count>=this.needFrames && t-this.lastT>this.refractory){ this.lastT=t; this.on(best,bestScore); }
    } else { this.cand=null; this.count=0; }
  }
};
