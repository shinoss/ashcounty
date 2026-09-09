import {ObjectMenu} from './object-menu';
import {loadVarietyArt} from './variety-art';
import {GameAudio} from './game-audio';
import {LootPanel} from './loot-panel';
import {World3D} from './render3d';
import {SIGHT_RADIUS} from './visibility';
import {loadModels} from './models3d';
import './style.css';
import {Simulation} from './sim';
import * as Art from './art';
import {UI} from './ui';
async function boot(){
const loading=document.createElement('div');loading.className='asset-loading';loading.textContent='ASH COUNTY · Loading world artwork…';document.body.append(loading);
await Promise.all([Art.loadSprites(),loadModels(),loadVarietyArt()]);loading.remove();
const simulation=new Simulation();
const audio=new GameAudio();
const ui=new UI(simulation,()=>location.reload(),()=>audio.setMuted(ui.muted));
const unlockAudio=()=>audio.setMuted(ui.muted);window.addEventListener('pointerdown',unlockAudio,{once:true});window.addEventListener('keydown',unlockAudio,{once:true});
const lootPanel=new LootPanel(simulation,name=>ui.inventory.art(name));
const mobile={x:0,y:0};
document.querySelectorAll<HTMLButtonElement>('[data-move]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);const d=b.dataset.move;mobile.x=d==='left'?-1:d==='right'?1:0;mobile.y=d==='up'?-1:d==='down'?1:0;};b.onpointerup=b.onpointercancel=()=>{mobile.x=mobile.y=0;};});
const view=new World3D(simulation);
const keys=new Set<string>();let firing=false,aiming=false,pointer={x:innerWidth/2,y:innerHeight/2};
const canvas=view.renderer.domElement;
const crosshair=document.createElement('div');crosshair.className='aim-crosshair';crosshair.hidden=true;document.body.append(crosshair);
function clearInput(){keys.clear();firing=false;aiming=false;mobile.x=mobile.y=0;}
const objectMenu=new ObjectMenu(simulation,clearInput);
window.addEventListener('keydown',event=>{
 if(objectMenu.blocking)return;
 if(event.key==='Escape'&&!objectMenu.menu.hidden){objectMenu.close();return;}
 if(event.key==='Escape'&&simulation.survival.pickupJob){simulation.survival.cancel();return;}
 if(event.target instanceof HTMLElement&&event.target.closest('input,select,textarea')&&event.key!=='Escape')return;
 const k=event.key.toLowerCase();if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))event.preventDefault();keys.add(k);if(event.repeat)return;
 if(k==='escape'){clearInput();if(!ui.panel&&simulation.survival.active){simulation.survival.cancel();return;}if(lootPanel.crate){lootPanel.close();return;}if(simulation.paused&&!ui.panel)simulation.paused=false;else ui.toggle(ui.panel||'pause');return;}
 if(['i','m','b'].includes(k)){clearInput();ui.toggle(({i:'inventory',m:'map',b:'workshop'} as Record<string,string>)[k]);return;}
 if(ui.panel)return;
 if(k==='delete'&&!ui.panel){simulation.survival.dismantle();return;}
 if(k==='r'&&simulation.survival.placing){simulation.survival.rotation=(simulation.survival.rotation+1)%4;return;}
 if(k==='f'){firing=false;simulation.toggleVehicle();}if(k==='e')simulation.interact();if(k==='g')simulation.toggleDoor();
 if(k===' '&&simulation.survival.active){if(simulation.survival.placing)simulation.survival.place();return;}
 if(k===' '){if(simulation.driving)simulation.vehicle.speed=0;else simulation.attack();}
 if(k==='1')simulation.equip('bat');if(k==='6')simulation.equip('rifle');if(k==='q')simulation.equip(simulation.weapon==='bat'?'rifle':'bat');if(k==='r')simulation.reload();
 const consumable=({'2':'Bandage','3':'Water','4':'Beans','5':'Plank'} as Record<string,string>)[k];if(consumable)simulation.use(consumable);
});
window.addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));
canvas.addEventListener('contextmenu',event=>event.preventDefault());
canvas.addEventListener('pointermove',event=>{pointer={x:event.clientX,y:event.clientY};});
canvas.addEventListener('mousedown',event=>{
 if(ui.panel||simulation.paused)return;pointer={x:event.clientX,y:event.clientY};
 if(simulation.survival.active){const at=simulation.survival.pickupMode?view.furniturePoint(event.clientX,event.clientY):view.groundPoint(event.clientX,event.clientY);if(event.button===2){simulation.survival.cancel();return;}if(event.button===0&&at){simulation.survival.cursor=at;if(simulation.survival.pickupMode)simulation.survival.pickup(at.x,at.y);else simulation.survival.place();}return;}
 if(event.button===2){const target=view.interactable(event.clientX,event.clientY);if(target){objectMenu.open(target,event.clientX,event.clientY);return;}view.aim(pointer.x,pointer.y);if(simulation.weapon==='bat')simulation.shove();else aiming=true;return;}if(event.button!==0)return;

 view.aim(pointer.x,pointer.y);if(simulation.weapon==='bat'&&simulation.meleeTargets(1.9).length){simulation.attack();return;}
 const door=view.pickDoor(event.clientX,event.clientY);if(door){simulation.toggleDoor(door);return;}
 const crate=view.pick(event.clientX,event.clientY);if(crate){lootPanel.open(crate);return;}
 firing=simulation.weapon==='rifle';view.aim(pointer.x,pointer.y);simulation.attack();
});
window.addEventListener('mouseup',event=>{if(event.button===0)firing=false;if(event.button===2)aiming=false;});
canvas.addEventListener('pointercancel',clearInput);
document.querySelector('#ui')!.addEventListener('pointerdown',()=>{firing=false;aiming=false;},true);
canvas.addEventListener('wheel',event=>{event.preventDefault();view.zoom=Math.max(.45,Math.min(1.8,view.zoom-event.deltaY*.001));view.resize();},{passive:false});
function pause(){clearInput();if(!ui.panel&&!simulation.dead&&!simulation.won)ui.toggle('pause');}
window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
const down=(...names:string[])=>Number(names.some(n=>keys.has(n)));
function step(dt:number){
 if(simulation.survival.closeWorkshop){simulation.survival.closeWorkshop=false;clearInput();if(ui.panel)ui.toggle(ui.panel);}
 if(simulation.survival.placing)simulation.survival.cursor=view.groundPoint(pointer.x,pointer.y);
 const sx=down('d','arrowright')-down('a','arrowleft')+mobile.x,sy=down('s','arrowdown')-down('w','arrowup')+mobile.y;
 simulation.player.aiming=aiming&&!simulation.driving&&simulation.weapon==='rifle'&&!simulation.paused&&!simulation.dead;
 if(simulation.player.aiming||firing)view.aim(pointer.x,pointer.y);
 simulation.update(dt,{x:sx+sy,y:sy-sx,steer:sx,throttle:-sy,run:keys.has('shift'),sneak:keys.has('c')});
 if(firing&&!ui.panel&&!simulation.paused&&!simulation.survival.active)simulation.attack();
 crosshair.hidden=!simulation.player.aiming;crosshair.style.left=pointer.x+'px';crosshair.style.top=pointer.y+'px';canvas.style.cursor=simulation.player.aiming?'none':'';
 audio.update(simulation);view.render(simulation.paused?0:dt,sx);ui.update();lootPanel.update();objectMenu.update();
}
let last=performance.now(),manualUntil=0;
function frame(now:number){const dt=Math.min(.05,(now-last)/1000);last=now;if(now>=manualUntil)step(dt);requestAnimationFrame(frame);}
requestAnimationFrame(frame);
Object.assign(window,{advanceTime:(ms:number)=>{manualUntil=performance.now()+100;const steps=Math.max(1,Math.ceil(ms/(1000/60)));for(let i=0;i<steps;i++)step(ms/1000/steps);}});
// Read-only state snapshot for accessibility and automated playtesting.
Object.assign(window,{render_game_to_text:()=>JSON.stringify({coordinates:'World tile coordinates, +x southeast, +y southwest',player:simulation.player,vehicle:simulation.vehicle,driving:simulation.driving,inventory:simulation.bag,crates:simulation.crates,openCrate:lootPanel.crate?.id,weapon:simulation.weapon,ammo:simulation.ammo,reserve:simulation.reserve,kills:simulation.kills,searched:simulation.searched,paused:simulation.paused,dead:simulation.dead,won:simulation.won,nearHouse:simulation.nearHouse()?.name,inside:simulation.inside(simulation.player)?.name,zombies:simulation.zombies.map(z=>({x:z.x,y:z.y,hp:z.hp,alert:z.alert,diedAt:z.diedAt,deathCause:z.deathCause})),regions:simulation.world.active.map(r=>r.key),renderer:'three',visibilityRadius:SIGHT_RADIUS,visualHeading:view.cars.get(simulation.vehicle.id)?.root.rotation.y,actorPose:{leftLeg:view.player.legs[0].rotation.x,rightLeg:view.player.legs[1].rotation.x},zoom:view.zoom,visitedRegions:simulation.world.cache.size,houses:simulation.houses.map(h=>({name:h.name,x:h.x,y:h.y,door:h.door,searched:h.searched})),elapsed:simulation.elapsed}),game:view});


}
void boot().catch(error=>{console.error(error);const loading=document.querySelector('.asset-loading');if(loading)loading.textContent='Artwork could not load. Please refresh to retry.';});
