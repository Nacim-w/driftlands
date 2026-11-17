'use strict';
/* =====================================================================
   7c. FAUNA — animals that live on the islands, and things that fly, glide and drift
   - deer / foxes / hares roam each island, graze, and bolt when you get close
   - butterflies by day (glowing moths in Gloamshroom after dark), bats at night
   - sky rays glide in formation, luminous jellies drift up through the sky
   Ground animals are only simulated and drawn when you are near (they ease in with distance).
   ===================================================================== */
const FA_RANGE=260;      // ground animals are drawn and simulated inside this distance
const FA_SPAWN=700;      // an island populates its herds the first time you come this close
const FA_CAP={deer:48,fox:48,hare:80,butterfly:220,ray:16,jelly:28,bat:24};
const FA_MODE={deer:4,fox:4,hare:4,butterfly:3,ray:5,jelly:0,bat:1};   // matches uFlap in the instance shader
const FM={},FAB={};
if(!SAVE.sp)SAVE.sp={};

/* ---------- meshes ---------- */
{
  const T=m=>[m,m,m,1],N=(r,g,b)=>[r,g,b,0];          // T = takes the animal's own colour, N = fixed colour
  const quad=(g,a,b,c,d,col)=>{g.t(a,b,c,col);g.t(a,c,d,col);};
  function fBox(g,cx,cy,cz,hx,hy,hz,c,tz=1){          // cuboid; tz<1 narrows the front (-z) face
    const P=(sx,sy,sz)=>{const k=sz<0?tz:1;return[cx+sx*hx*k,cy+sy*hy*k,cz+sz*hz];};
    quad(g,P(-1,1,-1),P(1,1,-1),P(1,1,1),P(-1,1,1),c);quad(g,P(-1,-1,-1),P(1,-1,-1),P(1,-1,1),P(-1,-1,1),c);
    quad(g,P(-1,-1,-1),P(-1,1,-1),P(-1,1,1),P(-1,-1,1),c);quad(g,P(1,-1,-1),P(1,1,-1),P(1,1,1),P(1,-1,1),c);
    quad(g,P(-1,-1,-1),P(1,-1,-1),P(1,1,-1),P(-1,1,-1),c);quad(g,P(-1,-1,1),P(1,-1,1),P(1,1,1),P(-1,1,1),c);}
  function fLimb(g,a,b,r0,r1,c){                      // tapered square-section limb from a to b
    const A=(sx,sz)=>[a[0]+sx*r0,a[1],a[2]+sz*r0],B=(sx,sz)=>[b[0]+sx*r1,b[1],b[2]+sz*r1];
    quad(g,A(-1,-1),A(1,-1),B(1,-1),B(-1,-1),c);quad(g,A(1,-1),A(1,1),B(1,1),B(1,-1),c);
    quad(g,A(1,1),A(-1,1),B(-1,1),B(1,1),c);quad(g,A(-1,1),A(-1,-1),B(-1,-1),B(-1,1),c);
    quad(g,B(-1,-1),B(1,-1),B(1,1),B(-1,1),c);}
  const dark=N(.1,.075,.065),pale=N(.96,.93,.87);

  // deer — nose toward -z, hooves at y=0, ~1.9 tall with antlers
  let g=GB();
  fBox(g,0,1.12,.05,.23,.27,.62,T(1));fBox(g,0,.95,.08,.19,.05,.5,pale);
  fLimb(g,[0,1.3,-.5],[0,1.85,-.82],.14,.1,T(1));
  fBox(g,0,1.9,-.96,.1,.1,.17,T(1),.65);fBox(g,0,1.84,-1.17,.05,.045,.03,dark);
  for(const sx of[-1,1]){
    g.t([sx*.07,2.0,-.88],[sx*.24,2.12,-.84],[sx*.09,1.92,-.84],T(.9));
    fLimb(g,[sx*.07,1.98,-.93],[sx*.17,2.45,-1.0],.028,.016,T(.5));fLimb(g,[sx*.12,2.2,-.96],[sx*.32,2.5,-1.07],.02,.01,T(.5));fLimb(g,[sx*.15,2.34,-.99],[sx*.1,2.66,-1.12],.016,.008,T(.5));}
  fBox(g,0,1.34,.72,.05,.08,.04,pale);
  for(const sx of[-1,1])for(const z of[-.42,.52]){fLimb(g,[sx*.15,.97,z],[sx*.15,.12,z],.075,.04,T(.84));fLimb(g,[sx*.15,.12,z],[sx*.15,0,z],.04,.046,dark);}
  FM.deer=instMesh(g.a);

  // fox — bushy tail with a pale tip, dark socks
  g=GB();
  fBox(g,0,.42,.05,.12,.13,.33,T(1));fBox(g,0,.34,-.17,.1,.07,.12,pale);
  fBox(g,0,.47,-.42,.09,.09,.12,T(1),.72);fBox(g,0,.44,-.58,.035,.035,.06,dark);
  for(const sx of[-1,1])g.t([sx*.075,.54,-.4],[sx*.03,.54,-.4],[sx*.06,.74,-.43],T(.9));
  fBox(g,0,.45,.64,.085,.09,.27,T(1));fBox(g,0,.45,.93,.07,.075,.07,pale);
  for(const sx of[-1,1])for(const z of[-.26,.3]){fLimb(g,[sx*.075,.32,z],[sx*.075,0,z],.036,.026,T(.5));}
  FM.fox=instMesh(g.a);

  // hare — long ears, white scut
  g=GB();
  fBox(g,0,.28,.06,.1,.12,.2,T(1));fBox(g,0,.3,.17,.12,.14,.14,T(1));
  fBox(g,0,.36,-.19,.075,.075,.1,T(1),.7);fBox(g,0,.35,-.3,.025,.025,.02,dark);
  for(const sx of[-1,1]){fLimb(g,[sx*.035,.42,-.17],[sx*.065,.86,-.21],.03,.017,T(.95));
    fLimb(g,[sx*.06,.2,-.1],[sx*.06,0,-.1],.026,.02,T(.8));fLimb(g,[sx*.1,.26,.17],[sx*.1,0,.08],.04,.026,T(.8));}
  fBox(g,0,.33,.34,.04,.04,.04,pale);
  FM.hare=instMesh(g.a);

  // butterfly / moth — wings in x
  g=GB();
  fBox(g,0,0,0,.014,.014,.12,N(.1,.08,.07));
  for(const sx of[-1,1]){
    g.t([0,0,-.08],[sx*.5,.03,-.2],[sx*.42,.03,.05],T(1));g.t([0,0,-.08],[sx*.42,.03,.05],[0,0,.02],T(1));
    g.t([0,0,0],[sx*.4,.02,.1],[sx*.22,.02,.3],T(.78));g.t([0,0,0],[sx*.22,.02,.3],[0,0,.12],T(.78));
    g.t([sx*.3,.035,-.08],[sx*.38,.035,-.06],[sx*.33,.035,-.01],N(1,1,1));}
  FM.butterfly=instMesh(g.a);

  // sky ray — a broad, soft kite with a long tail
  g=GB();
  const top=T(1),belly=N(.82,.86,.92);
  const M=[0,.14,-.05],B=[0,-.1,-.05],Nn=[0,.02,-.55],Tt=[0,0,.5];
  for(const sx of[-1,1]){
    const L1=[sx*.7,.03,-.25],L=[sx*1.55,-.04,.12],L2=[sx*.7,0,.3];
    g.t(M,Nn,L1,top);g.t(M,L1,L2,top);g.t(M,L2,Tt,top);g.t(L1,L,L2,top);
    g.t(B,Nn,L1,belly);g.t(B,L1,L2,belly);g.t(B,L2,Tt,belly);g.t(L1,L,L2,belly);
    g.t([sx*.1,0,-.5],[sx*.24,0,-.78],[sx*.04,0,-.55],T(.8));}
  g.t([-.025,0,.45],[.025,0,.45],[0,-.02,1.7],N(.22,.22,.28));
  FM.ray=instMesh(g.a);

  // jelly — glowing bell, trailing tendrils (they sway via the wind term in the shader)
  g=GB();
  const apex=[0,.95,0],NB=9,ring=(y,r)=>Array.from({length:NB},(_,i)=>{const a=i/NB*TAU;return[Math.cos(a)*r,y,Math.sin(a)*r];});
  const r1=ring(.62,.7),r2=ring(.14,1),r3=ring(0,.85);
  for(let i=0;i<NB;i++){const j=(i+1)%NB;g.t(apex,r1[i],r1[j],T(1));quad(g,r1[i],r1[j],r2[j],r2[i],T(.9));quad(g,r2[i],r2[j],r3[j],r3[i],T(1.15));}
  for(let i=0;i<NB;i+=1){const a=i/NB*TAU,c=Math.cos(a),s=Math.sin(a);
    g.t([c*.6-.025,0,s*.6],[c*.6+.025,0,s*.6],[c*.5,-1.5-(i%3)*.35,s*.5],T(.8));}
  g.t([-.14,0,0],[.14,0,0],[0,-1.0,.06],T(1.1));g.t([0,0,-.14],[0,0,.14],[.06,-1.0,0],T(1.1));
  FM.jelly=instMesh(g.a);

  // bats reuse the bird body with their own instance buffer
  FM.bat=instMesh(MDATA.bird);

  for(const k in FM){FAB[k]={buf:new Float32Array(FA_CAP[k]*12),n:0};
    gl.bindBuffer(gl.ARRAY_BUFFER,FM[k].ib);gl.bufferData(gl.ARRAY_BUFFER,FA_CAP[k]*48,gl.DYNAMIC_DRAW);}
}
function faPut(k,x,y,z,s,yaw,a,b,ph,r,g,bl,e){const F=FAB[k];if(F.n>=FA_CAP[k])return;
  F.buf.set([x,y,z,s,yaw,a,b,ph,r,g,bl,e],F.n*12);F.n++;}
