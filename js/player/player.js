'use strict';
/* =====================================================================
   6. PLAYER + INPUT
   ===================================================================== */
const P={pos:[0,0,0],vel:[0,0,0],yaw:0,pitch:-.08,walk:false,ground:false,wasGround:false,air:0,jumpHeld:false,bob:0,fov:70,roll:0,lastYaw:0,inWind:0,
  gliding:false,boostHeld:false,launch:0,launched:false,upPrev:false,landV:0,inPlanar:false,inVert:false};
// settings (persisted)
const CFG={sens:1,vol:.85,inv:false,q:1,view3:true};
try{Object.assign(CFG,JSON.parse(localStorage.getItem('driftlands:cfg'))||{});}catch(e){}
function saveCfg(){try{localStorage.setItem('driftlands:cfg',JSON.stringify(CFG));}catch(e){}}
let paused=false,wasLocked=false;
const K={};const TI={mx:0,my:0,lx:0,ly:0,up:false,down:false,boost:false};
let started=false,drag=false,shot=false;
let time=0,tod=Q.has('t')?parseFloat(Q.get('t'))%1:.7;

function lockPointer(){try{const pr=cv.requestPointerLock&&cv.requestPointerLock();if(pr&&pr.catch)pr.catch(()=>{});}catch(e){}}
function start(){if(started)return;started=true;$('intro').classList.add('gone');AU.init();if(!matchMedia('(pointer:coarse)').matches)lockPointer();cv.focus();
  setTimeout(()=>msg(SAVE.total?'Welcome back. '+SAVE.total+' wisps gathered so far.':'Follow the drifting lights.',5),1800);}
$('intro').addEventListener('click',start);
addEventListener('keydown',e=>{
  const k=e.code;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(k))e.preventDefault();
  if(!started){if(k==='Enter'||k==='Space')start();return;}
  if(k==='Escape'&&document.pointerLockElement!==cv){showPause(!paused);return;}
  if(paused)return;
  if(e.repeat){K[k]=true;return;}K[k]=true;
  if(k==='KeyE')releaseLantern();
  if(k==='KeyG')toggleWalk();
  if(k==='KeyV')setView(!CFG.view3,true);
  if(k==='KeyH')$('hud').classList.toggle('off');
  if(k==='KeyM')AU.toggle();
  if(k==='KeyP')shot=true;
});
addEventListener('keyup',e=>{K[e.code]=false;});
addEventListener('blur',()=>{for(const k in K)K[k]=false;});
document.addEventListener('mousemove',e=>{if(paused)return;if(document.pointerLockElement===cv||drag){const s=.0021*CFG.sens;P.yaw+=e.movementX*s;P.pitch=clamp(P.pitch-e.movementY*s*(CFG.inv?-1:1),-1.52,1.52);}});
// pause / settings
function showPause(on){paused=on;$('pause').classList.toggle('hide',!on);if(on)for(const k in K)K[k]=false;}
document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement===cv){wasLocked=true;showPause(false);}else if(started&&wasLocked)showPause(true);});
{const sS=$('sSens'),sV=$('sVol'),sQ=$('sQual'),sI=$('sInv');sS.value=CFG.sens;sV.value=CFG.vol;sQ.value=String(CFG.q);sI.checked=CFG.inv;$('pSeed').textContent=SEED;
  sS.oninput=()=>{CFG.sens=+sS.value;saveCfg();};
  sV.oninput=()=>{CFG.vol=+sV.value;saveCfg();if(AU.c&&!AU.muted)AU.m.gain.setTargetAtTime(CFG.vol,AU.c.currentTime,.1);};
  sQ.onchange=()=>{CFG.q=+sQ.value;saveCfg();RS=1;resize(true);};
  sI.onchange=()=>{CFG.inv=sI.checked;saveCfg();};
  $('sView').onchange=()=>setView($('sView').checked,false);
  $('bRes').onclick=()=>{showPause(false);if(!matchMedia('(pointer:coarse)').matches)lockPointer();};
  $('bNew').onclick=()=>{location.search='?seed='+(1+Math.floor(Math.random()*99999));};
  $('bHome').onclick=()=>{showPause(false);spawn();P.vel=[0,0,0];P.walk=false;$('tWalk').classList.remove('on');P.launch=0;AN.init=false;$('mode').textContent='flight';if(!matchMedia('(pointer:coarse)').matches)lockPointer();};}
