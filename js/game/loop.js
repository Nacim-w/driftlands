'use strict';
let upCool=0,upWait=15,last=performance.now(),adaptT=0,adaptN=0,adaptS=0,banT=0,msgT=0,curIsl=null,islCheck=0;
// frame pacing: measure the display's refresh rate, then render every Nth vsync so we land near 60fps
// instead of burning the GPU at 120/144/240Hz.
let vsync=0,vsN=0,vsPrev=0,stride=1,tick=0;
function pace(now){
  if(vsN<40){if(vsPrev){const d=now-vsPrev;if(d>2&&(!vsync||d<vsync))vsync=d;}vsPrev=now;vsN++;if(vsN===40&&vsync)stride=Math.max(1,Math.round(1000/vsync/62));}
  tick++;
  if(paused||!started)return tick%(stride*2)===0;   // idle screens only need ~30fps
  return tick%stride===0;
}
function frame(now){
  if(!pace(now)){requestAnimationFrame(frame);return;}
  const dt=Math.min((now-last)/1000,.05);last=now;time+=dt;
  if(started||SHOT)tod=(tod+dt/DAY*(K.KeyT?45:1))%1;
  if(started&&!paused)updatePlayer(dt);
  updateChunks(false);

  // --- sky & light ---
  const ang=(tod-.25)*TAU;const sun=norm([Math.cos(ang),Math.sin(ang)*.92+.2,.38]);const e=sun[1];
  const [zen,hor,glow,lc,ambS,ambG]=palette(e);
  let L,k;if(e>-.06){L=norm([sun[0],Math.max(sun[1],.06),sun[2]]);k=sstep(-.06,.03,e);}else{L=norm([-sun[0],Math.max(-sun[1],.06),-sun[2]]);k=sstep(-.06,-.2,e);}
  NIGHT=sstep(-.02,-.2,e);DAYF=sstep(-.05,.15,e);
  U.uSunDir=sun;U.uZen=zen;U.uHor=hor;U.uGlow=glow;U.uLightDir=L;U.uLightCol=mul3(lc,k);U.uAmbS=ambS;U.uAmbG=ambG;
  U.uFogDen=1/lerp(1100,1700,DAYF);U.uNight=NIGHT;U.uTime=time;

  // --- camera ---
  const speed=Math.hypot(P.vel[0],P.vel[1],P.vel[2]);
  P.fov=lerp(P.fov,70+clamp(speed-30,0,70)*.22,1-Math.exp(-dt*3));
  const fov=P.fov*Math.PI/180,asp=W/H;
  const cp=Math.cos(P.pitch);camF=[Math.sin(P.yaw)*cp,Math.sin(P.pitch),-Math.cos(P.yaw)*cp];
  camR=norm([-camF[2],0,camF[0]]);
  const cu=[camR[1]*camF[2]-camR[2]*camF[1],camR[2]*camF[0]-camR[0]*camF[2],camR[0]*camF[1]-camR[1]*camF[0]];camU=cu;
  // bank into turns while flying
  const yawV=(P.yaw-P.lastYaw)/Math.max(dt,1e-3);P.lastYaw=P.yaw;
  const strafe=(K.KeyD?1:0)-(K.KeyA?1:0)+TI.mx;
  const tRoll=P.walk||paused?0:(clamp(-yawV*.05,-.32,.32)-strafe*.07)*clamp(speed/40,0,1)*(CFG.view3?.4:1);
  P.roll=lerp(P.roll,tRoll,1-Math.exp(-dt*3.5));
  if(Math.abs(P.roll)>1e-4){const c=Math.cos(P.roll),s=Math.sin(P.roll);
    const r2=[camR[0]*c+camU[0]*s,camR[1]*c+camU[1]*s,camR[2]*c+camU[2]*s],u2=[camU[0]*c-camR[0]*s,camU[1]*c-camR[1]*s,camU[2]*c-camR[2]*s];camR=r2;camU=u2;}
  const bob=P.walk&&P.ground?Math.sin(P.bob)*.07:0;
  const eye=CFG.view3?chaseCam(dt,speed):[P.pos[0],P.pos[1]+bob,P.pos[2]];
  U.uCam=eye;U.uVP=mmul(persp(fov,asp,.3,7000),viewM(eye,camF,camR,camU));
  const tY=Math.tan(fov/2),tX=tY*asp;
  // sun on screen (for god rays)
  const sz=dot(sun,camF);SUNV=0;
  if(sz>0){const sx=dot(sun,camR)/(sz*tX),sy=dot(sun,camU)/(sz*tY);SUNUV=[sx*.5+.5,sy*.5+.5];
    SUNV=sstep(0,.35,sz)*sstep(-.04,.06,e)*(1-sstep(1,1.5,Math.max(Math.abs(sx),Math.abs(sy))))*(1-NIGHT);}

  updateLife(dt,NIGHT,DAYF);
  updateFauna(dt,NIGHT,DAYF);
  updateChar(dt,eye);
  AU.update(dt,speed,NIGHT,DAYF,AN.aura);

  // --- HUD ---
  if(hudDirty){wcEl.textContent=SAVE.w;lcEl.textContent=SAVE.l;$('sc').textContent=SHR.size;hudDirty=false;}
  compT-=dt;if(compT<=0){compT=1/30;updateCompass();}
  const hrs=(tod*24+24)%24,hh=Math.floor(hrs),mm=Math.floor((hrs-hh)*60);
  const ph=e>.18?'day':e>-.12?(Math.cos(ang)>0?'dawn':'dusk'):'night';
  clockEl.textContent=ph+' · '+String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0')+(K.KeyT?' ››':'');
  if(msgT>0){msgT-=dt;if(msgT<=0)msgEl.classList.remove('on');}
  if(banT>0){banT-=dt;if(banT<=0)banEl.classList.remove('on');}
  islCheck-=dt;
  if(started&&islCheck<=0){islCheck=.3;let best=null;
    for(const I of activeIsl){if(I.islet)continue;const dx=P.pos[0]-I.x,dz=P.pos[2]-I.z;
      if(dx*dx+dz*dz<(I.maxR*1.05)**2&&P.pos[1]>I.y-I.depth*.5&&P.pos[1]<I.y+I.R*.4+80){best=I;break;}}
    if(best&&best!==curIsl)banner(best);curIsl=best;}

  render(eye,tX,tY,asp);
  if(shot){shot=false;cv.toBlob(b=>{if(!b)return;const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='driftlands-'+Date.now()+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000);});msg('Photo saved.',2);}

  // adaptive resolution: drop quickly when we miss budget, creep back up rarely (backs off if it keeps failing)
  adaptT+=dt;adaptS+=dt;adaptN++;
  if(adaptT>3){const avg=adaptS/adaptN,budget=started&&!paused?stride/Math.max(1,1000/(vsync||16.7)):.05;
    upCool-=adaptT;
    if(started&&!paused){
      if(avg>Math.max(budget*1.25,.019)&&RS>.5){RS*=.85;resize(true);if(upCool>-1&&upCool<upWait)upWait=Math.min(upWait*2,240);upCool=upWait;}
      else if(avg<Math.max(budget*1.08,.0175)&&RS<1&&upCool<=0){RS=Math.min(1,RS/.9);resize(true);upCool=upWait;}}
    adaptT=adaptS=adaptN=0;}
  requestAnimationFrame(frame);
}