const faSeen=(key,text)=>{if(SAVE.sp[key])return;SAVE.sp[key]=1;save();msg(text,4.5);};

/* ---------- species ---------- */
const SPECIES={
  deer:{H:.95,walk:1.7,run:9,fear:32,size:[.95,1.2],hop:0},
  fox:{H:.32,walk:2,run:10.5,fear:24,size:[.9,1.1],hop:0},
  hare:{H:.26,walk:1.4,run:11,fear:26,size:[.9,1.15],hop:.5}};
const FA_BIOME={'Meadow':{deer:3,hare:3,fox:1},'Ember Wood':{fox:3,deer:2,hare:1},'Blossom Isle':{deer:3,hare:3},
  'Frostcap':{hare:3,fox:2,deer:1},'Gloamshroom':{deer:3,hare:1},'Ochre Mesa':{fox:3,hare:2}};
function faLook(sp,biome,r){
  const pick=a=>a[Math.floor(r()*a.length)];let c,e=0,label=sp;
  if(sp==='deer'){
    if(biome==='Gloamshroom'){c=pick([[.25,.55,1],[.62,.34,1],[.2,.9,.8]]);e=.7;label='stag';}
    else if(biome==='Frostcap')c=[.84,.88,.94];
    else c=pick([[.62,.42,.25],[.55,.36,.2],[.72,.52,.33]]);}
  else if(sp==='fox'){c=biome==='Frostcap'?[.95,.97,1]:biome==='Ochre Mesa'?[.8,.6,.32]:pick([[.86,.4,.1],[.72,.3,.08]]);}
  else{
    if(biome==='Gloamshroom'){c=[.3,.9,.8];e=.8;label='glowhare';}
    else if(biome==='Frostcap')c=[.95,.97,1];
    else if(biome==='Blossom Isle')c=pick([[.92,.8,.78],[.85,.7,.72]]);
    else if(biome==='Ochre Mesa')c=[.78,.62,.42];
    else c=pick([[.6,.5,.4],[.5,.42,.34],[.7,.6,.48]]);}
  return{c,e,label};}
