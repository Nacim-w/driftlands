'use strict';
/* =====================================================================
   3. GEOMETRY: prop meshes (low-poly, built in code)
   ===================================================================== */
function GB(){const a=[];return{a,t(p,q,r,c){a.push(p[0],p[1],p[2],c[0],c[1],c[2],c[3],q[0],q[1],q[2],c[0],c[1],c[2],c[3],r[0],r[1],r[2],c[0],c[1],c[2],c[3]);}};}
const shade=(c,s)=>[c[0]*s,c[1]*s,c[2]*s,c[3]];
function prism(g,n,r0,r1,y0,y1,c,ph=0){
  for(let i=0;i<n;i++){const a0=i/n*TAU+ph,a1=(i+1)/n*TAU+ph;
    const p0=[Math.cos(a0)*r0,y0,Math.sin(a0)*r0],p1=[Math.cos(a1)*r0,y0,Math.sin(a1)*r0];
    const q0=[Math.cos(a0)*r1,y1,Math.sin(a0)*r1],q1=[Math.cos(a1)*r1,y1,Math.sin(a1)*r1];
    const sc=shade(c,.9+.1*Math.cos(a0*3));
    g.t(p0,p1,q1,sc);g.t(p0,q1,q0,sc);g.t(q0,q1,[0,y1,0],c);g.t(p1,p0,[0,y0,0],shade(c,.6));}}
function cone(g,n,r,y0,y1,c,rng){
  const pts=[];for(let i=0;i<n;i++){const a=i/n*TAU+rng()*.3;const rr=r*(.85+rng()*.3);pts.push([Math.cos(a)*rr,y0+(rng()-.5)*.25,Math.sin(a)*rr]);}
  const ap=[(rng()-.5)*.15,y1,(rng()-.5)*.15];
  for(let i=0;i<n;i++){const p=pts[i],q=pts[(i+1)%n];g.t(p,q,ap,shade(c,.85+rng()*.25));g.t(q,p,[0,y0+.25,0],shade(c,.55));}}
const PHI=(1+Math.sqrt(5))/2;
const IV=[[-1,PHI,0],[1,PHI,0],[-1,-PHI,0],[1,-PHI,0],[0,-1,PHI],[0,1,PHI],[0,-1,-PHI],[0,1,-PHI],[PHI,0,-1],[PHI,0,1],[-PHI,0,-1],[-PHI,0,1]].map(norm);
const IF=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
function blob(g,cx,cy,cz,r,c,rng,j=.22,sy=1){
  const v=IV.map(p=>{const k=r*(1+(rng()-.5)*2*j);return[cx+p[0]*k,cy+p[1]*k*sy,cz+p[2]*k];});
  for(const f of IF){const ny=(v[f[0]][1]+v[f[1]][1]+v[f[2]][1])/3-cy;const s=.78+rng()*.22+clamp(ny/r,-1,1)*.16;g.t(v[f[0]],v[f[1]],v[f[2]],shade(c,s));}}
function octa(g,x,z,r,h,c,n=5){const top=[x,h,z],bot=[x,-.35,z],mid=[];
  for(let i=0;i<n;i++){const a=i/n*TAU;mid.push([x+Math.cos(a)*r,h*.28,z+Math.sin(a)*r]);}
  for(let i=0;i<n;i++){const a=mid[i],b=mid[(i+1)%n];g.t(a,b,top,shade(c,.85+.25*(i%2)));g.t(b,a,bot,shade(c,.6));}}

