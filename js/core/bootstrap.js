'use strict';
/* =====================================================================
   0. BOOTSTRAP
   ===================================================================== */
const $=s=>document.getElementById(s);
const cv=$('c');
function fail(m){const e=$('err');e.style.display='block';e.textContent=m;throw new Error(m);}
const gl=cv.getContext('webgl2',{antialias:false,alpha:false,depth:false,stencil:false,powerPreference:'high-performance'});
if(!gl)fail('Driftlands needs WebGL2. Try a recent Chrome, Edge, Firefox or Safari.');

const Q=new URLSearchParams(location.search);
const SEED=(parseInt(Q.get('seed'))||7)>>>0;
const SHOT=Q.has('shot');
const LOWQ=Q.get('q')==='low';
const CH=1200,LOADR=2,SEA=-70,EYE=1.7,DAY=720,TAU=Math.PI*2,SEAHALF=5200;   // chunk size, chunks loaded each way, sea level, eye height, day length (s), 2pi, half-width of the cloud sea
