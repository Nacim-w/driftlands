'use strict';
/* =====================================================================
   10. GO
   ===================================================================== */
resize(true);
lastCX=1e9;P.pos=[0,30,0];updateChunks(true);spawn();
if(Q.has('pos')){const v=Q.get('pos').split(',').map(Number);if(v.length===3&&v.every(isFinite))P.pos=v;}
if(Q.has('yaw'))P.yaw=parseFloat(Q.get('yaw'))||0;if(Q.has('pitch'))P.pitch=parseFloat(Q.get('pitch'))||0;
updateChunks(true);
// ?lanterns=N fills the sky with N lanterns (a nice way to open a night scene)
for(let i=0,n=Math.min(400,parseInt(Q.get('lanterns'))||0);i<n;i++){const a=Math.random()*TAU,d=10+Math.random()*260;
  LANT.push({p:[P.pos[0]+Math.cos(a)*d,P.pos[1]-20+Math.random()*120,P.pos[2]+Math.sin(a)*d],v:[0,2,0],t:5+Math.random()*60,ph:Math.random()*9});}
hudDirty=true;
if(SHOT){$('intro').classList.add('gone');started=false;}
requestAnimationFrame(t=>{last=t;frame(t);});