const FA_TEXT={deer:'A deer lifts its head and watches you.',stag:'A lumen stag glows between the glowcaps.',fox:'A fox slips between the trees.',hare:'A hare freezes in the grass.',glowhare:'A glowhare, lit from within.'};

function faSpawn(I){
  const r=rngOf(hseed(I.seed|0,77)),tbl=Object.entries(FA_BIOME[I.bio.name]||FA_BIOME.Meadow);
  const nGround=I.islet?(I.R>22?1+Math.floor(r()*2):(r()<.4?1:0)):Math.min(16,2+Math.floor(I.R/14)+Math.floor(r()*3));
  I.fa=[];
  for(let i=0;i<nGround;i++){
    const q=rngOf(hseed(I.seed|0,100+i));q();q();                      // each animal gets its own stream
    const sp=pickW(tbl,q,e=>e[1])[0],spc=SPECIES[sp];
    const a=q()*TAU,rf=Math.sqrt(q())*.72,d=edgeR(I,a)*rf,x=I.x+Math.cos(a)*d,z=I.z+Math.sin(a)*d;
    const look=faLook(sp,I.bio.name,q);
    I.fa.push({sp,x,z,y:topH(I,x,z,rf),yaw:q()*TAU,tx:x,tz:z,mode:0,wait:q()*6,gait:q()*6.28,str:0,sz:lerp(spc.size[0],spc.size[1],q()),c:look.c,e:look.e,label:look.label,spd:0});}
  // butterflies by day; moths after dark in Gloamshroom
  const bn=I.bio.name,glow=bn==='Gloamshroom';
  const cols=glow?[[.3,.8,1],[.8,.4,1],[.3,1,.7]]:bn==='Blossom Isle'?[[1,.6,.8],[1,.85,.9],[.9,.7,1]]:bn==='Ember Wood'?[[1,.45,.1],[1,.7,.2]]:
    bn==='Ochre Mesa'?[[.95,.8,.3],[.9,.55,.25]]:bn==='Frostcap'?null:[[1,.82,.25],[.95,.95,1],[1,.5,.2],[.5,.7,1]];
  I.bf=[];I.moth=glow;
  if(cols){const nb=I.islet?(I.R>20?3:0):Math.min(26,4+Math.floor(I.R/9));
    for(let i=0;i<nb;i++){const a=r()*TAU,rf=Math.sqrt(r())*.8,d=edgeR(I,a)*rf;
      I.bf.push({cx:I.x+Math.cos(a)*d,cz:I.z+Math.sin(a)*d,ph:r()*TAU,w:.5+r()*.5,rad:3+r()*8,hg:.9+r()*2.4,c:cols[Math.floor(r()*cols.length)],s:.28+r()*.16});}}
}

