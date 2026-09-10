import {CLOTHING,clothingKind} from './wardrobe';
import {EXPEDITION_ART} from './expedition-content';
/** Generated cool-utility sheets. White-key extraction is done once at boot;
 * original sheets remain untouched for future asset work. */
export const ASSET_ROOT='/assets/cool-utility/';
export const sheets:Record<string,HTMLCanvasElement[]>={};
export const itemImages:Record<string,string>={};
export function canvas(w:number,h:number){const a=document.createElement('canvas');a.width=Math.ceil(w);a.height=Math.ceil(h);return a;}
export function cut(image:CanvasImageSource,x:number,y:number,w:number,h:number,key=false,softMatte=false){
 const a=canvas(w,h),c=a.getContext('2d',{willReadFrequently:true})!;c.drawImage(image,x,y,w,h,0,0,a.width,a.height);
 if(key){const pixels=c.getImageData(0,0,a.width,a.height),d=pixels.data;
 // Generated files have an opaque white matte. Remove only neutral near-white
 // pixels; retain gray/cream surfaces on appliances, bandages and clothing.
 for(let i=0;i<d.length;i+=4){const lo=Math.min(d[i],d[i+1],d[i+2]),hi=Math.max(d[i],d[i+1],d[i+2]),spread=hi-lo;
  // The foliage sheet was generated over white. Remove that white spill from
  // anti-aliased edge pixels, including slightly green pixels around leaves.
  if(softMatte&&lo>170&&spread<62){const alpha=Math.max(0,Math.min(1,(255-lo)/72));if(alpha<.12){d[i+3]=0;}else{for(let j=0;j<3;j++)d[i+j]=Math.max(0,Math.min(255,Math.round((d[i+j]-255*(1-alpha))/alpha)));d[i+3]=Math.round(d[i+3]*alpha);}}
  else if(lo>225&&spread<25)d[i+3]=0;else if(lo>195&&spread<25){const alpha=(225-lo)/30;d[i+3]=Math.round(d[i+3]*alpha);for(let j=0;j<3;j++)d[i+j]=Math.max(0,Math.round((d[i+j]-255*(1-alpha))/alpha));}}
 c.putImageData(pixels,0,0);
 }return a;
}
export function bounds(a:HTMLCanvasElement){const d=a.getContext('2d')!.getImageData(0,0,a.width,a.height).data;let l=a.width,t=a.height,r=0,b=0;for(let y=0;y<a.height;y++)for(let x=0;x<a.width;x++)if(d[(y*a.width+x)*4+3]>80){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}return {x:l,y:t,w:Math.max(1,r-l+1),h:Math.max(1,b-t+1)};}
// Ignore isolated matte specks when computing animation anchors. Otherwise a
// single stray pixel below a boot makes an entire frame appear to float.
function cleanFrame(a:HTMLCanvasElement){
 const c=a.getContext('2d')!,im=c.getImageData(0,0,a.width,a.height),d=im.data,w=a.width,h=a.height,seen=new Uint8Array(w*h),groups:number[][]=[];
 for(let n=0;n<w*h;n++){if(seen[n]||d[n*4+3]<64)continue;const group=[n];seen[n]=1;for(let j=0;j<group.length;j++){const p=group[j],x=p%w,y=Math.floor(p/w);for(let yy=Math.max(0,y-1);yy<=Math.min(h-1,y+1);yy++)for(let xx=Math.max(0,x-1);xx<=Math.min(w-1,x+1);xx++){const q=yy*w+xx;if(!seen[q]&&d[q*4+3]>=64){seen[q]=1;group.push(q);}}}groups.push(group);}
 const largest=Math.max(1,...groups.map(g=>g.length)),keep=new Uint8Array(w*h);for(const g of groups)if(g.length===largest)for(const p of g)keep[p]=1;
 for(let p=0;p<w*h;p++)if(!keep[p])d[p*4+3]=0;c.putImageData(im,0,0);return a;
}
export function trimmed(a:HTMLCanvasElement){const b=bounds(a);return cut(a,b.x,b.y,b.w,b.h);}
/** Remove the connected olive studio matte from UI atlas cells, preserving enclosed
 * dark object details. The resulting PNG uses alpha, so row highlights show through. */
