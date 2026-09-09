import * as T from 'three';

/** Render obstructing buildings as a single soft silhouette, never translucent inner faces. */
export class BuildingShadow{
 target=new T.WebGLRenderTarget(1,1,{minFilter:T.LinearFilter,magFilter:T.LinearFilter,depthBuffer:true});
 maskMaterial=new T.MeshBasicMaterial({color:0xffffff,side:T.DoubleSide});
 scene=new T.Scene();camera=new T.Camera();size=new T.Vector2();
 material=new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,uniforms:{mask:{value:this.target.texture}},vertexShader:'varying vec2 uvScreen; void main(){uvScreen=uv;gl_Position=vec4(position.xy,0.0,1.0);}',fragmentShader:'uniform sampler2D mask; varying vec2 uvScreen; void main(){float silhouette=texture2D(mask,uvScreen).r;gl_FragColor=vec4(0.035,0.055,0.04,silhouette*0.24);}'});
 constructor(){this.scene.add(new T.Mesh(new T.PlaneGeometry(2,2),this.material));}
 render(renderer:T.WebGLRenderer,world:T.Scene,camera:T.Camera,buildings:Set<T.Object3D>){
  if(!buildings.size)return;
  renderer.getDrawingBufferSize(this.size);const w=Math.max(1,Math.round(this.size.x/2)),h=Math.max(1,Math.round(this.size.y/2));if(this.target.width!==w||this.target.height!==h)this.target.setSize(w,h);
  const previousTarget=renderer.getRenderTarget(),autoClear=renderer.autoClear,override=world.overrideMaterial,background=world.background,cameraMask=camera.layers.mask;
  const layers:{object:T.Object3D;mask:number}[]=[],visibility:{object:T.Object3D;visible:boolean}[]=[];
  try{
   for(const building of buildings){visibility.push({object:building,visible:building.visible});building.visible=true;building.traverse(object=>{layers.push({object,mask:object.layers.mask});object.layers.enable(31);});}
   camera.layers.set(31);world.overrideMaterial=this.maskMaterial;world.background=new T.Color(0x000000);renderer.autoClear=true;renderer.setRenderTarget(this.target);renderer.render(world,camera);
  }finally{
   for(const saved of layers)saved.object.layers.mask=saved.mask;for(const saved of visibility)saved.object.visible=saved.visible;
   camera.layers.mask=cameraMask;world.overrideMaterial=override;world.background=background;renderer.setRenderTarget(previousTarget);renderer.autoClear=autoClear;
  }
  // A single composite avoids overlapping wall/roof transparency revealing room geometry.
  renderer.autoClear=false;try{renderer.render(this.scene,this.camera);}finally{renderer.autoClear=autoClear;}
 }
}
