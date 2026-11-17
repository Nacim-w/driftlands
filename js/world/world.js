'use strict';
/* =====================================================================
   4. WORLD GENERATION — biomes, islands, chunks
   ===================================================================== */
const BIO=[
 {name:'Meadow',w:3,hill:1,g1:[.07,.26,.04],g2:[.18,.38,.05],dirt:[.18,.1,.05],r1:[.15,.12,.1],r2:[.28,.22,.17],fl:[[1,.82,.25],[1,.45,.65],[.95,.95,1]],
  flora:[['round',.62,[[.05,.24,.03],[.12,.35,.04],[.09,.3,.02]],1],['pine',.2,[[.03,.15,.05],[.05,.21,.06]],1],['bush',.18,[[.08,.28,.04],[.14,.33,.05]],1]],dens:1,ruins:.3,fall:.5},
 {name:'Ember Wood',w:2,hill:1,g1:[.26,.18,.04],g2:[.4,.26,.05],dirt:[.2,.1,.04],r1:[.18,.11,.08],r2:[.33,.21,.14],fl:[[.9,.3,.05]],
  flora:[['round',.85,[[.62,.13,.02],[.85,.38,.03],[.55,.05,.02],[.9,.6,.08]],1],['bush',.15,[[.5,.18,.03]],1]],dens:.9,ruins:.25,fall:.4},
 {name:'Blossom Isle',w:2,hill:.8,g1:[.11,.32,.08],g2:[.23,.44,.12],dirt:[.22,.12,.08],r1:[.2,.15,.15],r2:[.36,.28,.27],fl:[[1,.6,.8],[1,1,1]],
  flora:[['round',.85,[[.95,.4,.56],[1,.66,.8],[.98,.88,.95]],1],['bush',.15,[[.9,.5,.7]],1]],dens:.7,ruins:.4,fall:.6},
 {name:'Frostcap',w:2,hill:1.5,g1:[.6,.66,.75],g2:[.84,.88,.94],dirt:[.3,.32,.38],r1:[.2,.22,.27],r2:[.36,.39,.46],fl:[],
  flora:[['pine',.9,[[.03,.13,.1],[.05,.19,.14],[.6,.68,.72]],1],['rock',.1,[[.5,.55,.62]],0]],dens:.8,ruins:.12,fall:.5},
 {name:'Gloamshroom',w:1.6,hill:.9,g1:[.06,.04,.14],g2:[.12,.07,.24],dirt:[.08,.04,.1],r1:[.09,.07,.14],r2:[.18,.13,.26],fl:[[.2,.7,1]],
  flora:[['shroom',.65,[[.1,.55,1,.9],[.75,.25,1,.9],[.2,1,.7,.9],[1,.45,.2,.8]],0],['crystal',.35,[[.3,.62,1,1.3],[.8,.42,1,1.3]],0]],dens:.55,ruins:.15,fall:.3},
 {name:'Ochre Mesa',w:1.5,hill:.45,g1:[.45,.22,.08],g2:[.58,.32,.13],dirt:[.36,.16,.07],r1:[.4,.17,.07],r2:[.56,.3,.13],fl:[],
  flora:[['pine',.15,[[.1,.2,.05]],1],['rock',.6,[[.5,.25,.1],[.42,.2,.1]],0],['bush',.25,[[.3,.3,.08]],1]],dens:.3,ruins:.75,fall:.15},
];
const SYL_A=['Vel','Aur','Mir','Sol','Ith','Cael','Nym','Ora','Lum','Thal','Zeph','Ery','Sa','Ka','Il','Wen','Bri','Oss','Fae','Dun'];
const SYL_B=['mora','elith','wyn','dra','ven','ara','oth','iel','une','assa','orn','ith','ae','ys','andor','esse','ivar'];
const SUFX=['Reach','Hollow','Spire','Rest','Drift','Crown','Haven','Perch','Landing','Shoal'];
function nameOf(r){const n=SYL_A[Math.floor(r()*SYL_A.length)]+SYL_B[Math.floor(r()*SYL_B.length)];return r()<.4?n+' '+SUFX[Math.floor(r()*SUFX.length)]:n;}

