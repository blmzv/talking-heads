/* Персонажи: SVG, тема, реплики и функция анимации. Общий движок — core.js. */
window.TH_CHARS={};

TH_CHARS.rusalochka={id:'rusalochka',name:'Русалочка',gen:'Русалочки',
  phrases:['Я так хочу увидеть мир над волнами!','Слышите? Это шумит море.','На дне морском сегодня тихо-тихо…','Каждая жемчужина — это чья-то сказка.','Идёмте со мной, я покажу вам коралловый сад!','Говорят, у людей вместо хвоста — две ноги. Странно!'],
  tts:{pitch:1.4,rate:1.0}, defaultVoice:'any',
  subtitle:'говорите — и она заговорит',
  theme:{"bg1": "#bfeff5", "bg2": "#1f6f9c", "ink": "#0d3a55", "accent": "#e63a2e", "btn": "#0d3a55", "btnText": "#dff8ff", "shadow": "rgba(0,40,70,.35)", "meter": "linear-gradient(90deg,#4fd1c5,#ffd166,#ff7a8a)"},
  svg:`<svg id="char" viewBox="0 0 400 480" xmlns="http://www.w3.org/2000/svg" aria-label="Русалочка">
  <defs>
    <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#a8ecf5"/><stop offset=".55" stop-color="#3aa6cf"/><stop offset="1" stop-color="#0e3f6e"/>
    </linearGradient>
    <linearGradient id="hair" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff5a3c"/><stop offset="1" stop-color="#c1281c"/>
    </linearGradient>
    <linearGradient id="hair2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ff6f4a"/><stop offset="1" stop-color="#d9331f"/>
    </linearGradient>
    <linearGradient id="tail" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5fd66e"/><stop offset="1" stop-color="#1e8a52"/>
    </linearGradient>
    <radialGradient id="skin" cx="45%" cy="35%" r="75%">
      <stop offset="0" stop-color="#ffe6d3"/><stop offset="1" stop-color="#f4c3a5"/>
    </radialGradient>
    <pattern id="scales" width="22" height="18" patternUnits="userSpaceOnUse">
      <path d="M0,18 a11,11 0 0 1 22,0" fill="none" stroke="#e6fff7" stroke-width="1.6" opacity=".55"/>
      <path d="M-11,9 a11,11 0 0 1 22,0 M11,9 a11,11 0 0 1 22,0" fill="none" stroke="#e6fff7" stroke-width="1.6" opacity=".55"/>
    </pattern>
    <clipPath id="mouthClip"><path id="mouthClipPath" d=""/></clipPath>
    <clipPath id="frame"><rect x="0" y="0" width="400" height="480" rx="28"/></clipPath>
  </defs>

  <g clip-path="url(#frame)">
    <rect width="400" height="480" fill="url(#sea)"/>
    <g class="ray" opacity=".22">
      <polygon points="120,0 170,0 260,480 150,480" fill="#fff"/>
      <polygon points="230,0 262,0 380,480 300,480" fill="#fff"/>
    </g>
    <!-- водоросли -->
    <path d="M30,480 C20,420 60,400 40,340 C30,300 60,290 50,250" stroke="#0f6b4f" stroke-width="10" fill="none" stroke-linecap="round" opacity=".8"/>
    <path d="M70,480 C80,440 50,420 70,380 C85,350 60,330 75,300" stroke="#158a63" stroke-width="8" fill="none" stroke-linecap="round" opacity=".8"/>
    <path d="M360,480 C350,430 385,410 370,360 C360,330 385,310 375,280" stroke="#0f6b4f" stroke-width="9" fill="none" stroke-linecap="round" opacity=".8"/>
    <!-- пузырьки -->
    <circle class="bub" cx="60" cy="470" r="5" fill="#fff" style="animation-duration:9s;animation-delay:-2s"/>
    <circle class="bub" cx="340" cy="470" r="7" fill="#fff" style="animation-duration:11s;animation-delay:-6s"/>
    <circle class="bub" cx="110" cy="470" r="3.5" fill="#fff" style="animation-duration:7s;animation-delay:-4s"/>
    <circle class="bub" cx="300" cy="470" r="4" fill="#fff" style="animation-duration:8.5s;animation-delay:-1s"/>
    <circle class="bub" cx="30" cy="470" r="3" fill="#fff" style="animation-duration:10s;animation-delay:-7s"/>
    <circle class="bub" cx="375" cy="470" r="3" fill="#fff" style="animation-duration:12s;animation-delay:-3s"/>
    <g id="talkBubbles"></g>

    <!-- волосы сзади -->
    <g id="hairBack">
      <path d="M108,190 C88,70 312,70 292,190 C326,270 338,370 306,452 C286,410 262,428 238,472 C220,412 196,440 172,478 C152,420 122,440 100,462 C74,350 86,262 108,190Z" fill="url(#hair)"/>
      <path d="M130,200 C150,300 140,380 120,440" stroke="#ff9a7a" stroke-width="5" fill="none" opacity=".55" stroke-linecap="round"/>
      <path d="M280,210 C262,300 276,380 296,430" stroke="#ff9a7a" stroke-width="5" fill="none" opacity=".55" stroke-linecap="round"/>
    </g>

    <!-- хвост -->
    <g id="tail">
      <path d="M126,396 C110,440 150,470 205,466 C262,462 296,440 328,458 C344,468 362,476 378,466 C366,452 360,436 350,414 C340,432 320,440 300,430 C286,412 280,402 274,396 Q200,420 126,396Z" fill="url(#tail)"/>
      <path d="M126,396 C110,440 150,470 205,466 C262,462 296,440 328,458 C344,468 362,476 378,466 C366,452 360,436 350,414 C340,432 320,440 300,430 C286,412 280,402 274,396 Q200,420 126,396Z" fill="url(#scales)"/>
      <path d="M330,458 L372,466 M336,448 L356,420" stroke="#e6fff7" stroke-width="1.8" opacity=".6"/>
    </g>

    <!-- шея, плечи, торс -->
    <rect x="184" y="276" width="32" height="56" rx="14" fill="#efb99a"/>
    <path d="M118,352 Q200,304 282,352 L276,404 Q200,424 124,404Z" fill="url(#skin)"/>
    <!-- ракушки -->
    <g fill="#9b5bc7">
      <path d="M144,356 A30,30 0 0 1 204,356 L174,386Z"/>
      <path d="M196,356 A30,30 0 0 1 256,356 L226,386Z"/>
    </g>
    <g stroke="#c99ae6" stroke-width="2" fill="none" opacity=".9">
      <path d="M174,386 L150,352 M174,386 L162,342 M174,386 L174,338 M174,386 L186,342 M174,386 L198,352"/>
      <path d="M226,386 L202,352 M226,386 L214,342 M226,386 L226,338 M226,386 L238,342 M226,386 L250,352"/>
    </g>
    <!-- жемчуг -->
    <g fill="#fff8f0" stroke="#d9c7b8" stroke-width=".6">
      <circle cx="158" cy="332" r="4.5"/><circle cx="169" cy="339" r="4.5"/><circle cx="181" cy="343" r="4.5"/><circle cx="193" cy="345" r="4.5"/>
      <circle cx="207" cy="345" r="4.5"/><circle cx="219" cy="343" r="4.5"/><circle cx="231" cy="339" r="4.5"/><circle cx="242" cy="332" r="4.5"/>
    </g>

    <!-- голова -->
    <g id="head">
      <ellipse cx="200" cy="206" rx="78" ry="88" fill="url(#skin)"/>
      <!-- ушки -->
      <ellipse cx="124" cy="212" rx="9" ry="13" fill="#f2bfa0"/><ellipse cx="276" cy="212" rx="9" ry="13" fill="#f2bfa0"/>
      <!-- щёчки -->
      <ellipse cx="156" cy="242" rx="14" ry="8" fill="#ff8f9a" opacity=".4"/>
      <ellipse cx="244" cy="242" rx="14" ry="8" fill="#ff8f9a" opacity=".4"/>

      <g id="brows" stroke="#a52a1a" stroke-width="3.2" fill="none" stroke-linecap="round">
        <path d="M150,178 Q170,167 190,175"/><path d="M250,178 Q230,167 210,175"/>
      </g>

      <g id="eyeL" class="eye">
        <ellipse cx="170" cy="206" rx="16" ry="19" fill="#fff"/>
        <g class="pupil"><circle cx="171" cy="208" r="11" fill="#2d8fa8"/><circle cx="171" cy="208" r="5.5" fill="#0b1a22"/><circle cx="175" cy="203" r="3.2" fill="#fff"/><circle cx="167" cy="212" r="1.6" fill="#fff" opacity=".8"/></g>
        <path d="M153,199 Q170,184 187,199" stroke="#1d2a30" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <path d="M154,197 l-6,-5 M157,192 l-4,-6" stroke="#1d2a30" stroke-width="2.4" stroke-linecap="round"/>
      </g>
      <g id="eyeR" class="eye">
        <ellipse cx="230" cy="206" rx="16" ry="19" fill="#fff"/>
        <g class="pupil"><circle cx="229" cy="208" r="11" fill="#2d8fa8"/><circle cx="229" cy="208" r="5.5" fill="#0b1a22"/><circle cx="233" cy="203" r="3.2" fill="#fff"/><circle cx="225" cy="212" r="1.6" fill="#fff" opacity=".8"/></g>
        <path d="M213,199 Q230,184 247,199" stroke="#1d2a30" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <path d="M246,197 l6,-5 M243,192 l4,-6" stroke="#1d2a30" stroke-width="2.4" stroke-linecap="round"/>
      </g>

      <path d="M199,230 q5,7 -2,10" stroke="#d99a7c" stroke-width="2.4" fill="none" stroke-linecap="round"/>

      <!-- рот -->
      <path id="mouth" d="" fill="#5a1a24" stroke="#e2606b" stroke-width="5" stroke-linejoin="round"/>
      <g clip-path="url(#mouthClip)">
        <ellipse id="tongue" cx="200" cy="290" rx="16" ry="8" fill="#f07a8a"/>
        <ellipse id="teeth" cx="200" cy="258" rx="14" ry="4" fill="#fff"/>
      </g>

      <!-- волосы спереди -->
      <g id="hairFront">
        <path d="M120,196 C112,108 176,90 200,114 C226,88 292,108 280,196 C266,156 246,146 226,164 C206,128 164,138 120,196Z" fill="url(#hair2)"/>
        <path d="M134,186 C140,150 166,134 190,140" stroke="#ffb09a" stroke-width="3" fill="none" opacity=".7" stroke-linecap="round"/>
        <!-- морская звезда -->
        <g transform="translate(266,132) rotate(15)">
          <path d="M0,-16 L5,-5 L16,-4 L7,4 L10,15 L0,9 L-10,15 L-7,4 L-16,-4 L-5,-5Z" fill="#ffd166" stroke="#e0a83a" stroke-width="1.5" stroke-linejoin="round"/>
          <circle cx="0" cy="0" r="2" fill="#fff2c2"/><circle cx="0" cy="-8" r="1.3" fill="#fff2c2"/><circle cx="7" cy="-1" r="1.3" fill="#fff2c2"/><circle cx="-7" cy="-1" r="1.3" fill="#fff2c2"/>
        </g>
      </g>
    </g>
  </g>
</svg>`,
  mount(root){
    const $=s=>root.querySelector(s);
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    const el={head:$('#head'),brows:$('#brows'),mouth:$('#mouth'),clip:$('#mouthClipPath'),
      tongue:$('#tongue'),teeth:$('#teeth'),hairBack:$('#hairBack'),hairFront:$('#hairFront'),tail:$('#tail'),
      eyes:[$('#eyeL'),$('#eyeR')],pupils:root.querySelectorAll('.pupil'),meter:$('#meter'),status:$('#status'),
      talkBubbles:$('#talkBubbles')};
    const EYE=[{x:170,y:206},{x:230,y:206}];
    
    // пузырьки изо рта, когда говорит
    function spawnBubble(){
      const c=document.createElementNS('http://www.w3.org/2000/svg','circle');
      const x=205+Math.random()*30, r=2+Math.random()*3;
      c.setAttribute('cx',x); c.setAttribute('cy',255); c.setAttribute('r',r); c.setAttribute('fill','#fff'); c.setAttribute('opacity','.8');
      el.talkBubbles.appendChild(c);
      const t0=performance.now();
      const tick=now=>{const p=(now-t0)/2200; if(p>=1){c.remove();return;}
        c.setAttribute('cy',255-p*240); c.setAttribute('cx',x+Math.sin(p*9)*8); c.setAttribute('opacity',(0.8*(1-p)).toFixed(2)); requestAnimationFrame(tick);};
      requestAnimationFrame(tick);
    }
    
    function render(t,blink,S,dt){
      const o=S.open, L=S.level, tk=S.talk;
      S.bubT-=dt; if(S.talk>0.5&&S.level>0.5&&S.bubT<=0){spawnBubble();S.bubT=0.35+Math.random()*0.5;}
      // рот
      const y0=260, cy=y0+o*4, top=y0-o*9, bot=y0+5+o*36;
      const d=`M183,${cy} Q200,${top} 217,${cy} Q200,${bot} 183,${cy} Z`;
      el.mouth.setAttribute('d',d); el.clip.setAttribute('d',d);
      el.tongue.setAttribute('cy',bot-4); el.tongue.setAttribute('ry',4+o*10);
      el.teeth.setAttribute('cy',top+3); el.teeth.setAttribute('opacity',o>0.25?1:0);
    
      // голова
      const tilt=Math.sin(t*0.7)*2+Math.sin(t*4.6)*3.5*tk*L;
      const bob=Math.sin(t*1.3)*3-Math.abs(Math.sin(t*8.2))*5*L;
      el.head.setAttribute('transform',`translate(0 ${bob.toFixed(2)}) rotate(${tilt.toFixed(2)} 200 330)`);
      // волосы плывут
      const hx=Math.sin(t*0.9)*4, hy=Math.sin(t*1.3+1)*3;
      el.hairBack.setAttribute('transform',`translate(${hx.toFixed(2)} ${hy.toFixed(2)}) skewX(${(Math.sin(t*0.6)*2).toFixed(2)})`);
      el.hairFront.setAttribute('transform',`translate(${(hx*0.4).toFixed(2)} ${(Math.sin(t*1.1)*1.5).toFixed(2)})`);
      // хвост качается
      const sw=Math.sin(t*1.1)*3+Math.sin(t*6)*3*L;
      el.tail.setAttribute('transform',`rotate(${sw.toFixed(2)} 200 396)`);
      // брови
      el.brows.setAttribute('transform',`translate(0 ${(-7*L).toFixed(2)})`);
      // глаза
      const widen=1+0.1*clamp((L-0.7)/0.3,0,1);
      el.eyes.forEach((e,i)=>{const c=EYE[i];
        e.setAttribute('transform',`translate(${c.x} ${c.y}) scale(${widen} ${((1-blink*0.96)*widen).toFixed(3)}) translate(${-c.x} ${-c.y})`);});
      const gx=S.gaze.x*4, gy=S.gaze.y*3-1.5*tk;
      el.pupils.forEach(p=>p.setAttribute('transform',`translate(${gx.toFixed(2)} ${gy.toFixed(2)})`));
    }
    return render;
  }
};

