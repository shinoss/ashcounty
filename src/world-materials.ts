import {varietyMaterial} from './variety-art';
import * as T from 'three';
import {sheets} from './sprite-assets';
const cache=new Map<string,T.MeshLambertMaterial>();
export function characterMaterial(zombie:boolean,part:'cloth'|'pants'|'skin'){
 const key='actor:'+zombie+':'+part;const old=cache.get(key);if(old)return old;
 const frame=sheets[zombie?'zombie':'survivor'][0],rect=part==='cloth'?[40,52,15,18]:part==='pants'?[42,78,9,14]:[44,37,9,10];
 const canvas=document.createElement('canvas');canvas.width=canvas.height=32;const c=canvas.getContext('2d')!;c.fillStyle=part==='skin'?(zombie?'#95937b':'#b59d84'):part==='pants'?'#424e4c':'#67776d';c.fillRect(0,0,32,32);c.drawImage(frame,...rect as [number,number,number,number],0,0,32,32);
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.magFilter=T.NearestFilter;
 const m=new T.MeshLambertMaterial({map});cache.set(key,m);return m;
}
export function dressActor(root:T.Object3D,zombie:boolean,variant=0){
 if(!zombie){dressSurvivor(root);return;}
 const outfit=variant%8,cloth=zombie?varietyMaterial('outfits',outfit):characterMaterial(false,'cloth'),pants=zombie?varietyMaterial('outfits',8+[0,2,3,1,0,2,1,1][outfit]):characterMaterial(false,'pants'),skin=zombie?varietyMaterial('outfits',12+variant%2):characterMaterial(false,'skin');
 root.traverse(o=>{if(!(o instanceof T.Mesh))return;const parent=o.parent?.name||'';
  if(parent.startsWith('knee')&&o.position.y<-.35&&zombie)o.material=varietyMaterial('outfits',14+variant%2);
  else if(parent.startsWith('leg')||parent.startsWith('knee')||parent==='hips')o.material=pants;
  else if(parent.startsWith('arm'))o.material=cloth;
  else if(parent.startsWith('elbow'))o.material=skin;
  else if(parent==='torso'&&o.position.y>.6&&o.position.y<.9)o.material=skin;
  else if(parent==='torso'&&o.position.z>=0&&o.position.y<.6)o.material=cloth;
 });
}
// Reuse the earlier raster artwork as tiled surface albedo on real geometry.
// Props contribute cropped material swatches, never camera-facing cutouts.
export function artMaterial(sheet:string,id:number,repeat=1,tint='#ffffff'){
 const key=[sheet,id,repeat,tint].join(':');let m=cache.get(key);if(m)return m;
 const source=sheets[sheet][id],canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d')!;
 c.fillStyle=sheet==='props'?(id<3?'#40533c':'#817963'):'#7d857f';c.fillRect(0,0,128,128);
 if(sheet==='materials')c.drawImage(source,0,0,128,128);
 else c.drawImage(source,source.width*.32,source.height*(id<3?.24:.40),source.width*.34,source.height*.24,0,0,128,128);
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(repeat,repeat);map.magFilter=T.NearestFilter;map.minFilter=T.LinearMipmapLinearFilter;
 m=new T.MeshLambertMaterial({map,color:tint});cache.set(key,m);return m;
}
export function sceneryMaterial(color:string,size:number[]){
 const repeat=Math.max(1,Math.round(Math.max(...size)/2));
 const ids:Record<string,number>={'#68745a':0,'#616b6b':1,'#707777':1,'#a1a396':2,'#979685':5,'#857f52':3,'#a6a597':6,'#c3c4b7':2};
 if(color in ids)return artMaterial('materials',ids[color],repeat);
 if(['#555851','#60544c','#515951','#666051','#5b514d','#595b51','#5f534b','#565c52'].includes(color))return artMaterial('materials',10,repeat);
 if(['#96917a','#8b9991','#a49a83','#9a8875','#abb0a0','#869283','#95927f','#a89b84'].includes(color))return artMaterial('materials',8,repeat,color);
 if(['#687b78','#4b605e','#8b8e7b','#777b65','#837e65','#b0aa8e'].includes(color))return artMaterial('materials',7,repeat,color);
 if(color==='#b9beb3')return artMaterial('furniture',3,1,'#d3d9cf');
 return undefined;
}

function dressSurvivor(root:T.Object3D){
 const tex=(tile:number)=>varietyMaterial('survivor',tile);
 root.traverse(o=>{if(!(o instanceof T.Mesh))return;const parent=o.parent?.name||'';
  if(parent.startsWith('knee'))o.material=tex(o.position.y<-.35?3:11);
  else if(parent.startsWith('leg')||parent==='hips')o.material=tex(10);
  else if(parent.startsWith('arm'))o.material=tex(9);
  else if(parent.startsWith('elbow'))o.material=tex(o.position.y<-.22?7:9);
  else if(parent==='torso'){
   if(o.position.y>.6&&o.position.y<.9){
    if(o.scale.y<.1){o.visible=false;return;}
    const geometry=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geometry.computeBoundingBox();const bounds=geometry.boundingBox!,size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3()),pos=geometry.getAttribute('position'),uv=geometry.getAttribute('uv');geometry.clearGroups();
    for(let i=0;i<pos.count;i+=3){let nz=0,nx=0;for(let j=0;j<3;j++){nz+=(pos.getZ(i+j)-center.z)/size.z;nx+=(pos.getX(i+j)-center.x)/size.x;}const front=nz>.42,back=nz<-.5,side=Math.abs(nx)>.5;geometry.addGroup(i,3,front?0:back?2:1);
     for(let j=0;j<3;j++){const u=front||back?(pos.getX(i+j)-bounds.min.x)/size.x:(pos.getZ(i+j)-bounds.min.z)/size.z;uv.setXY(i+j,side?1-u:u,(pos.getY(i+j)-bounds.min.y)/size.y);}}
    o.geometry=geometry;o.material=[tex(4),tex(5),tex(6)];
   }else if(o.position.y>.89)o.visible=false;
   else if(o.position.z>=0)o.material=tex(8);
   else o.material=tex(1);
  }
 });
 const torso=root.getObjectByName('torso');if(!torso)return;
 const vest=new T.Mesh(new T.BoxGeometry(.46,.45,.29),[tex(12),tex(12),tex(12),tex(12),tex(0),tex(1)]);vest.userData.armorSlot='kevlar';vest.position.set(0,.25,0);torso.add(vest);
 const helmet=new T.Mesh(new T.SphereGeometry(1,12,8,0,Math.PI*2,0,Math.PI*.58),tex(2));helmet.userData.armorSlot='helmet';helmet.scale.set(.18,.17,.18);helmet.position.set(0,.84,0);torso.add(helmet);
 const rim=new T.Mesh(new T.CylinderGeometry(.18,.183,.025,12,1,true),tex(2));rim.userData.armorSlot='helmet';rim.position.set(0,.80,0);torso.add(rim);
}