function transparentIcon(a:HTMLCanvasElement){
 const c=a.getContext('2d',{willReadFrequently:true})!,im=c.getImageData(0,0,a.width,a.height),d=im.data,w=a.width,h=a.height;
 const samples:number[][]=[];
 for(const [x,y] of [[2,2],[w-3,2],[2,h-3],[w-3,h-3]]){const i=(y*w+x)*4;samples.push([d[i],d[i+1],d[i+2]]);}
 const bg=[0,1,2].map(k=>samples.map(s=>s[k]).sort((a,b)=>a-b)[1]);
 const matte=(p:number)=>{const i=p*4,r=d[i],g=d[i+1],b=d[i+2];return d[i+3]<8||
  Math.abs((g-r)-(bg[1]-bg[0]))<=5&&Math.abs((g-b)-(bg[1]-bg[2]))<=5&&
  Math.max(r,g,b)<Math.max(...bg)+27&&Math.min(r,g,b)>Math.min(...bg)-24;};
 const removed=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;
 const visit=(p:number)=>{if(!removed[p]&&matte(p)){removed[p]=1;queue[tail++]=p;}};
 for(let x=0;x<w;x++){visit(x);visit((h-1)*w+x);}for(let y=1;y<h-1;y++){visit(y*w);visit(y*w+w-1);}
 while(head<tail){const p=queue[head++],x=p%w;if(x>0)visit(p-1);if(x<w-1)visit(p+1);if(p>=w)visit(p-w);if(p<w*(h-1))visit(p+w);}
 // Unmix the narrow antialiased fringe against a nearby intact foreground pixel.
 const original=new Uint8ClampedArray(d);
 for(let p=0;p<w*h;p++){
  const i=p*4;if(removed[p]){d[i+3]=0;continue;}
  const x=p%w,y=Math.floor(p/w);let edge=false;
  for(const q of [x>0?p-1:p,x<w-1?p+1:p,y>0?p-w:p,y<h-1?p+w:p])if(removed[q])edge=true;
  if(!edge)continue;
  let best=p,bestDist=0;
  for(let yy=Math.max(0,y-2);yy<=Math.min(h-1,y+2);yy++)for(let xx=Math.max(0,x-2);xx<=Math.min(w-1,x+2);xx++){
   const q=yy*w+xx;if(removed[q])continue;const dist=bg.reduce((n,v,k)=>n+(original[q*4+k]-v)**2,0);if(dist>bestDist){best=q;bestDist=dist;}
  }
  if(bestDist<100)continue;
  const alpha=Math.max(0,Math.min(1,bg.reduce((n,v,k)=>n+(original[i+k]-v)*(original[best*4+k]-v),0)/bestDist));
  if(alpha>.12&&alpha<.98){d[i+3]=Math.round(original[i+3]*alpha);for(let k=0;k<3;k++)d[i+k]=Math.max(0,Math.min(255,(original[i+k]-bg[k]*(1-alpha))/alpha));}
 }
 c.putImageData(im,0,0);return a;
}
export async function loadSprites(){
 await Promise.all(['props','materials','furniture','survivor','rifle','zombie','cars','items','fx'].map(async name=>{
 const img=new Image();img.src=ASSET_ROOT+name+'.png';await img.decode();const rows=name==='materials'||name==='furniture'?3:name==='cars'||name==='items'||name==='fx'?2:4;
 sheets[name]=Array.from({length:4*rows},(_,i)=>cut(img,Math.round(i%4*img.width/4),Math.round(Math.floor(i/4)*img.height/rows),Math.floor(img.width/4),Math.floor(img.height/rows),name!=='materials'&&name!=='fx',name==='props'||name==='zombie'));
 if(name==='cars'){const rects=[[35,195,330,265],[465,195,165,270],[705,195,325,270],[1050,245,375,180],[25,645,335,215],[465,645,165,205],[720,650,315,215],[1050,675,375,190]];sheets.cars=rects.map(([x,y,w,h])=>cut(img,x/1448*img.width,y/1086*img.height,w/1448*img.width,h/1086*img.height,true,true));}
 if(name==='fx')sheets.fx.forEach(a=>{const c=a.getContext('2d')!,im=c.getImageData(0,0,a.width,a.height),d=im.data;for(let i=0;i<d.length;i+=4){const alpha=Math.max(d[i],d[i+1],d[i+2])/255;d[i+3]=Math.round(alpha*255);if(alpha>0)for(let j=0;j<3;j++)d[i+j]=Math.round(d[i+j]/alpha);}c.putImageData(im,0,0);});
 // Inventory sheet has deliberately wider weapon cells than the small supplies.
 if(name==='items'){const rects=[[.01,.22,.28,.15],[.315,.24,.26,.11],[.635,.1,.10,.34],[.825,.21,.14,.21],[.05,.57,.2,.21],[.32,.6,.17,.20],[.54,.57,.22,.25],[.80,.53,.18,.3]];sheets.items=rects.map(([x,y,w,h])=>cut(img,x*img.width,y*img.height,w*img.width,h*img.height,true));}
 }));
 for(const name of ['props','furniture','items','cars'])sheets[name]=sheets[name].map(trimmed);
 for(const name of ['survivor','rifle','zombie']){
 const frames=sheets[name].map(cleanFrame),bb=frames.map(bounds),standing=bb.slice(0,8).map(b=>b.h).sort((a,b)=>a-b),scale=68/standing[4];
 // Use one shared anchor for the whole sheet. Centering each frame's bounds
 // independently makes the torso slide when the legs change position.
 sheets[name]=frames.map((a,i)=>{const b=bb[i],row=Math.floor(i/4),rowBoxes=bb.slice(row*4,row*4+4),centers=rowBoxes.map(v=>v.x+v.w/2).sort((x,y)=>x-y),bottoms=rowBoxes.map(v=>v.y+v.h).sort((x,y)=>x-y),anchorX=centers[2],anchorBottom=bottoms[2],out=canvas(96,112),c=out.getContext('2d')!;c.imageSmoothingEnabled=true;
  c.drawImage(a,b.x,b.y,b.w,b.h,48-(anchorX-b.x)*scale,100-(anchorBottom-b.y)*scale,b.w*scale,b.h*scale);return out;});
 }
 for(const [i,name]of ['rifle','bat','water','food','ammo','bandage','wood','bag'].entries()){const a=canvas(160,120),c=a.getContext('2d')!,s=sheets.items[i],scale=Math.min(150/s.width,108/s.height);c.drawImage(s,(160-s.width*scale)/2,(120-s.height*scale)/2,s.width*scale,s.height*scale);itemImages[name]=trimmed(a).toDataURL();}
 const atlas=new Image();atlas.src=ASSET_ROOT+'county-items.png';await atlas.decode();
 const kinds=['Apple','Cheese','Sandwich','Yogurt','Carrots','Milk','Beans','Water','Bandage','Plank','Ammo','Nails','Scrap','Cloth','Tape','Electronics','Charcoal','Hammer','Wrench','Manual','MedicalGuide','RepairKit','EnergyBar','Painkillers','Stew','Pistol','Shotgun','HuntingRifle','SMG','bag'];
 kinds.forEach((kind,i)=>{const tile=cut(atlas,i%6*atlas.width/6,Math.floor(i/6)*atlas.height/5,atlas.width/6,atlas.height/5);itemImages[kind]=transparentIcon(tile).toDataURL();});
 const structures=new Image();structures.src=ASSET_ROOT+'crafting-structures.png';await structures.decode();
 for(const [i,kind] of ['wall','bench','barrel','bed','fire','lure'].entries()){
  const tile=cut(structures,i%3*structures.width/3,Math.floor(i/3)*structures.height/2,structures.width/3,structures.height/2);
  itemImages['build:'+kind]=transparentIcon(tile).toDataURL();
 }
 const basePieces=new Image();basePieces.src=ASSET_ROOT+'base-pieces.png';await basePieces.decode();
 for(const [i,kind] of ['floor','door','roof'].entries())itemImages['build:'+kind]=transparentIcon(cut(basePieces,i*basePieces.width/3,0,basePieces.width/3,basePieces.height)).toDataURL();
 // Verified indices in the original 4-column furniture sheet.
 for(const [kind,index] of Object.entries({counter:0,cabinet:0,fridge:3,table:4,chair:5,sofa:6,bed:7,nightstand:10,plant:11}))itemImages['furniture:'+kind]=sheets.furniture[index].toDataURL();
 const movable=new Image();movable.src=ASSET_ROOT+'movable-furniture-icons.png';await movable.decode();
 for(const [i,kind] of ['tv','desk','bookshelf','shelf','locker','medicine','toolchest','pew','booth'].entries()){
  const tile=cut(movable,i%3*movable.width/3,Math.floor(i/3)*movable.height/3,movable.width/3,movable.height/3);
  itemImages['furniture:'+kind]=transparentIcon(tile).toDataURL();
 }
 const gear=new Image();gear.src=ASSET_ROOT+'gear-utilities.png';await gear.decode();
 for(const [i,kind] of ['helmet','kevlar','furniture:washer'].entries())itemImages[kind]=trimmed(transparentIcon(cut(gear,i*gear.width/3,0,gear.width/3,gear.height))).toDataURL();
 for(const [key,alias] of Object.entries(EXPEDITION_ART))itemImages[key]=itemImages[alias]||itemImages.Manual;itemImages.BatRepair=itemImages.Tape;itemImages['build:storage']=itemImages['furniture:toolchest'];
 for(const [generic,kind] of Object.entries({water:'Water',food:'Beans',bandage:'Bandage',wood:'Plank',ammo:'Ammo'}))itemImages[generic]=itemImages[kind];

}
export function itemArt(name:string){
 if(name==='Crowbar'||name==='Saw')return `<img class="item-sprite" src="${ASSET_ROOT}${name==='Crowbar'?'crowbar':'hand-saw'}.png" alt="" draggable="false">`;
 if(clothingKind(name)){const c=CLOTHING[name],shirt=c.slot==='top';return `<svg class="clothing-art" viewBox="0 0 64 64" aria-hidden="true"><path fill="${c.color}" stroke="#222e2c" stroke-width="2" d="${shirt?'M22 8 9 15 4 31 15 35 20 24 18 57 46 57 44 24 49 35 60 31 55 15 42 8 36 13 28 13Z':'M18 7 46 7 49 57 35 57 32 29 29 57 15 57Z'}"/>${name==='RedFlannel'?'<path stroke="#422f3288" stroke-width="4" d="M24 15v39m14-39v39M20 25h24M20 37h24M20 49h24"/>':''}<path fill="none" stroke="#ddd6ba88" d="${shirt?'M32 15v38M23 24h6v7h-6zM36 24h6v7h-6z':'M19 13h26M32 13v14M22 33l-2 20M42 33l2 20'}"/></svg>`;}
 if(name==='Axe')return '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="m13 56 29-43" stroke="#463b2b" stroke-width="9"/><path d="m13 56 29-43" stroke="#ad8b54" stroke-width="5"/><path d="m33 14 13-8 14 12-4 13-19-8Z" fill="#778887" stroke="#b8c1b5" stroke-width="2"/></svg>';
 return itemImages[name]?`<img class="item-sprite" src="${itemImages[name]}" alt="" draggable="false">`:'';}
export function drawFit(c:CanvasRenderingContext2D,s:HTMLCanvasElement,x:number,y:number,w:number,h:number){const k=Math.min(w/s.width,h/s.height);c.drawImage(s,x-s.width*k/2,y-s.height*k,s.width*k,s.height*k);}
