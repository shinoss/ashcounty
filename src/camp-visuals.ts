import {FLOOR_HEIGHT} from './stairs';
import * as T from 'three';
import type {Simulation} from './sim';
import {box as rawBox} from './models3d';
import {artMaterial,sceneryMaterial} from './world-materials';
const box=(parent:T.Object3D,size:number[],at:number[],color:string)=>{const m=rawBox(parent,size,at,color);m.material=sceneryMaterial(color,size)||m.material;return m;};
/** View-only adapters for saved home equipment and vegetable plots. */
export class CampVisuals{
 falling=new Map<object,T.Group>();treeTrunk=new T.CylinderGeometry(.1,.18,1.8,5);treeLeaves=new T.IcosahedronGeometry(1,1);
 steam=new T.Group();steamGeometry=new T.SphereGeometry(1,6,4);steamMaterial=new T.MeshBasicMaterial({color:'#dce5dc',transparent:true,opacity:.13,depthWrite:false});
 root=new T.Group();generator=new T.Group();gardens=new Map<string,T.Group>();light=new T.PointLight('#ffe6a5',0,18,1.3);indicator:T.Mesh;
 rainGeometry=new T.BufferGeometry();rain:T.LineSegments;rainPositions=new Float32Array(120*6);
 constructor(){this.root.add(this.steam);for(let i=0;i<5;i++)this.steam.add(new T.Mesh(this.steamGeometry,this.steamMaterial));
  box(this.generator,[1,.65,.65],[0,.34,0],'#637762');box(this.generator,[.25,.46,.55],[.43,.35,0],'#303b3a');
  for(const x of [-.58,.58])box(this.generator,[.06,.85,.06],[x,.45,0],'#384946');box(this.generator,[1.2,.06,.06],[0,.87,0],'#384946');
  box(this.generator,[.11,.3,.11],[-.42,.8,.2],'#3c4946');this.indicator=box(this.generator,[.1,.1,.02],[.25,.48,.34],'#acd996');
  this.light.position.y=3;this.generator.add(this.light);this.root.add(this.generator);
  this.rainGeometry.setAttribute('position',new T.BufferAttribute(this.rainPositions,3));this.rain=new T.LineSegments(this.rainGeometry,new T.LineBasicMaterial({color:'#bed4d9',transparent:true,opacity:.32,depthWrite:false}));this.rain.frustumCulled=false;this.root.add(this.rain);
 }
 update(s:Simulation){const l=s.life,p=s.player,inside=s.inside(p),g=l.generator;
  this.generator.visible=!!g&&!inside&&Math.hypot(g.x-p.x,g.y-p.y)<44;
  if(g){this.generator.position.set(g.x,0,g.y);this.indicator.visible=g.on&&g.fuel>0;this.light.intensity=g.on&&g.fuel>0&&l.night?14:0;}
  for(const plot of l.gardens){const key=plot.x+','+plot.y;let mesh=this.gardens.get(key);if(!mesh){mesh=new T.Group();mesh.position.set(plot.x,0,plot.y);box(mesh,[1.6,.07,1.5],[0,.06,0],'#584b38');const shoots=new T.Group();for(let i=0;i<9;i++)for(const tilt of [-.3,.3]){const leaf=box(shoots,[.06,.45,.11],[(i%3-.9)*.5,.28,(Math.floor(i/3)-1)*.45],'#718b48');leaf.rotation.z=tilt;}mesh.add(shoots);mesh.userData.shoots=shoots;this.gardens.set(key,mesh);this.root.add(mesh);}mesh.visible=!inside&&Math.hypot(plot.x-p.x,plot.y-p.y)<44;mesh.userData.shoots.scale.y=.15+.85*Math.min(1,Math.max(0,(s.elapsed-plot.planted)/600))*(plot.watered?1:.3);}
  for(const [tree,mesh]of this.falling)if(!l.felledTrees.includes(tree as typeof l.felledTrees[number])){this.root.remove(mesh);this.falling.delete(tree);}
  for(const tree of l.felledTrees){let mesh=this.falling.get(tree);if(!mesh){mesh=new T.Group();mesh.position.set(tree.x,0,tree.y);const trunk=new T.Mesh(this.treeTrunk,artMaterial('materials',7,2,'#756f58'));trunk.position.y=.9;mesh.add(trunk);for(let i=0;i<3;i++){const leaves=new T.Mesh(this.treeLeaves,artMaterial('props',0,2,'#94a77d'));leaves.position.y=1.6+i*.65;leaves.scale.set(1.05-i*.17,.85,1.05-i*.17);mesh.add(leaves);}this.falling.set(tree,mesh);this.root.add(mesh);}
   const t=s.elapsed-tree.at;mesh.visible=!inside;mesh.quaternion.setFromAxisAngle(new T.Vector3(Math.sin(tree.angle),0,-Math.cos(tree.angle)),Math.min(1,t/1.25)**2*1.48);mesh.scale.setScalar(t>2.8?Math.max(.001,(4-t)/1.2):1);}
  this.steam.visible=l.actionPose?.kind==='cook';if(this.steam.visible){this.steam.position.set(p.x+Math.cos(p.angle)*.65,(p.floor||0)*FLOOR_HEIGHT+1,p.y+Math.sin(p.angle)*.65);this.steam.children.forEach((o,i)=>{const age=(s.elapsed*.6+i*.21)%1;o.position.set(Math.sin(age*5+i)*.1,age*.6,Math.cos(age*4+i)*.06);o.scale.setScalar(.045+Math.sin(age*Math.PI)*.05);});}
  this.rain.visible=l.raining&&!inside;
  if(this.rain.visible){for(let i=0;i<120;i++){const x=p.x+((i*7.317)%26)-13,z=p.y+((i*11.79)%26)-13,y=8-((s.elapsed*7+i*.73)%8),j=i*6;this.rainPositions.set([x,y,z,x-.13,y-.6,z-.13],j);}this.rainGeometry.attributes.position.needsUpdate=true;}
 }
}
