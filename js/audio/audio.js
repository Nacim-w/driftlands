'use strict';
/* =====================================================================
   5. AUDIO — wind, a slow pad, bell chimes, birdsong, crickets
   ===================================================================== */
const AU={c:null,muted:false,ci:0,next:0,
  init(){
    if(this.c)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    const c=this.c=new AC();const t=c.currentTime;
    const m=this.m=c.createGain();m.gain.value=0;m.gain.setTargetAtTime(CFG.vol,t,1.5);
    const comp=c.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=3;m.connect(comp);comp.connect(c.destination);
    const rv=this.rv=c.createConvolver();rv.buffer=this.imp(4.5);const rg=c.createGain();rg.gain.value=.6;rv.connect(rg);rg.connect(m);
    this.fx=c.createGain();this.fx.connect(m);this.fx.connect(rv);
    // wind: shaped noise
    const nb=this.nb=c.createBuffer(1,c.sampleRate*4,c.sampleRate);const d=nb.getChannelData(0);let b=0;
    for(let i=0;i<d.length;i++){const w=Math.random()*2-1;b=(b+.02*w)/1.02;d[i]=w*.35+b*3.2;}
    const ns=c.createBufferSource();ns.buffer=nb;ns.loop=true;
    // rushing air: a soft lowpassed rush that opens up with speed (no whistle)
    this.wf=c.createBiquadFilter();this.wf.type='lowpass';this.wf.frequency.value=300;this.wf.Q.value=.4;
    this.wg=c.createGain();this.wg.gain.value=0;ns.connect(this.wf);this.wf.connect(this.wg);this.wg.connect(m);
    // aura: a low, warm energy drone with a slow tremolo and a faint crackle on top
    this.au=c.createGain();this.au.gain.value=0;this.au.connect(m);const aus=c.createGain();aus.gain.value=.35;this.au.connect(aus);aus.connect(rv);
    this.af=c.createBiquadFilter();this.af.type='lowpass';this.af.frequency.value=300;this.af.Q.value=3;
    const trem=c.createGain();trem.gain.value=.8;const tlo=c.createOscillator();tlo.frequency.value=6.5;const tlg=c.createGain();tlg.gain.value=.2;
    tlo.connect(tlg);tlg.connect(trem.gain);tlo.start();this.af.connect(trem);trem.connect(this.au);
    this.ao=[];for(const [f,ty,g] of [[55,'sawtooth',.4],[55.7,'sawtooth',.4],[110.4,'triangle',.25],[164.8,'sine',.12]]){
      const o=c.createOscillator();o.type=ty;o.frequency.value=f;const og=c.createGain();og.gain.value=g;o.connect(og);og.connect(this.af);o.start();this.ao.push([o,f]);}
    const ks=c.createBufferSource();ks.buffer=nb;ks.loop=true;const kf=c.createBiquadFilter();kf.type='bandpass';kf.frequency.value=3200;kf.Q.value=.9;
    this.ak=c.createGain();this.ak.gain.value=0;ks.connect(kf);kf.connect(this.ak);this.ak.connect(this.au);ks.start(0,1.3);
    const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=170;const lg=c.createGain();lg.gain.value=.22;ns.connect(lp);lp.connect(lg);lg.connect(m);
    ns.start();
    // pad bus
    this.pad=c.createGain();this.pad.gain.value=.9;this.pf=c.createBiquadFilter();this.pf.type='lowpass';this.pf.frequency.value=900;this.pf.Q.value=.4;
    this.pad.connect(this.pf);this.pf.connect(m);const ps=c.createGain();ps.gain.value=.9;this.pf.connect(ps);ps.connect(rv);
    // crickets: ring-modulated tone, gated
    const co=c.createOscillator();co.frequency.value=4350;
    const g1=c.createGain();g1.gain.value=0;const l1=c.createOscillator();l1.type='square';l1.frequency.value=31;const l1g=c.createGain();l1g.gain.value=.5;l1.connect(l1g);l1g.connect(g1.gain);
    const g2=c.createGain();g2.gain.value=.5;const l2=c.createOscillator();l2.type='square';l2.frequency.value=2.3;const l2g=c.createGain();l2g.gain.value=.5;l2.connect(l2g);l2g.connect(g2.gain);
    this.cg=c.createGain();this.cg.gain.value=0;co.connect(g1);g1.connect(g2);g2.connect(this.cg);this.cg.connect(m);
    co.start();l1.start();l2.start();
    this.next=t+.5;
  },
  imp(sec){const c=this.c,len=Math.floor(c.sampleRate*sec),b=c.createBuffer(2,len,c.sampleRate);
    for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6);}return b;},
  chord(){
    const c=this.c,t=c.currentTime;
    const PROG=[[0,7,11,14,19],[-3,4,7,12,16],[-7,0,4,11,14],[-5,2,7,9,14],[-3,0,7,12,14],[-7,-3,4,9,16]];
    const notes=PROG[this.ci++%PROG.length];
    for(const sv of notes){const f=146.83*Math.pow(2,sv/12);
      for(const [type,mul,g] of [['sine',1,.045],['triangle',2,.01],['sine',.5,.02]]){
        const o=c.createOscillator();o.type=type;o.frequency.value=f*mul;o.detune.value=(Math.random()-.5)*14;
        const e=c.createGain();e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(g,t+4.5);e.gain.setValueAtTime(g,t+9);e.gain.linearRampToValueAtTime(0,t+15);
        o.connect(e);e.connect(this.pad);o.start(t);o.stop(t+15.2);}}
    // an occasional high melodic bell over the pad
    if(Math.random()<.7){const sv=notes[Math.floor(Math.random()*notes.length)]+24;this.bell(146.83*Math.pow(2,sv/12),.035,t+2+Math.random()*4);}
    this.next=t+10;
  },
  bell(f,g,t,dest){const c=this.c;t=t||c.currentTime;
    for(const [m,gg,d] of [[1,g,2.6],[2.76,g*.25,1.3],[5.4,g*.1,.7],[.5,g*.3,3]]){
      const o=c.createOscillator();o.type='sine';o.frequency.value=f*m;
      const e=c.createGain();e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(gg,t+.006);e.gain.exponentialRampToValueAtTime(.0001,t+d);
      o.connect(e);e.connect(dest||this.fx);o.start(t);o.stop(t+d+.05);}},
  chime(i){if(!this.c)return;const sc=[0,2,4,7,9];const sv=sc[i%5]+12*Math.min(Math.floor(i/5),2);this.bell(587.33*Math.pow(2,sv/12),.13);},
  whoosh(){if(!this.c)return;const c=this.c,t=c.currentTime;const s=c.createBufferSource();s.buffer=this.nb;
    const f=c.createBiquadFilter();f.type='bandpass';f.Q.value=2;f.frequency.setValueAtTime(250,t);f.frequency.exponentialRampToValueAtTime(1800,t+1.1);
    const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.25,t+.25);g.gain.exponentialRampToValueAtTime(.001,t+1.4);
    s.connect(f);f.connect(g);g.connect(this.fx);s.start(t,Math.random()*2);s.stop(t+1.5);
    this.bell(220,.06,t+.15);this.bell(330,.04,t+.35);},
  // the aura igniting: a deep soft thump under an upward rush of air
  boom(){if(!this.c)return;const c=this.c,t=c.currentTime;
    const o=c.createOscillator();o.type='sine';o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(36,t+.55);
    const og=c.createGain();og.gain.setValueAtTime(0,t);og.gain.linearRampToValueAtTime(.2,t+.02);og.gain.exponentialRampToValueAtTime(.001,t+.75);
    o.connect(og);og.connect(this.m);o.start(t);o.stop(t+.8);
    const s=c.createBufferSource();s.buffer=this.nb;const f=c.createBiquadFilter();f.type='bandpass';f.Q.value=1.4;
    f.frequency.setValueAtTime(260,t);f.frequency.exponentialRampToValueAtTime(2200,t+.4);
    const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.13,t+.08);g.gain.exponentialRampToValueAtTime(.001,t+.95);
    s.connect(f);f.connect(g);g.connect(this.fx);s.start(t,Math.random()*2);s.stop(t+1);},
  // the soft thump of the orbs pushing off the ground
  puff(){if(!this.c)return;const c=this.c,t=c.currentTime;const s=c.createBufferSource();s.buffer=this.nb;
    const f=c.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(1500,t);f.frequency.exponentialRampToValueAtTime(200,t+.55);
    const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.32,t+.03);g.gain.exponentialRampToValueAtTime(.001,t+.65);
    s.connect(f);f.connect(g);g.connect(this.fx);s.start(t,Math.random()*2);s.stop(t+.7);this.bell(440,.03,t+.05);this.bell(660,.02,t+.12);},
  song(g){const c=this.c;if(!c)return;const t=c.currentTime;const f0=70+Math.random()*55;
    const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=650;const e=c.createGain();
    e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(g,t+1.2);e.gain.setValueAtTime(g,t+3.2);e.gain.linearRampToValueAtTime(0,t+5.5);
    lp.connect(e);e.connect(this.rv);const dry=c.createGain();dry.gain.value=.3;e.connect(dry);dry.connect(this.m);
    for(const [type,mul,gg] of [['sine',1,1],['triangle',2,.25],['sine',3.01,.08]]){const o=c.createOscillator();o.type=type;const og=c.createGain();og.gain.value=gg;
      const f=o.frequency;f.setValueAtTime(f0*mul,t);f.linearRampToValueAtTime(f0*1.65*mul,t+1.4);f.linearRampToValueAtTime(f0*.85*mul,t+3);f.linearRampToValueAtTime(f0*1.3*mul,t+4.4);f.linearRampToValueAtTime(f0*1.1*mul,t+5.5);
      o.connect(og);og.connect(lp);o.start(t);o.stop(t+5.6);}},
  chirp(){const c=this.c,t0=c.currentTime;const n=2+Math.floor(Math.random()*4);const base=2300+Math.random()*1700;
    for(let i=0;i<n;i++){const t=t0+i*(.09+Math.random()*.07);const o=c.createOscillator();o.frequency.setValueAtTime(base*(1+Math.random()*.1),t);
      o.frequency.exponentialRampToValueAtTime(base*1.55,t+.06);const e=c.createGain();e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(.016,t+.01);
      e.gain.exponentialRampToValueAtTime(.0001,t+.085);o.connect(e);e.connect(this.fx);o.start(t);o.stop(t+.1);}},
  update(dt,speed,night,day,aura){
    const c=this.c;if(!c)return;const t=c.currentTime;const s=clamp(speed/90,0,1),a=aura||0;
    this.wg.gain.setTargetAtTime(.035+s*s*.17,t,.3);this.wf.frequency.setTargetAtTime(260+s*1900,t,.3);
    this.au.gain.setTargetAtTime(a*.085,t,.35);this.af.frequency.setTargetAtTime(240+a*380+s*480,t,.3);
    for(const [o,f] of this.ao)o.frequency.setTargetAtTime(f*(1+s*.22),t,.4);
    this.ak.gain.setTargetAtTime(a*(.15+Math.random()*.5)*.35,t,.03);
    this.cg.gain.setTargetAtTime(night*.011,t,1.5);this.pf.frequency.setTargetAtTime(420+day*1000,t,2);
    if(t>this.next)this.chord();
    if(day>.5&&Math.random()<dt*.12)this.chirp();
  },
  toggle(){if(!this.c)return;this.muted=!this.muted;this.m.gain.setTargetAtTime(this.muted?0:CFG.vol,this.c.currentTime,.2);msg(this.muted?'Sound off':'Sound on',1.5);}
};