// island shape functions (shared by mesh building and collision)
function edgeR(I,a){return I.R*(.78+.36*fbm(Math.cos(a)*1.3+I.ox,Math.sin(a)*1.3+I.oz,I.s2,3));}
function topH(I,x,z,rf){
  const n=fbm(x*I.nf+I.ox,z*I.nf+I.oz,I.s1,4);
  return I.y+(n-.42)*I.R*I.hill*(1-rf*rf*rf)+(1-rf*rf)*I.R*.06-Math.pow(Math.max(rf-.88,0)/.12,2)*2.2;}
function rfOf(I,x,z){const dx=x-I.x,dz=z-I.z;return Math.hypot(dx,dz)/edgeR(I,Math.atan2(dz,dx));}
function pushI(a,x,y,z,s,rot,sy,sx,sw,c,e){a.push(x,y,z,s,rot,sy,sx,sw,c[0],c[1],c[2],e===undefined?(c[3]||0):e);}

// water strip; waterfalls get a curved (bulging) cross-section so they read from any angle
function ribbon(out,pts,fall){
  const cols=fall?6:1,bulge=fall?.75:0;
  const at=(p,u)=>{const th=(u-.5)*Math.PI,s=fall?Math.sin(th):(u*2-1),o=bulge*Math.cos(th)*p[5];
    return[p[0]+p[3]*p[5]*s+p[4]*o,p[1],p[2]+p[4]*p[5]*s-p[3]*o,u,p[6],fall];};
  for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1];
    for(let k=0;k<cols;k++){const u0=k/cols,u1=(k+1)/cols;
      const A0=at(a,u0),A1=at(a,u1),B0=at(b,u0),B1=at(b,u1);out.push(...A0,...A1,...B1,...A0,...B1,...B0);}}}

