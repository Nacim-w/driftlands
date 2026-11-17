'use strict';
/* =====================================================================
   2. SHADERS
   ===================================================================== */
const HDR='#version 300 es\nprecision highp float;precision highp int;\n';
const COMMON=`
uniform mat4 uVP;
uniform vec3 uCam,uLightDir,uLightCol,uAmbS,uAmbG,uZen,uHor,uSunDir,uGlow;
uniform float uTime,uFogDen,uNight;
float h12(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h12(i),h12(i+vec2(1,0)),f.x),mix(h12(i+vec2(0,1)),h12(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);
  for(int i=0;i<5;i++){v+=a*vn(p);p=m*p+vec2(3.1,1.7);a*=.5;}return v;}
vec3 skyCol(vec3 d){
  float y=max(d.y,0.);
  vec3 c=mix(uHor,uZen,pow(y,.5));
  float s=max(dot(d,uSunDir),0.);
  c+=uGlow*(pow(s,6.)*.24+pow(s,48.)*.45)*(1.-y*.6);
  return c;}
vec3 fogA(vec3 c,vec3 wp){vec3 v=wp-uCam;float d=length(v);float f=1.-exp(-pow(d*uFogDen,2.));return mix(c,skyCol(v/d),f);}
vec3 fogO(vec3 c,vec3 wp){vec3 v=wp-uCam;float d=length(v);float f=1.-exp(-pow(d*uFogDen,2.));
  f=max(f,smoothstep(-25.,-85.,wp.y)*.85*(1.-exp(-d*.006)));return mix(c,skyCol(v/d),f);}
vec3 light(vec3 a,vec3 n){float d=max(dot(n,uLightDir),0.);vec3 amb=mix(uAmbG,uAmbS,n.y*.5+.5);return a*(uLightCol*d+amb);}
`;

// ---- fullscreen ----
const VS_FS=`layout(location=0) in vec2 aP;out vec2 vUV;out vec2 vP;void main(){vUV=aP*.5+.5;vP=aP;gl_Position=vec4(aP,0.,1.);}`;

// ---- sky (drawn last at z=1 so hidden pixels are rejected by early-z) ----
const VS_SKY=`layout(location=0) in vec2 aP;out vec2 vUV;out vec2 vP;void main(){vUV=aP*.5+.5;vP=aP;gl_Position=vec4(aP,1.,1.);}`;
const FS_SKY=`
uniform vec3 uR,uU,uF;uniform vec2 uTan;uniform float uStars;
in vec2 vP;out vec4 o;
float h13(vec3 p){p=fract(p*.1031);p+=dot(p,p.zyx+31.32);return fract((p.x+p.y)*p.z);}
void main(){
  vec3 d=normalize(uF+vP.x*uTan.x*uR+vP.y*uTan.y*uU);
  vec3 c=skyCol(d);
  float s=dot(d,uSunDir);
  float up=smoothstep(-.03,.02,d.y);
  c+=uGlow*7.*smoothstep(.99965,.99988,s)*up;
  // moon with a phase
  vec3 md=-uSunDir;float m=dot(d,md);
  float disc=smoothstep(.99955,.9997,m);
  float shd=smoothstep(.99955,.9997,dot(d,normalize(md+vec3(.011,.006,0.))));
  float crat=.78+.22*vn(d.xy*1400.)*vn(d.zy*700.+3.);
  c+=vec3(.9,.93,1.)*max(disc-shd*.88,0.)*crat*2.*uStars*up;
  c+=vec3(.25,.3,.45)*pow(max(m,0.),260.)*.5*uStars;
  if(d.y>0.){
    if(uStars>.01){
      vec3 g=d*170.;vec3 id=floor(g);vec3 f=fract(g)-.5;float h=h13(id);
      if(h>.981){
        vec3 off=(vec3(h13(id+7.1),h13(id+3.3),h13(id+5.7))-.5)*.5;
        float sd=length(f-off);
        float tw=.55+.45*sin(uTime*(1.5+h*6.)+h*90.);
        vec3 sc=mix(vec3(1.,.82,.62),vec3(.72,.82,1.),h13(id+1.));
        c+=sc*smoothstep(.24,0.,sd)*(h-.981)*95.*tw*uStars*smoothstep(0.,.18,d.y);
      }
      // shooting stars
      for(int i=0;i<2;i++){
        float fi=float(i),tt=uTime*.38+fi*.5,sl=floor(tt),p=fract(tt)*2.6;
        if(h12(vec2(sl,fi*7.+1.))<.55&&p<1.){
          vec3 s0=normalize(vec3(h12(vec2(sl,fi+2.))-.5,.3+h12(vec2(sl,fi+3.))*.5,h12(vec2(sl,fi+4.))-.5));
          vec3 mv=normalize(cross(s0,vec3(h12(vec2(sl,fi+5.))-.5,1.,h12(vec2(sl,fi+6.))-.5)));
          vec3 hd=normalize(s0+mv*p*.32),tl=normalize(s0+mv*max(p*.32-.11,0.));
          vec3 ab=hd-tl;float q=clamp(dot(d-tl,ab)/max(dot(ab,ab),1e-6),0.,1.);float dd=length(d-(tl+ab*q));
          c+=vec3(.9,.95,1.)*smoothstep(.0022,0.,dd)*q*(1.-p)*3.*uStars;
        }
      }
      // milky band
      float band=exp(-pow(dot(d,normalize(vec3(.3,.5,-.8))),2.)*18.);
      c+=vec3(.05,.05,.09)*band*fbm(d.xz*9.+d.y*4.)*uStars*1.6;
      // aurora curtains
      vec2 ap=d.xz/(d.y+.08);
      float a=0.;
      for(int i=0;i<4;i++){
        float fi=float(i);
        float x=ap.x*.35+fi*.31;
        float wv=sin(x*1.3+uTime*.05+fi)*.8+vn(vec2(x*2.,uTime*.03+fi*4.))*1.3;
        float bd=exp(-abs(ap.y*.32-1.3-wv-fi*.16)*4.);
        float rays=.45+.55*vn(vec2(x*26.,uTime*.35+fi));
        a+=bd*rays*(1.-fi*.18);
      }
      vec3 ac=mix(vec3(.05,.95,.45),vec3(.55,.15,.95),smoothstep(.12,.5,d.y));
      c+=ac*a*.11*uStars*smoothstep(.03,.25,d.y);
    }
    // high wisps of cirrus
    vec2 cp=d.xz/(d.y+.12)*1.6+vec2(uTime*.004,uTime*.0016);
    float cl=fbm(cp*vec2(.7,2.2));
    cl=smoothstep(.5,.86,cl)*smoothstep(0.,.3,d.y);
    vec3 cc=uHor*.85+uAmbS*.6+uGlow*pow(max(s,0.),4.)*1.1;
    c=mix(c,cc,cl*.55);
  }
  o=vec4(c,1.);
}`;

