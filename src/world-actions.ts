import type {House,Point,Simulation} from './sim';
import type {VehicleState,Region,Patch,Prop} from './world';
import type {LootCrate} from './loot';
import type {Construction,PickupTarget} from './survival';
import {ITEM_INFO} from './inventory';
import {RECIPES,VEHICLES} from './content';
import {VEHICLE_TANK} from './expedition-content';
export type ActionTarget=Point & {
 kind:'door'|'window'|'building'|'furniture'|'container'|'vehicle'|'tree'|'water'|'ground'|'pump'|'generator'|'garden'|'construction';
 label:string;house?:House;fixedWindow?:boolean;pickup?:PickupTarget;crate?:LootCrate;vehicle?:VehicleState;
 region?:Region;tree?:Region['trees'][number];patch?:Patch;prop?:Prop;construction?:Construction;
 garden?:{x:number;y:number;planted:number;watered:boolean};w?:number;d?:number;
};
export type WorldAction={id:string;label:string;description:string;seconds?:number;cost?:Record<string,number>;tools?:Record<string,number>;reason?:string;run:()=>void};
export const targetDistance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
export function targetExists(s:Simulation,t:ActionTarget){
 if(t.house&&!s.houses.includes(t.house))return false;
 if(t.vehicle&&!s.vehicles.includes(t.vehicle))return false;
 if(t.tree&&!t.region?.trees.includes(t.tree))return false;
 if(t.crate&&!s.crates.includes(t.crate))return false;
 if(t.construction&&!s.survival.buildings.includes(t.construction))return false;
 if(t.garden&&!s.life.gardens.includes(t.garden))return false;
 if(t.prop&&!s.world.active.some(r=>r.props.includes(t.prop!)))return false;
 if(t.kind==='generator'&&(!s.life.generator||targetDistance(s.life.generator,t)>.1))return false;
 if(t.pickup?.solidId&&t.house?.removedFurniture?.[(t.floor||0)+':'+t.pickup.solidId])return false;
 return true;
}
export function reach(s:Simulation,t:ActionTarget,at:Point=s.player){
 if((t.floor||0)!==(at.floor||0))return false;
 const range=t.kind==='vehicle'?3:t.kind==='building'?2:t.kind==='tree'?.95:t.kind==='water'?1.8:t.kind==='window'?1.6:t.kind==='door'?1.55:t.kind==='ground'?1.1:2.1;
 if(targetDistance(t,at)>range)return false;
 if(['vehicle','furniture','construction','container','generator'].includes(t.kind)&&targetDistance(t,at)>.01){
  let dx=at.x-t.x,dy=at.y-t.y;let w=t.w||1,d=t.d||1;
  if(t.vehicle){const c=Math.cos(t.vehicle.angle),sn=Math.sin(t.vehicle.angle);[dx,dy]=[dx*c+dy*sn,-dx*sn+dy*c];w=3.2;d=1.5;}
  const distance=Math.hypot(dx,dy),edge=Math.min(Math.abs(dx)>.001?w/2*distance/Math.abs(dx):Infinity,Math.abs(dy)>.001?d/2*distance/Math.abs(dy):Infinity);
  if(distance>edge+.7)return false;
 }
 if(!['door','window','building'].includes(t.kind)&&s.inside(at)!==s.inside(t))return false;
 if(['door','window','building'].includes(t.kind))return true;
 // Stop sight checks at the near face of the selected structure, not inside its wall.
 if(t.construction){
  const b=s.survival.solid(t.construction),dx=at.x-t.x,dy=at.y-t.y;
  const scale=Math.min(1/Math.max(Math.abs(dx)/(b.w/2+.16),Math.abs(dy)/(b.d/2+.16)),1);
  return s.clearSight(at,{x:t.x+dx*scale,y:t.y+dy*scale,floor:t.floor});
 }
 return s.clearSight(at,t);
}
function station(s:Simulation,b:Construction){
 if(b.kind==='door'){b.open=!b.open;s.doorSound={serial:s.doorSound.serial+1,open:b.open};s.life.noise(s.player,7,8);}
 if(b.kind==='lure'){b.activeUntil=s.elapsed+20;s.life.noise(b,30,25);s.say('Noise lure activated.');}
 if(b.kind==='barrel'&&s.life.add('Water')){b.used=s.elapsed;s.say('Collected clean water.');}
}
export function actionsFor(s:Simulation,t:ActionTarget):WorldAction[]{
 const list:WorldAction[]=[],l=s.life,h=t.house,v=t.vehicle,b=t.construction;
 if(!targetExists(s,t))return list;
 const add=(id:string,label:string,description:string,options:Partial<WorldAction>={})=>list.push({id,label,description,run:()=>l.act(id,t),...options});
 const disabled=(reason:string)=>reason||undefined;
 if(t.crate)add('open-container','Open container','Take or deposit supplies. The world keeps running.',{run:()=>{l.openTrunk=t.crate;}});
 if(t.kind==='door'&&h){
  add('toggle-door',h.door?'Close door':'Open door','Open or close this door.',{reason:h.locked?'Locked — use a pry bar.':h.barricade?'Remove the barricade first.':(h.doorHp??80)<=0?'Repair the damaged doorway first.':undefined,run:()=>s.toggleDoor(h)});
  if(h.locked)add('pry','Pry open','Force this lock. Makes noise.',{seconds:5,tools:{Crowbar:1}});
  add('barricade','Barricade door','Add planks to this doorway.',{seconds:4,tools:{Hammer:1},cost:{Plank:2,Nails:2}});
  if(h.barricade)add('unbarricade','Remove barricade','Recover one plank from this door.',{seconds:2,reason:!l.canCarry('Plank')?'Make room for a recovered plank.':undefined});
 }
 if(t.kind==='window'&&h){
  if(!t.fixedWindow){
  if((h.windowHp||0)>45)add('window','Remove barricade','Remove the planks from this window.',{seconds:3});
  else if(h.windowBroken)add('window','Climb through','Climb through this broken window.',{seconds:2});
  else add('window','Smash window','Break the glass. The noise attracts zombies.');
  add('barricade','Barricade window','Board up this window.',{seconds:4,tools:{Hammer:1},cost:{Plank:2,Nails:2}});
  }
  add(h.curtains?'remove-curtains':'curtains',h.curtains?'Remove curtains':'Hang curtains','Cover this house’s windows to reduce visibility.',h.curtains?{seconds:2,reason:!l.canCarry('Cloth',2)?'Make room for two cloth strips.':undefined}:{seconds:2,cost:{Cloth:2}});
 }
 if(h&&['door','building'].includes(t.kind)&&!(l.home?.x===h.x&&l.home?.y===h.y))add('claim','Mark as home','Mark this building as your home on the map.');
 const furniture=t.pickup?.furnishing;
 if(furniture){
  const blocked=t.pickup!.blocked;
  if(!blocked){add('pickup','Pick up','Pack this furniture into your inventory.',{seconds:(2.5+Math.min(2,furniture.w*furniture.d*.4))*.5,reason:t.crate?.items.some(i=>i.quantity>0)?'Empty the container first.':!s.survival.hasFurnitureSpace(furniture)?'Not enough backpack space or carrying capacity.':undefined,run:()=>s.survival.beginPickup(t.pickup!)});
   add('salvage','Dismantle furniture','Turn this object into planks, scrap and cloth. Materials stay here.',{seconds:5,tools:{Crowbar:1},reason:t.crate?.items.some(i=>i.quantity>0)?'Empty the container first.':undefined});}
  if(['sofa','booth'].includes(furniture.kind))add('sit',s.life.seated&&targetDistance(s.life.seated.target,t)<.2?'Stand up':'Sit down','Sit on the cushions and recover fatigue and stamina.',{run:()=>{if(s.life.seated)s.life.stand();else s.life.sit(t);}});
  if(furniture.kind==='bed')add('rest','Rest','Recover fatigue and stamina. Danger interrupts rest.',{seconds:18});
  if(furniture.kind==='counter'||furniture.kind==='sink'){
   add('drink','Drink','Drink from this sink.',{reason:!l.water?'The water supply is off.':undefined});
   add('fill','Fill water bottle','Collect drinking water.',{reason:!l.water?'The water supply is off.':!l.canCarry('Water')?'Make room for a bottle of water.':undefined});
  }
 }
 if(v){
  const tank=VEHICLE_TANK[v.kind||'wagon'];
  add('vehicle-enter',s.driving?'Exit vehicle':'Enter vehicle',VEHICLES[v.kind||'wagon'].name,{reason:s.driving&&s.vehicle!==v?'Exit your current vehicle first.':s.driving&&Math.abs(v.speed)>1?'Stop the vehicle first.':!s.driving&&!(v.fuel!>0)?'The engine needs fuel.':!s.driving&&!(v.battery!>0)?'The battery needs replacing.':undefined,run:()=>s.toggleVehicle(v)});
  add('trunk','Open trunk','Take or deposit cargo in this vehicle.');
  add('refuel','Add fuel',`${(v.fuel||0).toFixed(1)} / ${tank} litres`,{seconds:3,cost:{Petrol:Math.max(1,Math.min(l.quantity('Petrol'),Math.ceil(tank-(v.fuel||0))))},reason:(v.fuel||0)>=tank?'The tank is full.':undefined});
  add('siphon','Siphon fuel','Collect up to eight litres into your jerrycan.',{seconds:4,tools:{Jerrycan:1},reason:Math.floor(v.fuel||0)<1?'The tank is empty.':!l.canCarry('Petrol')?'Make room for petrol.':undefined});
  add('battery','Replace battery',`Battery condition: ${Math.ceil(v.battery||0)}%`,{seconds:4,cost:{Battery:1},reason:(v.battery||0)>=100?'The battery is already fully charged.':undefined});
  add('repair-car','Repair vehicle',`Condition: ${Math.ceil(v.condition??100)}%`,{seconds:4,cost:{RepairKit:1},reason:(v.condition??100)>=100?'No repairs needed.':undefined});
  add('horn','Sound horn','Draw nearby zombies toward this vehicle.',{reason:s.driving&&s.vehicle!==v?'Exit your current vehicle first.':undefined});
 }
 if(t.kind==='pump')add('pump','Fill jerrycan','Collect up to eight litres of petrol.',{seconds:4,tools:{Jerrycan:1},reason:!l.powered(t)?'This pump needs electricity.':!l.canCarry('Petrol')?'Make room for petrol.':undefined});
 if(t.kind==='tree')add('chop','Cut down tree','Collect two logs using a woodcutting axe or hand saw. Makes noise.',{seconds:l.quantity('Axe')?5.5:7,tools:l.quantity('Axe')?{Axe:1}:{Saw:1},reason:!l.canCarry('Log',2)?'Make room for two logs (8 kg).':undefined});
 if(t.kind==='water')add('fish','Fish','Cast from a safe bank.',{seconds:12,tools:{FishingRod:1},reason:(l.gathered['fish:'+Math.floor(t.x/10)+','+Math.floor(t.y/10)]||0)>s.elapsed?'Let this fishing spot recover. Try another bank.':!l.canCarry('FreshFish')?'Make room for a fish.':undefined});
 if(t.kind==='generator'){
  const g=l.generator!;
  add('genfuel','Add fuel',`Generator fuel: ${g.fuel.toFixed(1)} / 20 litres`,{cost:{Petrol:Math.max(1,Math.min(l.quantity('Petrol'),Math.floor(20-g.fuel)))},reason:g.fuel>19?'Less than one litre of tank space remains.':undefined});
  add('genpower',g.on?'Turn off':'Turn on','Power nearby appliances. A running generator makes noise.',{reason:!g.on&&g.fuel<=0?'Add fuel first.':undefined});
 }
 if(t.kind==='garden'&&t.garden){const g=t.garden,ready=g.watered&&s.elapsed-g.planted>=600;
  add('garden',ready?'Harvest vegetables':g.watered?'Growing…':'Water plants',ready?'Collect five carrots.':`Harvest in ${Math.max(0,Math.ceil((600-s.elapsed+g.planted)/60))} minutes.`,ready?{reason:!l.canCarry('Carrots',5)?'Make room for five carrots.':undefined}:g.watered?{reason:'These plants are still growing.'}:{cost:{Water:1}});
  add('compost','Add compost','Spoiled food helps this crop grow faster.',{cost:{RottenFood:1}});
 }
 if(t.kind==='ground'){
  const paved=s.world.active.flatMap(r=>r.patches).some(p=>['road','parking','path','water'].includes(p.kind)&&t.x>p.x&&t.x<p.x+p.w&&t.y>p.y&&t.y<p.y+p.h);
  if(!h&&!t.floor&&!paved){
   const searched=(l.gathered[Math.floor(t.x/12)+','+Math.floor(t.y/12)]||0)>s.elapsed;
   add('forage','Forage','Search this patch for safe berries.',{seconds:5,reason:searched?'This patch has already been searched.':!l.canCarry('Berries',2)?'Make room for berries.':undefined});
   add('plant','Plant vegetables','Sow a vegetable garden at this spot.',{seconds:4,cost:{Seeds:1},reason:l.gardens.some(g=>targetDistance(g,t)<2)?'Leave space between gardens.':s.blocked(t.x,t.y)?'Choose a clear patch of ground.':undefined});
  }
  if(!h&&!t.floor&&!l.generator&&(s.bag.Generator||0)>0)add('generator','Place generator','Install here to power appliances within 18 metres.',{seconds:5,cost:{Generator:1},reason:!l.homeHouse?'Mark a nearby house as home first.':!l.learned.includes('electrical')?'Read the generator field guide first.':targetDistance(t,{x:l.homeHouse.x+l.homeHouse.w/2,y:l.homeHouse.y+l.homeHouse.d/2})>18?'Place the generator closer to home.':s.blocked(t.x,t.y)?'Choose a clear space.':Math.abs(t.x-s.player.x)<.8&&Math.abs(t.y-s.player.y)<.55?'Choose a spot beside you.':undefined});
 }
 if(b&&!furniture){
  if(b.kind==='door')add('construction-use',b.open?'Close door':'Open door','Operate this doorway.',{run:()=>station(s,b)});
  if(b.kind==='bed')add('rest','Rest','Recover fatigue and stamina at this bedroll.',{seconds:18});
  if(b.kind==='barrel')add('construction-use','Collect water','Collect water from this barrel.',{reason:s.elapsed-b.used<(l.raining?60:240)?'The collector is still filling.':!l.canCarry('Water')?'Make room for water.':undefined,run:()=>station(s,b)});
  if(b.kind==='lure')add('construction-use','Activate noise lure','Draw zombies toward this device for 20 seconds.',{run:()=>station(s,b)});
  if(b.kind==='bench'||b.kind==='fire')add('workshop','Craft here','Open recipes for this workstation.',{run:()=>{l.openWorkshop=true;}});
  add('dismantle','Dismantle','Recover construction materials.',{seconds:3,reason:b.container?.items.some(i=>i.quantity>0)?'Empty this container first.':undefined,run:()=>l.begin('Dismantling',3,()=>s.survival.dismantle(b))});
 }
 const recipes=b?.kind==='fire'?['grilledfish','stew','preserve']:b?.kind==='bench'?['sawlogs','handsaw','crowbar','hammer','axe','wrench','fishingrod','nails','repair','batrepair']:furniture?.kind==='counter'?['grilledfish','stew']:[];
 for(const id of recipes){const r=RECIPES[id];add('craft:'+id,r.name,r.desc,{seconds:r.skill==='cooking'?6:4,cost:r.cost,tools:r.tool?{[r.tool]:1}:undefined,reason:furniture?.kind==='counter'&&!l.powered(t)?'The stove needs electricity.':s.survival.reason(id,false,true)||undefined,run:()=>s.survival.craft(id)});}
 if(t.kind==='ground'&&!h){for(const id of ['floor','wall','door','roof']){const r=RECIPES[id];if(!s.bag.Hammer)continue;add('build:'+id,'Build '+r.name.toLowerCase(),r.desc,{cost:r.cost,tools:{Hammer:1},reason:s.survival.reason(id)||undefined,run:()=>{s.survival.craft(id);s.survival.cursor={x:t.x,y:t.y};}});}}
 for(const a of list){
  const missing=Object.entries({...a.tools,...a.cost}).filter(([k,n])=>l.quantity(k)<n);
  if(!a.reason&&missing.length)a.reason='Requires '+missing.map(([k,n])=>`${ITEM_INFO[k]?.name||k} (${l.quantity(k)}/${n})`).join(', ');
  if(!a.reason&&!targetExists(s,t))a.reason='This object is no longer available.';
  if(!a.reason&&(s.player.floor||0)!==(t.floor||0))a.reason='Go to this floor first.';
  if(!a.reason&&a.id==='rest'&&s.zombies.some(z=>z.hp>0&&z.alert&&targetDistance(z,s.player)<12))a.reason='You cannot rest while being pursued.';
  if(!a.reason&&s.driving&&!['horn','vehicle-enter'].includes(a.id))a.reason='Exit the vehicle first.';
  a.reason=disabled(a.reason||'');
 }
 return list;
}
/** Object-bound action queue. Walking is interrupted by manual input or damage. */
export class ActionQueue{
 pending:{target:ActionTarget;id:string;path:Point[];hp:number;started:number;stuck:number}|undefined;
 constructor(public s:Simulation){}
 cancel(){this.pending=undefined;}
 start(t:ActionTarget,id:string){
  this.cancel();this.s.life.job=undefined;this.s.survival.pickupJob=undefined;
  if(this.s.life.seated&&(id!=='sit'||targetDistance(this.s.life.seated.target,t)>.2)&&!this.s.life.stand())return;
  const action=actionsFor(this.s,t).find(a=>a.id===id);if(!action||action.reason){if(action?.reason)this.s.say(action.reason);return;}
  if(reach(this.s,t)||this.s.driving){this.perform(t,id);return;}
  const path=this.pathTo(t);if(!path){this.s.say('Cannot reach that object. Open a path or move closer.');return;}
  this.pending={target:t,id,path,hp:this.s.player.hp,started:this.s.elapsed,stuck:0};this.s.say('Walking to '+t.label+' · Move or press Esc to cancel.');
 }
 perform(t:ActionTarget,id:string){
  const action=actionsFor(this.s,t).find(a=>a.id===id);if(!action||action.reason||!targetExists(this.s,t)){this.s.say(action?.reason||'The object is no longer available.');return;}
  if(!reach(this.s,t)&&!this.s.driving){this.s.say('Move closer to '+t.label+'.');return;}
  this.s.player.angle=Math.atan2(t.y-this.s.player.y,t.x-this.s.player.x);action.run();
  const job=this.s.life.job,originalValid=job?.valid;
  if(job)job.valid=()=>{
   if(originalValid&&!originalValid())return false;
   if(!targetExists(this.s,t)||!reach(this.s,t))return false;
   if(!this.s.life.available({...action.tools,...action.cost}))return false;
   const current=actionsFor(this.s,t).find(a=>a.id===id);
   return !!current&&!current.reason;
  };
 }
 movement(dt:number,input:Point,modal:boolean){
  const q=this.pending,s=this.s;if(!q)return input;
  if(input.x||input.y||modal||s.dead||s.driving||s.player.hp<q.hp||s.attackTime>0||s.shoveTime>0||s.elapsed-q.started>35||!targetExists(s,q.target)){this.cancel();return input;}
  if(reach(s,q.target)){this.cancel();this.perform(q.target,q.id);return {x:0,y:0};}
  while(q.path.length&&targetDistance(s.player,q.path[0])<.18)q.path.shift();
  if(!q.path.length){this.cancel();s.say('The path is blocked. Move closer and try again.');return {x:0,y:0};}
  const next=q.path[0],dx=next.x-s.player.x,dy=next.y-s.player.y,n=Math.hypot(dx,dy);
  if(!s.player.moving)q.stuck+=dt;else q.stuck=0;
  if(q.stuck>1.2){this.cancel();s.say('The path is blocked.');return {x:0,y:0};}
  return {x:dx/n,y:dy/n};
 }
 pathTo(t:ActionTarget):Point[]|undefined{
  const s=this.s,step=.45,start=s.player;
  type Node=Point & {g:number;f:number;parent?:Node};
  const open:Node[]=[{x:start.x,y:start.y,floor:start.floor,g:0,f:targetDistance(start,t)}],seen=new Map<string,number>();
  for(let count=0;open.length&&count<1800;count++){
   open.sort((a,b)=>a.f-b.f);const n=open.shift()!,key=Math.round((n.x-start.x)/step)+','+Math.round((n.y-start.y)/step);
   if((seen.get(key)??Infinity)<=n.g)continue;seen.set(key,n.g);
   if(reach(s,t,n)){const path:Point[]=[];for(let at:Node|undefined=n;at?.parent;at=at.parent)path.unshift({x:at.x,y:at.y});return path;}
   for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
    const x=n.x+dx*step,y=n.y+dy*step;if(targetDistance(start,{x,y})>42)continue;
    if([.33,.66,1].some(k=>s.blocked(n.x+dx*step*k,n.y+dy*step*k,start.floor,s.inside(n)))||dx&&dy&&(s.blocked(x,n.y,start.floor,s.inside(n))||s.blocked(n.x,y,start.floor,s.inside(n))))continue;
    const g=n.g+step*Math.hypot(dx,dy);open.push({x,y,floor:start.floor,g,f:g+Math.hypot(t.x-x,t.y-y),parent:n});
   }
  }
  return undefined;
 }
}
