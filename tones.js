/* Звуковые сигналы передачи слова: пара частот на персонажа (как в тоновом наборе).
   Общий для страниц персонажей и пульта. */
window.TH_TONES={
  silence:    {f:[1400,2260], name:'Тишина',     gen:null,        color:'#6b7280'},
  rusalochka: {f:[1720,2780], name:'Русалочка',  gen:'Русалочки', color:'#e63a2e'},
  belosnezhka:{f:[2000,3240], name:'Белоснежка', gen:'Белоснежки',color:'#d62839'},
  prince:     {f:[2500,4040], name:'Принц',      gen:'Принца',    color:'#d4a017'}
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

/* Детектор. Сигнал засчитан, когда одновременно:
   1) оба пика выступают над своей окрестностью (prominence ≥ minProm дБ),
   2) оба пика громче всего остального в полосе 1.2–4.8 кГц (dominance ≥ minDom дБ) — у речи рядом
      стоят соседние гармоники сравнимой силы, у перезвона вокруг тишина,
   3) так несколько кадров подряд. */
window.ThToneDetector=class{
  constructor(analyser,sampleRate,onDetect,opts){
    opts=opts||{};
    this.an=analyser; this.sr=sampleRate; this.on=onDetect;
    this.spec=new Float32Array(analyser.frequencyBinCount);
    this.binHz=sampleRate/analyser.fftSize;
    this.minProm=opts.minProm||10; this.minDom=opts.minDom||6;
    this.needFrames=opts.needFrames||4; this.refractory=opts.refractory||0.7;
    this.bandLo=Math.round(1200/this.binHz); this.bandHi=Math.round(4800/this.binHz);
    this.cand=null; this.count=0; this.lastT=-10; this.lastScore=0; this.lastKey=null; this.lastDom=0;
  }
  peak(idx){ const s=this.spec; let m=-Infinity; for(let i=idx-1;i<=idx+1;i++) if(s[i]>m) m=s[i]; return m; }
  base(idx){ const s=this.spec; let sum=0,n=0;
    for(let i=idx-12;i<=idx-4;i++){ if(i>=0){sum+=s[i];n++;} }
    for(let i=idx+4;i<=idx+12;i++){ if(i<s.length){sum+=s[i];n++;} }
    return n?sum/n:-100; }
  maxOther(idxs){ const s=this.spec; let m=-Infinity;
    for(let i=this.bandLo;i<=this.bandHi;i++){ let skip=false; for(const j of idxs){ if(Math.abs(i-j)<=3){skip=true;break;} } if(!skip&&s[i]>m) m=s[i]; }
    return m; }
  tick(t){
    this.an.getFloatFrequencyData(this.spec);
    let best=null,bestScore=0,bestDom=0;
    for(const key in TH_TONES){
      const idxs=TH_TONES[key].f.map(f=>Math.round(f/this.binHz));
      let prom=Infinity, minPk=Infinity;
      for(const idx of idxs){ const pk=this.peak(idx); if(pk<-85){prom=-1;break;} minPk=Math.min(minPk,pk); prom=Math.min(prom,pk-this.base(idx)); }
      if(prom<0) continue;
      const dom=minPk-this.maxOther(idxs);
      const score=Math.min(prom,dom+4);        // единая шкала для индикатора
      if(score>bestScore){bestScore=score;best=key;bestDom=dom;}
    }
    this.lastScore=bestScore; this.lastKey=best; this.lastDom=bestDom;
    if(best&&bestScore>=this.minProm&&bestDom>=this.minDom){
      if(best===this.cand) this.count++; else {this.cand=best;this.count=1;}
      if(this.count>=this.needFrames && t-this.lastT>this.refractory){ this.lastT=t; this.on(best,bestScore); }
    } else { this.cand=null; this.count=0; }
  }
};