// ---- islands (baked world-space mesh, flat shaded via derivatives) ----
const VS_ISL=`layout(location=0) in vec3 aP;layout(location=1) in vec3 aC;out vec3 vW;out vec3 vC;
void main(){vW=aP;vC=aC;gl_Position=uVP*vec4(aP,1.);}`;
const FS_ISL=`in vec3 vW;in vec3 vC;out vec4 o;
void main(){
  vec3 n=normalize(cross(dFdx(vW),dFdy(vW)));
  vec3 c=vC*(.86+.26*vn(vW.xz*.35+vW.y*.11));
  c=light(c,n);
  // sunlit rim on cliff faces
  vec3 v=normalize(vW-uCam);
  c+=vC*uGlow*pow(max(dot(v,uSunDir),0.),6.)*(1.-abs(n.y))*.6;
  o=vec4(fogO(c,vW),1.);
}`;

// ---- generic instanced props (trees, rocks, ruins, crystals, mushrooms, birds) ----
const VS_INS=`layout(location=0) in vec3 aP;layout(location=1) in vec4 aC;
layout(location=2) in vec4 iP;layout(location=3) in vec4 iR;layout(location=4) in vec4 iC;
uniform float uFlap;
out vec3 vW;out vec3 vC;out float vE;
void main(){
  vec3 p=aP;
  if(uFlap>4.5){
    // glider (sky ray): a slow wave rolls out along each wing
    float ph=uTime*1.7+iR.w*6.283;
    p.y+=sin(ph-abs(p.x)*1.4)*abs(p.x)*.32;
    float pc=cos(iR.z),ps=sin(iR.z);
    p.yz=vec2(p.y*pc-p.z*ps,p.y*ps+p.z*pc);
  }else if(uFlap>3.5){
    // four-legged gait: iR.y = stride amount (0 = standing), iR.z = leg height, iR.w = gait phase (radians, from the CPU)
    float leg=smoothstep(iR.z,iR.z*.1,p.y);
    float dg=((p.x>0.)!=(p.z>0.))?0.:3.14159;            // diagonal pairs move together
    float sw=iR.w+dg;
    p.z+=sin(sw)*leg*iR.z*.2*iR.y;
    p.y+=max(0.,cos(sw))*leg*iR.z*.09*iR.y;
  }else if(uFlap>2.5){
    // insect wings: fast flutter
    p.y+=sin(uTime*30.+iR.w*6.283)*abs(p.x)*1.1-abs(p.x)*.2;
  }else if(uFlap>1.5){
    // sky whale: a slow wave travels from head to flukes, pectoral fins row gently
    float ph=uTime*.9+iR.w*6.283;
    p.y+=sin(ph-p.z*2.2)*.075*pow(max(p.z+.3,0.),1.6);
    p.y+=sin(ph)*max(abs(p.x)-.2,0.)*.38;
    p.y*=iR.y;
    float pc=cos(iR.z),ps=sin(iR.z);
    p.yz=vec2(p.y*pc-p.z*ps,p.y*ps+p.z*pc);
  }else{
    if(uFlap>.5){p.y+=sin(uTime*11.+iR.w*6.283)*abs(p.x)*.55-abs(p.x)*.1;}
    p.y*=iR.y;p.x*=iR.z;
  }
  float c=cos(iR.x),s=sin(iR.x);
  p.xz=mat2(c,-s,s,c)*p.xz;
  p*=iP.w;
  if(uFlap<.5){
    float sw=iR.w*(sin(uTime*1.3+iP.x*.07+iP.z*.05)*.035+sin(uTime*2.9+iP.z*.3)*.01)*p.y;
    p.xz+=vec2(sw,sw*.7);
  }
  vW=p+iP.xyz;
  bool tint=aC.a>.5;
  vC=tint?iC.rgb*aC.rgb:aC.rgb;
  vE=tint?iC.a:0.;
  gl_Position=uVP*vec4(vW,1.);
}`;
const FS_INS=`in vec3 vW;in vec3 vC;in float vE;out vec4 o;
void main(){
  vec3 n=normalize(cross(dFdx(vW),dFdy(vW)));
  vec3 c=light(vC,n)+vC*vE*(1.1+uNight*1.6);
  vec3 v=normalize(vW-uCam);
  c+=vC*uGlow*pow(max(dot(v,uSunDir),0.),8.)*.5;
  o=vec4(fogO(c,vW),1.);
}`;