function makeIsland(o){
  const I=Object.assign({},o);const r=rngOf(o.seed);const B=I.bio;
  I.s1=o.seed&65535;I.s2=(o.seed>>>9)&65535;I.ox=r()*100;I.oz=r()*100;
  I.nf=.011*Math.pow(Math.min(1,56/I.R),.55);                       // big islands get broader hills
  I.depth=Math.min(I.R*(I.islet?1.1+r()*.9:.85+r()*.9),380);
  I.hill=(.12+r()*.3)*B.hill*(I.islet?.5:1);
  I.maxR=I.R*1.12;I.name=nameOf(r);
  I.inst={};for(const k of KINDS)I.inst[k]=[];
  I.water=[];I.ff=[];I.wispPts=[];I.shrine=null;I.mists=[];
  const NA=Math.min(170,(I.islet?20:56)+Math.floor(I.R/3)),NR=(I.islet?4:8)+Math.round(I.R/8),NU=I.islet?6:14;
  const P=[],C=[],IX=[],er=[],eY=[];
  const vtx=(x,y,z,c)=>{P.push(x,y,z);C.push(c[0],c[1],c[2]);return P.length/3-1;};
  const s=I.s1;
  const grass=(x,z,rf)=>{
    let c=mix3(B.g1,B.g2,vn(x*.07,z*.07,s+5));
    c=mix3(c,mix3(B.g1,B.g2,.5),.3*vn(x*.3,z*.3,s+6));
    if(B.fl.length&&h2(Math.floor(x*.9),Math.floor(z*.9),s)<.05&&vn(x*.05,z*.05,s+8)>.45)c=mix3(c,B.fl[Math.floor(h2(Math.floor(x),Math.floor(z),s+1)*B.fl.length)],.6);
    c=mix3(c,B.dirt,sstep(.9,1,rf));
    return mul3(c,.92+h2(Math.floor(x*3),Math.floor(z*3),s+2)*.16);};
  const rock=(y,t,a)=>{const band=.5+.5*Math.sin(y*.42+vn(Math.cos(a)*2,Math.sin(a)*2+y*.05,s+3)*5);
    return mul3(mix3(B.r1,B.r2,band),1-t*.55);};
  for(let j=0;j<NA;j++)er[j]=edgeR(I,j/NA*TAU);
  vtx(I.x,topH(I,I.x,I.z,0),I.z,grass(I.x,I.z,0));
  for(let i=1;i<=NR;i++){const rf=i/NR;for(let j=0;j<NA;j++){const a=j/NA*TAU,d=er[j]*rf;
    const x=I.x+Math.cos(a)*d,z=I.z+Math.sin(a)*d,y=topH(I,x,z,rf);if(i===NR)eY[j]=y;vtx(x,y,z,grass(x,z,rf));}}
  for(let j=0;j<NA;j++)IX.push(0,1+j,1+(j+1)%NA);
  for(let i=1;i<NR;i++){const a=1+(i-1)*NA,b=1+i*NA;for(let j=0;j<NA;j++){const j1=(j+1)%NA;IX.push(a+j,b+j,b+j1,a+j,b+j1,a+j1);}}
  let prev=1+(NR-1)*NA;
  for(let k=1;k<NU;k++){const t=k/NU,start=P.length/3;
    for(let j=0;j<NA;j++){const a=j/NA*TAU;
      const jag=1+(vn(Math.cos(a)*3.1+k*.55,Math.sin(a)*3.1+k*.37,s+4)-.5)*.42;
      const rad=er[j]*Math.pow(1-t,1.25)*(k===1?.97:jag);
      const y=lerp(eY[j]-1.2,I.y-I.depth,Math.pow(t,.8))+(k>1?(vn(Math.cos(a)*4+k,Math.sin(a)*4,s+9)-.5)*I.R*.07:0);
      vtx(I.x+Math.cos(a)*rad,y,I.z+Math.sin(a)*rad,k===1?mul3(B.dirt,.8):rock(y,t,a));}
    for(let j=0;j<NA;j++){const j1=(j+1)%NA;IX.push(prev+j,start+j,start+j1,prev+j,start+j1,prev+j1);}
    prev=start;}
  const tip=vtx(I.x+(r()-.5)*I.R*.12,I.y-I.depth-I.R*.18,I.z+(r()-.5)*I.R*.12,mul3(B.r1,.35));
  for(let j=0;j<NA;j++)IX.push(prev+j,tip,prev+(j+1)%NA);
  const vao=gl.createVertexArray();gl.bindVertexArray(vao);
  const pb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,pb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(P),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);
  const cb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,cb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(C),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,0,0);
  const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(IX),gl.STATIC_DRAW);
  gl.bindVertexArray(null);
  I.gl={vao,bufs:[pb,cb,ib],n:IX.length};

  const spot=(maxRf)=>{const a=r()*TAU,rf=Math.sqrt(r())*maxRf,d=edgeR(I,a)*rf,x=I.x+Math.cos(a)*d,z=I.z+Math.sin(a)*d;return[x,topH(I,x,z,rf),z,rf];};
  // ruins + shrine
  const ruins=[];
  if(!I.islet&&I.R>28&&(I.home||r()<B.ruins)){const sp=I.home?[I.x+I.R*.25,0,I.z-I.R*.2]:spot(.45);ruins.push([sp[0],sp[2]]);addRuins(I,r,sp[0],sp[2],true);
    for(let k=0,ne=Math.floor(I.R/110);k<ne;k++){const q=spot(.72);if(ruins.every(u=>(u[0]-q[0])**2+(u[1]-q[2])**2>2500)){ruins.push([q[0],q[2]]);addRuins(I,r,q[0],q[2],false);}}}
  // flora
  const area=Math.PI*I.R*I.R;                                       // forests thin out a little on giants to keep the GPU happy
  const want=I.islet?Math.min(3+Math.floor(I.R/5),Math.round(B.dens*area/50)):Math.min(520,Math.round(B.dens*area/(72*Math.max(1,I.R/40))));
  const pts=[];
  for(let n=0,tries=0;n<want&&tries<want*6;tries++){
    const [x,y,z,rf]=spot(.84);
    if(vn(x*.025,z*.025,s+11)<.38&&r()<.75)continue;             // clearings
    if(ruins.some(u=>(x-u[0])**2+(z-u[1])**2<300))continue;
    let ok=true;for(const p of pts)if((p[0]-x)**2+(p[1]-z)**2<5.5){ok=false;break;}
    if(!ok)continue;pts.push([x,z]);n++;
    const f=pickW(B.flora,r,a=>a[1]);const col=f[2][Math.floor(r()*f[2].length)];
    const kind=f[0];let sc=.7+r()*.65;if(kind==='rock')sc=.6+r()*1.5;if(kind==='crystal')sc=.6+r()*.9;if(kind==='shroom')sc=.6+r()*1.1;
    pushI(I.inst[kind],x,y-.15,z,sc,r()*TAU,kind==='pine'?.85+r()*.45:1,1,f[3],col);
  }
  // loose rocks on top
  const nr=I.islet?1:Math.round(I.R/9);
  for(let i=0;i<nr;i++){const [x,y,z]=spot(.95);pushI(I.inst.rock,x,y-.3,z,.4+r()*1.2,r()*TAU,1,1,0,mul3(B.r2,.9+r()*.3));}
  // floating debris around the island
  const nd=I.islet?0:3+Math.floor(r()*6)+Math.floor(I.R/40);
  for(let i=0;i<nd;i++){const a=r()*TAU,d=I.R*(1.15+r()*.45);pushI(I.inst.rock,I.x+Math.cos(a)*d,I.y-r()*I.depth*.6+4,I.z+Math.sin(a)*d,(1.2+r()*3.5)*(1+I.R/160),r()*TAU,.9+r()*.5,1,0,mul3(mix3(B.r1,B.r2,r()),1));}
  // waterfalls + rivers (more of them, and wider, on bigger islands)
  if(!I.islet&&I.R>45&&(I.home||r()<B.fall)){
    const nF=1+(I.R>170?1:0)+(I.R>300?1:0),sf=Math.pow(Math.max(1,I.R/55),.8);
    for(let q=0;q<nF;q++){
      const a=q===0&&I.home?-.6:r()*TAU;if(q===0)I.fallA=a;
      const ca=Math.cos(a),sa=Math.sin(a),tx=-sa,tz=ca;
      const er0=edgeR(I,a),riv=[];let v=0,lp=null;
      for(let i=0;i<=20;i++){const rf=lerp(.28,.985,i/20);const d=er0*rf;const x=I.x+ca*d,z=I.z+sa*d;const y=topH(I,x,z,rf)+.55;
        if(lp)v+=Math.hypot(x-lp[0],y-lp[1],z-lp[2]);lp=[x,y,z];riv.push([x,y,z,tx,tz,(1.2+rf*2.2)*sf,v]);}
      ribbon(I.water,riv,0);
      const ex=lp[0],ey=lp[1],ez=lp[2];const Hh=ey-SEA+25;const fall=[];v=0;let fp=null;
      for(let i=0;i<=40;i++){const t=i/40;const out=1+7.5*(1-Math.exp(-t*9))*Math.sqrt(sf);const x=ex+ca*out,z=ez+sa*out,y=ey+.1-Hh*Math.pow(t,1.55);
        if(fp)v+=Math.hypot(x-fp[0],y-fp[1],z-fp[2]);fp=[x,y,z];fall.push([x,y,z,tx,tz,(3.6+t*11)*sf,v]);}
      ribbon(I.water,fall,1);
      I.mists.push([ex+ca*3,ey,ez+sa*3]);
    }
    I.mist=I.mists[0];
    I.water=new Float32Array(I.water);
  }else I.water=new Float32Array(0);
  // fireflies + wisps
  const nf=I.islet?3:Math.min(60,Math.round(I.R/2.5));
  for(let i=0;i<nf;i++){const [x,y,z]=spot(.9);I.ff.push([x,y+1.2+r()*2.5,z,r()*50]);}
  const nw=I.islet?1:2+Math.floor(r()*3)+Math.floor(I.R/45);
  for(let i=0;i<nw;i++){const [x,y,z]=spot(.8);I.wispPts.push([x,y+2.5+r()*5,z]);}
  if(I.islet&&r()<.5)I.wispPts.push([I.x,I.y+3,I.z]);
  for(const k of KINDS)I.inst[k]=new Float32Array(I.inst[k]);
  return I;
}
function addRuins(I,r,cx,cz,main){
  const n=5+Math.floor(r()*4),rr=Math.min(I.R*.22,main?16:11)+2,ph=r()*TAU,tops=[];
  const stone=mix3(I.bio.r2,[.62,.6,.56],.55);
  for(let i=0;i<n;i++){const a=ph+i/n*TAU,x=cx+Math.cos(a)*rr,z=cz+Math.sin(a)*rr,y=topH(I,x,z,rfOf(I,x,z))-.4;
    const broken=r()<.35,h=broken?1+r()*2.4:5+r()*1.4;
    pushI(I.inst.pillar,x,y,z,1,r()*TAU,h,1,0,mul3(stone,.85+r()*.25),0);tops.push(broken?null:[x,y+h,z]);
    if(broken&&r()<.6){const fa=r()*TAU;pushI(I.inst.block,x+Math.cos(fa)*2.5,y+.1,z+Math.sin(fa)*2.5,1,fa,.8,2.2+r()*1.5,0,mul3(stone,.8),0);}}
  for(let i=0;i<n;i++){const a=tops[i],b=tops[(i+1)%n];if(a&&b&&r()<.75){const dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz);
    pushI(I.inst.block,(a[0]+b[0])/2,Math.max(a[1],b[1]),(a[2]+b[2])/2,1,Math.atan2(-dz,dx),.65,len+1.3,0,mul3(stone,.95),0);}}
  const y=topH(I,cx,cz,rfOf(I,cx,cz));
  pushI(I.inst.block,cx,y-.3,cz,1,ph,1,2.3,0,mul3(stone,.75),0);
  if(!main)return;                                                  // extra ruin sites on giants are scenery only
  pushI(I.inst.crystal,cx,y+.85,cz,1.05,ph,1,1,0,[1,.68,.32],1.5);
  I.shrine=[cx,y+2.2,cz];I.awake=SHR.has(I.seed)||Q.has('awake');
  for(let i=0;i<4;i++){const a=ph+i/4*TAU+.4;I.wispPts.push([cx+Math.cos(a)*(rr+3),y+3.5,cz+Math.sin(a)*(rr+3)]);}
}

