import {SURVIVAL_BALANCE as balance} from './survival-balance';
import {ITEM_INFO} from './inventory';
import {RECIPES,SKILLS,type Skill,type BuildKind} from './content';
import type {Simulation,House} from './sim';
import {pointIn,carContains,furniture,type Solid} from './collision';
export type Furnishing={institution?:boolean;container?:import('./loot').LootCrate;kind:string;w:number;d:number;height:number;design:number};
export type Construction={id:number;x:number;y:number;floor:number;kind:BuildKind;hp:number;created:number;used:number;activeUntil:number;rotation?:number;open?:boolean;container?:import('./loot').LootCrate;furnishing?:Furnishing};
export type PickupTarget={x:number;y:number;floor:number;label:string;furnishing?:Furnishing;home?:House;solidId?:string;constructionId?:number;blocked?:string};
export class Survival{
 xp=Object.fromEntries(Object.keys(SKILLS).map(k=>[k,0])) as Record<Skill,number>;buildings:Construction[]=[];serial=0;restUntil=0;
 packed=new Map<string,Furnishing>();packedSerial=0;placingItem='';notice='';pickupJob:{target:PickupTarget;elapsed:number;duration:number;x:number;y:number;hp:number}|undefined;
 buildingDraft:Construction|undefined;
 holdingPaused=false;selected='';rotation=0;cursor:{x:number;y:number}|undefined;pickupMode=false;carried:Furnishing|undefined;closeWorkshop=false;
 constructor(public s:Simulation){}
 get placing(){return !!this.selected||!!this.carried&&!this.holdingPaused;}
 get active(){return this.placing||this.pickupMode;}
 level(skill:Skill){return Math.min(5,Math.floor(Math.sqrt(this.xp[skill]/30)));}
 gain(skill:Skill,amount:number){this.xp[skill]+=amount;}
 near(kind?:BuildKind){const p=this.s.player;return this.buildings.filter(b=>(!kind||b.kind===kind)&&!['floor','roof'].includes(b.kind)&&b.floor===p.floor&&Math.hypot(b.x-p.x,b.y-p.y)<2.8&&this.s.inside(b)===this.s.inside(p)).sort((a,b)=>Number(b.kind==='door')-Number(a.kind==='door')||Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];}
 blocks(b:Construction){return b.hp>0&&!['floor','roof'].includes(b.kind)&&!(b.kind==='door'&&b.open);}
 blocksSight(b:Construction){return b.kind==='wall'||b.kind==='door'&&!b.open;}
 solid(b:Construction):Solid{
  const side=(b.rotation||0)%2;
  let w=b.kind==='wall'||b.kind==='door'?2:b.kind==='floor'||b.kind==='roof'?2:b.furnishing?.w||1;
  let d=b.kind==='wall'||b.kind==='door'?.16:b.kind==='floor'||b.kind==='roof'?2:b.furnishing?.d||1;
  if(side)[w,d]=[d,w];
  return {x:b.x-w/2,y:b.y-d/2,w,d,height:this.blocksSight(b)?2.5:b.furnishing?.height||.8,kind:b.kind};
 }
 placement(){const p=this.s.player,at=this.placing&&this.cursor?this.cursor:{x:p.x+Math.cos(p.angle)*2,y:p.y+Math.sin(p.angle)*2},kind=this.carried?'furniture':RECIPES[this.selected]?.build;
  let x=Math.round(at.x*2)/2,y=Math.round(at.y*2)/2;
  if(kind==='floor'||kind==='roof'){x=Math.round(at.x/2)*2;y=Math.round(at.y/2)*2;}
  if(kind==='wall'||kind==='door'){x=this.rotation%2?Math.round((at.x-1)/2)*2+1:Math.round(at.x/2)*2;y=this.rotation%2?Math.round(at.y/2)*2:Math.round((at.y-1)/2)*2+1;}
  return {x,y,floor:p.floor};
 }
 draft(kind:BuildKind):Construction{return {id:-1,...this.placement(),kind,rotation:this.rotation,furnishing:this.carried,hp:140,created:0,used:0,activeUntil:0};}
 placementReason(kind:BuildKind,b=this.draft(kind)){const s=this.s,p=b,home=s.inside(s.player),solid=this.solid(b);
  if(s.driving||s.dead||s.stairTravel)return 'Stand on solid ground first';
  if(Math.hypot(p.x-s.player.x,p.y-s.player.y)>5)return 'Move within five metres of the placement';
  if(s.inside(p)!==home||!s.clearSight(s.player,p))return 'Choose a reachable position on this side of the wall';
  if((kind==='fire'||kind==='barrel')&&home)return 'Build this outdoors';
  if(['wall','door','roof'].includes(kind)&&!this.buildings.some(f=>f.kind==='floor'&&f.floor===p.floor&&Math.abs(f.x-p.x)<=1.01&&Math.abs(f.y-p.y)<=1.01))return 'Place a timber floor foundation first';
  if(kind==='roof'&&!this.buildings.some(f=>f.floor===p.floor&&(this.blocksSight(f)&&Math.hypot(f.x-p.x,f.y-p.y)<=1.1||f.kind==='roof'&&Math.hypot(f.x-p.x,f.y-p.y)<=2.1)))return 'Add a supporting wall or doorway first';
  const overlap=(a:Solid,c:Solid)=>a.x<c.x+c.w-.025&&a.x+a.w>c.x+.025&&a.y<c.y+c.d-.025&&a.y+a.d>c.y+.025;
  for(const old of this.buildings){if(old.floor!==p.floor)continue;if(kind==='floor'&&old.kind!=='floor'||kind==='roof'&&old.kind!=='roof'||!['floor','roof'].includes(kind)&&['floor','roof'].includes(old.kind))continue;
   if((kind==='wall'||kind==='door')&&(old.kind==='wall'||old.kind==='door')&&(old.rotation||0)%2!==(b.rotation||0)%2)continue;
   if(overlap(solid,this.solid(old)))return 'That space is occupied';
  }
  if(this.blocks(b)&&pointIn(solid,s.player.x,s.player.y,.3))return 'Do not build on yourself';
  for(const x of [solid.x+.08,solid.x+solid.w/2,solid.x+solid.w-.08])for(const y of [solid.y+.08,solid.y+solid.d/2,solid.y+solid.d-.08]){
   if(kind==='roof')continue;
   // Foundation is walkable, so existing foundation tiles do not block subsequent work.
   if(s.blocked(x,y,p.floor,home,true))return 'Not enough clear space';
  }
  if(s.vehicles.some(v=>carContains(v,p.x,p.y,1.2))||s.zombies.some(z=>z.hp>0&&(z.floor||0)===p.floor&&pointIn(solid,z.x,z.y,.4)))return 'Placement is occupied';
  if(home&&(home.floors||1)>1&&p.x>home.x+home.w-3.5&&p.y>home.y+home.d-3.6)return 'Keep the staircase clear';
  return '';
 }
 station(kind:BuildKind){
  const built=this.near(kind);if(built&&this.s.clearSight(this.s.player,built))return built;
  if(kind==='fire'){const h=this.s.inside(this.s.player);if(h&&this.s.life.powered(this.s.player)){const counter=furniture(h,this.s.player.floor).find(f=>f.kind==='counter'&&Math.hypot(f.x+f.w/2-this.s.player.x,f.y+f.d/2-this.s.player.y)<2.8);if(counter)return {x:counter.x+counter.w/2,y:counter.y+counter.d/2,floor:this.s.player.floor};}}
 }
 reason(id:string,checkPlacement=false,selectedStation=false){const r=RECIPES[id],s=this.s;if(!r)return 'Unknown recipe';if(s.driving||s.dead||s.stairTravel)return 'Stand on solid ground first';if(this.level(r.skill)<r.level)return `Requires ${SKILLS[r.skill]} ${r.level}`;if(r.tool&&!s.bag[r.tool])return `Requires ${r.tool} (reusable)`;if(r.station&&!selectedStation&&!this.station(r.station))return `Stand near a ${r.station==='fire'?'cooking fire':'workbench'}`;for(const [k,n] of Object.entries(r.cost))if((s.bag[k]||0)<n)return `Need ${n} ${k}`;if(r.output&&!s.life.canMake(r.cost,r.output,r.amount||1))return 'Free carrying space for the output';return checkPlacement&&r.build?this.placementReason(r.build):'';}
 craft(id:string,count=1){const problem=this.reason(id);if(problem){this.s.say(problem);return;}if(this.s.life.job){this.s.say('Finish or cancel your current action first.');return;}
  const r=RECIPES[id];if(r.build){if(this.carried){this.s.say('Place the furniture you are carrying first.');return;}this.selected=id;this.pickupMode=false;this.cursor=undefined;this.closeWorkshop=true;this.s.say(r.name+' · Click to build · R rotate · Esc cancel');return;}
  count=Math.max(1,Math.min(Math.floor(count),...Object.entries(r.cost).map(([k,n])=>Math.floor((this.s.bag[k]||0)/n))));
  const cost=Object.fromEntries(Object.entries(r.cost).map(([k,n])=>[k,n*count])),output=(r.amount||1)*count;
  if(!r.output||!this.s.life.canMake(cost,r.output,output)){this.s.say('Make room for the completed items.');return;}
  const at=r.station?this.station(r.station):undefined;if(at)this.s.player.angle=Math.atan2(at.y-this.s.player.y,at.x-this.s.player.x);
  const job=this.s.life.begin((r.skill==='cooking'?'Cooking · ':id==='sawlogs'?'Sawing · ':'Making · ')+r.name,(r.skill==='cooking'?6:4)*count,()=>{
   this.s.life.spend(cost);this.s.bag[r.output!]=(this.s.bag[r.output!]||0)+output;this.s.inventory.sync();this.gain(r.skill,12*count);this.s.say(r.name+' completed · '+output+' added to inventory.');
  });
  if(job){if(r.skill==='mechanics')job.activity='repair';else if(r.skill==='carpentry'&&id!=='sawlogs')job.activity='hammer';job.valid=()=>!this.reason(id)&&this.s.life.available(cost)&&this.s.life.canMake(cost,r.output!,output)&&(!at||Math.hypot(at.x-this.s.player.x,at.y-this.s.player.y)<2.8);this.closeWorkshop=true;}
 }
 place(){
  const kind=this.carried?'furniture':RECIPES[this.selected]?.build;if(!kind)return;if(this.s.life.job){this.s.say('Finish or cancel the current build first.');return;}
  const problem=this.carried?this.placementReason(kind):this.reason(this.selected,true);if(problem){this.s.say(problem);return;}
  const recipe=this.selected,packed=this.placingItem,carried=this.carried,cost=carried?{}:RECIPES[recipe].cost;
  const built:Construction={...this.draft(kind),id:this.serial++,hp:(RECIPES[recipe]?.durability||180)+this.level('carpentry')*40,created:this.s.elapsed,used:this.s.elapsed};
  this.s.player.angle=Math.atan2(built.y-this.s.player.y,built.x-this.s.player.x);
  const job=this.s.life.begin(carried?'Placing furniture':'Building '+RECIPES[recipe].name,carried?1.5:kind==='floor'?2.5:4,()=>{
   this.s.life.spend(cost);
   if(kind==='storage')built.container={id:'storage:'+built.id,name:'Home storage chest',x:built.x,y:built.y,floor:built.floor,capacity:100,items:[],agedAt:this.s.elapsed};
   this.buildings.push(built);this.s.refreshWorld();this.gain('carpentry',12);
   if(carried){if(packed){delete this.s.bag[packed];this.packed.delete(packed);this.s.inventory.sync();}this.placingItem='';this.carried=undefined;this.selected='';this.s.say('Furniture placed.');}else this.s.say('Built · Click to build another · R rotate · Esc done');
  });
  if(job){this.buildingDraft=built;job.valid=()=>!this.placementReason(kind,built)&&(carried?this.carried===carried&&(!packed||!!this.s.bag[packed]):this.selected===recipe&&!this.reason(recipe)&&this.s.life.available(cost));}
 }
 cancel(){this.pickupJob=undefined;this.carried=undefined;this.placingItem='';this.holdingPaused=false;this.selected='';this.pickupMode=false;this.cursor=undefined;this.s.say('Action cancelled.');}
 placeFromInventory(kind:string){if(this.s.driving||this.s.dead)return;const f=this.packed.get(kind);if(!f||!this.s.bag[kind])return;this.carried=f;this.placingItem=kind;this.holdingPaused=false;this.selected='';this.pickupMode=false;this.rotation=0;this.cursor=undefined;this.closeWorkshop=true;this.s.say('Click to place furniture · R rotate · Esc keeps it in inventory');}
 targetConstruction(placed:Construction):PickupTarget{
  return {x:placed.x,y:placed.y,floor:placed.floor,label:placed.furnishing?.kind||placed.kind,furnishing:placed.furnishing,constructionId:placed.id,blocked:placed.furnishing?undefined:'This structure is fixed. Use dismantle instead.'};
 }
 targetFurniture(h:House,b:Solid,floor:number):PickupTarget{
  return {x:b.x+b.w/2,y:b.y+b.d/2,floor,label:b.kind,home:h,solidId:b.id,furnishing:{kind:b.kind,w:b.w,d:b.d,height:b.height,design:h.design||0,institution:!!h.layout},blocked:['fridge','counter','post','worklift','basin'].includes(b.kind)?'This fixture cannot be picked up.':undefined};
 }
 targetAt(x:number,y:number):PickupTarget|undefined{
  const s=this.s,p=s.player,placed=this.buildings.find(b=>b.floor===p.floor&&pointIn(this.solid(b),x,y,.1));
  if(placed)return this.targetConstruction(placed);
  const h=s.inside(p),b=h&&furniture(h,p.floor).find(b=>pointIn(b,x,y,.1));if(!h||!b)return;
  return this.targetFurniture(h,b,p.floor);
 }
 pickupReason(t:PickupTarget){const s=this.s;if(t.furnishing?.container?.items.some(i=>i.quantity>0))return 'Empty the locker before picking it up.';if(t.solidId&&s.crates.some(c=>c.furnitureId===t.solidId&&(c.floor||0)===t.floor&&c.items.some(i=>i.quantity>0)))return 'Empty the locker before picking it up.';if(t.blocked)return t.blocked;if(!t.furnishing)return 'This object cannot be picked up.';if(s.driving||s.dead||s.stairTravel)return 'Stand on solid ground first';if(t.floor!==s.player.floor||Math.hypot(t.x-s.player.x,t.y-s.player.y)>3||!s.clearSight(s.player,t))return 'Move closer to the object';if(t.home?.removedFurniture?.[t.floor+':'+t.solidId]||t.constructionId!==undefined&&!this.buildings.some(b=>b.id===t.constructionId))return 'The object is no longer there';return '';}
 packedDefinition(f:Furnishing){return {name:f.kind==='tv'?'TV':f.kind.replace(/^[a-z]/,c=>c.toUpperCase()),icon:'furniture:'+f.kind,w:Math.max(2,Math.min(4,Math.ceil(f.w*1.5))),h:Math.max(2,Math.min(3,Math.ceil(f.d*1.5))),weight:Math.round(f.w*f.d*8),desc:'Right-click and choose Place in world to position this furniture. R rotates; Esc cancels without losing the item.'};}
 hasFurnitureSpace(f:Furnishing){if(this.s.inventory.weight+this.packedDefinition(f).weight>42)return false;const key='Furniture:space-check';ITEM_INFO[key]=this.packedDefinition(f);this.s.inventory.sync();const spot=this.s.inventory.findSpot(key,'backpack')||this.s.inventory.findSpot(key,'pockets');delete ITEM_INFO[key];return !!spot;}
 noSpace(){this.notice='There is no more space in your inventory. Free enough inventory cells, then try again.';this.s.say('No more inventory space.');}
 beginPickup(t:PickupTarget){const reason=this.pickupReason(t);if(reason){this.s.say(reason);return;}if(!this.hasFurnitureSpace(t.furnishing!)){this.noSpace();return;}this.cancel();this.pickupJob={target:t,elapsed:0,duration:(2.5+Math.min(2,t.furnishing!.w*t.furnishing!.d*.4))*.5,x:this.s.player.x,y:this.s.player.y,hp:this.s.player.hp};this.s.say('Picking up '+t.label+' · Stay still');}
 pickup(x:number,y:number){const t=this.targetAt(x,y);if(t)this.beginPickup(t);}
 updatePickup(dt:number){const job=this.pickupJob;if(!job)return;const p=this.s.player;
  if(p.hp<job.hp||Math.hypot(p.x-job.x,p.y-job.y)>.08||this.s.attackTime>0||this.s.shoveTime>0||this.s.player.aiming||this.pickupReason(job.target)){this.pickupJob=undefined;this.s.say('Pickup interrupted.');return;}
  job.elapsed+=dt;if(job.elapsed<job.duration)return;this.pickupJob=undefined;
  const t=job.target,f=t.furnishing!;if(!this.hasFurnitureSpace(f)){this.noSpace();return;}
  const key='Furniture:'+this.packedSerial++;ITEM_INFO[key]=this.packedDefinition(f);this.packed.set(key,f);this.s.bag[key]=1;this.s.inventory.sync();
  if(t.home)(t.home.removedFurniture??={})[t.floor+':'+t.solidId]=true;
  else this.buildings=this.buildings.filter(b=>b.id!==t.constructionId);
  this.s.refreshWorld();this.s.say('Packed '+t.label+' · Open I to place it from inventory.');
 }
 dismantle(target?:Construction){const at=this.placement();const b=target||this.near()||this.buildings.find(b=>b.floor===this.s.player.floor&&Math.hypot(b.x-at.x,b.y-at.y)<1.2);if(!b)return;if(b.container?.items.some(i=>i.quantity>0)){this.s.say('Empty this storage chest before dismantling it.');return;}if(b.kind==='floor'&&this.buildings.some(other=>other!==b&&other.floor===b.floor&&['wall','door','roof','furniture'].includes(other.kind)&&Math.abs(other.x-b.x)<=1.1&&Math.abs(other.y-b.y)<=1.1)){this.s.say('Remove the supported walls, roof and furniture first.');return;}if(b.kind==='furniture'){this.pickup(b.x,b.y);return;}const recipe=Object.values(RECIPES).find(r=>r.build===b.kind);if(recipe)for(const [k,n]of Object.entries(recipe.cost))this.s.bag[k]=(this.s.bag[k]||0)+Math.floor(n/2);this.buildings=this.buildings.filter(v=>v!==b);this.s.refreshWorld();this.s.say('Dismantled structure. Recovered some materials.');}
 interact(){const b=this.near();if(!b)return false;const s=this.s;if(b.kind==='storage'){s.life.openTrunk=b.container;s.say('Storage opened.');}else if(b.kind==='door'){b.open=!b.open;s.doorSound={serial:s.doorSound.serial+1,open:b.open};s.say(b.open?'Base door opened.':'Base door closed.');}else if(b.kind==='barrel'){if(s.elapsed-b.used<(s.life.raining?60:240))s.say('Water collector is filling. Check back soon.');else{if(s.life.add('Water')){b.used=s.elapsed;s.say('Collected a bottle of water.');}}}else if(b.kind==='bed'||b.furnishing?.kind==='bed'){s.life.act('rest');}else if(b.kind==='lure'){b.activeUntil=s.elapsed+20;s.life.noise(b,30,25);s.say('Noise lure activated for 20 seconds.');}else s.say(b.kind==='wall'?'Timber wall · '+Math.ceil(b.hp)+' durability':'Press B for crafting. Right-click to pick up furniture.');return true;}
 update(dt:number){if(!this.s.life.job)this.buildingDraft=undefined;this.updatePickup(dt);const s=this.s;if(this.restUntil>s.elapsed){if(s.player.moving||s.zombies.some(z=>z.hp>0&&z.alert&&Math.hypot(z.x-s.player.x,z.y-s.player.y)<6))this.restUntil=0;else{s.player.stamina=Math.min(200,s.player.stamina+dt*12);s.player.hp=Math.min(100,s.player.hp+dt);}}
  for(const b of this.buildings){for(const z of s.zombies){if(z.hp<=0||(z.downUntil||0)>s.elapsed||(z.floor||0)!==b.floor)continue;if(b.activeUntil>s.elapsed&&s.inside(z)===s.inside(b)&&Math.hypot(z.x-b.x,z.y-b.y)<15*balance.hearingRadiusScale){const d=Math.hypot(z.x-b.x,z.y-b.y);if(d>1)s.move(z,(b.x-z.x)/d*dt*1.5,(b.y-z.y)/d*dt*1.5);}if(this.blocks(b)&&z.alert&&Math.hypot(z.x-b.x,z.y-b.y)<1.3)b.hp-=b.kind==='door'?s.life.entranceHit(b,dt,balance.doorDamagePerSecond,balance.doorCrowdDamagePerSecond):dt*8;}}for(const b of this.buildings.filter(b=>b.hp<=0)){const c=b.container||b.furnishing?.container;if(c&&c.items.some(i=>i.quantity>0)){c.furnitureId=undefined;c.name='Scattered supplies';this.s.world.region(Math.floor(b.x/46),Math.floor(b.y/46)).crates.push(c);this.s.world.region(Math.floor(b.x/46),Math.floor(b.y/46)).revision=(this.s.world.region(Math.floor(b.x/46),Math.floor(b.y/46)).revision||0)+1;}}if(this.buildings.some(b=>b.hp<=0)){this.buildings=this.buildings.filter(b=>b.hp>0);this.s.refreshWorld();}
 }
}