// ---- the wanderer: CPU-posed body + support orbs (world-space, rebuilt every frame) ----
const VS_CHR=`layout(location=0) in vec3 aP;layout(location=1) in vec4 aC;out vec3 vW;out vec3 vC;out float vE;
void main(){vW=aP;vC=aC.rgb;vE=aC.a;gl_Position=uVP*vec4(aP,1.);}`;
const FS_CHR=`uniform vec3 uOrb[4];uniform vec3 uOrbC;in vec3 vW;in vec3 vC;in float vE;out vec4 o;
void main(){
  vec3 n=normalize(cross(dFdx(vW),dFdy(vW)));
  vec3 v=normalize(vW-uCam);
  vec3 c=light(vC,n);
  // the orbs light whatever they hold
  for(int i=0;i<4;i++){vec3 L=uOrb[i]-vW;float d2=dot(L,L);c+=vC*uOrbC*(max(dot(n,L*inversesqrt(d2)),0.)*.8+.2)/(1.+d2*9.);}
  // soft rim so the silhouette reads against sky and cloud
  float fr=pow(1.-abs(dot(n,v)),3.);
  c+=vC*(uAmbS*1.4+uGlow*.25)*fr*.9;
  c+=vC*uGlow*pow(max(dot(v,uSunDir),0.),6.)*.6;
  c+=vC*vE*(1.1+uNight*1.6);
  o=vec4(fogO(c,vW),1.);
}`;

