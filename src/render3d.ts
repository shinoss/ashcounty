import {BuildingShadow} from './building-shadow';
import {VehicleSmoke} from './vehicle-smoke';
import type {PickupTarget} from './survival';
import {RECIPES} from './content';
import {finishes,varietyMaterial} from './variety-art';
import {furnish} from './room-furniture';
import * as T from 'three';
import {FLOOR_HEIGHT,stairPoint,STAIR_LENGTH,STAIR_WIDTH} from './stairs';
import {BatTrail} from './bat-trail';
import {dressBuilding} from './town-art';
import {BUILDINGS} from './town';
import {furniture} from './collision';
import {artMaterial,sceneryMaterial} from './world-materials';
import {Darkness,SIGHT_RADIUS} from './visibility';
const box=(parent:T.Object3D,size:number[],at:number[],color:string)=>{const mesh=rawBox(parent,size,at,color);mesh.material=sceneryMaterial(color,size)||mesh.material;return mesh;};
import {ActorModel,CarModel,box as rawBox,material} from './models3d';
import {CHUNK_SIZE,type Region} from './world';
import {ATTACK_DURATION,type Simulation,type House,type Zombie} from './sim';
import type {LootCrate} from './loot';

export class World3D{
 renderer=new T.WebGLRenderer({antialias:false,alpha:false});scene=new T.Scene();camera=new T.OrthographicCamera();
 regions=new Map<string,T.Group>();houses=new Map<House,{group:T.Group;roof:T.Object3D;front:T.Object3D;side:T.Object3D;door:T.Object3D}>();
 crates=new Map<LootCrate,T.Object3D>();cars=new Map<string,CarModel>();zombies=new Map<Zombie,ActorModel>();player=new ActorModel();
 ray=new T.Raycaster();groundPlane=new T.Plane(new T.Vector3(0,1,0),0);zoom=1.32;lost=false;
 darkness=new Darkness();constructions=new Map<number,T.Group>();blood=new Map<Zombie,T.Group>();bloodGeometry=new T.CircleGeometry(1,12);bloodMaterial=new T.MeshBasicMaterial({color:'#6e1518',transparent:true,opacity:.85,depthWrite:false});
 vehicleSmoke=new Map<string,VehicleSmoke>();
 exteriorHidden=new Set<T.Object3D>();buildingShadow=new BuildingShadow();
 lampPoolMap=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d')!,gradient=ctx.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'#ffffff');gradient.addColorStop(1,'#ffffff00');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);return new T.CanvasTexture(c);})();
 sky!:T.HemisphereLight;sun!:T.DirectionalLight;daylight!:T.AmbientLight;lampLights:T.PointLight[]=[];
 elevation=0;batTrail=new BatTrail();
 playerRevealScene=new T.Scene();playerRevealMeshes:{source:T.Mesh;overlay:T.Mesh}[]=[];
 playerRevealMaterial=new T.MeshBasicMaterial({color:'#e1d9b2',transparent:true,opacity:.7,depthTest:true,depthWrite:false,depthFunc:T.GreaterDepth,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
 buildMarker=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({color:'#c9ba88',transparent:true,opacity:.4,side:T.DoubleSide,depthWrite:false}));
 target=new T.Vector3();ready=false;trace:T.Line;flash:T.Mesh;ring:T.Mesh;
 constructor(public s:Simulation){
  const canvas=this.renderer.domElement;canvas.setAttribute('aria-label','Ash County isometric 3D game');document.querySelector('#game')!.append(canvas);
  this.renderer.setPixelRatio(1);this.renderer.outputColorSpace=T.SRGBColorSpace;this.scene.background=new T.Color('#000000');
  const sky=this.sky=new T.HemisphereLight('#fff4dc','#c3cbb5',3.4);sky.layers.enable(1);this.scene.add(sky);const sun=this.sun=new T.DirectionalLight('#ffe4ad',4.0);sun.layers.enable(1);sun.position.set(35,28,22);this.scene.add(sun);const daylight=this.daylight=new T.AmbientLight('#edf2e4',.85);daylight.layers.enable(1);this.scene.add(daylight);
  for(let i=0;i<8;i++){const light=new T.PointLight('#ffd28c',0,12,1.3);light.layers.enable(1);this.scene.add(light);this.lampLights.push(light);}
  this.scene.add(this.player.root,this.batTrail.root);this.buildMarker.rotation.x=-Math.PI/2;this.buildMarker.visible=false;this.scene.add(this.buildMarker);
  // Keep the player off the scenery layer so their own limbs cannot trigger the reveal.
  // No walls or roofs are removed, so this never reveals the room behind them.
  this.player.root.traverse(o=>{if(!(o instanceof T.Mesh)||o.geometry instanceof T.CircleGeometry)return;
   o.layers.set(1);
   const overlay=new T.Mesh(o.geometry,this.playerRevealMaterial);overlay.matrixAutoUpdate=false;this.playerRevealScene.add(overlay);this.playerRevealMeshes.push({source:o,overlay});
  });
  this.trace=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),new T.LineBasicMaterial({color:'#fff2ba'}));this.scene.add(this.trace);
  this.flash=new T.Mesh(new T.IcosahedronGeometry(.13,0),new T.MeshBasicMaterial({color:'#fff0a1'}));this.scene.add(this.flash);
  this.ring=new T.Mesh(new T.RingGeometry(.38,.41,32),new T.MeshBasicMaterial({color:'#d4d1a7',side:T.DoubleSide}));this.ring.rotation.x=-Math.PI/2;this.scene.add(this.ring);
  window.addEventListener('resize',()=>this.resize());canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.lost=true;this.s.paused=true;this.s.say('Graphics interrupted. Waiting to reconnect…');});canvas.addEventListener('webglcontextrestored',()=>{this.lost=false;this.s.say('Graphics restored. Press Esc to resume.');});this.resize();
 }
 resize(){const w=innerWidth,h=innerHeight;this.renderer.setSize(w,h);const span=h/(24*this.zoom);this.camera.left=-span*w/h/2;this.camera.right=span*w/h/2;this.camera.top=span/2;this.camera.bottom=-span/2;this.camera.near=.1;this.camera.far=500;this.camera.updateProjectionMatrix();}
 pointer(x:number,y:number){const rect=this.renderer.domElement.getBoundingClientRect();this.ray.setFromCamera(new T.Vector2((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1),this.camera);}
 furniturePoint(x:number,y:number,exact=false){
  this.pointer(x,y);
  for(const hit of this.ray.intersectObjects([...this.houses.values()].map(v=>v.group).concat([...this.constructions.values()]),true)){
   let visible=true;for(let o:T.Object3D|null=hit.object;o;o=o.parent)if(!o.visible)visible=false;if(!visible)continue;
   for(let o:T.Object3D|null=hit.object;o;o=o.parent){
    if(o.userData.furnitureId){const h=this.s.inside(this.s.player),b=h&&furniture(h,this.s.player.floor).find(b=>b.id===o!.userData.furnitureId);if(b)return {x:b.x+b.w/2,y:b.y+b.d/2};}
    if(o.userData.construction!==undefined){const b=this.s.survival.buildings.find(b=>b.id===o!.userData.construction);if(b)return {x:b.x,y:b.y};}
   }
  }
  return exact?undefined:this.groundPoint(x,y);
 }
 interactable(x:number,y:number):PickupTarget|undefined{
  const at=this.furniturePoint(x,y,true);if(at){const target=this.s.survival.targetAt(at.x,at.y);if(target)return target;}
  const crate=this.pick(x,y);if(crate&&(crate.floor||0)===this.s.player.floor&&this.s.inside(crate)===this.s.inside(this.s.player))return {x:crate.x,y:crate.y,floor:crate.floor||0,label:crate.name,blocked:'This storage container cannot be picked up.'};
  const door=this.pickDoor(x,y);if(door)return {x:door.x+door.w/2,y:door.y+door.d,floor:0,label:door.name+' · Door',blocked:'This door is attached to the building.'};
  this.pointer(x,y);for(const hit of this.ray.intersectObjects([...this.cars.values()].map(c=>c.root),true))for(const [id,car] of this.cars){let o:T.Object3D|null=hit.object;while(o&&o!==car.root)o=o.parent;if(o){const v=this.s.vehicles.find(v=>v.id===id);if(v)return {x:v.x,y:v.y,floor:0,label:'Vehicle',blocked:'Vehicles cannot be picked up.'};}}
  return undefined;
 }
 groundPoint(x:number,y:number){this.pointer(x,y);const at=new T.Vector3();return this.ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),-this.elevation),at)?{x:at.x,y:at.z}:undefined;}
 aim(x:number,y:number){if(this.s.weapon==='bat'&&(this.s.attackTime>0||this.s.shoveTime>0))return;this.pointer(x,y);const at=new T.Vector3();const plane=new T.Plane(new T.Vector3(0,1,0),-((this.s.weapon==='bat'?.2:1.25)+this.elevation));if(this.ray.ray.intersectPlane(plane,at))this.s.player.angle=Math.atan2(at.z-this.s.player.y,at.x-this.s.player.x);}
 pick(x:number,y:number){this.pointer(x,y);const hits=this.ray.intersectObjects([...this.crates.values()],true);for(const hit of hits){let o:T.Object3D|null=hit.object;while(o){if(o.userData.crate){let visible=true;for(let parent:T.Object3D|null=o;parent;parent=parent.parent)if(!parent.visible)visible=false;if(visible&&Math.hypot(o.userData.crate.x-this.s.player.x,o.userData.crate.y-this.s.player.y)<SIGHT_RADIUS)return o.userData.crate as LootCrate;}o=o.parent;}}return undefined;}
 pickDoor(x:number,y:number){this.pointer(x,y);for(const hit of this.ray.intersectObjects([...this.houses.values()].map(v=>v.door),true)){let node:T.Object3D|null=hit.object;while(node){if(node.userData.house)return node.userData.house as House;node=node.parent;}}return undefined;}
 pickStairs(x:number,y:number){const h=this.s.inside(this.s.player),v=h&&this.houses.get(h);if(!v)return false;this.pointer(x,y);const stair=v.group.userData.stairs[this.s.player.floor];return !!stair&&this.ray.intersectObject(stair,true).length>0;}
 buildRegion(r:Region){
  const g=new T.Group(),ox=r.cx*CHUNK_SIZE,oy=r.cy*CHUNK_SIZE;
  box(g,[46,.08,46],[ox+23,-.06,oy+23],'#68745a');
  const patch=(x:number,y:number,w:number,h:number,color:string,level=.005)=>box(g,[w,.025,h],[x+w/2,level,y+h/2],color);
  let surfaceLayer=0;
  for(const p of r.patches){
   patch(p.x,p.y,p.w,p.h,({road:'#616b6b',parking:'#707777',field:'#857f52',water:'#567c82',path:'#979685'})[p.kind],p.kind==='water'?.015:.045+surfaceLayer++*.0002);
   if(p.kind==='road'&&p.w>p.h){for(let x=p.x+1;x<p.x+p.w-2;x+=5)patch(x,p.y+p.h/2,2,.08,'#b8b49a',.085);}
  }
  for(const h of r.houses){
   const finish=finishes(h);
   const house=new T.Group();house.userData.solidOccluder=true;house.position.set(h.x,0,h.y);g.add(house);const floorSlab=box(house,[h.w,.1,h.d],[h.w/2,.05,h.d/2],'#a6a597');floorSlab.userData.interior=true;floorSlab.material=varietyMaterial('materials',finish.floor,Math.max(1,h.w/3),Math.max(1,h.d/3));
   box(house,[h.w,2.5,.15],[h.w/2,1.3,0],h.color);box(house,[.15,2.5,h.d],[0,1.3,h.d/2],h.color);
   const side=box(house,[.15,2.5,h.d],[h.w,1.3,h.d/2],h.color),front=new T.Group();house.add(front);
   const doorWidth=.8,segment=(h.w-doorWidth)/2;box(front,[segment,2.5,.15],[segment/2,1.3,h.d],h.color);box(front,[segment,2.5,.15],[h.w-segment/2,1.3,h.d],h.color);box(front,[doorWidth,.55,.15],[h.w/2,2.275,h.d],h.color);
   const door=new T.Group();door.position.set(h.w/2-.4,0,h.d);house.add(door);door.userData.house=h;box(door,[.8,1.95,.10],[.4,1.025,0],'#65736b');box(door,[.04,.07,.07],[.70,1,.07],'#c2bda5');
   for(const x of [.85,h.w-.85]){box(front,[.64,.85,.04],[x,1.5,h.d+.10],'#b6bcb4');box(front,[.53,.72,.045],[x,1.5,h.d+.125],'#657e83');box(front,[.035,.72,.05],[x,1.5,h.d+.15],'#b6bcb4');}
   house.traverse(o=>{if(o instanceof T.Mesh&&o.scale.y>=2.4){o.userData.roomWall=true;o.material=varietyMaterial(finish.outsideAtlas,finish.outside,Math.max(1,Math.max(o.scale.x,o.scale.z)/3),1);}});
   const roof=new T.Group();house.add(roof);
   if(BUILDINGS[h.kind||'cottage'].roof==='flat')box(roof,[h.w+.35,.24,h.d+.35],[h.w/2,2.67,h.d/2],h.roof);
   else if(BUILDINGS[h.kind||'cottage'].roof==='hip'){
    const geometry=new T.BufferGeometry(),x0=-.2,x1=h.w+.2,z0=-.2,z1=h.d+.2,y=2.65,top=3.5,cx=h.w/2,cz=h.d/2;
    geometry.setAttribute('position',new T.Float32BufferAttribute([x0,y,z0,x1,y,z0,cx,top,cz,x1,y,z0,x1,y,z1,cx,top,cz,x1,y,z1,x0,y,z1,cx,top,cz,x0,y,z1,x0,y,z0,cx,top,cz],3));geometry.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,.5,1,0,0,1,0,.5,1,0,0,1,0,.5,1,0,0,1,0,.5,1],2));geometry.computeVertexNormals();const mat=artMaterial('materials',10,3);mat.side=T.DoubleSide;roof.add(new T.Mesh(geometry,mat));(g.userData.ownedGeometry??=[]).push(geometry);
   }
   else{const rise=.8,half=(h.d+.4)/2,length=Math.hypot(half,rise);for(const sign of [-1,1]){const panel=box(roof,[h.w+.4,.12,length],[h.w/2,2.65+rise/2,h.d/2+sign*half/2],h.roof);panel.rotation.x=sign*Math.atan2(rise,half);}
    for(const x of [-.08,h.w+.08]){const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute([x,2.65,-.15,x,2.65+rise,h.d/2,x,2.65,h.d+.15],3));geometry.computeVertexNormals();const m=artMaterial('materials',8,2);m.side=T.DoubleSide;roof.add(new T.Mesh(geometry,m));(g.userData.ownedGeometry??=[]).push(geometry);}
   }
   const interiorStart=house.children.length;
   for(const solid of furniture(h,0,true).filter(b=>!['fridge','post'].includes(b.kind))){const obj=furnish(house,h,solid);obj.userData.furnitureId=solid.id;obj.userData.furnitureFloor=0;}
   floorSlab.userData.interior=true;
   for(const obj of house.children.slice(interiorStart))obj.userData.interior=true;
   dressBuilding(h,house,roof);
   roof.traverse(o=>{if(o instanceof T.Mesh)o.material=varietyMaterial(finish.roofAtlas,finish.roof,3,2);});
   const ground=house.children.filter(o=>o!==roof&&o!==house.userData.upper&&o!==front&&o!==side&&o!==door);house.userData.ground=ground;
   const levels:T.Group[]=[];const stairGroups:T.Group[]=[];
   for(let floor=0;floor<(h.floors||1);floor++){
    let level: T.Object3D=house;
    if(floor>0){
     const room=new T.Group();room.position.y=floor*FLOOR_HEIGHT;room.visible=false;house.add(room);levels.push(room);level=room;
     for(const o of ground)if(o!==floorSlab){const clone=o.clone(true);if(clone.userData.furnitureId)clone.userData.furnitureFloor=floor;if(clone.userData.roomWall&&(clone instanceof T.Mesh))clone.material=varietyMaterial(finish.insideAtlas,finish.inside,Math.max(1,Math.max(clone.scale.x,clone.scale.z)/3),1);room.add(clone);}
     // Leave a real opening above the descending flight instead of covering it with a slab.
     const down=stairPoint(h,floor-1),x0=down.x-h.x-STAIR_WIDTH/2-.06,x1=down.x-h.x+STAIR_WIDTH/2+.06;
     const z0=down.y-h.y-STAIR_LENGTH-.06,z1=down.y-h.y+.12;
     for(const [x,z,w,d] of [[0,0,x0,h.d],[x1,0,h.w-x1,h.d],[x0,0,x1-x0,z0],[x0,z1,x1-x0,h.d-z1]]){
      if(w>0&&d>0){const slab=box(room,[w,.1,d],[x+w/2,.05,z+d/2],'#a6a597');slab.material=varietyMaterial('materials',finish.floor,Math.max(.2,w/3),Math.max(.2,d/3));}
     }
    }
    if((h.floors||1)>1){const stairs=new T.Group();stairs.userData.stairs=h;level.add(stairs);stairGroups.push(stairs);
     for(const base of [floor-1,floor]){if(base<0||base>=(h.floors||1)-1)continue;const at=stairPoint(h,base);
      for(let i=0;i<10;i++)box(stairs,[STAIR_WIDTH,.15,.20],[at.x-h.x,(base-floor)*FLOOR_HEIGHT+(i+.5)*FLOOR_HEIGHT/10,at.y-h.y-(i+.5)*STAIR_LENGTH/10],'#837e65');
     }

    }
   }
   house.userData.levels=levels;house.userData.stairs=stairGroups;
   this.houses.set(h,{group:house,roof,front,side,door});
  }
  // Instance tree geometry per region: one draw per mesh type, no sprite mattes.
  const trunkGeometry=new T.CylinderGeometry(.10,.18,1.8,5),leavesGeometry=new T.IcosahedronGeometry(1,1);
  const trunks=new T.InstancedMesh(trunkGeometry,artMaterial('materials',7,2,'#756f58'),r.trees.length),leaves=new T.InstancedMesh(leavesGeometry,artMaterial('props',0,2,'#94a77d'),r.trees.length*3),dummy=new T.Object3D();
  r.trees.forEach((t,i)=>{dummy.position.set(t.x,.9,t.y);dummy.scale.set(1,1,1);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);for(let j=0;j<3;j++){dummy.position.set(t.x,1.6+j*.65,t.y);dummy.scale.set((t.variant===2?.8:1.05)-j*.17,t.variant===2?1.15:.85,(t.variant===2?.8:1.05)-j*.17);dummy.updateMatrix();leaves.setMatrixAt(i*3+j,dummy.matrix);}});g.add(trunks,leaves);g.userData.ownedGeometry=[...(g.userData.ownedGeometry||[]),trunkGeometry,leavesGeometry];
  for(const c of r.crates){if(c.furnitureId){const h=r.houses.find(h=>c.x>h.x&&c.x<h.x+h.w&&c.y>h.y&&c.y<h.y+h.d),house=h&&this.houses.get(h);house?.group.traverse(o=>{if(o.userData.furnitureId===c.furnitureId&&o.userData.furnitureFloor===(c.floor||0)){o.userData.crate=c;this.crates.set(c,o);}});continue;}const crate=new T.Group();crate.position.set(c.x,(c.floor||0)*FLOOR_HEIGHT,c.y);crate.userData.crate=c;
   if(c.fridge){box(crate,[.70,1.85,.70],[0,.98,0],'#b9beb3');box(crate,[.04,.43,.04],[.29,1.08,.37],'#5d6e6b');box(crate,[.68,.025,.025],[0,1.38,.36],'#5d6e6b');}
   else{box(crate,[.75,.64,.65],[0,.32,0],'#837e65');for(const x of [-.27,.27])box(crate,[.065,.69,.69],[x,.34,0],'#b0aa8e');}g.add(crate);this.crates.set(c,crate);}

  g.userData.lamps=[];
  for(const p of r.props){if(p.kind==='lamp'){
   const pole=new T.Group();g.add(pole);box(pole,[.14,4,.14],[p.x,2,p.y],'#444c48');box(pole,[1,.1,.12],[p.x+.45,4,p.y],'#444c48');
   const bulb=box(pole,[.6,.12,.3],[p.x+.85,3.92,p.y],'#ded8bc');const glow=new T.MeshLambertMaterial({color:'#ffd28c',emissive:'#ffd28c',emissiveIntensity:1});bulb.material=glow;bulb.userData.disposeMaterial=true;
   const pool=new T.Mesh(new T.PlaneGeometry(8,8),new T.MeshBasicMaterial({map:this.lampPoolMap,color:'#ffd28c',transparent:true,opacity:.2,depthWrite:false}));pool.rotation.x=-Math.PI/2;pool.position.set(p.x+.85,.105,p.y);pole.add(pool);pool.userData.disposeMaterial=true;(g.userData.ownedGeometry??=[]).push(pool.geometry);
   g.userData.lamps.push({x:p.x+.85,y:p.y,bulb,pool});
  }else if(p.kind==='bench'){box(g,[1.8,.12,.6],[p.x,.52,p.y],'#777b65');box(g,[1.8,.5,.1],[p.x,.8,p.y-.3],'#777b65');for(const x of [-.65,.65])box(g,[.12,.50,.5],[p.x+x,.25,p.y],'#455951');}else box(g,p.kind==='grave'?[.55,.8,.18]:p.kind==='sign'?[.12,1.8,.12]:[.65,.8,.65],[p.x,.4,p.y],p.kind==='hay'?'#a29863':'#707c73');}
  this.scene.add(g);this.regions.set(r.key,g);
 }
 sync(){
  const active=new Set(this.s.world.active.map(r=>r.key));for(const [key,g]of this.regions){if(active.has(key))continue;this.scene.remove(g);g.traverse(o=>{if(o instanceof T.InstancedMesh)o.dispose();if(o.userData.disposeMaterial)((o as T.Mesh).material as T.Material).dispose();if(o.userData.ownedTexture){o.userData.ownedTexture.dispose();((o as T.Mesh).material as T.Material).dispose();}});for(const geometry of g.userData.ownedGeometry||[])geometry.dispose();this.regions.delete(key);}
  for(const [h,v]of this.houses)if(!v.group.parent?.parent)this.houses.delete(h);
  for(const [c]of this.crates)if(!this.s.crates.includes(c))this.crates.delete(c);
  for(const r of this.s.world.active)if(!this.regions.has(r.key))this.buildRegion(r);
  const vehicles=new Map(this.s.vehicles.map(v=>[v.id,v]));if(this.s.driving)vehicles.set(this.s.vehicle.id,this.s.vehicle);
  for(const [id,m]of this.cars)if(!vehicles.has(id)){this.scene.remove(m.root);this.cars.delete(id);const smoke=this.vehicleSmoke.get(id);if(smoke){this.scene.remove(smoke.root);smoke.dispose();this.vehicleSmoke.delete(id);}}
  for(const v of vehicles.values())if(!this.cars.has(v.id)){const m=new CarModel(v.kind==='sports'?'#bd3040':({green:'#718576',red:'#926859',blue:'#657e89'})[v.color],v.kind||'wagon');this.cars.set(v.id,m);this.scene.add(m.root);const smoke=new VehicleSmoke();this.vehicleSmoke.set(v.id,smoke);this.scene.add(smoke.root);}
  const alive=new Set(this.s.zombies.filter(z=>(z.hp>0||z.diedAt!==undefined&&this.s.elapsed-z.diedAt<25)&&Math.hypot(z.x-this.s.player.x,z.y-this.s.player.y)<SIGHT_RADIUS));
  for(const [z,m]of this.zombies)if(!alive.has(z)){this.scene.remove(m.root);this.zombies.delete(z);}
  for(const z of alive)if(!this.zombies.has(z)){const m=new ActorModel(true,Math.floor(z.phase/6.28*8));this.zombies.set(z,m);this.scene.add(m.root);}
  for(const z of this.s.zombies){if(z.diedAt===undefined||this.s.elapsed-z.diedAt>90||this.blood.has(z))continue;const g=new T.Group();g.position.set(z.x,.115+(z.floor||0)*FLOOR_HEIGHT,z.y);g.rotation.y=Math.PI/2-(z.deathAngle||0);for(let i=0;i<15;i++){const mesh=new T.Mesh(this.bloodGeometry,this.bloodMaterial),a=i*2.399+z.phase,r=i===0?0:.1+(i%5)*.15;mesh.rotation.x=-Math.PI/2;mesh.position.set(Math.cos(a)*r,0,-Math.sin(a)*r);const size=i===0?.36:.035+(i%4)*.022;mesh.scale.set(size,size*(z.deathCause==='vehicle'?1.8:.7),1);g.add(mesh);}this.scene.add(g);this.blood.set(z,g);}
  for(const [z,g]of this.blood){if(this.s.elapsed-(z.diedAt||0)>90||!this.s.zombies.includes(z)){this.scene.remove(g);this.blood.delete(z);}}
  const structures=this.s.survival.buildings;
  for(const [id,mesh]of this.constructions)if(!structures.some(b=>b.id===id)){this.scene.remove(mesh);this.constructions.delete(id);}
  for(const b of structures){let mesh=this.constructions.get(b.id);if(!mesh){mesh=new T.Group();mesh.position.set(b.x,b.floor*FLOOR_HEIGHT,b.y);this.scene.add(mesh);this.constructions.set(b.id,mesh);mesh.userData.construction=b.id;
   if(b.kind==='wall'){for(let y=.15;y<2.5;y+=.3)box(mesh,[2,.30,.16],[0,y,0],'#837e65');for(const x of [-.92,.92])box(mesh,[.12,2.5,.2],[x,1.25,0],'#687b78');}
   else if(b.kind==='floor'){box(mesh,[1.99,.09,1.99],[0,.06,0],'#837e65');}
   else if(b.kind==='roof'){box(mesh,[1.99,.16,1.99],[0,2.65,0],'#555851');}
   else if(b.kind==='door'){
    for(const x of [-.94,.94])box(mesh,[.12,2.5,.2],[x,1.25,0],'#687b78');box(mesh,[2,.2,.2],[0,2.4,0],'#687b78');
    const hinge=new T.Group();hinge.position.x=-.86;mesh.add(hinge);box(hinge,[1.72,2.25,.12],[.86,1.15,0],'#837e65');box(hinge,[.06,.08,.10],[1.52,1.12,.10],'#b9beb3');mesh.userData.hinge=hinge;
   }
   else if(b.kind==='furniture'&&b.furnishing){const f=b.furnishing;furnish(mesh,{x:0,y:0,design:f.design} as House,{x:-f.w/2,y:-f.d/2,w:f.w,d:f.d,height:f.height,kind:f.kind});}
   else if(b.kind==='bench'){box(mesh,[1,.12,1],[0,.85,0],'#837e65');for(const x of [-.4,.4])for(const z of [-.4,.4])box(mesh,[.12,.8,.12],[x,.4,z],'#687b78');}
   else if(b.kind==='bed'){box(mesh,[.9,.16,1],[0,.15,0],'#687b78');box(mesh,[.7,.12,.25],[0,.28,-.35],'#b9beb3');}
   else if(b.kind==='fire'){for(const x of [-.3,.3])box(mesh,[.2,.15,.7],[x,.12,0],'#555851');box(mesh,[.4,.25,.4],[0,.2,0],'#9c6334');}
   else if(b.kind==='barrel'){box(mesh,[.8,.8,.8],[0,.4,0],'#657e89');box(mesh,[.7,.04,.7],[0,.81,0],'#536870');}
   else{box(mesh,[.5,.45,.5],[0,.23,0],'#687b78');box(mesh,[.05,.7,.05],[.18,.65,0],'#b9beb3');}
  }if(b.furnishing?.kind==='locker'){
   const c=b.furnishing.container??={id:'placed-locker:'+b.id,name:'Locker',x:b.x,y:b.y,floor:b.floor,furnitureId:'placed:'+b.id,items:[]};c.x=b.x;c.y=b.y;c.floor=b.floor;
   if(!this.s.crates.includes(c))this.s.crates.push(c);mesh.userData.crate=c;this.crates.set(c,mesh);
  }mesh.rotation.y=-(b.rotation||0)*Math.PI/2;if(mesh.userData.hinge)mesh.userData.hinge.rotation.y=b.open?-Math.PI/2:0;mesh.visible=(b.kind!=='roof'||Math.hypot(b.x-this.s.player.x,b.y-this.s.player.y)>4)&&b.floor===this.s.player.floor&&Math.hypot(b.x-this.s.player.x,b.y-this.s.player.y)<SIGHT_RADIUS&&(!this.s.inside(b)||this.s.inside(b)===this.s.inside(this.s.player));}
 }
 render(dt:number,steer=0){
  if(this.lost)return;for(const o of this.exteriorHidden)o.visible=true;this.exteriorHidden.clear();this.sync();const s=this.s,p=s.player;this.darkness.center.value.set(p.x,p.y);
  this.buildMarker.visible=!s.paused&&s.survival.placing;const placement=s.survival.placement();this.buildMarker.position.set(placement.x,placement.floor*FLOOR_HEIGHT+.13,placement.y);const draft=s.survival.draft(s.survival.carried?'furniture':RECIPES[s.survival.selected]?.build||'floor'),footprint=s.survival.solid(draft);this.buildMarker.scale.set(footprint.w,footprint.d,1);(this.buildMarker.material as T.MeshBasicMaterial).color.set((s.survival.carried?s.survival.placementReason(draft.kind):s.survival.reason(s.survival.selected,true))?'#c45e53':'#9bc97a');this.player.root.visible=!s.driving;this.elevation=s.playerElevation;this.player.root.position.set(p.x,this.elevation,p.y);this.player.root.rotation.y=Math.PI/2-p.angle;
  this.player.root.traverse(o=>{const slot=o.userData.armorSlot as 'helmet'|'kevlar'|undefined;if(slot)o.visible=s.armorEquipped[slot];});
  this.player.pose({phase:p.gait,moving:p.moving,run:p.running,sneak:p.sneaking,aim:p.aiming,rifle:s.weapon==='rifle',gun:s.gun,shove:s.shoveTime,groundAttack:s.groundAttack,attacking:s.attackTime>0,attack:s.attackTime>0?1-s.attackTime/s.attackDuration:0,hurt:s.damageTime,recoil:s.shotTime/.12,time:s.elapsed});
  this.batTrail.update(this.player.bat,s.elapsed,s.attackTime>0?(s.groundAttack?.18+(1-s.attackTime/s.attackDuration-.43)/.29*.61:1-s.attackTime/s.attackDuration):undefined,!s.driving&&!s.dead&&s.weapon==='bat');
  for(const [z,m]of this.zombies){const zombieHouse=s.inside(z);m.root.visible=(z.floor||0)===p.floor&&(!zombieHouse||s.inside(p)===zombieHouse);m.root.position.set(z.x,(z.floor||0)*FLOOR_HEIGHT,z.y);m.root.rotation.y=Math.PI/2-(z.hp<=0?(z.deathAngle||0):(z.angle||0));
   if(z.hp<=0){const age=Math.max(0,s.elapsed-(z.diedAt??s.elapsed)),fall=(z.downUntil||0)>(z.diedAt||0)?1:Math.min(1,age/(z.deathCause==='vehicle'?.28:.65)),ease=fall*fall*(3-2*fall);m.body.rotation.x=((z.downUntil||0)>(z.diedAt||0)?-1:1)*Math.PI/2*ease;m.body.position.y=.17*ease;m.arms.forEach((a,i)=>{a.rotation.z=(i?1:-1)*.5*ease;});m.legs.forEach((l,i)=>{l.rotation.x=(i?.12:-.18)*ease;});m.root.scale.setScalar(age>22?Math.max(0,(25-age)/3):1);}
   else if((z.downUntil||0)>s.elapsed){
    const age=s.elapsed-(z.downAt||0),remaining=(z.downUntil||0)-s.elapsed,fall=Math.min(1,age/.4),rise=Math.min(1,remaining/.85),blend=fall*rise;
    m.pose({phase:0,moving:false,time:s.elapsed});m.body.rotation.x=-Math.PI/2*blend;m.body.position.y=.16*blend;
    m.legs.forEach((leg,i)=>leg.rotation.x=(i?.18:-.12)*blend);m.knees.forEach(k=>k.rotation.x=.25*blend);
   }
   else{m.body.rotation.x=0;m.pose({phase:z.gait||0,moving:!!z.moving,attack:z.cooldown>1?(z.cooldown-1)/.4:0,hurt:z.hit,time:s.elapsed});}
  }
  const vehicles=new Map(s.vehicles.map(v=>[v.id,v]));if(s.driving)vehicles.set(s.vehicle.id,s.vehicle);
  for(const v of vehicles.values())this.cars.get(v.id)?.update(v.x,v.y,v.angle,v.speed,dt,s.driving&&s.vehicle===v?steer:0);
  for(const v of vehicles.values()){const smoke=this.vehicleSmoke.get(v.id);if(smoke){smoke.update(dt,v);smoke.root.visible=!s.inside(p)&&Math.hypot(v.x-p.x,v.y-p.y)<SIGHT_RADIUS-5;}}
  for(const [h,v]of this.houses){const inside=s.inside(p)===h;v.roof.visible=!inside;v.group.userData.upper.visible=!inside;v.front.visible=!inside;v.side.visible=!inside;v.door.visible=!inside||p.floor===0;v.door.rotation.y=h.door?-Math.PI/2:0;
   for(const obj of v.group.userData.ground){obj.visible=obj.userData.interior?inside&&p.floor===0:!inside||p.floor===0;if(obj.userData.roomWall){const finish=finishes(h);obj.material=varietyMaterial(inside?finish.insideAtlas:finish.outsideAtlas,inside?finish.inside:finish.outside,Math.max(1,Math.max(obj.scale.x,obj.scale.z)/3),1);}}
   (v.group.userData.levels as T.Group[]).forEach((g,i)=>g.visible=inside&&p.floor===i+1);
   v.group.userData.stairs[0]?.visible!==undefined&&(v.group.userData.stairs[0].visible=inside&&p.floor===0);}
  for(const [c,v]of this.crates){const h=s.inside(c);v.visible=(!h||s.inside(p)===h)&&(c.floor||0)===p.floor;v.scale.y=c.fridge||c.furnitureId||c.items.some(i=>i.quantity>0)?1:.65;}
  for(const [z,blood] of this.blood){const bloodHouse=s.inside(z);blood.visible=(z.floor||0)===p.floor&&(!bloodHouse||s.inside(p)===bloodHouse);}this.ring.visible=!s.driving;this.ring.position.set(p.x,this.elevation+.115,p.y);
  this.trace.visible=this.flash.visible=s.shotTime>0&&!!s.shotEnd;
  if(s.shotEnd&&s.shotTime>0){const start=new T.Vector3(p.x+Math.cos(p.angle)*.65,1.25+this.elevation,p.y+Math.sin(p.angle)*.65);const attr=this.trace.geometry.getAttribute('position');attr.setXYZ(0,start.x,start.y,start.z);attr.setXYZ(1,s.shotEnd.x,1.25+this.elevation,s.shotEnd.y);attr.needsUpdate=true;this.trace.geometry.computeBoundingSphere();this.flash.position.copy(start);}
  // Indoor cutaway: omit all exterior geometry, rather than dimming it behind the room.
  const shelter=s.inside(p);
  if(shelter){
   const hide=(o:T.Object3D)=>{if(o.visible){o.visible=false;this.exteriorHidden.add(o);}};
   const room=this.houses.get(shelter)?.group;
   for(const region of this.regions.values())for(const child of region.children){const crate=child.userData.crate as LootCrate|undefined;if(child!==room&&(!crate||s.inside(crate)!==shelter))hide(child);}
   for(const car of this.cars.values())hide(car.root);
   for(const [z,m] of this.zombies)if(s.inside(z)!==shelter)hide(m.root);
   for(const [z,blood] of this.blood)if(s.inside(z)!==shelter)hide(blood);
   for(const [id,mesh] of this.constructions){const b=s.survival.buildings.find(b=>b.id===id);if(!b||s.inside(b)!==shelter)hide(mesh);}
   if(s.shotEnd&&s.inside(s.shotEnd)!==shelter)hide(this.trace);
  }
  const hour=(8.4+s.elapsed*.7/60)%24,day=Math.max(0,Math.min(1,(Math.sin((hour-6)/12*Math.PI)+.12)/.45)),night=1-day;
  this.sky.intensity=.16+3.24*day;this.sun.intensity=4*day;this.daylight.intensity=.08+.77*day;
  const lamps:{x:number;y:number;bulb:T.Mesh;pool:T.Mesh}[]=[];
  for(const region of this.regions.values())for(const lamp of region.userData.lamps||[]){(lamp.bulb.material as T.MeshLambertMaterial).emissiveIntensity=night;lamp.pool.visible=night>.05&&!shelter;(lamp.pool.material as T.MeshBasicMaterial).opacity=.1*night;lamps.push(lamp);}
  lamps.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
  this.lampLights.forEach((light,i)=>{const lamp=lamps[i];light.intensity=lamp&&!shelter?16*night:0;if(lamp)light.position.set(lamp.x,3.7,lamp.y);});
  const destination=new T.Vector3(p.x,.7+this.elevation,p.y);if(!this.ready){this.target.copy(destination);this.ready=true;}else this.target.lerp(destination,1-Math.exp(-dt*12));
  this.camera.position.copy(this.target).add(new T.Vector3(40,32.66,40));this.camera.lookAt(this.target);this.camera.updateMatrixWorld();const focus=new T.Vector3(p.x,this.elevation+1,p.y),viewFocus=focus.clone().applyMatrix4(this.camera.matrixWorldInverse),pixel=focus.clone().project(this.camera),size=this.renderer.getDrawingBufferSize(new T.Vector2());this.darkness.focus.value.set((pixel.x+1)*size.x/2,(pixel.y+1)*size.y/2);this.darkness.focusDepth.value=-viewFocus.z;this.darkness.fadeRadius.value=65*this.zoom;this.scene.updateMatrixWorld(true);this.darkness.exterior.value=shelter?0:1;this.darkness.updateOcclusion(this.camera,focus,[...this.regions.values(),...[...this.cars.entries()].filter(([id])=>!s.driving||id!==s.vehicle.id).map(([,car])=>car.root)],this.elevation);
  // Remove the entire obstructing shell outdoors. A circular roof/wall cutout
  // exposes the far wall faces and looks like an interior even with furniture hidden.
  // Restore before next frame's raycast (above), so hidden buildings stay detectable.
  if(!shelter)for(const building of this.darkness.activeBuildings){building.visible=false;this.exteriorHidden.add(building);}
  for(const [h,v] of this.houses)v.group.traverse(o=>{if(o.userData.furnitureId)o.visible=o.userData.furnitureFloor===p.floor&&s.inside(p)===h&&!h.removedFurniture?.[o.userData.furnitureFloor+':'+o.userData.furnitureId];});this.darkness.apply(this.scene);this.renderer.render(this.scene,this.camera);
  if(!shelter)this.buildingShadow.render(this.renderer,this.scene,this.camera,this.darkness.activeBuildings);
  if(!s.driving){
   for(const {source,overlay} of this.playerRevealMeshes){let visible=true;for(let o:T.Object3D|null=source;o;o=o.parent)if(!o.visible){visible=false;break;}overlay.visible=visible;overlay.matrix.copy(source.matrixWorld);}
   const autoClear=this.renderer.autoClear,background=this.scene.background;
   this.renderer.autoClear=false;
   // The depth buffer currently contains scenery only. Draw hidden fragments first,
   // then the normally lit player, without clearing that scenery depth.
   this.renderer.render(this.playerRevealScene,this.camera);
   this.scene.background=null;this.camera.layers.set(1);for(const [h,v] of this.houses)v.group.traverse(o=>{if(o.userData.furnitureId)o.visible=o.userData.furnitureFloor===p.floor&&s.inside(p)===h&&!h.removedFurniture?.[o.userData.furnitureFloor+':'+o.userData.furnitureId];});this.renderer.render(this.scene,this.camera);
   this.camera.layers.set(0);this.scene.background=background;this.renderer.autoClear=autoClear;
  }
 }
}
