'use strict';
/* =====================================================================
   7. LIVING THINGS — wisps, followers, lanterns, sparks, birds, dust
   ===================================================================== */
const FOL=[],LANT=[],BURST=[],MOTES=[];
for(let i=0;i<200;i++)MOTES.push([Math.random()*70,Math.random()*70,Math.random()*70,Math.random()*TAU]);
const BIRDS=[];for(let i=0;i<36;i++)BIRDS.push({f:i<22?0:1,o:[(Math.random()-.5)*44,(Math.random()-.5)*12,(Math.random()-.5)*44],s:.9+Math.random()*.7,k:Math.random()*10,ph:Math.random()});
const FLOCK=[[0,70,0],[0,70,0]];
const BIRDBUF=new Float32Array(BIRDS.length*12);
// sky whales: two cruise high above the islands, two surface and dive through the cloud sea
const WHALES=[
  {hi:1,ph:0,r:760,sp:.011,s:46,c:[.3,.37,.5]},{hi:1,ph:2.6,r:1100,sp:-.007,s:64,c:[.4,.37,.48]},
  {hi:0,ph:1.1,r:620,sp:.013,s:38,c:[.28,.35,.44]},{hi:0,ph:4.2,r:950,sp:-.009,s:52,c:[.34,.39,.5]}];
for(const w of WHALES){w.a=[0,0,0];w.song=8+Math.random()*25;w.p=[0,0,0];}
const WHBUF=new Float32Array(WHALES.length*12);
// [colour, fall speed (negative = falls), size, sway]
const BFX={'Blossom Isle':[[1,.5,.72],-1.3,.15,3],'Frostcap':[[.85,.92,1],-2.6,.12,1.2],'Gloamshroom':[[.3,.85,1],.7,.13,2],'Ember Wood':[[1,.42,.08],-1.5,.15,3.5]};
let bfxK=0,bfxCur=null;
function whalePos(w,t){const ang=w.ph+t*w.sp;
  return[w.a[0]+Math.cos(ang)*w.r,w.hi?240+Math.sin(t*.045+w.ph)*60:SEA+14+Math.sin(t*.07+w.ph*2)*20,w.a[2]+Math.sin(ang)*w.r];}
const LINES={1:'A wisp joins you. It hums, softly, like it knew you.',3:'They gather around those who wander.',5:'Five lights now. Press E to send one up as a lantern.',
  10:'Ten. The wind seems to follow you.',25:'Twenty-five. Somewhere below the clouds, something stirs.',50:'Fifty wisps. The islands lean closer as you pass.',
  100:'One hundred. You are becoming a constellation.',200:'Two hundred lights. Even the stars look down.',500:'Five hundred. The sky will remember you.'};
