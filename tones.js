/* Звуковые сигналы передачи слова: пара частот на персонажа (как в тоновом наборе).
   Общий для страниц персонажей и пульта. */
/* Ноты разведены максимально: 12 частот с шагом 200 Гц в 1.5–3.7 кГц, у каждого сигнала свои три,
   без общих нот, и свой рисунок (вверх / вниз / зигзаг). Гармония тут не нужна — важна различимость микрофоном. */
window.TH_TONES={
  rusalochka: {f:[1500,2300,3100], name:'Русалочка',  chord:'три ноты вверх ↗', gen:'Русалочки', color:'#e63a2e'},
  belosnezhka:{f:[3700,2900,2100], name:'Белоснежка', chord:'три ноты вниз ↘',  gen:'Белоснежки',color:'#d62839'},
  prince:     {f:[1900,3500,2700], name:'Принц',      chord:'зигзаг ↑↓',        gen:'Принца',    color:'#d4a017'},
  silence:    {f:[3300,1700,2500], name:'Тишина',     chord:'зигзаг ↓↑',        gen:null,        color:'#6b7280'}
};
window.TH_NOTE_MS=320;   // длительность ноты
window.TH_GAP_MS=110;     // пауза между нотами
window.TH_TONE_MS=3*window.TH_NOTE_MS+2*window.TH_GAP_MS;

let _toneCtx=null;
window.thToneContext=function(){
  if(!_toneCtx) _toneCtx=new (window.AudioContext||window.webkitAudioContext)();
  if(_toneCtx.state==='suspended') _toneCtx.resume();
  return _toneCtx;
};
/* Арпеджио: три ноты по очереди с паузами. Возвращает длительность в мс. */
window.thPlayTone=function(key,volume){
  const T=TH_TONES[key]; if(!T) return 0;
  const ctx=thToneContext(), now=ctx.currentTime, v=(volume==null?0.5:volume);
  const nd=TH_NOTE_MS/1000, gap=TH_GAP_MS/1000;
  const master=ctx.createGain(); master.gain.value=1; master.connect(ctx.destination);
  T.f.forEach((f,i)=>{
    const st=now+i*(nd+gap);
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.type='sine'; o.frequency.value=f;
    g.gain.setValueAtTime(0,st); g.gain.linearRampToValueAtTime(v,st+0.015);
    g.gain.setValueAtTime(v,st+nd-0.04); g.gain.linearRampToValueAtTime(0,st+nd);
    o.connect(g); g.connect(master); o.start(st); o.stop(st+nd+0.02);
  });
  return TH_TONE_MS;
};

/* Детектор последовательности. Каждый кадр ищет одну доминирующую ноту: пик выступает над окрестностью
   (prominence ≥ minProm дБ) и громче всего остального в полосе 1.3–4.0 кГц (dominance ≥ minDom дБ).
   Для каждого аккорда ведётся счётчик: услышали его 1-ю ноту, потом 2-ю, потом 3-ю в течение maxSpan с — сигнал. */
window.ThToneDetector=class{
  constructor(analyser,sampleRate,onDetect,opts){
    opts=opts||{};
    this.an=analyser; this.sr=sampleRate; this.on=onDetect;
    this.spec=new Float32Array(analyser.frequencyBinCount);
    this.binHz=sampleRate/analyser.fftSize;
    this.minProm=opts.minProm||10; this.minDom=opts.minDom||5;
    this.needFrames=opts.needFrames||4; this.maxSpan=opts.maxSpan||1.6; this.refractory=opts.refractory||1.0;
    this.bandLo=Math.round(1300/this.binHz); this.bandHi=Math.round(4000/this.binHz);
    this.notes=[]; for(const k in TH_TONES) TH_TONES[k].f.forEach(f=>{ if(!this.notes.some(n=>Math.abs(n.f-f)<1)) this.notes.push({f,idx:Math.round(f/this.binHz)}); });
    this.prog={}; for(const k in TH_TONES) this.prog[k]={step:0,t:0,frames:0};
    this.curNote=null; this.curFrames=0; this.lastT=-10; this.lastScore=0; this.lastKey=null; this.lastDom=0; this.lastNote=null;
  }
  peak(idx){ const s=this.spec; let m=-Infinity; for(let i=idx-1;i<=idx+1;i++) if(s[i]>m) m=s[i]; return m; }
  // -Infinity в тишине (Safari) → считаем очень тихим фоном
  fin(v){ return isFinite(v)?v:-160; }
  base(idx){ const s=this.spec; let sum=0,n=0;
    for(let i=idx-12;i<=idx-4;i++){ if(i>=0){sum+=this.fin(s[i]);n++;} }
    for(let i=idx+4;i<=idx+12;i++){ if(i<s.length){sum+=this.fin(s[i]);n++;} }
    return n?sum/n:-100; }
  maxOther(idx){ const s=this.spec; let m=-Infinity;
    for(let i=this.bandLo;i<=this.bandHi;i++){ if(Math.abs(i-idx)<=3) continue; const v=this.fin(s[i]); if(v>m) m=v; }
    return m; }
  tick(t){
    this.an.getFloatFrequencyData(this.spec);
    // доминирующая нота этого кадра
    let best=null,bestScore=0,bestDom=0;
    for(const n of this.notes){
      const pk=this.peak(n.idx); if(!isFinite(pk)) continue;     // абсолютного порога нет: тихий вход (iPad, Safari) сравниваем относительно
      const prom=pk-this.base(n.idx), dom=pk-this.maxOther(n.idx);
      const score=Math.min(prom,dom+5);
      if(score>bestScore){bestScore=score;best=n;bestDom=dom;}
    }
    const heard=(best&&bestScore>=this.minProm&&bestDom>=this.minDom)?best:null;
    if(heard&&this.curNote===heard) this.curFrames++; else {this.curNote=heard;this.curFrames=heard?1:0;}
    this.lastScore=heard?bestScore:0; this.lastDom=bestDom; this.lastNote=heard?Math.round(heard.f):null;
    const stable=heard&&this.curFrames===this.needFrames;   // нота подтверждена ровно в этот кадр
    // прогресс по аккордам
    let progressKey=null, progressStep=0;
    for(const k in TH_TONES){
      const P=this.prog[k], fs=TH_TONES[k].f;
      if(P.step>0&&t-P.t>this.maxSpan){P.step=0;}
      if(stable){
        if(Math.abs(heard.f-fs[P.step])<1){ P.step++; P.t=t;
          if(P.step===fs.length){ P.step=0; if(t-this.lastT>this.refractory){ this.lastT=t; this.on(k,bestScore); } }
        } else if(Math.abs(heard.f-fs[0])<1){ P.step=1; P.t=t; }   // начали заново с первой ноты
        else { P.step=0; }                                          // чужая нота между ступенями — сброс (защита от глиссандо)
      }
      if(P.step>progressStep){progressStep=P.step;progressKey=k;}
    }
    this.lastKey=progressKey; this.lastStep=progressStep;
  }
};
