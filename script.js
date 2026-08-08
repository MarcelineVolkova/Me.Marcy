const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const toast = $('#toast');
const banner = $('#bannerMedia');
const fxLayer = $('#fxLayer');

function showToast(text){
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(()=>toast.classList.remove('show'), 1600);
}

window.addEventListener('load',()=>setTimeout(()=>$('#bootScreen')?.classList.add('done'),650));
document.body.classList.add('aura-night');

setInterval(()=>{ const d=new Date(); $('#liveClock').textContent=d.toLocaleTimeString('pt-BR',{hour12:false}); },1000);

const revealObs = new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.08});
$$('.reveal').forEach(el=>revealObs.observe(el));

$$('.rail-btn[data-target]').forEach(btn=>btn.addEventListener('click',()=>{
  document.getElementById(btn.dataset.target)?.scrollIntoView({behavior:'smooth',block:'center'});
  $$('.rail-btn[data-target]').forEach(x=>x.classList.remove('active')); btn.classList.add('active');
}));

$('#copyBtn')?.addEventListener('click',async e=>{
  const v=e.currentTarget.dataset.copy;
  try{await navigator.clipboard.writeText(v);showToast('user copiado ♡')}catch{showToast(v)}
});

const glow=$('#cursorGlow');
window.addEventListener('pointermove',e=>{if(glow){glow.style.left=e.clientX+'px';glow.style.top=e.clientY+'px'}});

$$('.magnetic').forEach(el=>{
  el.addEventListener('pointermove',e=>{
    if(innerWidth<800)return;
    const r=el.getBoundingClientRect();
    const x=(e.clientX-r.left-r.width/2)*.09,y=(e.clientY-r.top-r.height/2)*.09;
    el.style.transform=`translate(${x}px,${y}px)`
  });
  el.addEventListener('pointerleave',()=>el.style.transform='')
});

$$('.tilt-card').forEach(card=>{
  card.addEventListener('pointermove',e=>{
    if(innerWidth<820)return;
    const r=card.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
    card.style.transform=`rotateX(${(-y*4).toFixed(2)}deg) rotateY(${(x*5).toFixed(2)}deg) translateY(-2px)`
  });
  card.addEventListener('pointerleave',()=>card.style.transform='')
});

const canvas=$('#ambientCanvas'),ctx=canvas?.getContext('2d');let stars=[];
function resize(){
  if(!canvas)return;
  canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;
  canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px';
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  stars=Array.from({length:Math.min(70,Math.floor(innerWidth/18))},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,r:Math.random()*1.3+.3,v:Math.random()*.16+.03,a:Math.random()*.35+.08}))
}
function animateStars(){
  if(!ctx)return;
  ctx.clearRect(0,0,innerWidth,innerHeight);
  for(const s of stars){
    s.y-=s.v;
    if(s.y<-3){s.y=innerHeight+3;s.x=Math.random()*innerWidth}
    ctx.globalAlpha=s.a;ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill()
  }
  requestAnimationFrame(animateStars)
}
resize();animateStars();window.addEventListener('resize',resize);

const BANNER_CONFIG = {
  // Coloque seu GIF em assets/img/banner.gif.
  // O site tenta usar o GIF primeiro e cai para banner.jpg se ele não existir.
  gif: 'assets/img/banner.gif',
  fallback: 'assets/img/banner.jpg',
  fit: 'cover',
  x: 50,
  y: 50,
  zoom: 100,
  brightness: 100,
  saturation: 110
};
function applyBannerStyle(){
  if(!banner) return;
  banner.style.objectFit=BANNER_CONFIG.fit;
  banner.style.objectPosition=`${BANNER_CONFIG.x}% ${BANNER_CONFIG.y}%`;
  banner.style.transform=`scale(${BANNER_CONFIG.zoom/100})`;
  banner.style.filter=`brightness(${BANNER_CONFIG.brightness/100}) saturate(${BANNER_CONFIG.saturation/100})`;
}
function applyPublicBanner(){
  if(!banner) return;
  applyBannerStyle();
  const probe = new Image();
  probe.onload = ()=>{ banner.src = BANNER_CONFIG.gif; };
  probe.onerror = ()=>{ banner.src = BANNER_CONFIG.fallback; };
  probe.src = BANNER_CONFIG.gif + '?v=' + Date.now();
}
applyPublicBanner();