// ---- cloud sea ----
const VS_SEA=`layout(location=0) in vec2 aP;uniform vec2 uOff;uniform float uSea;
out vec3 vW;out vec3 vN;out float vH;
float ch(vec2 xz){vec2 q=xz*.0034+vec2(uTime*.006,uTime*.0035);return fbm(q)+vn(xz*.028+uTime*.05)*.07;}
void main(){
  vec2 xz=aP*${SEAHALF}.+uOff;
  float h=ch(xz),e=8.;
  float hx=ch(xz+vec2(e,0.)),hz=ch(xz+vec2(0.,e));
  float K=78.;
  vN=normalize(vec3(-(hx-h)*K/e,1.,-(hz-h)*K/e));
  vH=h;
  vW=vec3(xz.x,uSea+(h-.45)*K,xz.y);
  gl_Position=uVP*vec4(vW,1.);
}`;
const FS_SEA=`in vec3 vW;in vec3 vN;in float vH;out vec4 o;
void main(){
  vec3 n=normalize(vN);
  float dif=max(dot(n,uLightDir),0.)*.7+.3;
  vec3 v=normalize(vW-uCam);
  float sss=pow(max(dot(v,uSunDir),0.),3.);
  float hh=smoothstep(.18,.82,vH);
  vec3 base=mix(vec3(.3,.34,.48),vec3(1.,.98,.96),hh);
  vec3 col=base*(uLightCol*dif*.72+uAmbS*1.35+uAmbG*.5);
  col+=uGlow*sss*.4*hh;
  col+=uGlow*pow(1.-max(n.y,0.),2.)*.15;
  o=vec4(fogA(col,vW),1.);
}`;

// ---- waterfalls + rivers ----
const VS_WAT=`layout(location=0) in vec3 aP;layout(location=1) in vec3 aD;out vec3 vW;out vec3 vD;
void main(){vW=aP;vD=aD;gl_Position=uVP*vec4(aP,1.);}`;
const FS_WAT=`in vec3 vW;in vec3 vD;out vec4 o;
void main(){
  float u=vD.x,v=vD.y,fall=vD.z;
  float e=smoothstep(0.,.2,u)*smoothstep(1.,.8,u);
  float sp=fall>.5?3.4:.8;
  float s1=vn(vec2(u*9.,v*.11-uTime*sp));
  float s2=vn(vec2(u*24.+3.,v*.32-uTime*sp*1.6));
  float st=s1*.6+s2*.4;
  vec3 lit=uLightCol*.55+uAmbS*1.5;
  vec3 col=mix(vec3(.18,.38,.6),vec3(.95,1.,1.),smoothstep(.38,.8,st))*lit;
  vec3 vv=normalize(vW-uCam);
  col+=uGlow*pow(max(dot(vv,uSunDir),0.),12.)*.8;
  float a=e*(.55+.45*st)*(fall>.5?.92:.9);
  o=vec4(fogO(col,vW),a);
}`;

// ---- glowing points: wisps, lanterns, fireflies, sparks, dust ----
const VS_GLO=`layout(location=0) in vec4 aP;layout(location=1) in vec4 aC;uniform float uPx,uMaxPt;out vec4 vC;
void main(){
  vec4 c=uVP*vec4(aP.xyz,1.);gl_Position=c;
  float px=aP.w*uPx/max(c.w,.05);
  gl_PointSize=clamp(px,1.,uMaxPt);
  float d=length(aP.xyz-uCam);
  float f=exp(-pow(d*uFogDen*(aC.a>1.5?.38:.9),2.));
  vC=vec4(aC.rgb*f*min(px,1.),aC.a);
}`;
const FS_GLO=`in vec4 vC;out vec4 o;
void main(){
  vec2 q=gl_PointCoord*2.-1.;float r=dot(q,q);if(r>1.)discard;
  float a;
  if(vC.a<.5||vC.a>1.5){a=(exp(-r*5.)*.7+exp(-r*30.)*.9)*(1.-r);}
  else{
    vec2 b=abs(q*vec2(1.55,1.2));
    float body=1.-smoothstep(.7,.9,max(b.x,b.y));
    float grad=mix(.4,1.15,q.y*.5+.5);
    float rib=.85+.15*cos(q.x*9.);
    a=body*grad*rib+exp(-r*3.)*.3*(1.-r);
  }
  o=vec4(vC.rgb*a,1.);
}`;

// ---- post ----
const FS_BRT=`uniform sampler2D uT;uniform float uThr;in vec2 vUV;out vec4 o;
void main(){vec2 px=1./vec2(textureSize(uT,0));
  vec3 c=(texture(uT,vUV+px*vec2(-1,-1)).rgb+texture(uT,vUV+px*vec2(1,-1)).rgb+texture(uT,vUV+px*vec2(-1,1)).rgb+texture(uT,vUV+px*vec2(1,1)).rgb)*.25;
  float l=max(max(c.r,c.g),c.b);c*=smoothstep(uThr,uThr*1.9,l);o=vec4(min(c,vec3(24.)),1.);}`;
const FS_BLR=`uniform sampler2D uT;uniform vec2 uDir;in vec2 vUV;out vec4 o;
void main(){vec2 px=uDir/vec2(textureSize(uT,0));
  vec3 c=texture(uT,vUV).rgb*.227;
  c+=(texture(uT,vUV+px*1.385).rgb+texture(uT,vUV-px*1.385).rgb)*.316;
  c+=(texture(uT,vUV+px*3.231).rgb+texture(uT,vUV-px*3.231).rgb)*.07;
  o=vec4(c,1.);}`;
