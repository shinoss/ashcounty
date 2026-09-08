import {finishes,varietyMaterial} from './variety-art';
import * as T from 'three';
import {box} from './models3d';
import {artMaterial} from './world-materials';
import {BUILDINGS} from './town';
import type {House} from './sim';
export function dressBuilding(h:House,house:T.Group,roof:T.Object3D){
 const def=BUILDINGS[h.kind||'cottage'],upper=new T.Group();roof.position.y=((h.floors||1)-1)*2.65;house.add(upper);
 const brick=varietyMaterial('materials',finishes(h).outside,3,1),cream=artMaterial('materials',9,2),window= new T.MeshLambertMaterial({color:'#739093'});
 const block=(size:number[],at:number[],m:T.Material,parent:T.Object3D=upper)=>{const mesh=box(parent,size,at,'#999d91');mesh.material=m as T.MeshLambertMaterial;return mesh;};
 // Upper stories are a cutaway group; ground-floor geometry stays aligned to collisions.
 for(let floor=1;floor<(h.floors||1);floor++){
  const y=floor*2.65;block([h.w,2.65,h.d],[h.w/2,y+1.28,h.d/2],brick);block([h.w+.12,.12,h.d+.12],[h.w/2,y,h.d/2],cream);
  for(let x=.75;x<h.w-.3;x+=1.5){block([.72,1,.08],[x,y+1.35,h.d+.08],cream);block([.59,.87,.09],[x,y+1.35,h.d+.13],window);block([.035,.87,.10],[x,y+1.35,h.d+.18],cream);}
  for(let z=.8;z<h.d;z+=1.6){block([.08,1,.72],[h.w+.08,y+1.35,z],cream);block([.09,.87,.59],[h.w+.13,y+1.35,z],window);}
 }
 const special=!['cottage','ranch','colonial','townhouse','apartments','barn'].includes(h.kind||'cottage');
 if(special){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=64;const c=canvas.getContext('2d')!;c.fillStyle=h.kind==='police'?'#263d59':h.kind==='gas'?'#8b4038':'#344e47';c.fillRect(0,0,512,64);c.fillStyle='#eee8cd';c.font='bold 30px monospace';c.textAlign='center';c.fillText(def.label,256,43,490);const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.magFilter=T.NearestFilter;
  const sign=block([Math.min(h.w-.5,7),.53,.12],[h.w/2,2.25,h.d+.12],new T.MeshLambertMaterial({map}));sign.userData.ownedTexture=map;
 }
 if(h.kind==='garage'){
  for(const x of [2.1,h.w-2.1]){block([2.8,2.15,.12],[x,1.12,h.d+.12],cream);for(let y=.25;y<2.2;y+=.25)block([2.7,.035,.14],[x,y,h.d+.2],brick);}
 }else if(h.kind==='pharmacy'){block([.22,1.1,.15],[h.w-.9,2,h.d+.2],new T.MeshLambertMaterial({color:'#597b56'}));block([.9,.22,.15],[h.w-.9,2,h.d+.2],new T.MeshLambertMaterial({color:'#597b56'}));
 }else if(h.kind==='motel'){for(let x=1;x<h.w;x+=2.2)block([1.2,.15,1],[x,2.45,h.d+.45],cream);
 }else if(h.kind==='gas'){
  block([h.w+.5,.22,2.8],[h.w/2,2.55,h.d+1.4],cream);
  for(const x of [.3,h.w-.3])block([.13,2.5,.13],[x,1.25,h.d+2.5],brick);
 }else if(h.kind==='church'){
  block([1.25,4.5,1.25],[h.w/2,2.25,h.d-.65],cream);block([.12,1.0,.12],[h.w/2,5,h.d-.65],cream);block([.65,.12,.12],[h.w/2,5.2,h.d-.65],cream);
 }else if(h.kind==='library'||h.kind==='police'){
  for(const x of [h.w/2-1.15,h.w/2+1.15])block([.23,2.3,.23],[x,1.15,h.d+.35],cream);
  block([3,.18,.9],[h.w/2,2.45,h.d+.3],cream);
 }else if(!special&&(h.design||0)%2===0){
  block([2.5,.13,1.05],[h.w/2,2.28,h.d+.45],cream);
  for(const x of [h.w/2-1.1,h.w/2+1.1])block([.10,2.15,.10],[x,1.1,h.d+.8],cream);
 }
 // Gable chimney, shutters and eave treatments differentiate residential silhouettes.
 if(!special){block([.45,1.2,.5],[h.w-.8,(h.floors||1)*2.65+.25,.8],brick);for(const x of [.38,1.30,h.w-1.30,h.w-.38])block([.17,.95,.10],[x,1.5,h.d+.12],artMaterial('materials',7,1,'#788976'));}
 house.userData.upper=upper;
 return upper;
}
