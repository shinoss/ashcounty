import * as T from 'three';
import type {VehicleState} from './world';
let smokeMap:T.CanvasTexture|undefined;
function texture(){
 if(smokeMap)return smokeMap;const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
 const c=canvas.getContext('2d')!,gradient=c.createRadialGradient(32,32,3,32,32,30);
 gradient.addColorStop(0,'#ffffffd0');gradient.addColorStop(.45,'#ffffff80');gradient.addColorStop(1,'#ffffff00');c.fillStyle=gradient;c.fillRect(0,0,64,64);
 return smokeMap=new T.CanvasTexture(canvas);
}
/** A bounded pool of drifting engine-smoke puffs; no particle allocations per frame. */
export class VehicleSmoke{
 root=new T.Group();clock=0;next=0;serial=0;
 puffs=Array.from({length:16},()=>{const material=new T.SpriteMaterial({map:texture(),transparent:true,opacity:0,depthWrite:false,color:'#858680'});material.userData.smokeParticle=true;
  const mesh=new T.Sprite(material);mesh.userData.smokeParticle=true;mesh.visible=false;this.root.add(mesh);return {mesh,age:10,life:2.5,drift:0,strength:0};});
 update(dt:number,car:VehicleState){
  this.clock+=dt;const severity=Math.max(0,Math.min(1,(45-(car.condition??100))/45));
  for(const p of this.puffs){p.age+=dt;const t=p.age/p.life;p.mesh.visible=t<1;
   if(t>=1)continue;p.mesh.position.y+=dt*(.45+p.strength*.35);p.mesh.position.x+=dt*.18;p.mesh.position.z+=dt*p.drift;
   p.mesh.scale.setScalar(.25+t*(.8+p.strength));p.mesh.material.opacity=Math.sin(t*Math.PI)*(.14+p.strength*.32);
  }
  if(dt<=0||severity<=0||this.clock<this.next)return;
  this.next=this.clock+(.52-severity*.37);const p=this.puffs[this.serial++%this.puffs.length];p.age=0;p.life=2.3+severity;p.strength=severity;p.drift=Math.sin(this.serial*2.4)*.15;
  p.mesh.position.set(car.x+Math.cos(car.angle)*1.05,.95,car.y+Math.sin(car.angle)*1.05);p.mesh.material.color.set(severity>.55?'#555651':'#a3a49e');p.mesh.material.opacity=0;p.mesh.visible=true;
 }
 dispose(){for(const p of this.puffs)p.mesh.material.dispose();this.root.clear();}
}
