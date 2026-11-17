'use strict';
/* =====================================================================
   9. RENDER TARGETS + FRAME
   ===================================================================== */
const HF=!!gl.getExtension('EXT_color_buffer_float');
const CF=HF?gl.RGBA16F:gl.RGBA8;
let MS=0;try{const s=gl.getInternalformatParameter(gl.RENDERBUFFER,CF,gl.SAMPLES);if(s&&s.length)MS=Math.min(2,Math.max(...s));}catch(e){}
if(LOWQ)MS=0;
let W=0,H=0,RS=LOWQ?.7:1,FB=null;
function mkTex(w,h){const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texStorage2D(gl.TEXTURE_2D,1,CF,w,h);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t;}
function mkFB(t,d){const f=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);
  if(d)gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,d);return f;}
function resize(force){
  const dpr=Math.min(devicePixelRatio||1,1.5)*RS*CFG.q;const w=Math.max(2,Math.round(innerWidth*dpr)),h=Math.max(2,Math.round(innerHeight*dpr));
  if(!force&&w===W&&h===H)return;W=w;H=h;cv.width=w;cv.height=h;
  if(FB)for(const o of FB.list){if(o instanceof WebGLTexture)gl.deleteTexture(o);else if(o instanceof WebGLFramebuffer)gl.deleteFramebuffer(o);else if(o)gl.deleteRenderbuffer(o);}
  const L=[];const sceneT=mkTex(w,h);const drb=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,drb);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT24,w,h);
  const sceneF=mkFB(sceneT,drb);L.push(sceneT,drb,sceneF);
  let msF=null;
  if(MS>1){const cr=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,cr);gl.renderbufferStorageMultisample(gl.RENDERBUFFER,MS,CF,w,h);
    const dr=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,dr);gl.renderbufferStorageMultisample(gl.RENDERBUFFER,MS,gl.DEPTH_COMPONENT24,w,h);
    msF=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,msF);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.RENDERBUFFER,cr);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,dr);L.push(cr,dr,msF);
    if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE){msF=null;MS=0;}}
  const bw=Math.max(1,w>>2),bh=Math.max(1,h>>2);const bA=mkTex(bw,bh),bB=mkTex(bw,bh),fA=mkFB(bA),fB=mkFB(bB);L.push(bA,bB,fA,fB);
  FB={sceneT,sceneF,msF,bA,bB,fA,fB,bw,bh,list:L};
}
addEventListener('resize',()=>resize());
