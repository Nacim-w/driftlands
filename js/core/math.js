'use strict';
/* =====================================================================
   1. MATH + NOISE
   ===================================================================== */
const clamp=(x,a,b)=>x<a?a:x>b?b:x;
const lerp=(a,b,t)=>a+(b-a)*t;
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const norm=a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/l,a[1]/l,a[2]/l];};
const mix3=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)];
const mul3=(a,s)=>[a[0]*s,a[1]*s,a[2]*s];

function persp(fy,as,n,f){const t=1/Math.tan(fy/2),nf=1/(n-f);return[t/as,0,0,0,0,t,0,0,0,0,(f+n)*nf,-1,0,0,2*f*n*nf,0];}
function viewM(e,f,r,u){return[r[0],u[0],-f[0],0,r[1],u[1],-f[1],0,r[2],u[2],-f[2],0,-dot(r,e),-dot(u,e),dot(f,e),1];}
function mmul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+r]*b[c*4+k];o[c*4+r]=s;}return o;}

// integer hash -> [0,1)
function h2(x,y,s){let h=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(s|0,982451653))|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return(h>>>0)/4294967296;}
function vn(x,y,s){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  const a=h2(xi,yi,s),b=h2(xi+1,yi,s),c=h2(xi,yi+1,s),d=h2(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function fbm(x,y,s,o){let v=0,a=.5;for(let i=0;i<o;i++){v+=a*vn(x,y,s+i*31);x=x*2.03+1.7;y=y*2.03+9.2;a*=.5;}return v;}
function rngOf(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hseed(...n){let h=(2166136261^Math.imul(SEED,2654435761))>>>0;for(const v of n){h=Math.imul(h^(v|0),16777619);h^=h>>>15;}return h>>>0;}
function pickW(arr,r,key){let s=0;for(const a of arr)s+=key(a);let x=r()*s;for(const a of arr){x-=key(a);if(x<=0)return a;}return arr[arr.length-1];}