const KINDS=['round','pine','rock','pillar','block','crystal','shroom','bush'];
const MDATA={};
{
  const R=rngOf(4242),TR=[.15,.085,.045,0],W=[1,1,1,1];
  let g=GB();prism(g,6,.3,.17,0,2.5,TR);blob(g,0,3.4,0,1.75,W,R);blob(g,.85,2.85,.45,1.15,W,R);blob(g,-.75,3.05,-.5,1.25,W,R);blob(g,.1,4.45,-.1,1.0,shade(W,1.08),R);MDATA.round=g.a;
  g=GB();prism(g,5,.27,.15,0,1.4,TR);cone(g,8,1.85,1.1,3.7,W,R);cone(g,8,1.42,2.5,5.0,W,R);cone(g,7,.95,3.8,6.3,W,R);MDATA.pine=g.a;
  g=GB();blob(g,0,.35,0,1,W,R,.34,.72);MDATA.rock=g.a;
  g=GB();prism(g,6,.55,.5,0,1,W);MDATA.pillar=g.a;
  g=GB();prism(g,4,.7071,.7071,0,1,W,Math.PI/4);MDATA.block=g.a;
  g=GB();octa(g,0,0,.42,2.3,W);octa(g,.55,.2,.26,1.35,W);octa(g,-.38,-.35,.3,1.7,W);octa(g,.1,-.6,.2,1.0,W);MDATA.crystal=g.a;
  g=GB();prism(g,7,.24,.17,0,1.9,[.78,.74,.7,0]);cone(g,11,1.25,1.6,2.55,W,R);
  for(let i=0;i<11;i++){const a0=i/11*TAU,a1=(i+1)/11*TAU;g.t([Math.cos(a0)*1.2,1.62,Math.sin(a0)*1.2],[Math.cos(a1)*1.2,1.62,Math.sin(a1)*1.2],[0,1.75,0],[.35,.35,.35,1]);}
  MDATA.shroom=g.a;
  g=GB();blob(g,0,.4,0,.75,W,R,.25,.7);blob(g,.6,.3,.2,.5,W,R,.25,.7);MDATA.bush=g.a;
  // bird: nose toward -z, wings along x
  g=GB();const B=[1,1,1,1];
  g.t([0,0,-.65],[.13,0,.3],[-.13,0,.3],B);g.t([0,0,-.15],[-1.45,.06,.18],[0,0,.32],B);g.t([0,0,-.15],[0,0,.32],[1.45,.06,.18],B);
  g.t([0,0,.3],[.28,0,.75],[-.28,0,.75],B);g.t([0,.02,-.6],[0,-.12,.15],[0,.02,.35],shade(B,.7));MDATA.bird=g.a;
  // sky whale: lofted body (nose at -z), pale belly, pectoral fins, dorsal nub, flukes
  g=GB();const WN=18,WM=12,rings=[];
  for(let i=0;i<=WN;i++){const t=i/WN,z=t*2-1;
    let r=Math.pow(Math.sin(Math.PI*Math.pow(t,.6)),.85)*.27;if(t>.72)r*=1-(t-.72)/.28*.85;r=Math.max(r,.012);
    const ring=[];for(let j=0;j<WM;j++){const a=j/WM*TAU,sy=Math.sin(a);ring.push([Math.cos(a)*r*(sy<0?1.06:1),sy*r*(sy<0?.7:.85),z]);}rings.push(ring);}
  for(let i=0;i<WN;i++)for(let j=0;j<WM;j++){const a=rings[i][j],b=rings[i][(j+1)%WM],c=rings[i+1][(j+1)%WM],d=rings[i+1][j];
    const my=(a[1]+b[1]+c[1]+d[1])/4;const col=my<-.02?[1.35,1.33,1.28,1]:my<.02?[.95,.97,1,1]:[.62,.66,.75,1];
    const sc=shade(col,.92+((i+j)%2)*.08);g.t(a,b,c,sc);g.t(a,c,d,sc);}
  for(const sx of [1,-1]){g.t([.22*sx,-.07,-.44],[.66*sx,-.2,-.16],[.22*sx,-.09,-.22],[.7,.73,.82,1]);
    g.t([.04*sx,0,.9],[.42*sx,.01,1.14],[.12*sx,0,1.04],[.6,.64,.72,1]);g.t([.04*sx,0,.9],[.12*sx,0,1.04],[0,0,1.02],[.6,.64,.72,1]);}
  g.t([0,.2,.22],[0,.27,.36],[0,.17,.4],[.55,.6,.7,1]);
  MDATA.whale=g.a;
}

const MESH={};
function instMesh(data){const vao=gl.createVertexArray();gl.bindVertexArray(vao);
  const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,28,0);
  gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,4,gl.FLOAT,false,28,12);
  const ib=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,ib);
  for(let i=0;i<3;i++){gl.enableVertexAttribArray(2+i);gl.vertexAttribPointer(2+i,4,gl.FLOAT,false,48,i*16);gl.vertexAttribDivisor(2+i,1);}
  gl.bindVertexArray(null);return{vao,ib,count:data.length/7,n:0};}
for(const k of KINDS)MESH[k]=instMesh(MDATA[k]);
MESH.bird=instMesh(MDATA.bird);
MESH.whale=instMesh(MDATA.whale);

// fullscreen triangle
const FSQ=gl.createVertexArray();gl.bindVertexArray(FSQ);
{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);}

// cloud-sea grid
const SEAN=LOWQ?110:200;const SEASTEP=SEAHALF*2/SEAN;
const SEAVAO=gl.createVertexArray();let SEAIDX=0;
{gl.bindVertexArray(SEAVAO);const v=[],ix=[];
  for(let j=0;j<=SEAN;j++)for(let i=0;i<=SEAN;i++)v.push(i/SEAN*2-1,j/SEAN*2-1);
  for(let j=0;j<SEAN;j++)for(let i=0;i<SEAN;i++){const a=j*(SEAN+1)+i,b=a+SEAN+1;ix.push(a,b,a+1,a+1,b,b+1);}
  const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(v),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(ix),gl.STATIC_DRAW);SEAIDX=ix.length;}

// water (rebuilt with the active chunk set)
const WATER={vao:gl.createVertexArray(),vb:gl.createBuffer(),n:0};
gl.bindVertexArray(WATER.vao);gl.bindBuffer(gl.ARRAY_BUFFER,WATER.vb);
gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,24,0);
gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,24,12);