// ---- persistence ----
const SKEY='driftlands:'+SEED;
let SAVE={w:0,l:0,total:0,c:[]};
try{const s=JSON.parse(localStorage.getItem(SKEY));if(s&&typeof s==='object')SAVE=Object.assign(SAVE,s);}catch(e){}
const GOT=new Set(SAVE.c||[]);
const SHR=new Set(SAVE.sh||[]);
function save(){try{SAVE.c=[...GOT].slice(-8000);SAVE.sh=[...SHR];localStorage.setItem(SKEY,JSON.stringify(SAVE));}catch(e){}}

// ---- chunks ----
function genChunk(cx,cz){
  const r=rngOf(hseed(cx,cz,1));const ch={cx,cz,islands:[],wisps:[]};const placed=[];
  const place=(R,islet,jit)=>{for(let t=0;t<18;t++){
    const x=(cx+(r()-.5)*jit)*CH,z=(cz+(r()-.5)*jit)*CH,y=-20+r()*(islet?280:220);let ok=true;
    for(const p of placed){if(Math.hypot(p.x-x,p.z-z)<(p.R+R)*1.2+18&&Math.abs(p.y-y)<(p.R+R)*.9+40){ok=false;break;}}
    if(ok){const q={x,y,z,R};placed.push(q);return q;}}return null;};
  const bio=()=>pickW(BIO,r,b=>b.w);
  if(cx===0&&cz===0){placed.push({x:0,y:20,z:0,R:120});ch.islands.push(makeIsland({x:0,y:20,z:0,R:120,seed:hseed(0,0,9),bio:BIO[0],home:true}));}
  // a rare titan: a whole landmass, hundreds of units across
  if(!(cx===0&&cz===0)&&r()<.15){const R=300+r()*140;const p=place(R,false,.2);if(p){p.y=-10+r()*110;ch.islands.push(makeIsland(Object.assign(p,{seed:hseed(cx,cz,5),bio:bio()})));}}
  const n=r()<.15?0:r()<.55?1:2;
  for(let k=0;k<n;k++){const R=40+Math.pow(r(),1.5)*240;const p=place(R,false,.46);if(p)ch.islands.push(makeIsland(Object.assign(p,{seed:hseed(cx,cz,10+k),bio:bio()})));}
  // stepping-stone islets scattered between the big ones
  const m=3+Math.floor(r()*5);
  for(let k=0;k<m;k++){const R=10+r()*28;const p=place(R,true,.9);if(p)ch.islands.push(makeIsland(Object.assign(p,{seed:hseed(cx,cz,40+k),bio:bio(),islet:true})));}
  let wi=0;const addW=(x,y,z)=>{const id=cx+','+cz+','+(wi++);ch.wisps.push({id,x,y,z,ph:r()*TAU,got:GOT.has(id)});};
  for(const I of ch.islands)for(const w of I.wispPts)addW(w[0],w[1],w[2]);
  // a trail of wisps arcing between the two biggest islands of this chunk
  const big=ch.islands.filter(I=>!I.islet).sort((a,b)=>b.R-a.R);
  if(big.length>=2){const A=big[0],B2=big[1];const ya=A.y+14,yb=B2.y+14,dist=Math.hypot(A.x-B2.x,A.z-B2.z),nt=clamp(Math.round(dist/80),6,24);
    for(let i=1;i<nt;i++){const t=i/nt;addW(lerp(A.x,B2.x,t),lerp(ya,yb,t)+Math.sin(t*Math.PI)*dist*.05,lerp(A.z,B2.z,t));}}
  for(let k=0;k<5;k++)addW((cx+(r()-.5))*CH,-10+r()*260,(cz+(r()-.5))*CH);
  // a long wind current meandering through the chunk
  ch.winds=[];
  if(r()<.65||(cx===0&&cz===0)){const th=r()*TAU,len=1100+r()*900,amp=60+r()*90,ph=r()*TAU,y0=15+r()*190;
    const x0=(cx+(r()-.5)*.5)*CH-Math.cos(th)*len/2,z0=(cz+(r()-.5)*.5)*CH-Math.sin(th)*len/2;
    const pts=[],N=Math.round(len/14);
    for(let i=0;i<=N;i++){const s=i/N*len,m=Math.sin(s*.005+ph)*amp;pts.push([x0+Math.cos(th)*s-Math.sin(th)*m,y0+Math.sin(s*.004+ph*2)*55,z0+Math.sin(th)*s+Math.cos(th)*m]);}
    const mid=pts[N>>1];ch.winds.push({pts,len,mid,rad:len/2+amp+20});
    if(r()<.7)addW(mid[0],mid[1],mid[2]);}
  return ch;
}
function freeChunk(c){for(const I of c.islands){gl.deleteVertexArray(I.gl.vao);for(const b of I.gl.bufs)gl.deleteBuffer(b);}}

