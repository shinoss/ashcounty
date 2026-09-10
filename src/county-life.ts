import {activityFor,type ActivityKind,type ActivityPose} from './activity';
import {targetExists} from './world-actions';
import type {ActionTarget} from './world-actions';
import type {Simulation,Point,House} from './sim';
import type {LootCrate,LootKind} from './loot';
import {ITEM_INFO} from './inventory';
import {ENCOUNTERS,AMMO_KIND,VEHICLE_TANK} from './expedition-content';
import {furniture} from './collision';
import {FOODS} from './food';
import {SURVIVAL_BALANCE as balance} from './survival-balance';
export type Mode='survival'|'sandbox';
export type Discovery={x:number;y:number;name:string;hint:string};
type Job={activity:ActivityKind;label:string;elapsed:number;duration:number;start:Point;hp:number;complete:()=>void;valid?:()=>boolean};
export class CountyLife{
 seated:{target:ActionTarget;exit:Point;hp:number}|undefined;
 felledTrees:{x:number;y:number;variant:number;angle:number;at:number}[]=[];
 get actionPose():ActivityPose|undefined{const j=this.job;if(j)return {kind:j.activity,elapsed:j.elapsed,duration:j.duration};const pickup=this.s.survival.pickupJob;return pickup?{kind:'carry',elapsed:pickup.elapsed,duration:pickup.duration}:undefined;}
 mode:Mode='survival';fatigue=0;bleeding=0;pain=0;batCondition=100;learned:string[]=[];
 ammo:Record<string,number>={Ammo:24,PistolAmmo:0,Shells:0,RifleAmmo:0};
 discoveries:Discovery[]=[];home:Point|null=null;generator:{x:number;y:number;fuel:number;on:boolean}|null=null;
 gardens:{x:number;y:number;planted:number;watered:boolean}[]=[];gathered:Record<string,number>={};foodAge:Record<string,number>={};
 hornSerial=0;
 entranceDamage=new Map<string,number>();
 entranceHit(at:Point,dt:number,rate:number,cap:number){
  const key=at.x+','+at.y+','+(at.floor||0),used=this.entranceDamage.get(key)||0;
  const hit=Math.max(0,Math.min(rate*dt,cap*dt-used));this.entranceDamage.set(key,used+hit);return hit;
 }
 noises:{x:number;y:number;floor:number;radius:number;until:number;duration:number;id:number}[]=[];noiseId=0;pathBudget=3;noiseAt=0;slowTick=0;
 alarms:{x:number;y:number;until:number;next:number}[]=[];announcedDay=1;job:Job|undefined;saveStatus='Not saved yet';saveError='';lastSave=0;openTrunk:LootCrate|undefined;openWorkshop=false;
 constructor(public s:Simulation){}
 get hours(){return (8*60+24+this.s.elapsed*.7)/60;}
 get day(){return 1+Math.floor(this.hours/24);}
 get night(){const hour=this.hours%24;return hour<6||hour>20;}
 get raining(){return Math.floor(this.hours/4)%5===3;}
 get power(){return this.day<3;}
 get water(){return this.day<5;}
 get homeHouse(){return this.home?this.s.houses.find(h=>h.x===this.home!.x&&h.y===this.home!.y):undefined;}
 powered(at:Point){return this.power||!!this.generator?.on&&this.generator.fuel>0&&Math.hypot(at.x-this.generator.x,at.y-this.generator.y)<18;}
 get speedFactor(){return Math.max(.52,1-this.fatigue*.002-this.pain*.0025-Math.max(0,this.s.inventory.weight-25)*.008);}
 get nearShelter(){const p=this.s.player;return this.s.inside(p)||this.s.houses.find(h=>p.x>h.x-2&&p.x<h.x+h.w+2&&p.y>h.y-2&&p.y<h.y+h.d+2);}
 get nearbyCar(){return this.s.driving?this.s.vehicle:this.s.vehicles.filter(v=>Math.hypot(v.x-this.s.player.x,v.y-this.s.player.y)<3.8).sort((a,b)=>Math.hypot(a.x-this.s.player.x,a.y-this.s.player.y)-Math.hypot(b.x-this.s.player.x,b.y-this.s.player.y))[0];}
 start(mode:Mode){this.mode=mode;if(mode==='survival'){this.s.ownedGuns=[];this.s.ammo=0;this.ammo.Ammo=0;this.s.armorEquipped={helmet:false,kevlar:false};this.s.bag={Beans:2,Water:2,Bandage:2,MapNote:1,Crowbar:1};for(const v of this.s.vehicles)if(v.id.startsWith('0,0:')){v.fuel=v.kind==='sports'?0:3;}}else{this.ammo={Ammo:72,PistolAmmo:90,Shells:30,RifleAmmo:24};this.s.bag.MapNote=1;this.s.bag.Jerrycan=1;}this.s.bag.Saw=1;this.s.bag.Crowbar=1;this.s.meleeKind='crowbar';this.s.weapon='bat';this.s.inventory.sync();this.s.say('Right-click objects for actions. Read your supply map in I. Autosave is on.');}
 noise(at:Point,radius:number,duration=18){
  // Indoor movement and ordinary tasks still have audio, but don't create an
  // investigation target. Gunfire, shattering glass and alarms remain audible.
  if(this.s.inside(at)&&radius<balance.indoorLoudNoiseThreshold)return;
  this.noises.push({x:at.x,y:at.y,floor:at.floor||0,radius,duration,id:++this.noiseId,until:this.s.elapsed+3});
 }
 alarm(h:House){if(!h.alarmArmed)return;h.alarmArmed=false;this.alarms.push({x:h.x+h.w/2,y:h.y+h.d,until:this.s.elapsed+35,next:0});this.s.say('The alarm is sounding! Zombies are investigating.');}
 discover(h:House){if((!h.encounter&&!h.layout)||this.discoveries.some(d=>d.x===h.x&&d.y===h.y))return;const e=ENCOUNTERS.find(e=>e.id===h.encounter);const name=e?.name||h.name;this.discoveries.push({x:h.x,y:h.y,name,hint:e?.hint||'A major destination with specialised rooms and supplies.'});this.s.say('Discovered: '+name+' · Marked on M');}
 quantity(k:string){return k===AMMO_KIND[this.s.gun]?this.s.reserve:k in this.ammo?this.ammo[k]:this.s.bag[k]||0;}
 setQuantity(k:string,n:number){if(k in this.ammo)this.ammo[k]=n;else this.s.bag[k]=n;}
 canCarry(k:string,n=1){const info=ITEM_INFO[k];if(!info)return false;this.s.inventory.sync();return this.s.inventory.weight+info.weight*n<=42&&(this.quantity(k)>0||!!this.s.inventory.findSpot(k,'backpack')||!!this.s.inventory.findSpot(k,'pockets'));}
 canMake(cost:Record<string,number>,kind:string,n=1){
  const info=ITEM_INFO[kind];if(!info)return false;this.s.inventory.sync();
  const freed=Object.entries(cost).reduce((w,[k,q])=>w+(ITEM_INFO[k]?.weight||0)*q,0);
  if(this.s.inventory.weight-freed+info.weight*n>42)return false;
  if(this.quantity(kind)-(cost[kind]||0)>0)return true;
  const stacks=this.s.inventory.stacks.filter(a=>this.quantity(a.kind)-(cost[a.kind]||0)>0);
  for(const [container,w,h]of [['pockets',6,2],['backpack',8,6]] as const)for(let y=0;y<=h-info.h;y++)for(let x=0;x<=w-info.w;x++)if(!stacks.some(a=>a.container===container&&x<a.x+ITEM_INFO[a.kind].w&&x+info.w>a.x&&y<a.y+ITEM_INFO[a.kind].h&&y+info.h>a.y))return true;
  return false;
 }
 add(k:string,n=1){if(!this.canCarry(k,n)){this.s.say('No carrying space. Store supplies in a container or trunk first.');return false;}this.setQuantity(k,this.quantity(k)+n);this.s.inventory.sync();return true;}
 available(cost:Record<string,number>){return Object.entries(cost).every(([k,n])=>this.quantity(k)>=n);}
 spend(cost:Record<string,number>){for(const [k,n]of Object.entries(cost))this.setQuantity(k,this.quantity(k)-n);}
 transfer(crate:LootCrate,kind:string,deposit=false,n=1){
  const s=this.s;if(!s.canLoot(crate)||s.paused)return 0;if(deposit&&kind==='Crowbar'&&s.meleeKind==='crowbar'&&this.quantity(kind)<=n){s.say('Keep your equipped crowbar; only spare crowbars can be stored.');return 0;}
  let existing=crate.items.find(i=>i.kind===kind&&(deposit||i.quantity>0));const count=Math.min(n,deposit?this.quantity(kind):existing?.quantity||0);if(count<=0)return 0;
  let moved=0;
  for(let i=0;i<count;i++){
   if(deposit){const weight=crate.items.reduce((sum,a)=>sum+(ITEM_INFO[a.kind]?.weight||.2)*a.quantity,0);if(weight+(ITEM_INFO[kind]?.weight||0)>(crate.capacity||100)){s.say('This container is full.');break;}
    this.setQuantity(kind,this.quantity(kind)-1);if(existing)existing.quantity++;else{existing={id:crate.id+':stored:'+kind,kind:kind as LootKind,quantity:1};crate.items.push(existing);}
   }else{if(!this.add(kind))break;existing!.quantity--;}
   moved++;
  }
  if(moved){s.inventory.sync();if(!deposit){const h=s.inside(crate);if(h)this.alarm(h);s.survival.gain('scavenging',1);}if(kind in FOODS||['FreshFish','CookedFish','Berries'].includes(kind)){const age=deposit?this.foodAge[kind]||0:crate.foodAge?.[kind]||0;if(deposit)(crate.foodAge??={})[kind]=Math.max(crate.foodAge?.[kind]||0,age);else this.foodAge[kind]=Math.max(this.foodAge[kind]||0,age);if(this.quantity(kind)<=0)delete this.foodAge[kind];}}
  return moved;
 }
 begin(label:string,duration:number,complete:()=>void){if(this.seated&&!this.stand())return;if(this.s.dead||this.s.paused||this.s.driving||this.job)return;this.job={activity:activityFor(label),label,elapsed:0,duration,start:{...this.s.player},hp:this.s.player.hp,complete};this.s.say(label+' · Stay still. Move to cancel.');return this.job;}
 sit(t:ActionTarget){
  const p=this.s.player;if(this.s.driving||this.s.stairTravel||this.s.dead||!targetExists(this.s,t))return;
  const rotation=(t.construction?.rotation||0)*Math.PI/2,angle=Math.PI/2+rotation;
  this.job=undefined;this.s.survival.pickupJob=undefined;this.seated={target:t,exit:{x:p.x,y:p.y,floor:p.floor},hp:p.hp};
  p.x=t.x-Math.cos(angle)*.08;p.y=t.y-Math.sin(angle)*.08;p.angle=angle;p.moving=false;
  this.s.say('Sitting · Restoring fatigue and stamina. Move or press E to stand.');
 }
 stand(){
  const seat=this.seated;if(!seat)return true;const s=this.s,p=s.player,home=s.inside(p),candidates=[seat.exit];
  for(const r of [1,1.5,2,2.5])for(let i=0;i<8;i++)candidates.push({x:p.x+Math.cos(i*Math.PI/4)*r,y:p.y+Math.sin(i*Math.PI/4)*r,floor:p.floor});
  const at=candidates.find(q=>s.inside(q)===home&&!s.blocked(q.x,q.y,p.floor,home));if(!at){s.say('The way off the seat is blocked.');return false;}
  this.seated=undefined;p.x=at.x;p.y=at.y;return true;
 }
 update(dt:number){
  const s=this.s;this.pathBudget=3;this.felledTrees=this.felledTrees.filter(t=>s.elapsed-t.at<4);if(this.seated){if(s.player.hp<this.seated.hp||!targetExists(s,this.seated.target)||s.attackTime>0||s.shoveTime>0||s.player.aiming)this.stand();else{this.fatigue=Math.max(0,this.fatigue-dt*1.4);s.player.stamina=Math.min(200,s.player.stamina+dt*20);}}this.noises=this.noises.filter(n=>n.until>s.elapsed);
  this.alarms=this.alarms.filter(a=>a.until>s.elapsed);for(const a of this.alarms)if(a.next<s.elapsed){a.next=s.elapsed+2;this.noise({x:a.x,y:a.y-.5},62,30);}
  if(this.job){const j=this.job;if(j.valid&&!j.valid()||j.label==='Resting'&&s.zombies.some(z=>z.hp>0&&z.alert&&Math.hypot(z.x-s.player.x,z.y-s.player.y)<10)||s.player.hp<j.hp||s.attackTime>0||s.shoveTime>0||s.driving||s.stairTravel||Math.hypot(s.player.x-j.start.x,s.player.y-j.start.y)>.12){this.job=undefined;s.say('Action interrupted.');}else{j.elapsed+=dt;if(j.elapsed>=j.duration){this.job=undefined;j.complete();}}}
  if(s.elapsed>this.noiseAt){this.noiseAt=s.elapsed+1.2;if(s.driving&&Math.abs(s.vehicle.speed)>.5)this.noise(s.player,s.vehicle.kind==='sports'?28:s.vehicle.kind==='van'?24:18);else if(s.player.moving&&!s.player.sneaking)this.noise(s.player,(s.player.running?13:5)*(s.inside(s.player)?.curtains?.65:1),9);}
  this.fatigue=Math.min(100,this.fatigue+dt*(s.player.running?.065:.025));this.pain=Math.max(0,this.pain-dt*.015);if(this.bleeding>0)s.player.hp-=dt*this.bleeding*.06;
  if(this.generator?.on&&this.generator.fuel>0){this.generator.fuel=Math.max(0,this.generator.fuel-dt*.002);if(Math.floor(s.elapsed)%4===0&&s.elapsed>this.slowTick)this.noise(this.generator,22,12);}
  if(this.day!==this.announcedDay){this.announcedDay=this.day;s.say(this.day===2?'Day 2 · Grid power fails tomorrow. Find a generator and fuel.':this.day===3?'The grid has failed. Refrigerators and gas pumps need generator power.':this.day===4?'Day 4 · The taps run dry tomorrow. Prepare stored water.':this.day===5?'The taps have run dry. Rain collectors and stored water matter now.':'Another day in Ash County.');}
  if(s.elapsed<this.slowTick)return;this.slowTick=s.elapsed+1;
  for(const h of s.houses)if(Math.hypot(h.x+h.w/2-s.player.x,h.y+h.d/2-s.player.y)<17)this.discover(h);
  const decay=(kind:string,age:Record<string,number>,n:number,cold=false,seconds=1)=>{if(n<=0){delete age[kind];return false;}if(!(kind in FOODS)&&!['FreshFish','CookedFish','Berries'].includes(kind))return false;age[kind]=(age[kind]||0)+(cold?.08:1)*seconds;return age[kind]>(kind==='FreshFish'?600:1200);};
  for(const k of Object.keys(s.bag))if(decay(k,this.foodAge,s.bag[k])){const n=s.bag[k];s.bag[k]=0;s.bag.RottenFood=(s.bag.RottenFood||0)+n;s.say('Some food in your pack has spoiled.');}
  for(const c of s.crates){const ages=c.foodAge??={},seconds=Math.max(0,s.elapsed-(c.agedAt??0));c.agedAt=s.elapsed;for(const i of [...c.items])if(decay(i.kind,ages,i.quantity,!!c.fridge&&this.powered(c),seconds)){const old=i.quantity;i.quantity=0;const rotten=c.items.find(a=>a.kind==='RottenFood');if(rotten)rotten.quantity+=old;else c.items.push({id:c.id+':rot',kind:'RottenFood',quantity:old});}}
  if(this.raining)for(const g of this.gardens)g.watered=true;
  s.inventory.sync();
 }
 act(id:string,target?:ActionTarget){
  const s=this.s,p=s.player,h=target?target.house:this.nearShelter,v=target?target.vehicle:this.nearbyCar,at=target||p;
  const need=(cost:Record<string,number>)=>{if(this.available(cost))return true;s.say('Need '+Object.entries(cost).map(([k,n])=>n+' '+(ITEM_INFO[k]?.name||k)).join(', '));return false;};
  const timed=(label:string,seconds:number,cost:Record<string,number>,fn:()=>void)=>{if(need(cost))this.begin(label,seconds,()=>{if(!need(cost))return;this.spend(cost);fn();});};
  if(id==='claim'&&h){this.home={x:h.x,y:h.y};s.say('Home marked on M. Stock its containers and reinforce its entrances.');}
  if(id==='pry'&&h){if(!s.bag.Crowbar){s.say('Find a pry bar to open the locked door.');return;}this.noise(p,14);this.begin('Prying door',5,()=>{h.locked=false;h.door=true;this.alarm(h);s.say('Lock forced open.');});}
  if(id==='barricade'&&h){if(!s.bag.Hammer){s.say('A hammer is required.');return;}timed('Reinforcing entrances',4,{Plank:2,Nails:2},()=>{if(target?.kind==='window'){h.windowHp=100+s.survival.level('carpentry')*25;h.windowBroken=false;}else{h.door=false;h.barricade=(h.barricade||0)+100+s.survival.level('carpentry')*25;h.doorHp=Math.max(80,h.doorHp||0);}s.survival.gain('carpentry',18);s.say(target?.kind==='window'?'Window barricaded.':'Door barricaded. Remove the boards before opening it.');});}
  if(id==='unbarricade'&&h)this.begin('Removing door barricade',2,()=>{h.barricade=0;this.add('Plank',1);s.say('Door is usable again.');});
  if(id==='curtains'&&h)timed('Hanging curtains',2,{Cloth:2},()=>{h.curtains=true;s.say('Curtains hung. Quieter movement inside attracts less attention.');});
  if(id==='remove-curtains'&&h)this.begin('Removing curtains',2,()=>{if(this.add('Cloth',2)){h.curtains=false;s.say('Curtains removed.');}});
  if(id==='window'&&h&&p.floor===0){const x=h.x+h.w/2,y=h.y;const inside=s.inside(p)===h;const at={x,y:y+(inside?-1:1)};if(Math.hypot(p.x-x,p.y-y)>2){s.say('Move beside the rear window.');return;}if((h.windowHp||0)>45){this.begin('Removing window boards',3,()=>{h.windowHp=45;s.say('Rear window boards removed.');});return;}if(!h.windowBroken){h.windowBroken=true;h.windowHp=0;this.noise(p,24);s.say('Glass shattered. Use the window again to climb through.');}else if(!s.blocked(at.x,at.y,0,inside?undefined:h)){this.begin('Climbing through window',2,()=>{p.x=at.x;p.y=at.y;});}}
  if(id==='drink'&&h){if(!this.water){s.say('The taps have run dry. Build a water collector.');return;}p.thirst=Math.min(100,p.thirst+50);s.say('You drink from the tap.');}
  if(id==='fill'&&h){if(!this.water){s.say('The water supply is off.');return;}this.add('Water',1);}
  if(id==='rest'){const bed=target?(target.construction?.kind==='bed'||target.pickup?.furnishing?.kind==='bed'):(s.survival.near('bed')||h&&furniture(h,p.floor).find(b=>b.kind==='bed'&&Math.hypot(b.x-p.x,b.y-p.y)<3));if(!bed){s.say('Stand near a bed or build a bedroll.');return;}if(s.zombies.some(z=>z.hp>0&&z.alert&&Math.hypot(z.x-p.x,z.y-p.y)<12)){s.say('You cannot rest while being pursued.');return;}this.begin('Resting',18,()=>{this.fatigue=Math.max(0,this.fatigue-65);p.stamina=200;if(!this.bleeding)p.hp=Math.min(100,p.hp+12);s.say('Rested. Another trip feels possible.');});}
  if(id==='trunk'&&v){this.openTrunk=v.trunk;s.say('Trunk opened.');}
  if(id==='refuel'&&v){const n=Math.min(this.quantity('Petrol'),Math.ceil(VEHICLE_TANK[v.kind||'wagon']-(v.fuel||0)));if(n<=0){s.say('No petrol available, or the tank is full.');return;}timed('Refuelling vehicle',3,{Petrol:n},()=>{v.fuel=Math.min(VEHICLE_TANK[v.kind||'wagon'],(v.fuel||0)+n);s.say('Added '+n+' litres.');});}
  if(id==='siphon'&&v){if(!need({Jerrycan:1}))return;const n=Math.min(8,Math.floor(v.fuel||0));if(!n){s.say('The tank is empty.');return;}this.begin('Siphoning fuel',4,()=>{let taken=0;while(taken<n&&this.add('Petrol'))taken++;v.fuel=Math.max(0,(v.fuel||0)-taken);s.say('Siphoned '+taken+' litres.');});}
  if(id==='repair-car'&&v)timed('Repairing vehicle',4,{RepairKit:1},()=>{v.condition=Math.min(100,(v.condition??100)+35+s.survival.level('mechanics')*5);s.survival.gain('mechanics',15);s.say('Vehicle repaired.');});
  if(id==='battery'&&v)timed('Replacing battery',4,{Battery:1},()=>{v.battery=100;s.survival.gain('mechanics',15);s.say('New battery installed.');});
  if(id==='horn'&&v){this.hornSerial++;this.noise(v,55,25);s.say('Horn sounded. Nearby zombies are investigating.');}
  if(id==='pump'){const pump=target?.prop||s.world.active.flatMap(r=>r.props).find(a=>a.kind==='pump'&&Math.hypot(a.x-p.x,a.y-p.y)<4);if(!pump){s.say('Stand beside a gas pump.');return;}if(!this.powered(pump)){s.say('The pump needs electricity.');return;}if(need({Jerrycan:1}))this.begin('Filling jerrycan',4,()=>{let n=0;while(n<8&&this.add('Petrol'))n++;s.say('Collected '+n+' litres.');});}
  if(id==='generator'){const home=this.homeHouse;if(!home){s.say('Choose a home first and stand outside it.');return;}if(s.inside(p)||Math.hypot(p.x-home.x-home.w/2,p.y-home.y-home.d/2)>18){s.say('Install the generator outdoors, near home.');return;}if(!this.learned.includes('electrical')){s.say('Read the generator field guide first.');return;}const x=target?.x??p.x+Math.cos(p.angle)*1.5,y=target?.y??p.y+Math.sin(p.angle)*1.5;if(s.blocked(x,y)||s.inside({x,y})){s.say('Face a clear outdoor space for the generator.');return;}timed('Installing generator',5,{Generator:1},()=>{this.generator={x,y,fuel:0,on:false};s.say('Generator installed. Supply fuel and switch it on by right-clicking it.');});}
  if(id==='genfuel'&&this.generator&&Math.hypot(p.x-this.generator.x,p.y-this.generator.y)<4){const n=Math.min(this.quantity('Petrol'),Math.floor(20-this.generator.fuel));if(n>0){this.spend({Petrol:n});this.generator.fuel+=n;s.say('Generator fuel: '+this.generator.fuel.toFixed(1)+' L');}else s.say('Need petrol, or generator tank is full.');}
  if(id==='genpower'&&this.generator&&Math.hypot(p.x-this.generator.x,p.y-this.generator.y)<4){this.generator.on=!this.generator.on;s.say(this.generator.on?'Generator switched on. Noise can attract zombies.':'Generator switched off.');}
  if(id==='salvage'&&target?.construction?.furnishing){const b=target.construction;if(!need({Crowbar:1}))return;timed('Dismantling '+b.furnishing!.kind,5,{},()=>{s.survival.buildings=s.survival.buildings.filter(a=>a!==b);const r=s.world.region(Math.floor(b.x/46),Math.floor(b.y/46));r.crates.push({id:'salvage:'+s.elapsed,name:'Salvaged materials',x:b.x,y:b.y,floor:b.floor,items:[{id:'wood',kind:'Plank',quantity:3},{id:'scrap',kind:'Scrap',quantity:2},{id:'cloth',kind:'Cloth',quantity:2}]});r.revision=(r.revision||0)+1;s.refreshWorld();s.survival.gain('carpentry',15);this.noise(b,18);s.say('Materials left where the furniture stood.');});return;}
  if(id==='salvage'&&h){if(!need({Crowbar:1}))return;const f=target?.pickup?.solidId?furniture(h,p.floor).find(a=>a.id===target.pickup!.solidId):furniture(h,p.floor).find(a=>!['post','worklift','fridge','counter'].includes(a.kind)&&Math.hypot(a.x+a.w/2-p.x,a.y+a.d/2-p.y)<2.5);if(!f){s.say('Stand beside movable furniture to salvage it.');return;}const stored=s.crates.find(c=>c.furnitureId===f.id&&(c.floor||0)===p.floor);if(stored?.items.some(i=>i.quantity>0)){s.say('Empty this container before salvaging it.');return;}timed('Salvaging '+f.kind,5,{},()=>{(h.removedFurniture??={})[p.floor+':'+f.id]=true;const c:LootCrate={id:'salvage:'+s.elapsed,name:'Salvaged materials',x:f.x+f.w/2,y:f.y+f.d/2,floor:p.floor,capacity:100,items:[{id:'wood',kind:'Plank',quantity:3},{id:'parts',kind:'Scrap',quantity:2},{id:'cloth',kind:'Cloth',quantity:2}]};s.world.region(Math.floor(p.x/46),Math.floor(p.y/46)).crates.push(c);const changed=s.world.region(Math.floor(p.x/46),Math.floor(p.y/46));changed.revision=(changed.revision||0)+1;s.refreshWorld();s.survival.gain('carpentry',15);this.noise(p,18);s.say('Materials left where the furniture stood.');});}
  if(id==='chop'){
   const axe=this.quantity('Axe')>0;if(!axe&&!need({Saw:1}))return;
   const region=target?.region||s.world.active.find(r=>r.trees.some(t=>Math.hypot(t.x-p.x,t.y-p.y)<3)),tree=target?.tree||region?.trees.find(t=>Math.hypot(t.x-p.x,t.y-p.y)<3);if(!tree||!region)return;
   this.noise(p,22);this.begin(axe?'Chopping tree':'Sawing timber',axe?5.5:7,()=>{if(!this.add('Log',2))return;this.felledTrees.push({...tree,angle:p.angle,at:s.elapsed});region.trees.splice(region.trees.indexOf(tree),1);region.revision=(region.revision||0)+1;s.refreshWorld();s.survival.gain('carpentry',12);s.say('Two logs collected. Right-click a workbench or use B to saw planks.');});
  }
  if(id==='forage'){if(s.inside(at)||s.world.active.flatMap(r=>r.patches).some(t=>['road','parking','water'].includes(t.kind)&&at.x>t.x&&at.x<t.x+t.w&&at.y>t.y&&at.y<t.y+t.h)){s.say('Forage on grass or in woodland.');return;}const key=Math.floor(at.x/12)+','+Math.floor(at.y/12);if((this.gathered[key]||0)>s.elapsed){s.say('This patch has been searched. Try farther away.');return;}this.begin('Foraging',5,()=>{if(this.add('Berries',2)){this.gathered[key]=s.elapsed+1800;s.survival.gain('scavenging',10);s.say('Found safe blackberries.');}});}
  if(id==='fish'){if(!need({FishingRod:1}))return;const water=s.world.active.flatMap(r=>r.patches).some(w=>w.kind==='water'&&at.x>w.x-4&&at.x<w.x+w.w+4&&at.y>w.y-4&&at.y<w.y+w.h+4);if(!water){s.say('Stand on a safe bank beside water.');return;}const key='fish:'+Math.floor(at.x/10)+','+Math.floor(at.y/10);if((this.gathered[key]||0)>s.elapsed){s.say('Let this fishing spot recover. Try another bank.');return;}this.begin('Fishing',12,()=>{if(this.add('FreshFish')){this.gathered[key]=s.elapsed+120;s.survival.gain('scavenging',10);s.say('Caught a fish. Cook it at a fire.');}});}
  if(id==='plant'){if(s.inside(at)||at.floor||s.blocked(at.x,at.y)||s.world.active.flatMap(r=>r.patches).some(t=>['road','parking','path','water'].includes(t.kind)&&at.x>t.x&&at.x<t.x+t.w&&at.y>t.y&&at.y<t.y+t.h)||this.gardens.some(g=>Math.hypot(g.x-at.x,g.y-at.y)<2)){s.say('Find an empty outdoor patch.');return;}timed('Planting vegetables',4,{Seeds:1},()=>{this.gardens.push({x:at.x,y:at.y,planted:s.elapsed,watered:false});s.say('Garden planted. Water it or wait for rain.');});}
  if(id==='garden'){const g=target?.garden||this.gardens.find(g=>Math.hypot(g.x-p.x,g.y-p.y)<3);if(!g){s.say('Stand beside a garden.');return;}if(g.watered&&s.elapsed-g.planted>=600){if(this.add('Carrots',5)){g.planted=s.elapsed;g.watered=false;s.survival.gain('cooking',15);s.say('Harvested five carrots. Water for another crop.');}}else if(!g.watered){if(need({Water:1})){this.spend({Water:1});g.watered=true;s.say('Garden watered. Harvest in '+Math.max(0,Math.ceil((600-s.elapsed+g.planted)/60))+' minutes.');}}else s.say('Growing · '+Math.max(0,Math.ceil((600-s.elapsed+g.planted)/60))+' minutes until harvest.');}
  if(id==='compost'){const g=target?.garden||this.gardens.find(g=>Math.hypot(g.x-p.x,g.y-p.y)<3);if(g&&need({RottenFood:1})){this.spend({RottenFood:1});g.planted-=60;s.say('Compost speeds up this crop.');}}
 }
}
