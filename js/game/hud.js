'use strict';
const wcEl=$('wc'),lcEl=$('lc'),clockEl=$('clock'),banEl=$('banner'),msgEl=$('msg');
function msg(t,d=4){msgEl.textContent=t;msgEl.classList.add('on');msgT=d;}
function banner(I){banEl.innerHTML='<h2>'+I.name+'</h2><p>'+I.bio.name+(I.home?' · where you woke':'')+'</p>';banEl.classList.add('on');banT=4.5;}
$('seedl').textContent='world '+SEED;
// compass strip: cardinal letters, shrines (diamonds), nearest wisps (dots), home (⌂)
const compEl=$('comp'),CPOOL=[];
function cmark(i,cls,txt){let e=CPOOL[i];if(!e){e=document.createElement('span');compEl.appendChild(e);CPOOL[i]=e;}
  if(e.className!==cls)e.className=cls;if(e.textContent!==txt)e.textContent=txt;return e;}
function updateCompass(){
  let n=0;const yaw=P.yaw,SPAN=1.75;
  const put=(head,cls,txt,op)=>{let r=head-yaw;r=Math.atan2(Math.sin(r),Math.cos(r));if(Math.abs(r)>SPAN)return;
    const e=cmark(n++,cls,txt);e.style.left=(50+r/SPAN*50).toFixed(2)+'%';e.style.display='';e.style.opacity=op===undefined?'':op;};
  const C=['N','NE','E','SE','S','SW','W','NW'];for(let i=0;i<8;i++)put(i/8*TAU,'cl',i%2?'·':C[i]);
  const cam=P.pos;
  for(const I of activeIsl){if(!I.shrine)continue;const dx=I.shrine[0]-cam[0],dz=I.shrine[2]-cam[2],d=Math.hypot(dx,dz);if(d>6000)continue;
    put(Math.atan2(dx,-dz),I.awake?'cs lit':'cs','',Math.max(.25,1-d/7000).toFixed(2));}
  const ws=[];for(const c of active)for(const w of c.wisps){if(w.got)continue;const dx=w.x-cam[0],dz=w.z-cam[2],d=dx*dx+dz*dz;if(d<3e6)ws.push([d,dx,dz]);}
  ws.sort((a,b)=>a[0]-b[0]);for(let i=0;i<Math.min(4,ws.length);i++)put(Math.atan2(ws[i][1],-ws[i][2]),'cw','');
  const hd=Math.hypot(cam[0],cam[2]);if(hd>150)put(Math.atan2(-cam[0],cam[2]),'ch','⌂');
  for(let i=n;i<CPOOL.length;i++)CPOOL[i].style.display='none';
}
let compT=0;
