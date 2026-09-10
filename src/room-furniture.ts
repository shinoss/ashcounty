import * as T from 'three';
import {box} from './models3d';
import {varietyMaterial as mat} from './variety-art';
import type {House} from './sim';
import type {Solid} from './collision';
export function furnish(parent:T.Group,h:House,b:Solid){
 const group=new T.Group();group.position.set(b.x-h.x,0,b.y-h.y);parent.add(group);const {w,d,height:y,kind}=b;
 const add=(size:number[],at:number[],tile:number,atlas='furniture'):T.Mesh=>{const m=box(group,size,at,'#827e6b');m.material=mat(atlas,tile);return m;};
 if(h.layout&&['hospitalbed','prisonbed','bunk'].includes(kind)){
  const tile=kind==='hospitalbed'?4:kind==='prisonbed'?13:9;
  const bed=(base:number)=>{add([w,.12,d],[w/2,base+.2,d/2],11,'institutions');const top=add([w-.08,.15,d-.08],[w/2,base+.34,d/2],tile,'institutions');top.material=[mat('institutions',11),mat('institutions',11),mat('institutions',tile),mat('institutions',11),mat('institutions',tile),mat('institutions',tile)];};
  bed(0);if(kind==='bunk')bed(1);
  for(const x of [.05,w-.05])for(const z of [.05,d-.05])add([.08,y,.08],[x,y/2,z],11,'institutions');
 }else if(h.layout&&['shelf','produce','checkout','medicine','locker','basin','fridge','toolchest'].includes(kind)){
  const tile=kind==='shelf'?0:kind==='produce'?1:kind==='checkout'?3:kind==='medicine'?5:kind==='fridge'?2:kind==='basin'?14:kind==='toolchest'?10:8;
  const side=mat('institutions',11),face=mat('institutions',tile),body=add([w,y,d],[w/2,y/2,d/2],tile,'institutions');body.material=kind==='produce'||kind==='basin'?[side,side,face,side,side,side]:d>w?[face,face,side,side,side,side]:[side,side,side,side,face,face];
  if(kind==='checkout')add([.45,.3,.4],[w*.65,y+.15,d*.5],3,'institutions');
 }else if(kind==='washer'){add([w,y,d],[w/2,y/2,d/2],10);const rim=new T.Mesh(new T.CylinderGeometry(.32,.32,.06,16),mat('furniture',10));rim.rotation.x=Math.PI/2;rim.position.set(w/2,.48,d+.03);group.add(rim);const glass=new T.Mesh(new T.CircleGeometry(.24,16),new T.MeshLambertMaterial({color:'#354950'}));glass.position.set(w/2,.48,d+.07);group.add(glass);}
 else if(kind==='sofa'||kind==='booth'){const tile=kind==='booth'?1:(h.design||0)%2?3:0;add([w,.3,d],[w/2,.35,d/2],tile);add([w,.65,.17],[w/2,.53,.085],tile);for(const x of [.1,w-.1])add([.2,.5,d],[x,.45,d/2],tile);}
 else if(kind==='bed'){add([w,.22,d],[w/2,.25,d/2],13);add([w-.08,.16,d-.1],[w/2,.44,d/2],h.kind==='clinic'?2:(h.design||0)%2?14:15);add([w-.2,.12,.35],[w/2,.57,.3],2);add([w,.8,.12],[w/2,.4,.06],4);}
 else if(['bookshelf','shelf','medicine','toolchest','locker','cabinet','counter'].includes(kind)){
  const tile=kind==='bookshelf'?8:kind==='medicine'?9:kind==='shelf'?8:kind==='toolchest'?7:kind==='locker'?10:kind==='counter'?(h.design||0)%2?6:4:(h.design||0)%2?5:4;
  const mesh=add([w,y,d],[w/2,y/2,d/2],tile);const side=mat('furniture',kind==='locker'||kind==='toolchest'?13:5),face=mat('furniture',tile);mesh.material=d>w?[face,face,side,side,side,side]:[side,side,side,side,face,side];
  if(kind==='counter'){add([w+.03,.07,d+.03],[w/2,y+.03,d/2],12);if(w>2){const top=add([.7,.02,d*.85],[w*.45,y+.08,d/2],13);top.material=[side,side,mat('furniture',13),side,side,side];const hob=add([.6,.02,d*.85],[w*.75,y+.08,d/2],13);hob.material=[side,side,mat('furniture',13),side,side,side];}}
 }
 else if(kind==='tv'){const mesh=add([w,y,d],[w/2,y/2,d/2],11),side=mat('materials',3);mesh.material=[side,side,side,side,mat('furniture',11),side];}
 else if(kind==='table'||kind==='desk'){add([w,.09,d],[w/2,y-.05,d/2],4);for(const x of [.08,w-.08])for(const z of [.08,d-.08])add([.1,y-.1,.1],[x,(y-.1)/2,z],5);if(kind==='desk'){add([.4,.3,.4],[w*.7,y+.15,d*.5],11);}}
 else if(kind==='worklift'){add([w,.15,d],[w/2,.25,d/2],13);for(const x of [.2,w-.2])add([.1,.4,d],[x,.2,d/2],13);}
 else add([w,y,d],[w/2,y/2,d/2],14);
 return group;
}