const FS_CMP=`uniform sampler2D uS,uB;uniform vec2 uSun;uniform float uSunVis,uCloud,uExp,uAsp,uSpd;uniform vec3 uCloudC;
in vec2 vUV;out vec4 o;
vec3 aces(vec3 x){return clamp(x*(2.51*x+.03)/(x*(2.43*x+.59)+.14),0.,1.);}
void main(){
  vec3 c=texture(uS,vUV).rgb;
  vec3 b=texture(uB,vUV).rgb;
  c+=b*.6;
  if(uSunVis>.001){
    vec2 dl=(uSun-vUV)/24.;vec2 p=vUV+dl*h12(gl_FragCoord.xy);float w=1.;vec3 g=vec3(0.);
    for(int i=0;i<24;i++){vec2 dd=(p-uSun)*vec2(uAsp,1.);float m=exp(-dot(dd,dd)*5.);g+=texture(uB,p).rgb*w*m;w*=.925;p+=dl;}
    c+=g*uSunVis*.045;
  }
  // anime speed lines: thin radial streaks that flicker at the edges of the screen
  if(uSpd>.01){vec2 q2=(vUV-.5)*vec2(uAsp,1.);float r=length(q2),a=atan(q2.y,q2.x)*95.;
    float ln=h12(vec2(floor(a),floor(uTime*12.)))*.97,ed=abs(fract(a)-.5)*2.;
    c+=vec3(.85,.95,1.)*smoothstep(.9,1.,ln)*smoothstep(.3,.8,r)*(1.-ed)*uSpd*.32;}
  c=mix(c,uCloudC,uCloud);
  c=aces(c*uExp);
  c=pow(c,vec3(1./2.2));
  float l=dot(c,vec3(.299,.587,.114));
  c=mix(vec3(l),c,1.1);
  c=mix(c,c*vec3(1.03,1.,.96),smoothstep(.4,1.,l));
  vec2 q=vUV-.5;c*=1.-dot(q,q)*.6;
  c+=(h12(gl_FragCoord.xy+fract(uTime*7.)*91.7)-.5)*(2./255.);
  o=vec4(c,1.);
}`;

function shd(t,src){const s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))fail('Shader error:\n'+gl.getShaderInfoLog(s)+'\n\n'+src.split('\n').map((l,i)=>(i+1)+': '+l).join('\n'));return s;}
function prog(vs,fs){const p=gl.createProgram();
  gl.attachShader(p,shd(gl.VERTEX_SHADER,HDR+COMMON+vs));gl.attachShader(p,shd(gl.FRAGMENT_SHADER,HDR+COMMON+fs));
  gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))fail('Link error:\n'+gl.getProgramInfoLog(p));
  const u={};const n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);
  for(let i=0;i<n;i++){const nm=gl.getActiveUniform(p,i).name;u[nm.replace(/\[0\]$/,'')]=gl.getUniformLocation(p,nm);}
  return{p,u};}

const PS={
  sky:prog(VS_SKY,FS_SKY), isl:prog(VS_ISL,FS_ISL), ins:prog(VS_INS,FS_INS), sea:prog(VS_SEA,FS_SEA),
  wat:prog(VS_WAT,FS_WAT), glo:prog(VS_GLO,FS_GLO), chr:prog(VS_CHR,FS_CHR), brt:prog(VS_FS,FS_BRT), blr:prog(VS_FS,FS_BLR), cmp:prog(VS_FS,FS_CMP)
};
// shared ("global") uniforms, pushed to every program that uses them
const U={uVP:new Float32Array(16),uCam:[0,0,0],uTime:0,uLightDir:[0,1,0],uLightCol:[1,1,1],uAmbS:[.3,.3,.3],uAmbG:[.1,.1,.1],
  uZen:[0,0,1],uHor:[1,1,1],uSunDir:[0,1,0],uGlow:[1,1,1],uFogDen:.001,uNight:0};
function use(P){gl.useProgram(P.p);for(const k in U){const l=P.u[k];if(!l)continue;const v=U[k];
  if(typeof v==='number')gl.uniform1f(l,v);else if(v.length===16)gl.uniformMatrix4fv(l,false,v);
  else if(v.length===3)gl.uniform3fv(l,v);else if(v.length===2)gl.uniform2fv(l,v);else gl.uniform4fv(l,v);}}