let combo=0,lastC=-9,hudDirty=true;
function collect(w){
  w.got=true;GOT.add(w.id);SAVE.w++;SAVE.total++;
  combo=time-lastC<2.6?combo+1:0;lastC=time;AU.chime(combo);
  for(let i=0;i<24;i++){const a=Math.random()*TAU,b=Math.acos(Math.random()*2-1),s=3+Math.random()*7;
    BURST.push({p:[w.x,w.y,w.z],v:[Math.sin(b)*Math.cos(a)*s,Math.cos(b)*s,Math.sin(b)*Math.sin(a)*s],t:0,m:.6+Math.random()*.7});}
  if(LINES[SAVE.total])msg(LINES[SAVE.total],5.5);
  save();hudDirty=true;
}
function awaken(I){
  I.awake=true;SHR.add(I.seed);SAVE.shr=SHR.size;const s=I.shrine;
  for(let i=0;i<90;i++){const a=Math.random()*TAU,b=Math.acos(Math.random()*2-1),sp=4+Math.random()*12;
    BURST.push({p:[s[0],s[1],s[2]],v:[Math.sin(b)*Math.cos(a)*sp,Math.abs(Math.cos(b))*sp*1.4,Math.sin(b)*Math.sin(a)*sp],t:0,m:1+Math.random()*1.2});}
  if(AU.c){const t=AU.c.currentTime;[293.66,369.99,440,587.33,739.99].forEach((f,i)=>AU.bell(f,.07,t+i*.18));}
  msg('The shrine of '+I.name+' awakens. ('+SHR.size+(SHR.size===1?' shrine':' shrines')+' lit)',5.5);
  save();hudDirty=true;
}
function releaseLantern(){
  if(!started)return;
  if(SAVE.w<=0){msg('Gather a wisp first. It becomes the flame.',3);return;}
  SAVE.w--;SAVE.l++;
  const f=camF;LANT.push({p:[P.pos[0]+f[0]*3,P.pos[1]-.4+f[1]*3,P.pos[2]+f[2]*3],v:[f[0]*2+P.vel[0]*.3,1.4,f[2]*2+P.vel[2]*.3],t:0,ph:Math.random()*9});
  if(LANT.length>500)LANT.shift();
  if(FOL.length>SAVE.w)FOL.pop();
  AU.whoosh();if(SAVE.l===1)msg('Your first lantern rises. Watch it go.',5);
  save();hudDirty=true;
}
function updateLife(dt,night,day){
  const t=time,cam=P.pos;gn=0;
  // wisps
  for(const c of active)for(const w of c.wisps){if(w.got)continue;
    const dx=w.x-cam[0],dy=w.y-cam[1],dz=w.z-cam[2],d2=dx*dx+dy*dy+dz*dz;
    if(d2<225){const k=Math.min(1,dt*2.4);w.x-=dx*k;w.y-=dy*k;w.z-=dz*k;if(d2<16){collect(w);continue;}}
    if(d2>4.5e6)continue;
    const by=Math.sin(t*1.6+w.ph)*.6,br=(1+night*1.3)*(.82+.18*Math.sin(t*3.1+w.ph*2));
    gp(w.x,w.y+by,w.z,1.35,.5*br,.95*br,1.3*br,0);
    gp(w.x,w.y+by,w.z,6,.045*br,.1*br,.15*br,0);
  }
  // followers: your collected wisps trail behind you
  const nf=Math.min(SAVE.w,24);
  // (third person: they circle the wanderer; first person: they trail behind the camera)
  const tp=CFG.view3,fc=tp?[cam[0]-P.vel[0]*.06,cam[1]-EYE+1.5,cam[2]-P.vel[2]*.06]:[cam[0]-camF[0]*5,cam[1]-.8,cam[2]-camF[2]*5];
  while(FOL.length<nf)FOL.push({p:fc.slice(),v:[0,0,0],k:Math.random()*20});
  while(FOL.length>nf)FOL.pop();
  for(let i=0;i<FOL.length;i++){const f=FOL[i];const a=t*.9+f.k,rad=(tp?2.5:2.2)+(i%5)*(tp?.6:.7);
    const tx=fc[0]+Math.cos(a)*rad,ty=fc[1]+Math.sin(t*1.3+f.k)*1.2,tz=fc[2]+Math.sin(a)*rad;
    f.v[0]+=(tx-f.p[0])*5*dt;f.v[1]+=(ty-f.p[1])*5*dt;f.v[2]+=(tz-f.p[2])*5*dt;
    const dm=Math.exp(-2.6*dt);for(let j=0;j<3;j++){f.v[j]*=dm;f.p[j]+=f.v[j]*dt;}
    const br=.8+.2*Math.sin(t*4+f.k);gp(f.p[0],f.p[1],f.p[2],.4,1.3*br,.9*br,.45*br,0);gp(f.p[0],f.p[1],f.p[2],1.7,.1*br,.07*br,.03*br,0);}
  // lanterns
  for(let i=LANT.length-1;i>=0;i--){const L=LANT[i];L.t+=dt;
    if(L.t>360||L.p[1]>900){LANT.splice(i,1);continue;}
    const wx=Math.sin(t*.05+L.ph)*1.6+1.2,wz=Math.cos(t*.04+L.ph*1.3)*1.6;const k=1-Math.exp(-dt*.4);
    L.v[0]=lerp(L.v[0],wx,k);L.v[2]=lerp(L.v[2],wz,k);L.v[1]=lerp(L.v[1],2.4+Math.sin(L.ph)*.4,k);
    for(let j=0;j<3;j++)L.p[j]+=L.v[j]*dt;
    const fl=(.85+.15*Math.sin(t*9+L.ph*3)*Math.sin(t*5.3+L.ph))*Math.min(1,L.t*2)*(L.t>330?(360-L.t)/30:1);
    const sw=Math.sin(t*.8+L.ph)*.15;
    gp(L.p[0]+sw,L.p[1],L.p[2],1.25,1.7*fl,.62*fl,.16*fl,1);
    gp(L.p[0]+sw,L.p[1],L.p[2],7,.18*fl,.075*fl,.025*fl,0);}
  // sparks
  for(let i=BURST.length-1;i>=0;i--){const b=BURST[i];b.t+=dt;if(b.t>b.m){BURST.splice(i,1);continue;}
    const dm=Math.exp(-2.2*dt);for(let j=0;j<3;j++){b.v[j]*=dm;b.p[j]+=b.v[j]*dt;}b.v[1]+=2*dt;
    const a=1-b.t/b.m;gp(b.p[0],b.p[1],b.p[2],.25,1.1*a,1.2*a,1.4*a,0);}
  // fireflies + shrine halos + waterfall mist
  for(const I of activeIsl){const dx=I.x-cam[0],dz=I.z-cam[2],d2=dx*dx+dz*dz;if(d2>(I.maxR+1500)**2)continue;
    if(I.shrine){const s=I.shrine,p=.75+.25*Math.sin(t*1.7+I.x);gp(s[0],s[1],s[2],15,.32*p,.17*p,.06*p,0);gp(s[0],s[1],s[2],3,.7*p,.4*p,.15*p,0);}
    if(I.mists&&d2<(I.maxR+900)**2)for(const m of I.mists)for(let i=0;i<5;i++){const ph=t*.6+i*1.3;const yy=m[1]-((ph*9)%40);gp(m[0]+Math.sin(ph*3)*2,yy,m[2]+Math.cos(ph*2)*2,6,.035,.04,.045,0);}
    if(night>.03&&d2<4e5)for(const f of I.ff){const ph=f[3];const fl=Math.pow(Math.max(0,Math.sin(t*1.9+ph*5)),5)*night;if(fl<.03)continue;
      gp(f[0]+Math.sin(t*.37+ph)*2.5,f[1]+Math.sin(t*.53+ph*2)*1.1,f[2]+Math.cos(t*.41+ph)*2.5,.32,1.1*fl,1.4*fl,.3*fl,0);}}
  // dust motes catching the light
  const lc=U.uLightCol;
  for(const m of MOTES){const x=((m[0]+t*1.1-cam[0])%70+70)%70-35+cam[0],y=((m[1]+Math.sin(t*.2+m[3])*2-cam[1])%70+70)%70-35+cam[1],z=((m[2]+t*.6-cam[2])%70+70)%70-35+cam[2];
    const tw=.4+.6*Math.abs(Math.sin(t*.8+m[3]));const k=.02*tw;gp(x,y,z,.06,lc[0]*k+.006,lc[1]*k+.006,lc[2]*k+.01,0);}
  // birds
  const kf=1-Math.exp(-dt*.08);
  for(let i=0;i<2;i++){FLOCK[i][0]=lerp(FLOCK[i][0],cam[0]+(i?250:-200),kf);FLOCK[i][1]=lerp(FLOCK[i][1],Math.max(cam[1]+40,60),kf);FLOCK[i][2]=lerp(FLOCK[i][2],cam[2]+(i?-170:220),kf);}
  const bp=(b,tt)=>{const F=FLOCK[b.f];const ft=tt*(b.f?.045:.065)+b.f*3;
    return[F[0]+Math.cos(ft)*(210+b.f*90)+b.o[0]+Math.sin(tt*.4+b.k)*6,F[1]+Math.sin(ft*2.1)*16+b.o[1]+Math.sin(tt*.7+b.k)*3,F[2]+Math.sin(ft*1.3)*200+b.o[2]+Math.cos(tt*.5+b.k)*6];};
  // whales
  const kw=1-Math.exp(-dt*.03);
  for(let i=0;i<WHALES.length;i++){const w=WHALES[i];
    if(time<.1){w.a[0]=cam[0];w.a[2]=cam[2];}
    w.a[0]=lerp(w.a[0],cam[0],kw);w.a[2]=lerp(w.a[2],cam[2],kw);
    const p=whalePos(w,t),q=whalePos(w,t+1);w.p=p;
    const dx=q[0]-p[0],dy=q[1]-p[1],dz=q[2]-p[2],yaw=Math.atan2(-dx,-dz),pitch=Math.atan2(dy,Math.hypot(dx,dz))*.8;
    WHBUF.set([p[0],p[1],p[2],w.s,yaw,1,pitch,i*.37,w.c[0],w.c[1],w.c[2],0],i*12);
    const ddx=p[0]-cam[0],ddy=p[1]-cam[1],ddz=p[2]-cam[2],dist=Math.hypot(ddx,ddy,ddz);
    w.song-=dt;if(w.song<=0){w.song=16+Math.random()*30;if(dist<1800&&started)AU.song(.16*(1-dist/1800)+.02);}
    // bioluminescent spots along the flanks after dark
    if(night>.05&&dist<3000){const cy=Math.cos(yaw),sy=Math.sin(yaw);
      for(let k=0;k<8;k++){const lz=-.55+k*.15,tt=(lz+1)/2,lr=Math.pow(Math.sin(Math.PI*Math.pow(tt,.6)),.85)*.27*.98;
        const pul=night*(.5+.5*Math.sin(t*1.5-k*.7+i));
        for(const sx of [1,-1]){const lx=lr*sx;const wx=(cy*lx+sy*lz)*w.s,wz=(-sy*lx+cy*lz)*w.s;
          gp(p[0]+wx,p[1]-lz*Math.sin(pitch)*w.s,p[2]+wz,.9,.15*pul,.75*pul,1.1*pul,0);}}}
  }
  // shrines: touch one to wake it; awake shrines send a beam into the sky
  for(const I of activeIsl){if(!I.shrine)continue;const s=I.shrine;
    if(!I.awake){const dx=s[0]-cam[0],dy=s[1]-cam[1],dz=s[2]-cam[2];if(dx*dx+dy*dy+dz*dz<110)awaken(I);}
    else{const dx=s[0]-cam[0],dz=s[2]-cam[2];if(dx*dx+dz*dz>2.5e7)continue;
      for(let k=0;k<90;k++){const y=s[1]+k*6.5,f=Math.pow(1-k/90,1.4)*(.8+.2*Math.sin(t*2.4-k*.25));gp(s[0],y,s[2],7+k*.1,.2*f,.12*f,.045*f,2);gp(s[0],y,s[2],1.6,.5*f,.32*f,.14*f,2);}}}
  // wind currents: streams of motes that swirl along their path
  for(const c of active)for(const w of c.winds){const dx=w.mid[0]-cam[0],dz=w.mid[2]-cam[2];if(dx*dx+dz*dz>(2600+w.len/2)**2)continue;
    const n=w.pts.length-1,NP=Math.round(w.len/8);
    for(let k=0;k<NP;k++){const u=(k/NP+t*34/w.len)%1,f=u*n,i=Math.floor(f),fr=f-i,a=w.pts[i],b=w.pts[Math.min(i+1,n)];
      const sw=k*2.4+t*2.2,rr=1.5+(k*7)%6;const br=Math.sin(u*Math.PI)*(.13+night*.16);
      gp(lerp(a[0],b[0],fr)+Math.cos(sw)*rr,lerp(a[1],b[1],fr)+Math.sin(sw)*rr,lerp(a[2],b[2],fr)+Math.sin(sw*.7)*rr,.32,br*.85,br,br*1.15,0);}}
  // biome weather around you: petals, snow, spores, falling leaves
  const want=curIsl&&BFX[curIsl.bio.name];if(want)bfxCur=want;bfxK=lerp(bfxK,want?1:0,1-Math.exp(-dt*.8));
  if(bfxCur&&bfxK>.01){const [col,vy,sz,sway]=bfxCur,kk=bfxK*(.22+.3*night);
    for(let i=0;i<150;i++){const m=MOTES[i];
      const x=((m[0]*.7+Math.sin(t*.6+m[3])*sway-cam[0])%49+49)%49-24.5+cam[0];
      const y=((m[1]*.7+t*vy-cam[1])%49+49)%49-24.5+cam[1];
      const z=((m[2]*.7+Math.cos(t*.5+m[3])*sway+t*.4-cam[2])%49+49)%49-24.5+cam[2];
      gp(x,y,z,sz,col[0]*kk,col[1]*kk,col[2]*kk,0);}}
  const bc=mix3([.03,.03,.04],[.2,.2,.22],day);
  for(let i=0;i<BIRDS.length;i++){const b=BIRDS[i];const p=bp(b,t),q=bp(b,t+.25);const o=i*12;
    BIRDBUF.set([p[0],p[1],p[2],b.s,Math.atan2(-(q[0]-p[0]),-(q[2]-p[2])),1,1,b.ph+(i%3)*.1,bc[0],bc[1],bc[2],0],o);}
}
