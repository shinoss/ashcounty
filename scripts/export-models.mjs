// Original editable model sources live in src/models3d.ts.
// Run against Vite: node scripts/export-models.mjs
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage();await page.goto(process.env.GAME_URL||'http://127.0.0.1:5174/legacy.html');
 const files=await page.evaluate(async()=>{
  const {GLTFExporter}=await import('/node_modules/three/examples/jsm/exporters/GLTFExporter.js');
  const {ActorModel,CarModel}=await import('/src/models3d.ts');const exporter=new GLTFExporter();
  const entries=[['survivor',new ActorModel()],...Array.from({length:3},(_,i)=>['zombie-'+i,new ActorModel(true,i)]),...Object.entries({green:'#718576',red:'#926859',blue:'#657e89'}).map(([color,hex])=>['car-'+color,new CarModel(hex)])];
  const files=[];for(const [name,model] of entries){model.root.name=name;const glb=await exporter.parseAsync(model.root,{binary:true,onlyVisible:false});files.push([name,Array.from(new Uint8Array(glb))]);}return files;
 });
 await mkdir('public/assets/models',{recursive:true});for(const [name,bytes] of files)await writeFile(`public/assets/models/${name}.glb`,Buffer.from(bytes));console.log(`Exported ${files.length} original GLB models.`);
}finally{await browser.close();}