TH_CHARS.belosnezhka={id:'belosnezhka',name:'Белоснежка',gen:'Белоснежки',
  phrases:['Ой, здравствуйте! А вы не видели семь гномов?','Яблочко? Нет, спасибо, я уже наелась.','В лесу сегодня так поют птицы!','Зеркальце, скажи, да всю правду доложи…','Не бойтесь, я вас не обижу.','Кто-то оставил на столе семь маленьких тарелочек!'],
  tts:{pitch:1.3,rate:0.95}, defaultVoice:'any',
  subtitle:'говорите — и она заговорит',
  theme:{"bg1": "#f3f7dc", "bg2": "#4f8a5c", "ink": "#22352a", "accent": "#d62839", "btn": "#22352a", "btnText": "#f3f7dc", "shadow": "rgba(20,50,30,.35)", "meter": "linear-gradient(90deg,#7bc043,#ffd166,#d62839)"},
  svg:`<svg id="char" viewBox="0 0 400 480" xmlns="http://www.w3.org/2000/svg" aria-label="Белоснежка">
  <defs>
    <linearGradient id="forest" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#eaf6d2"/><stop offset=".5" stop-color="#8fc98a"/><stop offset="1" stop-color="#2f6b47"/>
    </linearGradient>
    <radialGradient id="skin" cx="45%" cy="35%" r="75%">
      <stop offset="0" stop-color="#fff7f1"/><stop offset="1" stop-color="#f6dccd"/>
    </radialGradient>
    <linearGradient id="hair" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2a2a3a"/><stop offset="1" stop-color="#0d0d14"/>
    </linearGradient>
    <linearGradient id="bodice" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3b56c9"/><stop offset="1" stop-color="#22357f"/>
    </linearGradient>
    <linearGradient id="sleeve" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e6404f"/><stop offset="1" stop-color="#b8202f"/>
    </linearGradient>
    <radialGradient id="apple" cx="35%" cy="30%" r="75%">
      <stop offset="0" stop-color="#ff6b6b"/><stop offset="1" stop-color="#a80f1f"/>
    </radialGradient>
    <clipPath id="mouthClip"><path id="mouthClipPath" d=""/></clipPath>
    <clipPath id="frame"><rect x="0" y="0" width="400" height="480" rx="28"/></clipPath>
  </defs>

  <g clip-path="url(#frame)">
    <rect width="400" height="480" fill="url(#forest)"/>
    <!-- стволы -->
    <path d="M40,480 L48,120 Q60,80 70,120 L80,480Z" fill="#3f5a3a" opacity=".55"/>
    <path d="M330,480 L336,90 Q346,60 356,90 L368,480Z" fill="#3f5a3a" opacity=".5"/>
    <path d="M110,480 L114,200 Q120,180 126,200 L134,480Z" fill="#3f5a3a" opacity=".35"/>
    <!-- боке -->
    <circle class="bokeh" cx="90" cy="70" r="16" fill="#fff" style="animation-delay:-1s"/>
    <circle class="bokeh" cx="300" cy="50" r="10" fill="#fff" style="animation-delay:-2.5s"/>
    <circle class="bokeh" cx="250" cy="120" r="7" fill="#fff" style="animation-delay:-.5s"/>
    <circle class="bokeh" cx="150" cy="140" r="9" fill="#fff" style="animation-delay:-3s"/>
    <circle class="bokeh" cx="360" cy="180" r="12" fill="#fff" style="animation-delay:-1.8s"/>
    <!-- листики -->
    <g fill="#8dc26f">
      <path class="leaf" d="M60,0 q8,-10 16,0 q-8,10 -16,0Z" style="animation-duration:9s;animation-delay:-2s"/>
      <path class="leaf" d="M330,0 q8,-10 16,0 q-8,10 -16,0Z" style="animation-duration:12s;animation-delay:-7s" fill="#e0b84a"/>
      <path class="leaf" d="M200,0 q7,-9 14,0 q-7,9 -14,0Z" style="animation-duration:10s;animation-delay:-4s" fill="#d97b3a"/>
    </g>

    <!-- волосы сзади -->
    <g id="hairBack">
      <path d="M110,196 C96,92 304,92 290,196 C304,240 302,276 284,300 C262,318 236,306 226,296 C210,310 190,310 174,296 C164,306 138,318 116,300 C98,276 96,240 110,196Z" fill="url(#hair)"/>
      <path d="M128,200 C122,240 126,268 140,290" stroke="#5a5a78" stroke-width="4" fill="none" opacity=".45" stroke-linecap="round"/>
      <path d="M272,200 C278,240 274,268 260,290" stroke="#5a5a78" stroke-width="4" fill="none" opacity=".45" stroke-linecap="round"/>
    </g>

    <!-- платье -->
    <g id="dress">
      <!-- юбка (жёлтая) -->
      <path d="M96,480 L108,404 Q200,380 292,404 L304,480Z" fill="#f2c94c"/>
      <path d="M150,480 L156,410 M200,480 L200,404 M250,480 L244,410" stroke="#e0b23a" stroke-width="3" opacity=".7"/>
      <!-- рукава-фонарики -->
      <g id="sleeveL"><ellipse cx="112" cy="352" rx="40" ry="34" fill="url(#sleeve)"/>
        <ellipse cx="100" cy="346" rx="6" ry="14" fill="#3b56c9"/><ellipse cx="118" cy="340" rx="6" ry="14" fill="#3b56c9"/><ellipse cx="132" cy="352" rx="5" ry="12" fill="#3b56c9"/></g>
      <g id="sleeveR"><ellipse cx="288" cy="352" rx="40" ry="34" fill="url(#sleeve)"/>
        <ellipse cx="300" cy="346" rx="6" ry="14" fill="#3b56c9"/><ellipse cx="282" cy="340" rx="6" ry="14" fill="#3b56c9"/><ellipse cx="268" cy="352" rx="5" ry="12" fill="#3b56c9"/></g>
      <!-- корсаж -->
      <path d="M128,342 Q200,318 272,342 L288,404 Q200,384 112,404Z" fill="url(#bodice)"/>
      <path d="M200,356 L200,398" stroke="#7d8fe0" stroke-width="2" opacity=".6"/>
      <path d="M176,364 L224,364 M180,378 L220,378 M184,392 L216,392" stroke="#f2c94c" stroke-width="2.5" opacity=".8"/>
      <!-- руки -->
      <ellipse cx="112" cy="396" rx="16" ry="20" fill="url(#skin)"/>
      <ellipse cx="288" cy="396" rx="16" ry="20" fill="url(#skin)"/>
      <!-- яблоко в руке -->
      <g id="appleG" transform="translate(298,388)">
        <circle cx="0" cy="0" r="26" fill="url(#apple)"/>
        <ellipse cx="-9" cy="-10" rx="7" ry="4" fill="#fff" opacity=".35" transform="rotate(-30)"/>
        <path d="M0,-24 q2,-10 6,-14" stroke="#5a3a1a" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M4,-30 q14,-8 20,2 q-12,6 -20,-2Z" fill="#6fbf4a"/>
      </g>
      <ellipse cx="286" cy="404" rx="12" ry="9" fill="url(#skin)"/>
      <!-- воротник -->
      <path d="M150,330 Q200,300 250,330 Q230,344 200,336 Q170,344 150,330Z" fill="#fff"/>
    </g>

    <!-- шея -->
    <rect x="184" y="268" width="32" height="60" rx="14" fill="#f3d6c6"/>

    <!-- птичка на плече -->
    <g id="bird" transform="translate(118,318)">
      <ellipse cx="0" cy="0" rx="20" ry="14" fill="#4aa3df"/>
      <path d="M-6,-2 q14,-12 24,-2 q-10,6 -24,2Z" fill="#2f7fc0"/>
      <circle cx="16" cy="-12" r="11" fill="#5cb2ea"/>
      <circle cx="19" cy="-14" r="2.4" fill="#111"/><circle cx="20" cy="-15" r=".8" fill="#fff"/>
      <path d="M26,-12 l9,3 l-9,3Z" fill="#f4a020"/>
      <path d="M-20,-2 l-12,-8 l4,10 l-6,6Z" fill="#2f7fc0"/>
      <path d="M-4,13 l0,7 M4,13 l0,7" stroke="#f4a020" stroke-width="2"/>
    </g>

    <!-- голова -->
    <g id="head">
      <ellipse cx="200" cy="206" rx="78" ry="88" fill="url(#skin)"/>
      <ellipse cx="124" cy="212" rx="9" ry="13" fill="#f3d6c6"/><ellipse cx="276" cy="212" rx="9" ry="13" fill="#f3d6c6"/>
      <ellipse cx="156" cy="244" rx="15" ry="9" fill="#ff7f8f" opacity=".45"/>
      <ellipse cx="244" cy="244" rx="15" ry="9" fill="#ff7f8f" opacity=".45"/>

      <g id="brows" stroke="#1c1c26" stroke-width="3" fill="none" stroke-linecap="round">
        <path d="M150,180 Q170,168 190,176"/><path d="M250,180 Q230,168 210,176"/>
      </g>

      <g id="eyeL" class="eye">
        <ellipse cx="170" cy="206" rx="16" ry="19" fill="#fff"/>
        <g class="pupil"><circle cx="171" cy="208" r="11" fill="#6b3a1e"/><circle cx="171" cy="208" r="5.5" fill="#0b0b12"/><circle cx="175" cy="203" r="3.2" fill="#fff"/><circle cx="167" cy="212" r="1.6" fill="#fff" opacity=".8"/></g>
        <path d="M153,199 Q170,184 187,199" stroke="#111" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <path d="M154,197 l-6,-5 M157,192 l-4,-6 M162,189 l-2,-6" stroke="#111" stroke-width="2.4" stroke-linecap="round"/>
      </g>
      <g id="eyeR" class="eye">
        <ellipse cx="230" cy="206" rx="16" ry="19" fill="#fff"/>
        <g class="pupil"><circle cx="229" cy="208" r="11" fill="#6b3a1e"/><circle cx="229" cy="208" r="5.5" fill="#0b0b12"/><circle cx="233" cy="203" r="3.2" fill="#fff"/><circle cx="225" cy="212" r="1.6" fill="#fff" opacity=".8"/></g>
        <path d="M213,199 Q230,184 247,199" stroke="#111" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <path d="M246,197 l6,-5 M243,192 l4,-6 M238,189 l2,-6" stroke="#111" stroke-width="2.4" stroke-linecap="round"/>
      </g>

      <path d="M199,230 q5,7 -2,10" stroke="#d9a894" stroke-width="2.4" fill="none" stroke-linecap="round"/>

      <!-- рот: губы «бантиком» -->
      <path id="mouth" d="" fill="#4a0f18" stroke="#c8283a" stroke-width="5.5" stroke-linejoin="round"/>
      <g clip-path="url(#mouthClip)">
        <ellipse id="tongue" cx="200" cy="290" rx="14" ry="8" fill="#e8657a"/>
        <ellipse id="teeth" cx="200" cy="258" rx="13" ry="4" fill="#fff"/>
      </g>

      <!-- волосы спереди + бант -->
      <g id="hairFront">
        <path d="M122,196 C112,106 176,90 200,116 C224,90 288,106 278,196 C262,154 240,150 222,170 C204,132 166,138 122,196Z" fill="url(#hair)"/>
        <path d="M138,184 C144,150 168,136 190,142" stroke="#5a5a78" stroke-width="3" fill="none" opacity=".5" stroke-linecap="round"/>
        <g id="bow" transform="translate(200,104)">
          <path d="M0,0 C-14,-22 -40,-22 -42,-4 C-40,12 -14,14 0,0Z" fill="#d62839"/>
          <path d="M0,0 C14,-22 40,-22 42,-4 C40,12 14,14 0,0Z" fill="#d62839"/>
          <path d="M-4,4 C-14,16 -26,20 -30,30 C-18,26 -8,16 -4,4Z" fill="#b51f2e"/>
          <path d="M4,4 C14,16 26,20 30,30 C18,26 8,16 4,4Z" fill="#b51f2e"/>
          <ellipse cx="0" cy="0" rx="8" ry="9" fill="#ee4a5a"/>
        </g>
        <path d="M120,150 Q200,112 280,150" stroke="#d62839" stroke-width="7" fill="none" stroke-linecap="round"/>
      </g>
    </g>
  </g>
</svg>`,
  mount(root){
    const $=s=>root.querySelector(s);
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    const el={head:$('#head'),brows:$('#brows'),mouth:$('#mouth'),clip:$('#mouthClipPath'),
      tongue:$('#tongue'),teeth:$('#teeth'),hairBack:$('#hairBack'),hairFront:$('#hairFront'),bow:$('#bow'),
      bird:$('#bird'),dress:$('#dress'),apple:$('#appleG'),
      eyes:[$('#eyeL'),$('#eyeR')],pupils:root.querySelectorAll('.pupil'),meter:$('#meter'),status:$('#status')};
    const EYE=[{x:170,y:206},{x:230,y:206}];
    
    function render(t,blink,S,dt){
      const o=S.open, L=S.level, tk=S.talk;
      // рот
      const y0=260, cy=y0+o*4, top=y0-o*9, bot=y0+5+o*34;
      const d=`M184,${cy} Q200,${top} 216,${cy} Q200,${bot} 184,${cy} Z`;
      el.mouth.setAttribute('d',d); el.clip.setAttribute('d',d);
      el.tongue.setAttribute('cy',bot-4); el.tongue.setAttribute('ry',4+o*10);
      el.teeth.setAttribute('cy',top+3); el.teeth.setAttribute('opacity',o>0.25?1:0);
    
      // голова
      const tilt=Math.sin(t*0.7)*1.8+Math.sin(t*4.6)*3.5*tk*L;
      const bob=Math.sin(t*1.3)*2.5-Math.abs(Math.sin(t*8.2))*5*L;
      el.head.setAttribute('transform',`translate(0 ${bob.toFixed(2)}) rotate(${tilt.toFixed(2)} 200 330)`);
      el.hairBack.setAttribute('transform',`translate(0 ${(bob*0.8).toFixed(2)}) rotate(${(tilt*0.7).toFixed(2)} 200 330)`);
      // бант подпрыгивает
      el.bow.setAttribute('transform',`translate(200 104) rotate(${(Math.sin(t*9)*6*L).toFixed(2)}) scale(${(1+0.08*L).toFixed(3)})`);
      // платье дышит
      el.dress.setAttribute('transform',`translate(0 ${(Math.sin(t*1.3)*1.2).toFixed(2)})`);
      // птичка кивает и подпрыгивает
      const hop=-Math.abs(Math.sin(t*7))*6*L;
      el.bird.setAttribute('transform',`translate(118 ${(318+hop+Math.sin(t*1.3)*1.2).toFixed(2)}) rotate(${(Math.sin(t*2.1)*4+Math.sin(t*11)*6*L).toFixed(2)})`);
      // брови
      el.brows.setAttribute('transform',`translate(0 ${(-7*L).toFixed(2)})`);
      // глаза
      const widen=1+0.1*clamp((L-0.7)/0.3,0,1);
      el.eyes.forEach((e,i)=>{const c=EYE[i];
        e.setAttribute('transform',`translate(${c.x} ${c.y}) scale(${widen} ${((1-blink*0.96)*widen).toFixed(3)}) translate(${-c.x} ${-c.y})`);});
      const gx=S.gaze.x*4, gy=S.gaze.y*3-1.5*tk;
      el.pupils.forEach(p=>p.setAttribute('transform',`translate(${gx.toFixed(2)} ${gy.toFixed(2)})`));
    }
    return render;
  }
};

