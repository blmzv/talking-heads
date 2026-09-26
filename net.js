/* Связь пульта и экранов через публичный MQTT-брокер (WebSocket, TLS). Своего сервера нет.
   Все устройства в одной «комнате» (код). Пульт публикует, у кого слово; экраны подписаны.
   Требует mqtt.min.js (cdnjs). */
window.TH_NAMES={rusalochka:{name:'Русалочка',gen:'Русалочки'},belosnezhka:{name:'Белоснежка',gen:'Белоснежки'},prince:{name:'Принц',gen:'Принца'},silence:{name:'Тишина',gen:null}};
window.ThNet=class{
  constructor(opts){
    this.room=(opts.room||'skazka').trim().toLowerCase().replace(/[^a-zа-я0-9_-]/g,'')||'skazka';
    this.role=opts.role||'screen'; this.name=opts.name||this.role;
    this.onFloor=opts.onFloor||(()=>{}); this.onPresence=opts.onPresence||(()=>{}); this.onState=opts.onState||(()=>{}); this.log=opts.log||(()=>{});
    this.brokers=['wss://broker.emqx.io:8084/mqtt','wss://broker.hivemq.com:8884/mqtt'];
    this.bi=0; this.id='th-'+Math.random().toString(36).slice(2,10); this.peers={}; this.client=null; this.state='offline';
    this.connect();
  }
  topic(s){ return 'talking-heads/'+this.room+'/'+s; }
  connect(){
    if(this.client){ try{this.client.end(true);}catch(e){} this.client=null; }
    const url=this.brokers[this.bi%this.brokers.length]; this.setState('connecting',url);
    const c=mqtt.connect(url,{clientId:this.id,clean:true,keepalive:20,connectTimeout:8000,reconnectPeriod:0,
      will:{topic:this.topic('presence/'+this.id),payload:'',retain:true,qos:0}});
    this.client=c;
    c.on('connect',()=>{
      this.setState('online',url);
      c.subscribe([this.topic('floor'),this.topic('presence/+')]);
      this.announce();
    });
    c.on('message',(t,payload)=>{
      const s=payload.toString();
      if(t===this.topic('floor')){ try{ const m=JSON.parse(s); this.onFloor(m.key,m); }catch(e){} }
      else if(t.startsWith(this.topic('presence/'))){
        const id=t.split('/').pop();
        if(!s){ delete this.peers[id]; } else { try{ this.peers[id]=JSON.parse(s); }catch(e){} }
        this.onPresence(this.peers);
      }
    });
    const fail=(why)=>{ if(this.state==='offline') return; this.setState('offline',why); this.bi++; clearTimeout(this._rt); this._rt=setTimeout(()=>this.connect(),1500); };
    c.on('error',e=>fail('error: '+(e&&e.message)));
    c.on('close',()=>fail('close'));
    c.on('offline',()=>fail('offline'));
  }
  setState(s,info){ this.state=s; this.log('сеть: '+s+(info?' ('+info+')':'')); this.onState(s,info); }
  announce(extra){
    if(!this.client||this.state!=='online') return;
    this.self=Object.assign({id:this.id,role:this.role,name:this.name,t:Date.now()},extra||{});
    this.client.publish(this.topic('presence/'+this.id),JSON.stringify(this.self),{retain:true,qos:0});
  }
  setName(name,extra){ this.name=name; this.announce(extra); }
  publishFloor(key){
    if(!this.client||this.state!=='online') return false;
    this.client.publish(this.topic('floor'),JSON.stringify({key,from:this.id,name:this.name,t:Date.now()}),{retain:true,qos:0});
    return true;
  }
  setRoom(room){ for(const k in this.peers) delete this.peers[k]; this.room=(room||'skazka').trim().toLowerCase().replace(/[^a-zа-я0-9_-]/g,'')||'skazka'; this.bi=0; this.connect(); }
  close(){ try{ this.client&&this.client.publish(this.topic('presence/'+this.id),'',{retain:true}); this.client&&this.client.end(); }catch(e){} }
};
