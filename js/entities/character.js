'use strict';
/* =====================================================================
   7b. THE WANDERER — a posed, animated body held aloft by six orbs
   ===================================================================== */
// 3x3 rotations (row-major). Body space: +x right, +y up, +z back (face looks down -z).
const cross3=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const RX=a=>{const c=Math.cos(a),s=Math.sin(a);return[1,0,0,0,c,-s,0,s,c];};
const RY=a=>{const c=Math.cos(a),s=Math.sin(a);return[c,0,s,0,1,0,-s,0,c];};
const RZ=a=>{const c=Math.cos(a),s=Math.sin(a);return[c,-s,0,s,c,0,0,0,1];};
function m3(a,b){const o=[0,0,0,0,0,0,0,0,0];for(let r=0;r<3;r++)for(let c=0;c<3;c++)o[r*3+c]=a[r*3]*b[c]+a[r*3+1]*b[3+c]+a[r*3+2]*b[6+c];return o;}
function m3v(m,v){return[m[0]*v[0]+m[1]*v[1]+m[2]*v[2],m[3]*v[0]+m[4]*v[1]+m[5]*v[2],m[6]*v[0]+m[7]*v[1]+m[8]*v[2]];}
// child joint: offset in the parent's frame, then twist(y) · side(z) · swing(x)
function joint(par,off,x,y,z){const t=m3v(par.R,off);return{R:m3(par.R,m3(RY(y),m3(RZ(z),RX(x)))),T:[par.T[0]+t[0],par.T[1]+t[1],par.T[2]+t[2]]};}
function wpt(J,p){const v=m3v(J.R,p);return[J.T[0]+v[0],J.T[1]+v[1],J.T[2]+v[2]];}

// Pose channels. Limbs: S* shoulder (x + = swing forward, z + = raise out to the side), El elbow bend,
// H* hip (x + = leg forward), Kn knee (− = bend), An ankle (− = point toes). sp/sy/sz spine lean/twist/side, nk/ny head nod/turn, dy pelvis drop.
const PK=['sp','sy','sz','nk','ny','rSx','rSz','rEl','lSx','lSz','lEl','rHx','rHz','rKn','rAn','lHx','lHz','lKn','lAn','dy'];
const sym=(o,x)=>{const p={};for(const k in o){if(k[0]>='A'&&k[0]<='Z'){p['r'+k]=o[k];p['l'+k]=o[k];}else p[k]=o[k];}return Object.assign(p,x||{});};
const PO={
  stand: sym({Sx:.05,Sz:.12,El:.18,Hz:.04,Kn:-.04,An:.04}),
  // hovering: palms and soles rest on orbs, legs dangle
  hover: sym({sp:.06,nk:.05,Sx:.32,Sz:.62,El:.4,Hz:.1,An:-.45},{rHx:.12,rKn:-.3,lHx:-.06,lKn:-.48}),
  // flying: arms swept back along the body, legs trailing, toes pointed
  fly:   sym({Sx:-.42,Sz:.22,El:.12,Hz:.03,An:-1.05},{rHx:-.08,rKn:-.32,lHx:-.16,lKn:-.12}),
  // boosting: one fist forward into the wind
  boost: sym({Sx:-.3,Sz:.12,El:.05,Hx:-.05,Kn:-.06,An:-1.15},{rSx:2.95,rSz:.12,rEl:.08}),
  // rising: arms up and out, legs together, orbs thrusting below
  rise:  sym({sp:-.08,nk:-.3,Sx:.35,Sz:2.45,El:.25,Hx:-.04,Kn:-.12,An:-.95}),
  // sinking: arms raised holding orbs overhead like balloons, knees drawn up
  sink:  sym({sp:.12,nk:.3,Sx:.25,Sz:2.4,El:.45,An:.15},{rHx:.5,rKn:-.85,lHx:.28,lKn:-.55}),
  // braking: flare back, arms and legs thrown forward
  brake: sym({sp:-.1,nk:.15,Sx:1.15,Sz:.6,El:.35,Hx:.75,Hz:.08,Kn:-.75,An:.25}),
  jump:  sym({Sz:.55,El:.6},{rSx:.9,lSx:-.5,rHx:.95,rKn:-1.35,rAn:-.3,lHx:-.25,lKn:-.45,lAn:-.5}),
  fall:  sym({nk:.2,Sx:.4,Sz:1.55,El:.35,Hx:.25,Hz:.12,Kn:-.5,An:.1},{rHx:.45,rKn:-.75}),
  glide: sym({nk:-.6,Sx:.08,Sz:1.42,El:.08,Hx:-.1,Kn:-.2,An:-.9}),
  // powering up: fists clenched low at the sides, legs braced apart, chin down
  power: sym({sp:.16,nk:.18,Sx:-.22,Sz:.42,El:1.35,Hz:.2,Kn:-.32,An:-.25},{rHx:.08,lHx:-.04}),
  crouch:sym({sp:.45,nk:-.25,Sx:-.75,Sz:.25,El:.4,Hx:1.05,Hz:.06,Kn:-1.75,An:.7,dy:-.33}),
};
function addP(o,p,w){if(w<1e-4)return;for(const k of PK){const v=p[k];if(v)o[k]+=v*w;}}
// a walk that becomes a run: ph = stride phase, a = amplitude, run = 0..1
function walkPose(ph,a,run){const s=Math.sin(ph),c=Math.cos(ph),kb=.06+run*.25*a;
  return{rHx:s*.62*a,lHx:-s*.62*a,rKn:-(kb+Math.max(0,c)*1.15*a),lKn:-(kb+Math.max(0,-c)*1.15*a),
    rAn:(.25*Math.max(0,c)-.45*Math.max(0,-s))*a,lAn:(.25*Math.max(0,-c)-.45*Math.max(0,s))*a,
    rSx:-s*.55*a,lSx:s*.55*a,rSz:.1+run*.1,lSz:.1+run*.1,rEl:.25+a*(.25+run*.95),lEl:.25+a*(.25+run*.95),
    rHz:.04,lHz:.04,sp:.04+run*.16,sy:s*.13*a,nk:-.04-run*.1,dy:-.07*a*s*s-.02*a-run*.05};}

