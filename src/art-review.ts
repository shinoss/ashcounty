import * as Art from './art';
import {sheets,drawFit} from './sprite-assets';
import {houses} from './sim';
async function review(){await Art.loadSprites();const root=document.querySelector('#review')!;root.innerHTML='';let paused=false;document.querySelector<HTMLButtonElement>('#pause')!.onclick=e=>{paused=!paused;(e.target as HTMLButtonElement).textContent=paused?'Resume animation':'Pause animation';};
 const group=(label:string)=>{const h=document.createElement('h2');h.textContent=label;root.append(h);const s=document.createElement('section');root.append(s);return s;};
 const add=(s:HTMLElement,a:HTMLCanvasElement,label:string)=>{const f=document.createElement('figure'),cap=document.createElement('figcaption');cap.textContent=label;f.append(a,cap);s.append(f);return a;};
 let s=group('Buildings and cutaway interiors');for(const style of ['home','shop','warehouse','barn'] as const){const h={...houses[0],style,w:5,d:5};add(s,Art.house(h),style+' · exterior');add(s,Art.house(h,true),style+' · interior');}
 s=group('Survivor movement and weapon poses');const actors=([['idle','bat',false,false],['walk','bat',false,false],['run','bat',true,false],['sneak','bat',false,false],['attack','bat',false,false],['hurt','bat',false,false],['walk','rifle',false,false],['walk','rifle',true,false],['walk','rifle',false,true],['walk','rifle',true,true]] as const).map(([action,weapon,back,aim])=>({a:add(s,Art.canvas(96,112),`${action} · ${weapon}${back?' · back':''}${aim?' · aim':''}`),action,weapon,back,aim}));
 s=group('Zombie action cycles');const zombies=(['idle','walk','attack','hurt'] as const).map(action=>({a:add(s,Art.canvas(96,112),action),action}));
 s=group('Vehicle directions');for(let i=0;i<8;i++)add(s,Art.driveCar(i*Math.PI/4),`${i*45}°`);
 s=group('Environment sprites');for(let i=0;i<3;i++)add(s,Art.tree(i),'tree '+i);for(const kind of ['bench','grave','hay','pump','sign','barrel'])add(s,Art.scenery(kind),kind);add(s,Art.storageCrate(),'crate');add(s,Art.storageCrate(true),'empty crate');add(s,Art.fence(),'fence');add(s,Art.lamp(),'lamp');add(s,Art.mailbox(),'mailbox');
 s=group('Inventory supplies');sheets.items.forEach((item,i)=>{const a=Art.canvas(120,96);drawFit(a.getContext('2d')!,item,60,88,110,80);add(s,a,['carbine','bat','water','food','ammo','bandage','planks','backpack'][i]);});
 s=group('Combat effects');for(let i=0;i<8;i++)add(s,Art.effect(i),i<4?'muzzle '+i:'impact '+(i-4));
 let phase=0,previous=0;function animate(now:number){const dt=Math.min(50,now-previous);previous=now;if(!paused)phase+=dt*.008;actors.forEach(v=>Art.survivor(v.action,phase%8,v.back,v.weapon,v.aim,0,v.a));zombies.forEach(v=>{const c=v.a.getContext('2d')!;c.clearRect(0,0,96,112);c.drawImage(Art.undead(v.action,(phase*2)%16),0,0);});requestAnimationFrame(animate);}requestAnimationFrame(animate);
}void review();
