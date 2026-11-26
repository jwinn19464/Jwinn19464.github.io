(function(){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
  const hot=window.claude?.hot;

  const ICONS={
    note:'<path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>',
    hex:'<path d="M12 3l7 4v8l-7 4-7-4V7z"/><path d="M12 8l3.5 2v4L12 16l-3.5-2v-4z"/>',
    eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    graph:'<circle cx="5" cy="6" r="2"/><circle cx="19" cy="7" r="2"/><circle cx="12" cy="18" r="2"/><circle cx="12" cy="10" r="2"/><path d="M7 7l3 2M14 10l3-2M12 12v4"/>',
    bars:'<path d="M4 20V11M10 20V4M16 20v-7M21 20H3"/>',
    key:'<circle cx="7" cy="12" r="4"/><path d="M11 12h10M18 12v3M21 12v2"/>',
    bun:'<path d="M4 16c0-5 3.5-8 8-8s8 3 8 8z"/><path d="M12 8c-1 1.5-1 3 0 4M9 9c0 1.5.5 2.5 1.5 3M15 9c0 1.5-.5 2.5-1.5 3"/><path d="M3 16h18"/>',
    cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    star:'<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>',
    hola:'<text x="12" y="15" text-anchor="middle">HOLA</text>',
    sigma:'<path d="M17 5H7l6 7-6 7h10"/>',
    keys:'<rect x="3" y="6" width="18" height="12" rx="1"/><path d="M7.5 6v8M12 6v8M16.5 6v8"/>',
    code:'<path d="M8 8l-4 4 4 4M16 8l4 4-4 4"/>',
    book:'<path d="M4 5h7v14H4zM13 5h7v14h-7z"/>',
    chalk:'<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M7 20l5-4 5 4M7 9h6M7 12h9"/>',
    cart:'<path d="M3 4h3l2 11h11l2-8H7"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
    mtn:'<path d="M2 19l7-11 5 7 3-4 5 8z"/>',
    game:'<rect x="2" y="8" width="20" height="10" rx="5"/><path d="M7 11v4M5 13h4"/><circle cx="16" cy="12" r="1"/><circle cx="18" cy="14" r="1"/>',
    house:'<path d="M3 11l9-7 9 7v9H3z"/><path d="M10 20v-6h4v6"/>',
    door:'<rect x="6" y="3" width="12" height="18" rx="1"/><circle cx="15" cy="12" r="1"/>',
    pen:'<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/>',
    chat:'<path d="M4 5h16v10H9l-5 4z"/>',
    mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    flag:'<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>'
  };
  const svg=k=>`<svg viewBox="0 0 24 24">${ICONS[k]||''}</svg>`;

  /* Theme */
  const themeBtn=document.getElementById('themeBtn');
  function isLight(){const t=document.documentElement.dataset.theme;return t?t==='light':matchMedia('(prefers-color-scheme: light)').matches}
  function syncThemeBtn(){themeBtn.textContent=isLight()?'◐ Dark':'◐ Light'}
  const savedTheme=store.get('jn-theme');if(savedTheme)document.documentElement.dataset.theme=savedTheme;
  syncThemeBtn();
  new MutationObserver(syncThemeBtn).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  themeBtn.addEventListener('click',()=>{const t=isLight()?'dark':'light';document.documentElement.dataset.theme=t;store.set('jn-theme',t);unlock('lights')});

  /* Stats */
  if(document.getElementById('stats'))document.getElementById('stats').innerHTML=[["Curiosity",98],["Whimsy",97],["Showmanship",94],["Explaining things",95],["Rigor",88],["Patience with bugs",71]]
    .map(([n,v])=>`<div class="stat"><span>${n}</span><div class="bar"><i style="width:${v}%"></i></div><b>${v}</b></div>`).join('');

  /* Night sky: twinkling stars and drifting light shards */
  (function(){
    const cv=document.getElementById('sky'),g=cv.getContext('2d');let W,H,stars=[],shards=[],col='#fff',alpha=.75,last=0;
    function size(){const d=Math.min(2,devicePixelRatio||1);W=cv.width=innerWidth*d;H=cv.height=innerHeight*d;cv.style.width=innerWidth+'px';cv.style.height=innerHeight+'px';
      stars=Array.from({length:Math.round(innerWidth*innerHeight/9000)},()=>({x:Math.random()*W,y:Math.random()*H,r:(Math.random()*1.2+.3)*d,p:Math.random()*6.28,s:.4+Math.random()*1.2}));
      shards=Array.from({length:10},()=>({x:Math.random()*W,y:Math.random()*H,r:(4+Math.random()*7)*d,v:(.08+Math.random()*.18)*d,a:Math.random()*6.28,c:Math.random()<.5}))}
    function readColors(){const cs=getComputedStyle(document.documentElement);col=cs.getPropertyValue('--star').trim()||'#fff';alpha=+cs.getPropertyValue('--star-alpha')||.7}
    function frame(t){
      if(t-last>1000){readColors();last=t}
      g.clearRect(0,0,W,H);g.fillStyle=col;
      stars.forEach(st=>{g.globalAlpha=alpha*(.35+.65*(.5+.5*Math.sin(st.p+t/1000*st.s)));g.beginPath();g.arc(st.x,st.y,st.r,0,6.3);g.fill()});
      const cs=getComputedStyle(document.documentElement);
      shards.forEach(sh=>{sh.y-=sh.v;sh.a+=.003;if(sh.y<-20){sh.y=H+20;sh.x=Math.random()*W}
        g.save();g.translate(sh.x,sh.y);g.rotate(sh.a);g.globalAlpha=alpha*.55;g.strokeStyle=sh.c?cs.getPropertyValue('--mint'):cs.getPropertyValue('--pink');g.lineWidth=1.2;
        g.beginPath();g.moveTo(0,-sh.r);g.lineTo(sh.r*.55,0);g.lineTo(0,sh.r);g.lineTo(-sh.r*.55,0);g.closePath();g.stroke();g.restore()});
      g.globalAlpha=1;
      if(!reduce&&!document.hidden)requestAnimationFrame(frame);
    }
    size();readColors();addEventListener('resize',()=>{size();if(reduce)frame(0)});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!reduce)requestAnimationFrame(frame)});
    new MutationObserver(()=>{readColors();if(reduce)frame(0)}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
    requestAnimationFrame(frame);
  })();

  /* Achievements */
  const TROPHIES={
    opening:"First Step: you arrived",
    museum:"Explorer: stepped through a portal",
    critic:"Collector: read five memories",
    allrooms:"Cartographer: visited every area",
    lens:"Lens Crafter: played with the blur demo",
    maestro:"Maestro: played five notes",
    lights:"Day and Night: switched the light",
    tinker:"Tinkerer: opened an app behind a portal",
    player:"Speedrunner: finished the platformer level",
    ovation:"Secret Path: entered the secret code"
  };
  let got=new Set(hot?.data?.trophies||JSON.parse(store.get('jn-trophies')||'[]'));
  hot?.snapshot?.(()=>({trophies:[...got]}));
  const toast=document.getElementById('toast');let tt;
  function renderTrophies(){
    document.getElementById('trophyCount').textContent=got.size;
    document.getElementById('xpFill').style.width=(got.size/Object.keys(TROPHIES).length*100)+'%';
    document.getElementById('trophyList').innerHTML=Object.entries(TROPHIES).map(([k,v])=>`<li class="${got.has(k)?'got':''}">${got.has(k)?v:'??? (locked)'}</li>`).join('');
  }
  function unlock(k){
    if(got.has(k))return;got.add(k);store.set('jn-trophies',JSON.stringify([...got]));renderTrophies();
    if(document.body.classList.contains('plain'))return;
    toast.innerHTML=`<b>✦ Achievement</b> · ${TROPHIES[k]}`;toast.classList.add('show');
    clearTimeout(tt);tt=setTimeout(()=>toast.classList.remove('show'),2600);
  }
  renderTrophies();setTimeout(()=>unlock('opening'),900);
  const tb=document.getElementById('trophyBtn'),tl=document.getElementById('trophyList');
  tb.addEventListener('click',()=>{const o=tl.hidden;tl.hidden=!o;tb.setAttribute('aria-expanded',String(o))});

  /* Plain mode */
  const modeBtn=document.getElementById('modeBtn');
  function setPlain(on){document.body.classList.toggle('plain',on);modeBtn.setAttribute('aria-pressed',String(on));modeBtn.textContent=on?'Show mode':'Plain mode';store.set('jn-plain',on?'1':'0')}
  setPlain(store.get('jn-plain')==='1');
  modeBtn.addEventListener('click',()=>setPlain(!document.body.classList.contains('plain')));

  /* Widgets that live inside exhibit labels */
  const WIDGETS={
    blur(box){
      box.innerHTML=`<div class="blurbox"><canvas width="240" height="140" aria-label="Test image blurred with a Gaussian kernel"></canvas>
        <div class="sliders"><label for="kSize">Kernel size <b id="kSizeV"></b></label><input type="range" id="kSize" min="1" max="31" step="2" value="9">
        <label for="kSigma">Sigma <b id="kSigmaV"></b></label><input type="range" id="kSigma" min="0.5" max="15" step="0.5" value="1.5"></div>
        <p id="blurNote" aria-live="polite" style="font-size:14px"></p></div>`;
      const c=box.querySelector('canvas'),g=c.getContext('2d'),W=240,H=140;
      const src=document.createElement('canvas');src.width=W;src.height=H;const s=src.getContext('2d');
      for(let y=0;y<H;y+=14)for(let x=0;x<W;x+=14){s.fillStyle=((x+y)/14)%2?'#271842':'#bdb5a8';s.fillRect(x,y,14,14)}
      s.fillStyle='#cfae66';s.beginPath();s.arc(170,70,38,0,7);s.fill();s.fillStyle='#6aae99';s.fillRect(30,40,60,60);
      s.fillStyle='#6e1634';s.font='bold 30px Georgia';s.fillText('CV',150,82);
      const base=s.getImageData(0,0,W,H).data,kS=box.querySelector('#kSize'),kG=box.querySelector('#kSigma');
      function render(){
        const size=+kS.value,sig=+kG.value,r=size>>1;box.querySelector('#kSizeV').textContent=size;box.querySelector('#kSigmaV').textContent=sig;
        const k=[];let sum=0;for(let i=-r;i<=r;i++){const v=Math.exp(-(i*i)/(2*sig*sig));k.push(v);sum+=v}k.forEach((v,i)=>k[i]=v/sum);
        const tmp=new Float32Array(W*H*3),out=g.createImageData(W,H);
        for(let y=0;y<H;y++)for(let x=0;x<W;x++)for(let ch=0;ch<3;ch++){let a=0;for(let i=-r;i<=r;i++){const xx=Math.min(W-1,Math.max(0,x+i));a+=base[(y*W+xx)*4+ch]*k[i+r]}tmp[(y*W+x)*3+ch]=a}
        for(let y=0;y<H;y++)for(let x=0;x<W;x++){for(let ch=0;ch<3;ch++){let a=0;for(let i=-r;i<=r;i++){const yy=Math.min(H-1,Math.max(0,y+i));a+=tmp[(yy*W+x)*3+ch]*k[i+r]}out.data[(y*W+x)*4+ch]=a}out.data[(y*W+x)*4+3]=255}
        g.putImageData(out,0,0);
        box.querySelector('#blurNote').textContent=size<3*sig?"Kernel too small for this sigma: it acts like a box filter. Rule of thumb: size ≈ 6 × sigma.":"A proper Gaussian: the kernel is wide enough for its sigma.";
      }
      let raf;[kS,kG].forEach(el=>el.addEventListener('input',()=>{unlock('lens');cancelAnimationFrame(raf);raf=requestAnimationFrame(render)}));render();
    },
    piano(box){
      const notes=[["C",261.63,"a"],["D",293.66,"s"],["E",329.63,"d"],["F",349.23,"f"],["G",392,"g"],["A",440,"h"],["B",493.88,"j"],["C",523.25,"k"]];
      box.innerHTML=`<div class="piano">${notes.map(([n],i)=>`<button class="key" data-i="${i}" aria-label="Play ${n}">${n}</button>`).join('')}</div><p style="font-size:13px">Click, or type A S D F G H J K.</p>`;
      let ctx,played=0;const keys=box.querySelector('.piano');
      function play(i){
        try{ctx=ctx||new (window.AudioContext||window.webkitAudioContext)();const o=ctx.createOscillator(),gn=ctx.createGain(),t=ctx.currentTime;
          o.type='triangle';o.frequency.value=notes[i][1];gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(.22,t+.02);gn.gain.exponentialRampToValueAtTime(.001,t+1.1);
          o.connect(gn).connect(ctx.destination);o.start(t);o.stop(t+1.2)}catch(e){}
        const k=keys.children[i];k.classList.add('down');setTimeout(()=>k.classList.remove('down'),150);if(++played>=5)unlock('maestro');
      }
      keys.addEventListener('click',e=>{const k=e.target.closest('.key');if(k)play(+k.dataset.i)});
      box.closest('.label').addEventListener('keydown',e=>{const i=notes.findIndex(n=>n[2]===e.key.toLowerCase());if(i>=0)play(i)});
    }
  };

  const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const el=(h)=>{const t=document.createElement('template');t.innerHTML=h.trim();return t.content.firstElementChild};
  function canvasPoint(cv,e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*cv.width/r.width,y:(e.clientY-r.top)*cv.height/r.height}}

  const DEMOS={};

  /* DerivativeLab: drag along a curve, see the tangent and the derivative */
  DEMOS.derivative=function(box){
    const F={
      'sin(x)':[x=>Math.sin(x),'cos(x)'],
      'x² / 4':[x=>x*x/4,'x / 2'],
      'x³ / 10 − x':[x=>x*x*x/10-x,'3x² / 10 − 1'],
      'eˣ / 8':[x=>Math.exp(x)/8,'eˣ / 8'],
      '|x|':[x=>Math.abs(x),'−1, 1, undefined at 0']
    };
    box.innerHTML=`<div class="ctl"><label>f(x) = <select id="dfn">${Object.keys(F).map(k=>`<option>${k}</option>`).join('')}</select></label>
      <label style="flex:1">x₀ <input type="range" id="dx" min="-6" max="6" step="0.01" value="1"></label></div>
      <canvas width="720" height="340" class="appcv" aria-label="Graph of f, its derivative and a tangent line"></canvas>
      <p class="readout" id="dread"></p>
      <p class="hint">Drag on the graph to move the point. <span style="color:var(--gold)">■ f(x)</span> <span style="color:var(--mint)">■ f′(x)</span> <span style="color:#c0506e">■ tangent</span></p>`;
    const cv=box.querySelector('canvas'),g=cv.getContext('2d'),sel=box.querySelector('#dfn'),sl=box.querySelector('#dx');
    const W=cv.width,H=cv.height,X=x=>(x+6.5)/13*W,Y=y=>H/2-y*(H/9);
    function draw(){
      const [f,dname]=F[sel.value],x0=+sl.value,h=1e-4,d=x=>(f(x+h)-f(x-h))/(2*h);
      g.fillStyle=css('--card2');g.fillRect(0,0,W,H);
      g.strokeStyle=css('--line');g.lineWidth=1;
      for(let i=-6;i<=6;i++){g.beginPath();g.moveTo(X(i),0);g.lineTo(X(i),H);g.stroke()}
      for(let j=-4;j<=4;j++){g.beginPath();g.moveTo(0,Y(j));g.lineTo(W,Y(j));g.stroke()}
      g.strokeStyle=css('--muted');g.lineWidth=1.5;g.beginPath();g.moveTo(0,Y(0));g.lineTo(W,Y(0));g.moveTo(X(0),0);g.lineTo(X(0),H);g.stroke();
      const plot=(fn,col,w)=>{g.strokeStyle=col;g.lineWidth=w;g.beginPath();let pen=false;for(let px=0;px<=W;px++){const x=px/W*13-6.5,y=fn(x);if(!isFinite(y)||Math.abs(y)>20){pen=false;continue}pen?g.lineTo(px,Y(y)):g.moveTo(px,Y(y));pen=true}g.stroke()};
      plot(d,css('--mint'),2);plot(f,css('--gold'),3);
      const y0=f(x0),m=d(x0),kink=sel.value==='|x|'&&Math.abs(x0)<0.02;
      if(!kink){g.strokeStyle='#c0506e';g.lineWidth=2;g.setLineDash([6,5]);g.beginPath();g.moveTo(X(-6.5),Y(y0+m*(-6.5-x0)));g.lineTo(X(6.5),Y(y0+m*(6.5-x0)));g.stroke();g.setLineDash([])}
      g.fillStyle=css('--text');g.beginPath();g.arc(X(x0),Y(y0),6,0,7);g.fill();
      g.fillStyle=css('--mint');g.beginPath();g.arc(X(x0),Y(m),4,0,7);g.fill();
      box.querySelector('#dread').textContent=`x₀ = ${x0.toFixed(2)}   f(x₀) = ${y0.toFixed(3)}   slope f′(x₀) = ${kink?'undefined (sharp corner)':m.toFixed(3)}   ·   f′(x) = ${dname}`;
    }
    let drag=false;
    const move=e=>{const p=canvasPoint(cv,e);sl.value=Math.max(-6,Math.min(6,p.x/W*13-6.5));draw()};
    cv.addEventListener('pointerdown',e=>{drag=true;cv.setPointerCapture(e.pointerId);move(e)});
    cv.addEventListener('pointermove',e=>{if(drag)move(e)});
    cv.addEventListener('pointerup',()=>drag=false);
    sel.addEventListener('change',draw);sl.addEventListener('input',draw);
    draw();return{redraw:draw};
  };

  /* Fridge Oracle: the "what should I cook" step, on a sample fridge */
  DEMOS.fridge=function(box){
    const today=new Date();today.setHours(0,0,0,0);
    const iso=d=>new Date(today.getTime()+d*864e5).toISOString().slice(0,10);
    let items=[['spinach',1],['eggs',9],['milk',3],['chicken',-1],['cheddar',14],['tortillas',5],['tomatoes',2],['rice',300],['yogurt',0],['bell pepper',4],['garlic',30],['black beans',400],['pasta',500]].map(([n,d])=>({n,date:iso(d),have:true}));
    const RECIPES=[
      ['Spinach & cheddar omelette',['eggs','spinach','cheddar']],
      ['Chicken quesadillas',['chicken','tortillas','cheddar','bell pepper']],
      ['Veggie fried rice',['rice','eggs','bell pepper','garlic']],
      ['Black bean tacos',['black beans','tortillas','tomatoes','cheddar']],
      ['Tomato garlic pasta',['pasta','tomatoes','garlic']],
      ['Green smoothie',['yogurt','spinach','milk']],
      ['Shakshuka',['eggs','tomatoes','bell pepper','garlic']],
      ['Creamy tomato rice',['rice','tomatoes','milk','cheddar']]
    ];
    box.innerHTML=`<div class="split">
      <div><h4 class="sub">Your fridge <span class="tag">sample</span></h4><div id="frList" class="frlist"></div>
        <form id="frAdd" class="ctl" style="margin-top:8px"><input id="frName" placeholder="Add an item" aria-label="Item name" required><input id="frDate" type="date" aria-label="Expiration date" required><button class="mini">Add</button></form></div>
      <div><h4 class="sub">Cook these first</h4><div id="frRec"></div></div></div>
      <p class="hint">This demo runs only the last step, recipe ranking, on a sample inventory. In the full pipeline the inventory and dates come from the vision stages above. Edit dates or add items to see the ranking change.</p>`;
    const days=it=>Math.round((new Date(it.date+'T00:00')-today)/864e5);
    const status=d=>d<0?['Expired','bad']:d===0?['Use today','warn']:d<=3?['Soon','warn']:['Good','ok'];
    function render(){
      box.querySelector('#frList').innerHTML=items.map((it,i)=>{const d=days(it),[s,c]=status(d);return `<div class="frrow ${it.have?'':'off'}">
        <label><input type="checkbox" data-h="${i}" ${it.have?'checked':''}> ${it.n}</label>
        <input type="date" data-d="${i}" value="${it.date}" aria-label="${it.n} expiration date"><span class="chip ${c}">${s}</span></div>`}).join('');
      const stock={};items.forEach(it=>{if(it.have&&days(it)>=0)stock[it.n]=days(it)});
      const tossed=items.filter(it=>it.have&&days(it)<0).map(it=>it.n);
      const ranked=RECIPES.map(([name,ing])=>{const missing=ing.filter(i=>!(i in stock));const score=ing.reduce((a,i)=>a+(i in stock?1/(stock[i]+1):0),0);
        const urgent=ing.filter(i=>i in stock&&stock[i]<=3).sort((a,b)=>stock[a]-stock[b]);return{name,ing,missing,score,urgent}})
        .filter(r=>r.missing.length<=1).sort((a,b)=>a.missing.length-b.missing.length||b.score-a.score).slice(0,4);
      box.querySelector('#frRec').innerHTML=(ranked.length?ranked.map((r,i)=>`<div class="rec"><b>${i+1}. ${r.name}</b>
        <span>${r.urgent.length?'Uses up: '+r.urgent.map(u=>`${u} (${stock[u]===0?'today':stock[u]+'d'})`).join(', '):'Nothing urgent in this one'}</span>
        ${r.missing.length?`<span class="miss">Need to buy: ${r.missing[0]}</span>`:'<span class="okk">You have everything</span>'}</div>`).join(''):'<p>Nothing matches. Time for groceries.</p>')
        +(tossed.length?`<p class="toss">Toss: ${tossed.join(', ')} (past the date)</p>`:'');
    }
    box.addEventListener('change',e=>{const h=e.target.dataset.h,d=e.target.dataset.d;if(h!==undefined)items[h].have=e.target.checked;if(d!==undefined&&e.target.value)items[d].date=e.target.value;render()});
    box.querySelector('#frAdd').addEventListener('submit',e=>{e.preventDefault();const n=box.querySelector('#frName').value.trim().toLowerCase(),dt=box.querySelector('#frDate').value;if(!n||!dt)return;items.unshift({n,date:dt,have:true});e.target.reset();render()});
    box.querySelector('#frDate').value=iso(2);
    render();
  };

  /* DealDish: build a basket from deals, see what you can cook */
  DEMOS.dealdish=function(box){
    const DEALS=[['chicken thighs',4.99,7.49],['tortillas',2.29,3.19],['cheddar',2.99,4.49],['bell peppers',2.50,3.75],['black beans',0.89,1.29],['rice',2.49,3.29],['eggs',2.99,3.99],['spinach',2.00,3.49],['pasta',1.00,1.79],['tomatoes',1.99,2.99],['garlic',0.69,0.99],['yogurt',3.49,4.99]];
    const R=[['Chicken fajita bowls',['chicken thighs','bell peppers','rice','tortillas']],['Bean & cheese burritos',['tortillas','black beans','cheddar','rice']],['Spinach frittata',['eggs','spinach','cheddar']],['Garlic tomato pasta',['pasta','tomatoes','garlic']],['Egg fried rice',['rice','eggs','garlic','bell peppers']],['Chicken & spinach pasta',['chicken thighs','spinach','pasta','garlic']]];
    const basket=new Set(['tortillas','black beans','cheddar']);
    box.innerHTML=`<div class="split"><div><h4 class="sub">This week’s deals <span class="tag">sample prices</span></h4><div class="deals" id="ddDeals"></div></div>
      <div><h4 class="sub">Your basket</h4><p id="ddTot" class="readout"></p><div id="ddRec"></div></div></div>
      <p class="hint">The real DealDish pulls live prices from the Kroger API, cleans up item names with an LLM, and finds recipes with Spoonacular.</p>`;
    function render(){
      box.querySelector('#ddDeals').innerHTML=DEALS.map(([n,p,w])=>`<button class="deal ${basket.has(n)?'on':''}" data-n="${n}" aria-pressed="${basket.has(n)}"><b>${n}</b><span>$${p.toFixed(2)} <s>$${w.toFixed(2)}</s></span><i>−${Math.round((1-p/w)*100)}%</i></button>`).join('');
      let tot=0,save=0;DEALS.forEach(([n,p,w])=>{if(basket.has(n)){tot+=p;save+=w-p}});
      box.querySelector('#ddTot').textContent=`${basket.size} items · $${tot.toFixed(2)} · you save $${save.toFixed(2)}`;
      const recs=R.map(([name,ing])=>({name,miss:ing.filter(i=>!basket.has(i))})).sort((a,b)=>a.miss.length-b.miss.length).slice(0,4);
      box.querySelector('#ddRec').innerHTML=recs.map(r=>`<div class="rec"><b>${r.name}</b>${r.miss.length?`<span class="miss">Add: ${r.miss.join(', ')}</span>`:'<span class="okk">Ready to cook</span>'}</div>`).join('');
    }
    box.addEventListener('click',e=>{const b=e.target.closest('.deal');if(!b)return;const n=b.dataset.n;basket.has(n)?basket.delete(n):basket.add(n);render()});
    render();
  };

  /* The Key-Trading Game: a toy simulation of trust, betrayal and forgery */
  DEMOS.keygame=function(box){
    box.innerHTML=`<div class="ctl">
      <label>Agents <input type="range" id="kgN" min="6" max="24" value="14"> <b id="kgNv">14</b></label>
      <label>Defectors <input type="range" id="kgD" min="0" max="60" value="25"> <b id="kgDv">25%</b></label>
      <label><input type="checkbox" id="kgG" checked> “God” agent forges messages</label>
      <button class="mini" id="kgRun">Pause</button><button class="mini" id="kgStep">Step</button><button class="mini" id="kgReset">Reset</button></div>
      <div class="split wide"><canvas width="460" height="400" class="appcv" aria-label="Agents in a circle trading keys"></canvas>
      <div><p class="readout" id="kgStats"></p><h4 class="sub">Agents explain themselves</h4><ol class="log" id="kgLog"></ol></div></div>
      <p class="hint">A toy model, not the hackathon code: honest agents trade with whoever they trust, defectors take keys without paying, and the God agent sends forged betrayal reports. <span style="color:var(--mint)">— trade</span> <span style="color:#c0506e">— defection</span> <span style="color:#b48ad8">- - forged message</span></p>`;
    const cv=box.querySelector('canvas'),g=cv.getContext('2d');let A=[],links=[],t=0,running=!reduce,forged=0,defs=0,timer;
    function reset(){
      const n=+box.querySelector('#kgN').value,dr=+box.querySelector('#kgD').value/100;
      A=Array.from({length:n},(_,i)=>({id:'A'+(i+1),keys:5,def:Math.random()<dr,trust:Array(n).fill(0.6)}));
      links=[];t=0;forged=0;defs=0;box.querySelector('#kgLog').innerHTML='';stats();draw();
    }
    const log=s=>{const l=box.querySelector('#kgLog');l.insertAdjacentHTML('afterbegin',`<li>${s}</li>`);while(l.children.length>8)l.lastChild.remove()};
    function pick(i){const w=A.map((b,j)=>j===i?0:Math.max(.02,A[i].trust[j]));let r=Math.random()*w.reduce((a,b)=>a+b,0);for(let j=0;j<w.length;j++){r-=w[j];if(r<=0)return j}return(i+1)%A.length}
    function tick(){
      t++;const i=Math.random()*A.length|0,j=pick(i),a=A[i],b=A[j];
      if(box.querySelector('#kgG').checked&&Math.random()<.18){
        const v=Math.random()*A.length|0,s=pick(v);A[v].trust[s]=Math.max(0,A[v].trust[s]-.25);forged++;
        links.push({i:v,j:s,c:'#b48ad8',dash:true,life:40});
        log(`<b>${A[v].id}</b> now distrusts <b>${A[s].id}</b>: “I got a report that ${A[s].id} cheated someone.” <em>(forged)</em>`);return;
      }
      if(a.trust[j]<.25){log(`<b>${a.id}</b> refused <b>${b.id}</b>: “${b.id} has burned me before.”`);return}
      const aCheat=a.def&&Math.random()<.7,bCheat=b.def&&Math.random()<.7;
      if(a.keys<1||b.keys<1)return;
      if(aCheat&&!bCheat){b.keys--;a.keys++;b.trust[i]=Math.max(0,b.trust[i]-.35);defs++;links.push({i,j,c:'#c0506e',life:40});log(`<b>${a.id}</b> took a key from <b>${b.id}</b> and paid nothing. ${b.id}: “Never again.”`)}
      else if(bCheat&&!aCheat){a.keys--;b.keys++;a.trust[j]=Math.max(0,a.trust[j]-.35);defs++;links.push({i,j,c:'#c0506e',life:40});log(`<b>${b.id}</b> kept <b>${a.id}</b>’s key. ${a.id}: “Lesson learned.”`)}
      else if(!aCheat&&!bCheat){a.trust[j]=Math.min(1,a.trust[j]+.08);b.trust[i]=Math.min(1,b.trust[i]+.08);links.push({i,j,c:css('--mint'),life:30});if(Math.random()<.35)log(`<b>${a.id}</b> traded with <b>${b.id}</b>: “${b.id} has kept every deal so far.”`)}
      else{a.trust[j]=Math.max(0,a.trust[j]-.2);b.trust[i]=Math.max(0,b.trust[i]-.2)}
      stats();
    }
    function stats(){
      const rep=A.map((_,j)=>A.reduce((s,o,i)=>i===j?s:s+o.trust[j],0)/(A.length-1));
      const lead=A.map((a,j)=>({a,score:a.keys+rep[j]*5})).sort((x,y)=>y.score-x.score)[0];
      box.querySelector('#kgStats').innerHTML=`Round ${t} · real defections ${defs} · forged reports ${forged}<br>Emerging leader: <b>${lead?lead.a.id:'–'}</b> (${lead?lead.a.keys:0} keys, ${lead&&lead.a.def?'a defector':'honest'})`;
    }
    function draw(){
      const W=cv.width,H=cv.height,cx=W/2,cy=H/2,R=Math.min(W,H)/2-44;
      g.fillStyle=css('--card2');g.fillRect(0,0,W,H);
      const P=A.map((_,i)=>({x:cx+R*Math.cos(i/A.length*Math.PI*2-Math.PI/2),y:cy+R*Math.sin(i/A.length*Math.PI*2-Math.PI/2)}));
      links=links.filter(l=>l.life-->0&&P[l.i]&&P[l.j]);
      links.forEach(l=>{g.globalAlpha=Math.min(1,l.life/20);g.strokeStyle=l.c;g.lineWidth=2;g.setLineDash(l.dash?[5,5]:[]);g.beginPath();g.moveTo(P[l.i].x,P[l.i].y);g.lineTo(P[l.j].x,P[l.j].y);g.stroke()});
      g.globalAlpha=1;g.setLineDash([]);
      if(box.querySelector('#kgG').checked){g.fillStyle='#b48ad8';g.font='bold 13px sans-serif';g.textAlign='center';g.fillText('GOD',cx,cy+4)}
      A.forEach((a,i)=>{const r=10+Math.min(14,a.keys*1.3);g.fillStyle=a.def?'#8a2d4a':'#2f5e57';g.beginPath();g.arc(P[i].x,P[i].y,r,0,7);g.fill();
        g.fillStyle='#f0e8da';g.font='11px sans-serif';g.textAlign='center';g.fillText(a.id,P[i].x,P[i].y+4);
        g.fillStyle=css('--muted');g.fillText(a.keys+' keys',P[i].x,P[i].y+r+13)});
    }
    function loop(){if(running){tick();}draw();timer=setTimeout(loop,running?220:400)}
    box.querySelector('#kgRun').addEventListener('click',e=>{running=!running;e.target.textContent=running?'Pause':'Run'});
    box.querySelector('#kgRun').textContent=running?'Pause':'Run';
    box.querySelector('#kgStep').addEventListener('click',()=>{tick();draw()});
    box.querySelector('#kgReset').addEventListener('click',reset);
    ['kgN','kgD'].forEach(id=>box.querySelector('#'+id).addEventListener('input',e=>{box.querySelector('#'+id+'v').textContent=e.target.value+(id==='kgD'?'%':'');reset()}));
    reset();loop();
    return{stop(){clearTimeout(timer)}};
  };

  /* CS Adventure: a tiny platformer level */
  DEMOS.platformer=function(box){
    box.innerHTML=`<canvas width="720" height="320" class="appcv" tabindex="0" aria-label="Platformer level. Arrow keys or A and D to move, space or W to jump."></canvas>
      <div class="ctl" style="justify-content:space-between"><p class="readout" id="pfMsg">Collect the concept coins. Arrows or A/D to move, Space or W to jump.</p>
      <span class="pad"><button class="mini" data-k="left" aria-label="Move left">◀</button><button class="mini" data-k="jump" aria-label="Jump">▲</button><button class="mini" data-k="right" aria-label="Move right">▶</button><button class="mini" id="pfReset">Restart</button></span></div>`;
    const cv=box.querySelector('canvas'),g=cv.getContext('2d'),W=cv.width,H=cv.height,msg=box.querySelector('#pfMsg');
    const PLAT=[[0,290,520,30],[580,290,380,30],[1020,290,600,30],[1680,290,520,30],[220,220,120,14],[420,170,120,14],[700,210,140,14],[900,150,120,14],[1150,200,130,14],[1350,140,130,14],[1560,220,110,14],[1800,180,140,14]];
    const COINS=[[270,190,'Stack','Last in, first out. Your browser’s back button is a stack.'],[470,140,'Queue','First in, first out, like a lunch line.'],[760,180,'Recursion','A function that calls itself. Needs a base case or it never stops.'],[950,120,'Hash map','Finds things by key in about one step.'],[1210,170,'Graph','Nodes and edges. Molecules are graphs too.'],[1410,110,'Big-O','How the work grows as the input grows.'],[1610,190,'Binary search','Halve the search space every step: log n.'],[1860,150,'Gradient descent','Walk downhill on the loss until it stops improving.']];
    let p,got,keys={},cam=0,raf,done;
    function reset(){p={x:40,y:200,vx:0,vy:0,on:false,face:1};got=new Set();done=false;msg.textContent='Collect the concept coins. Arrows or A/D to move, Space or W to jump.'}
    function step(){
      const L=keys.left,Rt=keys.right;p.vx=(Rt?3.4:0)-(L?3.4:0);if(p.vx)p.face=Math.sign(p.vx);
      if(keys.jump&&p.on){p.vy=-9.6;p.on=false}
      p.vy=Math.min(12,p.vy+.48);p.x+=p.vx;p.y+=p.vy;p.on=false;
      PLAT.forEach(([x,y,w,h])=>{if(p.x+16>x&&p.x<x+w&&p.y+24>y&&p.y+24-p.vy<=y+2&&p.vy>=0){p.y=y-24;p.vy=0;p.on=true}});
      if(p.y>H+60)reset();
      p.x=Math.max(0,Math.min(2180,p.x));
      COINS.forEach((c,i)=>{if(!got.has(i)&&Math.abs(p.x+8-c[0])<18&&Math.abs(p.y+12-c[1])<22){got.add(i);msg.textContent=`${c[2]}: ${c[3]} (${got.size}/${COINS.length})`}});
      if(!done&&p.x>2120){done=true;msg.textContent=`Level complete with ${got.size} of ${COINS.length} concepts.`;unlock('player')}
      cam+=((p.x-W/3)-cam)*.12;cam=Math.max(0,Math.min(2200-W,cam));
    }
    function draw(){
      g.fillStyle=css('--card2');g.fillRect(0,0,W,H);
      g.fillStyle=css('--line');for(let i=0;i<14;i++){const x=((i*170-cam*.4)%(W+170)+W+170)%(W+170)-80;g.fillRect(x,120+(i%3)*30,60,4)}
      g.save();g.translate(-cam,0);
      PLAT.forEach(([x,y,w,h])=>{g.fillStyle=css('--velvet');g.fillRect(x,y,w,h);g.fillStyle=css('--gold');g.fillRect(x,y,w,3)});
      COINS.forEach((c,i)=>{if(got.has(i))return;g.fillStyle=css('--gold');g.beginPath();g.arc(c[0],c[1],9,0,7);g.fill();g.fillStyle=css('--text');g.font='11px sans-serif';g.textAlign='center';g.fillText(c[2],c[0],c[1]-14)});
      g.fillStyle=css('--mint');g.fillRect(2140,230,4,60);g.fillRect(2144,230,24,16);
      // the hero: a small coder in a hoodie
      g.fillStyle='#4b3a78';g.fillRect(p.x,p.y+8,16,12);g.fillStyle='#e2d5bd';g.fillRect(p.x+3,p.y,10,9);
      g.fillStyle='#1b1030';g.fillRect(p.face>0?p.x+10:p.x+4,p.y+3,2,2);
      const leg=p.on&&p.vx?(Math.floor(performance.now()/120)%2):0;g.fillStyle='#22162e';g.fillRect(p.x+2+leg*2,p.y+20,4,4);g.fillRect(p.x+10-leg*2,p.y+20,4,4);
      g.restore();
    }
    function loop(){step();draw();raf=requestAnimationFrame(loop)}
    const map={arrowleft:'left',a:'left',arrowright:'right',d:'right',' ':'jump',arrowup:'jump',w:'jump'};
    cv.addEventListener('keydown',e=>{const k=map[e.key.toLowerCase()];if(k){keys[k]=true;e.preventDefault()}});
    cv.addEventListener('keyup',e=>{const k=map[e.key.toLowerCase()];if(k)keys[k]=false});
    box.querySelectorAll('[data-k]').forEach(b=>{const k=b.dataset.k;b.addEventListener('pointerdown',e=>{e.preventDefault();keys[k]=true});['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>keys[k]=false))});
    box.querySelector('#pfReset').addEventListener('click',()=>{reset();cv.focus()});
    cv.addEventListener('pointerdown',()=>cv.focus());
    reset();loop();setTimeout(()=>cv.focus({preventScroll:true}),50);
    return{stop(){cancelAnimationFrame(raf)}};
  };

  /* Module 3: blur (same as before, now full size) */
  DEMOS.blur=function(box){WIDGETS.blur(box);box.insertAdjacentHTML('beforeend','<p class="hint">The full module writes both versions from scratch and proves they match to within rounding error.</p>')};

  /* Module 2: measure with a reference object */
  DEMOS.measure=function(box){
    box.innerHTML=`<div class="ctl"><label>Reference length (cm) <input type="number" id="msRef" value="8.56" step="0.01" min="0.1" style="width:90px"></label>
      <label class="mini filebtn">Use your own photo<input type="file" accept="image/*" id="msFile"></label><button class="mini" id="msClear">Start over</button></div>
      <canvas width="720" height="360" class="appcv" aria-label="Photo to measure on"></canvas><p class="readout" id="msMsg"></p>
      <p class="hint">Click the two ends of the reference (a credit card is 8.56 cm), then click any two points to measure. This shortcut assumes everything lies flat and faces the camera; the full module calibrates the camera first.</p>`;
    const cv=box.querySelector('canvas'),g=cv.getContext('2d'),W=cv.width,H=cv.height,msg=box.querySelector('#msMsg');
    let img=null,pts=[],scale=null;
    function scene(){
      g.fillStyle='#6b5a48';g.fillRect(0,0,W,H);for(let i=0;i<W;i+=36){g.fillStyle=i%72?'#665645':'#6f5e4c';g.fillRect(i,0,36,H)}
      g.fillStyle='#3d5a6e';g.fillRect(90,120,171,108);g.fillStyle='#cfae66';g.fillRect(105,150,26,20);g.fillStyle='#e2d5bd';g.font='12px sans-serif';g.fillText('CARD',200,215);
      g.fillStyle='#8a2d4a';g.fillRect(330,60,300,230);g.fillStyle='#e2d5bd';g.font='bold 20px Georgia';g.fillText('A Big Book',400,180);
    }
    function draw(){
      if(img){g.drawImage(img,0,0,W,H)}else scene();
      g.lineWidth=3;
      pts.forEach((q,i)=>{g.fillStyle=i<2?'#6aae99':'#cfae66';g.beginPath();g.arc(q.x,q.y,5,0,7);g.fill()});
      [[0,1,'#6aae99'],[2,3,'#cfae66']].forEach(([a,b,c])=>{if(pts[b]){g.strokeStyle=c;g.beginPath();g.moveTo(pts[a].x,pts[a].y);g.lineTo(pts[b].x,pts[b].y);g.stroke()}});
      if(pts.length<2)msg.textContent=`Click ${pts.length?'the other':'one'} end of the reference object.`;
      else if(pts.length<4){scale=+box.querySelector('#msRef').value/Math.hypot(pts[1].x-pts[0].x,pts[1].y-pts[0].y);msg.textContent=`Scale set: 1 px ≈ ${(scale*10).toFixed(2)} mm. Now click two points to measure.`}
      else{const d=Math.hypot(pts[3].x-pts[2].x,pts[3].y-pts[2].y)*scale;msg.textContent=`Measured length ≈ ${d.toFixed(1)} cm. Click again to measure something else.`}
    }
    cv.addEventListener('click',e=>{const q=canvasPoint(cv,e);if(pts.length>=4)pts=pts.slice(0,2);pts.push(q);draw()});
    box.querySelector('#msClear').addEventListener('click',()=>{pts=[];draw()});
    box.querySelector('#msRef').addEventListener('input',()=>draw());
    box.querySelector('#msFile').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const im=new Image();im.onload=()=>{img=im;pts=[];draw()};im.src=URL.createObjectURL(f)});
    draw();
  };

  /* Module 4: find the person, classically */
  DEMOS.segment=function(box){
    box.innerHTML=`<div class="ctl"><label style="flex:1">Threshold <input type="range" id="sgT" min="10" max="200" value="70"></label>
      <label class="mini filebtn">Use your own photo<input type="file" accept="image/*" id="sgFile"></label></div>
      <div class="split"><canvas width="360" height="270" class="appcv" aria-label="Input image"></canvas><canvas width="360" height="270" class="appcv" aria-label="Segmentation mask"></canvas></div>
      <p class="readout" id="sgMsg"></p>
      <p class="hint">Each pixel gets a novelty score: how far its colour is from the background sampled at the image border. Pixels above the threshold become the mask. The full module adds Lab colour, hysteresis, watershed and a SAM2 comparison.</p>`;
    const [a,b]=box.querySelectorAll('canvas'),ga=a.getContext('2d'),gb=b.getContext('2d'),W=a.width,H=a.height;
    function sample(){
      const grd=ga.createLinearGradient(0,0,0,H);grd.addColorStop(0,'#6f8f9e');grd.addColorStop(1,'#5d7a86');ga.fillStyle=grd;ga.fillRect(0,0,W,H);
      for(let i=0;i<500;i++){ga.fillStyle=`rgba(255,255,255,${Math.random()*.06})`;ga.fillRect(Math.random()*W,Math.random()*H,3,3)}
      ga.fillStyle='#a8463c';ga.beginPath();ga.ellipse(180,250,70,95,0,0,7);ga.fill();
      ga.fillStyle='#d9a77c';ga.beginPath();ga.arc(180,105,38,0,7);ga.fill();
      ga.fillStyle='#2b1d1a';ga.beginPath();ga.arc(180,92,40,Math.PI,0);ga.fill();
    }
    function run(){
      const d=ga.getImageData(0,0,W,H).data,t=+box.querySelector('#sgT').value;let r=0,gg=0,bl=0,n=0;
      for(let x=0;x<W;x+=2){for(const y of[0,1,H-2,H-1]){const i=(y*W+x)*4;r+=d[i];gg+=d[i+1];bl+=d[i+2];n++}}
      for(let y=0;y<H;y+=2){for(const x of[0,1,W-2,W-1]){const i=(y*W+x)*4;r+=d[i];gg+=d[i+1];bl+=d[i+2];n++}}
      r/=n;gg/=n;bl/=n;const out=gb.createImageData(W,H);let fg=0;
      for(let i=0;i<d.length;i+=4){const s=Math.hypot(d[i]-r,d[i+1]-gg,d[i+2]-bl),on=s>t;if(on)fg++;
        out.data[i]=on?d[i]:d[i]*.25;out.data[i+1]=on?d[i+1]:d[i+1]*.25+30;out.data[i+2]=on?d[i+2]:d[i+2]*.25+40;out.data[i+3]=255}
      gb.putImageData(out,0,0);box.querySelector('#sgMsg').textContent=`Foreground: ${(fg/(W*H)*100).toFixed(1)}% of pixels. Background colour estimated from the border.`;
    }
    box.querySelector('#sgT').addEventListener('input',run);
    box.querySelector('#sgFile').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const im=new Image();im.onload=()=>{ga.drawImage(im,0,0,W,H);run()};im.src=URL.createObjectURL(f)});
    sample();run();
  };

  /* App view: opens over the area, with Demo and Live tabs.
     A memory opens an app when it has "app" (a demo in DEMOS) or "live" (a key in content.live). */
  let current=null;
  /* "Keyframes (Modules 3 + 6): text" -> a numbered step card with a title, a module chip and the text. */
  const stepsHTML=list=>'<ol class="steps">'+list.map(l=>{
    const m=/^([^:()]{1,40}?)\s*(?:\(([^)]{1,40})\))?:\s+([\s\S]+)$/.exec(l);
    return m?`<li><div class="st-h"><b>${esc(m[1])}</b>${m[2]?`<span class="st-tag">${esc(m[2])}</span>`:''}</div><p>${esc(cap(m[3]))}</p></li>`:`<li><p>${esc(l)}</p></li>`;
  }).join('')+'</ol>';
  const liveBtn=(url,short)=>`<a class="livebtn" href="${esc(url)}" target="_blank" rel="noopener">${short?'Live app':'Open the live app'} <span aria-hidden="true">↗</span></a>`;
  const cap=t=>t.charAt(0).toUpperCase()+t.slice(1);
  function openApp(root,d,onClose){
    const liveURL=d.live?(SITE.content.live||{})[d.live]:'';
    const showLive=!!(liveURL||(d.live&&document.body.classList.contains('editing')));
    const view=el(`<div class="appview" role="dialog" aria-label="${esc(d.title)}">
      <div class="apphead"><button class="arrow" data-close>Back to the area</button><h3>${esc(d.title)}</h3>
        <div class="tabs" role="tablist">${d.app&&DEMOS[d.app]?'<button role="tab" data-tab="demo" aria-selected="true">Play the demo</button>':''}${liveURL?liveBtn(liveURL,true):showLive?`<button role="tab" data-tab="live" aria-selected="${d.app?'false':'true'}">Live app</button>`:''}</div></div>
      <div class="appinfo"><p class="appmeta">${esc(d.text)}</p>${d.list&&d.list.length?`<details class="howto"><summary>How it works · ${d.list.length} steps</summary>${stepsHTML(d.list)}</details>`:''}</div><div class="appbody"></div></div>`);
    root.appendChild(view);
    const frameEl=root.closest('.mframe');frameEl.classList.add('app-open');
    const top=frameEl.getBoundingClientRect().top;if(top<56||top>innerHeight*.3)scrollTo({top:scrollY+top-60,behavior:reduce?'auto':'smooth'});
    const body=view.querySelector('.appbody');
    function show(tab){
      current?.stop?.();current=null;body.innerHTML='';
      view.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===tab)));
      if(tab==='demo'){current=DEMOS[d.app](body)||null;unlock('tinker')}
      else if(liveURL){
        body.innerHTML=`<div class="liveempty"><p><b>${esc(d.title)} runs as its own app.</b></p><p>It opens full screen in a new tab, so it fits your phone.</p><p>${liveBtn(liveURL)}</p></div>`;
      }else body.innerHTML=`<div class="liveempty"><p><b>The live app goes here.</b></p><p>Add its link in the editor under Settings → Live app links (“${esc(d.live)}”). Visitors don’t see this tab until it has a link.</p></div>`;
    }
    view.addEventListener('click',e=>{if(e.target.closest('[data-close]')){close();return}if(e.target.closest('.appinfo .appmeta')){e.target.closest('.appinfo').classList.toggle('open');return}const tb=e.target.closest('[data-tab]');if(tb)show(tb.dataset.tab)});
    view.addEventListener('keydown',e=>{if(e.key==='Escape'&&!e.target.closest('canvas'))close()});
    function close(){current?.stop?.();current=null;view.remove();frameEl.classList.remove('app-open');onClose&&onClose()}
    show(d.app&&DEMOS[d.app]?'demo':'live');
    view.querySelector('[data-close]').focus({preventScroll:true});
  }

  /* ---------- Content ----------
     Everything on the page comes from content.json. SITE is shared with js/admin.js:
     the editor changes SITE.content, then calls SITE.render() to redraw. */
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const getPath=(obj,path)=>path.split('.').reduce((o,k)=>o==null?o:o[k],obj);
  function setPath(obj,path,val){const ks=path.split('.'),last=ks.pop();ks.reduce((o,k)=>o[k],obj)[last]=val}
  const SITE=window.SITE={content:null,photoCache:{},ICONS,svg,esc,getPath,setPath,unlock,isLight,reduce,demos:Object.keys(DEMOS)};
  const photoURL=p=>p?(SITE.photoCache[p]||p):'';
  SITE.photoURL=photoURL;

  function renderText(scope=document){
    scope.querySelectorAll('[data-edit]').forEach(n=>{
      if(n.isContentEditable&&n===document.activeElement)return; // don't clobber what you're typing
      const v=getPath(SITE.content,n.dataset.edit);n.textContent=v??'';
    });
  }
  function renderProfile(){
    const c=SITE.content;
    document.getElementById('profileRows').innerHTML=c.profile.rows.map((r,i)=>
      `<dt data-edit="profile.rows.${i}.label"></dt><dd data-edit="profile.rows.${i}.value"></dd>`).join('');
    document.getElementById('resumeLines').innerHTML=c.resume.lines.map((l,i)=>`<li data-edit="resume.lines.${i}"></li>`).join('');
    const pic=document.getElementById('portrait'),u=photoURL(c.profile.photo);
    pic.classList.toggle('has-photo',!!u);if(u)pic.style.setProperty('--img',`url("${u}")`);else pic.style.removeProperty('--img');
  }

  /* The world: Home Base plus one area per entry in content.areas */
  const root=document.getElementById('mframe');
  let cur='lobby',stopPortals=null,labelsRead=0;const seen=new Set();
  /* Visibility: "public" (default) shows to everyone; "unlisted" only appears through its own link
     (#m-<memory id> or #a-<area id>); "private" never reaches this file at all: the editor keeps it
     in your private repository and merges it in only while you're signed in. */
  const editing=()=>document.body.classList.contains('editing');
  const revealed=new Set();SITE.revealed=revealed;
  const vis=o=>(o&&o.visibility)||'public';
  const shown=(o,id)=>editing()||vis(o)==='public'||(vis(o)==='unlisted'&&revealed.has(id));
  const areaShown=a=>{
    if(!shown(a,'a-'+a.id))return false;
    if(editing()||a.type==='contact')return true;
    return a.memories.some(m=>shown(m,'m-'+m.id))||revealed.has('a-'+a.id);
  };
  SITE.vis=vis;
  /* Each room carries its real index in content.areas (k), so edits land on the right item */
  const rooms=()=>{const c=SITE.content;return[{id:'lobby',home:true,color:c.world.homeColor,title:c.world.homeTitle,sub:c.world.homeSub,k:-1},...c.areas.map((a,k)=>({...a,k})).filter(areaShown)]};
  const tag=o=>vis(o)==='public'?'':`<span class="vis-tag vis-${vis(o)}">${vis(o)==='private'?'Private':'Unlisted'}</span>`;
  const doorHTML=d=>`<button class="door vis-${vis(d)}" data-go="${esc(d.id)}" data-index="${d.k}" style="--c:${esc(d.color)}">${tag(d)}<span class="arch"><span class="pool"></span><canvas class="plasma" width="72" height="99" data-c="${esc(d.color)}"></canvas><canvas class="sparks" width="96" height="132"></canvas></span><span class="plaque">${esc(d.door)}</span></button>`;
  const memoryHTML=(r,m,j)=>`<button class="exhibit vis-${vis(m)} ${m.app||m.live?'playable':''}" data-x="${j}" data-id="${esc(m.id||'')}" style="--c:${esc(r.color)}">${tag(m)}<span class="fr" data-photo="${esc(m.photo||'')}">${svg(m.icon)}</span><span class="plaque">${esc(m.title)}</span></button>`;
  function contactHTML(){const c=SITE.content.contact,u=c.url;
    return `<div class="contact cut"><h2 data-edit="contact.heading"></h2><p data-edit="contact.text"></p><a class="btn" id="contactLink" href="${u?esc(u):'#world'}" ${u?'target="_blank" rel="noopener"':''} data-edit="contact.button"></a>${u?'':'<p class="todo edit-only">Add your LinkedIn link in Settings.</p>'}</div>`}
  function renderWorld(){
    const list=rooms();
    if(!list.some(r=>r.id===cur))cur='lobby';
    stopPortals?.();
    root.innerHTML=list.map((r,i)=>{
      const next=list[i+1],ai=r.k;
      const items=r.memories?r.memories.map((m,j)=>[m,j]).filter(([m])=>shown(m,'m-'+m.id)):[];
      const wall=r.home?list.slice(1).map(doorHTML).join(''):r.type==='contact'?contactHTML():items.map(([m,j])=>memoryHTML(r,m,j)).join('');
      return `<section class="mslide" data-room="${esc(r.id)}" data-area="${ai}" style="--area:${esc(r.color)}" ${r.id===cur?'':'hidden'} aria-label="${esc(r.title)}">
        <div class="mhead"><h3 data-edit="${r.home?'world.homeTitle':`areas.${ai}.title`}"></h3><p data-edit="${r.home?'world.homeSub':`areas.${ai}.sub`}"></p></div>
        <div class="wall ${items.length>6?'dense':''}" data-wall="${r.home?'home':r.type==='contact'?'contact':ai}">${wall}</div>
        <div class="label" role="dialog" hidden></div>
        <div class="mnav">
          <button class="arrow ${i?'':'hide'}" data-go="lobby">${esc(SITE.content.world.homeTitle)}</button>
          <span>${i?`AREA ${i} / ${list.length-1}`:''}</span>
          <button class="arrow fwd ${next&&i?'':'hide'}" data-go="${next?esc(next.id):''}">${next?esc(next.title.replace(/^The /,'')):''}</button>
        </div></section>`;
    }).join('');
    root.querySelectorAll('.fr[data-photo]').forEach(f=>{const u=photoURL(f.dataset.photo);if(u){f.classList.add('has-photo');f.style.setProperty('--img',`url("${u}")`)}});
    renderText(root);
    stopPortals=startPortals(root);
    root.dispatchEvent(new CustomEvent('rendered'));
  }
  function renderAll(){renderProfile();renderText();renderWorld()}
  SITE.render=renderAll;SITE.renderWorld=renderWorld;SITE.renderText=renderText;SITE.currentArea=()=>cur;

  /* Portals: soft rings drifting through a glowing oval, a halo instead of a border, and rising sparkles.
     Returns a stop() function so a re-render can shut the old animation down. */
  function startPortals(root){
    const doors=[...root.querySelectorAll('.door')];if(!doors.length)return()=>{};
    let alive=true;
    const hex=h=>{const m=/^#?([0-9a-f]{6})$/i.exec(h||'');const v=m?m[1]:'7b5cc9';return[0,2,4].map(i=>parseInt(v.slice(i,i+2),16))};
    const mix=(a,b,k)=>a.map((v,i)=>v+(b[i]-v)*k);
    const P=doors.map(door=>{
      const pc=door.querySelector('canvas.plasma'),sc=door.querySelector('canvas.sparks');
      return{pc,sc,pg:pc.getContext('2d'),sg:sc.getContext('2d'),img:pc.getContext('2d').createImageData(pc.width,pc.height),
        rgb:hex(pc.dataset.c),seed:Math.random()*20,speed:1,t:0,sparks:[]};
    });
    function palette(){const L=isLight();P.forEach(p=>{const c=p.rgb;
      if(L){p.light=mix(c,[255,255,255],.38);p.mid=c.slice();p.deep=mix(c,[0,0,0],.3);p.halo=mix(c,[255,255,255],.15);p.core=.22;p.haloA=.5}
      else{p.light=mix(c,[255,255,255],.6);p.mid=mix(c,[255,255,255],.12);p.deep=mix(c,[0,0,0],.18);p.halo=p.light;p.core=.45;p.haloA=.55}})}
    palette();
    const onTheme=()=>{palette();if(reduce)P.forEach(portal)};
    const mo=new MutationObserver(onTheme);mo.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
    const mq=matchMedia('(prefers-color-scheme: light)');mq.addEventListener?.('change',onTheme);
    doors.forEach((door,i)=>{const on=()=>P[i].speed=2.4,off=()=>P[i].speed=1;
      door.addEventListener('pointerenter',on);door.addEventListener('pointerleave',off);door.addEventListener('focus',on);door.addEventListener('blur',off)});
    function portal(p){
      const {pc,img,light,mid,deep}=p,W=pc.width,H=pc.height,d=img.data,t=p.t+p.seed;
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){
        const nx=((x+.5)/W-.5)/.3,ny=((y+.5)/H-.46)/.37,r=Math.hypot(nx,ny),i=(y*W+x)*4;
        if(r>1.6){d[i+3]=0;continue}
        if(r<=1){
          const th=Math.atan2(ny,nx);
          const ring=.5+.5*Math.sin(r*12-t*1.5+.55*Math.sin(2*th+t*.45));
          const shimmer=.5+.5*Math.sin(3*th-r*5+t*.8);
          const v=.75*ring+.25*shimmer,core=Math.exp(-r*r*5)*p.core;
          const col=mix(mix(deep,mid,Math.min(1,r*1.1)),light,v*.85);
          d[i]=Math.min(255,col[0]+255*core);d[i+1]=Math.min(255,col[1]+255*core);d[i+2]=Math.min(255,col[2]+255*core);
          d[i+3]=255*(r<.82?.93:.93-(r-.82)/.18*.3);
        }else{const k=(1.6-r)/.6;d[i]=p.halo[0];d[i+1]=p.halo[1];d[i+2]=p.halo[2];d[i+3]=255*p.haloA*k*k*k}
      }
      p.pg.putImageData(img,0,0);
    }
    function sparks(p,dt){
      const {sc,sg,light}=p,W=sc.width,H=sc.height;
      if(p.sparks.length<14&&Math.random()<dt*9){const a=Math.random()*6.28;
        p.sparks.push({x:W/2+Math.cos(a)*W*.32*(.85+Math.random()*.3),y:H*.46+Math.sin(a)*H*.37*(.85+Math.random()*.25),vx:(Math.random()-.5)*6,vy:-(6+Math.random()*12),life:0,max:1.6+Math.random()*1.8,r:.8+Math.random()*1.4})}
      sg.clearRect(0,0,W,H);
      p.sparks=p.sparks.filter(s=>(s.life+=dt)<s.max);
      p.sparks.forEach(s=>{s.x+=s.vx*dt;s.y+=s.vy*dt;const a=Math.sin(Math.PI*s.life/s.max);
        const g=sg.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r*3);g.addColorStop(0,`rgba(255,255,255,${.95*a})`);g.addColorStop(.4,`rgba(${light.map(Math.round).join(',')},${.7*a})`);g.addColorStop(1,'rgba(255,255,255,0)');
        sg.fillStyle=g;sg.beginPath();sg.arc(s.x,s.y,s.r*3,0,6.3);sg.fill()});
    }
    const lobby=root.querySelector('[data-room="lobby"]');let last=0;
    function frame(now){
      if(!alive)return;
      const dt=last?Math.min(.05,(now-last)/1000):0;last=now;
      if(!lobby.hidden&&!document.hidden)P.forEach(p=>{p.t+=dt*.6*p.speed;portal(p);sparks(p,dt*p.speed)});
      if(!reduce)requestAnimationFrame(frame);
    }
    if(reduce)P.forEach(p=>{portal(p);for(let k=0;k<40;k++)sparks(p,.1)});else requestAnimationFrame(frame);
    return()=>{alive=false;mo.disconnect();mq.removeEventListener?.('change',onTheme)};
  }

  function go(id){
    const list=rooms(),order=list.map(r=>r.id);
    if(id===cur||!order.includes(id))return;
    const from=root.querySelector(`[data-room="${CSS.escape(cur)}"]`),to=root.querySelector(`[data-room="${CSS.escape(id)}"]`);
    const fwd=order.indexOf(id)>order.indexOf(cur);
    from.querySelector('.label').hidden=true;
    from.classList.add(fwd?'out-left':'out-right');to.classList.add(fwd?'out-right':'out-left');to.hidden=false;
    requestAnimationFrame(()=>requestAnimationFrame(()=>to.classList.remove('out-left','out-right')));
    setTimeout(()=>{from.hidden=true;from.classList.remove('out-left','out-right')},reduce?0:450);
    cur=id;
    if(id!=='lobby'){seen.add(id);unlock('museum');if(seen.size===list.length-1)unlock('allrooms')}
    (to.querySelector('.door,.exhibit')||to).focus({preventScroll:true});
  }
  SITE.go=go;

  document.addEventListener('click',e=>{
    const a=e.target.closest('[data-open]');if(!a||document.body.classList.contains('editing'))return;
    e.preventDefault();document.getElementById('world').scrollIntoView({behavior:reduce?'auto':'smooth'});go(a.dataset.open);
  });
  root.addEventListener('click',e=>{
    const gl=e.target.closest('[data-go-label]');if(gl){e.preventDefault();gl.closest('.label').hidden=true;go(gl.dataset.goLabel);return}
    if(e.target.closest('.label .x')){e.target.closest('.label').hidden=true;return}
    if(e.target.closest('.label'))return;
    const g=e.target.closest('[data-go]');if(g&&g.dataset.go){go(g.dataset.go);return}
    const x=e.target.closest('.exhibit');if(!x||document.body.classList.contains('editing'))return;
    const area=SITE.content.areas.find(r=>r.id===cur),d=area.memories[+x.dataset.x],lab=x.closest('.mslide').querySelector('.label');
    if(d.app&&DEMOS[d.app]){lab.hidden=true;openApp(x.closest('.mslide'),d,()=>x.focus({preventScroll:true}));return}
    const liveURL=d.live?SITE.content.live?.[d.live]:'';
    const link=d.link&&d.link.text?(d.link.openArea?`<a href="#world" data-go-label="${esc(d.link.openArea)}">${esc(d.link.text)}</a>`:d.link.href?`<a href="${esc(d.link.href)}" target="_blank" rel="noopener">${esc(d.link.text)}</a>`:''):'';
    lab.innerHTML=`<button class="x" aria-label="Close">×</button><h4>${esc(d.title)}</h4>
      ${d.photo?`<img class="labimg" src="${esc(photoURL(d.photo))}" alt="">`:''}<div class="meta">${d.year?esc(d.year)+' · ':''}<i>${esc(d.tools)}</i></div><p>${esc(d.text)}</p>
      ${d.list&&d.list.length?stepsHTML(d.list):''}
      ${liveURL?`<p style="margin-top:10px">${liveBtn(liveURL)}</p>`:''}
      ${d.widget?'<div class="wbox"></div>':''}
      ${link?`<p style="margin-top:8px">${link}</p>`:''}`;
    lab.hidden=false;
    if(d.widget&&WIDGETS[d.widget])WIDGETS[d.widget](lab.querySelector('.wbox'));
    lab.querySelector('.x').focus({preventScroll:true});
    if(++labelsRead>=5)unlock('critic');
  });
  root.addEventListener('keydown',e=>{if(e.key==='Escape')root.querySelectorAll('.label').forEach(l=>l.hidden=true)});

  /* Share links: #m-<memory id> opens that memory, #a-<area id> opens that area. Works for unlisted items too. */
  function openFromHash(){
    const h=decodeURIComponent(location.hash.slice(1));if(!/^[am]-/.test(h))return;
    const c=SITE.content;let area=null,mi=-1;
    if(h.startsWith('a-'))area=c.areas.find(a=>a.id===h.slice(2));
    else c.areas.forEach(a=>{const j=(a.memories||[]).findIndex(m=>m.id===h.slice(2));if(j>=0){area=a;mi=j}});
    if(!area||vis(area)==='private'||(mi>=0&&vis(area.memories[mi])==='private'))return;
    revealed.add('a-'+area.id);if(mi>=0)revealed.add(h);
    renderWorld();
    document.getElementById('world').scrollIntoView({behavior:'auto'});
    go(area.id);
    if(mi>=0)setTimeout(()=>root.querySelector(`[data-room="${CSS.escape(area.id)}"] .exhibit[data-x="${mi}"]`)?.click(),reduce?0:480);
  }
  SITE.openFromHash=openFromHash;

  /* Load content.json, then draw everything */
  (async function boot(){
    try{
      const r=await fetch('content.json',{cache:'no-store'});
      if(!r.ok)throw new Error(r.status);
      SITE.content=await r.json();
    }catch(err){
      root.innerHTML='<p style="padding:24px;max-width:60ch">The site’s content didn’t load. If you opened index.html by double-clicking it, open it with VS Code’s Live Server instead, because browsers block reading content.json from a plain file.</p>';
      return;
    }
    renderAll();
    openFromHash();
    addEventListener('hashchange',openFromHash);
    document.dispatchEvent(new CustomEvent('site:ready'));
  })();

  /* Confetti and the secret code */
  const cv=document.getElementById('confetti'),cx=cv.getContext('2d');
  function burst(){
    if(reduce||document.body.classList.contains('plain'))return;
    cv.width=innerWidth;cv.height=innerHeight;
    const cols=['#86cde8','#e79ac4','#e6c27a','#b9a6ff','#ffffff'];
    const ps=Array.from({length:150},()=>({x:innerWidth/2,y:innerHeight*.6,vx:(Math.random()-.5)*14,vy:-Math.random()*16-4,s:Math.random()*6+4,c:cols[Math.random()*5|0],r:Math.random()*6}));
    let f=0;(function step(){cx.clearRect(0,0,cv.width,cv.height);
      ps.forEach(p=>{p.vy+=.45;p.x+=p.vx;p.y+=p.vy;p.r+=.2;cx.save();cx.translate(p.x,p.y);cx.rotate(p.r);cx.fillStyle=p.c;cx.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);cx.restore()});
      if(++f<150)requestAnimationFrame(step);else cx.clearRect(0,0,cv.width,cv.height)})();
  }
  const code=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];let pos=0;
  addEventListener('keydown',e=>{
    if(e.target.closest('input'))return;
    pos=(e.key===code[pos]||e.key.toLowerCase()===code[pos])?pos+1:(e.key===code[0]?1:0);
    if(pos===code.length){pos=0;unlock('ovation');burst()}
  });
})();
