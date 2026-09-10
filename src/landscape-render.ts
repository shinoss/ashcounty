import * as T from 'three';
import type {Region} from './world';
import {box} from './models3d';
import {varietyMaterial} from './variety-art';
/** Shaped 3D shrubs use the generated botanical textures, avoiding sprite mattes. */
export function drawLandscape(region:Region,root:T.Group){
 const dummy=new T.Object3D(),shrub=new T.IcosahedronGeometry(1,1),hedge=new T.BoxGeometry(1,1,1),petal=new T.SphereGeometry(1,5,3);
 (root.userData.ownedGeometry??=[]).push(shrub,hedge,petal);
 for(let kind=0;kind<6;kind++){
  const plants=(region.foliage||[]).filter(f=>f.kind===kind);if(!plants.length)continue;
  const mesh=new T.InstancedMesh(kind===1?hedge:shrub,varietyMaterial('botanical',kind),plants.length*(kind===1?1:3));mesh.userData.foliage=true;
  plants.forEach((f,i)=>{for(let j=0;j<(kind===1?1:3);j++){
   const a=j*2.4,low=kind===3||kind===4||kind===2,height=kind===1?.7:low?.38:.8;
   dummy.position.set(f.x+(kind===1?0:Math.cos(a)*.22*f.size),height*f.size*.52+(j===1?.1:0),f.y+(kind===1?0:Math.sin(a)*.22*f.size));dummy.rotation.set(0,kind===1?0:a,0);dummy.scale.set((kind===1?1.05:.5)*f.size,height*f.size*(kind===1?1:.8),(kind===1?.72:.46)*f.size);dummy.updateMatrix();mesh.setMatrixAt(i*(kind===1?1:3)+j,dummy.matrix);
  }});root.add(mesh);
  if([2,3,5].includes(kind)){const blooms=new T.InstancedMesh(petal,new T.MeshLambertMaterial({color:kind===2?'#9172aa':kind===3?'#eee4b3':'#be7287'}),plants.length*4);blooms.userData.disposeMaterial=true;
   plants.forEach((f,i)=>{for(let j=0;j<4;j++){const a=j*2.4;dummy.position.set(f.x+Math.cos(a)*.3*f.size,(kind===5?.8:.48)*f.size,f.y+Math.sin(a)*.3*f.size);dummy.rotation.set(0,a,0);dummy.scale.set(.09*f.size,(kind===2?.18:.07)*f.size,.09*f.size);dummy.updateMatrix();blooms.setMatrixAt(i*4+j,dummy.matrix);}});root.add(blooms);}
 }
 const fenceParts:{size:number[];at:number[]}[]=[],bar=(size:number[],at:number[])=>fenceParts.push({size,at});
 for(const b of region.barriers||[]){const horizontal=b.w>b.d,length=horizontal?b.w:b.d;
  const rail=(height:number)=>bar([b.w,.06,b.d],[b.x+b.w/2,height,b.y+b.d/2]);rail(.3);rail(2.15);
  for(let i=0;i<=length;i+=.48){const x=b.x+(horizontal?i:b.w/2),z=b.y+(horizontal?b.d/2:i);bar([.035,2.2,.035],[x,1.1,z]);}
  for(let i=0;i<=length;i+=3){bar([.11,2.4,.11],[b.x+(horizontal?i:b.w/2),1.2,b.y+(horizontal?b.d/2:i)]);}
 }
 if(fenceParts.length){const fence=new T.InstancedMesh(hedge,varietyMaterial('districts',3,1,1,'#9ba79e'),fenceParts.length);fenceParts.forEach((p,i)=>{dummy.position.set(p.at[0],p.at[1],p.at[2]);dummy.rotation.set(0,0,0);dummy.scale.set(p.size[0],p.size[1],p.size[2]);dummy.updateMatrix();fence.setMatrixAt(i,dummy.matrix);});root.add(fence);}
 for(const p of region.props)if(p.kind==='fountain'){
  const basin=new T.Mesh(new T.CylinderGeometry(1.65,1.75,.4,16),varietyMaterial('districts',1));basin.position.set(p.x,.22,p.y);root.add(basin);
  const water=new T.Mesh(new T.CircleGeometry(1.4,20),new T.MeshLambertMaterial({color:'#799b9d'}));water.rotation.x=-Math.PI/2;water.position.set(p.x,.43,p.y);water.userData.disposeMaterial=true;root.add(water);
  box(root,[.5,1.3,.5],[p.x,.75,p.y],'#aaa99a');
  (root.userData.ownedGeometry??=[]).push(basin.geometry,water.geometry);
 }
}