function faStep(a,I,dt,cam,spc){
  const dx=a.x-cam[0],dz=a.z-cam[2],d3=Math.hypot(dx,a.y+1-cam[1],dz);
  if(d3<spc.fear){const dh=Math.hypot(dx,dz)||1;a.tx=a.x+dx/dh*40;a.tz=a.z+dz/dh*40;a.mode=2;a.wait=1.5;}
  else if(a.mode===2&&a.wait>0)a.wait-=dt;else if(a.mode===2){a.mode=0;a.wait=2+Math.random()*4;}
  if(a.mode===0){a.wait-=dt;if(a.wait<=0){const an=Math.random()*TAU,rr=6+Math.random()*26;a.tx=a.x+Math.cos(an)*rr;a.tz=a.z+Math.sin(an)*rr;a.mode=1;}}
  let spd=0;
  if(a.mode>0){
    const ex=a.tx-a.x,ez=a.tz-a.z,el=Math.hypot(ex,ez);
    if(el<1.3){if(a.mode===1){a.mode=0;a.wait=2+Math.random()*8;}}
    else{
      let da=Math.atan2(-ex,-ez)-a.yaw;da=Math.atan2(Math.sin(da),Math.cos(da));
      a.yaw+=da*Math.min(1,dt*(a.mode===2?9:3.2));
      spd=(a.mode===2?spc.run:spc.walk)*clamp(1.5-Math.abs(da)*.9,.1,1);
      const nx=a.x-Math.sin(a.yaw)*spd*dt,nz=a.z-Math.cos(a.yaw)*spd*dt;
      if(rfOf(I,nx,nz)<.88){a.x=nx;a.z=nz;}
      else{spd=0;a.mode=1;a.tx=a.x+(I.x-a.x)*.3;a.tz=a.z+(I.z-a.z)*.3;}}}
  a.y=topH(I,a.x,a.z,Math.min(rfOf(I,a.x,a.z),.99));
  a.gait+=dt*(spd>.05?Math.min(18,2+spd*2.2):0);
  a.str=lerp(a.str,spd>.05?clamp(spd/spc.walk,.5,1.6):0,1-Math.exp(-dt*8));
  a.spd=spd;return d3;
}

/* ---------- things in the sky ---------- */
const RGRP=[{a:[0,0,0],r:520,sp:.02,ph:0,dy:0},{a:[0,0,0],r:840,sp:-.014,ph:2.1,dy:60},{a:[0,0,0],r:380,sp:.026,ph:4,dy:-30}];
const RAYS=[];for(let g=0;g<3;g++)for(let k=0;k<3;k++)RAYS.push({g,k,ph:Math.random(),s:6.5+Math.random()*3,c:[[.25,.35,.55],[.34,.3,.5],[.2,.4,.45]][g]});
const JELLY=[];for(let i=0;i<20;i++)JELLY.push({x:0,y:0,z:0,ph:Math.random()*TAU,s:2+Math.random()*3.2,vy:.5+Math.random()*.8,age:0,init:false,c:[[1,.6,.85],[.4,.9,1],[.72,.5,1]][i%3]});
const BATS=[];for(let i=0;i<16;i++)BATS.push({k:i,ph:Math.random()*TAU});
let faInit=false;