const AN={init:false,yaw:0,lean:0,leanV:0,roll:0,rollV:0,turn:0,travel:0,pv:[0,0,0],acc:[0,0,0],G:0,WA:0,FA:1,gl:0,ph:0,landT:9,landK:0,
  aura:0,auraOn:false,boomCd:0,wave:null,trail:[]};
const AURAN=170,AURAH=[];for(let i=0;i<AURAN;i++)AURAH.push([Math.random(),Math.random(),Math.random()]);
let SPDFX=0;
const PQ={};
const ORBS=[];for(let i=0;i<ORBN;i++)ORBS.push({o:[0,-.6,0],v:[0,0,0],p:[0,0,0]});
const ORBU=new Float32Array(ORBN*3),ORBC=new Float32Array(3);

function launchFx(){AU.puff();const x=P.pos[0],y=P.pos[1]-EYE+.08,z=P.pos[2];
  for(let i=0;i<34;i++){const a=Math.random()*TAU,s=2.5+Math.random()*4.5;BURST.push({p:[x,y,z],v:[Math.cos(a)*s,.3+Math.random()*1.6,Math.sin(a)*s],t:0,m:.45+Math.random()*.5});}}

function pushV(p,c){const o=CHN*7;CB[o]=p[0];CB[o+1]=p[1];CB[o+2]=p[2];CB[o+3]=c[0];CB[o+4]=c[1];CB[o+5]=c[2];CB[o+6]=c[3];CHN++;}
function emitPart(src,J){const R=J.R,T=J.T;let o=CHN*7;
  for(let i=0;i<src.length;i+=7){const x=src[i],y=src[i+1],z=src[i+2];
    CB[o]=T[0]+R[0]*x+R[1]*y+R[2]*z;CB[o+1]=T[1]+R[3]*x+R[4]*y+R[5]*z;CB[o+2]=T[2]+R[6]*x+R[7]*y+R[8]*z;
    CB[o+3]=src[i+3];CB[o+4]=src[i+4];CB[o+5]=src[i+5];CB[o+6]=src[i+6];o+=7;}
  CHN=o/7;}
function emitOrb(p,r,c){for(let i=0;i<ORBMESH.length;i+=3)pushV([p[0]+ORBMESH[i]*r,p[1]+ORBMESH[i+1]*r,p[2]+ORBMESH[i+2]*r],c);}

