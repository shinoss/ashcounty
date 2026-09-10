import type {Simulation,Point,Zombie} from './sim';
import {SURVIVAL_BALANCE as balance} from './survival-balance';
const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
/** A bounded local search; each zombie keeps its route between decisions. */
function route(s:Simulation,z:Zombie,goal:Point):Point[]{
 const step=.6,home=s.inside(z),floor=z.floor||0;
 type Node={x:number;y:number;g:number;f:number;parent?:Node};
 const open:Node[]=[{x:z.x,y:z.y,g:0,f:distance(z,goal)}],seen=new Set<string>();let best=open[0];
 for(let budget=0;open.length&&budget<220;budget++){
  open.sort((a,b)=>a.f-b.f);const n=open.shift()!;const key=Math.round((n.x-z.x)/step)+','+Math.round((n.y-z.y)/step);if(seen.has(key))continue;seen.add(key);
  if(distance(n,goal)<distance(best,goal))best=n;if(distance(n,goal)<.7){best=n;break;}
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
   const x=n.x+dx*step,y=n.y+dy*step;
   if(s.blocked(x,y,floor,home)||s.blocked(n.x+dx*step*.5,n.y+dy*step*.5,floor,home))continue;
   const g=n.g+Math.hypot(dx,dy)*step;open.push({x,y,g,f:g+Math.hypot(x-goal.x,y-goal.y)*1.08,parent:n});
  }
 }
 const path:Point[]=[];for(let n:Node|undefined=best;n?.parent;n=n.parent)path.unshift({x:n.x,y:n.y,floor});return path;
}
export function perceive(s:Simulation,z:Zombie){
 const p=s.player,home=s.inside(p),sameFloor=(z.floor||0)===p.floor;
 const sight=(p.sneaking?balance.sneakingSightRadius:balance.sightRadius)*(s.life.night?.65:1)*(home?.curtains?.6:1);
 const seen=sameFloor&&distance(z,p)<sight&&s.clearSight(z,p);
 if(seen){z.target={x:p.x,y:p.y,floor:p.floor};z.memoryUntil=s.elapsed+balance.sightMemorySeconds;}
 else for(const event of s.life.noises){
  if(event.id<=(z.heard||0))continue;
  const sourceHome=s.inside(event),loud=event.radius>=balance.indoorLoudNoiseThreshold;
  if(sourceHome&&!loud)continue;
  // Loud indoor sounds can reach street-level listeners from upper floors.
  // Investigate on the listener's floor instead of targeting an unreachable height.
  if(event.floor!==(z.floor||0)&&!(sourceHome&&loud))continue;
  const leak=sourceHome&&sourceHome!==s.inside(z)?balance.indoorSoundLeakScale:1;
  const radius=event.radius*balance.hearingRadiusScale*leak*(s.clearSight(z,event)?1:.65);
  if(Math.hypot(distance(z,event),(event.floor-(z.floor||0))*3)<radius){z.heard=event.id;z.target={x:event.x,y:event.y,floor:z.floor||0};z.memoryUntil=s.elapsed+event.duration*balance.noiseMemoryScale;z.pathAt=0;}
 }
 z.alert=!!z.target&&(z.memoryUntil||0)>s.elapsed;
 if(!z.alert){z.target=undefined;z.path=undefined;}
 return !sameFloor;
}
export function pursue(s:Simulation,z:Zombie,dt:number){
 let goal=z.target;if(!goal)return;const targetHome=s.inside(goal),currentHome=s.inside(z);
 // Approach an entrance before pathfinding into a closed building. A rear window
 // is an alternate breach point, with a higher cost than the existing doorway.
 const barrier=targetHome!==currentHome?(targetHome||currentHome):undefined;
 if(barrier){
  const h=barrier,front=s.doorPoint(h),rear={x:h.x+h.w/2,y:h.y},exit=currentHome===h;
  const window=!h.layout&&distance(z,rear)+3<distance(z,front),entry=window?rear:front;
  const open=window?h.windowBroken&&!(h.windowHp!>0):h.door;
  const side=exit?-1:1;
  goal={x:entry.x,y:entry.y+(window?-side:side)*.62,floor:z.floor};
  if(distance(z,goal)<.85){
   if(!open){
    const hit=s.life.entranceHit(entry,dt,window?4:balance.doorDamagePerSecond,window?8:balance.doorCrowdDamagePerSecond);
    if(window){h.windowHp=(h.windowHp??45)-hit;if(h.windowHp<=0){h.windowBroken=true;s.life.noise(entry,22,14);if(distance(s.player,entry)<18)s.say('Glass breaks nearby.');}}
    else if((h.barricade||0)>0)h.barricade=Math.max(0,h.barricade!-hit);
    else{h.doorHp=(h.doorHp??80)-hit;if(h.doorHp<=0){h.door=true;h.locked=false;s.doorSound={serial:s.doorSound.serial+1,open:true};s.life.noise(entry,18,12);if(distance(s.player,entry)<18)s.say('A door gives way.');}}
    z.memoryUntil=Math.max(z.memoryUntil||0,s.elapsed+3);return;
   }
   goal={x:entry.x,y:entry.y+(window?side:-side)*1.05,floor:z.floor};
  }
 }
 const d=distance(z,goal);if(d<.28){if(!barrier)z.memoryUntil=Math.min(z.memoryUntil||0,s.elapsed+4);return;}
 const oldX=z.x,oldY=z.y;
 const straight=[.35,.7,1].every(t=>!s.blocked(z.x+(goal!.x-z.x)/d*Math.min(d,1)*t,z.y+(goal!.y-z.y)/d*Math.min(d,1)*t,z.floor||0,s.inside(z)));
 if(straight){s.move(z,(goal.x-z.x)/d*.902*dt,(goal.y-z.y)/d*.902*dt);z.path=undefined;}
 else{
  if((z.pathAt||0)<s.elapsed&&s.life.pathBudget>0){s.life.pathBudget--;z.path=route(s,z,goal);z.pathAt=s.elapsed+1.5+z.phase*.12;}
  while(z.path?.length&&distance(z,z.path[0])<.2)z.path.shift();
  const at=z.path?.[0];if(at){const n=distance(z,at)||1;s.move(z,(at.x-z.x)/n*.902*dt,(at.y-z.y)/n*.902*dt);}
 }
 if(distance({x:oldX,y:oldY},z)<.00001&&z.path?.length)z.pathAt=Math.min(z.pathAt||0,s.elapsed+.3);
}
