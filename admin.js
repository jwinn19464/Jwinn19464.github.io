/* =====================================================================
   Admin: the hidden login and the visual editor.

   How you get in:
     1. Click (or tap) your name 5 times.
     2. Voice check: say your passphrase. This runs a speaker-verification
        model in your browser and compares your voice to the voiceprint
        saved on this device. It's the fun gate, not the real lock.
     3. GitHub check: your token must be able to write to the site's repo.
        This is the real lock. Every save goes through GitHub with it.

   What you can do once you're in:
     - Click any text on the page and type to change it.
     - Click a memory to edit it, drag the ⠿ handle to reorder,
       or use "+ Add" tiles to add memories and areas.
     - Upload photos (they're committed to the repo's images/ folder).
     - Save: writes content.json back to GitHub; Pages republishes it.
   ===================================================================== */
(function(){
  'use strict';
  const S=()=>window.SITE;
  const store=(area)=>({get(k){try{return area.getItem(k)}catch(e){return null}},set(k,v){try{area.setItem(k,v)}catch(e){}},del(k){try{area.removeItem(k)}catch(e){}}});
  const local=store(window.localStorage),session=store(window.sessionStorage);
  const $=h=>{const t=document.createElement('template');t.innerHTML=h.trim();return t.content.firstElementChild};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clone=o=>JSON.parse(JSON.stringify(o));
  const slug=s=>String(s||'item').toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40)||'item';
  const KEYS={token:'jn-gh-token',repo:'jn-gh-repo',voice:'jn-voiceprint',draft:'jn-draft'};

  /* ---------- Small helpers for text <-> base64 (GitHub sends files as base64) ---------- */
  function utf8ToB64(str){const bytes=new TextEncoder().encode(str);let bin='';for(let i=0;i<bytes.length;i+=0x8000)bin+=String.fromCharCode.apply(null,bytes.subarray(i,i+0x8000));return btoa(bin)}
  const blobToB64=blob=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(',')[1]);r.onerror=rej;r.readAsDataURL(blob)});

  /* ---------- GitHub ---------- */
  const GH={
    token:'',owner:'',repo:'',branch:'main',
    get full(){return this.owner&&this.repo?`${this.owner}/${this.repo}`:''},
    setRepo(full,branch){const [o,r]=String(full||'').trim().split('/');this.owner=(o||'').trim();this.repo=(r||'').trim();if(branch)this.branch=branch},
    async req(path,opts={}){
      let r;
      try{r=await fetch('https://api.github.com'+path,{...opts,headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+this.token,'X-GitHub-Api-Version':'2022-11-28',...(opts.body?{'Content-Type':'application/json'}:{})}})}
      catch(e){const err=new Error('network');err.status=0;throw err}
      if(!r.ok){const err=new Error('GitHub '+r.status);err.status=r.status;throw err}
      return r.status===204?null:r.json();
    },
    async verify(){
      const user=await this.req('/user');
      const repo=await this.req(`/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}`);
      return{login:user.login,canWrite:!!(repo.permissions&&repo.permissions.push)};
    },
    filePath(p){return `/repos/${encodeURIComponent(this.owner)}/${encodeURIComponent(this.repo)}/contents/${p.split('/').map(encodeURIComponent).join('/')}`},
    async sha(p){try{return (await this.req(this.filePath(p)+'?ref='+encodeURIComponent(this.branch))).sha}catch(e){if(e.status===404)return null;throw e}},
    async put(p,b64,message){
      const sha=await this.sha(p);
      return this.req(this.filePath(p),{method:'PUT',body:JSON.stringify({message,content:b64,branch:this.branch,...(sha?{sha}:{})})});
    }
  };
  function loadRepoConfig(){
    const a=(S().content&&S().content.admin)||{};
    const saved=local.get(KEYS.repo);
    GH.setRepo(saved||(a.owner&&a.repo?`${a.owner}/${a.repo}`:''),a.branch||'main');
  }

  /* ---------- Voice: speaker verification that runs in the browser ---------- */
  const VOICE={
    threshold:0.86,           // Microsoft's suggested cut-off for this model; raise it to be stricter
    phrase:'Open my world',
    proc:null,model:null,
    supported(){return !!(window.isSecureContext&&navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&window.MediaRecorder)},
    saved(){try{return JSON.parse(local.get(KEYS.voice))}catch(e){return null}},
    has(){return !!this.saved()},
    async load(say){
      if(this.model)return;
      say('Loading the voice model. The first time takes a minute; after that it’s cached.');
      const T=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2');
      this.proc=await T.AutoProcessor.from_pretrained('Xenova/wavlm-base-plus-sv');
      this.model=await T.AutoModel.from_pretrained('Xenova/wavlm-base-plus-sv');
    },
    /* Record a few seconds from the mic, drawing the waveform as you speak.
       Returns 16 kHz mono samples, which is what the model expects. */
    async record(seconds,canvas){
      const stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true}});
      const AC=window.AudioContext||window.webkitAudioContext,ac=new AC();
      const an=ac.createAnalyser();an.fftSize=1024;ac.createMediaStreamSource(stream).connect(an);
      const rec=new MediaRecorder(stream),chunks=[];rec.ondataavailable=e=>e.data.size&&chunks.push(e.data);
      const stopped=new Promise(r=>rec.onstop=r);
      const g=canvas.getContext('2d'),buf=new Uint8Array(an.fftSize);let raf,t0=performance.now();
      const cs=getComputedStyle(document.documentElement);
      (function draw(now){
        an.getByteTimeDomainData(buf);const W=canvas.width,H=canvas.height;g.clearRect(0,0,W,H);
        const grd=g.createLinearGradient(0,0,W,0);grd.addColorStop(0,cs.getPropertyValue('--mint').trim()||'#86cde8');grd.addColorStop(1,cs.getPropertyValue('--pink').trim()||'#e79ac4');
        g.strokeStyle=grd;g.lineWidth=3;g.beginPath();
        for(let i=0;i<buf.length;i++){const x=i/(buf.length-1)*W,y=H/2+(buf[i]-128)/128*H*.9;i?g.lineTo(x,y):g.moveTo(x,y)}g.stroke();
        const p=Math.min(1,(now-t0)/(seconds*1000));g.fillStyle=grd;g.fillRect(0,H-3,W*p,3);
        raf=requestAnimationFrame(draw);
      })(t0);
      rec.start();await new Promise(r=>setTimeout(r,seconds*1000));rec.stop();await stopped;
      cancelAnimationFrame(raf);stream.getTracks().forEach(t=>t.stop());
      const audio=await ac.decodeAudioData(await new Blob(chunks,{type:rec.mimeType}).arrayBuffer());ac.close();
      const off=new OfflineAudioContext(1,Math.max(1,Math.ceil(audio.duration*16000)),16000);
      const src=off.createBufferSource();src.buffer=audio;src.connect(off.destination);src.start();
      const samples=(await off.startRendering()).getChannelData(0);
      let peak=0;for(let i=0;i<samples.length;i++)peak=Math.max(peak,Math.abs(samples[i]));
      if(peak<0.02){const e=new Error('quiet');e.quiet=true;throw e}
      return samples;
    },
    async embed(samples){
      const inputs=await this.proc(samples);const out=await this.model(inputs);
      const v=Array.from((out.embeddings||out.logits).data);const n=Math.hypot(...v)||1;return v.map(x=>x/n);
    },
    similarity(a,b){let s=0;for(let i=0;i<a.length;i++)s+=a[i]*b[i];return s},
    enroll(vectors){
      const avg=vectors[0].map((_,i)=>vectors.reduce((s,v)=>s+v[i],0)/vectors.length);const n=Math.hypot(...avg)||1;
      local.set(KEYS.voice,JSON.stringify({vector:avg.map(x=>x/n),phrase:this.phrase,at:Date.now()}));
    },
    forget(){local.del(KEYS.voice)}
  };

  /* ---------- The login window ---------- */
  const modal=$(`<div class="admin-modal" role="dialog" aria-modal="true" aria-labelledby="amTitle" hidden>
      <div class="am-card cut"><button class="x am-close" aria-label="Close">×</button><div class="am-body"></div></div></div>`);
  document.body.appendChild(modal);
  const body=modal.querySelector('.am-body');
  modal.querySelector('.am-close').addEventListener('click',closeLogin);
  modal.addEventListener('keydown',e=>{if(e.key==='Escape')closeLogin()});
  function closeLogin(){modal.hidden=true;document.getElementById('siteName')?.focus?.({preventScroll:true})}
  function show(html){body.innerHTML=html;modal.hidden=false;(body.querySelector('[autofocus],button.btn,input')||body).focus?.()}
  const say=(t,kind='')=>{const s=body.querySelector('.am-status');if(s){s.textContent=t;s.dataset.kind=kind}};

  function openLogin(){
    if(document.body.classList.contains('editing'))return;
    loadRepoConfig();
    const remembered=local.get(KEYS.token)||session.get(KEYS.token)||'';
    if(VOICE.has()&&VOICE.supported())stepVoice(()=>remembered?tryToken(remembered,!!local.get(KEYS.token),true):stepToken());
    else if(remembered)tryToken(remembered,!!local.get(KEYS.token),true);
    else stepToken();
  }

  function stepVoice(onPass){
    const phrase=(VOICE.saved()||{}).phrase||VOICE.phrase;let fails=0;
    show(`<p class="am-eyebrow">Step 1 of 2 · Voice</p><h3 id="amTitle">Say “${esc(phrase)}”</h3>
      <canvas class="am-wave" width="560" height="120" aria-hidden="true"></canvas>
      <div class="am-row"><button class="btn" data-act="listen" autofocus>Start listening</button><button class="btn ghost" data-act="skip">Use my token instead</button></div>
      <p class="am-status" aria-live="polite">You’ll have 3 seconds.</p>`);
    body.onclick=async e=>{
      const act=e.target.closest('[data-act]')?.dataset.act;if(!act)return;
      if(act==='skip'){stepToken();return}
      if(act!=='listen')return;
      const btn=e.target.closest('button');btn.disabled=true;
      try{
        await VOICE.load(say);
        say('Listening…');
        const samples=await VOICE.record(3,body.querySelector('.am-wave'));
        say('Checking your voice…');
        const score=VOICE.similarity(await VOICE.embed(samples),VOICE.saved().vector);
        if(score>=VOICE.threshold){say(`That’s you. Voice match ${Math.round(score*100)}%.`,'ok');setTimeout(onPass,700)}
        else{fails++;say(fails>=3?'Voice didn’t match three times. Use your token to get in.':`That didn’t sound like you (match ${Math.round(score*100)}%). Try again.`,'bad');btn.disabled=fails>=3}
      }catch(err){
        btn.disabled=false;
        say(err.quiet?'I couldn’t hear anything. Check your microphone and try again.':err.name==='NotAllowedError'?'Microphone access was blocked. Allow it in your browser, or use your token.':'The voice check couldn’t run here. Use your token instead.','bad');
      }
    };
  }

  function stepToken(){
    show(`<p class="am-eyebrow">${VOICE.has()&&VOICE.supported()?'Step 2 of 2 · GitHub':'Sign in · GitHub'}</p><h3 id="amTitle">Unlock the editor</h3>
      <form class="am-form" novalidate>
        <label>Repository<input name="repo" placeholder="your-username/your-repo" value="${esc(GH.full)}" autocomplete="off" spellcheck="false" required></label>
        <label>GitHub token<input name="token" type="password" autocomplete="current-password" spellcheck="false" required autofocus></label>
        <label class="am-check"><input name="remember" type="checkbox" checked> Remember me on this device</label>
        <div class="am-row"><button class="btn" type="submit">Unlock</button></div>
      </form>
      <p class="am-status" aria-live="polite"></p>
      <p class="am-help">Use a <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">fine-grained token</a> limited to this one repository, with <b>Contents: Read and write</b>. It stays in this browser and is only ever sent to GitHub.</p>`);
    body.onclick=null;
    body.querySelector('form').addEventListener('submit',e=>{
      e.preventDefault();const f=e.target;
      if(!/^[^/\s]+\/[^/\s]+$/.test(f.repo.value.trim())){say('Enter the repository as username/repo-name.','bad');f.repo.focus();return}
      if(!f.token.value.trim()){say('Paste your GitHub token.','bad');f.token.focus();return}
      GH.setRepo(f.repo.value.trim());local.set(KEYS.repo,GH.full);
      tryToken(f.token.value.trim(),f.remember.checked,false);
    });
  }

  async function tryToken(token,remember,quiet){
    if(quiet)show(`<p class="am-eyebrow">GitHub</p><h3 id="amTitle">Checking with GitHub…</h3><p class="am-status" aria-live="polite"></p>`);
    else say('Checking with GitHub…');
    if(!GH.full){stepToken();say('Enter your repository first.','bad');return}
    GH.token=token;
    try{
      const who=await GH.verify();
      if(!who.canWrite){forgetToken();if(quiet)stepToken();say(`Access denied: this token can’t write to ${GH.full}.`,'bad');return}
      (remember?local:session).set(KEYS.token,token);
      if(!VOICE.has()&&VOICE.supported())stepEnroll(who.login);
      else{closeLogin();enterEditor(who.login)}
    }catch(err){
      forgetToken();if(quiet)stepToken();
      say(err.status===401?'GitHub didn’t accept that token. It may have expired.':err.status===404?`GitHub can’t find ${GH.full} with this token. Check the name and the token’s repository access.`:err.status===0?'Couldn’t reach GitHub. Check your connection.':`GitHub said no (${err.status}).`,'bad');
    }
  }
  function forgetToken(){GH.token='';local.del(KEYS.token);session.del(KEYS.token)}

  function stepEnroll(login){
    const takes=[];
    show(`<p class="am-eyebrow">Optional · Voice login</p><h3 id="amTitle">Set up your voice on this device?</h3>
      <p class="am-text">You’ll say “${esc(VOICE.phrase)}” three times. Your voiceprint is saved in this browser only, never in your repository.</p>
      <canvas class="am-wave" width="560" height="120" aria-hidden="true"></canvas>
      <div class="am-row"><button class="btn" data-act="take" autofocus>Record 1 of 3</button><button class="btn ghost" data-act="later">Not now</button></div>
      <p class="am-status" aria-live="polite"></p>`);
    body.onclick=async e=>{
      const act=e.target.closest('[data-act]')?.dataset.act;if(!act)return;
      if(act==='later'){closeLogin();enterEditor(login);return}
      const btn=e.target.closest('button');btn.disabled=true;
      try{
        await VOICE.load(say);say('Listening…');
        takes.push(await VOICE.embed(await VOICE.record(3,body.querySelector('.am-wave'))));
        if(takes.length<3){btn.textContent=`Record ${takes.length+1} of 3`;btn.disabled=false;say('Got it. Once more.','ok');return}
        VOICE.enroll(takes);say('Voice saved. Next time, say the phrase to get in.','ok');
        setTimeout(()=>{closeLogin();enterEditor(login)},900);
      }catch(err){btn.disabled=false;say(err.quiet?'I couldn’t hear anything. Try again.':'Voice setup didn’t work here. You can skip it.','bad')}
    };
  }

  /* Hidden trigger: click your name 5 times */
  let clicks=0,clickTimer;
  document.addEventListener('click',e=>{
    if(!e.target.closest('#siteName')||document.body.classList.contains('editing'))return;
    clicks++;clearTimeout(clickTimer);clickTimer=setTimeout(()=>clicks=0,1200);
    if(clicks>=5){clicks=0;openLogin()}
  });

  /* =====================================================================
     The editor
     ===================================================================== */
  let original=null,dirty=false,who='';
  const bar=$(`<div class="edit-bar" role="toolbar" aria-label="Editor" hidden>
      <span class="eb-status" aria-live="polite">Editing</span>
      <button class="mini" data-bar="restore" hidden>Restore unsaved draft</button>
      <button class="mini" data-bar="settings">Settings</button>
      <button class="mini" data-bar="discard">Discard</button>
      <button class="btn" data-bar="save">Save</button>
      <button class="mini" data-bar="signout">Sign out</button></div>`);
  const drawer=$(`<aside class="drawer cut" role="dialog" aria-labelledby="drTitle" hidden>
      <div class="dr-head"><h3 id="drTitle"></h3><button class="x dr-close" aria-label="Close">×</button></div><div class="dr-body"></div></aside>`);
  const picker=$(`<input type="file" accept="image/*" hidden>`);
  document.body.append(bar,drawer,picker);
  const status=t=>bar.querySelector('.eb-status').textContent=t;

  function enterEditor(login){
    who=login||'';original=clone(S().content);dirty=false;
    document.body.classList.add('editing');bar.hidden=false;
    document.getElementById('portrait').disabled=false;
    status(who?`Editing as ${who}`:'Editing');
    const draft=readDraft();bar.querySelector('[data-bar="restore"]').hidden=!(draft&&JSON.stringify(draft.content)!==JSON.stringify(S().content));
    S().render();decorate();
    addEventListener('beforeunload',warn);
  }
  function exitEditor(){
    document.body.classList.remove('editing');bar.hidden=true;drawer.hidden=true;
    document.getElementById('portrait').disabled=true;
    document.querySelectorAll('[data-edit][contenteditable]').forEach(n=>n.removeAttribute('contenteditable'));
    removeEventListener('beforeunload',warn);
    S().render();
  }
  const warn=e=>{if(dirty){e.preventDefault();e.returnValue=''}};

  /* Draft safety net: unsaved edits are kept in this browser until you save or discard */
  let draftTimer;
  function markDirty(){
    dirty=true;status('Unsaved changes');
    clearTimeout(draftTimer);draftTimer=setTimeout(()=>local.set(KEYS.draft,JSON.stringify({at:Date.now(),content:S().content})),400);
  }
  function readDraft(){try{return JSON.parse(local.get(KEYS.draft))}catch(e){return null}}

  /* Re-render helpers that keep you where you are */
  let rTimer;
  function rerender(world=true,delay=0){clearTimeout(rTimer);rTimer=setTimeout(()=>{world?S().renderWorld():S().render();if(!world)decorate()},delay)}

  /* ----- Inline text editing ----- */
  function makeEditable(scope=document){
    scope.querySelectorAll('[data-edit]').forEach(n=>{
      if(n.closest('button,.label,.appview'))return;
      n.setAttribute('contenteditable','true');n.setAttribute('spellcheck','true');
    });
  }
  document.addEventListener('input',e=>{
    const n=e.target.closest('[data-edit][contenteditable]');if(!n||!document.body.classList.contains('editing'))return;
    S().setPath(S().content,n.dataset.edit,n.textContent);markDirty();
    document.querySelectorAll(`[data-edit="${CSS.escape(n.dataset.edit)}"]`).forEach(o=>{if(o!==n)o.textContent=n.textContent});
  });
  document.addEventListener('keydown',e=>{
    const n=e.target.closest&&e.target.closest('[data-edit][contenteditable]');if(!n)return;
    if(e.key==='Enter'){e.preventDefault();n.blur()}
  });
  document.addEventListener('paste',e=>{
    const n=e.target.closest&&e.target.closest('[data-edit][contenteditable]');if(!n)return;
    e.preventDefault();document.execCommand('insertText',false,(e.clipboardData||window.clipboardData).getData('text/plain').replace(/\s*\n\s*/g,' '));
  });
  document.addEventListener('click',e=>{
    if(!document.body.classList.contains('editing'))return;
    const a=e.target.closest('a[data-edit],a[data-open]');if(a){e.preventDefault();e.stopPropagation()}
  },true);

  /* ----- Edit controls inside the world: handles, + tiles, area settings ----- */
  function decorate(){
    if(!document.body.classList.contains('editing'))return;
    const root=document.getElementById('mframe');
    makeEditable();
    root.querySelectorAll('.exhibit,.door').forEach(item=>{
      if(!item.querySelector('.handle'))item.insertAdjacentHTML('afterbegin','<span class="handle" role="button" tabindex="-1" aria-label="Drag to reorder" title="Drag to reorder">⠿</span>');
    });
    root.querySelectorAll('.wall[data-wall]').forEach(w=>{
      const k=w.dataset.wall;if(k==='contact'||w.querySelector('.add-tile'))return;
      w.insertAdjacentHTML('beforeend',k==='home'?'<button class="add-tile" data-add="area">+ Add area</button>':'<button class="add-tile" data-add="memory">+ Add memory</button>');
    });
    root.querySelectorAll('.mslide').forEach(sl=>{
      const h=sl.querySelector('.mhead');if(h.querySelector('.area-gear'))return;
      h.insertAdjacentHTML('beforeend',`<button class="mini area-gear" data-area-gear="${sl.dataset.area}">${sl.dataset.room==='lobby'?'Home Base settings':'Area settings'}</button>`);
    });
  }
  document.getElementById('mframe').addEventListener('rendered',()=>decorate());

  document.getElementById('mframe').addEventListener('click',e=>{
    if(!document.body.classList.contains('editing'))return;
    if(e.target.closest('.handle')){e.preventDefault();e.stopPropagation();return}
    const add=e.target.closest('.add-tile');
    if(add){e.stopPropagation();add.dataset.add==='memory'?addMemory(+add.closest('.mslide').dataset.area):addArea();return}
    const gear=e.target.closest('[data-area-gear]');
    if(gear){e.stopPropagation();openAreaDrawer(+gear.dataset.areaGear);return}
    const x=e.target.closest('.exhibit');
    if(x){e.stopPropagation();openMemoryDrawer(+x.closest('.mslide').dataset.area,+x.dataset.x)}
  },true);

  /* ----- Drag to reorder (mouse, pen and touch). Drag the ⠿ handle. ----- */
  let drag=null;
  document.getElementById('mframe').addEventListener('pointerdown',e=>{
    const h=e.target.closest('.handle');if(!h||!document.body.classList.contains('editing'))return;
    e.preventDefault();
    const item=h.closest('.exhibit,.door'),wall=item.parentElement;
    drag={item,wall,sel:item.classList.contains('door')?'.door':'.exhibit',id:e.pointerId,moved:false};
    h.setPointerCapture(e.pointerId);item.classList.add('dragging');
  });
  document.getElementById('mframe').addEventListener('pointermove',e=>{
    if(!drag||e.pointerId!==drag.id)return;
    const sibs=[...drag.wall.querySelectorAll(drag.sel)].filter(n=>n!==drag.item);
    const over=sibs.find(n=>{const r=n.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom});
    if(!over)return;
    const r=over.getBoundingClientRect(),after=e.clientX>r.left+r.width/2;
    drag.wall.insertBefore(drag.item,after?over.nextSibling:over);drag.moved=true;
  });
  const endDrag=e=>{
    if(!drag||e.pointerId!==drag.id)return;
    const {item,wall,sel,moved}=drag;drag=null;item.classList.remove('dragging');
    if(!moved)return;
    const c=S().content,order=[...wall.querySelectorAll(sel)].map(n=>+(sel==='.door'?n.dataset.index:n.dataset.x));
    if(sel==='.door')c.areas=order.map(i=>c.areas[i]);
    else{const a=c.areas[+wall.dataset.wall];a.memories=order.map(i=>a.memories[i])}
    markDirty();S().renderWorld();
  };
  document.getElementById('mframe').addEventListener('pointerup',endDrag);
  document.getElementById('mframe').addEventListener('pointercancel',endDrag);

  /* ----- Adding things ----- */
  function addMemory(ai){
    const a=S().content.areas[ai];
    a.memories.push({title:'New memory',icon:'star',year:'',tools:'',text:'',photo:''});
    markDirty();S().renderWorld();openMemoryDrawer(ai,a.memories.length-1);
  }
  function addArea(){
    const c=S().content;let base=slug('new area'),id=base,n=2;while(c.areas.some(a=>a.id===id))id=base+'-'+n++;
    const area={id,door:'New Area',color:'#5f7fd0',title:'New Area',sub:'Describe this area.',memories:[]};
    const ci=c.areas.findIndex(a=>a.type==='contact');ci<0?c.areas.push(area):c.areas.splice(ci,0,area);
    markDirty();S().renderWorld();openAreaDrawer(c.areas.indexOf(area));
  }

  /* ----- Side drawer forms ----- */
  drawer.querySelector('.dr-close').addEventListener('click',()=>drawer.hidden=true);
  drawer.addEventListener('keydown',e=>{if(e.key==='Escape')drawer.hidden=true});
  function openDrawer(title,html,bind){
    drawer.querySelector('#drTitle').textContent=title;
    const b=drawer.querySelector('.dr-body');b.innerHTML=html;drawer.hidden=false;
    b.oninput=e=>{const f=e.target.closest('[data-bind]');if(f)bind(f.dataset.bind,f.type==='checkbox'?f.checked:f.value,f)};
    b.onchange=b.oninput;
    (b.querySelector('input,textarea,select')||b).focus({preventScroll:true});
    return b;
  }
  const field=(label,bind,value,type='text',extra='')=>type==='textarea'
    ?`<label>${label}<textarea data-bind="${bind}" rows="4" ${extra}>${esc(value)}</textarea></label>`
    :`<label>${label}<input type="${type}" data-bind="${bind}" value="${esc(value)}" ${extra}></label>`;
  function confirmButton(btn,label,action){
    if(btn.dataset.armed){action();return}
    btn.dataset.armed='1';const old=btn.textContent;btn.textContent=label;
    setTimeout(()=>{if(btn.isConnected){delete btn.dataset.armed;btn.textContent=old}},3000);
  }

  function openMemoryDrawer(ai,j){
    const c=S().content,area=c.areas[ai],m=area.memories[j];if(!m)return;
    const icons=Object.keys(S().ICONS).map(k=>`<option value="${k}" ${m.icon===k?'selected':''}>${k}</option>`).join('');
    const areas=c.areas.map((a,i)=>`<option value="${i}" ${i===ai?'selected':''}>${esc(a.title)}</option>`).join('');
    const targets=['<option value="">No</option>',...c.areas.map(a=>`<option value="${esc(a.id)}" ${m.link&&m.link.openArea===a.id?'selected':''}>${esc(a.title)}</option>`)].join('');
    const demos=['<option value="">None</option>',...S().demos.map(d=>`<option ${m.app===d?'selected':''}>${d}</option>`)].join('');
    const b=openDrawer('Edit memory',`
      ${field('Title','title',m.title)}
      ${field('Year or status','year',m.year||'')}
      ${field('Tools or medium','tools',m.tools||'')}
      ${field('Description','text',m.text||'','textarea')}
      ${field('Bullet points (one per line)','list',(m.list||[]).join('\n'),'textarea','rows="3"')}
      <div class="dr-photo"><div class="dr-thumb" style="${m.photo?`background-image:url('${esc(S().photoURL(m.photo))}')`:''}">${m.photo?'':S().svg(m.icon)}</div>
        <div><button class="mini" data-do="photo">${m.photo?'Replace photo':'Add photo'}</button> ${m.photo?'<button class="mini" data-do="nophoto">Remove</button>':''}<p class="dr-note" data-photo-status></p></div></div>
      <label>Icon<select data-bind="icon">${icons}</select></label>
      <fieldset><legend>Link</legend>${field('Link text','link.text',m.link?.text||'')}${field('Web address','link.href',m.link?.href||'','url','placeholder="https://"')}<label>Or open an area<select data-bind="link.openArea">${targets}</select></label></fieldset>
      <fieldset><legend>App</legend><label>Demo<select data-bind="app">${demos}</select></label>${field('Live app key (from Settings)','live',m.live||'')}</fieldset>
      <label>Area<select data-bind="area">${areas}</select></label>
      <div class="am-row"><button class="mini" data-do="up">Move earlier</button><button class="mini" data-do="down">Move later</button></div>
      <div class="am-row dr-danger"><button class="mini danger" data-do="delete">Delete memory</button><button class="btn" data-do="done">Done</button></div>`,
      (k,v)=>{
        if(k==='area'){const to=+v;if(to===ai)return;area.memories.splice(j,1);c.areas[to].memories.push(m);markDirty();S().renderWorld();S().go(c.areas[to].id);openMemoryDrawer(to,c.areas[to].memories.length-1);return}
        if(k==='list'){m.list=v.split('\n').map(s=>s.trim()).filter(Boolean);if(!m.list.length)delete m.list}
        else if(k.startsWith('link.')){m.link=m.link||{text:'',href:'',openArea:''};m.link[k.slice(5)]=v}
        else if(k==='app'||k==='live'){if(v)m[k]=v;else delete m[k]}
        else m[k]=v;
        markDirty();rerender(true,200);
      });
    b.onclick=e=>{
      const act=e.target.closest('[data-do]')?.dataset.do;if(!act)return;
      if(act==='done'){drawer.hidden=true;return}
      if(act==='photo'){choosePhoto(`${area.id}-${slug(m.title)}`,path=>{m.photo=path;markDirty();S().renderWorld();openMemoryDrawer(ai,area.memories.indexOf(m))},b.querySelector('[data-photo-status]'));return}
      if(act==='nophoto'){m.photo='';markDirty();S().renderWorld();openMemoryDrawer(ai,area.memories.indexOf(m));return}
      if(act==='up'||act==='down'){const i=area.memories.indexOf(m),k=act==='up'?i-1:i+1;if(k<0||k>=area.memories.length)return;
        area.memories.splice(i,1);area.memories.splice(k,0,m);markDirty();S().renderWorld();return}
      if(act==='delete')confirmButton(e.target,'Click again to delete',()=>{area.memories.splice(area.memories.indexOf(m),1);markDirty();drawer.hidden=true;S().renderWorld()});
    };
  }

  function openAreaDrawer(ai){
    const c=S().content;
    if(ai<0){
      const b=openDrawer('Home Base',`${field('Title','homeTitle',c.world.homeTitle)}${field('Subtitle','homeSub',c.world.homeSub)}${field('Colour','homeColor',c.world.homeColor,'color')}<div class="am-row"><button class="btn" data-do="done">Done</button></div>`,
        (k,v)=>{c.world[k]=v;markDirty();rerender(true,200)});
      b.onclick=e=>{if(e.target.closest('[data-do="done"]'))drawer.hidden=true};return;
    }
    const a=c.areas[ai];if(!a)return;
    const swatches=['#c4577a','#3f63b5','#1f8a8a','#c0702a','#5f8a1f','#6a4bb0','#b0428f','#3d7fa8','#8a6ad0','#a8573a'].map(s=>`<button class="swatch" data-swatch="${s}" style="--s:${s}" aria-label="Use ${s}"></button>`).join('');
    const b=openDrawer('Area settings',`
      ${field('Portal label','door',a.door)}
      ${field('Area title','title',a.title)}
      ${field('Subtitle','sub',a.sub)}
      <label>Colour<input type="color" data-bind="color" value="${esc(a.color)}"></label><div class="swatches">${swatches}</div>
      <div class="am-row dr-danger">${a.type==='contact'?'':'<button class="mini danger" data-do="delete">Delete area</button>'}<button class="btn" data-do="done">Done</button></div>`,
      (k,v)=>{a[k]=v;markDirty();rerender(true,200)});
    b.onclick=e=>{
      const sw=e.target.closest('[data-swatch]');if(sw){a.color=sw.dataset.swatch;b.querySelector('[data-bind="color"]').value=a.color;markDirty();S().renderWorld();return}
      const act=e.target.closest('[data-do]')?.dataset.do;
      if(act==='done')drawer.hidden=true;
      if(act==='delete')confirmButton(e.target,`Delete “${a.title}” and its ${a.memories.length} memories?`,()=>{c.areas.splice(c.areas.indexOf(a),1);markDirty();drawer.hidden=true;S().go('lobby');S().renderWorld()});
    };
  }

  function openSettingsDrawer(){
    const c=S().content;c.live=c.live||{};
    const lives=Object.keys(c.live).map(k=>field(`Live app: ${esc(k)}`,`live.${k}`,c.live[k],'url','placeholder="https://…"')).join('');
    const prof=c.profile.rows.map((r,i)=>`<div class="dr-pair">${field('Label',`row.${i}.label`,r.label)}${field('Value',`row.${i}.value`,r.value)}<button class="mini" data-do="rowdel" data-i="${i}" aria-label="Remove row">×</button></div>`).join('');
    const voiceSaved=VOICE.has();
    const b=openDrawer('Settings',`
      ${field('LinkedIn link','contact.url',c.contact.url||'','url','placeholder="https://www.linkedin.com/in/…"')}
      <fieldset><legend>Profile card</legend>${prof}<button class="mini" data-do="rowadd">+ Add row</button></fieldset>
      ${field('Short résumé (Plain mode), one line per bullet','resume',c.resume.lines.join('\n'),'textarea','rows="6"')}
      <fieldset><legend>Live app links</legend>${lives}<div class="am-row">${field('New key','newlive','','text','placeholder="e.g. portal"')}<button class="mini" data-do="liveadd">Add</button></div></fieldset>
      ${field('Footer','footer',c.footer||'')}
      <fieldset><legend>Repository</legend><p class="dr-note">Saving to <b>${esc(GH.full||'(not set)')}</b> on branch <b>${esc(GH.branch)}</b>.</p></fieldset>
      <fieldset><legend>Voice login on this device</legend><p class="dr-note">${voiceSaved?'Set up. Your voiceprint is stored in this browser only.':VOICE.supported()?'Not set up.':'Not available in this browser.'}</p>
        <div class="am-row">${VOICE.supported()?`<button class="mini" data-do="voiceset">${voiceSaved?'Record again':'Set up'}</button>`:''}${voiceSaved?'<button class="mini danger" data-do="voicedel">Remove</button>':''}</div></fieldset>
      <div class="am-row"><button class="btn" data-do="done">Done</button></div>`,
      (k,v)=>{
        if(k==='resume')c.resume.lines=v.split('\n').map(s=>s.trim()).filter(Boolean);
        else if(k.startsWith('row.')){const [,i,f]=k.split('.');c.profile.rows[+i][f]=v}
        else if(k.startsWith('live.'))c.live[k.slice(5)]=v.trim();
        else if(k==='newlive')return;
        else S().setPath(c,k,v);
        markDirty();clearTimeout(rTimer);rTimer=setTimeout(()=>{S().render()},250);
      });
    b.onclick=e=>{
      const btn=e.target.closest('[data-do]');if(!btn)return;const act=btn.dataset.do;
      if(act==='done'){drawer.hidden=true;return}
      if(act==='rowadd'){c.profile.rows.push({label:'Label',value:'Value'});markDirty();S().render();openSettingsDrawer();return}
      if(act==='rowdel'){c.profile.rows.splice(+btn.dataset.i,1);markDirty();S().render();openSettingsDrawer();return}
      if(act==='liveadd'){const k=slug(b.querySelector('[data-bind="newlive"]').value).replace(/-/g,'');if(k&&!(k in c.live)){c.live[k]='';markDirty();openSettingsDrawer()}return}
      if(act==='voicedel')confirmButton(btn,'Click again to remove',()=>{VOICE.forget();openSettingsDrawer()});
      if(act==='voiceset'){drawer.hidden=true;VOICE.forget();stepEnroll(who)}
    };
  }

  /* ----- Photos: shrink in the browser, then commit to images/ in the repo ----- */
  let photoCb=null,photoName='photo',photoStatus=null;
  function choosePhoto(name,cb,statusEl){photoName=name;photoCb=cb;photoStatus=statusEl;picker.value='';picker.click()}
  picker.addEventListener('change',async()=>{
    const f=picker.files[0];if(!f||!photoCb)return;
    const note=t=>{if(photoStatus)photoStatus.textContent=t;status(t)};
    if(!f.type.startsWith('image/')){note('That file isn’t an image.');return}
    try{
      note('Preparing photo…');
      const bmp=await createImageBitmap(f),scale=Math.min(1,1600/Math.max(bmp.width,bmp.height));
      const cv=document.createElement('canvas');cv.width=Math.round(bmp.width*scale);cv.height=Math.round(bmp.height*scale);
      cv.getContext('2d').drawImage(bmp,0,0,cv.width,cv.height);
      const blob=await new Promise(r=>cv.toBlob(r,'image/jpeg',.85));
      const path=`images/${slug(photoName)}-${Date.now().toString(36)}.jpg`;
      note('Uploading photo to GitHub…');
      await GH.put(path,await blobToB64(blob),`Add photo ${path}`);
      S().photoCache[path]=URL.createObjectURL(blob);
      note('Photo uploaded. Save to keep it on the page.');
      photoCb(path);
    }catch(err){note(err.status===401?'GitHub rejected the token. Sign in again.':'The photo didn’t upload. Try again.')}
  });
  document.getElementById('portrait').addEventListener('click',()=>{
    if(!document.body.classList.contains('editing'))return;
    choosePhoto('portrait',path=>{S().content.profile.photo=path;markDirty();S().render()},null);
  });

  /* ----- Toolbar ----- */
  bar.addEventListener('click',async e=>{
    const b=e.target.closest('[data-bar]');if(!b)return;const act=b.dataset.bar;
    if(act==='settings')openSettingsDrawer();
    if(act==='restore'){const d=readDraft();if(d){S().content=d.content;markDirty();S().render();b.hidden=true;status('Draft restored. Save to publish it.')}}
    if(act==='discard'){if(!dirty){status('Nothing to discard.');return}
      confirmButton(b,'Click again to discard',()=>{S().content=clone(original);dirty=false;local.del(KEYS.draft);drawer.hidden=true;S().render();status('Changes discarded.')})}
    if(act==='save')save(b);
    if(act==='signout'){
      const out=()=>{forgetToken();exitEditor()};
      dirty?confirmButton(b,'Unsaved changes. Click again to sign out',out):out();
    }
  });
  async function save(btn){
    if(!dirty){status('Already saved.');return}
    const c=S().content;c.admin=c.admin||{};
    if(GH.owner&&GH.repo){c.admin.owner=GH.owner;c.admin.repo=GH.repo;c.admin.branch=GH.branch}
    btn.disabled=true;status('Saving to GitHub…');
    try{
      await GH.put('content.json',utf8ToB64(JSON.stringify(c,null,2)+'\n'),'Update site content from the editor');
      original=clone(c);dirty=false;local.del(KEYS.draft);
      status('Saved. Your live site updates in about a minute.');
    }catch(err){
      status(err.status===401?'GitHub rejected the token. Sign out and sign in again.':err.status===409?'Someone (maybe you, elsewhere) changed content.json. Reload, then redo your edit.':err.status===0?'Couldn’t reach GitHub. Your edits are kept here; try again.':`Save failed (${err.status}). Your edits are kept here.`);
    }finally{btn.disabled=false}
  }
})();