function updateFauna(dt,night,day){
  const t=time,cam=P.pos;for(const k in FAB)FAB[k].n=0;
  const dayVis=clamp(day*1.4,0,1),nightVis=clamp(night*1.5,0,1);
  for(const I of activeIsl){
    const hd=Math.hypot(I.x-cam[0],I.z-cam[2])-I.maxR;if(hd>FA_SPAWN)continue;
    if(!I.fa)faSpawn(I);
    if(hd>FA_RANGE+40)continue;
    // ground animals
    for(const a of I.fa){const spc=SPECIES[a.sp],d3=faStep(a,I,dt,cam,spc);
      if(d3>=FA_RANGE)continue;
      const f=sstep(FA_RANGE,FA_RANGE*.78,d3);if(f<.02)continue;
      const hop=spc.hop&&a.spd>.05?Math.abs(Math.sin(a.gait*.5))*spc.hop*(a.spd>spc.walk*1.5?1.8:1):0;
      faPut(a.sp,a.x,a.y+hop*a.sz,a.z,a.sz*f,a.yaw,a.str,spc.H,a.gait,a.c[0],a.c[1],a.c[2],a.e);
      if(a.e>0&&night>.05)gp(a.x,a.y+spc.H*a.sz*.8,a.z,2.4*a.sz,a.c[0]*.25*night,a.c[1]*.25*night,a.c[2]*.25*night,0);
      if(d3<28){const key=a.label;if(!SAVE.sp[key])faSeen(key,FA_TEXT[key]);}}
    // butterflies / moths
    const vis=I.moth?nightVis:dayVis;
    if(vis>.04)for(const b of I.bf){
      const w=b.w,tt=t*w+b.ph;
      const x=b.cx+Math.cos(tt)*b.rad+Math.sin(tt*2.3+b.ph*3)*b.rad*.35,z=b.cz+Math.sin(tt*.83+b.ph*1.3)*b.rad+Math.cos(tt*1.9+b.ph*2)*b.rad*.3;
      const dx=x-cam[0],dz=z-cam[2];if(dx*dx+dz*dz>28900)continue;
      const dxd=-Math.sin(tt)*b.rad*w+Math.cos(tt*2.3+b.ph*3)*b.rad*.35*w*2.3,dzd=Math.cos(tt*.83+b.ph*1.3)*b.rad*w*.83-Math.sin(tt*1.9+b.ph*2)*b.rad*.3*w*1.9;
      const y=topH(I,x,z,Math.min(rfOf(I,x,z),.99))+b.hg+Math.sin(t*1.7*w+b.ph*5)*.5;
      const dd=Math.hypot(dx,y-cam[1],dz),f=sstep(170,120,dd)*vis;if(f<.03)continue;
      faPut('butterfly',x,y,z,b.s*f,Math.atan2(-dxd,-dzd),1,1,b.ph,b.c[0],b.c[1],b.c[2],I.moth?.9:0);
      if(I.moth)gp(x,y,z,.9,b.c[0]*.2*f,b.c[1]*.2*f,b.c[2]*.2*f,0);
      if(dd<14)faSeen(I.moth?'moth':'butterfly',I.moth?'Moths glow softly between the mushrooms.':'Butterflies drift past, unhurried.');}
  }
  // sky rays: three small groups glide in wide circles around you
  const kf=1-Math.exp(-dt*.06);
  for(const G of RGRP){if(!faInit){G.a[0]=cam[0];G.a[2]=cam[2];}
    G.a[0]=lerp(G.a[0],cam[0],kf);G.a[2]=lerp(G.a[2],cam[2],kf);G.a[1]=lerp(G.a[1],clamp(cam[1]*.6+60,30,260),kf*2);}
  faInit=true;
  for(const R of RAYS){const G=RGRP[R.g],ang=G.ph+t*G.sp,sg=Math.sign(G.sp);
    const tx=-Math.sin(ang)*sg,tz=Math.cos(ang)*sg;                       // heading
    const lat=R.k===0?0:R.k===1?-16:16,back=R.k===0?0:22;                  // V formation
    const px=G.a[0]+Math.cos(ang)*G.r-tx*back+tz*lat*-1,pz=G.a[2]+Math.sin(ang)*G.r-tz*back+tx*lat;
    const py=G.a[1]+G.dy+Math.sin(t*.05+G.ph)*25+Math.sin(t*.4+R.ph*6)*1.4;
    const dxc=px-cam[0],dyc=py-cam[1],dzc=pz-cam[2],dc=Math.hypot(dxc,dyc,dzc);
    faPut('ray',px,py,pz,R.s,Math.atan2(-tx,-tz),1,Math.cos(t*.05+G.ph)*.04,R.ph+R.k*.12,R.c[0],R.c[1],R.c[2],night>.1?.12:0);
    if(night>.05&&dc<900)gp(px,py-.4*R.s,pz,R.s*.5,.05*night,.2*night,.3*night,0);
    if(dc<160)faSeen('ray','Sky rays glide overhead, wings rolling like water.');}
  // luminous jellies drifting upward through the sky around you
  for(const j of JELLY){
    const dx=j.x-cam[0],dz=j.z-cam[2],dy=j.y-cam[1];
    if(!j.init||dx*dx+dz*dz>360000||dy>200||dy<-150){const an=Math.random()*TAU,rr=50+Math.random()*270;
      j.x=cam[0]+Math.cos(an)*rr;j.z=cam[2]+Math.sin(an)*rr;j.y=Math.max(SEA+30,cam[1]-90+Math.random()*150);j.age=j.init?0:5;j.init=true;}
    j.age+=dt;const pul=Math.sin(t*1.6+j.ph);
    j.x+=Math.sin(t*.15+j.ph)*.9*dt;j.z+=Math.cos(t*.13+j.ph)*.9*dt;j.y+=j.vy*dt*(.55+.45*pul);
    const d=Math.hypot(dx,dy,dz),f=Math.min(1,j.age*.5)*sstep(340,260,d);if(f<.02)continue;
    faPut('jelly',j.x,j.y,j.z,j.s*(1+.07*pul)*f,j.ph,1-.16*pul,1+.1*pul,6,j.c[0],j.c[1],j.c[2],.3);
    const k=(.05+night*.2)*f;gp(j.x,j.y+.35*j.s,j.z,j.s*2.8,j.c[0]*k,j.c[1]*k,j.c[2]*k,0);
    if(d<60)faSeen('jelly','Little lights drift upward, lit from within.');}
  // bats: after dark they wheel around the nearest island's treetops
  if(nightVis>.05){
    let A=null,best=1e18;for(const I of activeIsl){if(I.islet)continue;const d=Math.hypot(I.x-cam[0],I.z-cam[2])-I.R;if(d<best){best=d;A=I;}}
    if(A&&best<900){
      let ax=cam[0],az=cam[2];const dd=Math.hypot(cam[0]-A.x,cam[2]-A.z);if(dd>A.R*.7){ax=A.x+(cam[0]-A.x)/dd*A.R*.7;az=A.z+(cam[2]-A.z)/dd*A.R*.7;}
      const ay=topH(A,ax,az,Math.min(rfOf(A,ax,az),.99))+16;
      const nb=Math.floor(BATS.length*nightVis);
      for(let i=0;i<nb;i++){const b=BATS[i],s1=.5+(b.k%5)*.09,rad=16+(b.k%5)*7,tt=t*s1+b.ph;
        const x=ax+Math.cos(tt)*rad+Math.sin(t*3.1+b.ph*2)*3,z=az+Math.sin(tt*.9)*rad+Math.cos(t*2.7+b.ph)*3,y=ay+Math.sin(t*1.3+b.ph)*6+(b.k%3)*3;
        const dx=-Math.sin(tt)*rad*s1,dz=Math.cos(tt*.9)*rad*s1*.9;
        faPut('bat',x,y,z,.6,Math.atan2(-dx,-dz),1,1,b.ph,.14,.1,.18,0);}}}
}

/* draws every fauna instance buffer; called from render() while the instance program is bound */
function drawFauna(N){
  for(const k in FAB){const F=FAB[k];if(!F.n)continue;const M=FM[k];
    gl.uniform1f(N.u.uFlap,FA_MODE[k]);
    gl.bindBuffer(gl.ARRAY_BUFFER,M.ib);gl.bufferSubData(gl.ARRAY_BUFFER,0,F.buf,0,F.n*12);
    gl.bindVertexArray(M.vao);gl.drawArraysInstanced(gl.TRIANGLES,0,M.count,F.n);}
}