// scarf tails: verlet chains hanging from the back of the neck; they trail in the wind of your own speed
function simScarf(sc,a,dt,cols){
  const p=sc.p,q=sc.q,n=sc.n;
  if(!p.length||Math.hypot(a[0]-p[0][0],a[1]-p[0][1],a[2]-p[0][2])>4){sc.p=[];sc.q=[];
    for(let k=0;k<n;k++){const v=[a[0],a[1]-k*sc.len,a[2]+k*.02];sc.p.push(v);sc.q.push(v.slice());}return;}
  p[0]=a.slice();q[0]=a.slice();
  const damp=Math.pow(.12,dt),gy=-6*dt*dt;
  for(let k=1;k<n;k++){const P2=p[k],Q2=q[k];for(let j=0;j<3;j++){const vv=(P2[j]-Q2[j])*damp;Q2[j]=P2[j];P2[j]+=vv;}P2[1]+=gy;}
  for(let it=0;it<3;it++)for(let k=1;k<n;k++){const P2=p[k],B=p[k-1];
    let dx=P2[0]-B[0],dy=P2[1]-B[1],dz=P2[2]-B[2];const l=Math.hypot(dx,dy,dz)||1e-4,f=sc.len/l;
    P2[0]=B[0]+dx*f;P2[1]=B[1]+dy*f;P2[2]=B[2]+dz*f;
    for(const [c,r] of cols){dx=P2[0]-c[0];dy=P2[1]-c[1];dz=P2[2]-c[2];const d=Math.hypot(dx,dy,dz);if(d<r&&d>1e-4){const g=r/d;P2[0]=c[0]+dx*g;P2[1]=c[1]+dy*g;P2[2]=c[2]+dz*g;}}}}
function emitScarf(sc,e1,s,t){
  const n=sc.n,p=sc.p,pts=[];if(!p.length)return;
  for(let k=0;k<n;k++){const a=p[Math.max(0,k-1)],b=p[Math.min(n-1,k+1)];const d=norm([b[0]-a[0],b[1]-a[1],b[2]-a[2]]);
    const de=dot(e1,d);let sv=[e1[0]-d[0]*de,e1[1]-d[1]*de,e1[2]-d[2]*de];const sl=Math.hypot(sv[0],sv[1],sv[2]);
    sv=sl>.05?mul3(sv,1/sl):norm(cross3(d,[0,1,0]));
    const nv=cross3(d,sv),tw=Math.sin(t*6-k*.9)*.45*Math.min(1,s/15),ct=Math.cos(tw),st=Math.sin(tw);
    const w=.085*(1-k/n*.35),fl=Math.sin(t*15-k*1.3)*Math.min(s/28,1.6)*.035*k/n;
    const side=[(sv[0]*ct+nv[0]*st)*w,(sv[1]*ct+nv[1]*st)*w,(sv[2]*ct+nv[2]*st)*w];
    pts.push([p[k][0]+nv[0]*fl,p[k][1]+nv[1]*fl,p[k][2]+nv[2]*fl,side]);}
  for(let k=0;k<n-1;k++){const A=pts[k],B=pts[k+1],sa=A[3],sb=B[3];
    const a0=[A[0]-sa[0],A[1]-sa[1],A[2]-sa[2]],a1=[A[0]+sa[0],A[1]+sa[1],A[2]+sa[2]],b0=[B[0]-sb[0],B[1]-sb[1],B[2]-sb[2]],b1=[B[0]+sb[0],B[1]+sb[1],B[2]+sb[2]];
    const col=shade(CHC.scarf,(k%2?.9:1.04)*(1-k/n*.18));pushV(a0,col);pushV(a1,col);pushV(b1,col);pushV(a0,col);pushV(b1,col);pushV(b0,col);}}