function setView(on,say){CFG.view3=on;saveCfg();$('cross').style.display=on?'none':'';$('sView').checked=on;if(say)msg(on?'Third-person view':'First-person view',1.5);}
setView(CFG.view3,false);
cv.addEventListener('mousedown',()=>{if(!started){start();return;}if(document.pointerLockElement!==cv){drag=true;lockPointer();}});
addEventListener('mouseup',()=>{drag=false;});
// touch: two on-screen sticks (left = move, right = look) plus buttons. No drag/gesture controls.
const coarse=matchMedia('(pointer:coarse)').matches;
function stick(id,cb){const el=$(id),knob=el.firstElementChild;let pid=null,cx=0,cy=0,R=1;
  const set=(x,y)=>{knob.style.transform='translate('+(x*R).toFixed(1)+'px,'+(y*R).toFixed(1)+'px)';};
  const move=e=>{if(e.pointerId!==pid)return;let x=(e.clientX-cx)/R,y=(e.clientY-cy)/R;const l=Math.hypot(x,y);if(l>1){x/=l;y/=l;}set(x,y);cb(x,y);};
  const end=e=>{if(e.pointerId!==pid)return;pid=null;el.classList.remove('act');set(0,0);cb(0,0);};
  el.addEventListener('pointerdown',e=>{if(pid!==null)return;e.preventDefault();if(!started)start();pid=e.pointerId;try{el.setPointerCapture(pid);}catch(_){}
    const r=el.getBoundingClientRect();cx=r.left+r.width/2;cy=r.top+r.height/2;R=r.width*.34;el.classList.add('act');move(e);});
  el.addEventListener('pointermove',move);el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);el.addEventListener('lostpointercapture',end);}
const dz=(x,y)=>{const l=Math.hypot(x,y);if(l<.14)return[0,0];const s=(l-.14)/.86/l;return[x*s,y*s];};
stick('sL',(x,y)=>{const v=dz(x,y);TI.mx=v[0];TI.my=-v[1];});
stick('sR',(x,y)=>{const v=dz(x,y);TI.lx=v[0];TI.ly=v[1];});
if(coarse){$('touch').style.display='block';
  document.addEventListener('contextmenu',e=>e.preventDefault());
  document.querySelector('#intro .k').innerHTML='left stick — move &nbsp;·&nbsp; right stick — look<br>▲ ▼ — rise / sink &nbsp;·&nbsp; » — boost (tap to toggle) &nbsp;·&nbsp; ✦ — lantern &nbsp;·&nbsp; WALK — walk / fly &nbsp;·&nbsp; VIEW — camera';}
const tb=(id,down,up)=>{const el=$(id);
  el.addEventListener('pointerdown',e=>{e.preventDefault();if(!started)start();try{el.setPointerCapture(e.pointerId);}catch(_){}down();});
  const end=e=>{e.preventDefault();up&&up();};el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);};
const hold=(id,k)=>tb(id,()=>{TI[k]=true;$(id).classList.add('hold');},()=>{TI[k]=false;$(id).classList.remove('hold');});
hold('tUp','up');hold('tDown','down');
tb('tBoost',()=>{TI.boost=!TI.boost;$('tBoost').classList.toggle('on',TI.boost);});
tb('tLan',()=>releaseLantern());tb('tWalk',()=>toggleWalk());tb('tMenu',()=>showPause(true));tb('tView',()=>setView(!CFG.view3,true));

function toggleWalk(){P.walk=!P.walk;$('mode').textContent=P.walk?'walking':'flight';$('tWalk').classList.toggle('on',P.walk);
  // lifting off from standing: crouch, then the orbs push you up
  if(!P.walk&&P.ground){P.launch=1e-4;P.launched=false;}else P.launch=0;
  msg(P.walk?'Feet on the ground. Space to jump, hold it to glide.':'You lift into the air.',2.5);}

