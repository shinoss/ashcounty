import {ActionAnimation} from './action-animation';
import type {ActivityPose} from './activity';
import type {Outfit} from './wardrobe';
import {updateOutfit} from './world-materials';
import type {VehicleKind,GunKind} from './content';
import * as T from 'three';
import {dressActor} from './world-materials';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const loadedModels=new Map<string,T.Group>();
export async function loadModels(){const loader=new GLTFLoader();await Promise.all(['survivor','zombie-0','zombie-1','zombie-2','car-green','car-red','car-blue'].map(async name=>{const gltf=await loader.loadAsync(`/assets/models/${name}.glb`);loadedModels.set(name,gltf.scene);}));}
const carNames:Record<string,string>={'#718576':'car-green','#926859':'car-red','#657e89':'car-blue'};

// Shared resources keep streamed regions inexpensive to create and remove.
const cube = new T.BoxGeometry(1,1,1);
const materials = new Map<string,T.MeshLambertMaterial>();
export function material(color:string,tile=1){
 const key=color+':'+tile;let m=materials.get(key);if(m)return m;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=32;
 const ctx=canvas.getContext('2d')!;ctx.fillStyle=color;ctx.fillRect(0,0,32,32);
 let seed=731;for(let i=0;i<480;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;ctx.fillStyle=i%2?'#ffffff':'#000000';ctx.globalAlpha=.025+(seed%8)/100;ctx.fillRect(seed%32,(seed>>>8)%32,1,1);}
 const map=new T.CanvasTexture(canvas);map.magFilter=T.NearestFilter;map.minFilter=T.NearestFilter;map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(tile,tile);
 m=new T.MeshLambertMaterial({map});materials.set(key,m);return m;
}
export function box(parent:T.Object3D,size:number[],at:number[],color:string){const mesh=new T.Mesh(cube,material(color,Math.max(1,Math.ceil(Math.max(...size)/3))));mesh.scale.set(size[0],size[1],size[2]);mesh.position.set(at[0],at[1],at[2]);parent.add(mesh);return mesh;}
export function pivot(parent:T.Object3D,x:number,y:number,z:number){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;}
const headGeometry=new T.SphereGeometry(1,8,6);
const wheelGeometry=new T.CylinderGeometry(.32,.32,.19,12);
const shadowGeometry=new T.CircleGeometry(1,24);
const shadowMaterial=new T.MeshBasicMaterial({color:'#202f2a',transparent:true,opacity:.23,depthWrite:false});
function shadow(parent:T.Object3D,x:number,z:number){const mesh=new T.Mesh(shadowGeometry,shadowMaterial);mesh.rotation.x=-Math.PI/2;mesh.scale.set(x,z,1);mesh.position.y=.055;parent.add(mesh);}
export type ActorPose={meleeKind?:'bat'|'crowbar';action?:ActivityPose;sitting?:boolean;groundAttack?:boolean;shove?:number;phase:number;moving:boolean;run?:boolean;sneak?:boolean;aim?:boolean;rifle?:boolean;attack?:number;attacking?:boolean;hurt?:number;recoil?:number;gun?:GunKind;time:number};
export class ActorModel{
 root=new T.Group();body=pivot(this.root,0,0,0);hips=pivot(this.body,0,.94,0);
 torso=pivot(this.hips,0,0,0);legs:T.Group[]=[];knees:T.Group[]=[];arms:T.Group[]=[];elbows:T.Group[]=[];
 work?:ActionAnimation;appearanceKey="";meleeVisual="bat";
 rifle=new T.Group();bat=new T.Group();amplitude=0;lastTime=0;aimBlend=0;gunModels=new Map<GunKind,T.Group>();
 constructor(public zombie=false,variant=0){
  const source=loadedModels.get(zombie?'zombie-'+variant%3:'survivor');
  if(source){this.root=source.clone(true);const node=(name:string)=>this.root.getObjectByName(name) as T.Group;this.body=node('body');this.hips=node('hips');this.torso=node('torso');this.rifle=node('rifle');this.bat=node('bat');for(let i=0;i<2;i++){this.legs.push(node('leg'+i));this.knees.push(node('knee'+i));this.arms.push(node('arm'+i));this.elbows.push(node('elbow'+i));}dressActor(this.root,zombie,variant);this.setupGuns();if(!zombie){this.setMelee('crowbar');this.setMelee('bat');}if(!zombie)this.work=new ActionAnimation(this);return;}
  shadow(this.root,.35,.26);
  const shirt=zombie?['#6b746b','#85745f','#596d75'][variant%3]:'#687b7d',pants=zombie?'#494f49':'#3f4f58',skin=zombie?'#929480':'#b69c82';
  box(this.torso,[.43,.51,.25],[0,.25,0],shirt);box(this.hips,[.35,.16,.25],[0,0,0],pants);
  const head=new T.Mesh(headGeometry,material(skin));head.scale.set(.145,.195,.14);head.position.set(0,.75,0);this.torso.add(head);
  box(this.torso,[.27,.07,.27],[0,.90,-.025],zombie?'#4e4d41':'#494e47');
  box(this.torso,[.08,.05,.04],[-.07,.78,.134],'#333a38');box(this.torso,[.08,.05,.04],[.07,.78,.134],'#333a38');
  if(!zombie){box(this.torso,[.34,.36,.19],[0,.24,-.21],'#565b47');box(this.torso,[.04,.45,.03],[-.14,.23,.145],'#484e41');box(this.torso,[.04,.45,.03],[.14,.23,.145],'#484e41');}
  for(const side of [-1,1]){
   const leg=pivot(this.hips,side*.105,-.04,0);box(leg,[.15,.42,.17],[0,-.21,0],pants);
   const knee=pivot(leg,0,-.42,0);box(knee,[.125,.40,.145],[0,-.20,0],pants);box(knee,[.16,.11,.29],[0,-.405,.055],'#303633');this.legs.push(leg);this.knees.push(knee);
   const arm=pivot(this.torso,side*.27,.44,0);box(arm,[.14,.29,.16],[0,-.145,0],shirt);
   const elbow=pivot(arm,0,-.29,0);box(elbow,[.105,.27,.115],[0,-.13,0],skin);box(elbow,[.11,.09,.12],[0,-.28,0],skin);this.arms.push(arm);this.elbows.push(elbow);
  }
  box(this.rifle,[.09,.12,.70],[0,0,.12],'#343c3d');box(this.rifle,[.05,.05,.40],[0,.01,.65],'#222a2d');box(this.rifle,[.08,.20,.14],[0,-.12,.13],'#30383b');
  box(this.bat,[.075,.80,.075],[0,-.23,0],'#948367');this.body.add(this.rifle);this.elbows[1].add(this.bat);this.bat.position.y=-.28;
  this.setupGuns();
  this.body.name='body';this.hips.name='hips';this.torso.name='torso';this.rifle.name='rifle';this.bat.name='bat';for(let i=0;i<2;i++){this.legs[i].name='leg'+i;this.knees[i].name='knee'+i;this.arms[i].name='arm'+i;this.elbows[i].name='elbow'+i;}if(!zombie){this.setMelee('crowbar');this.setMelee('bat');dressActor(this.root,false);this.work=new ActionAnimation(this);}
 }
 appearance(outfit:Outfit,armor:{helmet:boolean;kevlar:boolean}){const key=JSON.stringify([outfit,armor]);if(key===this.appearanceKey)return;this.appearanceKey=key;updateOutfit(this.root,outfit);this.root.traverse(o=>{const slot=o.userData.armorSlot as 'helmet'|'kevlar'|undefined;if(slot)o.visible=armor[slot];});}
 setMelee(kind:'bat'|'crowbar'){
  if(this.zombie||this.meleeVisual===kind)return;
  this.meleeVisual=kind;
  if(!this.bat.userData.wooden){const wood=new T.Group();wood.add(...this.bat.children.slice());this.bat.add(wood);this.bat.userData.wooden=wood;
   const steel=new T.Group(),curve=new T.CatmullRomCurve3([new T.Vector3(0,.17,0),new T.Vector3(0,-.45,0),new T.Vector3(0,-.59,.015),new T.Vector3(0,-.66,.10),new T.Vector3(0,-.59,.19)]);
   steel.add(new T.Mesh(new T.TubeGeometry(curve,24,.027,8,false),material('#697275')));
   box(steel,[.055,.10,.014],[0,.19,0],'#adb5b2');
   for(const x of [-.024,.024])box(steel,[.021,.07,.025],[x,-.565,.19],'#a2aaa8');
   this.bat.add(steel);this.bat.userData.crowbar=steel;
  }
  this.bat.userData.wooden.visible=kind==='bat';this.bat.userData.crowbar.visible=kind==='crowbar';
 }
 setupGuns(){
  if(this.zombie)return;this.rifle.clear();
  for(const kind of ['carbine','pistol','shotgun','hunting','smg'] as GunKind[]){const g=new T.Group();this.rifle.add(g);this.gunModels.set(kind,g);g.visible=kind==='carbine';
   const pistol=kind==='pistol',length=pistol?.26:kind==='smg'?.42:kind==='hunting'?.92:kind==='shotgun'?.85:.7;
   box(g,[.09,.12,length],[0,0,pistol?.16:.12],'#343c3d');
   box(g,[.065,.19,.1],[0,-.12,.10],'#30383b');
   if(!pistol){box(g,[.045,.045,.26],[0,.015,.12+length/2+.10],'#222a2d');box(g,[.08,.12,.25],[0,-.02,-.24],kind==='shotgun'||kind==='hunting'?'#948367':'#343c3d');}
   if(kind==='shotgun')box(g,[.13,.09,.2],[0,-.06,.4],'#948367');
   if(kind==='hunting'){box(g,[.06,.07,.28],[0,.12,.15],'#222a2d');}
   if(kind==='smg'||kind==='carbine')box(g,[.07,.22,.11],[0,-.15,.24],'#30383b');
  }
 }
 gripBat(){
  this.bat.updateMatrix();
  for(let i=0;i<2;i++){
   const arm=this.arms[i],start=arm.position,target=new T.Vector3(0,i===0?.01:.12,0).applyMatrix4(this.bat.matrix);
   const axis=target.clone().sub(start),distance=Math.max(.02,Math.min(.565,axis.length()));axis.normalize();
   const along=(.29*.29-.285*.285+distance*distance)/(2*distance),pole=new T.Vector3(i===0?-.5:.5,-1,-.2);
   pole.addScaledVector(axis,-pole.dot(axis)).normalize();
   const elbow=start.clone().addScaledVector(axis,along).addScaledVector(pole,Math.sqrt(Math.max(0,.29*.29-along*along)));
   arm.quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),elbow.clone().sub(start).normalize());
   this.elbows[i].quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),target.clone().sub(elbow).normalize().applyQuaternion(arm.quaternion.clone().invert()));
  }
 }
 pose(p:ActorPose){this.setMelee(p.meleeKind||'bat');
  const cycle=p.phase*Math.PI*2,desired=p.moving?(p.run?.72:p.sneak?.28:this.zombie?.32:.46):0;
  const delta=Math.max(0,Math.min(.05,p.time-this.lastTime));this.lastTime=p.time;this.amplitude+=(desired-this.amplitude)*(1-Math.exp(-delta*16));const swing=this.amplitude;
  this.body.position.y=p.moving?Math.abs(Math.sin(cycle))*(p.run?.045:.018):Math.sin(p.time*2)*.005;
  this.hips.position.y=p.sneak?.77:.94;this.torso.rotation.set(p.hurt?-.28:p.sneak?.3:this.zombie?.12:p.run?.1:0,Math.sin(cycle)*swing*.08,0);
  for(let i=0;i<2;i++){const phase=cycle+i*Math.PI,step=Math.sin(phase);this.legs[i].rotation.set(step*swing,0,0);this.knees[i].rotation.set(0,0,0);this.knees[i].rotation.x=Math.max(0,-Math.cos(phase))*swing*1.15+(p.sneak?.35:0);this.arms[i].rotation.set(-step*swing*.8,0,i===0?.06:-.06);this.elbows[i].rotation.set(p.run?-.9:-.16,0,0);}
  if(this.zombie){this.arms.forEach((arm,i)=>{arm.rotation.x=-.65+Math.sin(cycle+i)*.10-(p.attack||0)*1.2;});}
  for(const [kind,mesh] of this.gunModels)mesh.visible=kind===(p.gun||'carbine');this.rifle.visible=!this.zombie;this.bat.visible=!this.zombie&&!p.rifle;
  this.bat.rotation.set(0,0,0);this.body.rotation.y=0;
  if(p.rifle){
   this.aimBlend+=((p.aim?1:0)-this.aimBlend)*(1-Math.exp(-delta*14));const aim=this.aimBlend,recoil=p.recoil||0;
   this.hips.position.y-=aim*.055;this.torso.rotation.x+=aim*.13-recoil*.055;this.torso.rotation.y=0;
   if(!p.moving){this.legs[0].rotation.x=-.16*aim;this.legs[1].rotation.x=.13*aim;this.knees.forEach(k=>k.rotation.x=.16*aim);}
   if(this.rifle.parent!==this.torso)this.torso.add(this.rifle);
   this.rifle.position.set(.12,.24+aim*.17,.04-recoil*.045);this.rifle.rotation.set(.40*(1-aim)-recoil*.04,0,0);this.rifle.updateMatrix();
   // Solve each bent arm to a distinct grip on the weapon; hands stay attached as it raises/recoils.
   const grips=[new T.Vector3(-.035,p.gun==='pistol'?-.10:-.035,p.gun==='pistol'?.13:.38),new T.Vector3(.025,-.10,.10)];
   for(let i=0;i<2;i++){
    const arm=this.arms[i],target=grips[i].applyMatrix4(this.rifle.matrix),start=arm.position;
    const axis=target.clone().sub(start),distance=Math.max(.02,Math.min(.565,axis.length()));axis.normalize();
    const upper=.29,lower=.285,along=(upper*upper-lower*lower+distance*distance)/(2*distance);
    const pole=new T.Vector3(i===0?-.5:.5,-1,-.2);pole.addScaledVector(axis,-pole.dot(axis)).normalize();
    const elbow=start.clone().addScaledVector(axis,along).addScaledVector(pole,Math.sqrt(Math.max(0,upper*upper-along*along)));
    arm.quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),elbow.clone().sub(start).normalize());
    const forearm=target.clone().sub(elbow).normalize().applyQuaternion(arm.quaternion.clone().invert());
    this.elbows[i].quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),forearm);
   }
  }
  else{this.aimBlend=0;if(this.rifle.parent!==this.body)this.body.add(this.rifle);this.rifle.position.set(.1,1.20,-.29);this.rifle.rotation.set(-1.57,0,-.25);
   if(!this.zombie){
    if(this.bat.parent!==this.torso)this.torso.add(this.bat);
    this.bat.position.set(.06,.16,.30);this.bat.rotation.set(.25,0,2.7);
   }
   if(!this.zombie&&(p.attacking||p.attack)){
    const t=p.attack||0,smooth=(v:number)=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
    const wind=smooth(t/.24),strike=smooth((t-.24)/.40),recover=smooth((t-.72)/.28),weight=1-recover;
    // Coil away from the target, whip through it, then unwind into the resting pose.
    this.torso.rotation.y=(-.95*wind+2.1*strike)*weight;
    this.torso.rotation.x=(.08+.18*strike)*weight;
    this.body.rotation.y=(-.22*wind+.46*strike)*weight;
    this.hips.position.y-=Math.sin(t*Math.PI)*.07;
    this.bat.position.set(.06+(.12*wind-.25*strike)*weight,.16+.12*Math.sin(t*Math.PI),.30);
    this.bat.rotation.set(.25+strike*weight,.6*wind*weight-1.5*strike*weight,2.7-2.2*strike*weight);
    if(!p.moving){this.legs[0].rotation.x=-.22*weight;this.legs[1].rotation.x=.26*weight;this.knees[0].rotation.x=.2*weight;}
   }
   if(!this.zombie&&p.attacking&&p.groundAttack){
    const t=p.attack||0,ease=(v:number)=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
    const lift=ease(t/.40),strike=ease((t-.44)/.22),recover=ease((t-.76)/.24),weight=1-recover;
    // Raise both grips above the head, pause, then drive the bat through the floor-facing arc.
    this.body.rotation.y=0;this.torso.rotation.y=0;
    this.torso.rotation.x=(-.20*lift+1.12*strike)*weight;
    this.hips.position.y=(p.sneak?.77:.94)-(.06*lift+.20*strike)*weight;
    this.bat.position.set(.06-.04*lift*weight,.16+(.68*lift-.72*strike)*weight,.30+(-.18*lift+.25*strike)*weight);
    this.bat.rotation.set(.25+(-.90*lift+3.05*strike)*weight,0,2.7+(Math.PI-2.7)*lift*weight);
    const brace=Math.sin(Math.min(1,t/.18)*Math.PI/2)*weight;
    this.legs[0].rotation.x=-.28*brace;this.legs[1].rotation.x=.25*brace;
    this.knees[0].rotation.x=(.25+.35*strike)*brace;this.knees[1].rotation.x=(.18+.3*strike)*brace;
   }
   if(!this.zombie&&(p.shove||0)>0){
    const t=1-(p.shove||0)/.78,ease=(v:number)=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
    const brace=ease(t/.27),thrust=ease((t-.27)/.18),release=ease((t-.57)/.43),weight=1-release;
    this.body.rotation.y=0;this.torso.rotation.y=-.12*brace*weight;
    this.torso.rotation.x=(-.18*brace+.62*thrust)*weight;
    this.hips.position.y=(p.sneak?.77:.94)-(.12*brace-.04*thrust)*weight;
    this.legs[0].rotation.x=-.32*brace*weight;this.legs[1].rotation.x=.3*brace*weight;
    this.knees[0].rotation.x=.35*brace*weight;this.knees[1].rotation.x=.24*brace*weight;
    // Pull the two-handed grip into the chest, then extend it with the whole body.
    this.bat.position.set(.06,.16+.17*brace*weight,.30+(-.14*brace+.31*thrust)*weight);
    this.bat.rotation.set(.25*(1-brace*weight),0,2.7+(Math.PI/2-2.7)*brace*weight);
   }
   if(!this.zombie)this.gripBat();
  }
  if(p.attacking||p.shove||p.aim&&!p.action)this.work?.reset();
  this.work?.apply(p.action,!!p.sitting,delta);
 }
}
export class CarModel{
 root=new T.Group();wheels:T.Group[]=[];front:T.Group[]=[];roll=0;
 constructor(color:string,kind:VehicleKind='wagon'){
  const source=kind==='wagon'?loadedModels.get(carNames[color]):undefined;if(source){this.root=source.clone(true);for(let i=0;i<4;i++)this.wheels.push(this.root.getObjectByName('wheel'+i) as T.Group);for(let i=0;i<2;i++)this.front.push(this.root.getObjectByName('front'+i) as T.Group);return;}
  shadow(this.root,.95,1.75);
  // Local +Z is the front; yaw maps the model onto the simulation's heading.
  box(this.root,[1.45,.40,3.15],[0,.64,0],color);box(this.root,[1.35,.16,3.10],[0,.39,0],'#363e3d');
  const cabinStart=this.root.children.length;
  box(this.root,[1.27,.20,1.70],[0,.89,-.24],color);box(this.root,[1.28,.43,1.73],[0,1.19,-.24],'#536870');box(this.root,[1.33,.12,1.84],[0,1.50,-.24],color);
  for(const x of [-.63,.63]){box(this.root,[.075,.56,.08],[x,1.14,.55],color);box(this.root,[.075,.56,.08],[x,1.14,-1.0],color);box(this.root,[.075,.56,.075],[x,1.14,-.23],color);box(this.root,[.03,.045,.24],[x*1.13,.85,-.05],'#a1a79e');}
  if(kind==='pickup'||kind==='van'){
   for(const child of this.root.children.slice(cabinStart))this.root.remove(child);
   if(kind==='pickup'){box(this.root,[1.28,.6,1.2],[0,1.12,.35],'#536870');box(this.root,[1.35,.12,1.3],[0,1.47,.35],color);box(this.root,[1.1,.08,1.2],[0,.86,-.85],'#333b3b');for(const x of [-.66,.66])box(this.root,[.12,.3,1.35],[x,.98,-.83],color);}
   else{box(this.root,[1.36,1.05,2.45],[0,1.18,-.3],color);box(this.root,[1.2,.48,.06],[0,1.45,.95],'#536870');for(const x of [-.69,.69])box(this.root,[.02,.48,.6],[x,1.45,.6],'#536870');}
  }else if(kind==='sedan'||kind==='police'){for(const child of this.root.children.slice(cabinStart)){child.position.z*=.75;child.scale.z*=.75;}if(kind==='police'){box(this.root,[1.2,.1,.22],[0,1.62,-.2],'#333333');box(this.root,[.48,.12,.22],[-.3,1.71,-.2],'#a54535');box(this.root,[.48,.12,.22],[.3,1.71,-.2],'#4057a0');for(const x of [-.73,.73])box(this.root,[.025,.25,1.3],[x,.76,0],'#dddccb');}}
  if(kind==='sports'){
   for(const child of this.root.children.slice(cabinStart))this.root.remove(child);
   box(this.root,[1.36,.28,1.35],[0,.95,-.15],'#233a43');
   box(this.root,[1.29,.08,1.26],[0,1.13,-.24],'#ae2936');
   box(this.root,[1.45,.14,1.02],[0,.83,1.0],'#c63743');
   for(const x of [-.24,.24])box(this.root,[.13,.015,1.02],[x,.908,1.0],'#e6dccc');
   for(const x of [-.59,.59])box(this.root,[.055,.2,.08],[x,.99,-1.35],'#282e30');
   box(this.root,[1.55,.07,.28],[0,1.10,-1.35],'#262d2f');
   for(const x of [-.75,.75])box(this.root,[.08,.18,2.5],[x,.43,0],'#b32a37');
  }
  box(this.root,[1.48,.12,.10],[0,.52,1.60],'#9b9e96');box(this.root,[.58,.17,.025],[0,.72,1.583],'#30383a');
  for(const x of [-.50,.50]){box(this.root,[.30,.16,.035],[x,.75,1.59],'#d9d3a7');box(this.root,[.25,.15,.035],[x,.73,-1.59],'#994f3e');}
  for(const x of [-.73,.73])for(const z of [-1.02,1.02]){const steering=pivot(this.root,x,.35,z);const wheel=pivot(steering,0,0,0);const tire=new T.Mesh(wheelGeometry,material('#262d2b'));tire.rotation.z=Math.PI/2;wheel.add(tire);box(wheel,[.205,.13,.13],[0,0,0],'#929b98');this.wheels.push(wheel);if(z>0)this.front.push(steering);}
  this.wheels.forEach((w,i)=>w.name='wheel'+i);this.front.forEach((w,i)=>w.name='front'+i);
 }
 update(x:number,y:number,angle:number,speed:number,dt:number,steer:number){this.root.position.set(x,0,y);this.root.rotation.y=Math.PI/2-angle;this.roll+=speed*dt/.32;this.wheels.forEach(w=>w.rotation.x=this.roll);this.front.forEach(w=>w.rotation.y=-steer*.4);}
}
