'use strict';
function spawn(){
  const home=chunks.get('0,0').islands[0];
  // start hovering off the island's shoulder, looking back at it and its waterfall
  const a=(home.fallA||0)+.62,ca=Math.cos(a),sa=Math.sin(a);
  const x=home.x+ca*home.R*2.1,z=home.z+sa*home.R*2.1;
  P.pos=[x,home.y+16,z];
  const tx=home.x-x,tz=home.z-z;P.yaw=Math.atan2(tx,-tz)-.22;P.pitch=-.12;P.lastYaw=P.yaw;
}
