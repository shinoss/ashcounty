import type {Simulation} from './sim';
import {ITEM_INFO} from './inventory';
import type {Region} from './world';
const VERSION=1;
const lifeKeys=['mode','fatigue','bleeding','pain','batCondition','learned','ammo','discoveries','home','generator','gardens','gathered','foodAge','noises','noiseId','alarms','announcedDay'] as const;
function openDatabase():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const r=indexedDB.open('ash-county',1);r.onupgradeneeded=()=>r.result.createObjectStore('saves');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function readSave():Promise<any>{const db=await openDatabase();try{return await new Promise((resolve,reject)=>{const r=db.transaction('saves').objectStore('saves').get('current');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}finally{db.close();}}
let saving=false;
export async function saveGame(s:Simulation){if(saving)return;saving=true;try{
 const data={version:VERSION,date:Date.now(),player:{...s.player,...s.life.seated?.exit},outfit:s.outfit,elapsed:s.elapsed,kills:s.kills,dead:s.dead,bag:{...s.bag},gun:s.gun,ownedGuns:[...s.ownedGuns],weapon:s.weapon,meleeKind:s.meleeKind,ammo:s.ammo,armor:{...s.armor},armorEquipped:{...s.armorEquipped},driving:s.driving,vehicle:s.vehicle.id,regions:[...s.world.cache.values()],life:Object.fromEntries(lifeKeys.map(k=>[k,s.life[k]])),survival:{xp:s.survival.xp,buildings:s.survival.buildings,serial:s.survival.serial,packed:[...s.survival.packed],packedSerial:s.survival.packedSerial},inventory:{stacks:s.inventory.stacks,serial:s.inventory.serial},stairs:s.stairTravel?{house:{x:s.stairTravel.house.x,y:s.stairTravel.house.y},base:s.stairTravel.base,progress:s.stairTravel.progress}:null};
 // Clone before yielding so a transaction captures one coherent simulation frame.
 const snapshot=structuredClone(data),db=await openDatabase();try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction('saves','readwrite');tx.objectStore('saves').put(snapshot,'current');tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(tx.error);});}finally{db.close();}
 s.life.lastSave=s.elapsed;s.life.saveStatus='Saved '+new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});s.life.saveError='';
 }catch(error){s.life.saveError='Saving unavailable. Keep this tab open to preserve your session.';s.life.saveStatus='Save failed';s.say(s.life.saveError);console.warn('Ash County save failed',error);}finally{saving=false;}}
export function restoreSave(s:Simulation,data:any){
 if(!data||data.version!==VERSION||!Array.isArray(data.regions)||!Number.isFinite(data.player?.x)||!Number.isFinite(data.player?.y))throw new Error('Unsupported or damaged save');
 Object.assign(s.player,data.player);if(data.outfit)s.outfit=data.outfit;s.elapsed=data.elapsed;s.kills=data.kills;s.dead=!!data.dead;s.bag=data.bag;s.gun=data.gun;s.ownedGuns=data.ownedGuns;s.weapon=data.weapon;s.meleeKind=data.meleeKind==='crowbar'?'crowbar':'bat';s.ammo=data.ammo;s.armor=data.armor;s.armorEquipped=data.armorEquipped;
 for(const k of lifeKeys)if(data.life[k]!==undefined)(s.life as any)[k]=data.life[k];
 Object.assign(s.survival,{xp:data.survival.xp,buildings:data.survival.buildings,serial:data.survival.serial,packedSerial:data.survival.packedSerial});s.survival.packed=new Map(data.survival.packed);
 for(const [key,f]of s.survival.packed)ITEM_INFO[key]=s.survival.packedDefinition(f);
 s.world.cache=new Map(data.regions.map((r:Region)=>[r.key,r]));s.world.center='';s.world.ensure(s.player.x,s.player.y);s.refreshWorld();
 s.vehicle=[...s.world.cache.values()].flatMap(r=>r.vehicles).find(v=>v.id===data.vehicle)||s.vehicles[0];s.driving=!!data.driving&&!!s.vehicle;
 s.inventory.stacks=data.inventory.stacks;s.inventory.serial=data.inventory.serial;s.inventory.sync();
 if(data.stairs){const house=s.houses.find(h=>h.x===data.stairs.house.x&&h.y===data.stairs.house.y);if(house)s.stairTravel={house,base:data.stairs.base,progress:data.stairs.progress};}
 s.life.saveStatus='Loaded saved county';s.life.lastSave=s.elapsed;s.say('Welcome back. Your county, home and supplies are restored.');
}
