import {inBuilding,footprint,type BuildingLayout} from './building-layout';
import {clothingKind,type Outfit} from './wardrobe';
import {SURVIVAL_BALANCE as balance} from './survival-balance';
import {CountyLife} from './county-life';
import {AMMO_KIND} from './expedition-content';
import {perceive,pursue} from './zombie-ai';
import {Inventory,ITEM_INFO} from './inventory';
import {countyContains,SETTLEMENTS} from './county';
import {GUNS,VEHICLES,type GunKind} from './content';
import {Survival} from './survival';
import {FOODS} from './food.js';
import {stairPoint,STAIR_LENGTH,STAIR_WIDTH,FLOOR_HEIGHT} from './stairs.js';
import {SolidIndex,regionSolids,pointIn,carContains,carOverlap,rayBox,walls,furniture} from './collision.js';
import {ProceduralWorld,type VehicleState} from './world.js';
import {createCrates,type LootCrate} from './loot.js';
export type Point = { x:number; y:number;floor?:number };
export type House = Point & { layout?:BuildingLayout;encounter?:string;locked?:boolean;alarmArmed?:boolean;doorHp?:number;barricade?:number;curtains?:boolean;windowBroken?:boolean;windowHp?:number;removedFurniture?:Record<string,boolean>; kind?:import('./town.js').BuildingKind;floors?:number;design?:number;w:number; d:number; style?:'home'|'shop'|'warehouse'|'barn';color:string; roof:string; name:string; door:boolean; searched:boolean; loot:string[] };
export type Zombie = Point & { target?:Point;memoryUntil?:number;heard?:number;path?:Point[];pathAt?:number;downAt?:number;downUntil?:number;homeX?:number;homeY?:number;carContact?:number;hp:number; phase:number; alert:boolean; cooldown:number; hit:number;gait?:number;moving?:boolean;angle?:number;pushX?:number;pushY?:number;diedAt?:number;deathAngle?:number;deathCause?:string };
export const SIZE=46;
export const MAX_STAMINA=200;
export const MOVEMENT_SPEED={walk:3.024,run:5.152,sneak:1.512};
export const ATTACK_DURATION=.38;
export const FINISHER_DURATION=1.05, SHOVE_DURATION=.78;
export const houses:House[] = [
 {x:14,y:9,w:7,d:6,color:'#96917a',roof:'#555851',name:'14 · Wren Street',loot:['Beans','Water','Bandage']},
 {x:32,y:8,w:8,d:7,color:'#8b9991',roof:'#60544c',name:'16 · Wren Street',loot:['Beans','Plank','Bandage']},
 {x:14,y:32,w:9,d:6,color:'#869283',roof:'#595b51',name:'15 · Wren Street',loot:['Beans','Water','Plank']},
 {x:33,y:33,w:7,d:7,color:'#a89b84',roof:'#565c52',name:'17 · Wren Street',loot:['Beans','Bandage']},
].map(h=>({...h,door:false,searched:false}));
export class Simulation {
 life=new CountyLife(this);buildPreview=false;survival=new Survival(this);
 gun:GunKind='carbine';ownedGuns:GunKind[]=['carbine','pistol','shotgun','hunting','smg'];
 get firearm(){return GUNS[this.gun];}
 doorSound={serial:0,open:false};
 stairTravel:{house:House;base:number;progress:number}|undefined;
 get playerElevation(){return this.stairTravel?(this.stairTravel.base+this.stairTravel.progress)*FLOOR_HEIGHT:this.player.floor*FLOOR_HEIGHT;}
 armor={kevlar:100,helmet:100};armorEquipped={kevlar:true,helmet:true};
 outfit:Outfit={top:'WorkShirt',bottom:'BlueJeans'};
 player={floor:0,climbing:0,x:23.2,y:23.7,hp:100,stamina:MAX_STAMINA,hunger:82,thirst:76,angle:1.2,moving:false,sneaking:false,running:false,distance:0,gait:0,exhausted:false,aiming:false};
 world=new ProceduralWorld(houses);
 houses=houses;
 crates=createCrates();
 zombies:Zombie[]=[]; bag:Record<string,number>={Beans:1,Water:1,Bandage:1,Plank:0};
 solids=new SolidIndex([]);
 vehicles:VehicleState[]=[];vehicle!:VehicleState;driving=false;
 get reserve(){return this.life.ammo[AMMO_KIND[this.gun]]||0;}
 set reserve(n:number){this.life.ammo[AMMO_KIND[this.gun]]=n;}
 meleeKind:'bat'|'crowbar'='bat';
 get meleeName(){return this.meleeKind==='crowbar'?'Crowbar':'Wooden bat';}
 get meleeIcon(){return this.meleeKind==='crowbar'?'Crowbar':'bat';}
 weapon:'bat'|'rifle'='bat';ammo=12;shotTime=0;shotEnd:Point|null=null;
 shoveTime=0;pendingShove:number|undefined;attackDuration=ATTACK_DURATION;groundAttack=false;pendingMelee:{target:Zombie;ground:boolean}|undefined;
 elapsed=0; kills=0; searched=0; attackTime=0; damageTime=0; paused=false; dead=false; won=false; barricaded=false; sound=0; message='Find supplies. Make a home. See another sunrise.'; messageTime=8; attackCooldown=0;
 inventory:Inventory;
 constructor(){this.refreshWorld();this.inventory=new Inventory(this);}
 refreshWorld(){this.houses=this.world.active.flatMap(r=>r.houses);this.crates=[...this.world.active].sort((a,b)=>Number(b.key==='0,0')-Number(a.key==='0,0')).flatMap(r=>r.crates);this.zombies=this.world.active.flatMap(r=>r.zombies);this.vehicles=this.world.active.flatMap(r=>r.vehicles);this.crates.push(...this.vehicles.map(v=>{const c=v.trunk;if(!c)return undefined;c.x=v.x;c.y=v.y;return c;}).filter((c):c is LootCrate=>!!c));
 for(const b of this.survival.buildings){if(b.kind==='storage'||b.furnishing?.kind==='locker'){const c=b.container??b.furnishing?.container;if(c)this.crates.push(c);}}
 this.solids=new SolidIndex(this.world.active.flatMap(regionSolids));if(!this.vehicle)this.vehicle=this.vehicles.find(v=>v.id==='0,0:vehicle:0')??this.vehicles[0];}
 streamWorld(){if(this.world.ensure(this.player.x,this.player.y))this.refreshWorld();}
 inside(p:Point){return this.houses.find(h=>inBuilding(h,p.x,p.y));}
 doorPoint(h:House){return {x:h.x+h.w/2,y:h.y+h.d};}
 nearHouse(){return this.houses.find(h=>this.inside(this.player)===h||Math.hypot(this.player.x-this.doorPoint(h).x,this.player.y-this.doorPoint(h).y)<1.8);}
 wallBlocked(x:number,y:number){const radius=.24;return this.houses.some(h=>{if(h.layout)return walls(h).some(w=>pointIn(w,x,y,.17));const withinX=x>=h.x-radius&&x<=h.x+h.w+radius,withinY=y>=h.y-radius&&y<=h.y+h.d+radius;if(!withinX||!withinY)return false;const side=Math.abs(x-h.x)<=radius||Math.abs(x-h.x-h.w)<=radius;const rear=Math.abs(y-h.y)<=radius&&!(h.windowBroken&&Math.abs(x-h.x-h.w/2)<.5);const front=Math.abs(y-h.y-h.d)<=radius;const opening=h.door&&Math.abs(x-h.x-h.w/2)<.38;return side||rear||(front&&!opening);});}
 blocked(x:number,y:number,floor=0,house?:House,ignoreConstruction=false){if(!countyContains(x,y,.3))return true;const gen=this.life.generator;if(!floor&&gen&&Math.abs(gen.x-x)<.8&&Math.abs(gen.y-y)<.55)return true;if(!ignoreConstruction&&this.survival.buildings.some(b=>b.floor===floor&&this.survival.blocks(b)&&pointIn(this.survival.solid(b),x,y,.22)))return true;if(floor>0)return !house||!inBuilding(house,x,y)||walls({...house,door:false}).some(b=>pointIn(b,x,y,.17))||furniture(house,floor).some(b=>pointIn(b,x,y,.22));return this.wallBlocked(x,y)||[...this.solids.near(x,y,.5)].some(b=>pointIn(b,x,y,.22))||this.vehicles.some(v=>carContains(v,x,y,.24));}
 killZombie(z:Zombie,cause='bat',angle=this.player.angle){if(z.diedAt!==undefined)return;z.hp=0;z.diedAt=this.elapsed;z.deathAngle=angle;z.deathCause=cause;z.moving=false;this.kills++;}
 pushFromCars(z:Zombie){if(z.floor)return;for(const v of this.vehicles){if(!carContains(v,z.x,z.y,.24))continue;const c=Math.cos(v.angle),s=Math.sin(v.angle),dx=z.x-v.x,dy=z.y-v.y;let f=dx*c+dy*s,l=-dx*s+dy*c;if(1.85-Math.abs(f)<1-Math.abs(l))f=Math.sign(f||1)*1.85;else l=Math.sign(l||1)*1;z.x=v.x+c*f-s*l;z.y=v.y+s*f+c*l;}}
 move(p:Point,dx:number,dy:number){const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/.12));for(let i=0;i<steps;i++){if(p===this.player&&this.walkStairs(dx/steps,dy/steps))continue;if(!this.blocked(p.x+dx/steps,p.y,p.floor||0,this.inside(p)))p.x+=dx/steps;if(!this.blocked(p.x,p.y+dy/steps,p.floor||0,this.inside(p)))p.y+=dy/steps;}}
 say(m:string){this.message=m;this.messageTime=5;}
 update(dt:number,input:{x:number;y:number;run:boolean;sneak:boolean;steer?:number;throttle?:number}){if(this.paused||this.dead||this.won)return;dt=Math.min(dt,.05);this.streamWorld();this.elapsed+=dt;if(this.life.seated&&(input.x||input.y)){if(!this.life.stand()){input={...input,x:0,y:0};}}this.life.entranceDamage.clear();this.survival.update(dt);this.shotTime=Math.max(0,this.shotTime-dt);this.messageTime-=dt;this.attackTime=Math.max(0,this.attackTime-dt);this.shoveTime=Math.max(0,this.shoveTime-dt);if(this.pendingShove!==undefined&&this.shoveTime<SHOVE_DURATION*.55)this.resolveShove();if(this.pendingMelee&&this.attackTime<this.attackDuration*(this.groundAttack?.34:.48))this.resolveMelee();this.attackCooldown-=dt;this.damageTime=Math.max(0,this.damageTime-dt);this.sound=Math.max(0,this.sound-dt*3);const p=this.player;p.moving=!!(input.x||input.y);p.sneaking=input.sneak;if(p.stamina<=4)p.exhausted=true;else if(p.stamina>=24)p.exhausted=false;const committed=this.shoveTime>0||this.attackTime>0&&this.groundAttack;const run=input.run&&!committed&&!input.sneak&&!p.aiming&&!p.exhausted&&p.moving;const speed=(run?MOVEMENT_SPEED.run:input.sneak?MOVEMENT_SPEED.sneak:MOVEMENT_SPEED.walk)*(p.aiming?.6:1)*(committed?.22:1)*this.life.speedFactor;const oldX=p.x,oldY=p.y;const n=Math.hypot(input.x,input.y)||1;if(this.driving)this.drive(dt,input.steer??(input.x-input.y)/2,input.throttle??-(input.x+input.y)/2);else this.move(p,input.x/n*speed*dt,input.y/n*speed*dt);const traveled=Math.hypot(p.x-oldX,p.y-oldY);p.distance+=traveled;p.gait+=traveled/(run?2.7:2.1);p.moving=traveled>.0001;p.running=!this.driving&&run&&p.moving;if(p.moving){if(!p.aiming&&!this.driving&&this.attackTime<=0&&this.shoveTime<=0)p.angle=Math.atan2(input.y,input.x);this.sound=Math.max(this.sound,run?10:input.sneak?1:3);}p.stamina=Math.max(0,Math.min(MAX_STAMINA,p.stamina+(run&&!this.driving?-14:8*(1-this.life.fatigue*.006))*dt));p.hunger=Math.max(0,p.hunger-dt*.055);p.thirst=Math.max(0,p.thirst-dt*(run?.14:.085));if(p.hunger===0||p.thirst===0)p.hp-=dt*.5;
 this.life.update(dt);
 for(const z of this.zombies){z.hit=Math.max(0,z.hit-dt);if(z.hp<=0||Math.hypot(z.x-p.x,z.y-p.y)>70)continue;z.cooldown-=dt;
 if((z.downUntil||0)>this.elapsed){
  z.alert=false;z.moving=false;z.carContact=0;
  if(this.elapsed-(z.downAt||0)<.45){this.move(z,(z.pushX||0)*dt,(z.pushY||0)*dt);z.pushX=(z.pushX||0)*Math.exp(-dt*9);z.pushY=(z.pushY||0)*Math.exp(-dt*9);}
  continue;
 }
 const oldX=z.x,oldY=z.y,d=Math.hypot(p.x-z.x,p.y-z.y);const concealed=perceive(this,z);
 if(z.hit>0){this.move(z,(z.pushX||0)*dt,(z.pushY||0)*dt);z.pushX=(z.pushX||0)*Math.exp(-dt*7);z.pushY=(z.pushY||0)*Math.exp(-dt*7);}else if(z.alert&&d>.55){pursue(this,z,dt);}else if(!z.alert){this.move(z,(Math.cos(this.elapsed*.14+z.phase)*.264+((z.homeX??z.x)-z.x)*.132)*dt,(Math.sin(this.elapsed*.12+z.phase)*.264+((z.homeY??z.y)-z.y)*.132)*dt);}
 this.pushFromCars(z);const traveled=Math.hypot(z.x-oldX,z.y-oldY);z.moving=traveled>.00001;z.gait=(z.gait||0)+traveled/1.1;if(z.moving&&z.hit<=0)z.angle=Math.atan2(z.y-oldY,z.x-oldX);// Occupants can only be reached after sustained contact beside a window on a nearly stopped car.
 const v=this.vehicle,c=Math.cos(v.angle),sn=Math.sin(v.angle),carDX=z.x-v.x,carDY=z.y-v.y;
 const along=carDX*c+carDY*sn,side=-carDX*sn+carDY*c;
 const atWindow=this.driving&&Math.abs(v.speed)<.6&&Math.abs(along)<.8&&Math.abs(side)>=.85&&Math.abs(side)<1.18&&!concealed&&z.hit<=0;
 z.carContact=atWindow?(z.carContact||0)+dt:0;
 const atCar=atWindow&&z.carContact>=2.5;
 if(!concealed&&(atCar||!this.driving&&d<.8)&&this.clearSight(z,p)&&z.cooldown<=0&&z.hit<=0){const raw=atCar?3:9,protection=(this.armorEquipped.kevlar&&this.armor.kevlar>0?.35:0)+(this.armorEquipped.helmet&&this.armor.helmet>0?.15:0);p.hp-=raw*(1-protection);this.life.pain=Math.min(100,this.life.pain+raw);if(!atCar&&Math.random()>.55+protection*.5)this.life.bleeding=Math.min(3,this.life.bleeding+1);if(this.armorEquipped.kevlar)this.armor.kevlar=Math.max(0,this.armor.kevlar-raw*.7);if(this.armorEquipped.helmet)this.armor.helmet=Math.max(0,this.armor.helmet-raw*.3);z.cooldown=atCar?3:1.4;if(atCar)z.carContact=0;this.damageTime=.3;this.say(atCar?'They are reaching through the windows. Drive away!':'You were scratched. Create some distance.');}}
 if(p.hp<=0){p.hp=0;this.dead=true;this.say('Every life leaves a trace.');}}
 equip(weapon:'bat'|'rifle',fromInventory=false){if((this.paused&&!fromInventory)||this.dead||this.won)return;if(weapon==='rifle'&&!this.ownedGuns.length){this.say('Find a firearm first. Read your supply map for leads.');return;}if(weapon==='bat'&&this.meleeKind==='crowbar'&&!this.bag.Crowbar){this.say('Find or craft a crowbar first.');return;}this.weapon=weapon;this.player.aiming=false;this.attackTime=0;this.pendingMelee=undefined;this.shoveTime=0;this.pendingShove=undefined;this.say(weapon==='rifle'?this.firearm.name+' equipped · Hold right mouse to aim · Hold left mouse to fire':this.meleeName+' equipped'+(this.ownedGuns.length?' · '+this.firearm.name+' slung on your back':' · right-click objects for actions'));}
 reload(){if(this.paused||this.dead||this.won||this.weapon!=='rifle'||this.attackCooldown>0)return;const rounds=Math.min(this.firearm.capacity-this.ammo,this.reserve);if(!rounds){this.say(this.ammo===this.firearm.capacity?'Magazine is full.':'No spare ammunition.');return;}this.ammo+=rounds;this.reserve-=rounds;this.attackCooldown=Math.max(.4,.9-this.survival.level('shooting')*.06);this.say(this.firearm.name+' reloaded.');}
 fire(){
 if(this.ammo<=0){this.say('Empty · Press R to reload');this.attackCooldown=.3;return;}
 this.ammo--;this.attackCooldown=this.firearm.cadence;this.shotTime=.12;this.sound=this.firearm.noise;this.life.noise(this.player,this.firearm.noise*1.9,30);const p=this.player;
 for(let pellet=0;pellet<this.firearm.pellets;pellet++){const spread=this.firearm.spread*(p.aiming?.4:1)*(1+this.life.pain*.012)/(1+this.survival.level('shooting')*.12),angle=p.angle+(Math.random()-.5)*spread,dx=Math.cos(angle),dy=Math.sin(angle);let nearest=Infinity,target:Zombie|undefined;
 // Analytic ray intersections have no weapon range cutoff. Only geometry stops a shot.
 const regions=[...this.world.cache.values()];
 for(const region of regions){for(const solid of (p.floor>0?region.houses.filter(h=>h===this.inside(p)).flatMap(h=>[...furniture(h,p.floor),...walls({...h,door:false})]):[...regionSolids(region),...region.houses.flatMap(walls)])){if(solid.height<1.25)continue;nearest=Math.min(nearest,rayBox(p.x,p.y,dx,dy,solid));}for(const v of (p.floor>0?[]:region.vehicles)){const c=Math.cos(v.angle),s=Math.sin(v.angle),x=p.x-v.x,y=p.y-v.y;nearest=Math.min(nearest,rayBox(x*c+y*s,-x*s+y*c,dx*c+dy*s,-dx*s+dy*c,{x:-1.6,y:-.75,w:3.2,d:1.5,height:1.6,kind:'car'}));}}
 for(const b of this.survival.buildings)if(b.floor===p.floor&&this.survival.blocksSight(b))nearest=Math.min(nearest,rayBox(p.x,p.y,dx,dy,this.survival.solid(b)));
 const zombies=new Set([...this.zombies,...regions.flatMap(r=>r.zombies)]);
 for(const z of zombies){if(z.hp<=0||(z.floor||0)!==p.floor)continue;const x=z.x-p.x,y=z.y-p.y,along=x*dx+y*dy,across=x*dy-y*dx,r=p.aiming?.38:.25;if(along<=0||Math.abs(across)>r)continue;const hit=along-Math.sqrt(r*r-across*across);if(hit<nearest){nearest=hit;target=z;}}
 this.shotEnd={x:p.x+dx*(Number.isFinite(nearest)?nearest:2000),y:p.y+dy*(Number.isFinite(nearest)?nearest:2000)};
 if(target){target.hp-=this.firearm.damage;target.hit=.15;this.survival.gain('shooting',2);if(target.hp<=0)this.killZombie(target,'shot',p.angle);}
 }
 }
 meleeTargets(range:number){const p=this.player;return this.zombies.filter(z=>{const dx=z.x-p.x,dy=z.y-p.y,d=Math.hypot(dx,dy);return z.hp>0&&(z.floor||0)===p.floor&&d<range&&(d<.35||(dx*Math.cos(p.angle)+dy*Math.sin(p.angle))/d>.3)&&this.clearSight(p,z);}).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));}
 shove(){if(this.life.seated&&!this.life.stand())return;
  if(this.driving||this.paused||this.dead||this.weapon!=='bat'||this.attackCooldown>0)return;
  if(this.player.stamina<18){this.say('Too exhausted to shove.');return;}
  this.pendingShove=this.player.stamina/MAX_STAMINA;
  this.player.stamina-=18;this.shoveTime=SHOVE_DURATION;this.attackCooldown=.95;this.sound=Math.max(this.sound,7);
 }
 resolveShove(){
  const energy=this.pendingShove??0;this.pendingShove=undefined;
  const targets=this.meleeTargets(1.65).filter(z=>(z.downUntil||0)<=this.elapsed).slice(0,3);let fallen=0;
  targets.forEach((z,i)=>{const dx=z.x-this.player.x,dy=z.y-this.player.y,d=Math.hypot(dx,dy)||1;
   const alignment=(dx*Math.cos(this.player.angle)+dy*Math.sin(this.player.angle))/d;
   const chance=Math.max(.12,Math.min(.84,.27+energy*.42+Math.max(0,alignment-.3)*.22-Math.max(0,d-1)*.22-i*.13));
   const knocked=Math.random()<chance;z.hit=knocked?.45:.24;z.angle=this.player.angle;z.pushX=dx/d*(knocked?5:1.8);z.pushY=dy/d*(knocked?5:1.8);z.moving=false;z.carContact=0;
   if(knocked){z.downAt=this.elapsed;z.downUntil=this.elapsed+4.8;fallen++;}
  });
  this.say(fallen?'Knocked down · Step in and finish them.':targets.length?'They staggered but kept their footing.':'Your shove missed.');
 }
 attack(){if(this.life.seated&&!this.life.stand())return;
  if(this.driving||this.paused||this.dead||this.won||this.attackCooldown>0)return;
  if(this.weapon==='rifle'){this.fire();return;}
  if(this.meleeKind==='crowbar'&&!this.bag.Crowbar){this.say('Your crowbar is no longer in your inventory. Shove to escape.');return;}
  if(this.life.batCondition<=0){this.say(this.meleeName+' needs repair. Use a repair wrap or shove to escape.');return;}
  if(this.player.stamina<12){this.say('Too exhausted. Catch your breath.');return;}
  const candidates=this.meleeTargets(1.9),target=candidates.find(z=>(z.downUntil||0)>this.elapsed)||candidates[0];
  this.groundAttack=!!target&&(target.downUntil||0)>this.elapsed;
  const cost=this.groundAttack?24:12;if(this.player.stamina<cost){this.say('Too exhausted for an overhead strike.');return;}
  this.player.stamina-=cost;this.attackDuration=this.groundAttack?FINISHER_DURATION:ATTACK_DURATION;this.attackCooldown=this.groundAttack?1.18:.55;this.attackTime=this.attackDuration;this.sound=12;
  this.pendingMelee=target?{target,ground:this.groundAttack}:undefined;
 }
 resolveMelee(){
  const strike=this.pendingMelee;this.pendingMelee=undefined;if(!strike)return;
  const z=strike.target,p=this.player,d=Math.hypot(z.x-p.x,z.y-p.y);
  if(z.hp<=0||d>2.05||(z.floor||0)!==p.floor||!this.clearSight(p,z))return;
  this.life.batCondition=Math.max(0,this.life.batCondition-(strike.ground?1.4:.65));this.life.noise(p,12,10);
  z.hp-=strike.ground&&(z.downUntil||0)>this.elapsed?125:55;z.hit=.25;
  z.pushX=(z.x-p.x)/(d||1)*5;z.pushY=(z.y-p.y)/(d||1)*5;
  if(z.hp<=0){this.killZombie(z,strike.ground?'ground':'bat');this.say('One less. Keep moving.');}
 }

 vehicleBlocked(x:number,y:number){return !countyContains(x,y,.3)||this.wallBlocked(x,y)||[...this.solids.near(x,y,.5)].some(b=>pointIn(b,x,y,.15))||this.houses.some(h=>inBuilding(h,x,y,.4));}
 toggleVehicle(chosen?:VehicleState){if(this.life.seated&&!this.life.stand())return;if(this.player.floor)return;if(this.paused||this.dead||this.won)return;if(!this.driving){const candidate=chosen&&this.vehicles.includes(chosen)&&Math.hypot(chosen.x-this.player.x,chosen.y-this.player.y)<=3.5?chosen:chosen?undefined:this.vehicles.filter(v=>Math.hypot(this.player.x-v.x,this.player.y-v.y)<=3.5).sort((a,b)=>Math.hypot(this.player.x-a.x,this.player.y-a.y)-Math.hypot(this.player.x-b.x,this.player.y-b.y))[0];if(!candidate){this.say('Move closer to a vehicle, then press F.');return;}if((candidate.fuel||0)<=0||(candidate.battery||0)<=0){this.say('Vehicle needs '+((candidate.fuel||0)<=0?'fuel':'a battery')+'. Right-click it for vehicle actions.');return;}candidate.battery=Math.max(0,(candidate.battery||100)-.4);this.vehicle=candidate;this.driving=true;this.player.x=this.vehicle.x;this.player.y=this.vehicle.y;this.player.aiming=false;this.say('W / S · Accelerate / reverse    A / D · Steer    F · Exit');}else{if(Math.abs(this.vehicle.speed)>1){this.say('Stop the car before getting out.');return;}for(const offset of [Math.PI/2,-Math.PI/2,Math.PI,0]){const angle=this.vehicle.angle+offset,x=this.vehicle.x+Math.cos(angle)*2,y=this.vehicle.y+Math.sin(angle)*2;if(!this.vehicleBlocked(x,y)&&!this.vehicles.some(v=>carContains(v,x,y,.24))){this.driving=false;this.vehicle.speed=0;this.player.x=x;this.player.y=y;this.say('You step out of the vehicle.');return;}}this.say('No clear space to get out.');}}
 drive(dt:number,steer:number,throttle:number){
 const v=this.vehicle,handling=VEHICLES[v.kind||'wagon'];if((v.fuel||0)<=0||(v.battery||0)<=0){v.speed=0;this.say('Engine stopped. Exit and right-click the car to service it.');return;}v.fuel=Math.max(0,(v.fuel||0)-dt*(.001+Math.abs(v.speed)*(v.kind==='sports'?.0005:.00027)));v.battery=Math.min(100,(v.battery||0)+dt*.02);if((v.condition??100)<=0){v.speed=0;this.player.x=v.x;this.player.y=v.y;return;}steer=Math.max(-1,Math.min(1,steer));throttle=Math.max(-1,Math.min(1,throttle));v.speed=Math.max(-5,Math.min(handling.speed*(.65+(v.condition??100)*.0035),(v.speed+throttle*handling.accel*dt)*Math.exp(-dt*(throttle?.25:2.2))));
 const turn=steer*handling.steer*dt*Math.min(1,Math.abs(v.speed)/2)*(v.speed<0?-1:1),distance=v.speed*dt,steps=Math.max(1,Math.ceil((Math.abs(distance)+Math.abs(turn)*1.8)/.10));
 for(let i=0;i<steps;i++){
  const angle=v.angle+turn/steps,x=v.x+Math.cos(angle)*distance/steps,y=v.y+Math.sin(angle)*distance/steps,candidate={...v,x,y,angle};
  const gen=this.life.generator;const collision=!countyContains(x,y,2)||!!gen&&carOverlap(candidate,{x:gen.x-.6,y:gen.y-.35,w:1.2,d:.7,height:.9,kind:'generator'})||this.survival.buildings.some(b=>b.floor===0&&this.survival.blocks(b)&&carOverlap(candidate,this.survival.solid(b)))||[...this.solids.near(x,y,2)].some(b=>carOverlap(candidate,b))||this.houses.some(h=>footprint(h).some(b=>carOverlap(candidate,{...b,x:h.x+b.x,y:h.y+b.y,height:3,kind:'house'})))||this.vehicles.some(other=>other!==v&&[-1.4,0,1.4].some(f=>[-.7,.7].some(l=>carContains(other,x+Math.cos(angle)*f-Math.sin(angle)*l,y+Math.sin(angle)*f+Math.cos(angle)*l,.12))));
  if(collision){
   const impact=Math.abs(v.speed);
   // Parking nudges are harmless. Damage grows gradually and a single crash is capped.
   if(impact>balance.harmlessBumpSpeed){const force=impact-balance.harmlessBumpSpeed,damage=Math.min(18,.3*force+.018*force*force);v.condition=Math.max(0,(v.condition??100)-damage);
    const injury=Math.min(24,Math.max(0,impact-balance.occupantInjurySpeed)**2*.055);if(injury>0){this.player.hp=Math.max(0,this.player.hp-injury);this.life.pain=Math.min(100,this.life.pain+injury);this.damageTime=.55;}
    this.sound=Math.max(this.sound,30);
    this.say((v.condition<=0?'Vehicle wrecked. Exit and use a repair kit.':'Collision! Vehicle condition: '+Math.ceil(v.condition)+'%')+(injury>=1?' · You lost '+Math.ceil(injury)+' health.':''));
   }v.speed=0;break;
  }v.x=x;v.y=y;v.angle=angle;
  for(const z of this.zombies){if(z.hp<=0||z.floor||!carContains(v,z.x,z.y,.23))continue;if(Math.abs(v.speed)>2.5)this.killZombie(z,'vehicle',v.angle+(v.speed<0?Math.PI:0));else this.pushFromCars(z);}
 }
 if(v.trunk){v.trunk.x=v.x;v.trunk.y=v.y;}this.world.relocateVehicle(v);this.player.x=v.x;this.player.y=v.y;this.player.angle=v.angle;this.sound=Math.max(this.sound,18);
 }
 canLoot(crate:LootCrate){const home=this.inside(crate);if(!this.crates.includes(crate)||crate.furnitureId&&home?.removedFurniture?.[(crate.floor||0)+':'+crate.furnitureId])return false;if((crate.floor||0)!==this.player.floor||this.driving||this.dead||this.won||Math.hypot(this.player.x-crate.x,this.player.y-crate.y)>3||this.inside(this.player)!==this.inside(crate))return false;for(let t=.1;t<1;t+=.1)if(this.wallBlocked(this.player.x+(crate.x-this.player.x)*t,this.player.y+(crate.y-this.player.y)*t))return false;return true;}
 loot(crateId:string,itemId?:string){const crate=this.crates.find(c=>c.id===crateId);if(!crate||this.paused||!this.canLoot(crate))return 0;let taken=0;for(const item of crate.items){if(itemId&&item.id!==itemId)continue;taken+=this.life.transfer(crate,item.kind,false,item.quantity);}this.say(taken?`Packed ${taken} items. right-click objects for actions; I opens inventory.`:'Nothing taken. Check your carrying space.');return taken;}

 clearSight(a:Point,b:Point){if((a.floor||0)!==(b.floor||0))return false;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<.01)return true;return ![...this.houses.flatMap(walls),...this.survival.buildings.filter(b=>b.floor===(a.floor||0)&&this.survival.blocksSight(b)).map(b=>this.survival.solid(b))].some(w=>rayBox(a.x,a.y,dx/d,dy/d,w)<d-.1);}
 toggleDoor(h=this.nearHouse()){if(this.player.floor){this.say('Go downstairs to reach the front door.');return;}if(!h||this.driving||this.paused||this.dead||this.won)return;const d=this.doorPoint(h);if(this.inside(this.player)!==h&&Math.hypot(this.player.x-d.x,this.player.y-d.y)>2){this.say('Move closer to the front door.');return;}if(h.locked){this.say('Locked. Use a pry bar from its right-click menu to force the door.');return;}if((h.barricade||0)>0){this.say('Barricaded. Remove the barricade from its right-click menu first.');return;}if(!h.door){this.life.alarm(h);}if((h.doorHp??80)<=0&&h.door){this.say('Door destroyed. Reinforce and repair it from its right-click menu.');return;}h.door=!h.door;this.life.noise(this.player,7,8);this.doorSound={serial:this.doorSound.serial+1,open:h.door};this.say(h.door?'Front door opened.':'Front door closed. Keep quiet; pursuers may still investigate.');}
 interact(){if(this.life.seated){this.life.stand();return;}if(this.paused||this.dead||this.driving)return;if(!this.survival.interact())this.toggleDoor();}
 walkStairs(dx:number,dy:number){
  const p=this.player,h=this.inside(p);if(!h||this.driving)return false;
  if(!this.stairTravel){
   for(const base of [p.floor,p.floor-1]){
    if(base<0||base>=(h.floors||1)-1)continue;
    const at=stairPoint(h,base),up=base===p.floor,entry=at.y-(up?0:STAIR_LENGTH);
    if(Math.abs(p.x+dx-at.x)>STAIR_WIDTH/2+.12)continue;
    if(up?dy<0&&p.y>=entry&&p.y+dy<entry:dy>0&&p.y<=entry&&p.y+dy>entry){this.stairTravel={house:h,base,progress:up?0:1};break;}
   }
  }
  const travel=this.stairTravel;if(!travel)return false;
  const at=stairPoint(travel.house,travel.base);
  // The slope slows horizontal travel; movement, stopping and reversing remain player-controlled.
  travel.progress=Math.max(0,Math.min(1,travel.progress-dy/(STAIR_LENGTH*1.8)));
  p.x=Math.max(at.x-STAIR_WIDTH/2+.15,Math.min(at.x+STAIR_WIDTH/2-.15,p.x+dx));p.y=at.y-travel.progress*STAIR_LENGTH;
  p.floor=travel.base+(travel.progress>=.5?1:0);
  if(travel.progress===0||travel.progress===1){p.floor=travel.base+(travel.progress===1?1:0);p.y+=travel.progress===1?-.015:.015;this.stairTravel=undefined;}
  return true;
 }
 selectGun(kind:GunKind){if(!this.ownedGuns.includes(kind)||this.dead||this.driving)return;if(this.gun===kind){this.equip('rifle',true);return;}this.reserve+=this.ammo;this.gun=kind;this.ammo=Math.min(this.firearm.capacity,this.reserve);this.reserve-=this.ammo;this.equip('rifle',true);this.attackCooldown=.8;this.say(this.firearm.name+' equipped.');}
 use(item:string){if(this.dead||this.won)return;if(item==='Crowbar'&&this.bag.Crowbar){this.meleeKind='crowbar';this.equip('bat',true);return;}if(clothingKind(item)){this.say(this.inventory.wear(item)?'Clothing changed.':'Make room for your current clothes first.');return;}if(item==='helmet'||item==='kevlar'){this.say(this.inventory.equipArmor(item)?'Armor equipped.':'That armor is already equipped or unavailable.');return;}if(this.survival.packed.has(item)){this.survival.placeFromInventory(item);return;}if(!this.bag[item]){this.say(`No ${item.toLowerCase()} left. Search the houses.`);return;}const foundGun=({Carbine:'carbine',Pistol:'pistol',Shotgun:'shotgun',HuntingRifle:'hunting',SMG:'smg'} as Record<string,GunKind>)[item];
 if(foundGun){if(!this.ownedGuns.includes(foundGun))this.ownedGuns.push(foundGun);this.selectGun(foundGun);}
 else if(item==='MapNote'){
  const before=this.life.discoveries.length;
  const near=SETTLEMENTS.slice().sort((a,b)=>Math.hypot(a.cx*46-this.player.x,a.cy*46-this.player.y)-Math.hypot(b.cx*46-this.player.x,b.cy*46-this.player.y));
  const candidates=[[1,0],[0,1],[-1,0],...near.flatMap(t=>[[t.cx,t.cy],[t.cx+1,t.cy],[t.cx,t.cy+1],[t.cx-1,t.cy]])];
  for(const [x,y]of candidates){for(const h of this.world.region(x,y).houses)this.life.discover(h);if(this.life.discoveries.length-before>=3)break;}
  const added=this.life.discoveries.length-before;if(!added){this.say('These map annotations are already marked.');return;}
  this.say(added+' supply sites marked on M. Expand the map annotations for details.');}

 else if(item==='ElectricalGuide'){if(!this.life.learned.includes('electrical'))this.life.learned.push('electrical');this.survival.gain('mechanics',40);this.say('Generator installation learned. Claim a home and right-click clear ground outdoors.');}
 else if(item==='BatRepair'){this.life.batCondition=Math.min(100,this.life.batCondition+55);this.say(this.meleeName+' repaired.');}
 else if(item==='RottenFood'||item==='FreshFish'){this.say(item==='FreshFish'?'Cook raw fish at a fire first.':'Spoiled food is unsafe. Right-click a garden to add compost.');return;}
 else if(['Berries','CookedFish','PreservedFood'].includes(item)){this.player.hunger=Math.min(100,this.player.hunger+(item==='Berries'?10:item==='CookedFish'?45:35));this.say('You eat '+ITEM_INFO[item].name.toLowerCase()+'.');}
 else if(item==='Manual'||item==='MedicalGuide'){this.survival.gain(item==='Manual'?'carpentry':'firstaid',35);this.say('Read the guide. New techniques learned.');}
 else if(item==='EnergyBar'||item==='Stew'){this.player.hunger=Math.min(100,this.player.hunger+(item==='Stew'?60+this.survival.level('cooking')*5:20));this.player.stamina=Math.min(MAX_STAMINA,this.player.stamina+35);if(item==='Stew')this.player.thirst=Math.min(100,this.player.thirst+15);this.say('A welcome meal.');}
 else if(item==='Painkillers'){this.life.pain=Math.max(0,this.life.pain-45);this.say('Pain eased.');}
 else if(item==='RepairKit'){const v=this.vehicles.find(v=>Math.hypot(v.x-this.player.x,v.y-this.player.y)<3.5);if(!v){this.say('Stand beside a vehicle.');return;}v.condition=Math.min(100,(v.condition??100)+35+this.survival.level('mechanics')*5);this.survival.gain('mechanics',15);this.say('Vehicle repaired.');}
 else if(item in FOODS){const food=FOODS[item as keyof typeof FOODS];this.player.hunger=Math.min(100,this.player.hunger+food.hunger);this.player.thirst=Math.min(100,this.player.thirst+food.water);this.say('You eat '+food.name.toLowerCase()+'.');}else if(item==='Beans'){this.player.hunger=Math.min(100,this.player.hunger+32);this.say('A cold meal. It will do.');}else if(item==='Water'){this.player.thirst=Math.min(100,this.player.thirst+40);this.say('You drink some clean water.');}else if(item==='Bandage'){if(this.player.hp>=100&&!this.life.bleeding){this.say('No wounds to dress. Save the bandage.');return;}this.life.bleeding=0;this.player.hp=Math.min(100,this.player.hp+12+this.survival.level('firstaid')*3);this.survival.gain('firstaid',10);this.say('Wounds dressed. Keep them clean.');}else if(item==='Plank'){this.say('Right-click a door or window to barricade it.');return;}else{this.say('Use this material or tool in the B crafting menu.');return;}this.bag[item]--;}
}