function updateChar(dt,eye){
  const t=time,v=P.vel;dt=Math.max(dt,1e-4);
  if(!AN.init){AN.init=true;AN.yaw=P.yaw;AN.pv=v.slice();AN.acc=[0,0,0];for(const sc of SCARF)sc.p=[];}
  // smoothed acceleration drives leaning in, flaring out and the orbs' swing
  const ka=1-Math.exp(-dt*9);
  for(let i=0;i<3;i++){AN.acc[i]=lerp(AN.acc[i],(v[i]-AN.pv[i])/dt,ka);AN.pv[i]=v[i];}
  const hs=Math.hypot(v[0],v[2]),s=Math.hypot(hs,v[1]);
  // face where you are going
  if(hs>1.2){let d=Math.atan2(v[0],-v[2])-AN.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));
    const dy=d*(1-Math.exp(-dt*(P.ground?11:5.5)*clamp((hs-1.2)/3,0,1)));AN.yaw+=dy;AN.turn=lerp(AN.turn,dy/dt,1-Math.exp(-dt*6));}
  else AN.turn=lerp(AN.turn,0,1-Math.exp(-dt*6));
  const fwd=[Math.sin(AN.yaw),0,-Math.cos(AN.yaw)],vd=s>1?[v[0]/s,v[1]/s,v[2]/s]:fwd;
  const aT=dot(AN.acc,vd),aF=dot(AN.acc,fwd);
  // which family of motion: on the ground / walk-mode airborne / flying
  const kg=1-Math.exp(-dt*9);
  AN.G=lerp(AN.G,P.ground?1:0,kg);AN.WA=lerp(AN.WA,!P.ground&&P.walk?1:0,kg);AN.FA=lerp(AN.FA,!P.ground&&!P.walk?1:0,kg);
  const gs=AN.G+AN.WA+AN.FA||1,G=AN.G/gs,WA=AN.WA/gs,FA=AN.FA/gs;
  if(P.inPlanar)AN.travel=lerp(AN.travel,1,1-Math.exp(-dt*4));else if(P.inVert)AN.travel=lerp(AN.travel,0,1-Math.exp(-dt*3));
  AN.gl=lerp(AN.gl,P.walk&&P.gliding?1:0,1-Math.exp(-dt*6));
  if(P.landV<-5){AN.landT=0;AN.landK=clamp(-P.landV/22,.3,.85);}P.landV=0;AN.landT+=dt;

  for(const k of PK)PQ[k]=0;
  // ground: stand ↔ walk ↔ run
  const mv=clamp(hs/1.6,0,1),run=clamp((hs-8)/7,0,1);
  AN.ph+=dt*TAU*hs/(1.7+hs*.12);
  if(G>1e-3){addP(PQ,PO.stand,G*(1-mv));if(mv>0)addP(PQ,walkPose(AN.ph,Math.min(hs/7.5,1.3),run),G*mv);PQ.sp+=G*(1-mv)*Math.sin(t*1.5)*.015;}
  // walk mode in the air: jump, fall, glide
  if(WA>1e-3){const up=clamp(v[1]/7+.5,0,1);addP(PQ,PO.glide,WA*AN.gl);addP(PQ,PO.jump,WA*(1-AN.gl)*up);addP(PQ,PO.fall,WA*(1-AN.gl)*(1-up));}
  // flight: hover, travel (fly / boost), brake, rise, sink
  const sN=clamp(s/28,0,1);let wT=0,wB=0,wU=0,wD=0,wH=0,fLean=0;
  // energy aura: flying fast, or holding boost while still to power up
  const auraT=P.walk?0:Math.max(clamp((s-34)/30,0,1),P.boostHeld&&!paused?1:0);
  AN.aura=lerp(AN.aura,auraT,1-Math.exp(-dt*(auraT>AN.aura?5:2)));
  const pw=AN.aura*(1-sN);      // powering up in place
  if(FA>1e-3){
    wB=clamp(-aT/22,0,1)*clamp(s/5,0,1)*AN.travel;
    wT=AN.travel*sN*(1-wB);
    const rem=Math.max(0,1-wT-wB);
    wU=rem*clamp(v[1]/14,0,1);wD=rem*clamp(-v[1]/14,0,1);wH=Math.max(0,rem-wU-wD);
    const bo=clamp((s-32)/40,0,1);
    addP(PQ,PO.hover,FA*wH*(1-pw));addP(PQ,PO.power,FA*wH*pw);addP(PQ,PO.rise,FA*wU);addP(PQ,PO.sink,FA*wD);addP(PQ,PO.brake,FA*wB);
    addP(PQ,PO.fly,FA*wT*(1-bo));addP(PQ,PO.boost,FA*wT*bo);
    const ang=Math.atan2(hs,v[1]);          // 0 straight up · π/2 level · π straight down: the body lines up with its path
    fLean=wT*ang*.9+wB*(ang*.25-.32)+wH*.04+wD*.1-wU*.03+clamp(aT/50,-.3,.45)*.55*AN.travel;
  }
  // breathing, the hover's gentle bob (arms press down on the orbs), leg flutter
  const br=Math.sin(t*1.9),hb=FA*wH*(1-pw);
  PQ.dy+=hb*br*.07+FA*wH*pw*.12;PQ.sp+=FA*wH*pw*Math.sin(t*43)*.012;PQ.rSx+=FA*wH*pw*Math.sin(t*37)*.03;PQ.lSx+=FA*wH*pw*Math.sin(t*41)*.03;PQ.rSz+=hb*Math.sin(t*1.9+.7)*.05;PQ.lSz+=hb*Math.sin(t*1.9+.7)*.05;
  const flt=Math.sin(t*7)*.07*FA*wT;PQ.rHx+=flt;PQ.lHx-=flt;
  // crouch overlay: winding up a take-off, or soaking up a landing
  let cw=0;if(P.launch>0)cw=sstep(0,.09,P.launch)*(1-sstep(.2,.34,P.launch));
  if(AN.landT<.4)cw=Math.max(cw,(AN.landT<.06?AN.landT/.06:1-(AN.landT-.06)/.34)*AN.landK);
  if(cw>0)for(const k of PK)PQ[k]=lerp(PQ[k],PO.crouch[k]||0,cw);
  // whole-body lean and bank, on springs so they overshoot a touch
  const leanT=G*(.03+clamp(hs/15,0,1)*.15+clamp(aF/30,-.3,.3)*.5)+WA*(AN.gl*.95+.03)+FA*fLean;
  AN.leanV+=((leanT*(1-cw)-AN.lean)*55-AN.leanV*11)*dt;AN.lean+=AN.leanV*dt;
  const rollT=-clamp(AN.turn*.3,-.8,.8)*(FA*sN+WA*AN.gl+G*.12*clamp(hs/7,0,1));
  AN.rollV+=((rollT-AN.roll)*40-AN.rollV*10)*dt;AN.roll+=AN.rollV*dt;
  // head: tip back to see ahead when flying flat; glance where the camera looks
  PQ.nk-=FA*(1-AN.gl)*(AN.lean>0?AN.lean*.62:AN.lean*.3);
  let dl=P.yaw-AN.yaw;dl=Math.atan2(Math.sin(dl),Math.cos(dl));
  const lk=(1-sstep(1.6,2.4,Math.abs(dl)))*(1-clamp(AN.lean,0,1));
  PQ.ny-=clamp(dl,-1,1)*.6*lk;PQ.nk-=P.pitch*.35*lk;PQ.nk=Math.max(PQ.nk,-1.1);

  // ---- forward kinematics ----
  const rootP=[P.pos[0],P.pos[1]-EYE+1.01+PQ.dy,P.pos[2]];
  const Rr=m3(RY(-AN.yaw),m3(RZ(AN.roll),RX(-AN.lean)));
  const root={R:Rr,T:rootP};
  const chest=joint(root,[0,.06,0],-PQ.sp,PQ.sy,PQ.sz),head=joint(chest,[0,.47,0],-PQ.nk,PQ.ny,0);
  const J={};
  for(const sd of [1,-1]){const c=sd>0?'r':'l';
    const sh=joint(chest,[.215*sd,.4,0],PQ[c+'Sx'],0,PQ[c+'Sz']*sd),el=joint(sh,[0,-.28,0],PQ[c+'El'],0,0);
    const hp=joint(root,[.09*sd,-.08,0],PQ[c+'Hx'],0,PQ[c+'Hz']*sd),kn=joint(hp,[0,-.43,0],PQ[c+'Kn'],0,0),an=joint(kn,[0,-.42,0],PQ[c+'An'],0,0);
    J[c]={sh,el,hp,kn,an};}
  const e1=[Rr[0],Rr[3],Rr[6]],ax=[Rr[1],Rr[4],Rr[7]],e2=[Rr[2],Rr[5],Rr[8]];
  const hR=wpt(J.r.el,[0,-.27,0]),hL=wpt(J.l.el,[0,-.27,0]),fR=wpt(J.r.an,[0,-.05,-.05]),fL=wpt(J.l.an,[0,-.05,-.05]);
  const fm=[(fR[0]+fL[0])/2,(fR[1]+fL[1])/2,(fR[2]+fL[2])/2],hd=wpt(head,[0,.3,0]);

  // ---- scarf ----
  const cols=[[wpt(chest,[0,.2,0]),.25],[rootP,.24],[wpt(head,[0,.16,0]),.17]];
  for(const sc of SCARF)simScarf(sc,wpt(chest,sc.off),dt,cols);

  // ---- orbs: four. Floating, one rests at each hand and each foot; flying, they orbit you inside the aura. ----
  // Targets live in the body's own frame and are eased there, so the orbs turn and lean with you instead of lagging and wobbling.
  const limbW=FA*(wH*(1-pw)+wB+wU+wD)+WA*AN.gl,orbW=FA*(wT+wH*pw),haW=G+WA*(1-AN.gl);
  const toL=p=>{const d=[p[0]-rootP[0],p[1]-rootP[1],p[2]-rootP[2]];return[Rr[0]*d[0]+Rr[3]*d[1]+Rr[6]*d[2],Rr[1]*d[0]+Rr[4]*d[1]+Rr[7]*d[2],Rr[2]*d[0]+Rr[5]*d[1]+Rr[8]*d[2]];};
  const limbs=[[hR[0],hR[1]-.12,hR[2]],[hL[0],hL[1]-.12,hL[2]],[fR[0],fR[1]-.13,fR[2]],[fL[0],fL[1]-.13,fL[2]]].map(toL);
  const fmL=toL(fm),ospd=4+s*.05+pw*6,ke=1-Math.exp(-dt*16);
  for(let i=0;i<ORBN;i++){const ob=ORBS[i],ph=i*Math.PI/2,T=[0,0,0];
    const add=(p,w)=>{if(w>1e-4){T[0]+=p[0]*w;T[1]+=p[1]*w;T[2]+=p[2]*w;}};
    add(limbs[i],limbW);
    // orbit: four tilted rings around the body's long axis, like electrons around the chest
    if(orbW>1e-4){const a=t*ospd+ph,tl=[.5,-.5,1.05,-1.05][i],rr=.82+.08*Math.sin(t*2.3+i),cx=Math.cos(a)*rr;
      add([cx*Math.cos(tl),.42+cx*Math.sin(tl),Math.sin(a)*rr],orbW);}
    // on the ground: a lazy halo
    if(haW>1e-4){const a=t*.9+ph;add([Math.cos(a)*.8,.55+Math.sin(t*1.7+i*1.3)*.1,Math.sin(a)*.8],haW);}
    const tw=limbW+orbW+haW||1;T[0]/=tw;T[1]/=tw;T[2]/=tw;
    if(cw>0){const a=t*3+ph,c=[fmL[0]+Math.cos(a)*.3,fmL[1]-.05,fmL[2]+Math.sin(a)*.3];for(let j=0;j<3;j++)T[j]=lerp(T[j],c[j],cw);}
    for(let j=0;j<3;j++){ob.o[j]=lerp(ob.o[j],T[j],ke);if(!isFinite(ob.o[j]))ob.o[j]=T[j];}
    const w=m3v(Rr,ob.o);ob.p=[rootP[0]+w[0],rootP[1]+w[1],rootP[2]+w[2]];
    ORBU[i*3]=ob.p[0];ORBU[i*3+1]=ob.p[1];ORBU[i*3+2]=ob.p[2];
  }
  const ol=(.55+NIGHT*1.3)*(1+AN.aura*1.3);ORBC[0]=.32*ol;ORBC[1]=.62*ol;ORBC[2]=.9*ol;

  // ---- the aura ignites: shockwave ring, a thump, a camera kick ----
  AN.boomCd-=dt;
  if(auraT>.6&&!AN.auraOn&&AN.boomCd<=0&&started){AN.auraOn=true;AN.boomCd=1.5;
    AN.wave={p:rootP.slice(),d:s>8?vd.slice():[0,1,0],t:0};AU.boom();P.fov+=7;CAM.shake=.2;
    for(let i=0;i<40;i++){const a=Math.random()*TAU,b=Math.acos(Math.random()*2-1),sp=5+Math.random()*9;
      BURST.push({p:rootP.slice(),v:[Math.sin(b)*Math.cos(a)*sp,Math.cos(b)*sp,Math.sin(b)*Math.sin(a)*sp],t:0,m:.4+Math.random()*.5});}}
  if(auraT<.25)AN.auraOn=false;

  // ---- build this frame's mesh + glows ----
  CHN=0;
  const tp=CFG.view3;
  if(tp){emitPart(CHR.pelvis,root);emitPart(CHR.chest,chest);emitPart(CHR.head,head);
    for(const c of ['r','l']){const j=J[c];emitPart(CHR.uarm,j.sh);emitPart(CHR.farm,j.el);emitPart(CHR.thigh,j.hp);emitPart(CHR.shin,j.kn);emitPart(CHR.foot,j.an);}
    for(const sc of SCARF)emitScarf(sc,e1,s,t);}
  for(let i=0;i<ORBN;i++){const p=ORBS[i].p;
    if(!tp&&(p[0]-eye[0])**2+(p[1]-eye[1])**2+(p[2]-eye[2])**2<.9)continue;
    emitOrb(p,.075,CHC.orb);
    const k=(1-hb*.35*br)*(1+.3*sN)*(1+NIGHT*.6)*(1+AN.aura*.8);
    gp(p[0],p[1],p[2],.2,.95*k,1.45*k,1.9*k,0);gp(p[0],p[1],p[2],.95,.06*k,.11*k,.16*k,0);
    // lift: light drips from the orbs that hold you up
    const st=FA*(wH*(1-pw)+wU*1.4+wD*.6)+WA*AN.gl+cw*.8;
    if(st>.02)for(let j=0;j<3;j++){const f=(t*1.3+j/3+i*.29)%1,a=(1-f)*st;
      gp(p[0]+Math.sin(f*7+i)*.04,p[1]-.06-f*(.6+FA*wU*.8),p[2]+Math.cos(f*6+i)*.04,.06+.06*(1-f),.4*a,.8*a,1.1*a,0);}
    // streaks behind each orbiting orb
    const sl=orbW*Math.max(sN,pw);
    if(sl>.02){const q=ORBS[i].q||(ORBS[i].q=p.slice());for(let j=1;j<=4;j++){const f=j/5,a=sl*(1-f)*.55;
      gp(lerp(p[0],q[0],f)-vd[0]*j*.18*sN,lerp(p[1],q[1],f)-vd[1]*j*.18*sN,lerp(p[2],q[2],f)-vd[2]*j*.18*sN,.1,.35*a,.7*a,a,0);}
      ORBS[i].q=mix3(q,p,1-Math.exp(-dt*9));}
  }

  // ---- energy aura: white-hot at the body, cyan at the tips. It licks upward while powering up and streams back at speed. ----
  const au=AN.aura,day=2.6-NIGHT*1.7;   // daylight needs more punch for additive light to read
  SPDFX=au*(.45+.55*clamp(s/70,0,1));
  if(au>.01){const sF=clamp(s/30,0,1),F=norm([-vd[0]*sF,1-sF-vd[1]*sF,-vd[2]*sF]);
    for(let k=0;k<AURAN;k++){const h=AURAH[k],ph=(t*(1.5+h[0]*1.5)+h[1])%1,u=h[2],a=h[0]*TAU+h[1]*9+t*.7;
      const ca=Math.cos(a),sa=Math.sin(a),rr=.19+.14*Math.sin(u*Math.PI)+ph*.12,al=-.95+u*2,len=(.45+.9*sF+h[1]*.45)*ph;
      const ox=e1[0]*ca+e2[0]*sa,oy=e1[1]*ca+e2[1]*sa,oz=e1[2]*ca+e2[2]*sa;
      const fade=Math.pow(1-ph,1.4)*(.65+.35*Math.sin(t*23+k*1.7))*au*day,wc=1-ph;
      gp(rootP[0]+ax[0]*al+ox*rr+F[0]*len,rootP[1]+ax[1]*al+oy*rr+F[1]*len,rootP[2]+ax[2]*al+oz*rr+F[2]*len,
        (.32*(1-ph)+.08)*(.8+h[2]*.4),(.12+.45*wc)*fade,(.4+.42*wc)*fade,(1.15+.2*wc)*fade,0);}
    // the haze that wraps it all
    for(let k=0;k<5;k++){const al=-.8+k*.42,fl=au*day*(.8+.2*Math.sin(t*17+k*2));gp(rootP[0]+ax[0]*al,rootP[1]+ax[1]*al,rootP[2]+ax[2]*al,1.7,.04*fl,.13*fl,.28*fl,0);}
  }
  // light trail left in the air behind you
  if(au>.05&&s>12){AN.trail.unshift(rootP.slice());if(AN.trail.length>22)AN.trail.pop();}else if(AN.trail.length)AN.trail.pop();
  const tk=au*clamp((s-12)/30,0,1)*day;
  for(let k=1;k<AN.trail.length-1;k++){const a=AN.trail[k],b=AN.trail[k+1];
    for(let m=0;m<3;m++){const f=m/3,w=1-(k+f)/22,q=tk*w*w*.45;gp(lerp(a[0],b[0],f),lerp(a[1],b[1],f),lerp(a[2],b[2],f),.18+.45*w,.4*q,.75*q,1.1*q,0);}}
  // shockwave ring
  if(AN.wave){const wv=AN.wave;wv.t+=dt;
    if(wv.t>.8)AN.wave=null;
    else{const d=wv.d,u1=norm(cross3(d,Math.abs(d[1])>.9?[1,0,0]:[0,1,0])),u2=cross3(d,u1),x=wv.t/.8,rad=.6+15*(1-(1-x)*(1-x)),a=Math.pow(1-x,1.6)*day;
      for(let k=0;k<72;k++){const an=k/72*TAU,c=Math.cos(an)*rad,sn=Math.sin(an)*rad;
        gp(wv.p[0]+u1[0]*c+u2[0]*sn,wv.p[1]+u1[1]*c+u2[1]*sn,wv.p[2]+u1[2]*c+u2[2]*sn,.35+x*.9,.45*a,.75*a,1.05*a,0);}}}
}