let camF=[0,0,-1],camR=[1,0,0],camU=[0,1,0];
function updatePlayer(dt){
  if(TI.lx||TI.ly){const c=v=>v*(.4+.6*Math.abs(v)),r=2.3*CFG.sens*dt;P.yaw+=c(TI.lx)*r;P.pitch=clamp(P.pitch-c(TI.ly)*r*(CFG.inv?-1:1),-1.52,1.52);}
  const cp=Math.cos(P.pitch);camF=[Math.sin(P.yaw)*cp,Math.sin(P.pitch),-Math.cos(P.yaw)*cp];
  const fh=[Math.sin(P.yaw),0,-Math.cos(P.yaw)],rt=[Math.cos(P.yaw),0,Math.sin(P.yaw)];
  const mf=(K.KeyW||K.ArrowUp?1:0)-(K.KeyS||K.ArrowDown?1:0)+TI.my;
  const ms=(K.KeyD||K.ArrowRight?1:0)-(K.KeyA||K.ArrowLeft?1:0)+TI.mx;
  const upk=K.Space||TI.up;const mu=(upk?1:0)-(K.KeyC||K.ControlLeft||TI.down?1:0);
  const boost=K.ShiftLeft||K.ShiftRight||TI.boost;
  P.inPlanar=Math.abs(mf)+Math.abs(ms)>.05;P.inVert=mu!==0;P.boostHeld=boost&&!P.walk;
  if(!P.walk){
    const sp=boost?160:30;P.gliding=false;
    let d=[camF[0]*mf+rt[0]*ms,camF[1]*mf+mu,camF[2]*mf+rt[2]*ms];const l=Math.hypot(d[0],d[1],d[2]);if(l>1)d=mul3(d,1/l);
    // take off from standing: a short crouch, then the orbs kick you upward
    if(P.ground&&upk&&!P.upPrev&&!P.launch&&Math.hypot(P.vel[0],P.vel[2])<6){P.launch=1e-4;P.launched=false;}
    if(P.launch>0){P.launch+=dt;if(P.launch>.75)P.launch=0;}
    if(P.launch>0&&P.launch<.22){const k=Math.exp(-14*dt);P.vel[0]*=k;P.vel[2]*=k;P.vel[1]=0;}
    else{
      if(P.launch>0&&!P.launched){P.launched=true;P.vel[1]=15;launchFx();}
      // accelerate toward the wanted velocity; ease off more gently than you speed up
      const tv=mul3(d,sp),dv=[tv[0]-P.vel[0],tv[1]-P.vel[1],tv[2]-P.vel[2]],dl=Math.hypot(dv[0],dv[1],dv[2]);
      if(dl>1e-5){const faster=Math.hypot(tv[0],tv[1],tv[2])>Math.hypot(P.vel[0],P.vel[1],P.vel[2])+.5;
        const rate=faster?(boost?16:11)+dl*1.1:5+dl*1.35,st=Math.min(1,rate*dt/dl);
        for(let i=0;i<3;i++)P.vel[i]+=dv[i]*st;}
    }
  }else{
    const sp=boost?19:9;
    let dx=fh[0]*mf+rt[0]*ms,dz=fh[2]*mf+rt[2]*ms;const l=Math.hypot(dx,dz);if(l>1){dx/=l;dz/=l;}
    const k=1-Math.exp(-(P.ground?(l>.1?7:10):1.6)*dt);
    P.vel[0]=lerp(P.vel[0],dx*sp,k);P.vel[2]=lerp(P.vel[2],dz*sp,k);
    P.vel[1]-=30*dt;
    if(P.ground&&upk&&!P.jumpHeld){P.vel[1]=12.5;P.ground=false;P.air=0;}
    P.air=P.ground?0:P.air+dt;
    P.gliding=!P.ground&&upk&&P.vel[1]<0&&P.air>.3;
    if(P.gliding){P.vel[1]=Math.max(P.vel[1],-3.2);P.vel[0]+=fh[0]*16*dt;P.vel[2]+=fh[2]*16*dt;
      const hs=Math.hypot(P.vel[0],P.vel[2]);if(hs>24){P.vel[0]*=24/hs;P.vel[2]*=24/hs;}}
    P.jumpHeld=upk;
    if(P.ground&&l>.1)P.bob+=dt*(boost?13:9);
  }
  // wind currents grab you and carry you along
  let inW=0;
  for(const c of active)for(const w of c.winds){const mx=P.pos[0]-w.mid[0],mz=P.pos[2]-w.mid[2];if(mx*mx+mz*mz>w.rad*w.rad)continue;
    for(let i=0;i<w.pts.length-1;i++){const a=w.pts[i],dx=a[0]-P.pos[0],dy=a[1]-P.pos[1],dz=a[2]-P.pos[2],d2=dx*dx+dy*dy+dz*dz;
      if(d2<196){const b=w.pts[i+1],tg=norm([b[0]-a[0],b[1]-a[1],b[2]-a[2]]),k=1-d2/196;
        for(let j=0;j<3;j++)P.vel[j]+=((tg[j]*78-P.vel[j])*2.4+[dx,dy,dz][j]*1.6)*k*dt;
        inW=Math.max(inW,k);break;}}}
  if(inW>.2&&!SAVE.windTip){SAVE.windTip=1;msg('A wind current! Let it carry you, or steer out of it.',4.5);save();}
  P.inWind=inW;
  for(let i=0;i<3;i++)P.pos[i]+=P.vel[i]*dt;
  const vy0=P.vel[1];
  collide();
  if(P.ground&&!P.wasGround&&vy0<-5)P.landV=vy0;
  P.upPrev=upk;
  if(P.pos[1]<SEA-22){P.vel[1]+=((SEA-22-P.pos[1])*3+18)*dt;}
  if(P.walk&&P.pos[1]<SEA+8){P.walk=false;$('mode').textContent='flight';msg('The clouds catch you. You remember how to fly.',4);}
  if(P.pos[1]>650)P.vel[1]-=(P.pos[1]-650)*2*dt;
}
function collide(){
  P.wasGround=P.ground;P.ground=false;const x=P.pos[0],z=P.pos[2];
  for(const I of activeIsl){
    const dx=x-I.x,dz=z-I.z;if(dx*dx+dz*dz>I.maxR*I.maxR)continue;
    const d=Math.hypot(dx,dz),er=edgeR(I,Math.atan2(dz,dx)),rf=d/er;if(rf>=1)continue;
    const top=topH(I,x,z,rf),y=P.pos[1];
    if(y>=top+EYE){if(P.walk&&P.wasGround&&y<top+EYE+.7&&P.vel[1]<=0){P.pos[1]=top+EYE;P.vel[1]=0;P.ground=true;}
      else if(!P.walk&&y<top+EYE+.08&&P.vel[1]<=.05)P.ground=true;   // resting on the ground in flight mode
      continue;}
    const bot=lerp(top-1.2,I.y-I.depth,Math.pow(Math.max(0,1-Math.pow(rf,1/1.25)),.8))-1.6;
    if(y<=bot)continue;
    const up=top+EYE-y,down=y-bot,out=(1-rf)*er+.8;
    if(up<2.6||up<Math.min(down,out)){P.pos[1]=top+EYE;if(P.vel[1]<0)P.vel[1]=0;P.ground=true;}
    else if(down<out){P.pos[1]=bot;if(P.vel[1]>0)P.vel[1]=0;}
    else{const k=(er+.8)/Math.max(d,.01);P.pos[0]=I.x+dx*k;P.pos[2]=I.z+dz*k;const nx=dx/d,nz=dz/d,vr=P.vel[0]*nx+P.vel[2]*nz;if(vr<0){P.vel[0]-=vr*nx;P.vel[2]-=vr*nz;}}
  }
}