const chunks=new Map();let active=[],activeIsl=[],pending=[],dirty=true,lastCX=1e9,lastCZ=1e9;
function updateChunks(force){
  const cx=Math.round(P.pos[0]/CH),cz=Math.round(P.pos[2]/CH);
  if(cx!==lastCX||cz!==lastCZ){lastCX=cx;lastCZ=cz;
    for(const [k,c] of chunks)if(Math.abs(c.cx-cx)>LOADR+1||Math.abs(c.cz-cz)>LOADR+1){freeChunk(c);chunks.delete(k);dirty=true;}
    pending=[];for(let dz=-LOADR;dz<=LOADR;dz++)for(let dx=-LOADR;dx<=LOADR;dx++)if(!chunks.has((cx+dx)+','+(cz+dz)))pending.push([cx+dx,cz+dz,dx*dx+dz*dz]);
    pending.sort((a,b)=>a[2]-b[2]);}
  let budget=force?999:1;
  while(pending.length&&budget-->0){const [a,b]=pending.shift();const k=a+','+b;if(!chunks.has(k)){chunks.set(k,genChunk(a,b));dirty=true;}}
  if(dirty){active=[...chunks.values()];activeIsl=active.flatMap(c=>c.islands);rebuildInst();dirty=false;}
}
function rebuildInst(){
  for(const k of KINDS){let n=0;for(const I of activeIsl)n+=I.inst[k].length;const f=new Float32Array(n);let o=0;
    for(const I of activeIsl){f.set(I.inst[k],o);o+=I.inst[k].length;}
    gl.bindBuffer(gl.ARRAY_BUFFER,MESH[k].ib);gl.bufferData(gl.ARRAY_BUFFER,f,gl.STATIC_DRAW);MESH[k].n=n/12;}
  let n=0;for(const I of activeIsl)n+=I.water.length;const f=new Float32Array(n);let o=0;
  for(const I of activeIsl){f.set(I.water,o);o+=I.water.length;}
  gl.bindBuffer(gl.ARRAY_BUFFER,WATER.vb);gl.bufferData(gl.ARRAY_BUFFER,f,gl.STATIC_DRAW);WATER.n=n/6;
}
