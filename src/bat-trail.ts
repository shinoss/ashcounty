import * as T from 'three';

// World-space ribbons follow the actual bat shaft, including torso and arm motion.
export class BatTrail{
 root=new T.Group();samples:{base:T.Vector3;tip:T.Vector3;time:number}[]=[];
 geometry=new T.BufferGeometry();lastPhase=0;lastTime=-1;
 positions=new Float32Array(24*6*3);colors=new Float32Array(24*6*4);
 constructor(){
  this.geometry.setAttribute('position',new T.BufferAttribute(this.positions,3).setUsage(T.DynamicDrawUsage));
  this.geometry.setAttribute('color',new T.BufferAttribute(this.colors,4).setUsage(T.DynamicDrawUsage));
  const m=new T.MeshBasicMaterial({color:0xffffff,vertexColors:true,transparent:true,depthWrite:false,side:T.DoubleSide,toneMapped:false});
  const ribbon=new T.Mesh(this.geometry,m);ribbon.frustumCulled=false;this.root.add(ribbon);this.root.visible=false;
 }
 update(bat:T.Object3D,time:number,phase:number|undefined,enabled:boolean){
  if(!enabled){this.samples=[];this.root.visible=false;return;}
  if(phase!==undefined&&phase<this.lastPhase)this.samples=[];
  if(phase!==undefined)this.lastPhase=phase;
  if(phase!==undefined&&phase>=.18&&phase<=.79&&time!==this.lastTime){
   bat.updateWorldMatrix(true,false);
   this.samples.push({base:bat.localToWorld(new T.Vector3(0,-.28,0)),tip:bat.localToWorld(new T.Vector3(0,-.67,0)),time});
  }
  this.lastTime=time;this.samples=this.samples.filter(s=>time-s.time<.18).slice(-13);
  let vertex=0;
  for(let i=1;i<this.samples.length;i++){
   const a=this.samples[i-1],b=this.samples[i];
   // Broad white sweep and a narrow, brighter outer streak.
   for(const [inner,outer,strength]of [[-.12,.88,.95],[.97,1.08,1]]){
    const ai=a.base.clone().lerp(a.tip,inner),ao=a.base.clone().lerp(a.tip,outer),bi=b.base.clone().lerp(b.tip,inner),bo=b.base.clone().lerp(b.tip,outer);
    for(const [point,sample,edge]of [[ai,a,0],[ao,a,1],[bi,b,0],[bi,b,0],[ao,a,1],[bo,b,1]] as [T.Vector3,typeof a,number][]){
     point.toArray(this.positions,vertex*3);const fade=Math.max(0,1-(time-sample.time)/.18),alpha=strength*fade*fade*(edge?1:.5);
     this.colors.set([1,1,1,alpha],vertex*4);vertex++;
    }
   }
  }
  this.geometry.setDrawRange(0,vertex);this.geometry.getAttribute('position').needsUpdate=true;this.geometry.getAttribute('color').needsUpdate=true;this.root.visible=vertex>0;
 }
}
