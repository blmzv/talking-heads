/* Сигналы передачи слова «как азбука Морзе»: одна нота, разное число гудков.
   Русалочка — 1 гудок, Белоснежка — 2, Принц — 3, Тишина — один длинный.
   Общий для страниц персонажей и пульта. */
window.TH_FREQ=2500;        // Гц: динамики телефонов громкие, голос здесь слабый
window.TH_BEEP_MS=160;      // короткий гудок
window.TH_GAP_MS=160;       // пауза между гудками
window.TH_LONG_MS=900;      // длинный гудок (Тишина)
window.TH_TONES={
  rusalochka: {beeps:1, name:'Русалочка',  chord:'один гудок',  gen:'Русалочки', color:'#e63a2e'},
  belosnezhka:{beeps:2, name:'Белоснежка', chord:'два гудка',   gen:'Белоснежки',color:'#d62839'},
  prince:     {beeps:3, name:'Принц',      chord:'три гудка',   gen:'Принца',    color:'#d4a017'},
  silence:    {beeps:0, long:true, name:'Тишина', chord:'длинный гудок', gen:null, color:'#6b7280'}
};
window.TH_TONE_MS=3*TH_BEEP_MS+2*TH_GAP_MS;

let _toneCtx=null;
window.thToneContext=function(){
  if(!_toneCtx) _toneCtx=new (window.AudioContext||window.webkitAudioContext)();
  if(_toneCtx.state==='suspended') _toneCtx.resume();
  return _toneCtx;
};
/* Проигрывает сигнал. Возвращает длительность в мс. */
window.thPlayTone=function(key,volume){
  const T=TH_TONES[key]; if(!T) return 0;
  const ctx=thToneContext(), now=ctx.currentTime+0.02, v=(volume==null?0.5:volume);
  const master=ctx.createGain(); master.gain.value=1; master.connect(ctx.destination);
  const beep=(st,len)=>{
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.type='sine'; o.frequency.value=TH_FREQ;
    g.gain.setValueAtTime(0,st); g.gain.linearRampToValueAtTime(v,st+0.012);
    g.gain.setValueAtTime(v,st+len-0.03); g.gain.linearRampToValueAtTime(0,st+len);
    o.connect(g); g.connect(master); o.start(st); o.stop(st+len+0.02);
  };
  if(T.long){ beep(now,TH_LONG_MS/1000); return TH_LONG_MS; }
  for(let i=0;i<T.beeps;i++) beep(now+i*(TH_BEEP_MS+TH_GAP_MS)/1000,TH_BEEP_MS/1000);
  return T.beeps*TH_BEEP_MS+(T.beeps-1)*TH_GAP_MS;
};

/* Детектор гудков. Нота «слышна», когда её пик выступает над окрестностью (≥ minProm дБ)
   и громче всего остального в полосе 1.3–4 кГц (≥ minDom дБ). Считаем гудки: включение → выключение.
   После паузы endGap без ноты решаем: длинный гудок → Тишина, иначе по числу гудков. */
window.ThToneDetector=class{
  constructor(analyser,sampleRate,onDetect,opts){
    opts=opts||{};
    this.an=analyser; this.sr=sampleRate; this.on=onDetect; this.onNote=opts.onNote||null;
    this.spec=new Float32Array(analyser.frequencyBinCount);
    this.binHz=sampleRate/analyser.fftSize; this.idx=Math.round(TH_FREQ/this.binHz);
    this.minProm=opts.minProm||10; this.minDom=opts.minDom||5;
    this.minBeep=opts.minBeep||0.06;    // короче — шум
    this.longBeep=opts.longBeep||0.55;  // длиннее — «длинный гудок»
    this.endGap=opts.endGap||0.42;      // пауза, после которой серия считается законченной
    this.bandLo=Math.round(1300/this.binHz); this.bandHi=Math.round(4000/this.binHz);
    this.onSince=-1; this.offSince=-1; this.count=0; this.longSeen=false; this.lastEdge=-10;
    this.lastScore=0; this.lastDom=0; this.lastNote=null; this.lastKey=null; this.lastStep=0; this.hearing=false;
  }
  fin(v){ return isFinite(v)?v:-160; }
  peak(){ const s=this.spec,idx=this.idx; let m=-Infinity; for(let i=idx-1;i<=idx+1;i++) if(s[i]>m) m=s[i]; return m; }
  base(){ const s=this.spec,idx=this.idx; let sum=0,n=0;
    for(let i=idx-12;i<=idx-4;i++){ if(i>=0){sum+=this.fin(s[i]);n++;} }
    for(let i=idx+4;i<=idx+12;i++){ if(i<s.length){sum+=this.fin(s[i]);n++;} }
    return n?sum/n:-100; }
  maxOther(){ const s=this.spec,idx=this.idx; let m=-Infinity;
    for(let i=this.bandLo;i<=this.bandHi;i++){ if(Math.abs(i-idx)<=3) continue; const v=this.fin(s[i]); if(v>m) m=v; }
    return m; }
  tick(t){
    this.an.getFloatFrequencyData(this.spec);
    const pk=this.peak(); let hear=false, prom=0, dom=0;
    if(isFinite(pk)){ prom=pk-this.base(); dom=pk-this.maxOther(); hear=prom>=this.minProm&&dom>=this.minDom; }
    this.lastScore=hear?Math.min(prom,dom+5):0; this.lastDom=dom; this.lastNote=hear?TH_FREQ:null; this.hearing=hear;
    if(hear){
      if(this.onSince<0){ this.onSince=t; }          // фронт включения
      this.offSince=-1;
      if(t-this.onSince>=this.longBeep&&!this.longSeen){ this.longSeen=true; if(this.onNote) this.onNote('длинный гудок'); }
    } else {
      if(this.onSince>=0){                            // фронт выключения — гудок закончился
        const len=t-this.onSince; this.onSince=-1; this.offSince=t;
        if(len>=this.minBeep){ this.count++; this.lastEdge=t; if(this.onNote) this.onNote('гудок '+this.count+' ('+Math.round(len*1000)+' мс, '+prom.toFixed(0)+'/'+dom.toFixed(0)+' дБ)'); }
      }
      if(this.offSince>=0&&(this.count>0||this.longSeen)&&t-this.offSince>=this.endGap){
        let key=null;
        if(this.longSeen) key='silence';
        else for(const k in TH_TONES){ if(TH_TONES[k].beeps===this.count) key=k; }
        if(this.onNote) this.onNote('серия: '+(this.longSeen?'длинный':this.count+' гудк.')+' → '+(key||'не распознано'));
        if(key) this.on(key,this.count||1);
        this.count=0; this.longSeen=false; this.offSince=-1;
      }
    }
    this.lastStep=this.count; this.lastKey=this.count===1?'rusalochka':this.count===2?'belosnezhka':this.count>=3?'prince':(this.longSeen?'silence':null);
  }
};
