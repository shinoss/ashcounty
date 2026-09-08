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
}
export function itemArt(name:string){return itemImages[name]?`<img class="item-sprite" src="${itemImages[name]}" alt="" draggable="false">`:'';}
export function drawFit(c:CanvasRenderingContext2D,s:HTMLCanvasElement,x:number,y:number,w:number,h:number){const k=Math.min(w/s.width,h/s.height);c.drawImage(s,x-s.width*k/2,y-s.height*k,s.width*k,s.height*k);}
