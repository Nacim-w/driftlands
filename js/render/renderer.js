'use strict';
function tex(unit,t,loc){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);gl.uniform1i(loc,unit);}
function render(eye,tX,tY,asp){
  gl.bindFramebuffer(gl.FRAMEBUFFER,FB.msF||FB.sceneF);gl.viewport(0,0,W,H);
  gl.clearColor(0,0,0,1);gl.depthMask(true);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.disable(gl.CULL_FACE);gl.disable(gl.BLEND);
  // opaque world
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.depthMask(true);
  use(PS.isl);
  for(const I of activeIsl){const dx=I.x-eye[0],dy=I.y-eye[1],dz=I.z-eye[2];const r=I.maxR+I.depth;
    const along=dx*camF[0]+dy*camF[1]+dz*camF[2];if(along<-r)continue;if(dx*dx+dz*dz>(LOADR*CH+700)**2)continue;
    gl.bindVertexArray(I.gl.vao);gl.drawElements(gl.TRIANGLES,I.gl.n,gl.UNSIGNED_SHORT,0);}
  const N=PS.ins;use(N);gl.uniform1f(N.u.uFlap,0);
  for(const k of KINDS){const M=MESH[k];if(!M.n)continue;gl.bindVertexArray(M.vao);gl.drawArraysInstanced(gl.TRIANGLES,0,M.count,M.n);}
  if(DAYF>.05){gl.uniform1f(N.u.uFlap,1);const M=MESH.bird;gl.bindBuffer(gl.ARRAY_BUFFER,M.ib);gl.bufferData(gl.ARRAY_BUFFER,BIRDBUF,gl.DYNAMIC_DRAW);
    gl.bindVertexArray(M.vao);gl.drawArraysInstanced(gl.TRIANGLES,0,M.count,Math.round(BIRDS.length*clamp(DAYF*1.3,0,1)));}
  {gl.uniform1f(N.u.uFlap,2);const M=MESH.whale;gl.bindBuffer(gl.ARRAY_BUFFER,M.ib);gl.bufferData(gl.ARRAY_BUFFER,WHBUF,gl.DYNAMIC_DRAW);
    gl.bindVertexArray(M.vao);gl.drawArraysInstanced(gl.TRIANGLES,0,M.count,WHALES.length);}
  drawFauna(N);
  if(CHN){const S=PS.chr;use(S);gl.uniform3fv(S.u.uOrb,ORBU);gl.uniform3fv(S.u.uOrbC,ORBC);
    gl.bindBuffer(gl.ARRAY_BUFFER,CHRG.vb);gl.bufferSubData(gl.ARRAY_BUFFER,0,CB,0,CHN*7);gl.bindVertexArray(CHRG.vao);gl.drawArrays(gl.TRIANGLES,0,CHN);}
  const SE=PS.sea;use(SE);gl.uniform2f(SE.u.uOff,Math.round(eye[0]/SEASTEP)*SEASTEP,Math.round(eye[2]/SEASTEP)*SEASTEP);gl.uniform1f(SE.u.uSea,SEA);
  gl.bindVertexArray(SEAVAO);gl.drawElements(gl.TRIANGLES,SEAIDX,gl.UNSIGNED_SHORT,0);
  // sky: only shades pixels nothing else covered
  gl.depthMask(false);
  {const S=PS.sky;use(S);gl.uniform3fv(S.u.uR,camR);gl.uniform3fv(S.u.uU,camU);gl.uniform3fv(S.u.uF,camF);gl.uniform2f(S.u.uTan,tX,tY);gl.uniform1f(S.u.uStars,NIGHT);
  gl.bindVertexArray(FSQ);gl.drawArrays(gl.TRIANGLES,0,3);}
  // transparent
  gl.enable(gl.BLEND);
  if(WATER.n){gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);use(PS.wat);gl.bindVertexArray(WATER.vao);gl.drawArrays(gl.TRIANGLES,0,WATER.n);}
  if(gn){gl.blendFunc(gl.ONE,gl.ONE);const G=PS.glo;use(G);gl.uniform1f(G.u.uPx,H/(2*tY));gl.uniform1f(G.u.uMaxPt,MAXPT);
    gl.bindBuffer(gl.ARRAY_BUFFER,GLOW.vb);gl.bufferSubData(gl.ARRAY_BUFFER,0,GP,0,gn*8);gl.bindVertexArray(GLOW.vao);gl.drawArrays(gl.POINTS,0,gn);}
  gl.disable(gl.BLEND);gl.depthMask(true);gl.disable(gl.DEPTH_TEST);
  // resolve MSAA
  if(FB.msF){gl.bindFramebuffer(gl.READ_FRAMEBUFFER,FB.msF);gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,FB.sceneF);gl.blitFramebuffer(0,0,W,H,0,0,W,H,gl.COLOR_BUFFER_BIT,gl.NEAREST);}
  // bloom
  gl.bindVertexArray(FSQ);
  gl.bindFramebuffer(gl.FRAMEBUFFER,FB.fA);gl.viewport(0,0,FB.bw,FB.bh);
  use(PS.brt);tex(0,FB.sceneT,PS.brt.u.uT);gl.uniform1f(PS.brt.u.uThr,HF?.9:.7);gl.drawArrays(gl.TRIANGLES,0,3);
  use(PS.blr);
  for(let i=0;i<3;i++){const s=1+i;
    gl.bindFramebuffer(gl.FRAMEBUFFER,FB.fB);tex(0,FB.bA,PS.blr.u.uT);gl.uniform2f(PS.blr.u.uDir,s,0);gl.drawArrays(gl.TRIANGLES,0,3);
    gl.bindFramebuffer(gl.FRAMEBUFFER,FB.fA);tex(0,FB.bB,PS.blr.u.uT);gl.uniform2f(PS.blr.u.uDir,0,s);gl.drawArrays(gl.TRIANGLES,0,3);}
  // composite
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,W,H);
  const C=PS.cmp;use(C);tex(0,FB.sceneT,C.u.uS);tex(1,FB.bA,C.u.uB);
  gl.uniform2f(C.u.uSun,SUNUV[0],SUNUV[1]);gl.uniform1f(C.u.uSunVis,SUNV);gl.uniform1f(C.u.uAsp,asp);
  gl.uniform1f(C.u.uCloud,sstep(SEA+22,SEA-14,eye[1])*.92);
  gl.uniform3fv(C.u.uCloudC,[U.uHor[0]*.6+U.uAmbS[0]*.9,U.uHor[1]*.6+U.uAmbS[1]*.9,U.uHor[2]*.6+U.uAmbS[2]*.9]);
  gl.uniform1f(C.u.uExp,lerp(.92,1.45,NIGHT));gl.uniform1f(C.u.uSpd,SPDFX);
  gl.drawArrays(gl.TRIANGLES,0,3);
}