TH_CHARS.prince={id:'prince',name:'Принц',gen:'Принца',
  phrases:['Я искал вас по всему королевству!','Позвольте пригласить вас на танец.','Мой конь устал, а я — нет!','Клянусь честью принца!','Кто здесь самая прекрасная? Не отвечайте, я знаю.','Дракон? Какой дракон? А, этот… Уже улетел.'],
  tts:{pitch:0.7,rate:0.95}, defaultVoice:'any',
  subtitle:'говорите — и он заговорит',
  theme:{"bg1": "#e3f1ff", "bg2": "#3f5f9e", "ink": "#1e2a4a", "accent": "#d4a017", "btn": "#1e2a4a", "btnText": "#eaf2ff", "shadow": "rgba(20,30,70,.35)", "meter": "linear-gradient(90deg,#6fb1ff,#ffd166,#d4a017)"},
  svg:`<svg id="char" viewBox="0 0 400 480" xmlns="http://www.w3.org/2000/svg" aria-label="Принц">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7fb8f0"/><stop offset=".6" stop-color="#cfe6fb"/><stop offset="1" stop-color="#f6e2c0"/>
    </linearGradient>
    <radialGradient id="skin" cx="45%" cy="35%" r="75%">
      <stop offset="0" stop-color="#ffe3cc"/><stop offset="1" stop-color="#f0bf9c"/>
    </radialGradient>
    <linearGradient id="hair" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7a4a24"/><stop offset="1" stop-color="#3f2410"/>
    </linearGradient>
    <linearGradient id="coat" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2f4aa8"/><stop offset="1" stop-color="#1b2c6e"/>
    </linearGradient>
    <linearGradient id="cape" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#d63a3a"/><stop offset="1" stop-color="#8f1a24"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffe08a"/><stop offset="1" stop-color="#c8931a"/>
    </linearGradient>
    <clipPath id="mouthClip"><path id="mouthClipPath" d=""/></clipPath>
    <clipPath id="frame"><rect x="0" y="0" width="400" height="480" rx="28"/></clipPath>
  </defs>

  <g clip-path="url(#frame)">
    <rect width="400" height="480" fill="url(#sky)"/>
    <!-- облака -->
    <g fill="#fff" opacity=".9">
      <g class="cloud" style="animation-duration:38s;animation-delay:-10s"><ellipse cx="60" cy="70" rx="40" ry="16"/><ellipse cx="85" cy="60" rx="28" ry="18"/><ellipse cx="35" cy="64" rx="22" ry="14"/></g>
      <g class="cloud" style="animation-duration:52s;animation-delay:-30s"><ellipse cx="60" cy="130" rx="30" ry="12"/><ellipse cx="80" cy="122" rx="22" ry="14"/></g>
    </g>
    <!-- замок -->
    <g fill="#8fa4c9" opacity=".75">
      <rect x="20" y="250" width="60" height="140"/><rect x="14" y="236" width="72" height="18"/>
      <rect x="20" y="222" width="10" height="16"/><rect x="38" y="222" width="10" height="16"/><rect x="56" y="222" width="10" height="16"/><rect x="72" y="222" width="10" height="16"/>
      <rect x="300" y="230" width="80" height="160"/><rect x="292" y="214" width="96" height="18"/>
      <rect x="300" y="198" width="12" height="18"/><rect x="322" y="198" width="12" height="18"/><rect x="344" y="198" width="12" height="18"/><rect x="366" y="198" width="12" height="18"/>
      <rect x="340" y="120" width="26" height="100"/><polygon points="334,124 353,84 372,124"/>
      <rect x="0" y="330" width="400" height="80"/>
    </g>
    <path class="flag" d="M353,84 L353,66 L378,72 L353,80Z" fill="#d63a3a"/>
    <g fill="#5d6fa0" opacity=".6"><rect x="40" y="290" width="14" height="24" rx="7"/><rect x="326" y="270" width="14" height="24" rx="7"/><rect x="350" y="270" width="14" height="24" rx="7"/></g>
    <!-- холм -->
    <path d="M0,400 Q120,360 240,395 T400,380 L400,480 L0,480Z" fill="#6aa85a"/>
    <path d="M0,420 Q140,395 400,430 L400,480 L0,480Z" fill="#4f8f47"/>

    <!-- плащ -->
    <g id="cape">
      <path d="M118,352 C90,400 80,450 84,480 L316,480 C320,450 310,400 282,352 Q200,330 118,352Z" fill="url(#cape)"/>
      <path d="M140,360 C120,410 112,450 112,480 M260,360 C280,410 288,450 288,480" stroke="#7a1520" stroke-width="3" fill="none" opacity=".4"/>
    </g>

    <!-- волосы сзади -->
    <g id="hairBack"><path d="M120,200 C106,104 294,100 280,200 C286,222 282,238 270,244 L130,244 C118,238 114,222 120,200Z" fill="url(#hair)"/></g>

    <!-- мундир -->
    <g id="body">
      <path d="M116,352 Q200,318 284,352 L292,480 L108,480Z" fill="url(#coat)"/>
      <path d="M200,346 L200,480" stroke="#ffd45e" stroke-width="3" opacity=".9"/>
      <g fill="url(#gold)"><circle cx="186" cy="380" r="5"/><circle cx="214" cy="380" r="5"/><circle cx="186" cy="410" r="5"/><circle cx="214" cy="410" r="5"/><circle cx="186" cy="440" r="5"/><circle cx="214" cy="440" r="5"/></g>
      <!-- эполеты -->
      <g fill="url(#gold)">
        <ellipse cx="122" cy="352" rx="30" ry="12"/><ellipse cx="278" cy="352" rx="30" ry="12"/>
        <path d="M96,356 l-4,16 M104,360 l-3,16 M112,362 l-2,16 M120,363 l-1,16 M128,363 l1,16 M136,362 l2,16 M144,360 l3,16" stroke="#e0b53a" stroke-width="3" stroke-linecap="round"/>
        <path d="M304,356 l4,16 M296,360 l3,16 M288,362 l2,16 M280,363 l1,16 M272,363 l-1,16 M264,362 l-2,16 M256,360 l-3,16" stroke="#e0b53a" stroke-width="3" stroke-linecap="round"/>
      </g>
      <!-- лента -->
      <path d="M150,350 L250,470" stroke="#ffd45e" stroke-width="12" opacity=".85"/>
      <circle cx="248" cy="466" r="12" fill="url(#gold)"/><circle cx="248" cy="466" r="5" fill="#d63a3a"/>
      <!-- воротник -->
      <path d="M160,338 Q200,312 240,338 L232,352 Q200,340 168,352Z" fill="#fff"/>
    </g>

    <!-- шея -->
    <rect x="182" y="268" width="36" height="60" rx="16" fill="#ecb896"/>

    <!-- голова -->
    <g id="head">
      <path d="M124,204 C120,116 280,116 276,204 C278,262 242,300 200,300 C158,300 122,262 124,204Z" fill="url(#skin)"/>
      <ellipse cx="124" cy="212" rx="9" ry="13" fill="#ecb896"/><ellipse cx="276" cy="212" rx="9" ry="13" fill="#ecb896"/>
      <ellipse cx="154" cy="242" rx="14" ry="8" fill="#ff8a7a" opacity=".28"/>
      <ellipse cx="246" cy="242" rx="14" ry="8" fill="#ff8a7a" opacity=".28"/>
      <path d="M182,284 Q200,292 218,284" stroke="#d9a07f" stroke-width="2" fill="none" opacity=".6"/>

      <g id="brows" stroke="#3f2410" stroke-width="5" fill="none" stroke-linecap="round">
        <path d="M148,180 Q170,166 192,176"/><path d="M252,180 Q230,166 208,176"/>
      </g>

      <g id="eyeL" class="eye">
        <ellipse cx="170" cy="206" rx="15" ry="16" fill="#fff"/>
        <g class="pupil"><circle cx="171" cy="208" r="10" fill="#5a3a1e"/><circle cx="171" cy="208" r="5" fill="#0b0b12"/><circle cx="175" cy="203" r="3" fill="#fff"/></g>
        <path d="M154,200 Q170,187 186,200" stroke="#2a1a10" stroke-width="3" fill="none" stroke-linecap="round"/>
      </g>
      <g id="eyeR" class="eye">
        <ellipse cx="230" cy="206" rx="15" ry="16" fill="#fff"/>
        <g class="pupil"><circle cx="229" cy="208" r="10" fill="#5a3a1e"/><circle cx="229" cy="208" r="5" fill="#0b0b12"/><circle cx="233" cy="203" r="3" fill="#fff"/></g>
        <path d="M214,200 Q230,187 246,200" stroke="#2a1a10" stroke-width="3" fill="none" stroke-linecap="round"/>
      </g>

      <path d="M198,226 q7,10 -1,16" stroke="#d09272" stroke-width="2.6" fill="none" stroke-linecap="round"/>

      <!-- рот -->
      <path id="mouth" d="" fill="#4a1a1e" stroke="#c9836a" stroke-width="4.5" stroke-linejoin="round"/>
      <g clip-path="url(#mouthClip)">
        <ellipse id="tongue" cx="200" cy="290" rx="16" ry="8" fill="#e06a76"/>
        <ellipse id="teeth" cx="200" cy="258" rx="15" ry="4" fill="#fff"/>
      </g>

      <!-- волосы спереди + корона -->
      <g id="hairFront">
        <path d="M122,200 C110,110 160,84 206,104 C236,84 292,108 278,200 C268,160 248,150 226,166 C216,138 190,130 168,148 C152,160 134,176 122,200Z" fill="url(#hair)"/>
        <path d="M150,170 C160,140 186,126 210,128" stroke="#a2703f" stroke-width="3" fill="none" opacity=".6" stroke-linecap="round"/>
        <g id="crown" transform="translate(200,98)">
          <path d="M-46,10 L-38,-30 L-18,-6 L0,-38 L18,-6 L38,-30 L46,10 Z" fill="url(#gold)" stroke="#b07f14" stroke-width="2" stroke-linejoin="round"/>
          <rect x="-46" y="6" width="92" height="14" rx="4" fill="url(#gold)" stroke="#b07f14" stroke-width="2"/>
          <circle cx="0" cy="-30" r="5" fill="#d63a3a"/><circle cx="-38" cy="-24" r="4" fill="#2f8fdc"/><circle cx="38" cy="-24" r="4" fill="#2f8fdc"/>
          <circle cx="-20" cy="13" r="3.5" fill="#d63a3a"/><circle cx="0" cy="13" r="3.5" fill="#2f8fdc"/><circle cx="20" cy="13" r="3.5" fill="#d63a3a"/>
        </g>
      </g>
    </g>
  </g>
</svg>`,
  mount(root){
    const $=s=>root.querySelector(s);
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    const el={head:$('#head'),brows:$('#brows'),mouth:$('#mouth'),clip:$('#mouthClipPath'),
      tongue:$('#tongue'),teeth:$('#teeth'),hairBack:$('#hairBack'),hairFront:$('#hairFront'),crown:$('#crown'),
      cape:$('#cape'),body:$('#body'),
      eyes:[$('#eyeL'),$('#eyeR')],pupils:root.querySelectorAll('.pupil')};
    const EYE=[{x:170,y:206},{x:230,y:206}];
    
    // «выбирает между Белоснежкой и Русалочкой»: взгляд влево — пауза — вправо — обратно
    const G={next:3+Math.random()*3, t:-1, x:0, hx:0, brow:0};
    const PH=[[0.3,-1],[0.8,-1],[0.45,1],[0.8,1],[0.35,0]];   // [длительность, куда смотреть]
    function glance(dt){
      if(G.t<0){ G.next-=dt; if(G.next<=0){G.t=0;} }
      let target=0, active=false;
      if(G.t>=0){ G.t+=dt; let acc=0; active=true;
        for(const [d,dir] of PH){ if(G.t<acc+d){ target=dir; break; } acc+=d; }
        if(G.t>=acc){ G.t=-1; G.next=5+Math.random()*6; target=0; active=false; }
      }
      const k=1-Math.exp(-dt/0.12);
      G.x+=(target-G.x)*k; G.hx+=(target*0.6-G.hx)*(1-Math.exp(-dt/0.25)); G.brow+=((active?1:0)-G.brow)*(1-Math.exp(-dt/0.2));
      return active;
    }
    function render(t,blink,S,dt){
      const o=S.open, L=S.level, tk=S.talk;
      const choosing=glance(dt);
      // рот
      const y0=262, cy=y0+o*4, top=y0-o*9, bot=y0+5+o*36;
      const d=`M182,${cy} Q200,${top} 218,${cy} Q200,${bot} 182,${cy} Z`;
      el.mouth.setAttribute('d',d); el.clip.setAttribute('d',d);
      el.tongue.setAttribute('cy',bot-4); el.tongue.setAttribute('ry',4+o*10);
      el.teeth.setAttribute('cy',top+3); el.teeth.setAttribute('opacity',o>0.25?1:0);
      // голова — уверенные кивки
      const tilt=Math.sin(t*0.6)*1.5+Math.sin(t*4.2)*3*tk*L+G.hx*3;
      const bob=Math.sin(t*1.2)*2-Math.abs(Math.sin(t*7.5))*6*L;
      el.head.setAttribute('transform',`translate(${(G.hx*6).toFixed(2)} ${bob.toFixed(2)}) rotate(${tilt.toFixed(2)} 200 330)`);
      el.hairBack.setAttribute('transform',`translate(${(G.hx*5).toFixed(2)} ${(bob*0.8).toFixed(2)}) rotate(${(tilt*0.7).toFixed(2)} 200 330)`);
      el.crown.setAttribute('transform',`translate(200 ${(98-2*L).toFixed(2)}) rotate(${(Math.sin(t*8)*2*L).toFixed(2)})`);
      // плащ колышется
      el.cape.setAttribute('transform',`rotate(${(Math.sin(t*0.9)*1.2+Math.sin(t*5)*1.5*L).toFixed(2)} 200 352) translate(0 ${(Math.sin(t*1.2)*1.2).toFixed(2)})`);
      el.body.setAttribute('transform',`translate(0 ${(Math.sin(t*1.2)*1.2).toFixed(2)})`);
      // брови
      el.brows.setAttribute('transform',`translate(0 ${(-6*L-3*G.brow).toFixed(2)}) rotate(${(-2.5*G.brow*G.x).toFixed(2)} 200 176)`);
      // глаза
      const widen=1+0.08*clamp((L-0.7)/0.3,0,1);
      el.eyes.forEach((e,i)=>{const c=EYE[i];
        e.setAttribute('transform',`translate(${c.x} ${c.y}) scale(${widen} ${((1-blink*0.96)*widen).toFixed(3)}) translate(${-c.x} ${-c.y})`);});
      const gx=S.gaze.x*4*(1-Math.abs(G.x))+G.x*8, gy=(S.gaze.y*3-1.5*tk)*(1-Math.abs(G.x))+0.5*Math.abs(G.x);
      el.pupils.forEach(p=>p.setAttribute('transform',`translate(${gx.toFixed(2)} ${gy.toFixed(2)})`));
    }
    return render;
  }
};