const audio=$('#profileAudio');
const musicToggle=$('#musicToggle');
const railAudioBtn=$('#railAudioBtn');
const volumeRange=$('#volumeRange');
const volumeBtn=$('#volumeBtn');
const musicProgress=$('#musicProgress');
const musicCurrent=$('#musicCurrent');
const musicDuration=$('#musicDuration');
const equalizer=$('#equalizer');
let previousVolume=.25;
let triedAutoPlay=false;

function formatTime(sec){
  if(!Number.isFinite(sec)) return '00:00';
  const m=Math.floor(sec/60); const s=Math.floor(sec%60);
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function syncPlayer(){
  if(!audio) return;
  const playing=!audio.paused;
  musicToggle.textContent=playing?'❚❚':'▶';
  musicToggle.setAttribute('aria-label',playing?'Pausar música':'Tocar música');
  railAudioBtn?.classList.toggle('playing',playing);
  equalizer?.classList.toggle('paused',!playing);
  const pct=audio.duration ? (audio.currentTime/audio.duration)*100 : 0;
  musicProgress.value=Number.isFinite(pct)?pct:0;
  musicCurrent.textContent=formatTime(audio.currentTime);
  musicDuration.textContent=formatTime(audio.duration);
  volumeRange.value=Math.round(audio.volume*100);
  volumeBtn.textContent=audio.muted||audio.volume===0?'×':'⌁';
}
async function toggleAudio(){
  if(!audio) return;
  try{
    if(audio.paused) await audio.play(); else audio.pause();
  }catch(err){
    console.warn(err); showToast('o navegador pediu um clique para liberar o áudio');
  }
  syncPlayer();
}
async function tryAutoPlay(){
  if(!audio || triedAutoPlay) return;
  triedAutoPlay=true;
  try{
    audio.volume=.55;
    audio.muted=false;
    await audio.play();
    syncPlayer();
  }catch(err){
    console.warn('Autoplay bloqueado', err);
    const unlock = async ()=>{
      try{ await audio.play(); syncPlayer(); }catch(e){ console.warn(e); }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock, {once:true});
    window.addEventListener('keydown', unlock, {once:true});
  }
}
if(audio){
  audio.volume=.25;
  audio.addEventListener('loadedmetadata',syncPlayer);
  audio.addEventListener('timeupdate',syncPlayer);
  audio.addEventListener('play',syncPlayer);
  audio.addEventListener('pause',syncPlayer);
  audio.addEventListener('volumechange',syncPlayer);
  setTimeout(tryAutoPlay, 900);
}
musicToggle?.addEventListener('click',toggleAudio);
railAudioBtn?.addEventListener('click',toggleAudio);
volumeRange?.addEventListener('input',()=>{
  if(!audio)return;
  audio.muted=false;
  audio.volume=Math.max(0,Math.min(1,Number(volumeRange.value)/100));
  if(audio.volume>0) previousVolume=audio.volume;
  syncPlayer();
});
volumeBtn?.addEventListener('click',()=>{
  if(!audio)return;
  if(audio.muted||audio.volume===0){audio.muted=false;audio.volume=previousVolume||.55}
  else{previousVolume=audio.volume;audio.muted=true}
  syncPlayer();
});
musicProgress?.addEventListener('input',()=>{
  if(!audio?.duration)return;
  audio.currentTime=(Number(musicProgress.value)/100)*audio.duration;
  syncPlayer();
});

const EFFECT_IMAGES = [
  'assets/placeholders/rain-01.png',
  'assets/placeholders/rain-02.png',
  'assets/placeholders/rain-03.png',
  'assets/placeholders/rain-04.png',
  'assets/placeholders/rain-05.png',
  'assets/placeholders/rain-06.png'
];

function burstAt(x,y,count=14){
  for(let i=0;i<count;i++){
    const s=document.createElement('span');
    s.className='spark';
    s.textContent=['✦','♡','⋆','✧','+'][Math.floor(Math.random()*5)];
    s.style.left=x+'px';
    s.style.top=y+'px';
    s.style.setProperty('--x',`${(Math.random()-.5)*190}px`);
    s.style.setProperty('--y',`${(Math.random()-.5)*190}px`);
    document.body.appendChild(s);
    setTimeout(()=>s.remove(),1000)
  }
}

let rainLock=false;
function createRainItem(){
  const img = document.createElement('img');
  img.className = 'rain-item';
  img.src = EFFECT_IMAGES[Math.floor(Math.random()*EFFECT_IMAGES.length)];
  img.alt = '';
  const size = 58 + Math.random()*66;
  img.style.width = `${size}px`;
  img.style.left = `${Math.random()*100}vw`;
  img.style.animationDuration = `${5.5 + Math.random()*3.5}s`;
  img.style.animationDelay = `${Math.random()*.2}s`;
  img.style.setProperty('--rot', `${-24 + Math.random()*48}deg`);
  img.style.opacity = `${.72 + Math.random()*.2}`;
  fxLayer.appendChild(img);
  setTimeout(()=>img.remove(), 9200);
}
function startImageRain(duration=5600){
  if(rainLock) return;
  rainLock = true;
  showToast('yupiiiiii');
  const t0 = Date.now();
  const spawn = ()=>{
    createRainItem();
    if(Date.now()-t0 < duration){
      setTimeout(spawn, 140);
    } else {
      setTimeout(()=>rainLock=false, 1200);
    }
  };
  spawn();
}
function stickerBurst(){
  showToast('aeeeeee pokemon');
  const cx = innerWidth/2, cy = innerHeight/2;
  for(let i=0;i<9;i++){
    const card = document.createElement('div');
    card.className='sticker-card';
    const img = document.createElement('img');
    img.src = EFFECT_IMAGES[i % EFFECT_IMAGES.length];
    img.alt = '';
    card.appendChild(img);
    const angle = (Math.PI*2/9) * i + Math.random()*.35;
    const dist = 150 + Math.random()*190;
    card.style.setProperty('--tx', `${Math.cos(angle)*dist}px`);
    card.style.setProperty('--ty', `${Math.sin(angle)*dist}px`);
    card.style.left = `${cx-44}px`;
    card.style.top = `${cy-60}px`;
    card.style.setProperty('--rot', `${-18 + Math.random()*36}deg`);
    fxLayer.appendChild(card);
    setTimeout(()=>card.remove(), 6200);
  }
  burstAt(cx, cy, 20);
}
$('#rainBtn')?.addEventListener('click', e=>{const r=e.currentTarget.getBoundingClientRect();burstAt(r.left+r.width/2,r.top+r.height/2,10);startImageRain();});
$('#burstBtn')?.addEventListener('click', e=>{const r=e.currentTarget.getBoundingClientRect();burstAt(r.left+r.width/2,r.top+r.height/2,18);stickerBurst();});
$('#railFxBtn')?.addEventListener('click',()=>startImageRain());




function setupTickerMarquee(){
  const marquee = document.querySelector('.marquee-ticker');
  const track = marquee?.querySelector('.marquee-track');
  const span = track?.querySelector('span');
  if(!marquee || !track || !span) return;

  const update = ()=>{
    const edge = 18;
    const containerWidth = marquee.clientWidth;
    const textWidth = span.getBoundingClientRect().width;

    // Always give it a real travel distance. If the text is shorter than the bar,
    // it glides from left to right. If it is longer, it pans across the overflow.
    const start = edge;
    let end = containerWidth - textWidth - edge;
    if(Math.abs(end - start) < 80){
      end = start - 160;
    }

    const distance = Math.abs(end - start);
    const duration = Math.max(7, Math.min(18, distance / 34));

    marquee.style.setProperty('--marquee-start', `${start}px`);
    marquee.style.setProperty('--marquee-end', `${end}px`);
    track.style.animationDuration = `${duration}s`;
    marquee.classList.remove('is-static');
  };

  requestAnimationFrame(update);
  window.addEventListener('load', update, {once:true});
  let resizeTimer;
  window.addEventListener('resize', ()=>{
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(update, 120);
  });
}
setupTickerMarquee();

// Bloqueio superficial de atalhos comuns de inspeção (não altera a interface do site).
(() => {
  document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  }, { capture: true });

  document.addEventListener('keydown', (event) => {
    const key = String(event.key || '').toLowerCase();
    const ctrlOrCmd = event.ctrlKey || event.metaKey;

    const blocked =
      key === 'f12' ||
      (ctrlOrCmd && event.shiftKey && ['i', 'j', 'c', 'k'].includes(key)) ||
      (ctrlOrCmd && ['u', 's'].includes(key));

    if (blocked) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }, { capture: true });
})();