// glow points (rebuilt every frame)
const MAXP=10000;const GP=new Float32Array(MAXP*8);let gn=0;
const GLOW={vao:gl.createVertexArray(),vb:gl.createBuffer()};
gl.bindVertexArray(GLOW.vao);gl.bindBuffer(gl.ARRAY_BUFFER,GLOW.vb);gl.bufferData(gl.ARRAY_BUFFER,GP.byteLength,gl.DYNAMIC_DRAW);
gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,4,gl.FLOAT,false,32,0);
gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,4,gl.FLOAT,false,32,16);
gl.bindVertexArray(null);
// the wanderer: one mesh per body part, built in its joint's local space (limbs hang along -y, face toward -z).
// colour alpha = emissive strength.
const CHC={tun:[.88,.82,.7,0],tun2:[.58,.47,.36,0],pant:[.2,.2,.27,0],boot:[.3,.19,.11,0],skin:[.93,.73,.58,0],belt:[.34,.21,.11,0],
  scarf:[.9,.3,.12,0],eye:[.45,.95,1.1,1.6],gem:[.5,1,1.25,2.4],orb:[.72,.96,1.1,2.4]};
function cbox(g,x0,x1,y0,y1,z0,z1,c){
  const v=[[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]];
  for(const [a,b,cc,d,s] of [[0,1,2,3,.85],[5,4,7,6,.9],[4,0,3,7,.8],[1,5,6,2,.8],[3,2,6,7,1],[4,5,1,0,.6]]){const col=shade(c,s);g.t(v[a],v[b],v[cc],col);g.t(v[a],v[cc],v[d],col);}}
const CHR=(()=>{const R=rngOf(9001),C=CHC,mk=f=>{const g=GB();f(g);return new Float32Array(g.a);};return{
  pelvis:mk(g=>{prism(g,8,.16,.17,-.13,.06,C.pant);prism(g,10,.235,.18,-.29,-.01,C.tun);prism(g,10,.186,.186,-.02,.055,C.belt);
    blob(g,0,.018,-.19,.034,C.gem,R,0);cbox(g,.215,.29,-.2,-.04,-.05,.08,C.tun2);}),
  chest:mk(g=>{prism(g,8,.17,.21,0,.34,C.tun);prism(g,8,.21,.12,.34,.46,C.tun);prism(g,9,.135,.12,.38,.5,C.scarf);}),
  head:mk(g=>{prism(g,6,.055,.05,-.02,.08,C.skin);blob(g,0,.165,-.012,.142,C.skin,R,.03);blob(g,0,.2,.03,.163,C.tun2,R,.05);
    cone(g,6,.09,.27,.45,C.tun2,R);blob(g,.052,.175,-.142,.021,C.eye,R,0);blob(g,-.052,.175,-.142,.021,C.eye,R,0);}),
  uarm:mk(g=>{blob(g,0,-.01,0,.078,C.tun,R,.04);prism(g,6,.052,.066,-.28,0,C.tun);}),
  farm:mk(g=>{prism(g,6,.043,.054,-.22,0,C.tun2);blob(g,0,-.265,-.01,.052,C.skin,R,.05,1.15);}),
  thigh:mk(g=>{prism(g,7,.07,.088,-.44,0,C.pant);}),
  shin:mk(g=>{prism(g,7,.057,.07,-.26,0,C.pant);prism(g,7,.068,.074,-.43,-.22,C.boot);}),
  foot:mk(g=>{cbox(g,-.058,.058,-.085,0,-.17,.06,C.boot);}),
};})();
const ORBN=4;
// orb: icosahedron subdivided once (80 faces) so it reads as a ball, not a gem
const ORBMESH=(()=>{const o=[];const mid=(a,b)=>norm([(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2]);
  for(const f of IF){const a=IV[f[0]],b=IV[f[1]],c=IV[f[2]],ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);
    for(const t of [[a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca]])for(const v of t)o.push(v[0],v[1],v[2]);}return o;})();
const SCARF=[{n:8,len:.12,off:[.05,.43,.125],p:[],q:[]},{n:6,len:.115,off:[-.05,.42,.125],p:[],q:[]}];
const CB=(()=>{let n=(CHR.pelvis.length+CHR.chest.length+CHR.head.length+2*(CHR.uarm.length+CHR.farm.length+CHR.thigh.length+CHR.shin.length+CHR.foot.length))/7+ORBN*ORBMESH.length/3;
  for(const s of SCARF)n+=(s.n-1)*6;return new Float32Array(n*7);})();
let CHN=0;
const CHRG={vao:gl.createVertexArray(),vb:gl.createBuffer()};
gl.bindVertexArray(CHRG.vao);gl.bindBuffer(gl.ARRAY_BUFFER,CHRG.vb);gl.bufferData(gl.ARRAY_BUFFER,CB.byteLength,gl.DYNAMIC_DRAW);
gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,28,0);
gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,4,gl.FLOAT,false,28,12);
gl.bindVertexArray(null);

function gp(x,y,z,s,r,g,b,shape){if(gn>=MAXP)return;const o=gn*8;GP[o]=x;GP[o+1]=y;GP[o+2]=z;GP[o+3]=s;GP[o+4]=r;GP[o+5]=g;GP[o+6]=b;GP[o+7]=shape;gn++;}
const MAXPT=gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)[1]||64;