// is a point inside island rock? (keeps the chase camera out of cliffs and hillsides)
function solidAt(x,y,z){
  for(const I of activeIsl){const dx=x-I.x,dz=z-I.z;if(dx*dx+dz*dz>I.maxR*I.maxR)continue;
    if(y>I.y+I.R*.6||y<I.y-I.depth-I.R*.25)continue;
    const d=Math.hypot(dx,dz),er=edgeR(I,Math.atan2(dz,dx)),rf=d/er;if(rf>=1)continue;
    const top=topH(I,x,z,rf);if(y>top+.35)continue;
    const bot=lerp(top-1.2,I.y-I.depth,Math.pow(Math.max(0,1-Math.pow(rf,1/1.25)),.8))-1.6;if(y>bot)return true;}
  return false;}
// chase camera: lags a little behind (so speeding up and slowing down read), pulls back with speed, never enters rock
const CAM={t:null,d:5,cd:5,shake:0};
function chaseCam(dt,speed){
  const tg=[P.pos[0],P.pos[1]-EYE+1.75,P.pos[2]];
  if(!CAM.t||Math.hypot(CAM.t[0]-tg[0],CAM.t[1]-tg[1],CAM.t[2]-tg[2])>40){CAM.t=tg.slice();CAM.cd=CAM.d;}
  const kf=1-Math.exp(-dt*7);for(let i=0;i<3;i++)CAM.t[i]=lerp(CAM.t[i],tg[i],kf);
  const lx=CAM.t[0]-tg[0],ly=CAM.t[1]-tg[1],lz=CAM.t[2]-tg[2],ll=Math.hypot(lx,ly,lz);
  if(ll>1.5){const f=1.5/ll;CAM.t=[tg[0]+lx*f,tg[1]+ly*f,tg[2]+lz*f];}
  // portrait phones have a narrow horizontal view: sit a bit further back
  const want=(P.walk?4.3:4.9)+clamp(speed/90,0,1)*2.4+(W<H?1.3:0);
  CAM.d=lerp(CAM.d,want,1-Math.exp(-dt*1.6));
  const ct=CAM.t;let d=CAM.d;
  for(let i=1;i<=12;i++){const q=i/12*CAM.d;if(solidAt(ct[0]-camF[0]*q,ct[1]-camF[1]*q,ct[2]-camF[2]*q)){d=Math.max(.55,q-CAM.d/12-.25);break;}}
  CAM.cd=lerp(CAM.cd,d,1-Math.exp(-dt*(d<CAM.cd?20:2.5)));
  // a faint tremor while the aura burns, a kick when it ignites
  const sh=CAM.shake+AN.aura*.018;CAM.shake*=Math.exp(-dt*5);
  const jx=(Math.sin(time*41)+Math.sin(time*67))*sh*.5,jy=(Math.sin(time*53+1)+Math.sin(time*31))*sh*.5;
  return[ct[0]-camF[0]*CAM.cd+camR[0]*jx+camU[0]*jy,ct[1]-camF[1]*CAM.cd+camR[1]*jx+camU[1]*jy,ct[2]-camF[2]*CAM.cd+camR[2]*jx+camU[2]*jy];
}
